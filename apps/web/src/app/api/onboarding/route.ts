import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { intakeSchema } from '@/features/onboarding/schema';

const CONSENT_VERSION = '1.0';

const onboardingBodySchema = z.object({
  intake: intakeSchema,
  consents: z.object({
    camera: z.boolean(),
    audio: z.boolean(),
    psychological_data: z.boolean(),
    wearable: z.boolean(),
  }),
});

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = onboardingBodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid data', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { intake, consents } = parsed.data;

  // Forward to NestJS API service
  const apiUrl = process.env['API_URL'] ?? 'http://localhost:3001';
  const res = await fetch(`${apiUrl}/user/onboarding`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-clerk-user-id': userId,
    },
    body: JSON.stringify({
      intake,
      consents: Object.entries(consents).map(([type, granted]) => ({
        consentType: type,
        granted,
        version: CONSENT_VERSION,
      })),
      disclaimerAcceptedAt: new Date().toISOString(),
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to save onboarding data' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
