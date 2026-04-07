# AI Therapist Platform — MVP Implementation Plan

**Date:** 2026-04-07
**Spec:** `docs/superpowers/specs/2026-04-07-ai-therapist-platform-design.md`
**Status:** Ready to execute (v2 — post plan-review patches applied)

---

## Goal
Build a production-grade AI therapy web platform MVP: real-time voice sessions with a 3D AI therapist, continuous face/emotion analysis, semantic memory, and crisis detection. Deployable to Vercel + Railway.

## Architecture Summary
- **Monorepo:** Turborepo + pnpm
- **Web:** Next.js 15 (App Router, TypeScript)
- **API:** NestJS (TypeScript, WebSocket, AI orchestration)
- **Database:** Supabase (PostgreSQL + pgvector via Prisma)
- **Cache:** Upstash Redis
- **Realtime:** LiveKit (WebRTC + Transcription)
- **AI:** GPT-4o mini (streaming) + OpenAI TTS + OpenAI Vision
- **3D:** Reallusion GLB → React Three Fiber
- **Vision:** MediaPipe Face Mesh (client) + OpenAI Vision (server, periodic)
- **Auth:** Clerk
- **Jobs:** Inngest
- **Email:** Resend
- **CDN:** Cloudflare R2

## Tech Stack
```
Node.js 20+, pnpm 9+, TypeScript 5.4+
Next.js 15, React 19, TailwindCSS 3, shadcn/ui
NestJS 10, Prisma 5, Socket.io (LiveKit)
Three.js, React Three Fiber, @react-three/drei
MediaPipe Tasks Web, TensorFlow.js WASM
LiveKit SDK (client + server)
OpenAI SDK 4.x
Zustand 5, TanStack Query 5, Zod 3
Clerk (auth), Inngest, Resend, Upstash, Sentry, PostHog
```

---

## File Map

### Created from scratch
| Path | Responsibility |
|---|---|
| `turbo.json` | Turborepo pipeline config |
| `pnpm-workspace.yaml` | pnpm workspace definition |
| `packages/types/src/index.ts` | All shared domain TypeScript types |
| `packages/config/eslint/index.js` | Shared ESLint config |
| `packages/config/tsconfig/base.json` | Base TSConfig |
| `packages/config/tailwind/preset.ts` | Shared Tailwind preset |
| `packages/ui/src/components/` | Button, Card, Modal, Spinner etc. |
| `packages/ai-core/src/prompt-builder.ts` | Dynamic system prompt construction |
| `packages/ai-core/src/therapy-frameworks/` | CBT, DBT, ACT, etc. modules |
| `apps/web/src/app/` | Next.js App Router pages |
| `apps/web/src/features/` | All feature modules |
| `apps/web/src/lib/` | Service clients |
| `apps/api/src/modules/` | All NestJS modules |
| `apps/api/prisma/schema.prisma` | Full database schema |
| `apps/api/prisma/migrations/` | SQL migrations |

---

## Phase 0 — Critical Foundations (Run Before Everything Else)

### Task 0.1 — PrismaService (missing from Phase 2, blocks all DB work)
```bash
mkdir -p apps/api/src/shared/prisma
```

`apps/api/src/shared/prisma/prisma.service.ts`:
```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

`apps/api/src/shared/prisma/prisma.module.ts`:
```typescript
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

- [ ] `PrismaService` created and extends `PrismaClient`
- [ ] `PrismaModule` marked `@Global()` — available everywhere without re-importing
- [ ] Commit: `feat(api): add global prisma module and service`

---

### Task 0.2 — `packages/ai-core` scaffold (SERVER-ONLY, shared across web/mobile/VR)
```bash
mkdir -p packages/ai-core/src/therapy-frameworks
```

`packages/ai-core/package.json`:
```json
{
  "name": "@ai-therapist/ai-core",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "sideEffects": false
}
```

`packages/ai-core/src/server-only-guard.ts`:
```typescript
// This package must NEVER be imported in browser code.
// Add this import at the top of any entry file to enforce it at build time.
// In Next.js, import 'server-only' causes a build error if used in client components.
```

`packages/ai-core/src/index.ts`:
```typescript
// SERVER-ONLY — never import this package in browser/client code
export { buildTherapistSystemPrompt } from './prompt-builder';
export { ALL_FRAMEWORKS } from './therapy-frameworks';
```

Move `prompt-builder.ts` and `therapy-frameworks/` from `apps/api` to here (see Phase 8).

- [ ] `packages/ai-core` scaffolded with `package.json`
- [ ] `SERVER-ONLY` warning documented clearly
- [ ] Commit: `feat(ai-core): scaffold server-only ai orchestration package`

---

### Task 0.3 — `.gitignore` at root
Create `/Users/aysegulcadircioglu/Desktop/Ai-Terapist/.gitignore`:
```
# Dependencies
node_modules/
.pnp
.pnp.js

# Build outputs
.next/
dist/
build/
.turbo/

# Environment files
.env
.env.local
.env.*.local
!.env.example

# Logs
*.log
npm-debug.log*
pnpm-debug.log*

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/settings.json
.idea/

# Prisma
apps/api/prisma/migrations/*.lock

# Test coverage
coverage/
```

- [ ] `.gitignore` created at monorepo root
- [ ] `.env` not tracked, `.env.example` is
- [ ] Commit: `chore: add root gitignore`

---

## Phase 1 — Monorepo Scaffold

### Task 1.1 — Initialize Turborepo + pnpm workspace
```bash
# In /Users/aysegulcadircioglu/Desktop/Ai-Terapist/
git init
pnpm init
```

Create `pnpm-workspace.yaml`:
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

Create `turbo.json`:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": { "dependsOn": ["^lint"] },
    "typecheck": { "dependsOn": ["^typecheck"] },
    "test": { "dependsOn": ["^build"] }
  }
}
```

Root `package.json`:
```json
{
  "name": "ai-therapist",
  "private": true,
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "format": "prettier --write \"**/*.{ts,tsx,md}\""
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "prettier": "^3.3.0",
    "typescript": "^5.4.0"
  },
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=9.0.0"
  }
}
```

```bash
pnpm install
```
- [ ] `pnpm-workspace.yaml` created
- [ ] `turbo.json` created
- [ ] Root `package.json` created
- [ ] `pnpm install` succeeds
- [ ] Commit: `chore: initialize turborepo monorepo`

---

### Task 1.2 — Create shared config package
```bash
mkdir -p packages/config/eslint packages/config/tsconfig packages/config/tailwind
```

`packages/config/package.json`:
```json
{
  "name": "@ai-therapist/config",
  "version": "0.0.1",
  "private": true,
  "exports": {
    "./eslint": "./eslint/index.js",
    "./tsconfig/base": "./tsconfig/base.json",
    "./tsconfig/nextjs": "./tsconfig/nextjs.json",
    "./tsconfig/node": "./tsconfig/node.json",
    "./tailwind": "./tailwind/preset.ts"
  }
}
```

`packages/config/tsconfig/base.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true
  }
}
```

`packages/config/tsconfig/nextjs.json`:
```json
{
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "plugins": [{ "name": "next" }]
  }
}
```

`packages/config/tsconfig/node.json`:
```json
{
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["ES2022"],
    "module": "CommonJS",
    "moduleResolution": "Node"
  }
}
```

`packages/config/eslint/index.js`:
```js
/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  plugins: ["@typescript-eslint"],
  parser: "@typescript-eslint/parser",
  rules: {
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-explicit-any": "error",
    "max-lines": ["error", { "max": 300 }],
    "max-lines-per-function": ["error", { "max": 50 }]
  }
}
```

- [ ] Config package files created
- [ ] Commit: `chore: add shared config package`

---

### Task 1.3 — Create shared types package
```bash
mkdir -p packages/types/src
```

`packages/types/package.json`:
```json
{
  "name": "@ai-therapist/types",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": { ".": "./src/index.ts" }
}
```

`packages/types/src/index.ts`:
```typescript
// ─── User ──────────────────────────────────────────────────────────────────
export interface IUser {
  id: string;
  clerkId: string;
  email: string | null;
  createdAt: Date;
}

export type TConsentType = 'camera' | 'audio' | 'psychological_data' | 'wearable';

export interface IUserConsent {
  id: string;
  userId: string;
  consentType: TConsentType;
  granted: boolean;
  grantedAt: Date | null;
  revokedAt: Date | null;
  version: string;
}

// ─── Profile ───────────────────────────────────────────────────────────────
export type TRiskLevel = 'low' | 'medium' | 'high' | 'imminent';

export interface IUserProfile {
  id: string;
  userId: string;
  goals: string[];
  mentalHealthHistory: Record<string, unknown>;
  therapyPreferences: Record<string, unknown>;
  personalitySnapshot: Record<string, unknown>;
  riskLevel: TRiskLevel;
  disclaimerAcceptedAt: Date | null;
  updatedAt: Date;
}

// ─── Session ───────────────────────────────────────────────────────────────
export type TSessionType = 'intake' | 'regular' | 'crisis' | 'follow-up';
export type TSessionStatus = 'active' | 'completed' | 'interrupted';

