import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const { locale } = await params;
  const prefix = locale === 'tr' ? '/tr' : '';

  return (
    <div className="min-h-screen bg-[#080810]">
      <nav className="border-b border-white/5 bg-[#080810]/80 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <a
            href={`${prefix}/`}
            className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-xl font-bold text-transparent"
          >
            Lyra
          </a>
          <div className="flex items-center gap-6">
            <a href={`${prefix}/dashboard`} className="text-sm text-gray-400 hover:text-white transition-colors">
              Dashboard
            </a>
            <a href={`${prefix}/history`} className="text-sm text-gray-400 hover:text-white transition-colors">
              History
            </a>
            <a href={`${prefix}/profile`} className="text-sm text-gray-400 hover:text-white transition-colors">
              Profile
            </a>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}
