/**
 * Reallusion CC4 standard morph target names.
 * These are the default names used in CC4 FBX/GLB exports with Blend Shapes enabled.
 * When you export your character: Character Creator 4 → Export → FBX/GLB → enable Morph
 * The names below match CC4's built-in facial expression system (ARKit-compatible set).
 *
 * If your character uses custom names, update the VALUES here — the keys stay the same
 * so all hooks continue to work without changes.
 */
export const BLEND_SHAPES = {
  // ── Mouth / Jaw ──────────────────────────────────────────────
  mouthOpen:    'Mouth_Open',       // jaw drop — primary speaking morph
  mouthSmile:   'Mouth_Smile',      // bilateral smile
  mouthSad:     'Mouth_Sad',        // bilateral frown
  mouthFunnel:  'Mouth_Funnel',     // "O" shape (round vowels)
  mouthPucker:  'Mouth_Pucker',     // "U" / kiss shape
  mouthStretch: 'Mouth_Stretch',    // wide "AH"
  mouthPress:   'Mouth_Press',      // lips pressed together

  // ── Eyes ─────────────────────────────────────────────────────
  eyeBlinkL:    'Eye_Blink_L',
  eyeBlinkR:    'Eye_Blink_R',
  eyeWideL:     'Eye_Wide_L',       // surprise / fear
  eyeWideR:     'Eye_Wide_R',
  eyeSquintL:   'Eye_Squint_L',     // smile / contempt
  eyeSquintR:   'Eye_Squint_R',

  // ── Brows ─────────────────────────────────────────────────────
  browRaiseL:   'Brow_Raise_L',     // surprise / worry
  browRaiseR:   'Brow_Raise_R',
  browDropL:    'Brow_Drop_L',      // anger / concern
  browDropR:    'Brow_Drop_R',
  browInnerUp:  'Brow_Inner_Raise', // sad / worried inner brow

  // ── Cheeks ───────────────────────────────────────────────────
  cheekRaiseL:  'Cheek_Raise_L',    // smile (pushes up lower eyelids)
  cheekRaiseR:  'Cheek_Raise_R',

  // ── Nose ─────────────────────────────────────────────────────
  noseSneer:    'Nose_Sneer',       // disgust / contempt
} as const;

export type TBlendShapeKey = keyof typeof BLEND_SHAPES;
export type TBlendShapeName = (typeof BLEND_SHAPES)[TBlendShapeKey];
