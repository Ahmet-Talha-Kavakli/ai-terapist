import type { Classifications } from '@mediapipe/tasks-vision';
import type { ICrisisSignal, TCrisisSeverity } from '@ai-therapist/types';

/**
 * Facial-signal crisis detection.
 *
 * This is ONE layer of a multi-signal crisis system:
 *   Layer 1 — this file: continuous facial distress patterns (client-side)
 *   Layer 2 — NLP: AI detects verbal crisis indicators in transcript (server-side)
 *   Layer 3 — OpenAI Vision: periodic scene analysis (server-side, Phase 8)
 *
 * All three layers feed setActiveCrisis() in the session store.
 * A real alert only fires when ≥2 layers agree (reduces false positives).
 *
 * NOTE: This detector is intentionally conservative.
 * We NEVER surface a crisis alert from facial data alone.
 * It raises internal confidence that gets combined with other signals.
 */

interface DistressState {
  /** Rolling window of distress scores (last N frames) */
  window: number[];
  /** Timestamp (Date.now()) when distress was first detected */
  distressOnsetMs: number | null;
  /** Timestamp of last flat-affect (no movement) frame */
  flatAffectOnsetMs: number | null;
}

// Sliding window length (frames at 5fps → 10 s window = 50 frames)
const WINDOW_SIZE = 50;

// Thresholds
const DISTRESS_SCORE_THRESHOLD      = 0.25;   // min avg distress to watch
const DISTRESS_SUSTAINED_MS         = 20_000;  // 20 s of distress before flagging
const FLAT_AFFECT_MOVEMENT_THRESHOLD = 0.02;   // total blendshape movement below this = flat
const FLAT_AFFECT_SUSTAINED_MS      = 45_000;  // 45 s of flat affect (potential dissociation)
const EXTREME_SCORE_THRESHOLD       = 0.80;    // single-frame extreme distress

/** Blendshapes that signal emotional distress. */
const DISTRESS_SHAPES: { shape: string; weight: number }[] = [
  { shape: 'browInnerUp',       weight: 0.8 },
  { shape: 'mouthFrownLeft',    weight: 0.7 },
  { shape: 'mouthFrownRight',   weight: 0.7 },
  { shape: 'browDownLeft',      weight: 0.6 },
  { shape: 'browDownRight',     weight: 0.6 },
  { shape: 'eyeWideLeft',       weight: 0.5 },
  { shape: 'eyeWideRight',      weight: 0.5 },
  { shape: 'mouthStretchLeft',  weight: 0.4 },
  { shape: 'mouthStretchRight', weight: 0.4 },
];

const MAX_DISTRESS_SCORE = DISTRESS_SHAPES.reduce((s, d) => s + d.weight, 0);

/** Blendshapes whose total sum reflects facial movement (flat affect proxy). */
const MOVEMENT_SHAPES = [
  'mouthSmileLeft', 'mouthSmileRight', 'mouthFrownLeft', 'mouthFrownRight',
  'browInnerUp', 'browDownLeft', 'browDownRight', 'jawOpen', 'eyeBlinkLeft',
  'eyeBlinkRight', 'cheekSquintLeft', 'cheekSquintRight',
];

function computeDistressScore(values: Map<string, number>): number {
  let raw = 0;
  for (const { shape, weight } of DISTRESS_SHAPES) {
    raw += (values.get(shape) ?? 0) * weight;
  }
  return raw / MAX_DISTRESS_SCORE;
}

function computeMovement(values: Map<string, number>): number {
  let total = 0;
  for (const shape of MOVEMENT_SHAPES) {
    total += values.get(shape) ?? 0;
  }
  return total / MOVEMENT_SHAPES.length;
}

function windowAverage(window: number[]): number {
  if (window.length === 0) return 0;
  return window.reduce((a, b) => a + b, 0) / window.length;
}

function getSeverity(avgScore: number, durationMs: number): TCrisisSeverity {
  if (avgScore > 0.70 || durationMs > 60_000) return 'high';
  if (avgScore > 0.50 || durationMs > 40_000) return 'medium';
  return 'low';
}

/**
 * Stateful crisis detector.
 * Create once per session and call `analyze()` on every MediaPipe result.
 *
 * @example
 * const detector = new CrisisDetector()
 * // in mediapipe loop:
 * const signal = detector.analyze(result.faceBlendshapes[0])
 * if (signal) store.setActiveCrisis(signal)
 */
export class CrisisDetector {
  private state: DistressState = {
    window: [],
    distressOnsetMs: null,
    flatAffectOnsetMs: null,
  };

  analyze(blendshapes: Classifications | undefined): ICrisisSignal | null {
    if (!blendshapes) return null;

    const now = Date.now();
    const values = new Map<string, number>(
      blendshapes.categories.map((c) => [c.categoryName, c.score]),
    );

    const distressScore = computeDistressScore(values);
    const movement      = computeMovement(values);

    // ── Update sliding window ─────────────────────────────────────────────
    this.state.window.push(distressScore);
    if (this.state.window.length > WINDOW_SIZE) {
      this.state.window.shift();
    }
    const avgDistress = windowAverage(this.state.window);

    // ── Track distress onset ──────────────────────────────────────────────
    if (avgDistress >= DISTRESS_SCORE_THRESHOLD) {
      if (this.state.distressOnsetMs === null) {
        this.state.distressOnsetMs = now;
      }
    } else {
      this.state.distressOnsetMs = null;
    }

    // ── Track flat affect (potential dissociation) ────────────────────────
    if (movement < FLAT_AFFECT_MOVEMENT_THRESHOLD) {
      if (this.state.flatAffectOnsetMs === null) {
        this.state.flatAffectOnsetMs = now;
      }
    } else {
      this.state.flatAffectOnsetMs = null;
    }

    // ── Signal: extreme single-frame distress ────────────────────────────
    if (distressScore >= EXTREME_SCORE_THRESHOLD) {
      return {
        type: 'verbal',  // visual distress — conservative type
        severity: 'medium',
        confidence: distressScore,
        detectedAt: now,
        description: `Extreme facial distress detected (score ${distressScore.toFixed(2)})`,
      };
    }

    // ── Signal: sustained distress ────────────────────────────────────────
    if (this.state.distressOnsetMs !== null) {
      const durationMs = now - this.state.distressOnsetMs;
      if (durationMs >= DISTRESS_SUSTAINED_MS) {
        return {
          type: 'verbal',
          severity: getSeverity(avgDistress, durationMs),
          confidence: avgDistress,
          detectedAt: this.state.distressOnsetMs,
          description: `Sustained facial distress for ${Math.round(durationMs / 1000)} s`,
        };
      }
    }

    // ── Signal: flat affect (dissociation proxy) ──────────────────────────
    if (this.state.flatAffectOnsetMs !== null) {
      const durationMs = now - this.state.flatAffectOnsetMs;
      if (durationMs >= FLAT_AFFECT_SUSTAINED_MS) {
        return {
          type: 'verbal',
          severity: 'low',
          confidence: 0.4,
          detectedAt: this.state.flatAffectOnsetMs,
          description: `Flat affect detected for ${Math.round(durationMs / 1000)} s (possible dissociation)`,
        };
      }
    }

    return null;
  }

  reset() {
    this.state = {
      window: [],
      distressOnsetMs: null,
      flatAffectOnsetMs: null,
    };
  }
}
