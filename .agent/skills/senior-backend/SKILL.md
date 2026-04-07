---
name: senior-backend
description: Comprehensive backend development skill for building scalable API systems using Node.js, Next.js API routes, tRPC, PostgreSQL, Prisma, Redis. Use this skill whenever designing APIs, writing database queries, creating server-side logic, handling authentication, building tRPC routers, optimizing database performance, or any backend/server task.
---

# Senior Backend

## Core Principles
Build secure, scalable, maintainable backend systems. Every API must be: typed end-to-end, secured by default, observable, and resilient.

## Tech Stack (This Project)
- **Runtime:** Node.js (via Next.js serverless)
- **API Layer:** tRPC (type-safe) + Next.js API routes (webhooks, health)
- **Database:** PostgreSQL via Supabase
- **ORM:** Prisma
- **Cache:** Upstash Redis
- **Queue:** Inngest (background jobs)
- **Auth:** NextAuth.js v5

## tRPC Router Patterns

### Router Structure (one file per domain)
```typescript
// server/routers/session.router.ts
import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../trpc';

const createSessionSchema = z.object({
  type: z.enum(['intake', 'standard', 'crisis']),
  scheduledAt: z.string().datetime().optional(),
});

export const sessionRouter = router({
  // Queries — read data
  list: protectedProcedure
    .input(z.object({
      cursor: z.string().optional(),
      limit: z.number().min(1).max(50).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const sessions = await ctx.db.session.findMany({
        where: { userId: ctx.session.user.id },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: 'desc' },
      });
      const hasMore = sessions.length > input.limit;
      return {
        items: sessions.slice(0, input.limit),
        nextCursor: hasMore ? sessions[input.limit - 1].id : undefined,
      };
    }),

  // Mutations — write data
  create: protectedProcedure
    .input(createSessionSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.session.create({
        data: { ...input, userId: ctx.session.user.id },
      });
    }),

  end: protectedProcedure
    .input(z.object({ id: z.string(), summaryNotes: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership before mutation
      const session = await ctx.db.session.findUnique({ where: { id: input.id } });
      if (!session || session.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      return ctx.db.session.update({
        where: { id: input.id },
        data: { endedAt: new Date(), summaryNotes: input.summaryNotes },
      });
    }),
});
```

## Database Patterns (Prisma)

### Query Best Practices
```typescript
// ✅ Select only needed fields (performance)
const user = await db.user.findUnique({
  where: { id },
  select: { id: true, email: true, name: true },  // NOT select: undefined (fetches all)
});

// ✅ Avoid N+1 — use include for relations
const sessions = await db.session.findMany({
  where: { userId },
  include: {
    notes: { orderBy: { createdAt: 'desc' }, take: 1 },
    _count: { select: { crisisEvents: true } },
  },
});

// ❌ N+1 — never do this
const sessions = await db.session.findMany({ where: { userId } });
for (const session of sessions) {
  session.notes = await db.sessionNote.findMany({ where: { sessionId: session.id } }); // N queries!
}

// ✅ Cursor-based pagination for large tables
const items = await db.session.findMany({
  take: limit + 1,
  cursor: cursor ? { id: cursor } : undefined,
  orderBy: { createdAt: 'desc' },
});
```

## Security Practices

### Input Validation — Always Use Zod
```typescript
// Every API input goes through a Zod schema
const schema = z.object({
  email: z.string().email().max(254),
  age: z.number().int().min(18).max(120),
  content: z.string().min(1).max(10000).trim(),
});

// tRPC validates automatically — but also validate at data boundaries
const parsed = schema.safeParse(rawInput);
if (!parsed.success) throw new TRPCError({ code: 'BAD_REQUEST', cause: parsed.error });
```

### Authorization — Always Check Ownership
```typescript
// Every resource mutation must verify the user owns it
async function ensureOwnership(resourceId: string, userId: string) {
  const resource = await db.session.findUnique({
    where: { id: resourceId },
    select: { userId: true },
  });
  if (!resource || resource.userId !== userId) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
  }
}
```

### Rate Limiting
```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { redis } from './redis';

export const sessionCreationLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1h'),  // 5 sessions per hour
  prefix: 'rl:session:create',
});

// In your router:
const { success } = await sessionCreationLimit.limit(ctx.session.user.id);
if (!success) throw new TRPCError({ code: 'TOO_MANY_REQUESTS' });
```

## Error Handling

```typescript
// Custom error classes
import { TRPCError } from '@trpc/server';

// Use appropriate error codes
throw new TRPCError({ code: 'NOT_FOUND', message: 'Session not found' });
throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid input' });
throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });

// Always log server errors with context (not BAD_REQUEST — those are expected)
logger.error('Session creation failed', {
  userId: ctx.session.user.id,
  error: error.message,
  stack: error.stack,
});
```

## Caching Strategy (Redis)

```typescript
// lib/redis.ts
import { Redis } from '@upstash/redis';
export const redis = Redis.fromEnv();

// Pattern: cache with TTL, invalidate on mutation
async function getUserProfile(userId: string) {
  const cacheKey = `profile:${userId}`;
  const cached = await redis.get<UserProfile>(cacheKey);
  if (cached) return cached;

  const profile = await db.psychProfile.findUnique({ where: { userId } });
  await redis.setex(cacheKey, 300, profile);  // 5-minute TTL
  return profile;
}

// Invalidate on update
async function updateProfile(userId: string, data: Partial<UserProfile>) {
  await db.psychProfile.update({ where: { userId }, data });
  await redis.del(`profile:${userId}`);  // Clear cache
}
```

## Common Backend Commands
```bash
npx prisma migrate dev          # Create and apply migration
npx prisma migrate deploy       # Apply migrations in production
npx prisma studio               # Visual DB explorer
npx prisma generate             # Regenerate Prisma client after schema change
npx prisma db seed              # Run seed file
npm run type-check              # Verify types server-side
```
