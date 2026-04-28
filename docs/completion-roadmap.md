# Campsite Completion Roadmap

> Status: Draft
> Last updated: 2026-04-29
> Owner: Kiwon Cho
> Purpose: 현재 상태(v0.2.0)에서 v1.0 정식 출시까지 도달하는 데 필요한 모든 작업과 검증 절차의 단일 참조 문서
> Scope: 제품 정의, 현재 상태 점검, 결손 분석, 단계별 실행 계획, 의존성, 위험 관리, 마일스톤, 검수 기준

본 문서는 다음 문서들의 상위 통합층(super-aggregator)으로 기능한다.

- `Campsite-prd-v2.md` — 제품 계약서(harness-engineering 측면)
- `docs/spec-driven-prd-vibe-camp.md` — recovery-first 비전 측면
- `docs/experience-execution-blueprint.md` — 경험 설계 청사진
- `docs/CIP.md` — 장기 개선 항목 카탈로그
- `docs/implementation-tracker.md` — 누적 구현 이력

본 문서가 다른 문서와 충돌할 경우, 본 문서가 우선한다. 충돌이 발생하면 즉시 양쪽을 수정하여 단일 진실원으로 유지한다.

---

## 1. 제품 정의 — 무엇이 완성된 상태인가

Campsite는 두 축으로 정의되며, 두 축은 등가(等價)이다. 어느 한 축만 충족된 상태는 미완성으로 간주한다.

### 1.1 기술적 축 — Harness Engineering 계약

Campsite는 다음 조건을 만족시키는 가벼운 세션 체크포인트 도구이다.

| 조건 | 정의 |
|---|---|
| F1 정적 계약층 | `status.md`, `handoff.md`, `decisions.md`로 구성된 plain text 계약을 갖는다 |
| F2 다중 어댑터 | 단일 명령으로 6종 이상 AI CLI(claude/codex/cursor/copilot/gemini/openclaw)에 컨텍스트를 컴파일한다 |
| F3 검증 가능성 | 누락·오염·노후 상태(stale)를 명시적 실패로 변환한다 |
| F4 데몬 부재 | 상주 프로세스 없이 단발 호출(short-lived dispatcher)로 동작한다 |
| F5 경량성(4GB-safe) | 8GB 노트북, 4GB-급 Linux VM에서 정상 가동한다 |
| F6 휴대성 | macOS·Linux·WSL 환경에서 동일한 의미론을 갖는다 |
| F7 잠금·복구 | 동시 접근을 차단하고 잔류 잠금을 자동 회수한다 |

### 1.2 경험적 축 — Recovery-First Workspace

Campsite는 다음 정서적·인지적 조건을 만족시킨다.

| 조건 | 정의 |
|---|---|
| E1 5초 복귀 | 다른 기기·다른 시간으로 진입한 사용자가 5초 안에 직전 상태를 파악한다 |
| E2 양식 일치 | Focus mode(터미널)와 Camp mode(시각 표면)가 동일 어휘·동일 의미론·동일 정서를 공유한다 |
| E3 진정한 자율성 | AI가 백그라운드에서 일하더라도 정서적 압박이 발생하지 않는다 |
| E4 비코더 친화 | "코딩을 좋아하지 않는 30대"가 진입 30분 안에 가치 체감에 도달한다 |
| E5 다중 프로젝트 허브 | 여러 프로젝트가 단일 캠프 내에서 시너지(추억·기록·전환)를 형성한다 |
| E6 검토 우선 | 거짓 완료(false completion) 표현이 시스템 어디에도 존재하지 않는다 |
| E7 OMC 공존 | tmux + OMC와 충돌 없이 게이트웨이로 진입할 수 있다 |

### 1.3 부정 정의(Non-Goals) — 절대 포함하지 않는 것

다음 항목은 v1.0 범위 밖이며, 이후에도 진입을 보류한다.

- 전 IDE 대체
- GUI-우선 워크플로우 매니저
- 자체 동기화 백엔드(클라우드 컨트롤 플레인)
- 실시간 다중 에이전트 스케줄러(시퀀스 릴레이는 가능, 동시 분기 실행은 비목표)
- 모델 특화 오케스트레이션 로직

---

## 2. 현재 상태 점검 (2026-04-29)

### 2.1 정량 지표

