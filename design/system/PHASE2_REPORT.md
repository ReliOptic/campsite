# Phase 2 — WCAG 2.2 AA 자체 보정 + 시나리오 D 자체 시안 + 768px 폴백

> 일자: 2026-04-29
> 모드: Self-Resource
> 결과: 자체 시안 채택 가능 — HTTP 200 ×5 검증 + a11y 가드 충분

---

## 1. 산출물

| 파일 | 분량 | 역할 |
|---|---|---|
| `design/system/preview/active-camp.html` | 32 KB | 시나리오 D F-2 자체 시안 + vanilla JS Drawer + 768px 폴백 |
| `design/system/preview/start-preview.sh` | 1.4 KB | Standalone 미리보기 launcher (port 4292) |

자체 시안은 핸드오프 React+Babel 코드를 의존하지 않고 권위 자원 4개 CSS만으로 동작한다. 외부 자원은 Google Fonts CDN(폴백 chain 동반)뿐이다.

---

## 2. UX_EVAL §3.4 WCAG 2.2 AA 6항 자체 보정 결과

| WCAG | 1차 위반 | Phase 2 처리 |
|---|---|---|
| 2.1.1 키보드 | 클릭 div의 키보드 미지원 | `role="button"` + `tabindex="0"` + `keydown` Enter/Space 핸들러 적용 (active-camp.html:728-738) |
| 2.4.3 포커스 순서 | Drawer focus trap 부재 | vanilla JS focus trap 구현, ESC 닫기, 닫힘 시 lastFocus 복귀 (active-camp.html:678-720) |
| 4.1.2 이름·역할 | Drawer dialog 의미 부재 | `role="dialog"` + `aria-modal="true"` + `aria-labelledby="drawer-title"` + `aria-hidden` 토글 |
| 1.4.1 색상 비의존 | state-pip 색상 의존 | SVG path 형태 동반(다이아몬드 모양 ◆), `role="img"` + `aria-label` 부여 |
| 1.4.3 텍스트 콘트라스트 | Canyon 보조 텍스트 2.6:1 | tokens.css `--on-surface-faint` Canyon 토큰 `#9a826b → #5e4828` (4.5:1 통과) — Phase 1 commit `72746ec` 처리 완료 |
| 1.1.1 비텍스트 콘텐츠 | 동물 sprite·flame alt 부재 | 동물 sprite `aria-label="Claude · fox — 모닥불 modakbul, 자세히 보기"`, hearth `role="img" aria-label="campfire — 모닥불 활동 중"`, moon `role="img" aria-label="moon"` |

추가 가드:

- Skip link (`<a href="#camp-main" class="sr-only">메인 콘텐츠로 건너뛰기</a>`) — WCAG 2.4.1
- 한·영 병기에 `lang="ko"` / `lang="en"` 27건 적용 — WCAG 3.1.1 / 3.1.2
- 모든 인터랙티브 요소 `:focus-visible` 가드 (2px solid tertiary outline) — WCAG 2.4.7

---

## 3. §8 절대 금지 보정 점검 (preview HTML)

```bash
$ grep -nE "border-radius:[^0]" design/system/preview/active-camp.html
(no matches)

$ grep -nE "outline:.*solid" design/system/preview/active-camp.html
347:      outline: 2px solid var(--tertiary);
463:      outline: 2px solid var(--tertiary);
```

`outline:solid` 2건은 모두 `:focus-visible` 셀렉터에 한정된 **focus 가시성 가드**이다. WCAG 2.4.7(Focus Visible)은 AA 필수 요건이며, 정적 구분선과는 의도가 다르다. §8-1 "1px 실선 외곽선·구분선 사용 금지"의 본의는 *정적 layout 분리선*에 한정하며, focus indicator는 §8-1 예외로 등록한다.

**§8-1 예외 등록 결정**:

- 적용 셀렉터: `*:focus-visible`만 허용
- 색상: `var(--tertiary)` 또는 `var(--modakbul)`
- 두께: 2px (1px가 아닌 시각 분별성 강화)
- offset: 2~4px 권장
- 정적 분리선·테두리·외곽선에는 여전히 적용 금지

본 예외는 self-resource 정책으로 한정 채택되며, 외부 디자이너 발주 재개 시 발주서 §8-1 보완 협의 사항으로 등록한다.

---

## 4. P1 권고 처리

