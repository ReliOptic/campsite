# Campsite Guide

> How to use campsite, from installation to cross-device workflow.
>
> **Prerequisite:** Read [landing.md](landing.md) first to understand what
> campsite is and whether it fits your workflow.

---

## Table of Contents

1. [Installation](#1-installation)
2. [First Run](#2-first-run)
3. [Your First Project](#3-your-first-project)
4. [Writing Good Source Files](#4-writing-good-source-files)
5. [Daily Workflow](#5-daily-workflow)
6. [Switching Agents](#6-switching-agents)
7. [Cross-Device Workflow](#7-cross-device-workflow)
8. [Multi-Project Management](#8-multi-project-management)
9. [Crash Recovery](#9-crash-recovery)
10. [The One Discipline That Matters](#10-the-one-discipline-that-matters)

---

## 1. Installation

```bash
curl -fsSL https://raw.githubusercontent.com/ReliOptic/campsite/main/install.sh | bash
```

Open a new terminal, then verify:

```bash
campsite --version
```

If you prefer git clone:

```bash
git clone https://github.com/ReliOptic/campsite.git
cd campsite
bash install.sh
```

For development (live editing):

```bash
git clone https://github.com/ReliOptic/campsite.git
cd campsite
make dev
```

---

## 2. First Run

```bash
campsite setup
```

This asks three things:

1. **Where are your projects?** — the parent directory.
   Example: `~/projects`

2. **Existing projects** — campsite scans for directories that already
   have `status.md` and `handoff.md`.

3. **Installed agents** — campsite checks which CLIs are in your PATH.

After setup, campsite knows your workspace. You only run this once per machine.

---

## 3. Your First Project

```bash
campsite init ~/projects/my-app
cd ~/projects/my-app
```

This creates:

```
my-app/
├── README.md            ← project description
├── status.md            ← current state (you edit this)
├── handoff.md           ← next task (you edit this)
├── decisions.md         ← decision log (append-only)
├── .gitignore           ← compiled files excluded
├── scripts/bootstrap.sh
├── docs/   src/   tests/   deploy/
└── .campsite/           ← internal state (gitignored)
```

**Now open `status.md` and `handoff.md` and write real content.**
This is the most important step. Without meaningful source files,
campsite compiles nothing useful.

---

## 4. Writing Good Source Files

### status.md — Where are we?

This is the project's current state. An agent or human reading this
should immediately know what works, what doesn't, and what phase
the project is in.

```markdown
# Status - my-app

## Current State

- phase: building
- confidence: medium
- last-updated: 2026-03-20
- last-agent: claude
- last-device: macbook-pro

## Active Branch

- branch: feat/payment
- base: main

## What Works

- User authentication (JWT + refresh tokens)
- Database schema (PostgreSQL, all migrations applied)
- REST API for user CRUD

## What Does Not Work Yet

- Payment integration (Stripe) — not started
- Email notifications — queue not connected

## Blockers

- Waiting for Stripe API key
```

Valid phases: `discovery`, `building`, `testing`, `reviewing`, `blocked`, `deployed`.

### handoff.md — What should happen next?

This is the work order for the next session. Write it as if you're
handing the project to a colleague who has never seen it before.

```markdown
# Handoff - my-app

## Next Session

- task: Implement Stripe checkout flow
- context: Use Stripe SDK v12. Webhook endpoint at /api/webhooks/stripe.
- blockers: Need STRIPE_SECRET_KEY in .env
- entry-point: src/services/payment.ts (create this file)

## Fallback Task

If Stripe key is not available:
- task: Connect email notification queue
- entry-point: src/services/notification.ts

## Notes

- Reuse auth middleware for payment routes
- Write tests first in tests/payment/
```

### decisions.md — Why did we choose this?

Append a new entry whenever a non-trivial decision is made.

```markdown
## 2026-03-18: Use Stripe over PayPal

- decision: Stripe for payment processing
- rationale: Better API, webhook support, team familiarity
- alternatives: PayPal (rejected — poor developer experience)
```

### Common Mistakes

| Mistake | Why It Hurts | Fix |
|---------|-------------|-----|
| Stale status.md | Agent builds on false assumptions | Update at end of every session |
| Vague handoff task | Agent guesses what to do | Write specific task + entry point |
| Over-detailed handoff | Agent follows bad instructions rigidly | Write intent, not step-by-step |
| Never updating decisions.md | Same debates re-surface | Append whenever you say "because..." |

---

## 5. Daily Workflow

### The Fast Path: Interactive Launcher

```bash
campsite
```

Select a project and an agent. Campsite handles sync, lock, launch, and cleanup.
This is the recommended way for most sessions.

### The Manual Path

```bash
cd ~/projects/my-app
campsite sync          # compile context for all detected agents
claude                 # or codex, gemini, etc.
# ... work ...
campsite save          # clean compiled files, release lock
```

### What `sync` Does

1. Validates project structure (required files, valid phase, non-empty task).
2. Checks file integrity (hash comparison with last sync).
3. Detects installed agents by scanning PATH.
4. Compiles a context file for each detected agent.
5. Stores hash and sync state (for crash recovery).

### What `save` Does

1. Scans source files for accidental credential leaks.
2. Warns if source files were not updated during the session.
3. Deletes all compiled context files.
4. Releases the session lock.
5. Stores updated hash.

### Asking the Agent to Update Files

Before ending a session, say to your agent:

> "Update status.md with what we accomplished and handoff.md with what
> the next session should do."

Most agents will edit the files directly. This is the key habit.

---

## 6. Switching Agents

### Within a Session

```bash
campsite save
campsite sync
codex              # switch from claude to codex
```

Both agents read from the same source files. Context is preserved.

### Agent Strengths

Different agents have different strengths. A common pattern:

| Task Type | Agent | Why |
|-----------|-------|-----|
| Architecture, design | Claude | Strong reasoning, nuanced discussion |
| Bulk implementation | Codex | Fast code generation |
| Code review | Gemini | Different perspective |
| Editor-integrated work | Cursor | IDE context awareness |

Campsite enables this without context loss.

### Compiling for One Agent

```bash
campsite sync --adapter=claude    # only compile CLAUDE.md
```

---

## 7. Cross-Device Workflow

### The Core Loop

```bash
# === Machine A: end of session ===
campsite save
git add status.md handoff.md decisions.md
git commit -m "wip: payment integration"
git push

# === Machine B: start of session ===
git pull
campsite sync
claude                    # full context from Machine A
```

### What Travels via Git

| File | Committed | Purpose |
|------|-----------|---------|
| `status.md` | Yes | Current project state |
| `handoff.md` | Yes | Next task |
| `decisions.md` | Yes | Decision log |
| `README.md` | Yes | Project description |
| `.campsite/` | No | Local state (lock, hash) |
| `CLAUDE.md` etc. | No | Compiled files (regenerated) |

### Setting Up a New Machine

```bash
# 1. Install campsite
curl -fsSL https://raw.githubusercontent.com/ReliOptic/campsite/main/install.sh | bash

# 2. Open new terminal, set up workspace
campsite setup

# 3. Clone and sync
git clone https://github.com/you/my-app.git ~/projects/my-app
cd ~/projects/my-app
campsite sync
claude
```

That's it. Full context on the new machine.

---

## 8. Multi-Project Management

### Dashboard

```bash
campsite dashboard
```

```
  PROJECT              │ PHASE      │ CONFIDENCE │ LOCK         │ NEXT
  ─────────────────────┼────────────┼────────────┼──────────────┼──────────────
  my-app               │ building   │ medium     │ free         │ Stripe checkout
  api-gateway          │ testing    │ high       │ free         │ load test
  mobile-app           │ discovery  │ low        │ locked(codex)│ define screens
```

### Quick Jump

```bash
campsite go my-app          # cd to project
campsite go 1               # cd to most recent project
campsite go my-app --sync   # cd + auto sync
```

### Project Status

```bash
campsite status
```

Shows phase, confidence, lock state, integrity, and next task.

---

## 9. Crash Recovery

Terminal died? SSH disconnected? Laptop ran out of battery?

```bash
campsite recover
```

Campsite detects orphaned locks (PID is dead), clears them,
cleans stale compiled files, and shows what changed during the
dead session (git diff, commit count, elapsed time).

### Monitoring from Another Terminal

While an agent is running:

```bash
campsite peek              # one-shot view
campsite peek --live       # auto-refresh every 5 seconds
```

Shows agent name, user, device, elapsed time, current task, PID status.

---

## 10. The One Discipline That Matters

Campsite requires exactly one habit:

> **Update `status.md` and `handoff.md` at the end of every session.**

Everything else — compilation, locking, recovery, cross-device sync —
works automatically. But if your source files are stale, campsite will
faithfully compile stale context, and your agent will faithfully act on it.

Stale state is worse than no state. A cold-start agent asks questions.
An agent with stale context makes confident wrong decisions.

This is not a campsite limitation. It is the fundamental contract:
**you maintain the source of truth, campsite delivers it.**

---

**Next:** [Reference](reference.md) — CLI commands, configuration, file formats
