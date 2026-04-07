# AI Therapist Platform — Architecture Design Document

**Date:** 2026-04-07
**Status:** Approved v2.0 (post spec-review)
**Version:** 2.0

---

## 1. Project Vision

An AI-powered therapy platform where users engage in real-time therapy sessions with a 3D AI therapist. The system continuously analyzes the user's face, emotions, body language, speech, and environment to conduct adaptive, personalized therapy sessions — mimicking the depth of a world-class human therapist.

**Launch target:** Web MVP → Mobile → VR
**Scale target:** 100,000+ concurrent users
**Primary language:** English (global product)

---

## 2. Core Features

### 2.1 Therapy Session
- Real-time voice conversation with AI therapist (STT → LLM → TTS pipeline)
- 3D animated character (Reallusion Character Creator → GLTF/GLB with morph targets → React Three Fiber)
- Split-screen layout: left = 3D avatar, right = user camera feed
- Streamed AI responses (token streaming, not full completion wait)
- Session transcript and structured SOAP notes stored post-session

### 2.2 Vision Analysis (Hybrid)
- **MediaPipe Face Mesh** (client-side, ~30fps): 468-point face landmarks, emotion scoring, hand/body detection, eye gaze — zero server round-trip
- **OpenAI Vision** (server-side, every 30s or on critical emotion shift): Deep semantic analysis — environment, objects, expressions in context
- Emotion data written to Redis as **batched updates** (not per-frame) with TTL
- Crisis detection: dangerous objects, signs of self-harm, aggression from others
- Mirroring signals sent to avatar for empathic response

### 2.3 AI Therapist Core
- GPT-4o mini as primary language model with **token streaming** enabled
- System prompt engineered with: CBT, DBT, ACT, psychoanalysis, somatic therapy, trauma-informed approaches, historical frameworks (Jung, Adler, Frankl, Perls, Satir, etc.)
- Semantic memory via pgvector (HNSW index): recalls past sessions, user patterns, life context
- Redis session state: current session context window (TTL = session duration + 1h)
- Incongruence detection: cross-references vision data with speech (e.g., "I'm fine" + distress face)
- **Output moderation**: OpenAI Moderation API applied to every AI response before TTS
- **Session rate limiting**: max 5 sessions/hour per user (Redis + API guard)

### 2.4 Speech Pipeline (STT → LLM → TTS)
```
User speaks
    ↓
LiveKit audio stream
    ↓
LiveKit Transcription Plugin (Deepgram under the hood)
    ↓  real-time transcript
NestJS ai-therapist module
    ↓  token streaming
GPT-4o mini response
    ↓
OpenAI Moderation API check
    ↓  if safe
OpenAI TTS (tts-1) → audio chunks
    ↓
LiveKit audio channel → client
    ↓
Avatar lip-sync (blend shapes / morph targets)
```

### 2.5 Onboarding & Profiling
- Structured first-session intake: background, goals, mental health history, preferences
- Mandatory disclaimer screen: "This is not a licensed therapist, does not replace clinical care"
- Granular consent: camera data, audio, psychological data — each consented separately (GDPR)
- Generates initial psychological profile stored in Supabase
- Sets personalized therapy roadmap
- Updates dynamically over time

### 2.6 Session Memory & Continuity
- pgvector semantic search with **HNSW index** on `session_memories.embedding`
- Longitudinal tracking: mood trends, progress markers, recurring themes
- Between-session homework stored in `sessions.homework`
- Email check-ins via Resend (between sessions)
- Adaptive future session planning based on history

### 2.7 Wearable Integration (V1)
- Smartwatch data ingestion API (Fitbit OAuth2, Garmin Connect, WHOOP)
- Apple HealthKit: deferred to mobile app phase (requires iOS)
- Correlates physiological data with session emotional state
- `wearable_data` table with structured fields per source

### 2.8 Crisis Protocol
- Real-time MediaPipe detection → severity scoring → Redis
- OpenAI Vision confirms on high-severity signals
- Crisis response: session pause → safety resources → optional emergency contact notification (requires prior explicit consent per user)
- Crisis logs: **never deleted** (duty of care); legal basis documented for GDPR erasure requests
- Crisis logs access: restricted via Supabase RLS policies to platform safety team only

