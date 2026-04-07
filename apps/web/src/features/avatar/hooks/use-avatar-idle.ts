'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { MorphControls } from './use-morph-targets';

// ── Timing constants ──────────────────────────────────────────────────────────
const BLINK_DURATION_S   = 0.12;   // full blink cycle (close + open)
const BLINK_MIN_INTERVAL = 2.5;    // shortest gap between blinks (seconds)
const BLINK_MAX_INTERVAL = 5.5;    // longest gap
const HEAD_SWAY_Y_AMP    = 0.015;  // radians — subtle lateral sway
const HEAD_SWAY_X_AMP    = 0.008;  // radians — subtle fore/aft drift
const HEAD_SWAY_Y_FREQ   = 0.30;   // Hz
const HEAD_SWAY_X_FREQ   = 0.20;   // Hz (slightly different → organic feel)

function randomBlinkInterval(): number {
  return BLINK_MIN_INTERVAL + Math.random() * (BLINK_MAX_INTERVAL - BLINK_MIN_INTERVAL);
}

/**
 * Adds "alive" idle behaviour to the avatar:
 *  - Randomised eye blinks (triangle wave, ~3–6 s interval)
 *  - Very subtle sinusoidal head sway (looks attentive, not robotic)
 *
 * Only touches eyeBlinkL / eyeBlinkR morphs and group rotation.
 * Does NOT conflict with speaking or emotion hooks.
 */
export function useAvatarIdle(
  groupRef: React.RefObject<THREE.Group | null>,
  morphs: MorphControls,
) {
  const { setMorph } = morphs;

  // Accumulates total elapsed time for sway math
  const elapsedRef = useRef(0);

  // Blink state machine
  const blinkTimeRef     = useRef(0);           // time within current blink
  const nextBlinkAtRef   = useRef(randomBlinkInterval()); // abs time of next blink
  const isBlinkingRef    = useRef(false);

  useFrame((_state, delta) => {
    if (!groupRef.current) return;

    elapsedRef.current += delta;
    const t = elapsedRef.current;

    // ── Head sway ────────────────────────────────────────────────────────────
    groupRef.current.rotation.y = Math.sin(t * HEAD_SWAY_Y_FREQ) * HEAD_SWAY_Y_AMP;
    groupRef.current.rotation.x = Math.sin(t * HEAD_SWAY_X_FREQ) * HEAD_SWAY_X_AMP;

    // ── Eye blink state machine ───────────────────────────────────────────────
    if (isBlinkingRef.current) {
      blinkTimeRef.current += delta;
      const progress = blinkTimeRef.current / BLINK_DURATION_S; // 0 → 1

      // Triangle wave: close (0→0.5) then open (0.5→1)
      const blinkValue =
        progress < 0.5
          ? progress * 2          // 0 → 1
          : (1 - progress) * 2;   // 1 → 0

      const clamped = Math.max(0, Math.min(1, blinkValue));
      setMorph('eyeBlinkL', clamped);
      setMorph('eyeBlinkR', clamped);

      if (blinkTimeRef.current >= BLINK_DURATION_S) {
        // Blink done — reset to fully open
        setMorph('eyeBlinkL', 0);
        setMorph('eyeBlinkR', 0);
        isBlinkingRef.current  = false;
        blinkTimeRef.current   = 0;
        nextBlinkAtRef.current = t + randomBlinkInterval();
      }
    } else if (t >= nextBlinkAtRef.current) {
      isBlinkingRef.current = true;
      blinkTimeRef.current  = 0;
    }
  });
}
