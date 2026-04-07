'use client';

import { Component, type ReactNode, Suspense } from 'react';
import { PlaceholderAvatar } from './placeholder-avatar';

// ── Error Boundary ────────────────────────────────────────────────────────────

interface EBState { hasError: boolean }

class AvatarErrorBoundary extends Component<
  { children: ReactNode },
  EBState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): EBState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      // GLB failed to load (file missing, network error, parse error)
      // Fall back to the placeholder — the rest of the session still works
      return <PlaceholderAvatar />;
    }
    return this.props.children;
  }
}

// ── AvatarScene ───────────────────────────────────────────────────────────────

interface AvatarSceneProps {
  /** The AvatarModel (or any R3F content) to render inside the safe wrapper. */
  children: ReactNode;
}

/**
 * Wraps avatar content in both:
 *   Suspense      — shows PlaceholderAvatar while GLB is downloading
 *   ErrorBoundary — shows PlaceholderAvatar if GLB load fails (e.g. file missing)
 *
 * This is the swap boundary: when you drop in the real GLB the error boundary
 * state never triggers and AvatarModel renders normally.
 */
export function AvatarScene({ children }: AvatarSceneProps) {
  return (
    <AvatarErrorBoundary>
      <Suspense fallback={<PlaceholderAvatar />}>
        {children}
      </Suspense>
    </AvatarErrorBoundary>
  );
}
