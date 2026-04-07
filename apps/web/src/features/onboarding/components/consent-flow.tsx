'use client';

import { useState } from 'react';
import type { TConsentType } from '@ai-therapist/types';

interface ConsentItem {
  type: TConsentType;
  label: string;
  description: string;
  required: boolean;
  icon: string;
}

const CONSENT_ITEMS: ConsentItem[] = [
  {
    type: 'camera',
    label: 'Camera Access',
    description:
      'Used for real-time emotion and facial expression analysis during sessions. Video is processed locally on your device using MediaPipe — it is never stored or transmitted to our servers.',
    required: true,
    icon: '📷',
  },
  {
    type: 'audio',
    label: 'Microphone Access',
    description:
      'Used to transcribe your voice during therapy sessions so the AI can understand and respond to you in real-time.',
    required: true,
    icon: '🎙️',
  },
  {
    type: 'psychological_data',
    label: 'Psychological Profile Data',
    description:
      'Your responses and session insights are stored to provide personalized, continuous care across sessions. This allows the AI to remember your history and adapt to your needs over time.',
    required: true,
    icon: '🧠',
  },
  {
    type: 'wearable',
    label: 'Wearable Device Data (Optional)',
    description:
      'Smartwatch data (heart rate, HRV, sleep quality) can provide additional context during sessions. Completely optional — sessions work fully without it.',
    required: false,
    icon: '⌚',
  },
];

interface ConsentFlowProps {
  onComplete: (consents: Record<TConsentType, boolean>) => void;
}

export function ConsentFlow({ onComplete }: ConsentFlowProps) {
  const [consents, setConsents] = useState<Record<TConsentType, boolean>>({
    camera: false,
    audio: false,
    psychological_data: false,
    wearable: false,
  });

  const requiredGranted = consents.camera && consents.audio && consents.psychological_data;

  const handleToggle = (type: TConsentType) => {
    setConsents((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <div>
        <h2 className="text-2xl font-bold text-white">Data &amp; Privacy Consent</h2>
        <p className="mt-2 text-sm text-gray-400">
          We collect only what is necessary for your therapy experience. You can review or revoke
          any consent at any time in your Settings.
        </p>
      </div>

      <div className="space-y-3">
        {CONSENT_ITEMS.map((item) => (
          <label
            key={item.type}
            className={`flex cursor-pointer items-start gap-4 rounded-xl border p-5 transition ${
              consents[item.type]
                ? 'border-blue-500/50 bg-blue-950/30'
                : 'border-gray-700 bg-gray-900 hover:border-gray-600'
            }`}
          >
            <input
              type="checkbox"
              checked={consents[item.type]}
              onChange={() => handleToggle(item.type)}
              className="mt-1 h-4 w-4 cursor-pointer accent-blue-500"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span>{item.icon}</span>
                <p className="font-medium text-white">{item.label}</p>
                {item.required ? (
                  <span className="rounded-full bg-red-900/60 px-2 py-0.5 text-xs text-red-300">
                    Required
                  </span>
                ) : (
                  <span className="rounded-full bg-gray-700 px-2 py-0.5 text-xs text-gray-400">
                    Optional
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-400">{item.description}</p>
            </div>
          </label>
        ))}
      </div>

      {!requiredGranted && (
        <p className="text-center text-sm text-red-400">
          Camera, microphone, and psychological data consent are required to use the service.
        </p>
      )}

      <button
        onClick={() => onComplete(consents)}
        disabled={!requiredGranted}
        className="w-full rounded-xl bg-blue-600 px-6 py-4 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Continue to questionnaire →
      </button>
    </div>
  );
}
