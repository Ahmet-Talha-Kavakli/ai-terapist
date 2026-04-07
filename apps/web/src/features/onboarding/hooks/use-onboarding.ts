import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { TConsentType } from '@ai-therapist/types';
import type { TIntakeFormData } from '../schema';

type TOnboardingStep = 'disclaimer' | 'consent' | 'intake' | 'complete';

export function useOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState<TOnboardingStep>('disclaimer');
  const [consents, setConsents] = useState<Record<TConsentType, boolean> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDisclaimerAccept = () => setStep('consent');

  const handleConsentComplete = (granted: Record<TConsentType, boolean>) => {
    setConsents(granted);
    setStep('intake');
  };

  const handleIntakeSubmit = async (data: TIntakeFormData) => {
    setError(null);

    const res = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intake: data, consents }),
    });

    if (!res.ok) {
      setError('Something went wrong. Please try again.');
      return;
    }

    setStep('complete');
    router.push('/dashboard');
  };

  return {
    step,
    error,
    handleDisclaimerAccept,
    handleConsentComplete,
    handleIntakeSubmit,
  };
}