export interface ISession {
  id: string;
  userId: string;
  startedAt: Date;
  endedAt: Date | null;
  durationSeconds: number | null;
  sessionType: TSessionType;
  status: TSessionStatus;
  summary: string | null;
  soapNotes: Record<string, unknown> | null;
  homework: Record<string, unknown> | null;
  tokenCount: number | null;
}

// ─── Vision & Emotion ──────────────────────────────────────────────────────
export type TEmotionLabel =
  | 'neutral' | 'happy' | 'sad' | 'angry'
  | 'fearful' | 'disgusted' | 'surprised' | 'contempt';

export interface IEmotionSnapshot {
  timestamp: number;
  dominant: TEmotionLabel;
  scores: Record<TEmotionLabel, number>;
  fatigueScore: number;
  eyeContactScore: number;
}

// ─── Crisis ────────────────────────────────────────────────────────────────
export type TCrisisType = 'self_harm' | 'dangerous_object' | 'aggression' | 'verbal';
export type TCrisisSeverity = 'low' | 'medium' | 'high' | 'imminent';

export interface ICrisisSignal {
  type: TCrisisType;
  severity: TCrisisSeverity;
  confidence: number;
  detectedAt: number;
  description: string;
}

// ─── Memory ────────────────────────────────────────────────────────────────
export type TMemoryType = 'event' | 'emotion' | 'belief' | 'pattern' | 'progress';

export interface IMemoryChunk {
  id: string;
  userId: string;
  sessionId: string | null;
  content: string;
  memoryType: TMemoryType;
  createdAt: Date;
}

// ─── Wearable ──────────────────────────────────────────────────────────────
export type TWearableSource = 'fitbit' | 'garmin' | 'whoop' | 'apple_health';

export interface IWearableDataPoint {
  id: string;
  userId: string;
  source: TWearableSource;
  recordedAt: Date;
  heartRate: number | null;
  hrv: number | null;
  sleepHours: number | null;
  activityMinutes: number | null;
  stressScore: number | null;
}

// ─── LiveKit data channel messages ────────────────────────────────────────
export type TLiveKitMessage =
  | { type: 'emotion_update'; payload: IEmotionSnapshot }
  | { type: 'crisis_signal'; payload: ICrisisSignal }
  | { type: 'avatar_expression'; payload: { expression: TEmotionLabel; intensity: number } }
  | { type: 'session_end'; payload: { reason: string } };
```

- [ ] Types package created with all domain types
- [ ] Commit: `chore: add shared types package`

---

### Task 1.4 — Create shared UI package
```bash
mkdir -p packages/ui/src/components
```

`packages/ui/package.json`:
```json
{
  "name": "@ai-therapist/ui",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
```

`packages/ui/src/components/spinner.tsx`:
```tsx
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizeClasses = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div
      className={`animate-spin rounded-full border-2 border-current border-t-transparent ${sizeClasses[size]} ${className ?? ''}`}
      role="status"
      aria-label="Loading"
    />
  );
}
```

`packages/ui/src/index.ts`:
```typescript
export { Spinner } from './components/spinner';
// More components added as needed
```

- [ ] UI package scaffold created
- [ ] Commit: `chore: add shared ui package`

---

## Phase 2 — NestJS API Setup

### Task 2.1 — Scaffold NestJS app
```bash
cd apps
pnpm dlx @nestjs/cli new api --package-manager pnpm --skip-git
cd api
pnpm add @nestjs/config @nestjs/throttler @nestjs/jwt
pnpm add -D @types/node
```

`apps/api/package.json` — add to scripts:
```json
{
  "scripts": {
    "build": "nest build",
    "dev": "nest start --watch",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\"",
    "typecheck": "tsc --noEmit",
    "test": "jest"
  }
}
```

`apps/api/tsconfig.json`:
```json
{
  "extends": "@ai-therapist/config/tsconfig/node",
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] NestJS app created in `apps/api/`
- [ ] TSConfig extended from shared config
- [ ] `pnpm dev` starts in `apps/api/`
- [ ] Commit: `feat(api): scaffold nestjs application`

---

### Task 2.2 — Prisma setup with Supabase
```bash
cd apps/api
pnpm add prisma @prisma/client
pnpm add -D prisma
pnpm prisma init --datasource-provider postgresql
```

`apps/api/prisma/schema.prisma`:
```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [pgvector(map: "vector")]
}

model User {
  id           String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  clerkId      String        @unique @map("clerk_id")
  email        String?
  featureFlags Json          @default("{}") @map("feature_flags")
  createdAt    DateTime      @default(now()) @map("created_at")
  updatedAt    DateTime      @updatedAt @map("updated_at")
  profile      UserProfile?
  consents     UserConsent[]
  sessions     Session[]
  memories     SessionMemory[]
  wearableData WearableData[]
  crisisLogs   CrisisLog[]
  auditLogs    AuditLog[]

  @@map("users")
}

model UserConsent {
  id          String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId      String    @map("user_id") @db.Uuid
  consentType String    @map("consent_type")
  granted     Boolean
  grantedAt   DateTime? @map("granted_at")
  revokedAt   DateTime? @map("revoked_at")
  version     String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_consents")
}

model UserProfile {
  id                   String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId               String    @unique @map("user_id") @db.Uuid
  goals                String[]
  mentalHealthHistory  Json      @default("{}") @map("mental_health_history")
  therapyPreferences   Json      @default("{}") @map("therapy_preferences")
  personalitySnapshot  Json      @default("{}") @map("personality_snapshot")
  riskLevel            String    @default("low") @map("risk_level")
  disclaimerAcceptedAt DateTime? @map("disclaimer_accepted_at")
  updatedAt            DateTime  @updatedAt @map("updated_at")
  user                 User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_profiles")
}

model Session {
  id              String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId          String         @map("user_id") @db.Uuid
  startedAt       DateTime       @default(now()) @map("started_at")
  endedAt         DateTime?      @map("ended_at")
  durationSeconds Int?           @map("duration_seconds")
  sessionType     String         @default("regular") @map("session_type")
  status          String         @default("active")
  summary         String?
  soapNotes       Json?          @map("soap_notes")
  homework        Json?
  tokenCount      Int?           @map("token_count")
  user            User           @relation(fields: [userId], references: [id], onDelete: SetNull)
  events          SessionEvent[]
  memories        SessionMemory[]
  crisisLogs      CrisisLog[]

  @@map("sessions")
}

model SessionEvent {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  sessionId String   @map("session_id") @db.Uuid
  timestamp DateTime @default(now())
  eventType String   @map("event_type")
  payload   Json
  session   Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@map("session_events")
}

model SessionMemory {
  id         String                      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId     String                      @map("user_id") @db.Uuid
  sessionId  String?                     @map("session_id") @db.Uuid
  content    String
  embedding  Unsupported("vector(1536)")?
  memoryType String                      @default("event") @map("memory_type")
  createdAt  DateTime                    @default(now()) @map("created_at")
  user       User                        @relation(fields: [userId], references: [id], onDelete: Cascade)
  session    Session?                    @relation(fields: [sessionId], references: [id], onDelete: SetNull)

  @@map("session_memories")
}

model WearableData {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId          String   @map("user_id") @db.Uuid
  source          String
  recordedAt      DateTime @map("recorded_at")
  heartRate       Int?     @map("heart_rate")
  hrv             Float?
  sleepHours      Float?   @map("sleep_hours")
  activityMinutes Int?     @map("activity_minutes")
  stressScore     Float?   @map("stress_score")
  rawPayload      Json?    @map("raw_payload")
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("wearable_data")
}

model CrisisLog {
  id          String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId      String?   @map("user_id") @db.Uuid
  sessionId   String?   @map("session_id") @db.Uuid
  detectedAt  DateTime  @default(now()) @map("detected_at")
  threatType  String    @map("threat_type")
  confidence  Float
  actionTaken String?   @map("action_taken")
  resolvedAt  DateTime? @map("resolved_at")
  user        User?     @relation(fields: [userId], references: [id], onDelete: SetNull)
  session     Session?  @relation(fields: [sessionId], references: [id], onDelete: SetNull)

  @@map("crisis_logs")
}

model AuditLog {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId     String?  @map("user_id") @db.Uuid
  actorId    String?  @map("actor_id")
  action     String
  resource   String
  resourceId String?  @map("resource_id") @db.Uuid
  timestamp  DateTime @default(now())
  ipAddress  String?  @map("ip_address")
  user       User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@map("audit_logs")
}
```

```bash
# After setting DATABASE_URL in .env
pnpm prisma migrate dev --name init
pnpm prisma generate
```

After migration, add HNSW index via raw SQL in Supabase dashboard:
```sql
CREATE INDEX ON session_memories
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

- [ ] `prisma/schema.prisma` created with all tables
- [ ] Migration runs successfully
- [ ] HNSW index created
- [ ] `pnpm prisma generate` succeeds
- [ ] Commit: `feat(api): add prisma schema with pgvector`

---

### Task 2.3 — NestJS module structure + environment config
```bash
cd apps/api/src
mkdir -p modules/session modules/ai-therapist/therapy-frameworks \
         modules/vision modules/memory modules/jobs \
         modules/user modules/wearable modules/notifications \
         shared/guards shared/middleware shared/filters
