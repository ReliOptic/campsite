# Campsite: 데모 → 프로덕트 구현 완료

날짜: 2026-04-04

## 구현 완료 사항

### Phase 1: Signal Collector (`lib/collector.sh`)
- `collector_git_snapshot()` — git 상태 주기적 캡처
- `collector_file_activity()` — status.md/handoff.md 변경 감지
- `collector_record_event()` — 이벤트 로그 기록
- `collector_last_activity_ts()` — 부재 감지용 sentinel mtime
- `collector_absence_summary()` — 복귀 시 부재 요약 JSON 생성
- `collector_install_git_hook()` — post-commit hook 자동 설치
- `collector_recent_commits_count()`, `collector_recent_events()`

### Phase 2: Agent Lifecycle (`lib/agent.sh`)
- `agent_launch()` — 에이전트 래핑 실행 (PID 추적, output 캡처, 이벤트 기록)
- `agent_poll()` — 백그라운드 10초 간격 git snapshot
- `agent_list_active()` — 활성 에이전트 목록 (zombie 감지 포함)
- `agent_last_exit_code()` — 마지막 종료 코드 (fire state 도출용)
- `agent_get_summary()` — 세션 요약

### Phase 3: Fire State Engine (`lib/firestate.sh`)
- `firestate_derive()` — 실제 신호 기반 fire state 자동 도출
  - 에이전트 활성 + 커밋 → modakbul
  - 에이전트 활성, 커밋 없음 → bulssi
  - 에이전트 에러 종료 → yeongi
  - 최근 작업 완료 → deungbul
  - 4시간+ 부재 → jangjak
- `firestate_color()`, `firestate_label_ko()`, `firestate_label_en()`

### Phase 4: Live Dashboard
- `cmd_export` 확장: participants, events (with timestamps), gitSummary, fireLabel, nextAction
- `StateLoader.ts` 인터페이스 확장: ParticipantEntry, EventEntry, GitSummary, RecoveryData
- `Dashboard.ts`: 10초 polling으로 camp.json 자동 갱신
- `EventFeed.ts`: 구조화된 이벤트 (timestamp + description) 표시

### Phase 5: Recovery Flow
- `collector_absence_summary()` — 부재 중 발생한 커밋/이벤트/에이전트 상태 요약
- `ReturnOverlay.ts` — 실제 recovery 데이터 표시 (부재 시간, 커밋 수, 마지막 에이전트)
- `Narrative.ts` — `formatAbsenceSummary()`, `formatDurationKo()`

### Phase 6: Onboarding
- `first_run_flow()` — git repo에서 처음 campsite 실행 시 자동 init + 미션 입력
- `_first_run_populate_status()` — git 상태에서 status.md 자동 생성

## 데이터 흐름

```
git commit → post-commit hook → commits.tsv, events.tsv
campsite go → agent_launch → session dir (PID, status, output.log)
agent_poll (10s) → git-snapshot.tsv, last-activity sentinel
cmd_export → firestate_derive() + collector data → camp.json
Dashboard.ts (10s poll) → fetch camp.json → UI 갱신
camp serve (3s bg) → cmd_export → camp.json 갱신
```

## 디렉토리 구조

```
.campsite/
  signals/
    commits.tsv          ← git hook 자동 기록
    events.tsv           ← collector_record_event() 기록
    git-snapshot.tsv     ← collector_git_snapshot() 기록
    file-activity.tsv    ← collector_file_activity() 기록
    last-activity        ← sentinel (touch, mtime로 부재 감지)
  sessions/
    claude-1712191200/
      agent.name         ← "claude"
      agent.pid          ← PID
      status             ← running | finished | crashed
      started_at         ← epoch
      finished_at        ← epoch
      exit_code          ← 0, 1, etc.
      output.log         ← tty 출력 캡처
```

## 검증 방법

```bash
# 신호 수집 확인
cd <project> && git commit -m "test"
cat .campsite/signals/commits.tsv

# 에이전트 생명주기
campsite go claude
ls .campsite/sessions/
campsite status  # fire state 표시

# 라이브 대시보드
campsite camp serve  # 브라우저에서 10초마다 갱신

# 복귀 흐름
# (5분+ 대기 후)
campsite camp serve  # "돌아왔어요" overlay에 실제 데이터

# 온보딩
mkdir test && cd test && git init
campsite  # → guided flow
```
