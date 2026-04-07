'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface TherapistModalProps {
  open:    boolean;
  onClose: () => void;
}

export function TherapistModal({ open, onClose }: TherapistModalProps) {
  const t      = useTranslations('therapist');
  const router = useRouter();

  // Lock scroll when open
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  function startSession() {
    // Room name: lyra-{timestamp} — unique per session
    const roomName = `lyra-${Date.now()}`;
    router.push(`/session/${roomName}`);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="therapist-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-[#0d0d1a] shadow-2xl">
        {/* Header glow */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />

        <div className="p-8">
          <h2
            id="therapist-modal-title"
            className="mb-1 text-xl font-semibold text-white"
          >
            {t('choose_title')}
          </h2>
          <p className="mb-8 text-sm text-gray-500">{t('choose_subtitle')}</p>

          {/* Lyra card */}
          <button
            onClick={startSession}
            className="group w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left transition-all hover:border-violet-500/40 hover:bg-violet-500/5"
          >
            {/* Avatar placeholder */}
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-600 text-2xl font-bold text-white shadow-lg shadow-violet-500/20">
              L
            </div>

            <div className="mb-1 flex items-center justify-between">
              <span className="font-semibold text-white">{t('lyra_name')}</span>
              <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400">
                Online
              </span>
            </div>

            <p className="mb-2 text-xs font-medium text-violet-400">
              {t('lyra_specialty')}
            </p>
            <p className="text-xs leading-relaxed text-gray-500">
              {t('lyra_description')}
            </p>

            <div className="mt-4 flex items-center gap-2 text-sm font-medium text-violet-400 opacity-0 transition-opacity group-hover:opacity-100">
              <span>{t('start_session')}</span>
              <span>→</span>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="border-t border-white/5 px-8 py-4">
          <button
            onClick={onClose}
            className="text-sm text-gray-600 transition-colors hover:text-gray-400"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
}