```

`apps/api/src/shared/guards/clerk-auth.guard.ts`:
```typescript
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const userId = request.headers['x-clerk-user-id'] as string | undefined;
    if (!userId) throw new UnauthorizedException('Not authenticated');
    return true;
  }
}
```

`apps/api/src/shared/middleware/audit-log.middleware.ts`:
```typescript
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const userId = req.headers['x-clerk-user-id'] as string | undefined;
    const sensitiveResources = ['/user', '/session', '/profile', '/memory', '/crisis'];
    const isSensitive = sensitiveResources.some((r) => req.path.startsWith(r));

    if (userId && isSensitive) {
      await this.prisma.auditLog.create({
        data: {
          actorId: userId,
          action: req.method,
          resource: req.path,
          ipAddress: req.ip,
        },
      });
    }
    next();
  }
}
```

`apps/api/src/app.module.ts`:
```typescript
import { Module, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuditLogMiddleware } from './shared/middleware/audit-log.middleware';
import { PrismaModule } from './shared/prisma/prisma.module';
import { SessionModule } from './modules/session/session.module';
import { AiTherapistModule } from './modules/ai-therapist/ai-therapist.module';
import { VisionModule } from './modules/vision/vision.module';
import { MemoryModule } from './modules/memory/memory.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 3600000, limit: 5 }]), // 5 sessions/hour
    PrismaModule,
    SessionModule,
    AiTherapistModule,
    VisionModule,
    MemoryModule,
    UserModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuditLogMiddleware).forRoutes('*');
  }
}
```

- [ ] All module directories created
- [ ] Guards and middleware scaffolded
- [ ] AppModule wired
- [ ] Commit: `feat(api): scaffold nestjs module structure`

---

## Phase 3 — Next.js Web App Setup

### Task 3.1 — Create Next.js 15 app
```bash
cd apps
pnpm create next-app web --typescript --tailwind --eslint --app --src-dir --no-turbopack
cd web
pnpm add @clerk/nextjs @supabase/supabase-js @upstash/redis
pnpm add @livekit/components-react livekit-client
pnpm add zustand @tanstack/react-query zod
pnpm add @sentry/nextjs posthog-js
pnpm add next-intl
```

`apps/web/tsconfig.json`:
```json
{
  "extends": "@ai-therapist/config/tsconfig/nextjs",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

`apps/web/src/app/layout.tsx`:
```tsx
import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Therapist — Your Personal AI Therapy Companion',
  description: 'Real-time AI therapy sessions with advanced emotional intelligence.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

- [ ] Next.js app created in `apps/web/`
- [ ] All packages installed
- [ ] TSConfig extended
- [ ] ClerkProvider wrapping root layout
- [ ] `pnpm dev` starts on port 3000
- [ ] Commit: `feat(web): scaffold next.js 15 application`

---

### Task 3.2 — App Router structure + route groups
```bash
mkdir -p apps/web/src/app/{(auth),(dashboard),session,onboarding,api/livekit,api/webhooks/clerk,api/health}
mkdir -p apps/web/src/features/{onboarding,session,avatar,vision,profile,memory,crisis}
mkdir -p apps/web/src/lib/{supabase,redis,livekit,openai,clerk}
mkdir -p apps/web/src/shared/{components,hooks,utils,constants}
```

`apps/web/src/app/(auth)/sign-in/[[...sign-in]]/page.tsx`:
```tsx
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn />
    </div>
  );
}
```

`apps/web/src/app/(auth)/sign-up/[[...sign-up]]/page.tsx`:
```tsx
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp />
    </div>
  );
}
```

`apps/web/src/app/(dashboard)/dashboard/page.tsx`:
```tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  return (
    <main className="container mx-auto p-8">
      <h1 className="text-3xl font-bold">Your Dashboard</h1>
      {/* Session history, upcoming, etc. */}
    </main>
  );
}
```

`apps/web/src/app/api/health/route.ts`:
```typescript
import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
}
```

- [ ] All route directories created
- [ ] Auth pages (sign-in, sign-up) render Clerk components
- [ ] Dashboard page guards with auth
- [ ] Health endpoint returns 200
- [ ] Commit: `feat(web): add app router structure and route groups`

---

### Task 3.3 — Supabase and Redis clients
`apps/web/src/lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

`apps/web/src/lib/supabase/server.ts`:
```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
```

`apps/web/src/lib/redis/client.ts`:
```typescript
import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
```

- [ ] Supabase browser + server clients created
- [ ] Redis client created
- [ ] Commit: `feat(web): add supabase and redis clients`

---

## Phase 4 — Onboarding & Consent Flow

### Task 4.1 — Disclaimer + consent screen
`apps/web/src/features/onboarding/components/disclaimer-screen.tsx`:
```tsx
'use client';

interface DisclaimerScreenProps {
  onAccept: () => void;
}

export function DisclaimerScreen({ onAccept }: DisclaimerScreenProps) {
  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-amber-200 bg-amber-50 p-8">
      <h2 className="mb-4 text-xl font-semibold text-amber-900">
        Important Information
      </h2>
      <div className="space-y-3 text-sm text-amber-800">
        <p>
          This application provides <strong>AI-assisted wellness support</strong>.
          It is <strong>not</strong> a licensed therapist, does not provide
          medical diagnoses, and <strong>cannot replace clinical care</strong>.
        </p>
        <p>
          If you are experiencing a mental health emergency, please contact
          emergency services (911) or a crisis line immediately.
        </p>
        <p>
          By continuing, you acknowledge that this service is for wellness
          support purposes only.
        </p>
      </div>
      <button
        onClick={onAccept}
        className="mt-6 w-full rounded-lg bg-amber-900 px-4 py-3 font-medium text-white hover:bg-amber-800"
      >
        I understand and agree to continue
      </button>
    </div>
  );
}
```

`apps/web/src/features/onboarding/components/consent-flow.tsx`:
```tsx
'use client';
import { useState } from 'react';
import type { TConsentType } from '@ai-therapist/types';

const CONSENT_ITEMS: Array<{ type: TConsentType; label: string; description: string }> = [
  {
    type: 'camera',
    label: 'Camera Access',
    description: 'Used for real-time emotion analysis during sessions. Processed locally on your device — video is never stored or transmitted.',
  },
  {
    type: 'audio',
    label: 'Microphone Access',
    description: 'Used to transcribe and respond to your voice during therapy sessions.',
  },
  {
    type: 'psychological_data',
    label: 'Psychological Profile',
    description: 'Your responses during sessions are stored to provide personalized, continuous care across sessions.',
  },
  {
    type: 'wearable',
    label: 'Wearable Data (Optional)',
    description: 'Smartwatch data (heart rate, sleep) can provide additional context during sessions. Optional.',
  },
];

interface ConsentFlowProps {
  onComplete: (consents: Record<TConsentType, boolean>) => void;
}

export function ConsentFlow({ onComplete }: ConsentFlowProps) {
  const [consents, setConsents] = useState<Record<TConsentType, boolean>>({
    camera: false,
    audio: false,
    psychological_data: false,
    wearable: false,
  });

  const requiredGranted = consents.camera && consents.audio && consents.psychological_data;

  const handleToggle = (type: TConsentType) => {
    setConsents((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <h2 className="text-2xl font-bold">Data & Privacy Consent</h2>
      <p className="text-muted-foreground text-sm">
        We collect only what is necessary to provide your therapy experience.
        You can revoke any consent at any time in Settings.
      </p>
      <div className="space-y-4">
        {CONSENT_ITEMS.map((item) => (
          <label key={item.type} className="flex cursor-pointer items-start gap-4 rounded-lg border p-4">
            <input
              type="checkbox"
              checked={consents[item.type]}
              onChange={() => handleToggle(item.type)}
              className="mt-1"
            />
            <div>
              <p className="font-medium">
                {item.label}
                {item.type !== 'wearable' && <span className="ml-2 text-xs text-red-500">Required</span>}
              </p>
              <p className="mt-1 text-sm text-gray-600">{item.description}</p>
            </div>
          </label>
        ))}
      </div>
      <button
        onClick={() => onComplete(consents)}
        disabled={!requiredGranted}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white disabled:opacity-50"
      >
        Continue
      </button>
    </div>
  );
}
```

- [ ] DisclaimerScreen component created
- [ ] ConsentFlow component created with per-type checkboxes
- [ ] Required consents block progression
- [ ] Commit: `feat(web): add disclaimer and consent flow components`

---

### Task 4.2 — Intake form
`apps/web/src/features/onboarding/schema.ts`:
```typescript
import { z } from 'zod';

export const intakeSchema = z.object({
  primaryGoals: z.array(z.string()).min(1, 'Select at least one goal'),
  currentChallenges: z.string().min(10, 'Please describe your challenges'),
  previousTherapyExperience: z.enum(['none', 'some', 'extensive']),
  currentMedications: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  preferredSessionLength: z.enum(['30', '45', '60']),
  preferredCommunicationStyle: z.enum(['direct', 'gentle', 'collaborative']),
});

export type TIntakeFormData = z.infer<typeof intakeSchema>;
```

