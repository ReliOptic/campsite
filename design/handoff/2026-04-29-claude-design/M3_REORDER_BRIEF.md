# M3 (1차 재발주) 디자이너 회신 발주서 — Campsite Visual Identity

> 발주처: ReliOptic / Kiwon Cho (ckiwon7@gmail.com)
> 회신 대상: 1차 라운드 외주 인원 또는 스튜디오 (1차와 동일)
> 발주 일자: 2026-04-29
> 라운드 명칭: M3 (1차 재발주) — `UX_EVAL_2026-04-29.md` §6.2 명명 차용
> 선행 자료: `design/design-brief.md` v1.0 + `design/handoff/2026-04-29-claude-design/UX_EVAL_2026-04-29.md`

---

## 1. 회신 목적

본 문서는 1차 핸드오프(`design/handoff/2026-04-29-claude-design/`, 위상: M2 1차분 LoFi prototype)에 대한 4인 자문팀 평가 결과를 디자이너에게 회신하고, M3 라운드의 산출물·검수 기준·일정을 단일 진실원 형식으로 명세한다. 1차 산출물의 의미론적 기반(화로 색채 의미·가족룩 어휘·IA 골격·CSS 토큰)은 채택 가능하나, 픽셀 자산 미산출·접근성 미준수·발주서 §8 절대 금지 4항 위반·페르소나-시나리오 불일치로 인하여 본체 임베드는 보류 상태이다. 본 발주서는 위 4개 차원의 차단 사유를 해소할 M3 라운드 6개 산출 카테고리를 정의한다.

---

## 2. 평가 결과 요약

### 2.1 P0 차단 사유 5항 (UX_EVAL §3)

| 번호 | 사유 | 출처 (file:line / 섹션) |
|---|---|---|
| P0-1 | 페르소나-시나리오 불일치 (F-2 영웅 시안이 `payments-v1` 단일 고착) | UX_EVAL §3.1 / `copy-active-camp.md:269-274` |
| P0-2 | 발주서 §6 산출물 70% 미수령 (PNG·sprite sheet·환경 타일·폴백·매니페스트 부재) | UX_EVAL §3.2 / 발주서 §6.2~§6.7·§6.9 |
| P0-3 | 발주서 §8 절대 금지 4항 위반 (border-radius·blur·텍스트 절단·1px outline) | UX_EVAL §3.3 / `scene.css:471, 201, 373, 472, 645, 120` + `active-camp.jsx:238, 242` |
| P0-4 | WCAG 2.2 AA 6항 미준수 (2.1.1·2.4.3·4.1.2·1.4.1·1.4.3·1.1.1) | UX_EVAL §3.4 |
| P0-5 | 외부 의존 위험 (React/Babel CDN·Google Fonts CDN·text/babel production 부적합) | UX_EVAL §3.5 |

### 2.2 P1 강력 권고 5항 (UX_EVAL §4)

| 번호 | 사유 | 출처 |
|---|---|---|
| P1-1 | Left Terminal Rail 정보 밀도 과적 (LOCAL 7행 + 4 카드 = 19행 / 240px) | UX_EVAL §4.1 |
| P1-2 | 화로 z-index 위계 역전 (mission-card z:4 > hearth z:3) | UX_EVAL §4.2 |
| P1-3 | 한·영 병기 위계 규칙 부재 (Return Panel 4행 적층) | UX_EVAL §4.3 |
| P1-4 | Canyon 테마 보조 텍스트 콘트라스트 2.6:1 (AA 미달) | UX_EVAL §4.4 |
| P1-5 | Dave the Diver 도달도 3/10 (HD 픽셀 아트 7단계 미달) | UX_EVAL §4.5 |

### 2.3 점수 분포 (UX_EVAL §2)

