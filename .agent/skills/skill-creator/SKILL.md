---
name: skill-creator
description: Create new skills, modify and improve existing skills, and measure skill performance. Use this skill when the user wants to create a new skill from scratch, edit an existing SKILL.md file, optimize skill descriptions for better triggering, or evaluate whether a skill is working correctly.
---

# Skill Creator

## Overview
Skills are reusable instruction sets that live in `.agent/skills/<skill-name>/SKILL.md`. They extend Claude's capabilities for specific, repeated tasks.

## Skill Anatomy

```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter (name, description required)
│   └── Markdown instructions
└── Bundled Resources (optional)
    ├── scripts/    - Executable code for automation
    ├── references/ - Docs loaded into context as needed
    └── assets/     - Templates, icons, other files
```

## Creating a New Skill

### Step 1: Capture Intent
Understand what the skill should do. Ask:
1. What should this skill enable Claude to do?
2. When should this skill trigger? (what user phrases/contexts)
3. What's the expected output format?
4. Is there objectively verifiable output? (if yes → write test cases)

### Step 2: Interview & Research
- Ask about edge cases, input/output formats, success criteria
- Research existing approaches or reference materials
- Check if an existing skill could be extended instead

### Step 3: Write the SKILL.md

```markdown
---
name: skill-identifier       # kebab-case, matches folder name
description: What it does AND when to use it. Be specific about trigger contexts.
             Make this a bit "pushy" — Claude tends to under-trigger skills.
             Example: "Use this whenever the user mentions X, Y, or Z, even if
             they don't explicitly ask for it."
---

# Skill Name

## Overview / When to Use

## Core Instructions
[Main behavior the skill should enforce]

## Reference
[Examples, patterns, checklists]
```

## Writing Principles

### Description = Trigger Mechanism
The YAML `description` is how Claude knows to use this skill. Make it:
- Specific about WHEN to trigger (not just WHAT it does)
- "Pushy" — err toward over-triggering rather than under-triggering
- Inclusive of synonyms: "review", "check", "audit", "look at" should all trigger `code-reviewer`

**Example (weak):**
```
description: Helps with code review tasks.
```

**Example (strong):**
```
description: Comprehensive code review for TypeScript, JavaScript, Python. Use this
skill whenever reviewing code, checking PRs, auditing quality, finding bugs or
security issues, or when asked to "review", "check", "audit", or "improve" any code.
```

### Body of the Skill
- **Imperative form:** "Always validate inputs" not "You should validate inputs"
- **Explain WHY:** "Always use parameterized queries — string concatenation enables SQL injection"
- **Include examples:** Both ✅ correct and ❌ incorrect patterns
- **Be general:** Don't narrow to a single example — extrapolate to the principle
- **Keep under 500 lines** — if longer, split into SKILL.md + `references/detail.md`

### Progressive Disclosure
Skills load in three levels:
1. **Metadata** (name + description) — always in context, ~100 words
2. **SKILL.md body** — loaded when skill triggers, ideally < 500 lines
3. **References** — loaded on demand, unlimited size

Use this structure:
```markdown
For detailed X patterns, see [references/x-patterns.md](references/x-patterns.md)
```

## Improving an Existing Skill

When improving, ask:
- What's NOT working? (under-triggering, wrong output, missing cases)
- What changed in the codebase that the skill doesn't account for?
- Are there anti-patterns the skill doesn't catch?

**Iteration loop:**
1. Identify failure case
2. Add specific instruction to handle it
3. Add the anti-pattern example
4. Test with a prompt that previously failed

## Skill Location in This Project

```
Ai-Terapist/.agent/skills/
├── <skill-name>/
│   ├── SKILL.md          ← Main instruction file
│   ├── references/       ← Optional detailed reference docs
│   └── scripts/          ← Optional automation scripts
```

## Current Skills in This Project

| Skill | Purpose |
|-------|---------|
| `clean-code-quality` | Modular architecture, SOLID, 300-line limit |
| `crisis-detection-safety` | Safety protocol for therapy sessions |
| `therapeutic-knowledge-base` | CBT, DBT, therapy frameworks |
| `vision-emotion-analysis` | Camera-based emotion detection |
| `session-memory-continuity` | Cross-session user profile |
| `personalization-engine` | Adaptive therapy style |
| `emotion-mirroring-avatar` | 3D avatar behavior |
| `wearable-data-integration` | Apple Watch/Fitbit data |
| `scalable-architecture-patterns` | Next.js architecture |
| `code-reviewer` | PR and code quality review |
| `senior-frontend` | React/Next.js frontend patterns |
| `senior-backend` | tRPC/Prisma/API patterns |
| `seo-optimizer` | SEO for Next.js |
| `webapp-testing` | Playwright browser testing |
| `mobile-design` | Mobile UX for future iOS/Android |
| `skill-creator` | Creating and improving skills |
