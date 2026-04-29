# 채택 자원 매니페스트 — design/system/

> 본 문서는 `design/handoff/2026-04-29-claude-design/` 핸드오프 패키지에서
> UX 평가(`UX_EVAL_2026-04-29.md`) §5 "강점 — 채택 가능한 부분" 으로 분류된
> 자산만을 권위 디렉토리(`design/system/`)로 추출한 결과를 기록한다.
>
> 본체 `lib/camp.sh` 통합 시 본 디렉토리만이 단일 진실원이며, 핸드오프 원본은
> 더 이상 권위 자료로 인용되지 않는다 (UX_EVAL §6.1 권고).

---

## 1. 채택 자원 (4종)

### 1.1 tokens.css

| 항목 | 내용 |
|---|---|
| 파일 | `design/system/tokens.css` |
| 출처 | `design/handoff/2026-04-29-claude-design/project/styles/tokens.css:1-199` |
| 추출 방식 | verbatim 복사 + 검토 주석 추가 |
| 채택 사유 | UX_EVAL §5 — "CSS 토큰 구조" (code-reviewer 7/10), "환경 테마별 의미 색채 보존" (designer 8/10), "화로 5종 의미 색채 분화" (designer 8/10) |
| 라이선스 | CC BY 4.0 (발주서 §13.2) |
| 잔여 검토 | `--bg #0e0e14` 발주서 §5.1 무단 변경 / Canyon `--on-surface-faint` 콘트라스트 2.6:1 (UX_EVAL §4.4) |

### 1.2 motion.css

| 항목 | 내용 |
|---|---|
| 파일 | `design/system/motion.css` |
| 출처 | `pixel-art.css:109-120, 172-179` + `scene.css:170-173, 224-227, 244-247` |
| 추출 방식 | 7종 keyframes 만 정제 추출, 셀렉터·블러·rounded 일체 제외 |
| 채택 사유 | UX_EVAL §5 — "모션 사양 정합" (code-reviewer 8/10), 발주서 §5.7 주기·곡선 범위 부합 |
| 라이선스 | CC BY 4.0 (발주서 §13.2) |
| 잔여 검토 | `spark-rise` linear 곡선 → cubic-bezier 또는 ease-out 권고 (UX_EVAL §3.5 P2-5) |

### 1.3 fire-states.css

| 항목 | 내용 |
|---|---|
| 파일 | `design/system/fire-states.css` |
| 출처 | `design/handoff/2026-04-29-claude-design/project/styles/pixel-art.css:122-179` |
| 추출 방식 | `.fire-mini` 5상태 셀렉터만 추출, 96×96 `.campfire` 본체와 동물 sprite 는 제외 |
| 채택 사유 | UX_EVAL §5 — "fire-mini 의 clip-path 까지 차별화", 5종 HEX 색상환상 명확 분리 |
| 라이선스 | CC BY 4.0 (발주서 §13.2) |
| 잔여 검토 | `yeongi` clip-path 다각형이 4px 픽셀 격자 미정렬 (§8-5 위반 가능성) — 본체 통합 시 정수 좌표로 재산출 |

### 1.4 surface.css

| 항목 | 내용 |
|---|---|
| 파일 | `design/system/surface.css` |
| 출처 | `scene.css:6-55, 482-589, 591-638` (선별) |
| 추출 방식 | Top Status / Return Panel / Next-Move Box / Activity Strip 의 No-Line 위계 셀렉터만 추출. `border-radius`·`outline 1px solid`·`filter: blur(*)` 사용 셀렉터는 제외. yeongi amber 강조선만 채택. |
| 채택 사유 | UX_EVAL §5 — "5영역 IA 골격" (analyst), "복귀 우선순위 시각 작동" (analyst), "Surface No-Line 원칙 98% 준수" (designer), "Camp/Focus 공유 어휘 1:1 일치" (designer) |
| 라이선스 | CC BY 4.0 (발주서 §13.2) |
| 잔여 검토 | Drawer 인터랙션은 a11y 6항 위반 (UX_EVAL §3.4) 으로 전부 제외 — 본체 vanilla JS 재작성 시점에 신설 |

---

## 2. 미채택 자산 요약

상세는 `REJECTED.md` 참조. 본 추출 작업에서 의도적으로 동봉하지 않은 자원은 다음과 같다.

- **인터랙션 코드 일체** (active-camp.jsx, focus-mode.jsx, multi-camp.jsx, campsite-app.jsx) — UX_EVAL §3.4 a11y 6항 위반, §3.5 React/Babel CDN 외부 의존
- **Drawer / Backdrop 시스템** (`scene.css:641-802`) — `role="dialog"`·focus trap·ESC 핸들러 부재
- **Aurora ribbon `filter: blur(28px)`** (`scene.css:188-227` 의 일부) — §8-5 픽셀 그리드 위반
- **Mission card `backdrop-filter: blur(8px)`** (`scene.css:366-424`) — §8-5 위반
- **Participant `border-radius: 50%` glow** (`scene.css:436-479`) — §8-2 위반
- **`outline: 1px solid rgba(0,220,229,0.2)`** (`scene.css:120`) — §8-1 위반
- **96×96 `.campfire` 본체 sprite** (`pixel-art.css:21-120`) — Dave the Diver 도달도 3/10 (UX_EVAL §4.5), PNG sprite sheet 후속 발주 필수
- **동물 sprite SVG data URI 6종** (`pixel-art.css:181-228`) — 단일 프레임, §6.1 명세 "5상태 × 4프레임 = 120프레임" 미달
- **Mountain / Forest / Ground silhouette** — 채택 가능하나 본 라운드 범위 외 (Camp scene 본체 통합 시 별도 발주)
- **Multi-camp tile `.mini-camp`** (`multi.css:1-97`) — F-3 시안 위상이 LoFi prototype, 본체 임베드 부적격

---

## 3. 변경 이력

| 날짜 | 변경 | 사유 | 작업자 |
|---|---|---|---|
| 2026-04-29 | 초기 추출 (Track C) | UX_EVAL 4인 합의 기반 채택분 분리 | Executor (Track C) |
