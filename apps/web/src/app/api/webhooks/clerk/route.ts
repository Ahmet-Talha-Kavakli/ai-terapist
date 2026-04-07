import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';

/**
 * POST /api/webhooks/clerk
 *
 * Receives Clerk webhook events (user.created, user.updated, user.deleted),
 * verifies the SVIX signature, then syncs the user to our DB via the NestJS API.
 *
 * Configure in Clerk Dashboard → Webhooks:
 *   URL:    https://your-domain.com/api/webhooks/clerk
 *   Events: user.created, user.updated
 */
export async function POST(request: NextRequest) {
  const secret = process.env['CLERK_WEBHOOK_SECRET'];
  if (!secret) {
    console.error('[clerk-webhook] CLERK_WEBHOOK_SECRET not set');
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  // Read raw body — must not be parsed before SVIX verification
  const payload = await request.text();

  const svixId        = request.headers.get('svix-id') ?? '';
  const svixTimestamp = request.headers.get('svix-timestamp') ?? '';
  const svixSignature = request.headers.get('svix-signature') ?? '';

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing SVIX headers' }, { status: 400 });
  }

  // Verify signature
  const wh = new Webhook(secret);
  let event: ClerkWebhookEvent;

  try {
    event = wh.verify(payload, {
      'svix-id':        svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkWebhookEvent;
  } catch (err) {
    console.error('[clerk-webhook] Signature verification failed', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Handle relevant events
  const { type, data } = event;

  if (type === 'user.created' || type === 'user.updated') {
    const clerkId = data.id;
    const email   = data.email_addresses?.[0]?.email_address;

    const apiUrl = process.env['API_URL'] ?? 'http://localhost:3001';

    try {
      await fetch(`${apiUrl}/user/ensure`, {
        method:  'POST',
        headers: {
          'Content-Type':    'application/json',
          'x-clerk-user-id': clerkId,
        },
        body: JSON.stringify({ email }),
      });
    } catch (err) {
      // Log but don't fail — Clerk will retry the webhook
      console.error('[clerk-webhook] Failed to sync user to DB', err);
      return NextResponse.json({ error: 'DB sync failed' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}

// ── Types ──────────────────────────────────────────────────────────────────

interface ClerkEmailAddress {
  email_address: string;
  id:            string;
}

interface ClerkUserData {
  id:               string;
  email_addresses:  ClerkEmailAddress[];
  first_name:       string | null;
  last_name:        string | null;
  created_at:       number;
  updated_at:       number;
}

interface ClerkWebhookEvent {
  type: 'user.created' | 'user.updated' | 'user.deleted' | string;
  data: ClerkUserData;
  object: 'event';
}
