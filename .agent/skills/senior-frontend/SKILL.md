---
name: senior-frontend
description: Comprehensive frontend development skill for building modern, performant web applications using React, Next.js, TypeScript, Tailwind CSS. Use this skill whenever building UI components, pages, hooks, frontend architecture, or when asked about React patterns, Next.js optimization, component design, state management, bundle performance, or any frontend task.
---

# Senior Frontend

## Core Principles
Build fast, accessible, maintainable UIs. Every decision should optimize for: user experience, developer experience, and long-term maintainability.

## Tech Stack (This Project)
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript (strict mode — no `any`)
- **Styling:** Tailwind CSS
- **State:** Zustand (client) + TanStack Query (server state)
- **Animation:** Framer Motion
- **Testing:** Vitest + React Testing Library + Playwright (E2E)

## Component Architecture

### Component Design Rules
- One component = one responsibility
- Max ~100 lines per component — split if longer
- Extract business logic into custom hooks
- Extract API calls into service files
- UI components must be pure (no direct API calls)

```typescript
// ✅ CORRECT: Separated concerns
// hooks/useSession.ts — logic lives here
export function useSession(sessionId: string) {
  return useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => sessionService.getById(sessionId),
  });
}

// components/SessionView.tsx — only rendering
export function SessionView({ sessionId }: { sessionId: string }) {
  const { data, isLoading } = useSession(sessionId);
  if (isLoading) return <SessionSkeleton />;
  return <div>{data?.title}</div>;
}

// ❌ WRONG: Mixed concerns
export function SessionView({ sessionId }: { sessionId: string }) {
  const [session, setSession] = useState(null);
  useEffect(() => {
    fetch(`/api/sessions/${sessionId}`).then(r => r.json()).then(setSession);
  }, [sessionId]);
  return <div>{session?.title}</div>;
}
```

## React Patterns

### Data Fetching — Always Use TanStack Query
```typescript
// ✅ Correct
const { data, isLoading, error } = useQuery({
  queryKey: ['users', filters],
  queryFn: () => userService.list(filters),
  staleTime: 5 * 60 * 1000,  // 5 min cache
});

// Mutations
const { mutate } = useMutation({
  mutationFn: userService.create,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
});
```

### State Management — Zustand
```typescript
// store/session.store.ts
interface SessionStore {
  isRecording: boolean;
  currentEmotion: Emotion | null;
  setEmotion: (emotion: Emotion) => void;
  startRecording: () => void;
  stopRecording: () => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  isRecording: false,
  currentEmotion: null,
  setEmotion: (emotion) => set({ currentEmotion: emotion }),
  startRecording: () => set({ isRecording: true }),
  stopRecording: () => set({ isRecording: false }),
}));
```

### Performance Patterns
```typescript
// ✅ Memoize expensive computations
const sortedSessions = useMemo(
  () => sessions.sort((a, b) => b.date.localeCompare(a.date)),
  [sessions]
);

// ✅ Stable callbacks passed as props
const handleSessionEnd = useCallback(() => {
  store.stopRecording();
  router.push('/dashboard');
}, [store, router]);

// ✅ Lazy load heavy components
const TherapistAvatar = dynamic(() => import('@/features/avatar/components/TherapistAvatar'), {
  loading: () => <AvatarSkeleton />,
  ssr: false,  // Avatar needs browser APIs
});
```

## Next.js Best Practices

### App Router Conventions
```typescript
// Server Component (default) — fetch data here
// app/dashboard/page.tsx
async function DashboardPage() {
  const sessions = await sessionService.list();  // Direct DB call, no API roundtrip
  return <SessionList sessions={sessions} />;
}

// Client Component — only when needed (interactivity, hooks, browser APIs)
// 'use client' at the TOP of the file
'use client';
export function SessionTimer() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => { /* timer logic */ }, []);
  return <div>{seconds}s</div>;
}
```

### Metadata for SEO
```typescript
// Every page needs this
export const metadata: Metadata = {
  title: 'Session History | AI Therapist',
  description: 'Review your therapy session history and track progress over time.',
  openGraph: { title: '...', description: '...', images: ['/og-image.jpg'] },
};
```

## Best Practices Summary

### Code Quality
- No `any` types — use `unknown` + type guards if truly unknown
- All components typed with proper interfaces
- Barrel exports per feature folder (`features/session/index.ts`)
- Max 300 lines per file

### Performance
- Images: always use `next/image` with proper dimensions
- Fonts: use `next/font` for zero CLS
- Code split: `dynamic()` for anything > 50KB that's not above the fold
- Target: LCP < 2.5s, CLS < 0.1, FID < 100ms

### Accessibility
- All interactive elements keyboard-navigable
- ARIA labels on icon-only buttons
- Color contrast ratio ≥ 4.5:1
- Focus visible on all interactive elements

### Common Frontend Commands
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run type-check   # TypeScript check (npx tsc --noEmit)
npm run lint         # ESLint
npm run test         # Unit tests (Vitest)
npm run test:e2e     # E2E tests (Playwright)
```