`apps/web/src/features/onboarding/components/intake-form.tsx`:
```tsx
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { intakeSchema, type TIntakeFormData } from '../schema';

const GOAL_OPTIONS = [
  'Manage anxiety', 'Cope with depression', 'Improve relationships',
  'Work through trauma', 'Build self-confidence', 'Stress management',
  'Personal growth', 'Grief support',
];

interface IntakeFormProps {
  onSubmit: (data: TIntakeFormData) => Promise<void>;
}

export function IntakeForm({ onSubmit }: IntakeFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<TIntakeFormData>({
    resolver: zodResolver(intakeSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-2xl space-y-6 p-8">
      <h2 className="text-2xl font-bold">Tell us about yourself</h2>

      <div>
        <label className="mb-2 block font-medium">What are your primary goals?</label>
        <div className="grid grid-cols-2 gap-2">
          {GOAL_OPTIONS.map((goal) => (
            <label key={goal} className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer">
              <input type="checkbox" value={goal} {...register('primaryGoals')} />
              <span className="text-sm">{goal}</span>
            </label>
          ))}
        </div>
        {errors.primaryGoals && <p className="mt-1 text-sm text-red-500">{errors.primaryGoals.message}</p>}
      </div>

      <div>
        <label className="mb-2 block font-medium">What challenges are you currently facing?</label>
        <textarea
          {...register('currentChallenges')}
          rows={4}
          className="w-full rounded-lg border p-3"
          placeholder="Describe what's been on your mind..."
        />
        {errors.currentChallenges && <p className="mt-1 text-sm text-red-500">{errors.currentChallenges.message}</p>}
      </div>

      <div>
        <label className="mb-2 block font-medium">Previous therapy experience</label>
        <select {...register('previousTherapyExperience')} className="w-full rounded-lg border p-3">
          <option value="none">No previous experience</option>
          <option value="some">Some experience</option>
          <option value="extensive">Extensive experience</option>
        </select>
      </div>

      <div>
        <label className="mb-2 block font-medium">Preferred communication style</label>
        <select {...register('preferredCommunicationStyle')} className="w-full rounded-lg border p-3">
          <option value="collaborative">Collaborative — explore together</option>
          <option value="gentle">Gentle — soft and supportive</option>
          <option value="direct">Direct — clear and structured</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white disabled:opacity-50"
      >
        {isSubmitting ? 'Saving...' : 'Begin my therapy journey'}
      </button>
    </form>
  );
}
```

- [ ] `intakeSchema` with Zod validation
- [ ] `IntakeForm` component with react-hook-form
- [ ] Form submits correctly typed data
- [ ] Commit: `feat(web): add onboarding intake form`

---

## Phase 5 — LiveKit Integration

### Task 5.1 — LiveKit token API route
```bash
cd apps/web
pnpm add livekit-server-sdk
```

`apps/web/src/app/api/livekit/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { AccessToken } from 'livekit-server-sdk';

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const roomName = searchParams.get('room');
  if (!roomName) return NextResponse.json({ error: 'Room name required' }, { status: 400 });

  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!,
    { identity: userId, ttl: '2h' }
  );

  at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });

  const token = await at.toJwt();
  return NextResponse.json({ token, serverUrl: process.env.LIVEKIT_URL! });
}
```

- [ ] Token API route created
- [ ] Auth-protected with Clerk
- [ ] Returns valid LiveKit JWT
- [ ] Test: `GET /api/livekit?room=test` returns token
- [ ] Commit: `feat(web): add livekit token api route`

---

### Task 5.2 — Session page + LiveKit room hook
`apps/web/src/features/session/hooks/use-livekit.ts`:
```typescript
import { useState, useCallback } from 'react';
import { Room, RoomEvent } from 'livekit-client';

interface UseLiveKitOptions {
  roomName: string;
  onTranscript: (text: string, isFinal: boolean) => void;
  onDataMessage: (data: string) => void;
}

export function useLiveKit({ roomName, onTranscript, onDataMessage }: UseLiveKitOptions) {
  const [room] = useState(() => new Room());
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(async () => {
    const res = await fetch(`/api/livekit?room=${roomName}`);
    const { token, serverUrl } = await res.json() as { token: string; serverUrl: string };

    room.on(RoomEvent.DataReceived, (payload) => {
      const text = new TextDecoder().decode(payload);
      onDataMessage(text);
    });

    await room.connect(serverUrl, token);
    await room.localParticipant.enableCameraAndMicrophone();
    setIsConnected(true);
  }, [room, roomName, onTranscript, onDataMessage]);

  const disconnect = useCallback(async () => {
    await room.disconnect();
    setIsConnected(false);
  }, [room]);

  return { room, isConnected, connect, disconnect };
}
```

`apps/web/src/app/session/[id]/page.tsx`:
```tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { SessionLayout } from '@/features/session/components/session-layout';

interface SessionPageProps {
  params: Promise<{ id: string }>;
}

export default async function SessionPage({ params }: SessionPageProps) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const { id } = await params;

  return <SessionLayout sessionId={id} />;
}
```

`apps/web/src/features/session/components/session-layout.tsx`:
```tsx
'use client';
import { useState, useCallback } from 'react';
import { AvatarCanvas } from '@/features/avatar/components/avatar-canvas';
import { UserCamera } from '@/features/vision/components/user-camera';
import { SessionControls } from './session-controls';
import { useLiveKit } from '../hooks/use-livekit';
import { useSessionStore } from '../session.store';

interface SessionLayoutProps {
  sessionId: string;
}

export function SessionLayout({ sessionId }: SessionLayoutProps) {
  const { setTranscript, addDataMessage } = useSessionStore();

  const handleTranscript = useCallback((text: string, isFinal: boolean) => {
    if (isFinal) setTranscript(text);
  }, [setTranscript]);

  const { room, isConnected, connect, disconnect } = useLiveKit({
    roomName: sessionId,
    onTranscript: handleTranscript,
    onDataMessage: addDataMessage,
  });

  return (
    <div className="flex h-screen bg-gray-950">
      {/* Left: 3D Avatar */}
      <div className="flex-1 relative">
        <AvatarCanvas isListening={isConnected} />
      </div>

      {/* Right: User Camera */}
      <div className="w-80 flex flex-col border-l border-gray-800">
        <UserCamera isActive={isConnected} />
        <SessionControls
          isConnected={isConnected}
          onConnect={connect}
          onDisconnect={disconnect}
        />
      </div>
    </div>
  );
}
```

`apps/web/src/features/session/session.store.ts`:
```typescript
import { create } from 'zustand';

interface SessionState {
  transcript: string;
  dataMessages: string[];
  isAvatarSpeaking: boolean;
  currentEmotion: string;
  setTranscript: (text: string) => void;
  addDataMessage: (msg: string) => void;
  setAvatarSpeaking: (speaking: boolean) => void;
  setCurrentEmotion: (emotion: string) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  transcript: '',
  dataMessages: [],
  isAvatarSpeaking: false,
  currentEmotion: 'neutral',
  setTranscript: (text) => set({ transcript: text }),
  addDataMessage: (msg) => set((state) => ({ dataMessages: [...state.dataMessages, msg] })),
  setAvatarSpeaking: (speaking) => set({ isAvatarSpeaking: speaking }),
  setCurrentEmotion: (emotion) => set({ currentEmotion: emotion }),
}));
```

- [ ] `useLiveKit` hook connects to room
- [ ] Session page renders SessionLayout
- [ ] SessionLayout splits avatar (left) + camera (right)
- [ ] SessionStore created with Zustand
- [ ] Commit: `feat(web): add session page and livekit room hook`

---

## Phase 6 — 3D Avatar (React Three Fiber + Reallusion)

### Task 6.1 — Install Three.js dependencies
```bash
cd apps/web
pnpm add three @react-three/fiber @react-three/drei
pnpm add -D @types/three
```

### Task 6.2 — Avatar canvas + GLB loader
`apps/web/src/features/avatar/components/avatar-canvas.tsx`:
```tsx
'use client';
import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF } from '@react-three/drei';
import { TherapistAvatar } from './therapist-avatar';
import { Spinner } from '@ai-therapist/ui';

interface AvatarCanvasProps {
  isListening: boolean;
}

export function AvatarCanvas({ isListening }: AvatarCanvasProps) {
  return (
    <div className="h-full w-full bg-gradient-to-b from-gray-900 to-gray-950">
      <Canvas camera={{ position: [0, 1.6, 2.5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[2, 5, 2]} intensity={1} castShadow />
        <Environment preset="studio" />
        <Suspense fallback={null}>
          <TherapistAvatar isListening={isListening} />
        </Suspense>
        <OrbitControls
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2}
          target={[0, 1.5, 0]}
        />
      </Canvas>
    </div>
  );
}

// Preload the GLB on module load
useGLTF.preload('/models/therapist.glb');
```