### 2.9 Avatar Interaction
- Reallusion Character Creator export: GLTF/GLB with **blend shapes (morph targets)** for facial expressions
- Lip-sync driven by phoneme analysis of TTS audio chunks
- Emotion mirroring: avatar blend shapes respond to user's detected emotion
- Gaze tracking: avatar maintains contextual eye contact
- Asset delivery: GLTF/GLB served via **CDN (Vercel Edge / Cloudflare R2)** with progressive loading
- LOD strategy: lower-poly fallback on slow connections

---

## 3. Architecture Decision Record

| Concern | Decision | Rationale |
|---|---|---|
| Repo structure | Turborepo monorepo | Shared code across web/mobile/VR; team-friendly |
| AI model | GPT-4o mini (streaming) | Cost-efficient at scale; streaming for low latency |
| STT | LiveKit Transcription Plugin (Deepgram) | Same infra, real-time, low latency |
| TTS | OpenAI tts-1 | Native integration with GPT-4o mini pipeline |
| AI output safety | OpenAI Moderation API | Every response validated before reaching user |
| Realtime comms | LiveKit | WebRTC + audio/video/data + transcription in one |
| WebSocket channel | LiveKit data channels only | No separate Socket.io; LiveKit handles all real-time |
| Primary DB | Supabase (PostgreSQL) | Relational + pgvector + storage in one platform |
| Vector memory | pgvector + HNSW index | Semantic session recall; sub-10ms search |
| Cache & state | Upstash Redis | Serverless Redis; session state, rate limiting |
| Emotion data in Redis | Batched writes (every 2s) | Prevents thousands of writes/min per user |
| 3D character | Reallusion → GLTF/GLB (morph targets) → R3F | Professional pipeline; browser-renderable |
| Avatar CDN | Cloudflare R2 + CDN | 20-100MB GLB — not served from app server |
| Vision (realtime) | MediaPipe Face Mesh (468 landmarks) | Zero-latency, client-side, no data leaves browser |
| Vision (deep) | OpenAI Vision (periodic, server-side) | Semantic depth; 30s intervals |
| ORM / DB client | Prisma + Supabase connection string | Type-safe queries; PgBouncer connection pooling |
| Async jobs | Inngest | Post-session summary, embeddings, profile updates |
| Authentication | Clerk | Fastest setup; replaceable later |
| Email/notifications | Resend | Between-session check-ins, homework reminders |
| Payments | Stripe (configured, inactive) | MVP first; activate for monetization |
| Feature flags | Simple DB-backed flags (users table) | No external vendor needed at MVP scale |
| Observability | Sentry + PostHog + Vercel Analytics | Error alerting, product analytics |
| Deployment | Vercel (web) + Railway (API) | Serverless-optimized; WebSocket on Railway |
| i18n | next-intl (English only, MVP) | Infrastructure in place for future expansion |

---

## 4. Monorepo Structure

