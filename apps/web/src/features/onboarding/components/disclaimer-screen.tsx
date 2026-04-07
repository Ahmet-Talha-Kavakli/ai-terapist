'use client';

interface DisclaimerScreenProps {
  onAccept: () => void;
}

export function DisclaimerScreen({ onAccept }: DisclaimerScreenProps) {
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-amber-500/30 bg-amber-950/20 p-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="text-3xl">⚠️</span>
        <h2 className="text-xl font-semibold text-amber-300">Important Information</h2>
      </div>

      <div className="space-y-4 text-sm leading-relaxed text-amber-100/80">
        <p>
          This application provides <strong className="text-amber-200">AI-assisted wellness support</strong>.
          It is <strong className="text-amber-200">not</strong> a licensed therapist or mental health
          professional, does not provide medical diagnoses, and{' '}
          <strong className="text-amber-200">cannot replace clinical care</strong>.
        </p>
        <p>
          The AI companion you interact with is designed to offer emotional support, coping strategies,
          and a space for reflection — not clinical treatment.
        </p>
        <p>
          If you are experiencing a <strong className="text-red-300">mental health emergency</strong>,
          please contact emergency services (911) or a crisis line immediately:
        </p>
        <div className="rounded-lg border border-red-500/30 bg-red-950/30 p-4">
          <p className="font-medium text-red-300">Crisis Resources</p>
          <ul className="mt-2 space-y-1 text-red-200/80">
            <li>🇺🇸 988 Suicide &amp; Crisis Lifeline (US): call or text 988</li>
            <li>🇬🇧 Samaritans (UK): 116 123</li>
            <li>🌍 Crisis Text Line: text HOME to 741741</li>
          </ul>
        </div>
        <p className="text-amber-100/60 text-xs">
          By continuing, you acknowledge that this service is for wellness support purposes only and
          that you have read and understood this disclaimer.
        </p>
      </div>

      <button
        onClick={onAccept}
        className="mt-8 w-full rounded-xl bg-amber-500 px-6 py-4 font-semibold text-gray-950 transition hover:bg-amber-400 active:bg-amber-600"
      >
        I understand — continue to setup
      </button>
    </div>
  );
}
