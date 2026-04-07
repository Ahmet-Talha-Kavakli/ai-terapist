import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { redis } from '@/lib/redis/client';

const bodySchema = z.object({
  sessionId:   z.string().min(1),
  emotion:     z.string(),
  score:       z.number().min(0).max(1),
  capturedAt:  z.number().int().positive(),
});

/**
 * POST /api/vision/emotion
 *
 * Receives a batched emotion snapshot from useMediaPipe (every 2 s) and
 * appends it to a Redis list keyed by session ID.
 *
 * Key:   `emotion:{sessionId}`
 * TTL:   4 hours (covers any session length + buffer)
 * Value: JSON array of IEmotionSnapshot-like objects
 *
 * Post-session: Inngest job reads this list and upserts to DB (Phase 9).
 * The list is trimmed to the last 3600 entries (~2 h at 2-s interval).
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const key     = `emotion:${body.sessionId}`;
  const payload = JSON.stringify({
    emotion:    body.emotion,
    score:      body.score,
    capturedAt: body.capturedAt,
  });

  // RPUSH + LTRIM + EXPIRE in a pipeline — single round-trip
  await redis.pipeline()
    .rpush(key, payload)
    .ltrim(key, -3600, -1)     // keep last 3600 entries max (~2 h)
    .expire(key, 60 * 60 * 4)  // 4 h TTL
    .exec();

  return NextResponse.json({ ok: true });
}