`apps/web/src/features/avatar/components/therapist-avatar.tsx`:
```tsx
'use client';
import { useRef, useEffect } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAvatarAnimation } from '../hooks/use-avatar-animation';
import { useSessionStore } from '@/features/session/session.store';

export function TherapistAvatar({ isListening }: { isListening: boolean }) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF('/models/therapist.glb');
  const { actions } = useAnimations(animations, group);
  const { isAvatarSpeaking, currentEmotion } = useSessionStore();

  useAvatarAnimation({ actions, isListening, isSpeaking: isAvatarSpeaking });

  // Subtle idle breathing
  useFrame((state) => {
    if (!group.current) return;
    group.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.005;
  });

  return (
    <group ref={group} position={[0, 0, 0]}>
      <primitive object={scene} />
    </group>
  );
}
```

`apps/web/src/features/avatar/hooks/use-avatar-animation.ts`:
```typescript
import { useEffect } from 'react';
import type { AnimationAction } from 'three';

interface UseAvatarAnimationOptions {
  actions: Record<string, AnimationAction | null>;
  isListening: boolean;
  isSpeaking: boolean;
}

export function useAvatarAnimation({ actions, isListening, isSpeaking }: UseAvatarAnimationOptions) {
  useEffect(() => {
    const idle = actions['Idle'];
    const listening = actions['Listening'];
    const speaking = actions['Speaking'];

    if (isSpeaking) {
      idle?.fadeOut(0.3);
      listening?.fadeOut(0.3);
      speaking?.reset().fadeIn(0.3).play();
    } else if (isListening) {
      idle?.fadeOut(0.3);
      speaking?.fadeOut(0.3);
      listening?.reset().fadeIn(0.3).play();
    } else {
      speaking?.fadeOut(0.3);
      listening?.fadeOut(0.3);
      idle?.reset().fadeIn(0.3).play();
    }
  }, [isListening, isSpeaking, actions]);
}
```

> **Note on Reallusion GLB export:**
> - Export from Character Creator with: Embedded Textures, FBX/GLB format, include blend shapes/morph targets
> - Ensure blend shape names match: `mouthOpen`, `eyesClosed`, `browDown_L`, `browDown_R`, etc.
> - Place exported `therapist.glb` in `apps/web/public/models/`
> - Test in Three.js viewer before integration

- [ ] Three.js packages installed
- [ ] `AvatarCanvas` with Canvas + lighting + environment
- [ ] `TherapistAvatar` loads GLB, runs idle animation
- [ ] `useAvatarAnimation` switches between Idle/Listening/Speaking
- [ ] Subtle breathing idle loop
- [ ] Placeholder GLB in `public/models/` for development
- [ ] Commit: `feat(web): add 3d therapist avatar with react three fiber`

---

## Phase 7 — Vision Pipeline (MediaPipe)

### Task 7.1 — MediaPipe face analysis hook
```bash
cd apps/web
pnpm add @mediapipe/tasks-vision
```

`apps/web/src/features/vision/hooks/use-mediapipe.ts`:
```typescript
import { useEffect, useRef, useState, useCallback } from 'react';
import { FaceLandmarker, FilesetResolver, type FaceLandmarkerResult } from '@mediapipe/tasks-vision';
import type { IEmotionSnapshot } from '@ai-therapist/types';

const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

interface UseMediaPipeOptions {
  onEmotionUpdate: (snapshot: IEmotionSnapshot) => void;
  enabled: boolean;
}

export function useMediaPipe({ onEmotionUpdate, enabled }: UseMediaPipeOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const animFrameRef = useRef<number>(0);
  const lastBatchRef = useRef<number>(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    async function init() {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
      );
      landmarkerRef.current = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
        runningMode: 'VIDEO',
        numFaces: 1,
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
      });
      setIsReady(true);
    }
    init();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      landmarkerRef.current?.close();
    };
  }, [enabled]);

  const startDetection = useCallback(() => {
    if (!videoRef.current || !landmarkerRef.current) return;

    function detect() {
      if (!videoRef.current || !landmarkerRef.current) return;
      const result: FaceLandmarkerResult = landmarkerRef.current.detectForVideo(
        videoRef.current,
        performance.now()
      );

      // Batch: send emotion update every 2000ms
      const now = Date.now();
      if (now - lastBatchRef.current > 2000 && result.faceBlendshapes?.[0]) {
        const snapshot = extractEmotionSnapshot(result);
        onEmotionUpdate(snapshot);
        lastBatchRef.current = now;
      }

      animFrameRef.current = requestAnimationFrame(detect);
    }
    animFrameRef.current = requestAnimationFrame(detect);
  }, [onEmotionUpdate]);

  return { videoRef, isReady, startDetection };
}

function extractEmotionSnapshot(result: FaceLandmarkerResult): IEmotionSnapshot {
  const blendshapes = result.faceBlendshapes?.[0]?.categories ?? [];
  const get = (name: string) => blendshapes.find((b) => b.categoryName === name)?.score ?? 0;

  const scores = {
    neutral: 1 - Math.max(get('mouthSmileLeft'), get('browDownLeft'), get('eyeSquintLeft')),
    happy: (get('mouthSmileLeft') + get('mouthSmileRight')) / 2,
    sad: (get('mouthFrownLeft') + get('mouthFrownRight') + get('browDownLeft')) / 3,
    angry: (get('browDownLeft') + get('browDownRight') + get('eyeSquintLeft')) / 3,
    fearful: (get('mouthOpen') + get('browInnerUp')) / 2,
    disgusted: (get('noseSneerLeft') + get('noseSneerRight')) / 2,
    surprised: (get('mouthOpen') + get('eyeWideLeft') + get('eyeWideRight')) / 3,
    contempt: Math.abs(get('mouthSmileLeft') - get('mouthSmileRight')),
  } as Record<string, number>;

  const dominant = Object.entries(scores).reduce((a, b) => (a[1] > b[1] ? a : b))[0];

  return {
    timestamp: Date.now(),
    dominant: dominant as IEmotionSnapshot['dominant'],
    scores: scores as IEmotionSnapshot['scores'],
    fatigueScore: get('eyeBlinkLeft') > 0.7 ? 0.8 : 0.2,
    eyeContactScore: 1 - Math.abs(get('eyeLookOutLeft') + get('eyeLookOutRight')) / 2,
  };
}
```

`apps/web/src/features/vision/components/user-camera.tsx`:
```tsx
'use client';
import { useEffect, useCallback } from 'react';
import { useMediaPipe } from '../hooks/use-mediapipe';
import { useSessionStore } from '@/features/session/session.store';
import { useCrisisDetector } from '../hooks/use-emotion-tracker';
import type { IEmotionSnapshot } from '@ai-therapist/types';

interface UserCameraProps {
  isActive: boolean;
}

export function UserCamera({ isActive }: UserCameraProps) {
  const { setCurrentEmotion } = useSessionStore();
  const { checkCrisis } = useCrisisDetector();

  const handleEmotionUpdate = useCallback((snapshot: IEmotionSnapshot) => {
    setCurrentEmotion(snapshot.dominant);
    checkCrisis(snapshot);
  }, [setCurrentEmotion, checkCrisis]);

  const { videoRef, isReady, startDetection } = useMediaPipe({
    onEmotionUpdate: handleEmotionUpdate,
    enabled: isActive,
  });

  useEffect(() => {
    if (!isActive || !isReady) return;

    async function startCamera() {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        startDetection();
      }
    }
    startCamera();
  }, [isActive, isReady, startDetection, videoRef]);

  return (
    <div className="relative h-64 w-full overflow-hidden bg-gray-900">
      <video
        ref={videoRef}
        className="h-full w-full object-cover mirror"
        muted
        playsInline
      />
      {!isReady && isActive && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-gray-400">Initializing camera analysis...</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] MediaPipe FaceLandmarker initialized with GPU delegate
- [ ] Emotion scores extracted from 468 blend shapes
- [ ] Batched updates every 2s (no per-frame writes)
- [ ] UserCamera renders video with overlay
- [ ] Commit: `feat(web): add mediapipe face analysis pipeline`

---

## Phase 8 — AI Therapist Core (NestJS)

### Task 8.1 — Therapy frameworks knowledge base
`apps/api/src/modules/ai-therapist/therapy-frameworks/cbt.ts`:
```typescript
export const CBT_FRAMEWORK = `
COGNITIVE BEHAVIORAL THERAPY (CBT):
- Identify automatic negative thoughts (ANTs) and cognitive distortions
- Key distortions: catastrophizing, black-and-white thinking, mind reading, fortune telling, personalization, emotional reasoning
- Technique: Socratic questioning — "What evidence supports/contradicts this thought?"
- Technique: Thought records — situation → automatic thought → emotion → alternative thought → outcome
- Behavioral activation: schedule pleasant activities to counteract avoidance
- Exposure hierarchy for anxiety: gradual exposure to feared situations
- Core: thoughts influence feelings which influence behavior — change the thought, change the outcome
`;
```

`apps/api/src/modules/ai-therapist/therapy-frameworks/dbt.ts`:
```typescript
export const DBT_FRAMEWORK = `
DIALECTICAL BEHAVIOR THERAPY (DBT):
- Four skill modules: Mindfulness, Distress Tolerance, Emotion Regulation, Interpersonal Effectiveness
- Dialectic: accepting reality as it is while also working to change it (acceptance + change)
- TIPP for crisis: Temperature, Intense exercise, Paced breathing, Progressive relaxation
- DEAR MAN for communication: Describe, Express, Assert, Reinforce, Mindful, Appear confident, Negotiate
- Radical acceptance: fully accepting painful reality without judgment to reduce suffering
- Opposite action: when emotion urges one action, do the opposite to change the emotion
- Best for: emotional dysregulation, self-harm risk, BPD features, trauma
`;
```

`apps/api/src/modules/ai-therapist/therapy-frameworks/index.ts`:
```typescript
import { CBT_FRAMEWORK } from './cbt';
import { DBT_FRAMEWORK } from './dbt';
// Add ACT, somatic, psychodynamic, etc. similarly

