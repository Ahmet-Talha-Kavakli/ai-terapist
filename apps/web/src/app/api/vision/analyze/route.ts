import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const SYSTEM_PROMPT =
  "You are a brief clinical observer. Describe the person's visible emotional state in 1-2 sentences. " +
  'Focus only on what is directly observable (facial expression, posture, eye contact). ' +
  'Do not diagnose or speculate. If the image is unclear or no face is visible, respond with "No clear visual context available."';

interface OpenAIResponse {
  choices: Array<{ message: { content: string | null } }>;
}

/**
 * POST /api/vision/analyze
 *
 * Body: { imageDataUrl: string }  — base64 data URL from webcam canvas snapshot
 * Returns: { visionContext: string | null }
 *
 * Called every 30 s from useVisionCapture. The result is injected into the
 * next session:message payload as visionContext.
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let imageDataUrl: string;
  try {
    const body = await request.json() as { imageDataUrl?: unknown };
    if (typeof body.imageDataUrl !== 'string' || !body.imageDataUrl.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Invalid imageDataUrl' }, { status: 400 });
    }
    imageDataUrl = body.imageDataUrl;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const apiKey = process.env['OPENAI_API_KEY'];
  if (!apiKey) {
    return NextResponse.json({ visionContext: null });
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 80,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: imageDataUrl, detail: 'low' },
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      console.error('[vision/analyze] OpenAI HTTP', res.status);
      return NextResponse.json({ visionContext: null });
    }

    const data = await res.json() as OpenAIResponse;
    const visionContext = data.choices[0]?.message?.content?.trim()
      ?? 'No clear visual context available.';

    return NextResponse.json({ visionContext });
  } catch (err) {
    console.error('[vision/analyze] error', err);
    return NextResponse.json({ visionContext: null });
  }
}
