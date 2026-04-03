# Handoff - Campsite

## Next Action

- task: tighten live camp summaries and reduce placeholder seeded behavior so Camp mode and Focus mode feel more coherent
- fallback-task: refine save --push commit staging semantics if tracked-only checkpoints feel too narrow
- priority: high
- estimated-scope: medium
- entry-point: lib/camp.sh
- precondition: freshness helpers and save --push remain the current baseline

## Context for Next Session

Campsite now has product philosophy, camp state, freshness helpers, safe checkpoint push, and an active hybrid testing strategy. The next slice should improve the quality of the visible experience: make live camp summaries more trustworthy, reduce placeholder camp noise when the real session graph is sparse, and tighten the emotional bridge between Camp mode and Focus mode.

## Open Questions

- Should sparse camps show fewer seeded participants by default once real sessions exist?
- Should launcher selection itself show freshness confidence more directly?
- Should future checkpoint push include an opt-in mode for staging new files?

## Session Log

| Timestamp | Agent/Human | Action Taken | Outcome |
|---|---|---|---|
| 2026-03-20 | codex | Reworked the PRD around harness-engineering principles and added technical strategy documentation | Campsite now has a clearer operational position |
| 2026-03-20 | codex | Added single-CLI agent wrappers and low-overhead architectural constraints | Campsite now has a concrete product surface and a stricter lightweight stance |
| 2026-03-20 | codex | Reframed the product and CLI around checkpoint semantics | Campsite now answers more clearly when and why it should be used |
| 2026-04-03 | codex | Added recovery-first camp state, product philosophy docs, family look rules, and design prompt pack | Campsite now has a coherent product world and a real local state layer |
| 2026-04-03 | codex | Added freshness helpers, Focus-mode language improvements, and `save --push` checkpoint flow | Campsite now has a stronger terminal loop and a usable checkpoint push path |
| 2026-04-03 | codex | Added hybrid testing strategy, smoke harness, and `make test-hybrid`; fixed bare-remote branch verification in smoke flow | Campsite now has a repeatable reliability loop plus explicit human review gate |