| 지표 | 값 |
|---|---|
| 버전 | v0.2.0 |
| 브랜치 | master, origin 동기화 완료 |
| 테스트 | 223건(unit 172 + integration 51), 전체 통과 |
| 커밋 | 직전 검증된 head: `29e1761` (handoff doc), `df397ec` (participant fix) |
| 대상 OS | macOS, Linux 일부 검증, WSL 미검증 |
| 셸 호환 | bash 3.2+, zsh, fish/nu wrapper 템플릿 제공 |

### 2.2 작동하는 영역(Verified)

- F1: status/handoff/decisions 계약 + 검증
- F2: 6종 어댑터 컴파일 파이프라인
- F3: 누락·노후·잠금 충돌의 명시적 실패 변환
- F4: 상주 프로세스 부재
- F7: 동일 기기 내 잠금·복구
- E2: 터미널·HTML 대시보드 어휘 1차 정렬(working-now / waiting-on-you / next-move)
- E6: 거짓 완료 어휘 제거(검토 우선 fire-state)

신규 구현(2026-04 사이클):

- 신호 수집기(`lib/collector.sh`) — git/파일 활동 자동 수집
- 에이전트 생애주기(`lib/agent.sh`) — PID·종료 코드·로그 캡처
- 화로 상태 도출(`lib/firestate.sh`) — 신호 기반 자동 분류
- 메시지 채널(`campsite camp message`) — 발신/응답/표식/해소
- 라이브 폴링 대시보드(camp serve) — 3초 간격 갱신
- HTML Threads 패널 — 미해결 메시지 강조

### 2.3 결손 영역(Unverified or Missing)

| 영역 | 상태 | 비고 |
|---|---|---|
| F5 4GB-safe | 미검증 | 4GB Linux VM 회귀 테스트 부재 |
| F6 휴대성 | 부분 | WSL 검증 0건, Linux는 CI상의 ubuntu-latest만 |
| E1 5초 복귀 | 미측정 | 실제 측정 프로토콜 부재, 자기 진술에 의존 |
| E3 진정한 자율성 | 부분 | AI 작업 시각화는 있으나 정서 평가 부재 |
| E4 비코더 친화 | 미검증 | 페르소나 검증(희원) 미수행 |
| E5 다중 프로젝트 허브 | 부재 | 프로젝트 간 전환 UX, 시너지 표현, PARA 구조 부재 |
| E7 OMC 공존 | 부재 | tmux 게이트웨이 통합 미설계 |
| Pixel art 자산 | 부재 | `design/export/` 비어 있음 |
| Phaser storyworld | 골격만 | `camp-client/src/` 존재하나 실제 가동 미검증 |
| 첫 5분 온보딩 | 부분 | `campsite setup` 존재, 정성 평가 부재 |
| 정식 배포 | 부재 | release tarball, GitHub Releases 워크플로 부재 |

### 2.4 알려진 부채(Known Debt)

- HTML 대시보드의 라이브러리 폴백 경로(`legacy` 모드 전환) 명시 부족
- 설정값 중 일부가 환경 변수와 `config/defaults.sh` 양쪽에 존재
- shellcheck 통과는 확보되었으나 일부 경로의 컬러·에러 코드 통일 부족
- `camp-client` 빌드 산출물 배포 전략 미확정(릴리즈 tarball 결정만 존재)

---

## 3. 결손 분석 — 목표까지의 거리

### 3.1 차원별 격차

| 차원 | 목표 | 현재 | 격차의 본질 |
|---|---|---|---|
| 신뢰성 | 4GB VM·WSL·macOS 동치 | macOS 위주 | 환경 회귀 행렬 부재 |
| 첫 사용 경험 | 30분 가치 체감 | 명령은 동작 | 안내·시각·정서가 분절 |
| 시각 정체성 | Animal Crossing 미감 픽셀 캠프 | CSS+SVG 정적 표면 | 자산 0건, Phaser 미가동 |
| 다중 프로젝트 | 캠프 간 시너지·PARA | 단일 프로젝트 단위 | 허브 메타데이터·전환 UX 부재 |
| 측정 가능성 | MTTR·HOR·실패율 누적 | 임시 관찰 | 측정 프로토콜·로그 스키마 부재 |
| 출시 준비도 | release tarball + 설치 문서 | 설치 스크립트만 존재 | 버전 동기화·릴리즈 자동화 부재 |

### 3.2 위 격차를 메우는 데 필요한 작업의 거시 분류