영역별 평균 5.7/10. 3점대 4개 영역(§6 산출물 충족도·접근성·Dave the Diver 도달도·참고 좌표 도달도)은 v1.0 출시 차단 사유로 분류된다. 8점대 4개 영역(IA 명세·모션 정합성·환경 색채 보존·가족룩 정합)은 M3 라운드에서도 보존 대상이다.

---

## 3. 채택 가능 자산 명단

### 3.1 UX_EVAL §5 강점 8건

| 영역 | 내용 | 평가자 |
|---|---|---|
| 화로 5종 의미 색채 분화 | tokens.css 5종 HEX 색상환상 명확 분리 + fire-mini clip-path 차별화 | designer |
| Camp/Focus 공유 어휘 | working-now / waiting-on-you / next-move 가족룩 1:1 일치 | designer |
| Surface No-Line 원칙 | 1px 실선 1곳 외 전체 명도 위계로 분리 (98% 준수) | designer |
| 5영역 IA 골격 | Top Status / Left Rail / Center / Right Panel / Bottom Activity가 spec과 1:1 대응 | analyst |
| 복귀 우선순위 시각 작동 | yeongi amber 강조선이 §7.3 "연기→등불" 순서를 시각적으로 작동시킴 | analyst |
| 거짓 완료 어휘 회피 | done/complete/완료/성공 0건, 동사구로 끝맺음 | analyst |
| 모션 사양 정합 | flicker 2.1s, pulse 3s, twinkle 4s가 발주서 §5.7 범위에 부합 | code-reviewer |
| CSS 토큰 구조 | tokens.css 4단계 surface + 3종 테마 분기가 일관 | code-reviewer |

### 3.2 design/system/ 추출 자산 (M3 라운드 출발선)

본 발주처가 1차 핸드오프에서 다음 4종을 `design/system/`에 추출하여 권위 사본으로 잠가두었다. M3 라운드 산출물은 본 4종을 참조 출발선으로 삼는다.

- `design/system/tokens.css` — 색·간격·타이포 토큰 + 3종 테마 분기
- `design/system/motion.css` — flicker·pulse·twinkle·smoke-drift·aurora-drift 사양
- `design/system/fire-states.css` — 5종 화로 상태 의미 색채·clip-path
- `design/system/surface.css` — 4단계 표면 위계·No-Line 원칙

`design/system/ACCEPTED.md`·`REJECTED.md`에 채택·반려 사유가 명시되어 있다.

---

## 4. M3 산출물 명세 (P0 5항 + P1 5항 = 6개 산출 카테고리)

본 절은 M3 라운드 산출물의 4-tuple 사양이다. 각 산출물은 Input(전제 자료)·Spec(기술 사양)·Acceptance(검수 기준)·Deadline(기한) 4셀을 모두 충족해야 한다.

### 4.1 산출물 ① — 시나리오 D (희원·로그인 페이지) F-2 정식 변형 시안

| 셀 | 내용 |
|---|---|
| Input | 발주서 §3.1 페르소나 / `copy-active-camp.md:269-274` 시나리오 D / 본 발주서 §6 F-2 정식 변형 명세 (확장된 §11.3.1~§11.3.8 카피 일체) |
| Spec | 1440×900 px 데스크톱 + 768 px 폴백 시안 / Figma·Penpot 원본 + PNG export / 합산 용량 발주서 §6.1의 600KB 한도 안 / 모든 텍스트는 한국어·영어 실 카피 (`Lorem ipsum` 금지) |
| Acceptance | 자동: axe-core 콘트라스트 자동 측정 통과 + 768px 폭에서 텍스트 절단 0건 / Self-check: 페르소나 희원 정서("어렵지 않다·쉽다") 반영 여부 디자이너 자체 점검표 첨부 |
| Deadline | M3 발주 후 4주 (M3 라운드 1단계) |

### 4.2 산출물 ② — 발주서 §8 절대 금지 4항 보정

