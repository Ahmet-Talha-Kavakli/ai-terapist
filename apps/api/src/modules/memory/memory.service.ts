import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import type { IMemoryChunk, TMemoryType } from '@ai-therapist/types';

export interface SaveMemoryInput {
  userId:     string;
  sessionId:  string | null;
  content:    string;
  memoryType: TMemoryType;
}

export interface SemanticSearchInput {
  userId: string;
  query:  string;
  limit?: number;
}

@Injectable()
export class MemoryService {
  private readonly logger = new Logger(MemoryService.name);
  private readonly openai: OpenAI;

  constructor(
    private readonly prisma:  PrismaService,
    private readonly config:  ConfigService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.config.getOrThrow<string>('OPENAI_API_KEY'),
    });
  }

  // ── Embedding ─────────────────────────────────────────────────────────────

  /**
   * Generate a 1536-dim embedding for `text` using text-embedding-3-small.
   * Returns a float array — stored as pgvector vector(1536) in the DB.
   */
  async embed(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000), // model's token limit safety margin
    });
    return response.data[0]?.embedding ?? [];
  }

  // ── Write ─────────────────────────────────────────────────────────────────

  /**
   * Embed `content` and upsert a SessionMemory row.
   * The embedding is stored as a raw SQL vector literal since Prisma 7's
   * Unsupported("vector") type doesn't support direct writes.
   */
  async saveMemory(input: SaveMemoryInput): Promise<string> {
    const embedding = await this.embed(input.content);
    const vectorLiteral = `[${embedding.join(',')}]`;

    // Use $executeRaw to write the vector column — Prisma can't handle
    // Unsupported types in regular mutations.
    const result = await this.prisma.$queryRaw<{ id: string }[]>`
      INSERT INTO session_memories (user_id, session_id, content, embedding, memory_type)
      VALUES (
        ${input.userId}::uuid,
        ${input.sessionId}::uuid,
        ${input.content},
        ${vectorLiteral}::vector,
        ${input.memoryType}
      )
      RETURNING id
    `;

    return result[0]?.id ?? '';
  }

  // ── Read ──────────────────────────────────────────────────────────────────

  /**
   * pgvector cosine similarity search.
   * Returns the top-k most semantically relevant memories for `query`.
   */
  async semanticSearch(input: SemanticSearchInput): Promise<IMemoryChunk[]> {
    const { userId, query, limit = 5 } = input;
    const embedding = await this.embed(query);
    const vectorLiteral = `[${embedding.join(',')}]`;

    const rows = await this.prisma.$queryRaw<{
      id: string;
      user_id: string;
      session_id: string | null;
      content: string;
      memory_type: string;
      created_at: Date;
      similarity: number;
    }[]>`
      SELECT
        id,
        user_id,
        session_id,
        content,
        memory_type,
        created_at,
        1 - (embedding <=> ${vectorLiteral}::vector) AS similarity
      FROM session_memories
      WHERE user_id = ${userId}::uuid
        AND embedding IS NOT NULL
      ORDER BY embedding <=> ${vectorLiteral}::vector
      LIMIT ${limit}
    `;

    return rows.map((r) => ({
      id:         r.id,
      userId:     r.user_id,
      sessionId:  r.session_id,
      content:    r.content,
      memoryType: r.memory_type as TMemoryType,
      createdAt:  r.created_at,
    }));
  }

  /**
   * Fetch the N most recent memories for a user (fallback for when no
   * query text is available — used by the session context injector).
   */
  async getRecent(userId: string, limit = 5): Promise<IMemoryChunk[]> {
    const rows = await this.prisma.sessionMemory.findMany({
      where:   { userId },
      orderBy: { createdAt: 'desc' },
      take:    limit,
      select:  { id: true, userId: true, sessionId: true, content: true, memoryType: true, createdAt: true },
    });

    return rows.map((r) => ({
      id:         r.id,
      userId:     r.userId,
      sessionId:  r.sessionId,
      content:    r.content,
      memoryType: r.memoryType as TMemoryType,
      createdAt:  r.createdAt,
    }));
  }
}