크게 6개 작업군으로 환원된다.

1. **시각 자산 생산(Asset Production)** — 픽셀 아트 6종 + 환경 타일
2. **storyworld 가동(Phaser Activation)** — `camp-client/` 빌드·연동·검증
3. **다중 프로젝트 허브(Multi-Project Hub)** — 워크스페이스 메타·PARA 구조·전환 UX
4. **환경 회귀 행렬(Environment Matrix)** — 4GB VM·WSL·Linux 자동 검증
5. **측정 인프라(Measurement)** — MTTR·HOR·실패 카탈로그
6. **출시 준비(Release Engineering)** — 버전·tarball·문서·설치 경로 정비

각 군의 상세 작업은 §4 단계별 계획으로 분해된다.

---

## 4. 단계별 실행 계획 — Phase 5 ~ v1.0

각 단계는 다음 형식으로 명세된다.

- **Goal** — 단계가 끝났을 때 무엇이 가능한가
- **Inputs** — 단계 시작에 필요한 선행 산출물
- **Deliverables** — 단계가 산출하는 코드·문서·자산
- **Acceptance Criteria** — 단계 종료 판정의 객관 조건
- **Risk** — 단계가 실패할 가능성의 주된 출처
- **Estimated Scope** — small / medium / large

### Phase 5 — Visual Identity Production (자산 생산)

**Status**: in_progress (2026-04-29 1차분 도착)

**1차 핸드오프 (2026-04-29)**: Claude Design 도구로 산출된 LoFi prototype 13파일이 `design/handoff/2026-04-29-claude-design/`에 도착. F-1/F-2/F-3 시안 + 디자인 시스템 레퍼런스 + 5종 화로 + 6종 동물 sprite + 환경 테마 3종 응용 팔레트 포함. 토큰 발주서 §5.1과 100% 일치. 통합 계획은 `design/handoff/2026-04-29-claude-design/INTEGRATION.md`.

**Goal**: 캠프 표면이 시각 정체성을 갖는다. 픽셀 아트 자산이 실제로 적재되어 SVG 폴백을 대체한다.

**Inputs**:
- `design/image_prompt.md` (작성 완료)
- `docs/family-look-spec.md` (작성 완료)
- `lib/camp-assets.sh` 자산 파이프라인(작성 완료)

**Deliverables**:
- `design/export/` 내 아래 자산
  - 화로(campfire) 코어, 1점 — 480×320 캔버스 기준 64×64 px
  - 5종 화로 상태 아이콘(불씨/모닥불/등불/연기/장작) — 각 16×16 px
  - 동물 캐릭터 sprite sheet(여우·토끼·올빼미·고양이·곰·사슴) — 각 5상태 × 4프레임
  - 환경 타일 4종(밤하늘 그라데이션·별·지면·숲 가장자리)
  - 코너 액센트 4종(4×4 px, tertiary 색상)
- 자산 인덱스 매니페스트 `design/export/manifest.json`
- 배경 모드 3종 응용 팔레트(aurora north / granite & pine / canyon daylight)

**Acceptance Criteria**:
- `campsite camp render` 결과가 자산 적재 시 외형이 변동된다(SVG 폴백 외양과 시각적 차이 검증)
- 모든 자산은 PNG-8 또는 PNG-24, 합산 600KB 미만
- `design/export/manifest.json`에 모든 자산이 SHA-256 해시와 함께 등록된다
- `prefers-reduced-motion` 설정에서도 자산이 정상 표시된다

**Risk**:
- AI 이미지 생성기 외부 의존(주요)
- 색채 팔레트와 시스템 의미론 충돌(불씨 색이 화재 경고로 오인) — DESIGN.md의 의미 색상 우선 원칙으로 차단

**Estimated Scope**: medium (외부 도구 의존 여부에 따라 변동)

---

### Phase 6 — Storyworld Activation (Phaser 가동)

**Goal**: `camp-client/`가 실제로 빌드되어 캠프 상태를 픽셀 storyworld로 표상(表象)한다. 정적 HTML 대시보드는 폴백 경로로 격리된다.

**Inputs**: Phase 5 산출물(자산), `camp-client/src/` 골격, `lib/camp.sh`의 export JSON