| 셀 | 내용 |
|---|---|
| Input | UX_EVAL §3.3 위반 file:line 6개 위치 / 발주서 §8 절대 금지 10항 / `design/system/surface.css` No-Line 원칙 |
| Spec | 보정된 CSS 4종(tokens·scene·pixel-art·multi) 재인계 / 발주서 §5.4 모달 frosted 예외(backdrop-blur)는 명시적 유지 / 보정 전후 diff 보고서 1점 |
| Acceptance | 자동: `grep -E 'border-radius:\s*[1-9]'` 0건 + `grep -E 'blur\(' --exclude=modal` 0건 + `grep -E 'outline:\s*1px solid'` 0건 / Self-check: 본 발주서 §5의 보정 권고 항별 적용 여부 표 첨부 |
| Deadline | M3 발주 후 2주 (M3 라운드 0단계, 가장 먼저) |

### 4.3 산출물 ③ — WCAG 2.2 AA 6항 충족 시안 패치

| 셀 | 내용 |
|---|---|
| Input | UX_EVAL §3.4 WCAG 6항 위반 표 / 본 발주서 §7 WCAG 충족 가이드 / 발주서 §10.4 시스템 정합 검증 |
| Spec | ARIA 속성·role·aria-label·tabIndex·focus trap·skip link 명세서 1점 / state-pip 5종 형태 동반(◐/△/▢/◇/●) sprite / Canyon 보조 텍스트 휘도 재조정 토큰 1점 |
| Acceptance | 자동: axe-core dev tools 자동 측정 6항 모두 통과 + 콘트라스트 4.5:1 이상 (보조 텍스트 3:1 이상) / Self-check: 디자이너 키보드 단독 조작으로 영웅 영역 도달 가능 여부 점검 (마우스 미사용) |
| Deadline | M3 발주 후 6주 (M3 라운드 2단계) |

### 4.4 산출물 ④ — 카테고리 A·B PNG 픽셀 자산

| 셀 | 내용 |
|---|---|
| Input | 발주서 §6.2 화로 6점·§6.3 동물 6종 sprite sheet / 참고 좌표 「Dave the Diver」 (UX_EVAL §4.5) / `design/system/fire-states.css` 5종 의미 색채 |
| Spec | PNG-8 또는 PNG-24 (투명 배경) / 화로 6점 정적 + 4프레임 sprite sheet 1점 / 동물 6종 × 5상태 × 4프레임 = 120프레임 / 합산 600KB 이하 (발주서 §6.1) / Aseprite `.ase` 원본 동시 인계 |
| Acceptance | 자동: 알파 채널 정합 검증 + SHA-256 해시 manifest 등록 + 5종 화로 블라인드 분별 시험 4/5 이상 통과 / Self-check: 픽셀 그리드 동일 밀도 자체 점검 (혼합 0건) |
| Deadline | M3 발주 후 8주 (M3 라운드 3단계) |

### 4.5 산출물 ⑤ — 카테고리 C·F 환경 PNG + 768px 폴백 시안

| 셀 | 내용 |
|---|---|
| Input | 발주서 §6.4 환경 6점 / 발주서 §6.7 F-1·F-2·F-3 + 768px 폴백 / UX_EVAL §4.2 화로 z-index 위계 회복 권고 |
| Spec | 환경 PNG 6점 (Night Sky Backdrop 480×320 / Star Layer 480×320 / Moon Haze 96×96 / Ground Tile 32×32 / Forest Edge 480×96 / Camp Grounds 480×64) / 768px 폴백 시안 F-1·F-2·F-3 각 1점 / 화로 z-index 미션 카드 위로 역전 보정 |
| Acceptance | 자동: 768px 폭에서 영웅 영역 깨짐 0건 + 5초 복귀 회복 타이머 측정 통과 / Self-check: 화로가 시각 주인공인지 디자이너 자체 위계 도식 첨부 |
| Deadline | M3 발주 후 10주 (M3 라운드 4단계) |

### 4.6 산출물 ⑥ — 카테고리 H 매니페스트 + 인계 자료 일체