```
ai-therapist/
├── apps/
│   ├── web/                          # Next.js 15 (App Router, TypeScript)
│   └── api/                          # NestJS — WebSocket + AI orchestration
├── packages/
│   ├── ui/                           # Shared React component library
│   ├── types/                        # Shared TypeScript interfaces/types (no runtime deps)
│   ├── config/                       # Shared ESLint, TSConfig, Tailwind configs
│   └── ai-core/                      # SERVER-ONLY AI orchestration logic
├── docs/
│   └── superpowers/specs/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Lint, type-check, test on PR
│       └── deploy.yml                # Deploy web→Vercel, api→Railway on main merge
├── .env.example                      # All env vars documented
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

> **Note on `packages/ai-core`:** This package is **server-only** (NestJS/Node). It must never be imported in browser code. It contains therapy framework logic, prompt builders, and OpenAI SDK calls. The web app communicates with it exclusively via LiveKit data channels and HTTP API.

---

## 5. Web App Structure

```
apps/web/
├── src/
│   ├── app/
│   │   ├── (auth)/                   # /sign-in, /sign-up (Clerk)
│   │   ├── (dashboard)/              # /dashboard, /history, /profile, /settings
│   │   ├── session/[id]/             # Live therapy session page
│   │   ├── onboarding/               # First-time intake + consent flow
│   │   └── api/
│   │       ├── livekit/              # LiveKit token generation
│   │       ├── webhooks/
│   │       │   ├── clerk/            # Clerk webhook (SVIX signature verified)
│   │       │   └── stripe/           # Stripe webhook
│   │       └── health/
│   ├── features/
│   │   ├── onboarding/
│   │   │   ├── components/
│   │   │   │   ├── IntakeForm.tsx
│   │   │   │   ├── ConsentFlow.tsx   # Granular per-data-type consent
│   │   │   │   └── DisclaimerScreen.tsx
│   │   │   ├── hooks/
│   │   │   └── schema.ts
│   │   ├── session/
│   │   │   ├── components/
│   │   │   │   ├── SessionLayout.tsx
│   │   │   │   ├── SessionControls.tsx
│   │   │   │   └── SessionTimer.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── use-session.ts
│   │   │   │   └── use-livekit.ts
│   │   │   └── session.store.ts
│   │   ├── avatar/
│   │   │   ├── components/
│   │   │   │   ├── TherapistAvatar.tsx
│   │   │   │   ├── AvatarCanvas.tsx
│   │   │   │   └── LipSyncController.tsx
│   │   │   ├── hooks/
│   │   │   │   └── use-avatar-animation.ts
│   │   │   └── animations/           # Idle, listening, speaking state machines
│   │   ├── vision/
│   │   │   ├── components/
│   │   │   │   └── UserCamera.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── use-mediapipe.ts
│   │   │   │   └── use-emotion-tracker.ts
│   │   │   └── analyzers/
│   │   │       ├── face-analyzer.ts
│   │   │       └── crisis-detector.ts
│   │   ├── profile/
│   │   ├── memory/
│   │   │   └── hooks/
│   │   │       └── use-memory-search.ts
│   │   └── crisis/
│   │       ├── components/
│   │       │   └── CrisisOverlay.tsx
│   │       └── crisis-protocol.ts
│   ├── shared/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── constants/
│   └── lib/
│       ├── supabase/
│       ├── redis/
│       ├── livekit/
│       ├── openai/
│       └── clerk/
```

---

## 6. API Service Structure

```
apps/api/
├── src/
│   ├── modules/
│   │   ├── session/
│   │   │   ├── session.controller.ts
│   │   │   ├── session.service.ts
│   │   │   ├── session.gateway.ts    # LiveKit data channel gateway
│   │   │   └── session.module.ts
│   │   ├── ai-therapist/
│   │   │   ├── therapist.service.ts
│   │   │   ├── prompt-builder.ts
│   │   │   ├── response-moderator.ts # OpenAI Moderation API
│   │   │   ├── therapy-frameworks/   # CBT, DBT, ACT, etc. — one file each
│   │   │   └── ai-therapist.module.ts
│   │   ├── vision/
│   │   │   ├── vision.service.ts
│   │   │   ├── vision.controller.ts
│   │   │   └── vision.module.ts
│   │   ├── memory/
│   │   │   ├── memory.service.ts     # pgvector HNSW search + write
│   │   │   └── memory.module.ts
│   │   ├── jobs/                     # Inngest job handlers
│   │   │   ├── post-session.job.ts   # Summary, embeddings, profile update
│   │   │   ├── check-in.job.ts       # Between-session email check-ins
│   │   │   └── jobs.module.ts
│   │   ├── user/
│   │   ├── wearable/
│   │   └── notifications/            # Resend email integration
│   ├── shared/
│   │   ├── guards/
│   │   │   ├── clerk-auth.guard.ts
│   │   │   └── rate-limit.guard.ts
│   │   ├── middleware/
│   │   │   ├── audit-log.middleware.ts  # PHI access logging
│   │   │   └── request-context.middleware.ts
│   │   └── filters/
│   ├── app.module.ts
│   └── main.ts
```

---

## 7. Database Schema (Supabase / PostgreSQL + pgvector)

```sql
-- Users (linked to Clerk user_id)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT,
  feature_flags JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Granular consent tracking (GDPR)
CREATE TABLE user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users ON DELETE CASCADE,
  consent_type TEXT NOT NULL,  -- camera | audio | psychological_data | wearable
  granted BOOLEAN NOT NULL,
  granted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  version TEXT NOT NULL        -- consent policy version
);

-- Psychological profile
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users ON DELETE CASCADE,
  goals TEXT[],
  mental_health_history JSONB,  -- field-level: consider app-level encryption
  therapy_preferences JSONB,
  personality_snapshot JSONB,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'imminent')),
  disclaimer_accepted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users ON DELETE SET NULL,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  session_type TEXT CHECK (session_type IN ('intake', 'regular', 'crisis', 'follow-up')),
  status TEXT CHECK (status IN ('active', 'completed', 'interrupted')),
  summary TEXT,
  soap_notes JSONB,
  homework JSONB,
  token_count INTEGER           -- track LLM usage per session
);

