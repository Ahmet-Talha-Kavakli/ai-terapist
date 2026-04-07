---
name: wearable-data-integration
description: Ingests, interprets, and therapeutically applies data from Apple Watch, Fitbit, Garmin, and other wearable devices. Correlates physiological signals with psychological state to enhance session quality and between-session monitoring.
---

# Wearable Data Integration Skill

## Overview
Wearables provide objective physiological data that supplements what users say and what the camera sees. This skill defines how to collect, interpret, and therapeutically use this data.

---

## Supported Devices & Data Sources

| Device | Integration Method | Data Available |
|--------|-------------------|----------------|
| Apple Watch | HealthKit (iOS) / Apple Health API | HR, HRV, SpO2, Sleep, Steps, Mindfulness minutes |
| Fitbit | Fitbit Web API (OAuth2) | HR, HRV, Sleep stages, Stress score, SpO2, Steps |
| Garmin | Garmin Connect IQ API | HR, HRV, Stress, Body Battery, Sleep, VO2 max |
| WHOOP | WHOOP API | HRV, Recovery score, Sleep, Strain |
| Google Fit / Health Connect | Health Connect API (Android) | HR, Steps, Sleep, Activity |

---

## Key Metrics & Therapeutic Interpretation

### Heart Rate (HR)
```typescript
interface HeartRateInterpretation {
  resting: {
    low: number;      // < 50: athletic or bradycardia
    normal: number;   // 50-80: baseline
    elevated: number; // 80-100: stress/anxiety
    high: number;     // > 100: acute stress or medical concern
  };
  duringSession: {
    baselineIncrease: number; // % above resting during session
    interpretation: string;
  };
}
```

**Therapeutic use:**
- Elevated resting HR on session day → open with grounding, ask about anxiety
- HR spike during specific topic → flag topic as emotionally activating, note in profile
- HR drops after breathing exercise → reinforce effectiveness to user ("Your heart rate calmed down just now")

### Heart Rate Variability (HRV)
HRV is the most powerful stress/recovery indicator from wearables.

| HRV Status | Meaning | Therapeutic Adjustment |
|-----------|---------|----------------------|
| High HRV (> personal baseline) | Well-recovered, resilient, low stress | Can handle deeper processing |
| Normal HRV | Stable baseline | Standard session approach |
| Low HRV (< 20% below baseline) | Stress, poor sleep, physiological load | Reduce challenge, focus on stabilization |
| Very low HRV (< 40% below baseline) | Significant dysregulation | Consider reschedule or pure supportive session |

### Sleep Data
```typescript
interface SleepTherapeuticRules {
  poorSleep: {
    definition: 'totalSleep < 6h OR sleepScore < 60';
    adjustment: 'Acknowledge fatigue, slower pace, avoid heavy processing';
    topicTrigger: 'Offer sleep hygiene mini-session if 3+ consecutive poor nights';
  };
  goodSleep: {
    definition: 'totalSleep >= 7h AND sleepScore >= 75';
    adjustment: 'User has capacity — appropriate for deeper work';
  };
}
```

### Stress Score (Device-Reported)
- High stress days: therapist acknowledges physiological reality
- Prolonged stress pattern: bring into session proactively
- Low stress after therapeutic intervention: reinforce and note progress

### Activity & Movement
- Sedentary for 5+ consecutive days → possible depression/withdrawal → address gently
- Activity increase correlating with mood improvement → reinforce connection
- Exercise as mood regulation tool → prescribe if appropriate (behavioral activation)

---

## Data Collection Architecture

### Web Integration (MVP)
```typescript
// Use Web Bluetooth API for direct device connection (limited)
// OR use platform-specific app bridges

interface WearableDataBridge {
  appleHealth: {
    method: 'iOS app → backend sync';
    frequency: 'daily batch + real-time during session';
  };
  fitbit: {
    method: 'OAuth2 → Fitbit Web API → backend';
    frequency: 'daily cron job + webhook for real-time HR';
  };
  garmin: {
    method: 'Garmin Connect API → backend';
    frequency: 'daily batch sync';
  };
}
```

### Data Pipeline
```
Wearable Device
  → Platform API (HealthKit / Fitbit API / etc.)
    → Our Backend Sync Service (runs nightly + on session start)
      → Normalized WearableDataPoint schema
        → User Profile storage (encrypted)
          → Session Engine (read at session start)
            → Therapist context injection
```

### Privacy First
- Request only the minimum scopes needed for therapeutic value
- Wearable data stored in user's private partition
- Users can connect/disconnect devices at any time
- Clear explanation of what data is used and why

---

## In-Session Real-Time Use (Advanced)

When device supports real-time HR streaming (Apple Watch with iOS app):

```typescript
// During session, monitor for:
const realTimeAlerts = [
  {
    condition: 'heartRate > userBaseline * 1.5',
    action: 'Offer breathing exercise: "Your body might be working hard right now. Want to try a quick breath together?"'
  },
  {
    condition: 'heartRateSuddenDrop && topic === "crisis"',
    action: 'Flag possible dissociation, ground immediately'
  }
];
```

---

## Between-Session Monitoring

The system passively monitors wearable data between sessions and can:
- Send a gentle check-in message if stress is elevated for 3+ days
- Notify user if sleep quality has declined significantly
- Prompt mood log if HRV is very low
- Surface positive trends: "Your HRV has improved 15% this week — your body is responding to the work you're doing"

All between-session messages are optional and user-configured (notification preferences).
