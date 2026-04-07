import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  return (
    <div className="min-h-screen bg-gray-950">
      <nav className="border-b border-gray-800 bg-gray-900 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <a href="/dashboard" className="text-xl font-bold text-white">
            AI Therapist
          </a>
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="text-sm text-gray-400 hover:text-white">
              Dashboard
            </a>
            <a href="/history" className="text-sm text-gray-400 hover:text-white">
              History
            </a>
            <a href="/profile" className="text-sm text-gray-400 hover:text-white">
              Profile
            </a>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}
