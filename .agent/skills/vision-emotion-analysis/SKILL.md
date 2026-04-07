---
name: vision-emotion-analysis
description: Analyzes real-time camera input to detect facial expressions, microexpressions, body posture, hand gestures, environmental context, and dangerous objects. Bridges the gap between verbal and non-verbal communication in therapy.
---

# Vision & Emotion Analysis Skill

## Overview
This skill defines how the AI therapist processes and interprets visual data from the user's camera during sessions. It enables the therapist to respond to what users show, not only what they say.

---

## Facial Expression Analysis

### Emotion Mapping (Based on Paul Ekman's FACS)
The system must recognize and interpret the 7 universal primary emotions:

| Emotion | Key Facial Indicators | Therapeutic Significance |
|---------|----------------------|--------------------------|
| Happiness | Lip corners raised, cheeks lifted, Duchenne smile | Genuine vs. masked — check if smile reaches eyes |
| Sadness | Inner brow raise, lip corners down, quivering | May suppress — watch for micro-sadness during "I'm fine" |
| Fear | Brow raise + together, upper eyelid raised, horizontal lip stretch | Anxiety signal — pivot to grounding |
| Anger | Brow lower + together, lip press, jaw clench | Needs validation before exploration |
| Disgust | Nose wrinkle, upper lip raise | Self-directed disgust = shame → handle with care |
| Surprise | Brow raise, widened eyes, dropped jaw | Context-dependent — distress vs. pleasant surprise |
| Contempt | Unilateral lip corner raise | Toward self = self-criticism; toward therapist = rupture signal |

### Microexpression Detection
- Microexpressions last 1/25 to 1/5 of a second — must be detected at 25+ fps
- Most important: **suppressed emotions leaking through** when verbal content contradicts
- Example: User says "I don't care anymore" while microexpression shows fear → flag discrepancy

### Discrepancy Detection
```
IF verbal_sentiment = POSITIVE AND facial_emotion IN [SAD, FEAR, ANGER]:
  → Flag: "Possible emotional masking"
  → Adjust: Shift from structured technique to empathic reflection
  → Do NOT immediately confront — reflect gently: "I noticed something shift in your expression..."
```

---

## Body Language Analysis

### Posture Indicators
| Signal | Meaning | Response |
|--------|---------|----------|
| Closed body (crossed arms/legs, hunched) | Defensive, unsafe | Slow down, increase warmth, don't push |
| Forward lean | Engaged, interested | Continue current approach |
| Backward lean | Withdrawn, uncomfortable | Check in directly |
| Self-touching (face, arms, hair) | Anxiety, self-soothing | Offer grounding exercise |
| Rocking / repetitive movement | High distress, dissociation | Ground immediately |
| Head nodding | Agreement vs. forced compliance | Note frequency and timing |
| Gaze avoidance | Shame, trauma activation | Reduce intensity, normalize |

### Hand & Gesture Analysis
- Visible trembling → anxiety/panic indicator → offer breathing exercise
- Touching neck/chest → high anxiety or heart rate spike
- Fist clenching → suppressed anger
- Wringing hands → high stress

---

## Environmental Analysis

### Background Context
- Note changes in environment across sessions (consistency = stability signal)
- Messy/chaotic background may indicate mental state decline
- Dark room, blinds closed = possible avoidance / depression sign
- Assess lighting — ensure user can be properly seen for analysis

### Safety Scanning
Every frame must be scanned for:
- **Weapons:** firearms, knives, sharp objects (flag immediately → Crisis Skill)
- **Medications:** large quantities of pills visible (medium-high alert)
- **Third parties:** other people in frame, especially aggressive movements
- **Physical injuries:** visible blood, bruising, bandages not mentioned by user

### Presence Detection
- User leaves frame → start 60-second timer
- If user doesn't return: pause session, display check-in prompt
- If no response after 90 seconds: display safety resources and emergency contact option

---

## Real-Time Feedback to Session Engine

### Data Format
```typescript
interface VisualAnalysisFrame {
  timestamp: string;
  faceDetected: boolean;
  primaryEmotion: EmotionLabel;
  emotionConfidence: number;        // 0-1
  microexpressionFlag: boolean;
  verbalVisualDiscrepancy: boolean;
  bodyLanguage: BodyLanguageSignals[];
  environmentSafetyFlags: SafetyFlag[];
  attentionLevel: 'high' | 'medium' | 'low' | 'absent';
}
```

### Aggregation Rules
- Single-frame anomalies: log but don't trigger response
- 3+ consecutive frames with same signal: trigger soft response
- Any safety flag at any confidence > 0.7: trigger Crisis Skill immediately
- Aggregate emotion over full 30-second window for session-level insight

---

## Technical Implementation Notes

### Recommended Stack
- **Client-side:** `MediaPipe Face Mesh` (164 landmarks, runs in browser via WASM)
- **Emotion inference:** `face-api.js` or `TensorFlow.js` with fine-tuned model
- **Body pose:** `MediaPipe Pose` or `MoveNet` (TensorFlow.js)
- **Object detection:** `COCO-SSD` model for environmental scanning
- **Performance target:** Analysis pipeline < 100ms per frame, 10-25 fps

### Privacy Requirements
- All camera processing runs CLIENT-SIDE — raw video frames NEVER sent to server
- Only analysis results (emotion labels, confidence scores) transmitted
- User must explicitly grant camera permission with clear explanation
- Users can disable visual analysis and proceed with audio-only mode

### Fallback Behavior
- If camera unavailable: proceed with audio + text only, note reduced analysis capability
- If low-confidence detection (< 0.4): do not act on data, wait for clearer signal
- If performance issues: reduce to 5 fps minimum viable analysis rate
