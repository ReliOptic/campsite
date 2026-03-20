# Campsite

> AI 코딩 에이전트를 위한 프로젝트 상태 컴파일러 + 크래시 리커버리 하네스

bare `claude`를 치면 빈 방에 들어가는 것이다.
`campsite sync` 후 `claude`를 치면 **어제 내가 떠난 책상에 다시 앉는** 것이다.

---

## 설치

### curl (권장)

```bash
curl -fsSL https://raw.githubusercontent.com/ReliOptic/campsite/main/install.sh | bash
```

새 터미널을 열거나 즉시 적용:

```bash
export CAMPSITE_HOME="$HOME/.campsite"
export PATH="$CAMPSITE_HOME/bin:$PATH"
```

확인:

```bash
campsite --version
```

### git clone

```bash
git clone https://github.com/ReliOptic/campsite.git
cd campsite
bash install.sh
```

### 개발자 모드 (소스 직접 수정)

```bash
git clone https://github.com/ReliOptic/campsite.git
cd campsite
make dev   # ~/.campsite/bin/campsite → 소스 트리 symlink
```

---

## 지원 플랫폼

| 플랫폼 | 지원 |
|---|---|
| macOS | ✅ |
| Linux | ✅ |
| Windows (WSL) | ✅ |

요구사항: `bash`, `git`, 표준 Unix 도구. 추가 의존성 없음.

---

## 핵심 개념

Campsite는 **wrapper가 아니라 compiler**다.

```
이전 (wrapper):   campsite claude /path → 에이전트 실행 경로에 끼어듦

현재 (compiler):  campsite sync
                       ↓ 생성
                  CLAUDE.md, AGENTS.md, .cursorrules, GEMINI.md ...
                       ↓ 각 도구가 네이티브로 읽음
                  claude    (직접)
                  cursor    (직접)
                  codex     (직접)
```

`campsite sync`가 끝나면 campsite는 메모리에 없다. 에이전트는 자기 네이티브 파일만 읽는다.

---

## 빠른 시작

```bash
# 1. 새 프로젝트 부트스트랩
campsite init ~/projects/my-app
cd ~/projects/my-app

# 2. status.md, handoff.md 편집 (현재 상태 + 다음 작업 기록)

# 3. 에이전트 네이티브 컨텍스트 파일 컴파일
campsite sync

# 4. 에이전트 시작 (claude가 CLAUDE.md를 자동으로 읽음)
claude

# 5. 세션 종료 시
campsite save
```

---

## CLI 명령어

| 명령어 | 역할 |
|---|---|
| `campsite` | 인터랙티브 런처 (프로젝트 + 에이전트 선택) |
| `campsite init [path]` | 새 프로젝트 부트스트랩 |
| `campsite sync` | source of truth → 에이전트 네이티브 파일 컴파일 |
| `campsite sync --adapter=claude` | 특정 에이전트만 컴파일 |
| `campsite save` | 변경 확인 + 컴파일 파일 정리 + lock 해제 |
| `campsite status` | 현재 프로젝트 상태 요약 |
| `campsite validate` | 구조 + 신선도 검증 |
| `campsite recover` | 비정상 종료 후 orphaned lock 정리 |
| `campsite dashboard` | 전체 프로젝트 현황 |
| `campsite workspace set <path>` | workspace 루트 설정 |
| `campsite --version` | 버전 출력 |

---

## 프로젝트 구조

`campsite init`이 생성하는 파일:

```
my-app/
├── README.md        # 프로젝트 설명 (stable)
├── status.md        # 현재 상태 (volatile, source of truth)
├── handoff.md       # 다음 작업 (volatile, source of truth)
├── decisions.md     # 의사결정 로그 (append-only)
├── .gitignore       # CLAUDE.md 등 컴파일 파일 제외 포함
└── .campsite/       # campsite 내부 데이터 (hash, lock)
```

`campsite sync`가 생성하는 파일 (`.gitignore` 처리됨):

| 에이전트 | 생성 파일 |
|---|---|
| Claude Code | `CLAUDE.md` |
| OpenAI Codex | `AGENTS.md` |
| Cursor | `.cursorrules` |
| GitHub Copilot | `.github/copilot-instructions.md` |
| Gemini CLI | `GEMINI.md` |

---

## 어댑터 시스템

새 AI 에이전트 추가는 파일 하나면 충분:

```bash
cat > ~/.campsite/user/adapters/my-agent.sh << 'ADAPTER'
name: my-agent
context-file: .my-agent-context.md
location: project-root
format: markdown
command: my-agent
sections: status handoff decisions readme
ADAPTER
```

이후 `campsite sync`가 자동으로 `.my-agent-context.md`를 생성한다.

---

## 멀티 터미널 안전성

```bash
# 터미널 A — 프로젝트 진입
campsite sync   # lock 획득

# 터미널 B — 같은 프로젝트 진입 시도
campsite sync   # → "project locked by user (claude on mac)" 오류

# 터미널 A 비정상 종료 후 복구
campsite recover  # → orphaned lock 자동 정리
```

---

## 크로스 디바이스 워크플로

```bash
# MacBook에서 작업 종료
campsite save
git add status.md handoff.md decisions.md
git commit -m "wip: auth-service session"
git push

# 다른 기기에서 재개
git pull
campsite sync   # 어제 상태 그대로 컴파일
claude          # 첫 발화에 프로젝트명, phase, next task 포함
```

---

## 제거

```bash
# 설치 파일 제거 (user config 보존)
rm -rf ~/.campsite/bin ~/.campsite/lib ~/.campsite/adapters \
       ~/.campsite/templates ~/.campsite/config ~/.campsite/version

# 완전 제거
rm -rf ~/.campsite

# 그 다음 ~/.bashrc, ~/.zshrc, ~/.profile에서 CAMPSITE_HOME 줄 삭제
```

---

## 설치 위치

```
~/.campsite/
  bin/campsite          ← PATH에 추가되는 실행 파일
  lib/                  ← bash 라이브러리 모듈
  adapters/             ← 내장 어댑터 (claude, codex, cursor, copilot, gemini)
  templates/            ← 프로젝트 부트스트랩 템플릿
  config/defaults.sh    ← 기본 설정
  user/
    config.sh           ← 사용자 설정 (덮어쓰지 않음)
    adapters/           ← 커스텀 어댑터
  history               ← 세션 이력 (로컬 전용)
  version               ← 버전 파일
```

---

## GitHub

**https://github.com/ReliOptic/campsite**

```bash
# 업데이트
curl -fsSL https://raw.githubusercontent.com/ReliOptic/campsite/main/install.sh | bash
```