| 셀 | 내용 |
|---|---|
| Input | 발주서 §6.9 H 카테고리 / 발주서 §10.5 인계 자료 완결성 / 본 발주서 §3.2 design/system/ 4종 권위 사본 |
| Spec | `manifest.json` (모든 자산 ID·경로·SHA-256·크기·라이선스) / `design-tokens.json` 머신 리더블 / Figma·Penpot 원본 (CC BY 4.0) / 사용 가이드 PDF 8~12페이지 / 1차 납품 형식: Figma·Penpot 원본 + PNG export + manifest.json (발주서 §6.7 H 카테고리) |
| Acceptance | 자동: manifest SHA-256 무결성 검증 + design-tokens.json 스키마 검증 / Self-check: PDF 가이드 8~12페이지 분량 충족 + 디자이너 포트폴리오 사용 가능 여부 표기 |
| Deadline | M3 발주 후 11주 (M3 라운드 종료, 최종 인계) |

---

## 5. 발주서 §8 절대 금지 4항 보정 가이드

### 5.1 위반 ① — `scene.css:471` 둥근 모서리

```
.participant .glow { border-radius: 50% }
```

발주서 §8-2 "둥근 모서리(>0px) 금지" 위반. participant glow는 의미상 "발광 후광"이므로 형태가 원형일 필요가 없다. 보정 권고: `border-radius: 0px` 직사각형 글로우로 교체하거나, 의미적으로 등가인 `box-shadow: 0 0 16px <color>` (0px radius 유지) 또는 픽셀 격자에 스냅된 8각형 clip-path로 대체. 발광 의미는 색채와 펄스 모션으로 보존한다.

### 5.2 위반 ② — `scene.css:201, 373, 472, 645` 다중 blur

다중 `blur(8~28px)` 적용은 발주서 §8-5 "픽셀 그리드 위반·블러 금지" 위반. 보정 권고:

- 모달 영역(발주서 §5.4 frosted 예외)에서는 `backdrop-filter: blur(...)` 명시적 유지 가능. 단 모달 외부 표면 blur는 일괄 제거
- 발광 효과는 픽셀 격자에 스냅 가능한 stepped gradient (4px 단위 blocky-glow) 또는 4프레임 PNG sprite로 교체
- Aurora drift 모션은 알파 채널 위치 이동만 허용, blur radius는 0px 유지

보정 후 `grep -E 'blur\(' --include='scene.css' --exclude-dir=modal` 결과 0건이어야 한다.

### 5.3 위반 ③ — `active-camp.jsx:238, 242` 텍스트 절단

32자·24자 슬라이스 이중 적용은 발주서 §8-8 "텍스트 절단 금지" 위반. 보정 권고:

- `String.slice(0, 32)` 호출을 제거하고 CSS `max-width` + 자연 행 분할로 전환
- 부득이 절단이 필요한 경우 명시적 ellipsis 적용 + `aria-label` 또는 `title` 속성에 전체 텍스트 동반 (접근성 alt-text 의무)
- Top Status Bar는 §10.3 길이 가이드(한국어 12자·영어 18자) 안에서 자연 가독한 카피로 작성. 카피 변경은 본 발주처가 §6 시나리오 D 카피로 책임진다

### 5.4 위반 ④ — `scene.css:120` 1px outline

```
outline: 1px solid rgba(0,220,229,0.2)
```

발주서 §8-1 "1px 실선 외곽선·구분선 사용 금지" 위반. 발주서 §5.1 표면 위계는 명도 변화로 분리한다. 보정 권고: `outline` 일괄 제거 후 `--surface-highest` (`#35343a`) 단계 활용으로 시각 분리. 키보드 포커스 외곽선은 발주서 §5.1 "절대 필요한 경우의 미세 외곽선" Outline Ghost (`#49454e` 불투명도 20%) + 4px 단위 dashed 패턴으로 대체 가능 (이는 §8-1 "1px 실선" 정의에서 벗어남).

