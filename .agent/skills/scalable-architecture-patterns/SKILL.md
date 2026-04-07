---
name: scalable-architecture-patterns
description: Enforces professional, team-friendly project architecture, Git workflows, API design, and deployment patterns for a 100k+ user, Vercel-deployed, globally-scaled web application.
---

# Scalable Architecture Patterns Skill

## Overview
This skill governs every architectural decision in the project. It ensures the codebase can be worked on by a team simultaneously without conflicts, handle massive scale, and be maintained without technical debt.

---

## Tech Stack (Recommended for This Project)

### Frontend
- **Framework:** Next.js 14+ (App Router) — optimal for Vercel, supports SSR/SSG/ISR
- **Language:** TypeScript (strict mode) — non-negotiable
- **Styling:** Tailwind CSS — utility-first, design system ready
- **State Management:** Zustand (lightweight) + React Query / TanStack Query (server state)
- **3D Avatar:** Three.js / React Three Fiber (web MVP) → Unreal Engine (future VR)
- **Camera/Vision:** MediaPipe (WASM, runs in browser), face-api.js
- **Real-time:** WebSockets via Ably or Pusher for session streaming
- **Animation:** Framer Motion for UI, Lottie for micro-animations

### Backend
- **API:** Next.js API Routes (serverless) + tRPC for type-safe API layer
- **Database:** PostgreSQL via Supabase (built-in auth, real-time, edge-friendly)
- **ORM:** Prisma — type-safe, team-friendly migrations
- **AI Integration:** OpenAI / Anthropic API via LangChain.js (structured chains)
- **Media Storage:** Cloudinary or AWS S3 + CloudFront CDN
- **Queue:** Inngest or Upstash QStash (for background jobs like session analysis)
- **Email:** Resend (modern, developer-friendly)
- **Caching:** Upstash Redis (edge-compatible, serverless)

### Infrastructure
- **Deployment:** Vercel (frontend + API routes)
- **Database host:** Supabase (managed PostgreSQL)
- **Monitoring:** Sentry (errors) + Vercel Analytics + PostHog (product analytics)
- **CI/CD:** GitHub Actions → auto-deploy to Vercel on PR merge

---

## Folder Structure

```
ai-therapist/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (marketing)/              # Landing, pricing, about pages
│   │   ├── (auth)/                   # Login, signup, onboarding
│   │   ├── (dashboard)/              # User dashboard, history
│   │   ├── session/                  # Live therapy session
│   │   │   └── [sessionId]/
│   │   └── api/                      # API routes
│   │       ├── trpc/
│   │       ├── webhooks/
│   │       └── health/
│   │
│   ├── features/                     # Feature modules (main business logic)
│   │   ├── session/
│   │   │   ├── components/           # Session UI components
│   │   │   ├── hooks/                # useSession, useSessionTimer etc.
│   │   │   ├── services/             # session.service.ts (API calls)
│   │   │   ├── store/                # Zustand session store
│   │   │   ├── types/                # Session-specific types
│   │   │   └── index.ts              # Barrel export
│   │   │
│   │   ├── avatar/                   # 3D AI character system
│   │   ├── vision/                   # Camera + emotion analysis
│   │   ├── crisis/                   # Crisis detection system
│   │   ├── memory/                   # Session memory & profile
│   │   ├── wearable/                 # Smartwatch integration
│   │   └── auth/                     # Authentication feature
│   │
│   ├── shared/
│   │   ├── components/               # Reusable UI components
│   │   │   ├── ui/                   # Button, Card, Modal etc.
│   │   │   └── layout/               # Header, Footer, Sidebar
│   │   ├── hooks/                    # Generic hooks (useDebounce etc.)
│   │   ├── utils/                    # Pure utility functions
│   │   ├── types/                    # Global shared types
│   │   └── constants/                # App-wide constants
│   │
│   ├── lib/
│   │   ├── db/                       # Prisma client + query helpers
│   │   ├── ai/                       # AI chain definitions (LangChain)
│   │   ├── auth/                     # Auth utilities (next-auth config)
│   │   ├── redis/                    # Upstash Redis client
│   │   └── analytics/                # PostHog, Sentry setup
│   │
│   └── server/
│       ├── routers/                  # tRPC routers (one per feature)
│       │   ├── session.router.ts
│       │   ├── profile.router.ts
│       │   └── wearable.router.ts
│       └── trpc.ts                   # tRPC setup
│
├── prisma/
│   ├── schema.prisma                 # Database schema
│   └── migrations/                  # Auto-generated migrations
│
├── public/                          # Static assets
├── tests/                           # E2E tests (Playwright)
│   └── e2e/
├── .github/
│   └── workflows/                   # CI/CD pipelines
├── .env.example                     # Environment variable template (PUBLIC)
├── .env.local                       # Local env (NEVER committed)
└── docs/                            # Team documentation
    ├── ARCHITECTURE.md
    ├── API.md
    └── CONTRIBUTING.md
```