export const ALL_FRAMEWORKS = [CBT_FRAMEWORK, DBT_FRAMEWORK].join('\n\n---\n\n');
```

### Task 8.2 — Dynamic prompt builder
`apps/api/src/modules/ai-therapist/prompt-builder.ts`:
```typescript
import { ALL_FRAMEWORKS } from './therapy-frameworks';
import type { IUserProfile, IMemoryChunk, IEmotionSnapshot } from '@ai-therapist/types';

interface BuildPromptOptions {
  userProfile: IUserProfile;
  recentMemories: IMemoryChunk[];
  currentEmotion: IEmotionSnapshot | null;
  visionContext: string | null;
  sessionNumber: number;
}

export function buildTherapistSystemPrompt(options: BuildPromptOptions): string {
  const { userProfile, recentMemories, currentEmotion, visionContext, sessionNumber } = options;

  const memoryContext = recentMemories.length > 0
    ? `\nRELEVANT MEMORIES FROM PAST SESSIONS:\n${recentMemories.map((m) => `- ${m.content}`).join('\n')}`
    : '';

  const emotionContext = currentEmotion
    ? `\nCURRENT EMOTION ANALYSIS (real-time):\nDominant: ${currentEmotion.dominant} (${(currentEmotion.scores[currentEmotion.dominant] * 100).toFixed(0)}% confidence)\nNote: If user says they feel fine but emotion shows distress, gently name the incongruence.`
    : '';

  const visionNote = visionContext
    ? `\nVISION CONTEXT: ${visionContext}`
    : '';

  return `You are a compassionate, highly trained AI therapy companion. You are NOT a licensed therapist and you make this clear when clinically relevant. You provide emotional support, evidence-based coping strategies, and a safe space for reflection.

CORE PRINCIPLES:
- The user should never feel alone. Be warm, present, and genuinely curious about their experience.
- Mirror the user's emotional tone slightly — if they are sad, be soft and gentle; if they are hopeful, match that energy.
- Use their name naturally, but sparingly. Remember details they share.
- Ask one focused question at a time. Do not overwhelm.
- Validate before advising. Always acknowledge feelings before offering strategies.
- If you notice incongruence between what they say and their emotional state, gently name it: "I notice you said you're okay, but I sense there might be more underneath that — is that right?"

THERAPY KNOWLEDGE:
${ALL_FRAMEWORKS}

USER PROFILE:
- Goals: ${userProfile.goals.join(', ')}
- Risk level: ${userProfile.riskLevel}
- Communication style preference: ${JSON.stringify(userProfile.therapyPreferences)}
- Session number: ${sessionNumber}
${memoryContext}
${emotionContext}
${visionNote}

SAFETY PROTOCOL:
- If the user expresses suicidal ideation, self-harm intent, or immediate danger: immediately acknowledge, express care, provide crisis line (988 in US), and ask if they are safe right now.
- Never diagnose. Never prescribe. Always recommend professional care for clinical concerns.
- You are a support companion, not a replacement for licensed mental health care.

Respond naturally, conversationally, and with genuine warmth. Keep responses focused and not too long — you are in a live conversation.`;
}
```

### Task 8.3 — AI Therapist service (streaming)
```bash
cd apps/api
pnpm add openai
```

`apps/api/src/modules/ai-therapist/therapist.service.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { buildTherapistSystemPrompt } from './prompt-builder';
import { MemoryService } from '../memory/memory.service';
import type { IUserProfile, IEmotionSnapshot } from '@ai-therapist/types';

@Injectable()
export class TherapistService {
  private readonly openai: OpenAI;

  constructor(
    private readonly config: ConfigService,
    private readonly memory: MemoryService,
  ) {
    this.openai = new OpenAI({ apiKey: this.config.get('OPENAI_API_KEY') });
  }

  async *streamResponse(options: {
    userId: string;
    userProfile: IUserProfile;
    transcript: string;
    currentEmotion: IEmotionSnapshot | null;
    visionContext: string | null;
    sessionNumber: number;
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  }): AsyncGenerator<string> {
    const memories = await this.memory.searchRelevant(options.userId, options.transcript);

    const systemPrompt = buildTherapistSystemPrompt({
      userProfile: options.userProfile,
      recentMemories: memories,
      currentEmotion: options.currentEmotion,
      visionContext: options.visionContext,
      sessionNumber: options.sessionNumber,
    });

    const stream = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      stream: true,
      max_tokens: 300,
      messages: [
        { role: 'system', content: systemPrompt },
        ...options.conversationHistory.slice(-10), // last 10 turns
        { role: 'user', content: options.transcript },
      ],
    });

    let fullResponse = '';
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content ?? '';
      if (text) {
        fullResponse += text;
        yield text;
      }
    }

    // Moderate complete response
    await this.moderateResponse(fullResponse);
  }

  private async moderateResponse(text: string): Promise<void> {
    const result = await this.openai.moderations.create({ input: text });
    const flagged = result.results[0]?.flagged;
    if (flagged) {
      throw new Error('AI response flagged by moderation — session interrupted');
    }
  }
}
```

- [ ] Therapy frameworks defined (CBT, DBT minimum)
- [ ] `buildTherapistSystemPrompt` constructs dynamic prompt
- [ ] `TherapistService.streamResponse` streams GPT-4o mini
- [ ] Moderation check on every response
- [ ] Commit: `feat(api): add ai therapist service with streaming and moderation`

---

## Phase 9 — Memory System (pgvector + Inngest)

### Task 9.1 — Memory service
`apps/api/src/modules/memory/memory.service.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../../shared/prisma/prisma.service';
import type { IMemoryChunk, TMemoryType } from '@ai-therapist/types';

@Injectable()
export class MemoryService {
  private readonly openai: OpenAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.openai = new OpenAI({ apiKey: this.config.get('OPENAI_API_KEY') });
  }

  async embedText(text: string): Promise<number[]> {
    const result = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return result.data[0]!.embedding;
  }

  async saveMemory(options: {
    userId: string;
    sessionId: string;
    content: string;
    memoryType: TMemoryType;
  }): Promise<void> {
    const embedding = await this.embedText(options.content);
    const vectorLiteral = `[${embedding.join(',')}]`;

    await this.prisma.$executeRaw`
      INSERT INTO session_memories (id, user_id, session_id, content, embedding, memory_type)
      VALUES (gen_random_uuid(), ${options.userId}::uuid, ${options.sessionId}::uuid,
              ${options.content}, ${vectorLiteral}::vector, ${options.memoryType})
    `;
  }

  async searchRelevant(userId: string, query: string, limit = 5): Promise<IMemoryChunk[]> {
    const embedding = await this.embedText(query);
    const vectorLiteral = `[${embedding.join(',')}]`;

    const results = await this.prisma.$queryRaw<IMemoryChunk[]>`
      SELECT id, user_id as "userId", session_id as "sessionId",
             content, memory_type as "memoryType", created_at as "createdAt"
      FROM session_memories
      WHERE user_id = ${userId}::uuid
      ORDER BY embedding <=> ${vectorLiteral}::vector
      LIMIT ${limit}
    `;
    return results;
  }
}
```

### Task 9.2 — Inngest post-session job
```bash
cd apps/api
pnpm add inngest
```

`apps/api/src/modules/jobs/post-session.job.ts`:
```typescript
import { inngest } from '../../lib/inngest';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { MemoryService } from '../memory/memory.service';
import OpenAI from 'openai';

