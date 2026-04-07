'use client';

import { useTranslations } from 'next-intl';
import { TherapistModal } from './therapist-modal';
import { useState } from 'react';

interface HeroSectionProps {
  isSignedIn: boolean;
}

export function HeroSection({ isSignedIn }: HeroSectionProps) {
  const t = useTranslations('landing');
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
        {/* Animated gradient orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/20 blur-[120px]" />
          <div className="absolute left-1/3 top-2/3 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-600/15 blur-[100px]" />
          <div className="absolute right-1/4 top-1/4 h-[300px] w-[300px] rounded-full bg-indigo-600/10 blur-[80px]" />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center gap-6">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-medium text-violet-300">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
            {t('hero_tag')}
          </div>

          {/* Main title */}
          <h1 className="bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-8xl font-bold tracking-tight text-transparent md:text-[10rem]">
            {t('hero_title')}
          </h1>

          {/* Subtitle */}
          <div className="flex items-center gap-3">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-gray-600" />
            <span className="text-lg font-light tracking-[0.3em] text-gray-400 uppercase">
              {t('hero_subtitle')}
            </span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-gray-600" />
          </div>

          {/* Description */}
          <p className="max-w-md text-base leading-relaxed text-gray-400">
            {t('hero_description')}
          </p>

          {/* CTA */}
          {isSignedIn && (
            <button
              onClick={() => setModalOpen(true)}
              className="group relative mt-4 overflow-hidden rounded-full bg-gradient-to-r from-violet-600 to-cyan-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 hover:scale-[1.02]"
            >
              <span className="relative z-10">{t('cta_choose')}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-cyan-500 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          )}
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-gray-600">
          <span className="text-xs tracking-widest uppercase">{t('scroll_hint')}</span>
          <div className="flex h-9 w-5 items-start justify-center rounded-full border border-gray-700 p-1">
            <div className="h-2 w-0.5 animate-bounce rounded-full bg-gray-500" />
          </div>
        </div>
      </section>

      <TherapistModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
