import type { TEmotionLabel } from '@ai-therapist/types';
import type { TBlendShapeKey } from './blend-shapes';

/**
 * Per-emotion blend shape weight targets (0–1).
 * Only list the shapes that deviate from 0 for that emotion.
 * Shapes not listed default to 0 (neutral).
 *
 * These are lerped in useAvatarEmotion — transitions are always smooth.
 * Weights are intentionally subtle (therapist, not actor) to feel natural.
 */
export const EMOTION_PRESETS: Record<TEmotionLabel, Partial<Record<TBlendShapeKey, number>>> = {
  neutral: {},

  happy: {
    mouthSmile:  0.65,
    cheekRaiseL: 0.45,
    cheekRaiseR: 0.45,
    eyeSquintL:  0.20,
    eyeSquintR:  0.20,
  },

  sad: {
    mouthSad:    0.55,
    browInnerUp: 0.50,
    browDropL:   0.15,
    browDropR:   0.15,
    eyeSquintL:  0.10,
    eyeSquintR:  0.10,
  },

  angry: {
    browDropL:   0.65,
    browDropR:   0.65,
    eyeSquintL:  0.35,
    eyeSquintR:  0.35,
    noseSneer:   0.25,
    mouthPress:  0.30,
  },

  fearful: {
    browRaiseL:  0.55,
    browRaiseR:  0.55,
    browInnerUp: 0.40,
    eyeWideL:    0.50,
    eyeWideR:    0.50,
    mouthStretch: 0.20,
  },

  disgusted: {
    noseSneer:   0.60,
    browDropL:   0.25,
    browDropR:   0.25,
    eyeSquintL:  0.20,
    eyeSquintR:  0.20,
    mouthPress:  0.15,
  },

  surprised: {
    browRaiseL:  0.75,
    browRaiseR:  0.75,
    eyeWideL:    0.65,
    eyeWideR:    0.65,
    mouthOpen:   0.30,
  },

  contempt: {
    mouthSmile:  0.20,   // asymmetric smile — approximated bilaterally at half
    noseSneer:   0.20,
    eyeSquintL:  0.15,
  },
};
