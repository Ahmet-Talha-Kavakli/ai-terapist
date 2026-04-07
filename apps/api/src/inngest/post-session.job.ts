import { inngest } from './inngest.client.js';
import { PrismaClient as PrismaClientCtor } from '../../generated/prisma/client.js';
import OpenAI from 'openai';

// Prisma 7 exports PrismaClient as a const — cast to newable for instantiation
const PrismaClient = PrismaClientCtor as unknown as new () => InstanceType<typeof PrismaClientCtor>;

/**
 * Post-session async job — triggered by the 'session/ended' event.
 *
 * Steps (each is individually retried on failure):
 *   1. generate-soap    → GPT-4o mini writes a SOAP note from conversation
 *   2. extract-memories → identify key therapeutic moments → save with embeddings
 *   3. update-profile   → update risk level + personality snapshot
 *
 * All heavy work is outside the request cycle so session UX is instant.
 */
export const postSessionJob = inngest.createFunction(
  {
    id: 'post-session-processing',
    triggers: [{ event: 'session/ended' }],
    retries: 3,
  },
  async ({ event, step }) => {
    const { sessionId, userId, conversationHistory } = event.data as {
      sessionId: string;
      userId:    string;
      conversationHistory: Array<{ role: string; content: string }>;
    };

    const prisma  = new PrismaClient();
    const openai  = new OpenAI({ apiKey: process.env['OPENAI_API_KEY'] });

    // ── Step 1: Generate SOAP note ─────────────────────────────────────────
    const soapNote = await step.run('generate-soap', async () => {
      if (!conversationHistory.length) return null;

      const transcript = conversationHistory
        .map((m) => `${m.role === 'user' ? 'Client' : 'Therapist'}: ${m.content}`)
        .join('\n');

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a clinical documentation assistant. Generate a concise SOAP note ' +
              '(Subjective, Objective, Assessment, Plan) from the therapy session transcript. ' +
              'Be clinical but compassionate. Max 400 words.',
          },
          { role: 'user', content: transcript },
        ],
        max_tokens: 500,
        temperature: 0.3,
      });

      return response.choices[0]?.message?.content ?? null;
    });

    // Save SOAP note to session record
    if (soapNote) {
      await step.run('save-soap', async () => {
        await prisma.session.update({
          where: { id: sessionId },
          data:  { soapNotes: { soap: soapNote } },
        });
      });
    }

    // ── Step 2: Extract + embed key memories ──────────────────────────────
    await step.run('extract-memories', async () => {
      if (!conversationHistory.length) return;

      const transcript = conversationHistory
        .map((m) => `${m.role}: ${m.content}`)
        .join('\n');

      // Ask the model to extract 2-4 key therapeutic moments
      const extractResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Extract 2-4 key therapeutic insights from this session. ' +
              'Each insight should be one sentence, clinically relevant, and capture ' +
              'beliefs, patterns, emotional breakthroughs, or progress. ' +
              'Return as a JSON array of strings.',
          },
          { role: 'user', content: transcript },
        ],
        max_tokens: 300,
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });

      let memories: string[] = [];
      try {
        const parsed = JSON.parse(
          extractResponse.choices[0]?.message?.content ?? '{}',
        ) as { insights?: string[]; memories?: string[] };
        memories = parsed.insights ?? parsed.memories ?? [];
      } catch {
        return;
      }

      // Embed and store each memory
      for (const content of memories.slice(0, 4)) {
        const embResponse = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: content.slice(0, 8000),
        });
        const embedding = embResponse.data[0]?.embedding ?? [];
        const vectorLiteral = `[${embedding.join(',')}]`;

        await prisma.$executeRaw`
          INSERT INTO session_memories (user_id, session_id, content, embedding, memory_type)
          VALUES (
            ${userId}::uuid,
            ${sessionId}::uuid,
            ${content},
            ${vectorLiteral}::vector,
            'pattern'
          )
        `;
      }
    });

    // ── Step 3: Update risk level from latest emotional data ──────────────
    await step.run('update-profile', async () => {
      // Count recent crisis signals from the last 7 days
      const recentCrises = await prisma.crisisLog.count({
        where: {
          userId,
          detectedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      });

      const riskLevel =
        recentCrises >= 3 ? 'high' :
        recentCrises >= 1 ? 'medium' :
        'low';

      await prisma.userProfile.updateMany({
        where: { userId },
        data:  { riskLevel },
      });
    });

    await prisma.$disconnect();

    return { sessionId, soapGenerated: !!soapNote };
  },
);
