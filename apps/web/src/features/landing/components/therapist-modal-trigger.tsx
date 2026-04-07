'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { TherapistModal } from './therapist-modal';

export function TherapistModalTrigger() {
  const t = useTranslations('landing');
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group relative overflow-hidden rounded-2xl border border-violet-500/30 bg-violet-500/5 p-6 text-left transition-all hover:border-violet-500/50 hover:bg-violet-500/10"
      >
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
          style={{ background: 'radial-gradient(circle at 50% 0%, rgba(139,92,246,0.15) 0%, transparent 70%)' }}
        />
        <div className="relative">
          <div className="mb-4 text-2xl">✨</div>
          <h2 className="mb-1 text-lg font-semibold text-violet-300">
            {t('cta_choose')}
          </h2>
          <p className="text-sm text-gray-500">
            Start a new therapy session with Lyra.
          </p>
        </div>
      </button>

      <TherapistModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