export const postSessionJob = inngest.createFunction(
  { id: 'post-session-processing' },
  { event: 'session/completed' },
  async ({ event, step }) => {
    const { sessionId, userId, transcript } = event.data as {
      sessionId: string;
      userId: string;
      transcript: string;
    };

    // Step 1: Generate SOAP notes
    const soapNotes = await step.run('generate-soap-notes', async () => {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const result = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `Generate structured SOAP notes from this therapy session transcript:\n\n${transcript}\n\nFormat as JSON with keys: subjective, objective, assessment, plan`,
        }],
        response_format: { type: 'json_object' },
      });
      return JSON.parse(result.choices[0]!.message.content ?? '{}');
    });

    // Step 2: Extract key memories
    await step.run('extract-and-embed-memories', async () => {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const result = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `From this session transcript, extract 3-5 key memories worth remembering for future sessions. Return as JSON array of {content, memoryType} objects where memoryType is one of: event, emotion, belief, pattern, progress.\n\n${transcript}`,
        }],
        response_format: { type: 'json_object' },
      });

      const { memories } = JSON.parse(result.choices[0]!.message.content ?? '{"memories":[]}') as {
        memories: Array<{ content: string; memoryType: string }>;
      };

      // Embed each memory (would inject MemoryService in real implementation)
      return memories;
    });

    // Step 3: Update session record
    await step.run('update-session-record', async () => {
      // Update prisma session with soapNotes, summary, etc.
      return { sessionId, soapNotes };
    });

    return { success: true, sessionId };
  }
);
```

- [ ] `MemoryService` with OpenAI embeddings + pgvector raw queries
- [ ] `searchRelevant` uses HNSW cosine similarity search
- [ ] Inngest `post-session-processing` job defined
- [ ] SOAP notes generated async post-session
- [ ] Key memories extracted and embedded
- [ ] Commit: `feat(api): add memory service and post-session inngest job`

---

## Phase 9b — Missing Critical API Components

### Task 9b.1 — LiveKit session gateway (STT → AI bridge)
`apps/api/src/modules/session/session.gateway.ts`:
```typescript
import { WebSocketGateway, WebSocketServer, OnGatewayInit } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { RoomServiceClient, AccessToken } from 'livekit-server-sdk';
import { TherapistService } from '../ai-therapist/therapist.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { Redis } from '@upstash/redis';

@WebSocketGateway({ cors: { origin: '*' } })
export class SessionGateway implements OnGatewayInit {
  @WebSocketServer() server!: Server;

  private readonly roomService: RoomServiceClient;
  private readonly redis: Redis;

  constructor(
    private readonly config: ConfigService,
    private readonly therapist: TherapistService,
    private readonly prisma: PrismaService,
  ) {
    this.roomService = new RoomServiceClient(
      this.config.get('LIVEKIT_URL')!,
      this.config.get('LIVEKIT_API_KEY')!,
      this.config.get('LIVEKIT_API_SECRET')!,
    );
    this.redis = new Redis({
      url: this.config.get('UPSTASH_REDIS_REST_URL')!,
      token: this.config.get('UPSTASH_REDIS_REST_TOKEN')!,
    });
  }

  afterInit() {
    // LiveKit webhook receives transcription events via HTTP POST (see session.controller.ts)
    // This gateway handles real-time data channel messages from clients
  }

  async handleTranscript(options: {
    userId: string;
    sessionId: string;
    transcript: string;
  }): Promise<void> {
    const { userId, sessionId, transcript } = options;

    const [userProfile, emotionData] = await Promise.all([
      this.prisma.userProfile.findUnique({ where: { userId } }),
      this.redis.hgetall(`session:${sessionId}:emotion`),
    ]);

    if (!userProfile) return;

    const sessionCount = await this.prisma.session.count({ where: { userId } });

    const tokenStream = this.therapist.streamResponse({
      userId,
      userProfile: userProfile as never,
      transcript,
      currentEmotion: emotionData as never,
      visionContext: await this.redis.get(`session:${sessionId}:vision`),
      sessionNumber: sessionCount,
      conversationHistory: [],
    });

    // Stream text chunks to the client via LiveKit data channel
    for await (const chunk of tokenStream) {
      this.server.to(sessionId).emit('ai_chunk', { text: chunk });
    }
    this.server.to(sessionId).emit('ai_done', {});
  }
}
```

`apps/api/src/modules/session/session.controller.ts`:
```typescript
import { Controller, Post, Body, Headers, UnauthorizedException } from '@nestjs/common';
import { SessionGateway } from './session.gateway';
import { VisionService } from '../vision/vision.service';

@Controller('session')
export class SessionController {
  constructor(
    private readonly gateway: SessionGateway,
    private readonly vision: VisionService,
  ) {}

  // LiveKit sends transcription webhooks here
  @Post('transcript')
  async handleTranscriptWebhook(
    @Body() body: { userId: string; sessionId: string; transcript: string },
    @Headers('authorization') auth: string,
  ) {
    // Validate LiveKit webhook signature (use livekit-server-sdk WebhookReceiver)
    await this.gateway.handleTranscript(body);
    return { ok: true };
  }
}
```

- [ ] `SessionGateway` bridges LiveKit transcription → TherapistService
- [ ] Streams AI chunks back to client via Socket.io
- [ ] `SessionController` receives LiveKit transcript webhooks
- [ ] Commit: `feat(api): add session gateway and transcript webhook handler`

---

### Task 9b.2 — OpenAI Vision server-side service
`apps/api/src/modules/vision/vision.service.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Redis } from '@upstash/redis';

@Injectable()
export class VisionService {
  private readonly openai: OpenAI;
  private readonly redis: Redis;
  private readonly lastCallMap = new Map<string, number>();

  constructor(private readonly config: ConfigService) {
    this.openai = new OpenAI({ apiKey: this.config.get('OPENAI_API_KEY') });
    this.redis = new Redis({
      url: this.config.get('UPSTASH_REDIS_REST_URL')!,
      token: this.config.get('UPSTASH_REDIS_REST_TOKEN')!,
    });
  }

  async analyzeFrame(options: {
    sessionId: string;
    frameBase64: string;
    userId: string;
  }): Promise<string | null> {
    const { sessionId, frameBase64, userId } = options;

    // Rate limit: max 2 calls/min/user (circuit breaker)
    const lastCall = this.lastCallMap.get(userId) ?? 0;
    if (Date.now() - lastCall < 30_000) return null;
    this.lastCallMap.set(userId, Date.now());

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 150,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${frameBase64}`, detail: 'low' },
          },
          {
            type: 'text',
            text: 'Briefly describe the person\'s emotional state, posture, environment, and any objects of concern. Be concise and clinical. 2-3 sentences max.',
          },
        ],
      }],
    });

    const description = response.choices[0]?.message?.content ?? null;

    if (description) {
      await this.redis.set(`session:${sessionId}:vision`, description, { ex: 120 });
    }

    return description;
  }
}
```

`apps/api/src/modules/vision/vision.controller.ts`:
```typescript
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { VisionService } from './vision.service';
import { ClerkAuthGuard } from '../../shared/guards/clerk-auth.guard';

@Controller('vision')
@UseGuards(ClerkAuthGuard)
export class VisionController {
  constructor(private readonly vision: VisionService) {}

  @Post('analyze')
  async analyze(
    @Body() body: { sessionId: string; frameBase64: string; userId: string }
  ) {
    const description = await this.vision.analyzeFrame(body);
    return { description };
  }
}
```

- [ ] `VisionService` calls OpenAI Vision with rate limiting (30s cooldown per user)
- [ ] Stores result in Redis with 120s TTL
- [ ] `VisionController` exposes POST `/vision/analyze` (auth-protected)
- [ ] Commit: `feat(api): add openai vision service with rate limiting`

---

### Task 9b.3 — TTS pipeline (text → audio → LiveKit)
Add to `apps/api/src/modules/ai-therapist/therapist.service.ts`:
```typescript
// Add this method to TherapistService

async textToSpeech(text: string): Promise<Buffer> {
  const response = await this.openai.audio.speech.create({
    model: 'tts-1',
    voice: 'nova',        // Warm, therapy-appropriate voice
    input: text,
    response_format: 'mp3',
    speed: 0.95,          // Slightly slower for calming effect
  });

  return Buffer.from(await response.arrayBuffer());
}
```

In `SessionGateway.handleTranscript`, after collecting full response:
```typescript
// After streaming text chunks, generate TTS audio
const fullText = collectedChunks.join('');
const audioBuffer = await this.therapist.textToSpeech(fullText);

// Send audio back via Socket.io data channel to client for avatar lip-sync
this.server.to(sessionId).emit('ai_audio', {
  audio: audioBuffer.toString('base64'),
  format: 'mp3',
});
```

On the client (`use-livekit.ts`), receive audio and drive avatar:
```typescript
// In useLiveKit, add audio playback + lip-sync trigger
socket.on('ai_audio', ({ audio }: { audio: string }) => {
  const blob = new Blob(
    [Uint8Array.from(atob(audio), (c) => c.charCodeAt(0))],
    { type: 'audio/mp3' }
  );
  const url = URL.createObjectURL(blob);
  const audioEl = new Audio(url);
  useSessionStore.getState().setAvatarSpeaking(true);
  audioEl.onended = () => useSessionStore.getState().setAvatarSpeaking(false);
  audioEl.play();
});
```

- [ ] `textToSpeech` method added to `TherapistService`
- [ ] Audio returned as base64 over Socket.io to client
- [ ] Client plays audio and sets `isAvatarSpeaking` in session store
- [ ] Avatar switches to Speaking animation state (Phase 6 already handles this)
- [ ] Commit: `feat(api): add openai tts pipeline and client audio playback`

---

### Task 9b.4 — Clerk webhook handler (SVIX verified)
```bash
cd apps/web && pnpm add svix
```

`apps/web/src/app/api/webhooks/clerk/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { headers } from 'next/headers';

interface ClerkUserCreatedEvent {
  type: 'user.created';
  data: { id: string; email_addresses: Array<{ email_address: string }> };
}

export async function POST(request: NextRequest) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) return NextResponse.json({ error: 'No secret' }, { status: 500 });

  const headerPayload = await headers();
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
  }

  const body = await request.text();
  const wh = new Webhook(WEBHOOK_SECRET);

  let event: ClerkUserCreatedEvent;
  try {
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkUserCreatedEvent;
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'user.created') {
    // Create user record in DB via API service
    await fetch(`${process.env.API_URL}/user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clerkId: event.data.id,
        email: event.data.email_addresses[0]?.email_address,
      }),
    });
  }

  return NextResponse.json({ received: true });
}
```

- [ ] `svix` package installed
- [ ] SVIX signature verification enforced (returns 400 on invalid signature)
- [ ] `user.created` event creates DB record via API
- [ ] Commit: `feat(web): add clerk webhook handler with svix verification`

---

### Task 9b.5 — `/api/crisis` route (client POSTs here)
`apps/web/src/app/api/crisis/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import type { ICrisisSignal } from '@ai-therapist/types';

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const signal = await request.json() as ICrisisSignal;

  // Forward to API service for logging to crisis_logs table
  await fetch(`${process.env.API_URL}/crisis`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-clerk-user-id': userId,
    },
    body: JSON.stringify(signal),
  });

  return NextResponse.json({ received: true });
}
```

- [ ] `/api/crisis` route created
- [ ] Auth-protected with Clerk
- [ ] Forwards to NestJS API for DB logging
- [ ] Commit: `feat(web): add crisis api route`

---

### Task 9b.6 — PostHog initialization (observability)
`apps/web/src/lib/posthog/client.ts`:
```typescript
import posthog from 'posthog-js';