| ID | 권고 | Phase 2 처리 |
|---|---|---|
| P1-1 | Left Rail 정보 밀도 50% 감축 | LOCAL 4행(status / branch / last seen / freshness) + 펼치기 토글 뒤 추가 3행(device / adapters / lock) |
| P1-2 | 화로 z-index 위계 회복 | hearth `z-index:4` (animal-sprite는 z:5, mission-card는 z:3) — 화로가 시각 무게 1순위 회복 |
| P1-3 | 한·영 병기 위계 규칙 | 1차 정보(미션 제목·다음 행동·Working now 항목) 동시 노출, 2차 정보(메타·시간)는 영문 단일 + `title` 속성으로 한국어 hover |
| P1-4 | Canyon 콘트라스트 | Phase 1 commit `72746ec`에서 처리 완료 |
| P1-5 | Dave the Diver 도달도 | v1.1로 이연 (LoFi 시각 정체성 채택, PNG 자산 후속 발주 시 처리) |

---

## 5. 768px 폴백 자체 구현

`@media (max-width: 980px)` 분기에서:

- workspace grid 1열 stack
- Left Rail / Return Panel 기본 숨김 + mobile-tabs(Scene / Local / Return) 토글
- mission-card 90% 폭 축소
- drawer 100vw 채택
- 모든 텍스트 절단 없이 가독 (overflow-wrap·max-width 적용)

발주서 §10.2 "768 px 폴백 시안에서도 영웅 영역이 깨지지 않는다" 통과 가능.

---

## 6. 외부 의존 처리 (P0-5)

| 의존 | 처리 |
|---|---|
| React 18 + ReactDOM | **제거** (vanilla JS) |
| Babel Standalone | **제거** (`text/babel` 미사용) |
| Google Fonts CDN | 유지하되 폴백 chain 동반 (`Inter`, `Pretendard` 미로드 시 system-ui) |

본체 통합(Phase 4) 시점에 Pretendard·Space Grotesk 자체 호스팅을 추가 검토한다.

---

## 7. HTTP 검증

```bash
$ bash design/system/preview/start-preview.sh 4292
$ curl http://127.0.0.1:4292/preview/active-camp.html
HTTP 200 · 32319B · text/html
$ curl http://127.0.0.1:4292/tokens.css
HTTP 200 · 6262B
$ curl http://127.0.0.1:4292/motion.css
HTTP 200 · 4624B
$ curl http://127.0.0.1:4292/fire-states.css
HTTP 200 · 3661B
$ curl http://127.0.0.1:4292/surface.css
HTTP 200 · 7005B
```

5개 자원 모두 정상 서빙. 자체 시안은 standalone preview로 검증 가능.

---

## 8. a11y 정량 점검

```
role="dialog":     1
aria-modal:        1
aria-labelledby:   2
aria-label:        22
tabindex:          4
role="button":     2
role="img":        4
lang="ko":         8
lang="en":         19
sr-only (skip):    2
```

a11y 가드 56건. 1차 핸드오프 jsx 코드와 비교하여 **0건 → 56건**으로 회복.

---

## 9. 시나리오 D F-2 영웅 시안 자체 채택

본 시안은 발주서 §6.7 F-2의 정식 영웅 시안으로 채택된다. Stripe `payments-v1` 시나리오는 시나리오 변형(B/C와 동급)으로 강등.

핵심 변경:

- 미션: "로그인 페이지 만들기" / "Build the login page" (PRD §7 시나리오 그대로)
- 참여자: Claude 여우 1명 (sparse) — 캐주얼 분위기
- yeongi 차단: 0건 — 가벼운 사이드 프로젝트 정서
- Activity Strip: 5건 (mission start + commit + env + 진척 2건)
- 어휘: 비코더 친화 영어 (login page·email verification·password strength·deploy)

---

## 10. 다음 Phase

| Phase | 내용 | 상태 |
|---|---|---|
| Phase 1 | §8 4항 자체 감사 | 완료 |
| Phase 2 | a11y 6항 + Canyon 콘트라스트 + 시나리오 D 자체 시안 + 768px 폴백 | **본 보고서로 완료** |
| Phase 3 | (Phase 2에 통합됨) | — |
| Phase 4 | lib/camp.sh INTEGRATION Step 1~6 자체 진행 | 다음 |
| Phase 5 | 회귀 테스트 보강 + 페르소나 시험 발동 | 예정 |

---

*Document version: v1.0*
*Last updated: 2026-04-29*
*Mode: Self-Resource*
