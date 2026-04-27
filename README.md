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

### 빠른 방법 (curl)

```bash
curl -fsSL https://raw.githubusercontent.com/ReliOptic/campsite/main/install.sh | bash
```

이 한 줄이 다음을 합니다:
- `~/.campsite/` 에 binary + libraries 설치
- `~/.bashrc` / `~/.zshrc` / `~/.profile` 에 PATH + shell wrapper 자동 추가
- (wrapper 는 `campsite go` 가 같은 shell 에서 `cd` 하기 위해 필요)

### git clone 으로 설치

```bash
git clone https://github.com/ReliOptic/campsite.git
cd campsite
./install.sh
```

### 특정 버전 고정

```bash
CAMPSITE_VERSION=v0.2.0 curl -fsSL https://raw.githubusercontent.com/ReliOptic/campsite/main/install.sh | bash
```

### 다른 위치에 설치

```bash
CAMPSITE_HOME="$HOME/tools/campsite" ./install.sh
```

### 설치 확인

새 터미널을 열거나, 현재 shell 에서:

```bash
export CAMPSITE_HOME="$HOME/.campsite"
export PATH="$CAMPSITE_HOME/bin:$PATH"

campsite --version
```

### 의존성

- bash 3.2 이상 (macOS 기본 포함)
- `sed`, `awk`, `git`
- `sha256sum` / `shasum` / `openssl` 중 하나 (대부분 기본)

### 제거

```bash
make uninstall    # repo 디렉토리에서
# 또는 그냥
rm -rf ~/.campsite
```

`~/.campsite/user/config.sh` 는 보존됩니다 (재설치 시 설정 유지).

---

## 사용법

### 처음 한 번 — Day 1

#### 1. 워크스페이스 정하기

여러 프로젝트를 한 곳에서 관리할 폴더를 정합니다.

```bash
campsite workspace set ~/projects
```

#### 2. 프로젝트 캠프로 만들기

```bash
cd ~/projects/my-app
campsite init
```

`status.md`, `handoff.md`, `decisions.md`, `README.md` 가 생깁니다.
이게 캠프의 *진짜* 상태 — AI 도 사람도 같은 파일을 읽습니다.

#### 3. 미션 적기

`status.md` 와 `handoff.md` 를 열어서 채우세요:

```markdown
# Status
- phase: building
- confidence: high

# Handoff
- task: 결제 모듈 리팩토링
```

이 두 파일이 모든 AI 에이전트가 컨텍스트로 읽는 source of truth.
CLAUDE.md / AGENTS.md 같은 도구별 파일 따로 안 만들어도 됩니다.

#### 4. AI 와 함께 작업 시작

```bash
campsite
```

프로젝트 목록 → AI 에이전트 (claude/codex/gemini/...) → 자동 launch.
선택한 에이전트가 컴파일된 컨텍스트를 가지고 시작합니다.

#### 5. 끝내고 저장

```bash
campsite save           # 락 풀고 정리
campsite save --push    # git checkpoint commit + push까지
```

---

### 다음 날 돌아왔을 때 — Day N

```bash
campsite
```

만약 `status.md` / `handoff.md` 가 너무 오래됐으면 (기본 2일 이상) campsite 가 **실행을 거부**합니다:

```
◎  camp state is stale — refusing to launch on rotten context.
   status.md: 5d old   handoff.md: 5d old

recovery options:
  - update status.md / handoff.md, then campsite sync
  - skip the gate this once: campsite --force
  - relax the policy: CAMPSITE_FRESHNESS_POLICY=warn (or off)
```

이게 **recovery-first** 의 실제 모습 — 썩은 컨텍스트로 silent launch 안 함.

상태가 fresh 하면 그냥 launcher 가 뜨고, "이전에 어디까지 했더라" 같은 정보가 batner 에 다 보입니다:

```
my-app │ claude │ macbook
phase: building
confidence: high
next: 결제 모듈 리팩토링
```

---

### 여러 캠프 동시에 — HUD

작업 중 다른 창에서 모든 캠프 상태를 보려면:

```bash
campsite hud         # 풀스크린 폴링 (1Hz, alt-screen)
campsite hud --once  # 한 번만 출력
```

tmux 사용자라면 status-line 에 박을 수 있습니다 (`~/.tmux.conf`):

```tmux
set -g status-interval 2
set -g status-right '#(campsite hud --line)'
```

이러면 tmux 의 모든 창 위에 항상 모든 캠프의 상태가 떠 있습니다:

```
● my-app/claude·12m · ◌ blog/idle 1h · ⚠ api/exit=1
```

---

### 자주 쓰는 흐름

```bash
# 다른 프로젝트로 점프 (cd 까지 됨, 옵션 --sync 로 컨텍스트 갱신)
campsite go my-app
campsite go --sync

# 현재 캠프 상태만 확인 (실행 안 함)
campsite status

# 다른 창에서 실시간으로 캠프 보기 (브라우저)
campsite camp serve

# 모든 캠프 일람
campsite dashboard

# 충돌난 락 / 좀비 세션 정리
campsite recover

# 구조 점검 (status.md 형식, freshness 등)
campsite validate
```

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
