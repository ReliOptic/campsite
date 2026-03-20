# Campsite

Campsite is a cross-device session checkpoint harness for AI coding tools and human engineers.

It is designed to keep project context durable across Mac, PC, and cloud sessions without requiring a heavy IDE, daemon, or proprietary sync layer.

## Product Goal

Make project context recoverable in under 60 seconds by standardizing:

- workspace rules
- project status
- handoff state
- decision history
- terminal-first automation

## Canonical Documents

- [`Campsite-prd-v2.md`](/root/workspace/projects/Campsite/Campsite-prd-v2.md): product scope, goals, and contract
- [`docs/harness-technical-strategy.md`](/root/workspace/projects/Campsite/docs/harness-technical-strategy.md): implementation strategy and current technical limits
- [`README.md`](/root/workspace/projects/Campsite/README.md): quick orientation and command surface

## Repository Layout

- `Campsite-prd-v2.md`: product PRD
- `status.md`: current execution state
- `handoff.md`: next action for the next session
- `decisions.md`: append-only decision log
- `templates/`: markdown and project skeleton templates
- `scripts/`: bootstrap and validation helpers
- `docs/`: supporting notes and design docs
- `src/`: implementation code
- `tests/`: automated tests
- `deploy/`: container and deployment artifacts

## Current Scope

The current milestone is a lightweight checkpoint CLI, not a full orchestration runtime.

## CLI

Primary entrypoint:

```bash
sh /root/workspace/projects/Campsite/bin/campsite
```

Commands:

- `init /abs/path/to/project`
- `validate /abs/path/to/project`
- `context /abs/path/to/project`
- `enter /abs/path/to/project [actor]`
- `resume /abs/path/to/project`
- `handoff /abs/path/to/project`
- `leave /abs/path/to/project`
- `summary [/abs/path/to/projects-root]`
- `claude /abs/path/to/project [tool-args...]`
- `codex /abs/path/to/project [tool-args...]`
- `gemini /abs/path/to/project [tool-args...]`
- `openclaw /abs/path/to/project [tool-args...]`

The main product surface is the checkpoint flow:

- `enter`
- `resume`
- `handoff`
- `leave`

The agent wrapper commands are adapters on top of that checkpoint flow.

## Why It Feels Different

`claude` starts the tool in whatever state the current shell happens to have.

`campsite claude <project>` resumes the project checkpoint first. It validates the project contract, checks for an active lock, compiles a session context file, prints the required read order, sets stable workspace environment variables, changes into the project root, and then launches the agent.

What it does not guarantee yet:

- tool-specific prompt injection into every agent CLI
- cross-device lock propagation through Git
- automatic freshness repair

## Lightweight Constraints

Campsite must stay usable on old MacBooks and small Linux VMs.

- no daemon
- no background supervisor
- no local database
- no terminal emulation layer
- one short-lived shell wrapper plus the agent process
- plain text files only

## Current Limits

- Locking is project-local and advisory. It protects concurrent use on the same working tree, not cross-device coordination through Git.
- Freshness is checked using file modification time, not semantic repo awareness.
- The wrapper compiles and exposes context, but each agent CLI still needs adapter-specific prompt injection for stronger guarantees.

## Quick Start

```bash
cd /root/workspace/projects/Campsite
sh ./bin/campsite init /root/workspace/projects/sample-project
sh ./bin/campsite validate /root/workspace/projects/sample-project
sh ./bin/campsite context /root/workspace/projects/sample-project
sh ./bin/campsite enter /root/workspace/projects/sample-project
sh ./bin/campsite handoff /root/workspace/projects/sample-project
sh ./bin/campsite claude /root/workspace/projects/sample-project
sh ./bin/campsite leave /root/workspace/projects/sample-project
```
