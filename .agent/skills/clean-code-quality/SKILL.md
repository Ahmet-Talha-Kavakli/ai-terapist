---
name: clean-code-quality
description: Enforces world-class code quality standards — modular architecture, clean naming, SOLID principles, and zero tolerance for monolithic files. Designed for scalable, team-friendly, production-grade codebases.
---

# Clean Code Quality Skill

## Core Principles

### 1. File Size Hard Limits
- **Maximum 300 lines per file.** If a file exceeds this, it MUST be split.
- **Maximum 50 lines per function/component.** Long functions must be decomposed.
- **Maximum 1 responsibility per file** (Single Responsibility Principle).
- NEVER write 1000+ line files. This is a critical failure mode.

### 2. Project Structure
Always use a feature-based folder structure, NOT a type-based one:
```
src/
  features/
    session/        # everything related to therapy sessions
    profile/        # user profile & psychology data
    vision/         # camera analysis
    avatar/         # 3D character logic
    crisis/         # safety detection
  shared/
    components/     # reusable UI components
    hooks/          # reusable React hooks
    utils/          # pure utility functions
    types/          # TypeScript type definitions
    constants/      # app-wide constants
  services/
    api/            # API clients (one file per endpoint group)
    ai/             # AI model integrations
    wearable/       # wearable device integrations
  lib/
    db/             # database client & queries
    auth/           # authentication
    analytics/      # tracking & monitoring
```

### 3. Naming Conventions
- **Files:** `kebab-case.ts` (e.g., `session-controller.ts`)
- **Components:** `PascalCase.tsx` (e.g., `TherapistAvatar.tsx`)
- **Functions/variables:** `camelCase` (e.g., `detectEmotionScore`)
- **Types/Interfaces:** `PascalCase` prefixed — `IUserProfile`, `TSessionState`
- **Constants:** `UPPER_SNAKE_CASE` (e.g., `MAX_SESSION_DURATION`)
- **Tests:** `*.test.ts` alongside the file being tested

### 4. SOLID Principles
- **S**ingle Responsibility: one file = one concern
- **O**pen/Closed: extend via composition, not modification
- **L**iskov Substitution: interfaces must be honored
- **I**nterface Segregation: small, focused interfaces
- **D**ependency Inversion: inject dependencies, don't hardcode

### 5. Component Design (React/Next.js)
- Every component has ONE purpose, clearly named
- Extract all business logic into custom hooks (`useCrisisDetection`, `useSessionMemory`)
- Extract all API calls into service files (`session.service.ts`)
- No raw `fetch` calls inside components — always use service layer
- Use barrel exports (`index.ts`) per feature folder

### 6. TypeScript Standards
- **Strict mode enabled** — no `any` types
- All function parameters and return types must be explicitly typed
- Use `zod` for runtime validation at API boundaries
- Use discriminated unions for state management
- Prefer `interface` for objects, `type` for unions/primitives

### 7. Error Handling
- All async functions must have try/catch with typed errors
- Create custom error classes for domain-specific errors (`TherapySessionError`)
- Never swallow errors silently
- Log errors with context (userId, sessionId, timestamp)

### 8. Code Review Standards
- PRs must be < 400 lines of change
- Every PR needs a description of WHAT and WHY
- No commented-out code in PRs
- All new code requires at least basic tests

### 9. API Design
- RESTful naming: `GET /sessions/:id`, `POST /sessions`, `PATCH /sessions/:id`
- Consistent response format:
```typescript
{
  success: boolean;
  data?: T;
  error?: { code: string; message: string; };
  meta?: { page: number; total: number; };
}
```
- Always version APIs: `/api/v1/`
- Rate limit all public endpoints

### 10. Performance Standards
- No N+1 database queries — always use joins/batch fetches
- Implement pagination for all list endpoints
- Cache heavy computations (Redis for sessions, CDN for assets)
- Lazy load all heavy components (3D avatar, video analysis)
- Target: Core Web Vitals LCP < 2.5s, FID < 100ms, CLS < 0.1

## Anti-Patterns to NEVER Do
- ❌ Single giant component with 500+ lines
- ❌ Hardcoded API keys or secrets in code
- ❌ Business logic inside JSX/TSX return statements
- ❌ `console.log` statements in production code
- ❌ Mutating state directly
- ❌ Prop drilling more than 2 levels deep (use Context or Zustand)
- ❌ `useEffect` with no dependency array for data fetching (use React Query)
- ❌ Mixing UI and data fetching in same component