-- Real-time session events
CREATE TABLE session_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  event_type TEXT,  -- emotion_shift | crisis_alert | topic_change | insight
  payload JSONB
);

-- Semantic memory (pgvector) — HNSW indexed
CREATE TABLE session_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users ON DELETE CASCADE,
  session_id UUID REFERENCES sessions ON DELETE SET NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  memory_type TEXT,  -- event | emotion | belief | pattern | progress
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON session_memories
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Audit log (PHI access — HIPAA)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  actor_id TEXT,        -- clerk_id of who accessed
  action TEXT,          -- read | write | delete
  resource TEXT,        -- table name
  resource_id UUID,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT
);

-- Wearable data
CREATE TABLE wearable_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users ON DELETE CASCADE,
  source TEXT,  -- fitbit | garmin | whoop | apple_health
  recorded_at TIMESTAMPTZ,
  heart_rate INTEGER,
  hrv FLOAT,
  sleep_hours FLOAT,
  activity_minutes INTEGER,
  stress_score FLOAT,
  raw_payload JSONB
);

-- Crisis logs (NEVER deleted — duty of care)
CREATE TABLE crisis_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users ON DELETE SET NULL,
  session_id UUID REFERENCES sessions ON DELETE SET NULL,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  threat_type TEXT,  -- self_harm | dangerous_object | aggression | verbal
  confidence FLOAT,
  action_taken TEXT,
  resolved_at TIMESTAMPTZ
);
-- RLS: crisis_logs accessible only by safety team role
ALTER TABLE crisis_logs ENABLE ROW LEVEL SECURITY;
```

---

## 8. Real-Time Session Data Flow

```
USER OPENS SESSION PAGE
    ↓
Clerk auth → LiveKit token (Next.js API route, < 100ms)
    ↓
LiveKit Room joined — audio + video + data channels open
    ↓
┌──────────────────────────────────────────────────┐
│                  SESSION ACTIVE                   │
│  LEFT PANEL (avatar)    RIGHT PANEL (camera)      │
│  TherapistAvatar        UserCamera                │
│  React Three Fiber      MediaPipe overlay         │
│  ← blend shapes         → 468 landmarks/frame     │
│  ← lip-sync phonemes    → emotion score (batched) │
│  ← gaze animation       → crisis signal           │
└──────────────────────────────────────────────────┘
    ↓
MEDIAPIPE (client, ~30fps):
  face landmarks → emotion score
  → batched every 2s → Redis (TTL = session + 1h)

OPENAI VISION (server, every 30s or anomaly):
  JPEG frame → NestJS vision.service → semantic desc
  → appended to AI context in Redis

AI THERAPIST TURN (NestJS, triggered by LiveKit transcript):
  1. LiveKit Transcription Plugin → transcript text
  2. pgvector HNSW search → top-5 relevant memories
  3. Redis GET session state + recent emotion batch
  4. Build system prompt (frameworks + profile + context)
  5. GPT-4o mini (streaming) → text chunks
  6. Each chunk → OpenAI Moderation API → if safe: continue
  7. OpenAI TTS (tts-1) → audio chunks → LiveKit
  8. LiveKit data channel → avatar blend shape signals
  9. Avatar lip-sync + emotion mirror in browser

POST SESSION (Inngest async jobs):
  - Generate SOAP notes (GPT-4o mini summarization)
  - Embed key moments → pgvector
  - Update user_profiles (risk level, patterns)
  - Schedule check-in email via Resend (if configured)
