---
name: crisis-detection-safety
description: Real-time detection of suicidal ideation, self-harm signals, dangerous objects in camera frame, and third-party threats. Enforces mandatory safety escalation protocols and legal compliance.
---

# Crisis Detection & Safety Protocol Skill

## Overview
This skill defines how the AI therapist must detect, respond to, and escalate crisis situations. This is the highest-priority system in the application — it overrides all other session logic.

## Crisis Signal Categories

### Category 1: Verbal Crisis Indicators (Text/Speech)
High-risk phrases that trigger immediate escalation:
- Direct: "I want to die", "I want to kill myself", "I'm going to end it", "I don't want to be here anymore"
- Indirect: "Everyone would be better off without me", "I've been thinking about disappearing", "I have a plan"
- Hopelessness: "Nothing will ever get better", "I see no way out", "I give up on everything"
- Farewell: "Goodbye forever", "I'm saying goodbye", "Tell [name] I love them"

Medium-risk phrases (trigger soft intervention):
- "I hurt myself", "I've been cutting", "I don't care if I get hurt"
- "I feel completely empty", "I feel nothing", "I can't take this anymore"

### Category 2: Visual Crisis Indicators (Camera Analysis)
- **Dangerous objects detected in frame:** knives, firearms, pills/medications in large quantities, ropes, sharp objects
- **Physical distress:** visible injuries, blood, severe trembling, rocking behavior
- **Third-party threat:** another person in frame behaving aggressively, physical altercation
- **Sudden scene change:** user leaves frame abruptly and doesn't return within 60 seconds
- **Environmental red flags:** user appears to be in a vehicle moving dangerously, hazardous environment

### Category 3: Biometric Crisis Indicators (Wearable Data)
- Heart rate suddenly spikes above 160 BPM during calm conversation
- HRV drops sharply (indicative of acute stress)
- User has been completely sedentary for 24+ hours combined with negative verbal sentiment

## Escalation Protocol

### Level 1: Soft Intervention (Medium Risk)
**Trigger:** 1-2 medium-risk signals detected
**Action:**
1. Pause current therapy technique
2. Acknowledge the user's pain directly and empathically
3. Gently ask: "I want to make sure you're safe. Are you having any thoughts of hurting yourself?"
4. Offer grounding exercise (5-4-3-2-1 sensory technique)
5. Log the event with timestamp and session ID (never deleted)

### Level 2: Active Crisis Response (High Risk)
**Trigger:** 1+ high-risk signal OR visual dangerous object OR physical threat
**Action:**
1. **Immediately** interrupt session flow
2. Display full-screen safety message (non-dismissable for 30 seconds)
3. Provide localized emergency resources (auto-detect country):
   - 🇹🇷 Turkey: 182 (Suicide Prevention Line), 112 (Emergency)
   - 🇺🇸 USA: 988 (Suicide & Crisis Lifeline), 911
   - 🇬🇧 UK: 116 123 (Samaritans), 999
   - Global: findahelpline.com
4. Ask if user wants to contact emergency services — offer one-click call
5. Notify emergency contact if user has registered one
6. Do NOT end session — maintain presence and calm

### Level 3: Imminent Danger (Visual Weapon / Attack)
**Trigger:** Firearm or weapon visible in frame, apparent physical attack
**Action:**
1. Trigger immediate emergency alert UI
2. If user has provided emergency contact + consent: auto-notify
3. Log full session recording timestamp for potential legal use
4. Display clear instruction: "Please call 112/911 immediately"
5. Keep session open, therapist to provide calming presence

## Legal & Compliance Requirements

### Data Handling
- All crisis events MUST be logged with: `userId`, `sessionId`, `timestamp`, `crisisLevel`, `signalType`, `actionTaken`
- Crisis logs are NEVER deleted (legal requirement)
- Crisis logs are stored separately from regular session data with restricted access
- Full session transcript is preserved when a crisis event occurs

### User Consent
- During onboarding, users MUST consent to: "In the event of a safety concern, this system may log additional data and contact emergency services."
- Emergency contact registration (optional but recommended)
- Users must be informed this system monitors for safety signals

### GDPR / HIPAA Awareness
- Health data (mental health) is Special Category data under GDPR — requires explicit consent
- All data encrypted at rest (AES-256) and in transit (TLS 1.3)
- Data residency must comply with user's country when possible

## Implementation Notes

### Detection Architecture
```typescript
// Crisis detection runs as a parallel pipeline — never blocking main session
interface CrisisSignal {
  type: 'verbal' | 'visual' | 'biometric';
  severity: 'low' | 'medium' | 'high' | 'imminent';
  confidence: number; // 0-1
  timestamp: string;
  details: string;
}

// Always run crisis detection BEFORE processing AI response
// Crisis response overrides any queued AI message
```

### Testing Requirements
- Crisis detection must have 95%+ precision on high-risk verbal patterns
- False positive rate must be < 5% (avoid unnecessary escalation)
- Visual detection runs at minimum 2 fps during active session
- All crisis escalation paths must have E2E tests with mock scenarios
