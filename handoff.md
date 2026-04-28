# Handoff - Campsite

## Next Action

- task: campsite camp message 통합 테스트 추가 — tests/integration/test_camp.bats에 send/reply/list/flag/resolve 커버리지
- fallback-task: 디자인 에셋 생성 — design/image_prompt.md 프롬프트로 첫 6종 pixel art 생성 후 design/export/에 배치
- priority: high
- estimated-scope: small
- entry-point: tests/integration/test_camp.bats, lib/camp.sh (camp_message_* 함수들)
- precondition: make check 210/210 통과 (master, ahead 4 of remote)

## Context for Next Session

Phase 4 완료: `campsite camp message` (send/reply/list/flag/resolve), participants에 role/stance 컬럼 추가, camp overview에 unresolved 에스컬레이션, HTML 대시보드에 Threads 패널(amber 강조, 답글 들여쓰기, resolve 힌트). 14건 UX 개선(sync 완료 메시지, fail() 힌트, 빈 상태 문구, next-move 이중 접두어 제거 등) 및 8건 통합 테스트 버그 수정 완료. make check 210/210 로컬 통과. 4개 커밋 remote push 전 상태.

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
