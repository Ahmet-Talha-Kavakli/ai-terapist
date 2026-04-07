import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { OnboardingFlow } from './onboarding-flow';

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const { locale } = await params;
  const prefix = locale === 'tr' ? '/tr' : '';

  return (
    <div className="min-h-screen bg-[#080810] py-12">
      <div className="mx-auto max-w-2xl px-4">
        <div className="mb-8 text-center">
          <a
            href={`${prefix}/`}
            className="mb-6 inline-block bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-2xl font-bold text-transparent"
          >
            Lyra
          </a>
          <h1 className="text-3xl font-bold text-white">Welcome</h1>
          <p className="mt-2 text-gray-400">
            Let&apos;s take a few minutes to set up your personalized experience.
          </p>
        </div>
        <OnboardingFlow />
      </div>
    </div>
  );
}
