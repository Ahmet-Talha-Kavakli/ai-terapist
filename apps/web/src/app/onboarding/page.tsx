import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { OnboardingFlow } from './onboarding-flow';

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  return (
    <div className="min-h-screen bg-gray-950 py-12">
      <div className="mx-auto max-w-2xl px-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white">Welcome</h1>
          <p className="mt-2 text-gray-400">
            Let&apos;s take a few minutes to set up your personalized experience.
          </p>
        </div>
        <OnboardingFlow />
      </div>
    </div>
  );
}
