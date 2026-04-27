# Campsite

> 여러 프로젝트와 AI를 하나의 캠프에 모아서, 돌아왔을 때 3초 안에 다시 시작할 수 있게.

---

## 이런 경험을 만들고 싶었어요

터미널에서 Claude로 작업하다 회의에 갔다 옵니다.
다시 앉으면 — "어디까지 했더라?"

그 10분을 없애고 싶었어요.

Campsite를 열면:

- 누가 아직 일하고 있는지
- 뭐가 나를 기다리고 있는지
- 다음에 뭘 하면 되는지

3초 안에 보입니다.

---

## 설치

```bash
curl -fsSL https://raw.githubusercontent.com/ReliOptic/campsite/main/install.sh | bash
```

새 터미널을 열거나:

```bash
export CAMPSITE_HOME="$HOME/.campsite"
export PATH="$CAMPSITE_HOME/bin:$PATH"
```

---

## 첫 5분

### 1. 캠프 만들기

```bash
campsite
```

처음 실행하면 자동으로 안내가 시작됩니다.
프로젝트 경로만 알려주면 끝.

### 2. 프로젝트 시작

```bash
campsite init ~/projects/my-app
cd ~/projects/my-app
```

`status.md`와 `handoff.md`가 생깁니다.
지금 뭘 하고 있는지, 다음에 뭘 할 건지 적어주세요.

### 3. 작업 시작

```bash
campsite
```

프로젝트를 고르고, AI agent를 고르면 바로 시작.

### 4. 캠프 보기

```bash
campsite camp render
```

브라우저에 캠프가 열립니다.
미션, 진행 상태, 참여자가 한 화면에.

실시간으로 보고 싶다면:

```bash
campsite camp serve
```

### 5. 끝내기

```bash
campsite save
```

"좋아요! 다음에 돌아오면 바로 시작할 수 있어요."

---

## 3가지 약속

### 발상 (Ideation)

AI에게 일을 시키기 전에 의도를 선명하게.
캠프를 열면 mission board가 보입니다.

### 검토 (Review)

AI가 만든 것을 사람이 판단하는 중심.
등불(🏮) = "봐줘야 해", 연기(💨) = "도와줘".

### 체력 (Stamina)

오래 일할 수 있는 리듬.
프로젝트 전환 2초, 복귀 3초, 스트레스 적게.

---

## 명령어

| 명령어 | 설명 |
|---|---|
| `campsite` | 프로젝트 선택 + AI 실행 |
| `campsite --force` | 위와 같지만 freshness 게이트 무시 |
| `campsite setup` | 처음 한 번 설정 |
| `campsite init [path]` | 새 프로젝트 만들기 |
| `campsite sync` | 프로젝트 상태 → AI 컨텍스트 변환 |
| `campsite save` | 작업 끝내기 |
| `campsite save --push` | 끝내고 git push까지 |
| `campsite status` | 현재 상태 요약 |
| `campsite hud` | 모든 캠프의 살아있는 상태판 (폴링) |
| `campsite hud --line` | tmux status-line 용 한 줄 |
| `campsite hud --json` | 다른 도구로 넘길 JSON 스냅샷 |
| `campsite camp render` | 캠프 화면 열기 |
| `campsite camp serve` | 실시간 캠프 서버 |
| `campsite camp mission` | 미션 설정 (대화형) |
| `campsite validate` | 구조 점검 |
| `campsite recover` | 고아 세션 정리 |
| `campsite dashboard` | 전체 프로젝트 목록 |

---

## 여러 캠프 한눈에 — `campsite hud`

캠프 3개 이상 돌리고 있으면 "지금 뭐가 어디까지 됐지?" 우왕좌왕하는 시간이 의외로 깁니다.
HUD 가 그걸 죽입니다.

```bash
campsite hud              # 풀스크린 폴링 (1초마다, alt-screen)
campsite hud --once       # 한 번만 출력하고 종료
campsite hud --line       # tmux status-line 용 한 줄
campsite hud --json       # JSON 스냅샷
campsite hud --interval=2 # 폴링 간격 조절 (초)
```

