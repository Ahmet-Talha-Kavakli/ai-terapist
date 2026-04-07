---
name: session-memory-continuity
description: Maintains a persistent, evolving psychological profile for each user across all therapy sessions. Enables true continuity — each session builds on the last, with adaptive treatment planning and smartwatch data integration.
---

# Session Memory & Continuity Skill

## Overview
A real therapist remembers everything. The AI therapist must do the same. This skill defines how to build, store, update, and use a living psychological profile for each user across unlimited sessions.

---

## User Psychological Profile Schema

```typescript
interface UserPsychProfile {
  userId: string;
  createdAt: string;
  lastUpdated: string;

  // Demographics & Context
  demographics: {
    ageRange: string;        // "25-30" (never exact DOB for privacy)
    occupation?: string;
    relationshipStatus?: string;
    livingArrangement?: string;
    culturalBackground?: string;
  };

  // Clinical Assessment
  clinical: {
    presentingProblems: string[];     // ["anxiety", "relationship difficulties", "work stress"]
    diagnosisHistory?: string[];      // User-reported only, never AI-diagnosed
    currentMedications?: string[];    // If user volunteers this information
    previousTherapyExperience?: string;
    attachmentStyle?: 'secure' | 'anxious' | 'avoidant' | 'disorganized';
    personalityNotes: string;         // Free text — therapist observations
    coreBeliefs: CoreBelief[];
    copingStyles: string[];
  };

  // Risk Profile
  risk: {
    currentRiskLevel: 'low' | 'medium' | 'high';
    riskHistory: RiskEvent[];
    safetyPlan?: SafetyPlan;
    emergencyContact?: EmergencyContact;
  };

  // Treatment
  treatment: {
    primaryApproach: TherapyApproach;   // CBT, DBT, ACT etc.
    secondaryApproaches: TherapyApproach[];
    treatmentGoals: TreatmentGoal[];
    currentPhase: 'assessment' | 'stabilization' | 'processing' | 'integration' | 'termination';
  };

  // Preferences
  preferences: {
    therapistTone: 'warm' | 'structured' | 'socratic' | 'direct';
    sessionPace: 'slow' | 'moderate' | 'fast';
    homeworkEngagement: 'high' | 'medium' | 'low';
    languageComplexity: 'simple' | 'clinical';
  };
}
```

---

## Session Record Schema

```typescript
interface SessionRecord {
  sessionId: string;
  userId: string;
  sessionNumber: number;
  date: string;
  duration: number;        // minutes

  // Pre-session
  checkInMood: number;     // 1-10 scale
  checkInNotes: string;

  // Session content
  mainTopics: string[];
  techniquesUsed: TherapyTechnique[];
  breakthroughs: string[];
  resistances: string[];
  homeworkAssigned?: string;
  homeworkFromLastSession?: 'completed' | 'partial' | 'not_done' | 'na';

  // Observational data
  visualAnalysisSummary: {
    dominantEmotion: string;
    discrepancyEvents: number;
    engagementLevel: 'high' | 'medium' | 'low';
    crisisFlags: number;
  };

  // Wearable data snapshot (if available)
  wearableSnapshot?: {
    avgHeartRate: number;
    hrv: number;
    sleepQualityLastNight: number;   // 1-10
    activityLevel: number;           // steps
  };

  // Post-session
  checkOutMood: number;    // 1-10 scale
  sessionNotes: string;    // AI-generated SOAP note
  nextSessionPlan: string;
}
```

---

## Pre-Session Briefing (Automatic)

Before every session starts (after session 1), the AI therapist reads and internalizes:

```
1. Last session summary + homework assigned
2. Current risk level
3. Active treatment goals
4. Preferred therapy tone and pace
5. Wearable data since last session (if available)
6. Notable patterns from last 3 sessions
```

**Example internal brief:**
> "User: Sarah. Session 7. Last session: explored childhood attachment wounds, high emotional activation around mother. Assigned: journaling exercise, completed (noted in check-in). Risk: Low. Mood trend: improving (5.2→6.8 avg over 3 sessions). Sleep: poor last 3 nights per Watch data. Today: follow up on journaling insights, explore sleep-emotion link."

---

## Cross-Session Pattern Detection

The system must detect patterns across sessions:

| Pattern | Detection | Response |
|---------|-----------|----------|
| Mood declining over 3+ sessions | Moving average of check-in scores | Flag for treatment plan review |
| Same topic recurring every session | Topic frequency analysis | Address as potential core wound |
| Homework consistently incomplete | Track completion rate | Discuss barriers, simplify homework |
| Session skipping pattern | Gap analysis between sessions | Check-in message, re-engagement |
| Mood spike after specific technique | Correlate technique with mood delta | Increase use of that technique |
| Consistent visual distress on specific topics | Visual analysis correlation | Flag as trauma trigger — slow down |

---

## SOAP Note Generation

After each session, auto-generate a structured clinical note:

```
S (Subjective): What the user reported — mood, events, progress on homework
O (Objective): Visual analysis observations, wearable data, behavioral patterns noted
A (Assessment): Current clinical picture, progress toward goals, risk assessment
P (Plan): Next session focus, homework assigned, treatment adjustments
```

---

## Data Retention & Privacy

- Session data stored encrypted (AES-256) in user's private partition
- Users can export all their data (GDPR right to portability)
- Users can request full deletion (GDPR right to erasure) — except crisis event logs
- Data never used for training AI models without explicit, separate consent
- Data never shared with third parties without consent (except legal requirements)

---

## Smartwatch Integration Points

```typescript
interface WearableDataPoint {
  timestamp: string;
  source: 'apple_watch' | 'fitbit' | 'garmin' | 'whoop' | 'other';
  heartRate?: number;
  hrv?: number;             // Heart Rate Variability — stress indicator
  bloodOxygen?: number;
  sleepData?: {
    totalSleep: number;     // minutes
    deepSleep: number;
    remSleep: number;
    sleepScore?: number;    // 0-100
  };
  stressScore?: number;     // device's own stress metric if available
  activityMinutes?: number;
  steps?: number;
}
```

**Usage in session:**
- HRV low on session day → note physiological stress, adjust pacing
- Sleep poor 3+ nights → ask about sleep, consider sleep hygiene as session topic
- Activity very low over past week → possible depression signal, address gently
- Stress score spiked between sessions → explore what happened that day
