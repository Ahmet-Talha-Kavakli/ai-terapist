import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { TherapistModalTrigger } from '@/features/landing/components/therapist-modal-trigger';

/**
 * Onboarding check: if user hasn't completed onboarding, redirect them there.
 * We detect this by calling the NestJS API — if no profile exists, onboarding
 * hasn't been done yet.
 */
async function checkOnboarding(userId: string, locale: string): Promise<boolean> {
  const prefix = locale === 'tr' ? '/tr' : '';
  try {
    const apiUrl = process.env['API_URL'] ?? 'http://localhost:3001';
    const res = await fetch(`${apiUrl}/user/profile`, {
      headers: { 'x-clerk-user-id': userId },
      cache: 'no-store',
    });
    return res.ok;
  } catch {
    return true; // Fail open — don't block dashboard on API error
  }
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const { locale } = await params;
  const prefix = locale === 'tr' ? '/tr' : '';

  const hasProfile = await checkOnboarding(userId, locale);
  if (!hasProfile) {
    redirect(`${prefix}/onboarding`);
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white">Welcome back</h1>
        <p className="mt-1 text-gray-500">What would you like to do today?</p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* Start session card */}
        <TherapistModalTrigger />

        {/* History */}
        <a
          href={`${prefix}/history`}
          className="group rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-all hover:border-white/10 hover:bg-white/[0.04]"
        >
          <div className="mb-4 text-2xl">📋</div>
          <h2 className="mb-1 text-lg font-semibold text-white">Session History</h2>
          <p className="text-sm text-gray-500">Review your past sessions and progress notes.</p>
        </a>

        {/* Profile */}
        <a
          href={`${prefix}/profile`}
          className="group rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-all hover:border-white/10 hover:bg-white/[0.04]"
        >
          <div className="mb-4 text-2xl">⚙️</div>
          <h2 className="mb-1 text-lg font-semibold text-white">Your Profile</h2>
          <p className="text-sm text-gray-500">Manage your therapy preferences and goals.</p>
        </a>
      </div>
    </main>
  );
}