**Deliverables**:
- `camp-client/dist/` 빌드 산출물 생성 절차(`bun run build` 또는 `npm run build`)
- `bin/campsite camp serve`가 빌드 산출물 우선 적재, 자산 부재 시 legacy HTML로 폴백
- 480×320 캔버스, 정수 배율 스케일링, 16색 팔레트 강제
- 5종 화로 상태 → 동물 행동 매핑(idle / focused / proud / waiting / pre-burn)
- ReturnScene — 부재 시간 동안의 변화를 환경 묘사로 전달
- legacy HTML 모드를 명시적 플래그로 호출 가능: `campsite camp serve --legacy`

**Acceptance Criteria**:
- `bun test` 또는 `npm test`로 camp-client 단위 테스트 통과(최소 8건)
- `campsite camp serve` → 브라우저에서 storyworld 렌더 확인
- export JSON 변경 시 storyworld가 10초 내 갱신
- 빌드 산출물 합산 1MB 미만, 초기 로드 3초 미만(로컬 파일 기준)

**Risk**:
- Phaser 의존 추가에 따른 번들 비대화 — Vite 트리쉐이킹·코드 분할로 차단
- 자산 로딩 실패 시 화면 무응답 — legacy 폴백 경로 필수화로 차단

**Estimated Scope**: large

---

### Phase 7 — Multi-Project Hub (다중 프로젝트 허브)

**Goal**: 다수 프로젝트가 하나의 캠프에서 공존하며, PARA(Project / Area / Resource / Archive) 구조로 정렬된다.

**Inputs**: 단일 프로젝트 캠프 모드 완성(현재), Phase 6 산출물

**Deliverables**:
- 워크스페이스 루트 메타파일 `~/.campsite/workspace.json`
  - 프로젝트 목록, 마지막 진입 시각, PARA 분류, 화로 상태 요약
- `campsite hub` 명령 — 등록된 프로젝트 목록과 최근 활동을 브라우저로 출력
- `campsite hub register <path> --area=<name>` — 프로젝트를 허브에 등록
- `campsite hub archive <slug>` — 프로젝트를 archive 분류로 이동
- camp-client 측 `HubScene` — 다수 캠프를 하나의 풍경으로 합성하여 표현
- 프로젝트 간 진입 단축 명령 `campsite go <slug>` 확장(현재 일부 구현)

**Acceptance Criteria**:
- 5개 이상 등록된 상태에서 `campsite hub`가 1초 내 결과 반환
- archive 분류 프로젝트는 hub 기본 화면에서 노출되지 않으나 명시적 조회로 확인 가능
- workspace.json은 SHA-256 무결성을 가지며 잘못된 손상 시 명시적 실패로 변환된다
- HubScene이 6개 이상 프로젝트를 동시에 시각 표상한다

**Risk**:
- 다중 프로젝트 동시 잠금 충돌 — 잠금 모델은 프로젝트별 단발 유지(공유 자원 없음)
- 단일 프로젝트 단순성을 해치는 인지 부담 — `campsite hub`는 옵트인, 기본 명령은 단일 프로젝트 가정 유지

**Estimated Scope**: large

---

### Phase 8 — Environment Matrix & Reliability (환경 회귀 행렬)

**Goal**: macOS·Linux(ubuntu-latest, alpine)·WSL2·4GB-급 VM에서 모두 통과하는 자동 회귀 행렬이 존재한다.

**Inputs**: 기존 `make check` 223건, `scripts/hybrid-smoke.sh`

**Deliverables**:
- GitHub Actions 행렬 확장 — `os: [ubuntu-latest, ubuntu-22.04, macos-latest, macos-13]`
- WSL2 검증 스크립트 `scripts/wsl-smoke.sh`(Windows 측 검증 가이드 문서 포함)
- 4GB-safe 검증 — `scripts/lowmem-smoke.sh`로 cgroups·ulimit 기반 메모리 제한하 회귀
- Bash 3.2 회귀(macOS 시스템 셸) 보존 검증
- 셸 호환 매트릭스 문서 `docs/shell-compat-matrix.md`
- 모든 산출물에 명시적 재현 절차

**Acceptance Criteria**:
- CI 행렬 모두 녹색
- 4GB 메모리 제한하 `make check` 정상 통과
- WSL2 검증 보고서가 docs에 게시
- 알려진 비호환 상황(예: nu/fish 셸) 명시적 문서화

