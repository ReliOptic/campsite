# Handoff - Campsite

## Next Action

- task: implement stale-lock and freshness checks so the checkpoint flow can safely recover abandoned or outdated sessions
- fallback-task: implement tool-specific prompt injection for one supported CLI if stale handling is blocked
- priority: high
- estimated-scope: medium
- entry-point: bin/campsite
- precondition: the revised PRD and harness strategy need to remain the current contract for the MVP

## Context for Next Session

Campsite now has a checkpoint-oriented CLI surface with `enter`, `resume`, `handoff`, and `leave`, plus agent wrapper commands on top. The current flow is now conceptually closer to the real product story, but stale-lock handling and freshness detection are still missing. The next step should make checkpoint recovery trustworthy under interruption and multi-device use.

## Open Questions

- Should stale handoff detection be advisory only or commit-gating?
- What freshness window is strict enough to reduce drift without harming usability?
- Should lock handling remain project-local or move to workspace root?

## Session Log

| Timestamp | Agent/Human | Action Taken | Outcome |
|---|---|---|---|
| 2026-03-20 | codex | Reworked the PRD around harness-engineering principles and added technical strategy documentation | Campsite now has a clearer operational position |
| 2026-03-20 | codex | Added single-CLI agent wrappers and low-overhead architectural constraints | Campsite now has a concrete product surface and a stricter lightweight stance |
| 2026-03-20 | codex | Reframed the product and CLI around checkpoint semantics | Campsite now answers more clearly when and why it should be used |
