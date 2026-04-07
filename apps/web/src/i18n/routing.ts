import { defineRouting } from 'next-intl/routing';

export const locales = ['en', 'tr'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const routing = defineRouting({
  locales,
  defaultLocale,
  // Default locale (EN) has no prefix: /dashboard
  // Other locales get a prefix: /tr/dashboard
  localePrefix: 'as-needed',
});
