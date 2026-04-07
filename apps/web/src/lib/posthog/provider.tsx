'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initPostHog, posthog } from './client';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog();
  }, []);

  return <>{children}</>;
}

/**
 * Inner component that tracks pageviews on route change.
 * Must be wrapped in a <Suspense> boundary because useSearchParams()
 * opts the component out of static rendering.
 */
export function PostHogPageView() {
  const pathname   = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname) {
      const url =
        searchParams.toString()
          ? `${pathname}?${searchParams.toString()}`
          : pathname;
      posthog.capture('$pageview', { $current_url: url });
    }
  }, [pathname, searchParams]);

  return null;
}
