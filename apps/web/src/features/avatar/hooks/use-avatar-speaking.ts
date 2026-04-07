'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSessionStore } from '../../session/session.store';
import type { MorphControls } from './use-morph-targets';

// ── Constants ─────────────────────────────────────────────────────────────────
/** Oscillation frequency of the jaw while speaking (cycles/second).
 *  ~6–8 Hz matches natural conversational jaw movement rate. */
const SPEAK_FREQ      = 7;

/** Peak mouth-open value while speaking (0–1).
 *  0.35 is natural — not a wide-open shout, just relaxed speech. */
const SPEAK_AMPLITUDE = 0.35;

/** How fast amplitude fades in/out when speaking starts/stops.
 *  Higher = snappier transition. 8 gives ~125 ms fade time. */
const LERP_SPEED      = 8;

/** Below this amplitude threshold we clamp to 0 to avoid micro-jitter. */
const DEAD_ZONE       = 0.005;

/**
 * Animates the avatar's jaw (Mouth_Open) while the AI is speaking.
 *
 * Uses a sine wave oscillation gated by `isAvatarSpeaking` from the session
 * store. Amplitude lerps smoothly in/out so there are no abrupt mouth snaps.
 *
 * Reads store state via `useSessionStore.getState()` (transient, no re-render)
 * — safe to call every frame without causing React re-renders.
 */
export function useAvatarSpeaking(morphs: MorphControls) {
  const { setMorph } = morphs;

  const speakTimeRef  = useRef(0);   // drives the sine oscillation
  const ampRef        = useRef(0);   // current (lerped) amplitude

  useFrame((_state, delta) => {
    const isSpeaking    = useSessionStore.getState().isAvatarSpeaking;
    const targetAmp     = isSpeaking ? SPEAK_AMPLITUDE : 0;

    // Smoothly lerp amplitude toward target
    ampRef.current += (targetAmp - ampRef.current) * Math.min(1, LERP_SPEED * delta);

    if (ampRef.current > DEAD_ZONE) {
      speakTimeRef.current += delta;
      // |sin| keeps jaw always moving downward then returning — no negative values
      const jaw = Math.abs(Math.sin(speakTimeRef.current * SPEAK_FREQ)) * ampRef.current;
      setMorph('mouthOpen', jaw);
    } else {
      // Fully closed — reset oscillator phase so next speech starts cleanly
      speakTimeRef.current = 0;
      setMorph('mouthOpen', 0);
    }
  });
}