각 캠프마다: 불 상태 글리프, 지금 무엇을 하고 있는지 (active agent + uptime, 또는 idle 시간), 미션, 락 여부, freshness 로 깎인 effective confidence.

### tmux 통합 (한 줄)

```tmux
set -g status-interval 2
set -g status-right '#(campsite hud --line)'
```

이러면 어떤 창에 있든 위쪽에 항상 모든 캠프 상태가 떠 있습니다.

```
● campsite/claude·1m12s · ◌ foo/idle 12m · ⚠ bar/exit=1 · ○ baz/idle 4h
```

---

## 오래 떠나있다 돌아온다면 — Freshness gate

캠프의 약속은 *recovery-first* 입니다.
3일 만에 돌아왔는데 status.md / handoff.md 가 낡았다면, agent 가 썩은 컨텍스트 위에서 silent 하게 작업을 시작하면 안 됩니다.

기본 동작 (정책: `strict`):

| 캠프 상태 | 동작 |
|---|---|
| **fresh** (1일 이내) | 그냥 시작 |
| **aging** (1~2일) | 경고 + 진행 |
| **stale** (2일 이상) | **실행 거부** (rc=2) |

stale 일 때 "그래도 시작할게요" 하려면 의식적으로 override:

```bash
campsite --force                          # 일회성 bypass
CAMPSITE_FORCE=1 campsite                  # 환경변수로 bypass
CAMPSITE_FRESHNESS_POLICY=warn campsite    # block 대신 warn 으로
CAMPSITE_FRESHNESS_POLICY=off  campsite    # 게이트 자체를 끔
CAMPSITE_STALE_DAYS=7 campsite             # stale 기준을 7일로
```

stated confidence (status.md 의 `confidence: high`) 도 freshness 가 깎습니다 — aging 이면 한 단계, stale 이면 `low` 로 floor. 이 effective confidence 는 launcher 목록 / `campsite status` / 세션 시작 배너에 모두 보입니다 (예: `confidence: high → low (degraded by stale state)`).

---

## 캠프의 불 상태

| 상태 | 의미 |
|---|---|
| 불씨 (bulssi) | 막 시작됨 |
| 모닥불 (modakbul) | 활발하게 진행 중 |
| 등불 (deungbul) | 검토 필요 |
| 연기 (yeongi) | 막혀있음 |
| 장작 (jangjak) | 다음 할 일 준비됨 |

---

## OMC와 함께 쓰기

[oh-my-claudecode](https://github.com/nicobailon/oh-my-claudecode)를 쓰고 있다면 — 잘 맞습니다.

- OMC = 세션 안에서의 실행력 (agent 병렬, orchestration)
- Campsite = 세션 사이의 연속성 (복귀, 시각화, 캠프)

tmux에서 여러 터미널로 Claude/Codex/Gemini를 돌리고, Campsite에서 전체를 봅니다.
CLAUDE.md는 건드리지 않아요.

---

## 디자인

캠프는 이런 느낌입니다:

- 야간, 차분, 따뜻한 불빛
- 귀엽지만 유치하지 않음
- 스트레스 적게, 명상적
- 터미널 네이티브이면서 시각적

---

## 문서

- [PRD](docs/spec-driven-prd-vibe-camp.md) — 제품 방향과 시나리오
- [Guide](docs/guide.md) — 상세 사용 가이드
- [Reference](docs/reference.md) — CLI 레퍼런스
- [Design System](docs/DESIGN.md) — 시각 디자인 시스템
- [Family Look](docs/family-look-spec.md) — Camp/Focus 통일 규칙

---

## 개발

```bash
make test         # 전체 테스트 (bats 필요)
make qa           # bats 없이도 돌아가는 통합 QA 하니스 (~1.5초)
make test-hybrid  # 실제 git push까지 포함한 smoke
make lint         # shellcheck
```

---

## 기여

이슈와 PR은 [GitHub](https://github.com/ReliOptic/campsite)에서 받습니다.

---

*Recovery-first AI workspace.*
*돌아왔을 때, 바로 시작할 수 있게.*
