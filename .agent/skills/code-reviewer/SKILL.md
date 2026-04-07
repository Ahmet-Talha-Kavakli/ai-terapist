---
name: code-reviewer
description: Comprehensive code review skill for TypeScript, JavaScript, Python, Swift, Kotlin, Go. Use this skill whenever reviewing code, checking PRs, auditing code quality, finding bugs, security vulnerabilities, anti-patterns, or when asked to "review", "check", "audit", or "improve" any piece of code.
---

# Code Reviewer

## When to Use This Skill
- Reviewing pull requests or code changes
- Auditing existing code for quality, security, performance
- Checking for anti-patterns and bad practices
- Generating code review reports
- Enforcing coding standards across the team

## Core Review Dimensions

### 1. Code Quality
- Follow established patterns — consistency is critical in team codebases
- Write comprehensive tests for all new logic
- Document decisions, not just what the code does but WHY
- Review regularly — don't let debt accumulate

### 2. Performance
- Measure before optimizing — don't prematurely optimize
- Use appropriate caching strategies (in-memory, Redis, CDN)
- Optimize critical paths first (hot code paths, render loops)
- Monitor in production with real metrics

### 3. Security
- Validate ALL inputs — never trust user input
- Use parameterized queries — never string-concatenate SQL
- Implement proper authentication and authorization checks
- Keep dependencies updated — run `npm audit` / `pip audit` regularly
- Never log sensitive data (passwords, tokens, PII)
- Secrets must never be hardcoded — use environment variables

### 4. Maintainability
- Write clear, self-documenting code
- Use consistent naming conventions throughout
- Add helpful comments for non-obvious logic (the WHY, not the WHAT)
- Keep functions and files small and focused (Single Responsibility)

## Code Review Checklist

### Before Approving Any PR
- [ ] Code is readable without needing to ask the author
- [ ] No hardcoded secrets, API keys, or sensitive data
- [ ] All edge cases handled (null, empty, boundary values)
- [ ] No N+1 queries or obvious performance issues
- [ ] Error handling is present and appropriate
- [ ] New code has tests covering the main scenarios
- [ ] No commented-out dead code
- [ ] Naming is clear and consistent with the codebase
- [ ] PR is under 400 lines of change
- [ ] No `any` types in TypeScript (unless absolutely unavoidable with comment)
- [ ] API changes are backwards-compatible or versioned

## Common Anti-Patterns to Flag

### TypeScript / JavaScript
```typescript
// ❌ Using 'any' — defeats type safety
const data: any = fetchUser();

// ✅ Use proper types
const data: User = await fetchUser();

// ❌ Mutating state directly (React)
state.items.push(newItem);

// ✅ Immutable update
setState(prev => ({ ...prev, items: [...prev.items, newItem] }));

// ❌ useEffect for data fetching without cleanup
useEffect(() => {
  fetch('/api/data').then(setData);
}, []);

// ✅ Use React Query / TanStack Query
const { data } = useQuery({ queryKey: ['data'], queryFn: fetchData });

// ❌ Prop drilling 3+ levels
<A prop={x}><B prop={x}><C prop={x} /></B></A>

// ✅ Context or Zustand for shared state
```

### Security Anti-Patterns
```typescript
// ❌ SQL injection risk
const query = `SELECT * FROM users WHERE id = ${userId}`;

// ✅ Parameterized query
const user = await db.user.findUnique({ where: { id: userId } });

// ❌ Storing sensitive data in localStorage
localStorage.setItem('token', accessToken);

// ✅ httpOnly cookies for auth tokens

// ❌ Missing authorization check
async function deleteUser(userId: string) {
  await db.user.delete({ where: { id: userId } });
}

// ✅ Always verify the requester has permission
async function deleteUser(userId: string, requesterId: string) {
  if (requesterId !== userId && !isAdmin(requesterId)) throw new ForbiddenError();
  await db.user.delete({ where: { id: userId } });
}
```

## Review Report Format

When generating a review report, always use this structure:

```
## Code Review Report

**Files reviewed:** [list]
**Severity legend:** 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low | 💡 Suggestion

### Issues Found

#### 🔴 [CRITICAL] [File:Line] — [Issue title]
[Description of the problem and why it matters]
[Suggested fix with code example]

#### 🟠 [HIGH] [File:Line] — [Issue title]
...

### Summary
- Critical issues: X
- High priority: X
- Overall assessment: [Approve / Request Changes / Needs Discussion]
```
