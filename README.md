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
| `campsite setup` | 처음 한 번 설정 |
| `campsite init [path]` | 새 프로젝트 만들기 |
| `campsite sync` | 프로젝트 상태 → AI 컨텍스트 변환 |
| `campsite save` | 작업 끝내기 |
| `campsite save --push` | 끝내고 git push까지 |
| `campsite status` | 현재 상태 요약 |
| `campsite camp render` | 캠프 화면 열기 |
| `campsite camp serve` | 실시간 캠프 서버 |
| `campsite camp mission` | 미션 설정 (대화형) |
| `campsite validate` | 구조 점검 |
| `campsite recover` | 고아 세션 정리 |
| `campsite dashboard` | 전체 프로젝트 목록 |

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

## 기여

이슈와 PR은 [GitHub](https://github.com/ReliOptic/campsite)에서 받습니다.

---

*Recovery-first AI workspace.*
*돌아왔을 때, 바로 시작할 수 있게.*