```

---

## 9. Scalability Considerations

| Concern | Solution |
|---|---|
| DB connections at scale | Supabase PgBouncer (Transaction mode) via Prisma |
| pgvector search latency | HNSW index; target < 10ms at 10M rows |
| OpenAI Vision rate | Max 2 calls/min/user; circuit breaker on 429 |
| Emotion data write volume | Batch every 2s in client; single Redis HSET |
| Post-session processing | Inngest async jobs; never blocks session end |
| Avatar asset load time | GLB on CDN (Cloudflare R2); progressive loading |
| Global latency | LiveKit Cloud (multi-region); Railway multi-region later |
| LLM token costs | Budget per session; token_count tracked; alerts on spike |
| Session abuse | Rate limit: 5 sessions/hour/user (Redis sliding window) |
| 100k concurrent users | LiveKit Cloud handles WebRTC; Vercel handles HTTP; Railway handles WebSocket |

---

## 10. Tech Stack Summary

### Frontend (apps/web)
- **Next.js 15** (App Router, TypeScript, Server Components)
- **React Three Fiber + drei** (3D avatar)
- **MediaPipe Tasks** (client-side face/body analysis)
- **LiveKit React SDK** (WebRTC + transcription)
- **TailwindCSS + shadcn/ui**
- **Zustand** (client state)
- **TanStack Query** (server state)
- **Zod** (validation)
- **Clerk** (auth)
- **next-intl** (i18n, English only for MVP)
- **Sentry** (error tracking)

### Backend (apps/api)
- **NestJS** (TypeScript, modular)
- **Prisma** (ORM, type-safe, PgBouncer-compatible)
- **LiveKit Server SDK** (room/token/transcription)
- **OpenAI SDK** (GPT-4o mini streaming, TTS, Vision, Embeddings, Moderation)
- **Inngest** (async job queue: post-session processing)
- **Resend** (transactional email)
- **Upstash Redis** (session state, rate limiting)
- **Sentry** (error tracking)

### Infrastructure
- **Turborepo** + **pnpm** (monorepo)
- **Supabase** (PostgreSQL + pgvector + RLS)
- **Upstash** (Redis serverless)
- **Clerk** (authentication)
- **LiveKit Cloud** (WebRTC + transcription)
- **Cloudflare R2** (3D asset CDN)
- **Stripe** (payments — configured, inactive)
- **Resend** (email)
- **Vercel** (web) + **Railway** (API)
- **GitHub Actions** (CI: lint + typecheck + test; CD: auto-deploy on main)

---

## 11. Code Quality Standards

Per `.agent/skills/clean-code-quality/SKILL.md`:
- **Max 300 lines per file** — hard limit
- **Max 50 lines per function/component**
- **Feature-based folder structure** (not type-based)
- **One responsibility per file** (SRP)
- `kebab-case` for files, `PascalCase` for components, `camelCase` for functions
- Types: `IUserProfile`, `TSessionState` (prefixed)
- Constants: `UPPER_SNAKE_CASE`
- Tests: `*.test.ts` alongside source

---

## 12. Security & Privacy

- **Consent:** Granular per-data-type consent UI (GDPR Article 9) — camera, audio, psychological, wearable
- **Disclaimer:** Mandatory "not a licensed therapist" screen before first session
- **Data minimization:** MediaPipe runs client-side — raw video never leaves browser
- **OpenAI data:** Only transcripts + JPEG snapshots sent; pseudonymized where possible
- **Crisis logs:** Never deleted; legal basis documented for GDPR erasure requests; RLS-restricted
- **PHI access:** Audit log via middleware on all sensitive resource access
- **Clerk webhooks:** SVIX signature verification enforced
- **Redis PHI:** Upstash encrypts at rest; TTL set on all session keys
- **Rate limiting:** API guards on session creation (5/hour/user)
- **Future (pre-launch):** BAAs with OpenAI Enterprise, Supabase, Upstash, Clerk, LiveKit

---

## 13. Environment Variables (.env.example)

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=                    # Prisma / PgBouncer connection string

# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# OpenAI
OPENAI_API_KEY=

# LiveKit
LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=

# Inngest
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# Resend
RESEND_API_KEY=

# Stripe (inactive)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=

# Sentry
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# App
NEXT_PUBLIC_APP_URL=
NODE_ENV=
```

---

## 14. Future Roadmap

| Phase | Scope |
|---|---|
| **Web MVP** | Core session, 3D avatar, vision, AI therapist, onboarding, memory |
| **V1** | Wearable integration, homework tracking, progress dashboard, Stripe activation |
| **V2** | Mobile (React Native + Expo) — Apple HealthKit, push notifications |
| **V3** | VR (WebXR) — immersive therapy environment |
| **Compliance** | BAAs, field-level encryption on PHI, HIPAA audit trail tooling |

---

*Design approved: 2026-04-07 — v2.0 post spec-review*
*Next: Implementation Plan*
