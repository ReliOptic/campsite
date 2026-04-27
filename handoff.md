# Handoff - Campsite

## Next Action

- task: HUD 확장 — collector 가 잡은 file_activity / commit / agent event 를 plain-language activity 한 줄로 번역해서 HUD 에 노출 (현재는 agent name + uptime 만)
- fallback-task: 디자인 에셋 생성 — design/image_prompt.md 프롬프트로 첫 6종 pixel art 생성, interactive launcher/setup TTY 검증
- priority: medium
- estimated-scope: medium
- entry-point: design/image_prompt.md (프롬프트), design/export/ (결과물), lib/camp-assets.sh (파이프라인)
- precondition: CSS/SVG fallback layer 완성, asset pipeline code 준비됨

## Context for Next Session

디자인 에셋 Phase 1-3 완료: CSS night sky + stars, inline SVG sprites (campfire + 5 fire-state icons), campfire glow/flicker, corner accents, modakbul pulse, prefers-reduced-motion. Asset pipeline (lib/camp-assets.sh) 구축: install/base64/manifest. Serve JSON에 participant 배열 추가, live-poll에서 participant 목록 실시간 갱신.

North Star (recovery-first AI workspace) 가 이제 실제로 동작:
- `lib/common.sh`에 `project_freshness_level`, `effective_confidence`, `freshness_gate_action` 추가
- `cmd_launcher` (`bin/campsite`) 가 stale state 면 launch 거부 — `--force` 또는 `CAMPSITE_FRESHNESS_POLICY=warn|off` 로 override
- launcher list / status output / session banner 가 effective confidence 표시 (예: `high → low (stale)`)
- aging 은 warn, stale 은 block, fresh 는 silent

다음은 실제 pixel art 이미지 생성 (campfire-core, status badges 우선) 또는 interactive launcher TTY 검증.

## Open Questions

- Should `campsite go` also run the freshness gate, or stay a pure cd?
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
| 2026-04-27 | claude-opus | Wired freshness signal into launcher: project_freshness_level / effective_confidence / freshness_gate_action helpers, stale-state launch block with --force and CAMPSITE_FRESHNESS_POLICY override, effective confidence in list/status/banner | Recovery-first North Star is now load-bearing — stale camp state cannot silently launch agents |
| 2026-04-27 | claude-opus | Built `campsite hud` always-alive multi-camp HUD: lib/hud.sh with line/full/json/loop renderers; alternate-screen polling, calm tick animation, tmux status-line via `campsite hud --line`. Surfaces fire-state glyph + current activity + effective confidence + mission per camp | "여러 작업 우왕좌왕" 시간을 죽이는 단일 진실. tmux status-line / 별도 패널 / standalone 모두에서 동작 |