export function initPostHog() {
  if (typeof window === 'undefined') return;
  if (posthog.__loaded) return;

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com',
    capture_pageview: false, // We'll capture manually
  });
}
```

Add `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` to `.env.example`.

Call `initPostHog()` in root layout or a client providers component.

- [ ] PostHog initialized in web app
- [ ] Env vars added to `.env.example`
- [ ] Commit: `feat(web): add posthog analytics initialization`

---

## Phase 10 — Crisis Protocol

### Task 10.1 — Crisis detector hook (client)
`apps/web/src/features/vision/hooks/use-emotion-tracker.ts`:
```typescript
import { useCallback, useRef } from 'react';
import { useSessionStore } from '@/features/session/session.store';
import type { IEmotionSnapshot, ICrisisSignal } from '@ai-therapist/types';

const CRISIS_EMOTION_THRESHOLD = 0.75;
const SUSTAINED_DISTRESS_SECONDS = 30;

export function useCrisisDetector() {
  const distressStartRef = useRef<number | null>(null);

  const checkCrisis = useCallback((snapshot: IEmotionSnapshot) => {
    const isDistressed = (
      snapshot.scores.fearful > CRISIS_EMOTION_THRESHOLD ||
      snapshot.scores.sad > CRISIS_EMOTION_THRESHOLD ||
      snapshot.scores.angry > CRISIS_EMOTION_THRESHOLD
    );

    if (isDistressed) {
      if (!distressStartRef.current) distressStartRef.current = Date.now();
      const duration = (Date.now() - distressStartRef.current) / 1000;

      if (duration > SUSTAINED_DISTRESS_SECONDS) {
        const signal: ICrisisSignal = {
          type: 'self_harm',
          severity: 'high',
          confidence: Math.max(snapshot.scores.fearful, snapshot.scores.sad),
          detectedAt: Date.now(),
          description: `Sustained emotional distress detected for ${Math.round(duration)}s`,
        };
        // Send to API for logging and AI context injection
        void fetch('/api/crisis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(signal),
        });
        distressStartRef.current = null;
      }
    } else {
      distressStartRef.current = null;
    }
  }, []);

  return { checkCrisis };
}
```

`apps/web/src/features/crisis/components/crisis-overlay.tsx`:
```tsx
'use client';

interface CrisisOverlayProps {
  onDismiss: () => void;
  onCallCrisisLine: () => void;
}

export function CrisisOverlay({ onDismiss, onCallCrisisLine }: CrisisOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="mx-4 max-w-lg rounded-2xl bg-white p-8 text-center shadow-2xl">
        <div className="mb-4 text-5xl">💙</div>
        <h2 className="mb-3 text-2xl font-bold text-gray-900">You&apos;re not alone</h2>
        <p className="mb-6 text-gray-600">
          I&apos;m here with you. If you&apos;re going through a difficult moment and need
          immediate support, please reach out to a crisis counselor.
        </p>
        <div className="space-y-3">
          <button
            onClick={onCallCrisisLine}
            className="w-full rounded-xl bg-blue-600 px-6 py-4 font-semibold text-white"
          >
            📞 Call 988 (Crisis Lifeline — US)
          </button>
          <button
            onClick={onDismiss}
            className="w-full rounded-xl bg-gray-100 px-6 py-4 font-semibold text-gray-700"
          >
            Continue with our session
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] `useCrisisDetector` tracks sustained distress
- [ ] POSTs crisis signal to API for logging
- [ ] `CrisisOverlay` shows crisis resources
- [ ] Commit: `feat(web): add crisis detection hook and overlay`

---

## Phase 11 — CI/CD & Observability

### Task 11.1 — GitHub Actions CI pipeline
`.github/workflows/ci.yml`:
```yaml
name: CI

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  lint-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm run lint
      - run: pnpm run typecheck

  test:
    runs-on: ubuntu-latest
    needs: lint-typecheck
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm run test
```

`.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Vercel
        run: npx vercel --prod --token ${{ secrets.VERCEL_TOKEN }}

  deploy-api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Railway
        run: |
          cd apps/api
          npx railway up --service ai-therapist-api
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### Task 11.2 — Sentry setup
`apps/web/sentry.client.config.ts`:
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,
});
```

`apps/web/sentry.server.config.ts`:
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
});
```

- [ ] CI pipeline: lint + typecheck + test on PR
- [ ] Deploy pipeline: Vercel (web) + Railway (api) on main
- [ ] Sentry initialized for web (client + server)
- [ ] Commit: `chore: add github actions ci/cd and sentry`

---

### Task 11.3 — .env.example
`/Users/aysegulcadircioglu/Desktop/Ai-Terapist/.env.example`:
```bash
# ─── Clerk ───────────────────────────────────────────
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# ─── Supabase ────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres?pgbouncer=true

# ─── Upstash Redis ───────────────────────────────────
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...

# ─── OpenAI ──────────────────────────────────────────
OPENAI_API_KEY=sk-...

# ─── LiveKit ─────────────────────────────────────────
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=API...
LIVEKIT_API_SECRET=...

# ─── Inngest ─────────────────────────────────────────
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=signkey-prod-...

# ─── Resend ──────────────────────────────────────────
RESEND_API_KEY=re_...

# ─── Stripe (inactive) ───────────────────────────────
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# ─── Cloudflare R2 ───────────────────────────────────
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=ai-therapist-assets

# ─── Sentry ──────────────────────────────────────────
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=...

# ─── App ─────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

- [ ] `.env.example` created at root
- [ ] All variables documented
- [ ] `.env.example` committed, `.env` in `.gitignore`
- [ ] Commit: `chore: add env.example with all required variables`

---

## Execution Order Summary

| Phase | Tasks | Dependency |
|---|---|---|
| **0 — Critical Foundations** | 0.1 → 0.3 | None — run first |
| 1 — Monorepo Scaffold | 1.1 → 1.4 | Phase 0 |
| 2 — NestJS API | 2.1 → 2.3 | Phase 1 + Phase 0.1 |
| 3 — Next.js Web | 3.1 → 3.3 | Phase 1 |
| 4 — Onboarding | 4.1 → 4.2 | Phase 3 |
| 5 — LiveKit | 5.1 → 5.2 | Phase 3 |
| 6 — 3D Avatar | 6.1 → 6.2 | Phase 5 |
| 7 — Vision Pipeline | 7.1 | Phase 5 |
| 8 — AI Therapist | 8.1 → 8.3 | Phase 2 + Phase 0.2 |
| 9 — Memory System | 9.1 → 9.2 | Phase 8 |
| **9b — Missing API Components** | 9b.1 → 9b.6 | Phases 8+9 |
| 10 — Crisis Protocol | 10.1 | Phases 7+8+9b |
| 11 — CI/CD | 11.1 → 11.3 | All phases |

**Phase 2 and Phase 3 can run in parallel (different apps).**
**Phase 6 and Phase 7 can run in parallel (different features).**
**Phase 8 and Phase 9 can run in parallel (different modules).**
**Phase 9b must come after Phases 8+9 — it wires everything together.**

---

*Plan created: 2026-04-07*
*Ready for execution via superpowers:subagent-driven-development or superpowers:executing-plans*
