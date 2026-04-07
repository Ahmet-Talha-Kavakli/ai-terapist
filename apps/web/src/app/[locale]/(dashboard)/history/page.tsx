import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function HistoryPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="mb-6 text-3xl font-bold text-white">Session History</h1>
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-12 text-center">
        <p className="text-gray-500">Your past sessions will appear here.</p>
      </div>
    </main>
  );
}
