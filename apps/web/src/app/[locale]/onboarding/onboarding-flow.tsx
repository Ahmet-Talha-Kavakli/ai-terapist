'use client';

import { DisclaimerScreen } from '@/features/onboarding/components/disclaimer-screen';
import { ConsentFlow } from '@/features/onboarding/components/consent-flow';
import { IntakeForm } from '@/features/onboarding/components/intake-form';
import { useOnboarding } from '@/features/onboarding/hooks/use-onboarding';

const STEP_LABELS = ['Disclaimer', 'Privacy', 'About You'];
const STEP_MAP = { disclaimer: 0, consent: 1, intake: 2, complete: 3 };

export function OnboardingFlow() {
  const { step, error, handleDisclaimerAccept, handleConsentComplete, handleIntakeSubmit } =
    useOnboarding();

  const currentStepIndex = STEP_MAP[step];

  return (
    <div>
      {/* Progress bar */}
      {step !== 'complete' && (
        <div className="mb-8">
          <div className="flex justify-between">
            {STEP_LABELS.map((label, i) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition ${
                    i < currentStepIndex
                      ? 'bg-blue-600 text-white'
                      : i === currentStepIndex
                        ? 'border-2 border-blue-500 text-blue-400'
                        : 'border-2 border-gray-700 text-gray-600'
                  }`}
                >
                  {i < currentStepIndex ? '✓' : i + 1}
                </div>
                <span
                  className={`text-xs ${i === currentStepIndex ? 'text-blue-400' : 'text-gray-600'}`}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
          <div className="relative mt-4 h-1 rounded-full bg-gray-800">
            <div
              className="h-1 rounded-full bg-blue-600 transition-all duration-500"
              style={{ width: `${(currentStepIndex / (STEP_LABELS.length - 1)) * 100}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-950/30 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {step === 'disclaimer' && <DisclaimerScreen onAccept={handleDisclaimerAccept} />}
      {step === 'consent' && <ConsentFlow onComplete={handleConsentComplete} />}
      {step === 'intake' && <IntakeForm onSubmit={handleIntakeSubmit} />}
      {step === 'complete' && (
        <div className="py-16 text-center">
          <div className="text-5xl">✨</div>
          <h2 className="mt-4 text-2xl font-bold text-white">All set!</h2>
          <p className="mt-2 text-gray-400">Redirecting you to your dashboard...</p>
        </div>
      )}
    </div>
  );
}
