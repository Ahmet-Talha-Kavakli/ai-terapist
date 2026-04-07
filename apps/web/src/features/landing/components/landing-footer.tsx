'use client';

import { useTranslations } from 'next-intl';

export function LandingFooter() {
  const t = useTranslations('landing');

  return (
    <footer className="relative border-t border-white/5 px-6 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
        <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-lg font-bold text-transparent">
          Lyra
        </span>
        <p className="text-xs text-gray-600">
          © {new Date().getFullYear()} Lyra. {t('footer_rights')}
        </p>
      </div>
    </footer>
  );
}