---

## Git Workflow (Team Collaboration)

### Branch Strategy
```
main          → Production (Vercel auto-deploys)
staging       → Pre-production testing
develop       → Integration branch

Feature work:
feature/[ticket]-[short-description]    e.g. feature/AI-42-crisis-detection
fix/[ticket]-[short-description]        e.g. fix/AI-55-session-memory-bug
chore/[description]                     e.g. chore/update-dependencies
```

### PR Rules
- PRs must target `develop` (not `main` directly)
- Maximum 400 lines of change per PR
- Required: PR description with WHAT and WHY
- Required: At least one reviewer approval
- CI must pass (lint + tests)
- No self-merging

### Commit Convention (Conventional Commits)
```
feat: add crisis detection verbal analysis
fix: correct session memory not persisting on refresh
chore: update mediapipe to v0.10
docs: add wearable integration guide
refactor: split session component into sub-components
test: add E2E test for crisis escalation
```

---

## API Design Standards

### tRPC Router Structure
```typescript
// Each router = one domain, one file
// server/routers/session.router.ts
export const sessionRouter = router({
  create: protectedProcedure
    .input(createSessionSchema)
    .mutation(async ({ ctx, input }) => { ... }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => { ... }),

  end: protectedProcedure
    .input(endSessionSchema)
    .mutation(async ({ ctx, input }) => { ... }),
});
```

### Response Consistency
All API responses follow:
```typescript
type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; };
};
```

---

## Scalability Checklist

### Database
- [ ] All queries use indexed columns for WHERE clauses
- [ ] No N+1 queries (use `include` in Prisma, not lazy loading)
- [ ] Pagination on all list endpoints (cursor-based for large tables)
- [ ] Connection pooling via Supabase PgBouncer

### Caching
- [ ] Redis cache for: user profiles, session summaries, frequent AI responses
- [ ] CDN caching for: static assets, avatar 3D models
- [ ] React Query cache for: client-side data (5-min stale time)

### Rate Limiting
- [ ] Upstash Redis-based rate limiting on all API routes
- [ ] Session creation: max 5/hour per user
- [ ] AI calls: rate limited + queued to control costs

### Observability
- [ ] Sentry error tracking with user context
- [ ] Structured logging (JSON format) for all server operations
- [ ] Vercel Analytics for Core Web Vitals monitoring
- [ ] PostHog events for key user actions (session start, crisis detected, etc.)

---

## Environment Variables Pattern

```bash
# .env.example (committed — shows what's needed)
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

# AI
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Real-time
ABLY_API_KEY=

# Storage
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=
SENTRY_DSN=

# Wearables
FITBIT_CLIENT_ID=
FITBIT_CLIENT_SECRET=
```

**Rule:** `.env.local` is NEVER committed. `.env.example` is always updated when new vars are added.
