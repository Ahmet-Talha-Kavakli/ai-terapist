import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import type { ICrisisSignal } from '@ai-therapist/types';

interface CrisisBody {
  signal:    ICrisisSignal;
  sessionId: string | null;
}

/**
 * POST /api/crisis
 *
 * Logs a crisis event to the NestJS API which persists it to the
 * crisis_logs table (never deleted — duty of care legal basis).
 *
 * Called by the use-crisis-detector hook on the client.
 * Non-blocking: the client fire-and-forgets this request.
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: CrisisBody;
  try {
    body = (await request.json()) as CrisisBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { signal, sessionId } = body;

  if (!signal?.type || typeof signal.confidence !== 'number') {
    return NextResponse.json({ error: 'Invalid crisis signal' }, { status: 422 });
  }

  // API_URL is server-only — not exposed to the browser
  const apiUrl = process.env['API_URL'] ?? 'http://localhost:3001';

  try {
    const response = await fetch(`${apiUrl}/crisis`, {
      method:  'POST',
      headers: {
        'Content-Type':    'application/json',
        'x-clerk-user-id': userId,
      },
      body: JSON.stringify({
        threatType:  signal.type,
        confidence:  signal.confidence,
        sessionId:   sessionId ?? null,
        description: signal.description,
        severity:    signal.severity,
      }),
    });

    if (!response.ok) {
      // Log but don't surface internal errors to the client
      console.error('[crisis] API error', response.status);
    }
  } catch (err) {
    // Network failure — log locally but return 200 to client.
    // The client must never be blocked by a crisis logging failure.
    console.error('[crisis] Failed to reach API', err);
  }

  // Always return 200 — crisis logging must never throw a client-visible error
  return NextResponse.json({ ok: true });
}
