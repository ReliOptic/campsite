# Handoff - Campsite

## Next Action

- task: Phase 5 시각 자산 생산 1차 — 화로 코어 + 5종 화로 상태 아이콘
- priority: medium
- estimated-scope: medium
- entry-point: design/image_prompt.md, design/export/
- precondition: make check 223/223 통과 (master, origin 동기화 완료)
- roadmap: docs/completion-roadmap.md (v0.2.0 → v1.0 단계별 계획)

## Context for Next Session

Phase 4 완료 + 기능 점검 완료. `campsite camp message` (send/reply/list/flag/resolve), participants role/stance 컬럼, camp overview unresolved 에스컬레이션, HTML Threads 패널. participant list IFS 탭 붕괴 버그 → awk NR>1 교체, participant remove camp_log_event undefined → camp_event_append 교체, ${2:-} positional arg 버그 수정. make check 223/223 통과, origin 동기화 완료. 다음 작업: design/export/ pixel art 에셋 생성.

## Open Questions

- Should launcher selection show freshness confidence more directly?
- Should future checkpoint push include an opt-in mode for staging new files?
- Should camp render HTML return panel labels match terminal output exactly (Working now vs working-now)?
- interactive launcher와 setup은 TTY 환경에서만 검증 가능 — 자동화 테스트 방법?

## Session Log

| Timestamp | Agent/Human | Action Taken | Outcome |
|---|---|---|---|
| 2026-03-20 | codex | Reworked the PRD around harness-engineering principles and added technical strategy documentation | Campsite now has a clearer operational position |
| 2026-03-20 | codex | Added single-CLI agent wrappers and low-overhead architectural constraints | Campsite now has a concrete product surface and a stricter lightweight stance |
| 2026-03-20 | codex | Reframed the product and CLI around checkpoint semantics | Campsite now answers more clearly when and why it should be used |
| 2026-04-03 | codex | Added recovery-first camp state, product philosophy docs, family look rules, and design prompt pack | Campsite now has a coherent product world and a real local state layer |
| 2026-04-03 | codex | Added freshness helpers, Focus-mode language improvements, and `save --push` checkpoint flow | Campsite now has a stronger terminal loop and a usable checkpoint push path |
| 2026-04-03 | codex | Added hybrid testing strategy, smoke harness, and `make test-hybrid`; fixed bare-remote branch verification in smoke flow | Campsite now has a repeatable reliability loop plus explicit human review gate |
| 2026-04-03 | codex | Removed seeded fake participants, added a truthful quiet-camp empty state, and fixed manual participant terminal metadata handling | Sparse camps now stay calm and honest instead of over-speaking |
| 2026-04-03 | claude | Improved session summaries with tool/terminal/mission context, aligned peek labels to family-look vocabulary, restructured status output to match camp information hierarchy | Focus mode and Camp mode now use the same language and information order |
| 2026-04-03 | claude-opus | Fixed validate set-e/regex bug, install.sh bash 4+ false requirement, go history bootstrap + macOS tac compat, added font CDN, browser failure message, adapter zero UX, CI hybrid smoke | All non-interactive commands verified end-to-end on fresh install |
| 2026-04-03 | claude-opus | Replaced dashboard camp render with return-first minimal view, fixed bash read empty-field bug via awk, added camp serve live-poll selector update | Camp render is now a functional return-first view |
| 2026-04-04 | claude-opus | Built design asset layers: CSS night sky + stars, SVG sprite sheet (6 icons), campfire glow, corner accents, animations, asset pipeline (lib/camp-assets.sh), serve JSON with participants, live-poll participant refresh | Camp render has visual identity matching product vision |
| 2026-04-28 | claude-sonnet | Fixed 8 integration test failures (phaser path, IFS tab collapse, PID mismatch, lock dir vs file, empty state assertions) and 2 core bugs (camp_session_finish IFS, participant update IFS) | make check 210/210 green on local |
| 2026-04-28 | claude-sonnet | Applied 14 HIGH/MEDIUM UX improvements: sync completion message, fail() recovery hints, empty state text, next-move double prefix, participant list/remove, Session Log truncation, template cleanup | CLI UX quality review items resolved |
| 2026-04-28 | claude-sonnet | Phase 4: campsite camp message (send/reply/list/flag/resolve), role/stance on participants (TSV cols 12-13), unresolved escalation in overview and dashboard | Inter-agent async messaging channel live |
| 2026-04-28 | claude-sonnet | HTML camp dashboard Threads panel: amber highlight for unresolved, threaded reply indentation, resolve command hint in footer | Dashboard shows message state alongside participant state |
| 2026-04-28 | claude-sonnet | 7 integration tests for campsite camp message (send/reply/list/list-unresolved/resolve/flag/overview) | make check 217/217 green |
| 2026-04-28 | claude-sonnet | 기능 점검: participant list IFS 탭 붕괴 → awk 교체, remove camp_log_event undefined → camp_event_append, ${2:-} positional arg 수정 | make check 223/223, origin push 완료 |
