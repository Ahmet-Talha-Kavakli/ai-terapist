'use client';

import { useTranslations } from 'next-intl';

const ICONS = ['🕐', '🧠', '🔒'];
const SECTION_KEYS = [
  { title: 'section1_title', body: 'section1_body' },
  { title: 'section2_title', body: 'section2_body' },
  { title: 'section3_title', body: 'section3_body' },
] as const;

export function FeaturesSection() {
  const t = useTranslations('landing');

  return (
    <section id="features" className="relative px-6 py-32">
      {/* Subtle top border */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="mx-auto max-w-5xl">
        <div className="grid gap-8 md:grid-cols-3">
          {SECTION_KEYS.map((keys, i) => (
            <div
              key={keys.title}
              className="group relative rounded-2xl border border-white/5 bg-white/[0.02] p-8 transition-all hover:border-white/10 hover:bg-white/[0.04]"
            >
              {/* Glow on hover */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity group-hover:opacity-100"
                style={{ background: 'radial-gradient(circle at 50% 0%, rgba(139,92,246,0.08) 0%, transparent 70%)' }}
              />

              <div className="relative">
                <span className="mb-5 block text-3xl">{ICONS[i]}</span>
                <h3 className="mb-3 text-lg font-semibold text-white">
                  {t(keys.title)}
                </h3>
                <p className="text-sm leading-relaxed text-gray-500">
                  {t(keys.body)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
