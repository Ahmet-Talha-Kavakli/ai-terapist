'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { routing } from '@/i18n/routing';

const LOCALE_LABELS: Record<string, string> = {
  en: '🇬🇧 EN',
  tr: '🇹🇷 TR',
};

export function LanguageSwitcher() {
  const locale   = useLocale();
  const router   = useRouter();
  const pathname = usePathname();

  function switchLocale(next: string) {
    if (next === locale) return;

    // Strip current locale prefix if present, then add new one
    const defaultLocale = routing.defaultLocale;
    let pathWithoutLocale = pathname;

    for (const loc of routing.locales) {
      if (pathname.startsWith(`/${loc}/`)) {
        pathWithoutLocale = pathname.slice(loc.length + 1);
        break;
      } else if (pathname === `/${loc}`) {
        pathWithoutLocale = '/';
        break;
      }
    }

    const newPath =
      next === defaultLocale
        ? pathWithoutLocale
        : `/${next}${pathWithoutLocale}`;

    router.push(newPath);
  }

  return (
    <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
      {routing.locales.map((loc) => (
        <button
          key={loc}
          onClick={() => switchLocale(loc)}
          className={[
            'rounded-full px-3 py-1 text-xs font-medium transition-all',
            locale === loc
              ? 'bg-white/15 text-white'
              : 'text-gray-500 hover:text-gray-300',
          ].join(' ')}
        >
          {LOCALE_LABELS[loc] ?? loc.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