**Risk**:
- WSL 검증 환경 확보(주요) — 가상화 또는 외부 협력자 활용
- 메모리 제한 환경의 임의 OOM — 비결정적 실패 분리·재시도 로직

**Estimated Scope**: medium

---

### Phase 9 — Measurement Infrastructure (측정 인프라)

**Goal**: 핵심 지표(MTTR, HOR, 검증 catch rate, 실패 분류율)가 자동으로 누적·조회된다.

**Inputs**: 현 텔레메트리 부재, CIP-01·CIP-02·CIP-03 명세

**Deliverables**:
- 세션 하트비트 `.campsite/heartbeat`(CIP-01) — 옵트인, 기본 비활성
- 실패 원장 `.campsite/failures.jsonl`(CIP-02) — `campsite save` 시점 옵트인 기록
- HOR 추정 — `campsite sync` 후 컴파일된 컨텍스트의 단어 수 기반 토큰 추정 + 임계 경고(CIP-03)
- 통계 명령 `campsite stats` — 프로젝트별 MTTR·HOR·실패율 요약
- 익명·로컬 보관 원칙 — 외부 송출 절대 금지

**Acceptance Criteria**:
- `campsite stats`는 옵트인 사용자에 대해서만 데이터 출력
- 옵트아웃 사용자에 대해 어떤 측정 파일도 생성되지 않음
- HOR 추정의 단어→토큰 환산 계수가 환경 변수로 조정 가능
- 모든 측정 파일은 plain text, 사용자가 직접 검사·삭제 가능

**Risk**:
- 측정이 사용자 간섭으로 인지될 위험 — 옵트인 기본·로컬 전용으로 차단
- 측정 자체가 HOR 증가를 유발 — 측정 컴포넌트는 컨텍스트 페이로드에 진입 금지

**Estimated Scope**: medium

---

### Phase 10 — OMC Coexistence & tmux Gateway

**Goal**: oh-my-claudecode(OMC) 사용자가 tmux 패널 전환만으로 Campsite에 진입할 수 있다.

**Inputs**: OMC plugin 구조, Campsite CLI

**Deliverables**:
- tmux 통합 가이드 `docs/tmux-integration.md`
- OMC plugin hook 예시 `templates/omc-bridge.sh.template`
- Campsite 진입 시점에 OMC 세션 메타(`OPENCLAW_SESSION` 등) 자동 인식
- 충돌 가드 — 두 도구가 같은 잠금에 접근하지 못하도록 명시적 실패

**Acceptance Criteria**:
- OMC 사용 사례에서 Campsite 진입 5초 이내
- 동일 프로젝트에서 두 도구가 동시 진입 시도 시 명시적 충돌 메시지
- Campsite는 OMC 부재 환경에서도 정상 동작(역의존성 0)

**Risk**:
- OMC 자체의 향후 변경 — 외부 의존을 옵트인 hook으로만 두고 강결합 회피

**Estimated Scope**: small

---

### Phase 11 — First-5-Minutes Experience Polish (첫 5분 다듬기)

**Goal**: 비코더 30대 페르소나가 30분 안에 가치 체감에 도달한다.

**Inputs**: `campsite setup`, README, 모든 선행 단계의 산출물

**Deliverables**:
- 신규 사용자용 단일 명령 `campsite welcome`
  - 자동 환경 점검 → 어댑터 자동 검출 → 첫 프로젝트 시드 → 첫 sync 시연
- 영상 스크립트(60초) — README에 링크, 자체 호스팅
- 페르소나 검증 프로토콜 `docs/persona-validation.md` — 5인 사용자 시험·정성 인터뷰·5초 복귀 측정
- 어휘 일관성 통과 — 이모지·구어 비유·도파민 자극 어휘 0건

**Acceptance Criteria**:
- 5인 페르소나 시험 중 4인 이상이 30분 안에 첫 캠프 진입 성공
- 5초 복귀 측정 평균 8초 이하(보수적 목표)
- 모든 첫 진입 명령은 비파괴 — 어떤 입력도 데이터 손실을 유발하지 않음
- README와 docs/landing.md가 동일한 첫 진입 경로를 제시

**Risk**:
- 페르소나 시험자 확보 — 1인 사용자(희원) 시험만으로는 통계적 신뢰 부족, 적어도 3인 보강 필요
- 자동 환경 점검의 false-positive — 명시적 디버그 출력 옵션 제공

**Estimated Scope**: medium