---

## 6. 시나리오 D F-2 정식 변형 명세

### 6.1 페르소나 컨텍스트

발주서 §3.1 일차 페르소나 희원 32세, 프론트엔드 개발자. 회사에서 3개 프로젝트를 동시 진행 중이며, 바이브코딩 경험이 없고 코딩 자체를 좋아하지는 않으나 결과물의 완성도는 중시한다. 터미널 환경에 거부감이 있고 AI 도구의 다양성에 피로를 느낀다. 퇴근 후 30분의 사이드 프로젝트 시간을 갖고 싶으나 매번 "어디까지 했더라" 단계에서 10분을 소진한다.

### 6.2 미션·참여자·진입 시각

- 미션: "로그인 페이지 만들기" / "Build the login page" (PRD §7 시나리오 인용, `copy-active-camp.md:273` 차용)
- 참여자: 1~2명 sparse (PRD §7 첫 5분 시나리오 권고). 1명 케이스는 Claude 여우 단독, 2명 케이스는 + Codex 올빼미 동석. 발주서 §6.7 F-1 Empty Camp가 0명, F-2 Active Camp가 4명이므로 본 변형은 그 사이의 sparse 위상을 점한다
- 마지막 진입: 23분 전 (placeholder 금지, 카피에 구체 숫자 박음)

### 6.3 분위기 가이드

- 캐주얼 톤. 발주서 §3.2 희원 정서("어렵지 않다·복잡하지 않다·쉽다·예쁘다·차분하다")를 첫 30초에 인지 가능하도록 시각·카피 양면에서 구현
- 인지 부하 저감. Left Terminal Rail은 P1-1 권고에 따라 LOCAL 4행만 첫 진입에 노출, 나머지는 펼치기 토글로 압축
- 비코더 친화 영어 어휘 채택: `login page`·`email verification`·`deploy to Vercel` (자연어). 코더 어휘 회피: `authentication flow`·`session management`·`OAuth grant type` (전문 용어)
- yeongi 사례는 0~1건. 1건 케이스는 "API 키를 까먹은 것 같아요 / Looks like the API key got lost" 같은 자연 어휘로 작성. "막혔어요"·"차단됨" 같은 부정 어휘는 "다음 시도"·"가벼운 실험" 톤으로 변환

### 6.4 카피 출처

본 시나리오 D의 8개 영역(시나리오 가정·Top Status Bar·Left Terminal Rail·Mission Card·Return Panel 3블록·참여자 카드·Activity Strip·토스트·빈 상태) 카피 일체는 `design/copy-active-camp.md` §11.3.1~§11.3.8에 정식 변형으로 작성되어 있다. 디자이너는 본 시안 작업 시 §11.3을 단일 진실원으로 차용한다.

### 6.5 시각 변형 delta (시나리오 A·B·C 답습 부분)

발주서 §6.7 F-2 시나리오 A(payments-v1)의 5영역 IA 골격·Return Panel 3블록 구조·yeongi amber 강조선 등은 그대로 답습한다. 시나리오 D 고유 delta는 다음 4점.

- 참여자 수: 4 → 1~2 sparse (Empty/Active 사이 위상)
- 카피 어휘: 코더 전문 용어 → 비코더 친화 자연어
- 미해결 메시지: 1건 → 0~1건 (sparse일수록 0건)
- Activity Strip: 협업 5건 → 가벼운 진척 5건 (modakbul 진척 3건 + 환경설정·commit 2건)

---

## 7. WCAG 2.2 AA 6항 충족 가이드

