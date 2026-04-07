---
name: mobile-design
description: Mobile-first design thinking and decision-making for iOS and Android apps. Use this skill whenever designing or building mobile interfaces, thinking about touch interactions, planning mobile navigation, reviewing React Native or Flutter code, making mobile UX decisions, or when the project expands to mobile app. Apply mobile design principles proactively even during web development to ensure mobile readiness.
---

# Mobile Design System

## Overview
This skill prepares the AI therapist app for its future mobile expansion (iOS/Android/VR). Apply these principles when planning features that will eventually live on mobile.

## Critical: Ask Before Assuming

Before starting any mobile work, confirm:
1. **Target platform?** iOS only / Android only / Both
2. **Framework?** React Native / Flutter / Native Swift/Kotlin
3. **Design system?** Custom / Material / Cupertino / Hybrid
4. **Minimum OS version?** (affects what APIs are available)

## Platform Decision Matrix

| Feature | iOS (Cupertino) | Android (Material) | Both |
|---------|----------------|-------------------|------|
| Navigation | Back button top-left | Back gesture/button | Adapt per platform |
| Bottom tabs | Tab Bar | Navigation Bar | Both have tab bar |
| Dialogs | `UIAlertController` style | Material dialog | Platform-native |
| Typography | SF Pro | Roboto | System font |

**When to unify vs diverge:**
- Unify: Core layout, visual design language, spacing
- Diverge: Navigation patterns, gesture interactions, system UI elements

## Mobile UX Psychology

### Fitts' Law for Touch
```
Desktop: Cursor is precise (1px)
Mobile: Finger contact area ≈ 7mm
→ Touch targets MUST be minimum 44×44px (iOS) / 48×48dp (Android)
→ Primary actions in THUMB ZONE (bottom of screen)
→ Destructive actions AWAY from easy reach (top of screen)
```

### Thumb Zone Layout
```
┌─────────────────────────────┐
│      HARD TO REACH          │ ← Navigation, back, menu
│       (stretch)             │
├─────────────────────────────┤
│       OK TO REACH           │ ← Secondary actions, content
│       (natural)             │
├─────────────────────────────┤
│     EASY TO REACH           │ ← PRIMARY CTAs, send button
│   (thumb's natural arc)     │ ← Main content interaction
└─────────────────────────────┘
             [HOME]
```

### Session UI for Mobile
For the therapy session screen on mobile:
- Avatar: full-width top half
- User camera: small pip (picture-in-picture), bottom corner
- Microphone + end session: THUMB ZONE (bottom)
- Crisis button: always accessible, not hidden in menu

## Performance Principles

### React Native Critical Rules
```typescript
// ✅ CORRECT: Memoized list items
const SessionItem = React.memo(({ session }: { session: Session }) => (
  <View style={styles.item}>
    <Text>{session.title}</Text>
  </View>
));

const renderItem = useCallback(
  ({ item }: { item: Session }) => <SessionItem session={item} />,
  []
);

// ✅ CORRECT: FlatList with all optimizations
<FlatList
  data={sessions}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}  // Stable ID, NOT index
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={5}
/>
```

### Animation Performance
```
GPU-accelerated (FAST):      CPU-bound (AVOID animating):
├── transform                ├── width, height
├── opacity                  ├── top, left, right, bottom
└── Use these ONLY           ├── margin, padding
                             └── backgroundColor (when possible)
```

### Security on Mobile
- Store auth tokens in: `SecureStore` (Expo) / `Keychain` (iOS) / `EncryptedSharedPreferences` (Android)
- **NEVER** store sensitive data in `AsyncStorage` — it's unencrypted
- Camera permissions must have clear user-facing explanation
- Health/biometric data: use platform health APIs (HealthKit/Health Connect)

## AI Therapy App — Mobile-Specific Considerations

### Camera Access (Therapy Session)
```typescript
// Always request with clear explanation
const { status } = await Camera.requestCameraPermissionsAsync();
// Show explanation screen BEFORE permission dialog
// "We use your camera to help your therapist read your emotions in real time"
```

### Wearable Data (Mobile is Key)
- iOS: HealthKit integration via React Native Health or native module
- Android: Health Connect API
- Background sync: use background fetch, not continuous foreground

### Offline Capability
- Sessions need network — show clear offline state
- Session history: cache locally for offline viewing
- Partial sync: queue journal entries when offline, sync when connected

## Pre-Development Checklist

Before starting any mobile screen:
- [ ] Confirmed target platform(s)
- [ ] Touch targets ≥ 44px minimum
- [ ] Primary actions in thumb zone
- [ ] Tested on smallest supported screen (iPhone SE / small Android)
- [ ] Keyboard behavior tested (doesn't cover input fields)
- [ ] Dark mode supported
- [ ] Accessibility: VoiceOver/TalkBack compatible
