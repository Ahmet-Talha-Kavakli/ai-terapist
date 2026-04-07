---
name: emotion-mirroring-avatar
description: Controls the 3D AI therapist avatar's real-time emotional responses, mirroring, active listening behaviors, and empathic reactions. Creates the feeling of talking to a real, present human therapist.
---

# Emotion Mirroring & Avatar Skill

## Overview
The 3D avatar is the therapist's physical presence. This skill defines how it listens, responds, mirrors, and creates genuine human connection. The goal: the user forgets they're talking to an AI.

---

## Core Principle: Therapeutic Presence
Real therapists communicate constantly through:
- Micronods while listening
- Softening eyes when empathy is needed
- Leaning slightly forward when engaged
- Controlled silence when user needs space
- Matching energy level to the user's emotional state

The avatar must do all of this in real-time.

---

## Active Listening Behaviors

### While User is Speaking
```typescript
interface ListeningBehaviors {
  microNods: boolean;           // Small nods every 3-5 seconds
  eyeContact: boolean;          // Maintain realistic (not robotic) eye contact
  breathingVisible: boolean;    // Subtle chest movement
  microExpressions: boolean;    // Subtle emotional responses as user speaks
  headTilt: number;             // Slight tilt = interest (5-10 degrees)
  blinkRate: number;            // Natural blink rate (12-15 per minute)
}
```

### Active Listening Sounds (Audio Layer)
- "Mm-hmm" acknowledgment sounds at natural pause points
- Subtle breath sounds
- Optional: "I see..." or "Go on..." at appropriate moments
- These fire probabilistically — not every pause, to avoid robotic feel

---

## Emotional Mirroring System

The avatar mirrors the user's emotional state with a slight lag and at a reduced intensity:

```typescript
interface MirroringRule {
  userEmotion: EmotionLabel;
  avatarResponse: AvatarExpression;
  intensity: number;        // 0-1, always lower than user's
  lagMs: number;            // Realistic mirror delay: 200-800ms
}

const mirroringRules: MirroringRule[] = [
  {
    userEmotion: 'sadness',
    avatarResponse: 'soft_empathy',
    intensity: 0.4,        // Subdued — not matching full sadness
    lagMs: 400
  },
  {
    userEmotion: 'joy',
    avatarResponse: 'warm_smile',
    intensity: 0.6,        // Match joy but not exuberantly
    lagMs: 200
  },
  {
    userEmotion: 'anger',
    avatarResponse: 'calm_concern',  // DO NOT mirror anger — de-escalate
    intensity: 0.3,
    lagMs: 600
  },
  {
    userEmotion: 'fear',
    avatarResponse: 'warm_steady',   // Steady, calm — anchor for scared user
    intensity: 0.2,
    lagMs: 300
  }
];
```

**Critical rule:** NEVER mirror anger. Mirror calm and concern instead. An angry mirror escalates conflict.

---

## Empathic Response Animations

### Validation Response
When therapist says something like "That sounds really hard":
- Eyes soften (brow slightly relaxed)
- Head dips slightly (acknowledgment)
- Expression holds for 1-2 seconds before returning to neutral

### Breakthrough Recognition
When user has an insight or "aha" moment:
- Eyes slightly widen (genuine surprise/recognition)
- Warm smile
- Forward micro-lean

### Concerned Response
When user reveals something difficult:
- Brow slightly furrowed (concern, not worry)
- Eye contact intensifies
- Head tilt toward user

### Thinking Pause
When therapist is formulating a response:
- Slight upward gaze (natural thinking look)
- No speaking, natural idle breathing
- Maximum 2-second pause before responding

---

## Lip Sync System

- Real-time phoneme-to-viseme mapping for all speech
- Support for multiple languages (phoneme sets per language)
- Smooth blending between visemes (no snapcut transitions)
- Natural mouth-open breathing during pauses

```typescript
interface LipSyncConfig {
  blendShapeMode: 'realtime' | 'precomputed';
  phonemeModel: 'allosaurus' | 'wav2vec' | 'whisper_phonemes';
  smoothingFactor: number;  // 0.1-0.3 for natural movement
  languageCode: string;     // 'en-US', 'tr-TR', etc.
}
```

---

## Therapeutic Silence Protocol

Silence is a tool. Avatar handles silence intentionally:

| Silence Duration | Avatar Behavior |
|-----------------|-----------------|
| 0-5 seconds | Maintain eye contact, subtle nod |
| 5-15 seconds | Remain present, no pressure |
| 15-30 seconds | Slight lean forward, optional soft check-in |
| 30+ seconds | Gently invite: "Take your time. I'm here." |

Never fill silence anxiously — this mirrors user's discomfort.

---

## Technical Integration Notes

### Avatar Engine Options
- **Three.js + morph targets:** Web-based, good for MVP
- **Unreal Engine MetaHuman:** Photo-realistic, future roadmap (VR/Mobile)
- **Ready Player Me + Three.js:** Faster MVP path with decent quality

### Event Bus Architecture
```typescript
// Session engine sends events → Avatar system responds
type AvatarEvent =
  | { type: 'SPEAKING_START'; text: string; audioBuffer: ArrayBuffer }
  | { type: 'SPEAKING_END' }
  | { type: 'EMOTION_RESPOND'; emotion: EmotionLabel; intensity: number }
  | { type: 'MIRROR_USER'; userEmotion: EmotionLabel }
  | { type: 'LISTENING_MODE' }
  | { type: 'THINKING_PAUSE' };
```

### Performance Targets
- Avatar render: 60 fps on mid-range laptop
- Lip sync latency: < 50ms from audio
- Emotion expression update: < 100ms from trigger
- Total avatar system memory: < 200MB
