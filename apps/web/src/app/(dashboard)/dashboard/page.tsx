import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  return (
    <main className="container mx-auto p-8">
      <h1 className="mb-6 text-3xl font-bold text-white">Your Dashboard</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <a
          href="/session/new"
          className="rounded-xl border border-blue-500/30 bg-blue-950/50 p-6 transition hover:border-blue-500/60"
        >
          <h2 className="mb-2 text-xl font-semibold text-blue-400">Start Session</h2>
          <p className="text-gray-400">Begin a new therapy session with your AI therapist</p>
        </a>
        <a
          href="/history"
          className="rounded-xl border border-gray-700 bg-gray-900 p-6 transition hover:border-gray-600"
        >
          <h2 className="mb-2 text-xl font-semibold text-white">Session History</h2>
          <p className="text-gray-400">Review your past sessions and progress</p>
        </a>
        <a
          href="/profile"
          className="rounded-xl border border-gray-700 bg-gray-900 p-6 transition hover:border-gray-600"
        >
          <h2 className="mb-2 text-xl font-semibold text-white">Your Profile</h2>
          <p className="text-gray-400">Manage your therapy preferences and goals</p>
        </a>
      </div>
    </main>
  );
}
