import type { Classifications } from '@mediapipe/tasks-vision';
import type { TEmotionLabel } from '@ai-therapist/types';

/**
 * Maps MediaPipe ARKit blendshape names → TEmotionLabel.
 *
 * Each emotion definition is a list of { shapeName, weight } signals.
 * The score for an emotion = sum of (blendshapeValue * weight) for each signal.
 * The emotion with the highest score above DETECTION_THRESHOLD wins.
 * If nothing clears the threshold → 'neutral'.
 *
 * Weights are tuned for a face-forward therapy context (subtle expressions,
 * not full-amplitude actor expressions).
 */

interface EmotionSignal {
  shape: string;
  weight: number;
}

type EmotionDefinition = EmotionSignal[];

const EMOTION_DEFINITIONS: Record<TEmotionLabel, EmotionDefinition> = {
  neutral: [], // baseline — wins when nothing else scores

  happy: [
    { shape: 'mouthSmileLeft',   weight: 1.2 },
    { shape: 'mouthSmileRight',  weight: 1.2 },
    { shape: 'cheekSquintLeft',  weight: 0.8 },
    { shape: 'cheekSquintRight', weight: 0.8 },
    { shape: 'eyeSquintLeft',    weight: 0.4 },
    { shape: 'eyeSquintRight',   weight: 0.4 },
  ],

  sad: [
    { shape: 'mouthFrownLeft',   weight: 1.2 },
    { shape: 'mouthFrownRight',  weight: 1.2 },
    { shape: 'browInnerUp',      weight: 0.9 },
    { shape: 'mouthLowerDownLeft',  weight: 0.4 },
    { shape: 'mouthLowerDownRight', weight: 0.4 },
  ],

  angry: [
    { shape: 'browDownLeft',     weight: 1.3 },
    { shape: 'browDownRight',    weight: 1.3 },
    { shape: 'eyeSquintLeft',    weight: 0.6 },
    { shape: 'eyeSquintRight',   weight: 0.6 },
    { shape: 'noseSneerLeft',    weight: 0.5 },
    { shape: 'noseSneerRight',   weight: 0.5 },
    { shape: 'mouthPressLeft',   weight: 0.4 },
    { shape: 'mouthPressRight',  weight: 0.4 },
  ],

  fearful: [
    { shape: 'browInnerUp',      weight: 1.0 },
    { shape: 'browOuterUpLeft',  weight: 0.8 },
    { shape: 'browOuterUpRight', weight: 0.8 },
    { shape: 'eyeWideLeft',      weight: 0.9 },
    { shape: 'eyeWideRight',     weight: 0.9 },
    { shape: 'mouthStretchLeft', weight: 0.5 },
    { shape: 'mouthStretchRight',weight: 0.5 },
  ],

  disgusted: [
    { shape: 'noseSneerLeft',    weight: 1.3 },
    { shape: 'noseSneerRight',   weight: 1.3 },
    { shape: 'browDownLeft',     weight: 0.5 },
    { shape: 'browDownRight',    weight: 0.5 },
    { shape: 'mouthShrugLower',  weight: 0.4 },
  ],

  surprised: [
    { shape: 'browOuterUpLeft',  weight: 1.0 },
    { shape: 'browOuterUpRight', weight: 1.0 },
    { shape: 'eyeWideLeft',      weight: 0.8 },
    { shape: 'eyeWideRight',     weight: 0.8 },
    { shape: 'jawOpen',          weight: 0.9 },
  ],

  contempt: [
    // Asymmetric — one-sided smile / sneer
    { shape: 'mouthSmileLeft',   weight: 0.7 },
    { shape: 'noseSneerRight',   weight: 0.7 },
    { shape: 'mouthSmileRight',  weight: 0.5 },
    { shape: 'noseSneerLeft',    weight: 0.5 },
  ],
};

/** Minimum weighted score to override neutral. Tune up to reduce false positives. */
const DETECTION_THRESHOLD = 0.18;

/** Maximum possible score per emotion (sum of all weights) — used for normalisation. */
const MAX_SCORES: Partial<Record<TEmotionLabel, number>> = Object.fromEntries(
  (Object.entries(EMOTION_DEFINITIONS) as [TEmotionLabel, EmotionDefinition][]).map(
    ([label, signals]) => [label, signals.reduce((s, sig) => s + sig.weight, 0)],
  ),
);

export interface EmotionResult {
  label: TEmotionLabel;
  /** Normalised confidence 0–1 */
  score: number;
}

/**
 * Classifies emotion from MediaPipe FaceLandmarker blendshape output.
 *
 * @param blendshapes — `result.faceBlendshapes[0]` from FaceLandmarkerResult
 * @returns dominant emotion label + normalised score
 */
export function analyzeEmotion(blendshapes: Classifications): EmotionResult {
  // Build a fast lookup: shapeName → value
  const values = new Map<string, number>();
  for (const cat of blendshapes.categories) {
    values.set(cat.categoryName, cat.score);
  }

  let bestLabel: TEmotionLabel = 'neutral';
  let bestScore = 0;

  for (const [label, signals] of Object.entries(EMOTION_DEFINITIONS) as [
    TEmotionLabel,
    EmotionDefinition,
  ][]) {
    if (label === 'neutral' || signals.length === 0) continue;

    let raw = 0;
    for (const sig of signals) {
      raw += (values.get(sig.shape) ?? 0) * sig.weight;
    }

    const maxScore = MAX_SCORES[label] ?? 1;
    const normalised = raw / maxScore;

    if (normalised > bestScore && normalised >= DETECTION_THRESHOLD) {
      bestScore = normalised;
      bestLabel = label;
    }
  }

  return { label: bestLabel, score: bestScore };
}
