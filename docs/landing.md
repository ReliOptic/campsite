# Campsite

> Session-aware context compiler for AI coding agents.

You close your laptop. You open it tomorrow on a different machine.
You type `claude`. The agent knows your project, your progress, and your next task.

That is what campsite does. Everything else is mechanism.

---

## The Problem

AI coding agents are powerful and amnesic. Every new session starts from zero.

```
Monday, MacBook:     claude → builds payment flow, 3 hours of context
Monday, save:        close terminal

Tuesday, Linux box:  claude → "What does this project do?"
```

Context does not survive across sessions, devices, or agents.
You re-explain. The agent re-discovers. You lose time.

This is not a memory problem. It is a **session continuity** problem.

---

## How Campsite Solves It

You maintain two small files: `status.md` (where the project is) and `handoff.md` (what to do next).

Campsite reads those files and compiles them into the native context format each agent already understands.

```
  status.md + handoff.md
           │
     campsite sync
           │
     ┌─────┼──────────┬────────────┐
     ▼     ▼          ▼            ▼
  CLAUDE.md  AGENTS.md  .cursorrules  GEMINI.md
     │     │          │            │
  claude  codex     cursor       gemini
```

After sync, campsite exits. Nothing sits between you and your agent.

When you switch machines:

```bash
# Machine A — done for the day
campsite save
git push

# Machine B — next morning
git pull
campsite sync
claude          # knows everything from yesterday
```

---

## Who This Is For

### Ideal User

You are the right user for campsite if:

- You use **AI coding agents daily** (Claude Code, Codex, Cursor, Gemini CLI).
- You work across **multiple devices** (laptop, desktop, cloud VM, WSL).
- You work on **multiple projects** and switch between them.
- You sometimes **switch agents** — Claude for design, Codex for implementation.
- You have felt the pain of an agent starting cold with no context.

### Not the Right Fit

Campsite is not the right tool if:

- You use AI agents occasionally and don't mind re-explaining context.
- You work on one project, one device, one agent, and never context-switch.
- You want a GUI-first project management tool.
- You need a live multi-agent orchestrator or scheduler.
- You want an agent runtime or framework (LangChain, CrewAI, etc.).

---

## What It Is (and What It Is Not)

| Campsite Is | Campsite Is Not |
|---|---|
| A context compiler (source files → agent-native files) | A wrapper around agent CLIs |
| A session manager (lock, recover, peek, history) | A daemon or background service |
| A cross-device bridge (state travels via git) | A proprietary sync backend |
| A validation layer (stale state → visible failure) | A full agent runtime |
| A CLI tool (zero UI, zero dependencies) | An IDE plugin |

### On Identity

Campsite is called a "compiler" because that describes the core mechanism:
it takes source-of-truth files and compiles them into agent-native output.

But the purpose is **session continuity** — preserving project context across
sessions, devices, and agents. The compilation is how. The continuity is why.

---

## Supported Agents

| Agent | Native Context File | Auto-Detection |
|---|---|---|
| Claude Code | `CLAUDE.md` | Yes — looks for `claude` in PATH |
| OpenAI Codex | `AGENTS.md` | Yes — looks for `codex` in PATH |
| Cursor | `.cursorrules` | Yes — looks for `cursor` in PATH |
| GitHub Copilot | `.github/copilot-instructions.md` | Yes — looks for `copilot` in PATH |
| Gemini CLI | `GEMINI.md` | Yes — looks for `gemini` in PATH |
| Custom agents | Configurable | Via adapter file |

**Scope boundary:** Campsite supports agents that read a project-root context file
at session start. Agents that do not read such files are outside campsite's useful range.
You can still create a custom adapter, but the value will depend entirely on
whether the agent actually consumes the compiled file.

---

## Anti-Patterns: When Campsite Makes Things Worse

Campsite amplifies whatever is in your source files. This means:

### Stale state is worse than no state

If `status.md` says "payment flow works" but it's been broken for a week,
the agent will build on top of that false assumption. Campsite's staleness
check is time-based (default: 48 hours), not semantic. **It cannot detect
that your status file is lying.**

Mitigation: Update `status.md` and `handoff.md` at the end of every session.
This is the one discipline campsite requires.

### Over-specified handoff creates tunnel vision

If `handoff.md` says "implement Stripe checkout using this exact pattern"
and that pattern is wrong, the agent will follow it anyway. The compiled
context is an instruction, not a suggestion.

Mitigation: Write handoff as intent + context, not as step-by-step script.

### Compiling for agents that don't read

If an agent ignores `.cursorrules` or reads only the first 500 tokens,
compiling a 3000-token context file for it is wasted work. Worse, you
might assume the agent has context when it doesn't.

Mitigation: Test whether your agent actually uses the compiled file.
`campsite sync --adapter=cursor` and check if the agent's behavior
changes.

### Lock friction in fast-switching workflows

If you switch between agents rapidly (every few minutes), the
sync → lock → save cycle adds overhead. Campsite is designed for
sessions of 30+ minutes, not rapid-fire tool switching.

Mitigation: Use `campsite sync` without save for exploratory sessions.

---

## Quick Start

```bash
# Install
curl -fsSL https://raw.githubusercontent.com/ReliOptic/campsite/main/install.sh | bash

# First-time setup
campsite setup

# Start a new project
campsite init ~/projects/my-app
cd ~/projects/my-app

# Edit status.md and handoff.md with your project state

# Compile and work
campsite sync
claude

# When done
campsite save
```

Full usage details: **[Guide](guide.md)**
CLI and configuration details: **[Reference](reference.md)**

---

## Platforms

| Platform | Status |
|---|---|
| macOS (Intel / Apple Silicon) | Supported |
| Linux | Supported |
| Windows (WSL) | Supported |

Requirements: `bash` 4+, `git`, standard Unix tools. No additional dependencies.

---

## Links

- **[Guide](guide.md)** — Step-by-step usage, workflows, scenarios
- **[Reference](reference.md)** — CLI commands, configuration, file formats, adapters
- **[Improvement Plan](improvement-plan.md)** — Technical debt and enhancement backlog
- **[CIP](CIP.md)** — Continuous Improvement Projects (long-term roadmap)
- **GitHub:** https://github.com/ReliOptic/campsite