| WCAG 기준 | ARIA·역할 | 콘트라스트·시각 | 키보드 |
|---|---|---|---|
| 2.1.1 키보드 | 클릭 가능한 div(term-station·participant·item·mini-camp)에 `role="button"` 적용 | — | `tabIndex={0}` + Enter/Space 핸들러 의무 |
| 2.4.3 포커스 순서 | 영역별 landmark role(banner·main·complementary·contentinfo) | — | Drawer 내부 focus trap + ESC 닫기 + skip link "본문 바로 가기 / Skip to main content" |
| 4.1.2 이름·역할·값 | Drawer에 `role="dialog"` + `aria-modal="true"` + `aria-labelledby="drawer-title"` 의무 | — | 첫 포커스 대상은 닫기 버튼 또는 첫 인터랙티브 요소 |
| 1.4.1 색상 비의존 | state-pip 5종에 `aria-label` 동반 | 형태 동반: bulssi=◐ / modakbul=●  / deungbul=◇ / yeongi=△ / jangjak=▢ | — |
| 1.4.3 콘트라스트 | — | 본문 텍스트 4.5:1 이상 / 보조 텍스트 3:1 이상 / Canyon 테마 `--on-surface-faint` 휘도 재조정 (현 2.6:1 → 3.0:1 이상) | — |
| 1.1.1 비텍스트 | 동물 sprite·flame·moon·star에 `role="img"` + `aria-label` (예: "Claude the fox in modakbul state, expanding tests") | — | — |

자동 측정 도구: axe-core 또는 Pa11y (M3 산출물 ③ 검수 시 의무). Self-check: 디자이너 키보드 단독 조작으로 영웅 영역 도달 가능 여부 점검 후 점검표 첨부.

---

## 8. 일정 (M3 11주)

UX_EVAL §6.2 일정을 차용한다. 산출물 마일스톤은 본 발주서 §4 Deadline 셀에 분배되어 있다.

| 마일스톤 | 산출물 | 시점 |
|---|---|---|
| M3-0 | 산출물 ② §8 절대 금지 4항 보정 | 발주 후 2주 |
| M3-1 | 산출물 ① 시나리오 D F-2 변형 시안 | 발주 후 4주 |
| M3-2 | 산출물 ③ WCAG 6항 충족 시안 패치 | 발주 후 6주 |
| M3-3 | 산출물 ④ 카테고리 A·B PNG 자산 | 발주 후 8주 |
| M3-4 | 산출물 ⑤ 환경 PNG + 768px 폴백 | 발주 후 10주 |
| M3-5 | 산출물 ⑥ 매니페스트 + 인계 자료 | 발주 후 11주 |

각 마일스톤은 1차 검수 + 1회의 수정 라운드를 포함한다 (발주서 §11 답습).

---

## 9. 견적·지급

발주서 §14 형식을 차용하되 M3 라운드 단일 묶음 견적으로 산정한다. 1차 라운드 미수령분의 이월 견적은 본 라운드에 포함된다.

- 계약 시점 (M3 발주 확정): 30%
- M3-2 검수 통과 시점 (산출물 ①·②·③ 수령): 40%
- M3-5 최종 인계 시점 (산출물 ④·⑤·⑥ 수령): 30%

추가 비용 발생 조건은 발주서 §14.3 답습.

---

## 10. 회신처 + 다음 단계

회신처: ckiwon7@gmail.com.

검수자: 발주처 (Kiwon Cho) + 본 평가팀 4인 자문팀 재가동 (analyst·critic·code-reviewer·designer). 본 평가팀은 1차 라운드와 동일한 4인이며, M3 산출물 각 마일스톤에서 §4의 Acceptance 셀을 기준으로 병렬 검수한다.

회신 시 다음을 포함한다.

- 본 발주서 §4의 6개 산출물 각각에 대한 견적
- M3 11주 일정 가능성과 보정 의견
- §5 보정 가이드에 대한 디자이너 의견
- §6 시나리오 D 변형의 시각 해석 초안 (선택)

---

*Document version: v1.0*
*Last updated: 2026-04-29*
*Owner: Kiwon Cho*
*Round: M3 (1차 재발주)*