---

### Phase 12 — Release Engineering & v1.0 (출시 공정)

**Goal**: v1.0이 GitHub Releases로 공식 배포되며, 설치 한 줄로 모든 OS에서 동작한다.

**Inputs**: 모든 선행 단계 통과

**Deliverables**:
- 시맨틱 버전 정책 `docs/versioning.md` — major/minor/patch 의미와 변경 사례
- 자동 릴리즈 워크플로 `.github/workflows/release.yml`
  - tag 푸시 시 tarball 생성·SHA-256·서명·GitHub Releases 업로드
  - camp-client/dist 자동 빌드 포함
- `install.sh` 개정 — release tarball 검증·서명 확인·롤백 절차
- `CHANGELOG.md` 도입 — Keep a Changelog 형식
- v1.0 공식 PRD 동결 — `Campsite-prd-v2.md`를 `Campsite-prd-v2-final.md`로 freeze

**Acceptance Criteria**:
- 신규 사용자 설치 한 줄: `curl -fsSL <release-url>/install.sh | bash`
- 설치 산출물 SHA-256 검증 자동 수행
- v0.x→v1.0 마이그레이션 가이드 1페이지 이내
- 모든 선행 단계의 acceptance criteria 통과

**Risk**:
- 서명 키 관리 — GitHub OIDC + sigstore 활용 권장
- 호환성 단절 — 마이그레이션 경로가 명확하지 않으면 v0.x 사용자 이탈

**Estimated Scope**: medium

---

## 5. 의존성 그래프

```
Phase 5 (Visual Assets) ────┐
                             ▼
Phase 6 (Storyworld) ────────┐
                             ▼
Phase 7 (Multi-Project Hub) ─┐
                             │
Phase 8 (Env Matrix) ────────┤
                             │
Phase 9 (Measurement) ───────┤
                             │
Phase 10 (OMC Coexist) ──────┤
                             ▼
Phase 11 (First-5-Min)
                             │
                             ▼
Phase 12 (v1.0 Release)
```

병렬화 가능 단계: Phase 8, Phase 9, Phase 10은 Phase 5~7과 무관하게 진행 가능.
직렬 의존: Phase 6은 Phase 5 자산이 있어야 의미 있는 검증이 가능.
동결 시점: Phase 12 진입 직전, 모든 acceptance criteria 일괄 재검증.

---

## 6. 위험 분석과 완화 전략

| ID | 위험 | 영향 | 완화 |
|---|---|---|---|
| R-1 | 픽셀 아트 자산 생산 외부 의존 | Phase 5 지연 → 후속 단계 차단 | 자산 우선순위 분리: 화로 코어 1점만 우선 확보, 나머지는 점진 적재 |
| R-2 | Phaser 가동 시 번들 비대 | E1(5초 복귀) 위협 | 코드 분할·자산 lazy-load·legacy HTML 폴백 보존 |
| R-3 | Multi-Project Hub가 단일 프로젝트 단순성 훼손 | E4(비코더 친화) 위협 | 옵트인 명령으로 격리, 기본 경로 영향 0 |
| R-4 | 환경 회귀 행렬 비용 증가로 CI 시간 폭증 | 개발 속도 저하 | Smoke vs Full 분리, smoke만 PR 차단, full은 일일 cron |
| R-5 | 측정 인프라가 사용자 간섭으로 인식 | 사용자 신뢰 손실 | 옵트인 기본·로컬 보관·송출 금지 강제 |
| R-6 | 페르소나 시험자 확보 실패 | E4 검증 불가 | 5인 시험 미달 시 v1.0을 v0.9 RC로 한 단계 강등하고 점진 검증 |
| R-7 | OMC 변경에 의존성 발생 | 외부 변경에 노출 | hook 옵션·역의존성 0 원칙 유지 |
| R-8 | v1.0 동결 시점에 잠재 부채 누적 | 출시 후 패치 폭증 | Phase 12 직전 1주 freeze + 회귀 행렬 강제 통과 |

---

## 7. 마일스톤 일정 (예측)

본 일정은 단독 작업자 기준 보수적 추정이며, 다중 에이전트 팀 동시 가동 시 단축 가능하다. 모든 추정은 ±50% 변동성을 가진다.

