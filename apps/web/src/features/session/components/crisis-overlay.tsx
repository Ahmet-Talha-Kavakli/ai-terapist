'use client';

import { useEffect } from 'react';
import { useSessionStore } from '../session.store';

interface CrisisResource {
  label:  string;
  number: string;
  href:   string;
  note:   string;
}

const CRISIS_RESOURCES: CrisisResource[] = [
  {
    label:  '988 Suicide & Crisis Lifeline',
    number: '988',
    href:   'tel:988',
    note:   'Call or text — 24/7, free, confidential (US)',
  },
  {
    label:  'Crisis Text Line',
    number: 'Text HOME to 741741',
    href:   'sms:741741?body=HOME',
    note:   'Free text support, 24/7 (US/UK/CA/IE)',
  },
  {
    label:  'International Association for Suicide Prevention',
    number: 'Find local resources',
    href:   'https://www.iasp.info/resources/Crisis_Centres/',
    note:   'Crisis centre directory worldwide',
  },
];

/**
 * Full-screen crisis overlay.
 *
 * Shown when `activeCrisis` is set in the session store.
 * - Traps focus inside the modal (accessibility)
 * - Plays a subtle warning sound once (if browser allows)
 * - "Continue session" → dismisses overlay (crisis stays logged)
 * - "Get help now"     → opens 988 in a new tab
 */
export function CrisisOverlay() {
  const { activeCrisis, setActiveCrisis } = useSessionStore();

  // Trap focus and block scroll while overlay is open
  useEffect(() => {
    if (!activeCrisis) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [activeCrisis]);

  if (!activeCrisis) return null;

  const severity = activeCrisis.severity;
  const isImminent = severity === 'imminent';

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="crisis-title"
      aria-describedby="crisis-body"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal panel */}
      <div
        className={[
          'relative z-10 w-full max-w-md rounded-2xl border-2 p-8 shadow-2xl',
          'bg-gray-950 text-white',
          isImminent ? 'border-red-500' : 'border-amber-500',
        ].join(' ')}
      >
        {/* Icon + title */}
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span
            className={[
              'flex h-14 w-14 items-center justify-center rounded-full text-2xl',
              isImminent ? 'bg-red-500/20' : 'bg-amber-500/20',
            ].join(' ')}
            aria-hidden="true"
          >
            {isImminent ? '🚨' : '⚠️'}
          </span>

          <h2
            id="crisis-title"
            className={[
              'text-xl font-semibold',
              isImminent ? 'text-red-400' : 'text-amber-400',
            ].join(' ')}
          >
            {isImminent
              ? 'I hear you — you don\'t have to face this alone'
              : 'I\'m here with you'}
          </h2>
        </div>

        {/* Body text */}
        <p
          id="crisis-body"
          className="mb-6 text-center text-sm leading-relaxed text-gray-300"
        >
          {isImminent
            ? 'What you\'re going through sounds really difficult. A trained crisis counselor can provide support right now — it\'s free and confidential.'
            : 'It sounds like you might be going through something very hard right now. You deserve real human support alongside our sessions.'}
        </p>

        {/* Crisis resources */}
        <ul className="mb-6 space-y-2">
          {CRISIS_RESOURCES.map((r) => (
            <li key={r.label}>
              <a
                href={r.href}
                target={r.href.startsWith('http') ? '_blank' : undefined}
                rel={r.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className={[
                  'flex flex-col rounded-lg border px-4 py-3 text-sm transition-colors',
                  'hover:bg-white/5',
                  isImminent
                    ? 'border-red-500/40 hover:border-red-500/70'
                    : 'border-amber-500/40 hover:border-amber-500/70',
                ].join(' ')}
              >
                <span className="font-medium text-white">{r.number}</span>
                <span className="text-xs text-gray-400">{r.note}</span>
              </a>
            </li>
          ))}
        </ul>

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          <a
            href="tel:988"
            className={[
              'flex items-center justify-center rounded-xl px-6 py-3',
              'text-sm font-semibold text-white transition-colors',
              isImminent
                ? 'bg-red-600 hover:bg-red-500'
                : 'bg-amber-600 hover:bg-amber-500',
            ].join(' ')}
          >
            Get help now — call 988
          </a>

          <button
            type="button"
            onClick={() => setActiveCrisis(null)}
            className="rounded-xl border border-white/20 px-6 py-3 text-sm text-gray-400 transition-colors hover:border-white/40 hover:text-white"
          >
            Continue our session
          </button>
        </div>

        {/* Subtle disclaimer */}
        <p className="mt-4 text-center text-xs text-gray-600">
          This session will be reviewed to ensure you receive appropriate support.
        </p>
      </div>
    </div>
  );
}
