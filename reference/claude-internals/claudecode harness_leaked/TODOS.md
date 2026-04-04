# TODOS

> **Status: 3/3 완료** (2026-04-05)

## ✅ TODO 1: Agent SDK 구현 계획서 재작성
**What:** 기존 분석 문서 3개(`workspace_theory_docs/`)를 Agent SDK 독립 프로젝트용 구현 계획으로 재작성
**Why:** 기존 계획이 유출 코드 내부 경로를 직접 참조하여 기술서에 사용 불가. eng review에서 확정된 9개 아키텍처 결정사항 반영 필요.
**Pros:** 기술서 챕터 근거 문서 확보. 법적 위험 제거. Agent SDK 실제 구현 가능한 수준의 상세도.
**Cons:** 기존 문서와 중복 작업 발생 (~30% 내용 재활용 가능).
**Context:** eng review 결정사항: Monolith CLI 구조, structured handoff, clean-room evaluator, budget tracker, CLI+env config, code/prompt 분리, Generator 상세 정의, 단계별 복구 전략, vitest unit+mock E2E. 기존 3문서는 참고자료로 보존.
**Depends on:** 없음 (최우선)
**Effort:** human ~4h / CC ~15min

**Output:** `workspace_theory_docs/agent_sdk_harness_implementation_plan.md`

## ✅ TODO 2: Agent SDK 프로젝트 스케폴딩
**What:** Monolith CLI 프로젝트 초기 구조 생성 (package.json, tsconfig, bin/harness.ts, src/agents/, src/prompts/, src/presets/, src/types/, tests/)
**Why:** 구현 계획서가 참조할 실제 프로젝트 구조가 필요. 기술서 독자가 따라할 수 있는 실행 가능한 코드 기반.
**Pros:** 즉시 코드 작성 시작 가능. 기술서에 실제 프로젝트 구조 스크린샷 포함 가능.
**Cons:** Agent SDK 정식 API가 변경될 경우 수정 필요.
**Context:** npx harness-eng CLI 형태. 의존성: @anthropic-ai/claude-code (Agent SDK), vitest. .harness.yaml config 지원.
**Depends on:** TODO 1 (구현 계획서 완성 후)
**Effort:** human ~2h / CC ~10min

**Output:** `harness-project/` (21 tests passing, typecheck clean)

## ✅ TODO 3: 기술서 챕터 구조 재편성
**What:** 하네스 엔지니어링 기술서의 챕터 구조를 "이론 분석 → Agent SDK 구현 실전" 흐름으로 재편성
**Why:** 방향 전환 승인됨 (이론 + 실전). beta 4/30 데드라인. 유출 코드 참조 제거하고 공개 PDF + Agent SDK 문서만 인용.
**Pros:** 독자에게 분석과 구현 양쪽 가치 제공. 법적으로 안전한 출판 가능.
**Cons:** 챕터 분량 증가. 구현 코드가 완성되어야 실전 섹션 작성 가능.
**Context:** 선행: harness_gap_why_and_risk_assessment.md의 설계 원칙 4개. PDF V1→V2 진화 서사. eng review 9개 결정사항.
**Depends on:** TODO 1, TODO 2
**Effort:** human ~8h / CC ~1h
**Output:** `harness-project/docs/book-chapter-outline.md` (3 Parts, 15 Chapters, 5 Appendices)