| 마일스톤 | 일정 | 산출물 |
|---|---|---|
| M1 | 2026-05 (1주) | Phase 5 자산 1차 — 화로 코어 + 5종 상태 아이콘 |
| M2 | 2026-05 (2~3주) | Phase 5 자산 2차 — 동물 sprite sheet + 환경 타일 |
| M3 | 2026-06 (1~2주) | Phase 6 — camp-client 빌드 가동, legacy 폴백 격리 |
| M4 | 2026-06 (3주) | Phase 8 — CI 행렬 확장, 4GB-safe·WSL 검증 |
| M5 | 2026-07 (1~2주) | Phase 7 — Multi-Project Hub 1차 |
| M6 | 2026-07 (3주) | Phase 9 — 측정 인프라 옵트인 출시 |
| M7 | 2026-08 (1주) | Phase 10 — OMC bridge |
| M8 | 2026-08 (2~3주) | Phase 11 — First-5-Min 다듬기 + 페르소나 시험 |
| M9 | 2026-09 (1주) | Phase 12 — v1.0 동결·tarball·릴리즈 |

총 추정: 18~22주(2026-05 → 2026-09).

---

## 8. 검수 방법론

각 단계는 다음 3중 검증을 통과해야 종료된다.

### 8.1 자동 회귀

- `make check` — 단위·통합 223건+ (단계별 추가 테스트 포함)
- `scripts/hybrid-smoke.sh` — 5종 흐름 회귀
- 환경 행렬 — Phase 8 이후 ubuntu-latest·macos-latest·alpine·WSL2

### 8.2 인지 검증

- Camp mode와 Focus mode를 동시에 열고, 어휘·정서·우선순위가 일치하는지 사람이 확인
- 어휘 합치 검사: working-now / waiting-on-you / next-move + 5종 fire-state
- 거짓 완료 어휘 검사: "done", "complete", "성공" 등의 어휘가 검토 미경유 상태에서 출력되지 않음

### 8.3 페르소나 검증(Phase 11 이후 필수)

- 5인 페르소나 시험 — 비코더 또는 라이트 코더, 30대
- 30분 안에 첫 캠프 진입 성공률 측정
- 정성 인터뷰: "이 도구를 다시 열고 싶은가" / "직전 작업으로 돌아갈 자신이 있는가"

검수 결과는 `docs/validation-log.md`에 누적 기록한다.

---

## 9. 본 문서의 갱신 규칙

- 각 단계 종료 시 `## 4` 단계 명세에 `Status: completed` 표기
- acceptance criteria 미달 시 단계는 termination 대신 `Status: blocked`로 표기하고 사유 명시
- 본 문서와 `docs/implementation-tracker.md`가 충돌하면 본 문서가 우선
- 본 문서의 마일스톤 일정이 ±50% 초과 변동 시 즉시 재추정·재공지

---

## 10. 부록 — 비목표·차후 검토 항목

다음 항목은 본 로드맵에서 의도적으로 배제하며, v1.0 이후에 별도 PRD로 다룬다.

- 클라우드 동기화 백엔드
- 동시 다중 에이전트 분기 실행
- 모바일·태블릿 표면
- 비-PARA 분류 체계(GTD, OKR 등)
- 음성·음향 자산
- 게이미피케이션 점수·랭킹·리더보드(healing 정서와 충돌)

---

## 11. 본 문서의 자기 일관성 검증

- §1.1 F1~F7 + §1.2 E1~E7 = 14개 조건. §4 Phase 5~12 = 8개 단계. 매핑은 다음과 같다.

| 조건 | 충족 단계 |
|---|---|
| F1·F3·F4·F7 | 현재(v0.2.0) 충족 |
| F2 | 현재 충족, Phase 12에서 검증 강화 |
| F5 | Phase 8 |
| F6 | Phase 8 |
| E1 | Phase 11 검증, 모든 단계 누적 기여 |
| E2 | 현재 1차 충족, Phase 6에서 storyworld까지 확장 |
| E3 | Phase 9 측정 + Phase 11 검증 |
| E4 | Phase 11 |
| E5 | Phase 7 |
| E6 | 현재 충족, 모든 단계에서 거짓 완료 검사 유지 |
| E7 | Phase 10 |

미매핑 조건 0건. 본 로드맵은 §1 정의를 빠짐없이 충족한다.

---

*Document created: 2026-04-29*
*Owner: Kiwon Cho*
*Source of truth: 본 문서가 충돌 시 우선*
