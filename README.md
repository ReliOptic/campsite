# Campsite

> Recovery-first AI workspace for ideation, review, and stamina.

You work in a terminal.

You step into Campsite when you need room to recover context, see what your agents are doing, and decide the next move.

You step back into execution without losing the thread.

That is the product.

---

## Campsite Makes Three Promises

### 1. 발상 (Ideation)

Campsite gives you a place to direct AI and AI agents with clear goals and clear context.

This matters because most AI workflows fail before execution. The mission is vague. The handoff is muddy. The agent starts moving, but the builder has not actually framed the work.

Campsite exists to make intent sharper:

- what are we trying to do
- who is doing what
- what is the current mission
- what should happen next

It is a place to form the mission before the chaos starts.

### 2. 검토 (Review)

Campsite gives you a place to control AI output and turn raw output into good finished work.

AI can generate quickly. That is not the hard part anymore.

The hard part is:

- noticing what changed
- deciding what is good
- spotting what is blocked
- reviewing what is ready

Campsite makes review visible. It is built around human judgment, not blind automation.

### 3. 체력 (Stamina)

Campsite gives you the ability to do more ideation and more review without collapsing into confusion.

This is the quiet superpower.

Real work is not one uninterrupted sprint. You leave. You come back. You switch devices. You switch tools. You live your life. Then you return and try to remember what was happening.

Campsite lowers that restart cost.

It helps you build long-breath creative stamina:

- recover context faster
- hold multiple threads without panic
- let AI keep moving without losing trust
- keep going over days, not just one burst

---

## What Campsite Is

Campsite is a recovery-first AI workspace.

It is not just a compiler.
It is not just a terminal.
It is not just a web UI.

It is one workspace with two connected surfaces:

- `Focus mode`
  Terminal-first execution, speed, deep work
- `Camp mode`
  Spatial recovery, state awareness, vibe, re-entry

The terminal is where you push.
The camp is where you recover, review, and redirect.

They must feel like the same world.

---

## Why It Exists

AI coding tools are powerful and amnesic.

They help you generate output fast, but they do not naturally preserve your sense of:

- what you were building
- which agent is still active
- what finished
- what needs you now

That is why Campsite exists.

The problem is not only memory.
The problem is recovery.

---

## The Experience

You are building in the terminal.

Claude is working on one thing.
Codex is finishing another.
You step away for a meeting, go outside, switch projects, travel, spend time with family, or just sleep.

Then you come back.

Campsite should let you understand your world in seconds:

- who is still working
- what is waiting on you
- what the next move is

That is the core user experience.

---

## The Vibe

Campsite is not meant to feel like a corporate dashboard.

The design direction is:

- nocturnal
- calm
- warm hearth in a wide space
- terminal-native
- pixel camp, but operational

Sometimes that means aurora over a northern camp.
Sometimes it means granite, forest, canyon daylight, or a place that matches where you are and how you want to work.

The scenery may change.
The feeling should not:

- calm
- focused
- alive
- never frantic

This is not aggressive automation.
This is tranquil autonomy.

---

## What Makes It Different

Most agent products push toward one of two poles:

- endless automation loops
- flat dashboards full of logs

Campsite is aiming somewhere else.

It is trying to become the place where:

- AI keeps moving
- the human stays oriented
- review stays central
- the workflow stays compatible with real life

That is a different product.

---

## Current Shape

Today, Campsite already includes:

- project bootstrap
- `status.md` and `handoff.md` as source-of-truth
- agent context compilation for native context files
- lock and recovery flow
- session-aware local camp state
- recovery-first camp prototype

The product is evolving from a pure project-state compiler into a fuller AI workspace.

---

## Quick Start

### Install

```bash
curl -fsSL https://raw.githubusercontent.com/ReliOptic/campsite/main/install.sh | bash
```

Open a new shell or export immediately:

```bash
export CAMPSITE_HOME="$HOME/.campsite"
export PATH="$CAMPSITE_HOME/bin:$PATH"
```

### Start a Project

```bash
campsite init ~/projects/my-app
cd ~/projects/my-app
```

Update your project state:

- `status.md`
- `handoff.md`
- `decisions.md`

Then compile and work:

```bash
campsite sync
claude
```

Or open the current recovery-first camp view:

```bash
campsite camp render
```

When you are done:

```bash
campsite save
```

---

## Commands

| Command | Purpose |
|---|---|
| `campsite` | Interactive launcher |
| `campsite setup` | First-run workspace setup |
| `campsite init [path]` | Bootstrap a new project |
| `campsite sync` | Compile project state into agent-native context files |
| `campsite save` | End-of-session cleanup |
| `campsite save --push` | Create and push a safe checkpoint commit |
| `campsite status` | Show current project summary |
| `campsite peek` | View the active session from another terminal |
| `campsite camp overview` | Show recovery-first camp summary |
| `campsite camp render` | Render the local camp scene |
| `campsite validate` | Check structure and freshness |
| `campsite recover` | Recover orphaned sessions and stale artifacts |
| `campsite dashboard` | Show all projects in workspace |

More detail:

- [docs/guide.md](docs/guide.md)
- [docs/reference.md](docs/reference.md)
- [docs/spec-driven-prd-vibe-camp.md](docs/spec-driven-prd-vibe-camp.md)

---

## Non-Goals

Campsite is not trying to be:

- a full IDE replacement
- a hosted orchestration service
- a generic agent benchmark product
- a noisy productivity dashboard

It is trying to be the workspace where AI coding feels more legible, more reviewable, and more sustainable.

---

## Long-Term Direction

The solo builder is the first wedge.

Later, Campsite should naturally extend into a shared world where:

- multiple people gather in the same camp
- missions are discussed in one place
- branches and work threads are handed off cleanly
- context moves between people without coordination collapse

But the first rule remains the same:

make the return feel good.

---

## Links

- [Guide](docs/guide.md)
- [Reference](docs/reference.md)
- [Design System](docs/DESIGN.md)
- [Family Look Spec](docs/family-look-spec.md)
- [Camp State Schema](docs/camp-state-schema.md)
- [Recovery-First PRD](docs/spec-driven-prd-vibe-camp.md)
- [GitHub](https://github.com/ReliOptic/campsite)
