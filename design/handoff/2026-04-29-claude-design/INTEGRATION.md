# Design Handoff Integration Guide

> 핸드오프 일자: 2026-04-29
> 출처: Claude Design (claude.ai/design) 자동 번들
> 발주 문서: `design/design-brief.md` v1.0
> 본 가이드 위치: `design/handoff/2026-04-29-claude-design/INTEGRATION.md`

> ## ⚠ 위상 재정의 (2026-04-29)
>
> 본 핸드오프는 **M2 1차분 LoFi prototype**으로 위상 재정의됨. 4인 자문팀(analyst·critic·code-reviewer·designer) 종합 평가 결과 v1.0 임베드 부적격 판정(P0 5항). 상세 사유는 `design/handoff/2026-04-29-claude-design/UX_EVAL_2026-04-29.md` §3 참조.
>
> 본 문서의 §3 자기 검증 결과(특히 §3.3 "10항 중 9항 준수" 자평)는 **권위 자료로 사용 금지**. UX_EVAL §3.3에서 §8 절대 금지 4항 위반이 추가 식별되어 자기 검증 신뢰도가 결정적으로 손상되었음. 본체 임베드 진행 전 반드시 UX_EVAL 권고를 우선 참조한다.

본 문서는 외부 디자인 도구가 산출한 시각 시안을 Campsite 본체(lib/camp.sh의 `camp_render`, `camp-client/`)로 옮겨 적용하는 단계별 절차를 명세한다.

---

## 1. 패키지 개요

### 1.1 파일 구성 (총 13건)

| 경로 | 역할 |
|---|---|
| `README.md` | 핸드오프 번들 안내 (디자인 도구가 자동 생성) |
| `chats/chat1.md` | 디자이너↔사용자 대화 트랜스크립트 (의도 원본) |
| `project/Campsite Camp View.html` | 진입 HTML, React 18 + Babel CDN 런타임 |
| `project/design-canvas.jsx` | Figma-유사 캔버스 wrapper(DesignCanvas, DCSection, DCArtboard) |
| `project/tweaks-panel.jsx` | 우측 컨트롤 패널, edit-mode 호스트 통신 프로토콜 |
| `project/scripts/active-camp.jsx` | F-2 Active Camp 화면 + 시나리오 데이터 |
| `project/scripts/other-screens.jsx` | F-1 Empty Camp + F-3 Multi-Project Hub |
| `project/styles/tokens.css` | 색·간격·타이포 토큰, 3종 테마(aurora/canyon/granite) |
| `project/styles/scene.css` | 레이아웃(status bar / rail / scene / return panel / drawer) |
| `project/styles/pixel-art.css` | 픽셀 아트(campfire, fire-mini, 6종 동물 sprite, pine) |
| `project/styles/multi.css` | F-3 미니 캠프 타일 |
| `project/uploads/decisions.md` | 발주 시점에 사용자가 함께 첨부한 결정 노트 |
| `project/uploads/design-brief.md` | 발주서 사본 |

### 1.2 산출 화면 (4종)

| ID | 화면 | 캔버스 |
|---|---|---|
| F-2 | Active Camp (영웅 시안) | 1440×900 |
| F-1 | Empty Camp (첫 진입) | 1440×900 |
| F-3 | Multi-Project Hub (6캠프 계곡 뷰) | 1440×900 |
| 레퍼런스 | 화로 5종 + 환경 테마 3종 + 동물 6종 | 1200×420 외 |

### 1.3 인터랙션

- 환경 테마 토글 (Aurora Dark / Canyon Daylight / Granite & Pine)
- 화로 상태 시뮬레이션 (auto / 5종 강제 보기)
- 오로라 강도, 별 밀도, lofi 모션 on/off
- 캠프 밀도(sparse 2 / normal 4 / dense 8)
- Participant 클릭 → 우측 슬라이드 Detail Drawer (라이브 터미널 출력 포함)
- DesignCanvas 자체의 줌·팬·아트보드 reorder·focus 모드

---

## 2. 빠른 미리보기

### 2.1 로컬 HTTP 서버로 실행

`.jsx` 파일을 런타임에 fetch하므로 file:// 프로토콜은 동작하지 않는다. 동봉된 스크립트로 실행한다.

```bash
bash design/handoff/2026-04-29-claude-design/start-preview.sh
```

기본 포트 4291. 변경하려면 `start-preview.sh 5000`.

스크립트는 다음을 수행한다.

- `python3 -m http.server`로 `project/` 디렉토리를 정적 서빙
- 0.6초 후 기본 브라우저로 `Campsite Camp View.html` 열기
- Ctrl-C로 종료

### 2.2 외부 정적 서버 사용

이미 다른 정적 서버(예: `bun --serve`, `serve`, `npx http-server`)를 쓴다면 `project/`를 root로 지정하고 `Campsite%20Camp%20View.html`을 연다.

### 2.3 의존 외부 자원

- React 18.3.1, ReactDOM 18.3.1, Babel Standalone 7.29.0 (CDN)
- Google Fonts: Space Grotesk, Inter, JetBrains Mono, Pretendard

오프라인 환경 대응이 필요하면 §6.3을 본다.

---

## 3. 발주서와의 정합성 검증

### 3.1 색채 토큰 일치 (tokens.css ↔ design-brief.md §5.1)

| 토큰 | 발주서 권장 | tokens.css | 일치 |
|---|---|---|---|
| Surface Container Low | `#1b1b20` | `#1b1b20` | ✓ |
| Surface Container High | `#2a292f` | `#2a292f` | ✓ |
| Surface Container Highest | `#35343a` | `#35343a` | ✓ |
| Primary (Lavender) | `#cdc1e0` | `#cdc1e0` | ✓ |
| Secondary (Blue) | `#bac8dc` | `#bac8dc` | ✓ |
| Tertiary (Cyan) | `#00dce5` | `#00dce5` | ✓ |
| On-Surface | `#e4e1e9` | `#e4e1e9` | ✓ |
| Background | `#131318` | `#0e0e14` | ⚠ 의도적 변경 |

Background가 4단계 더 어둡게 채택되었다. 캠프 씬을 더 깊게 가라앉히려는 의도로 추정되며, 시각 위계상 문제 없음. 본체 통합 시 `--bg`만 어느 값을 채택할지 결정한다(권장: `#0e0e14`로 통일).

### 3.2 화로 5종 색채 (tokens.css ↔ design-brief.md §5.1.3)

| 상태 | 발주서 의미 | tokens.css HEX |
|---|---|---|
| 불씨 (bulssi) | weak ember orange | `#c97a3a` |
| 모닥불 (modakbul) | strong ember + warm glow | `#ff8a3d` + glow `rgba(255,138,61,0.35)` |
| 등불 (deungbul) | lantern gold | `#f3c969` |
| 연기 (yeongi) | smoke blue-gray + faint cyan edge | `#6f8aa8` + edge `#4be0ff` |
| 장작 (jangjak) | ready green (restrained) | `#8ac39a` |

5종 모두 발주서 의미론을 충실히 반영. 환경 테마 변경 시에도 화로 색채는 시스템 의미론으로 보존됨(canyon 테마에서도 fire-state CSS 변수는 분기 적용 없음).

### 3.3 절대 금지 사항(§8) 준수 점검

| 금지 항목 | 핸드오프 준수 |
|---|---|
| 1px 실선 외곽선·구분선 | ✓ 표면 위계 명도 차로만 분리 |
| 둥근 모서리(radius>0) | ✓ 0px 일관 (drawer 닫기 버튼·미니 캠프 등 전체 0px) |
| 표준 어두운 드롭 섀도 | ✓ campfire의 발광 drop-shadow는 의미상 글로우, 어두운 그림자 부재 |
| 카툰풍·이모티콘 | ✓ 부재 |
| 픽셀 그리드 위반 | ✓ 16×16 SVG `data:` URI sprite + 4px 단위 박스로 동일 밀도 유지 |
| 시스템 외 의미로 색채 차용 | ✓ tertiary는 CTA·코너 액센트·활성 표시에만 |
| skeuomorphic 메타포 | ✓ 운영 정보는 모두 카드·텍스트 패널로 |
| 텍스트 절단 | ⚠ TerminalRail의 ts-cmd가 32자 슬라이스 → 통합 시 검토 |
| 100% 순백 | ✓ 본문 최대 휘도 `#e4e1e9` |
| 일러스트 위에 UI 후처리 | ✓ Layer 1(ambient) > Layer 2(fire) > Layer 3(UI) 순으로 적층 |

> ⚠ **자기 검증 결과 폐기 (2026-04-29)**
>
> 위 표의 "10항 중 9항 준수" 자평은 **권위 자료로 사용 금지**. 4인 자문팀(critic) 평가 결과 §8 절대 금지 4항 추가 위반 식별:
>
> - §8-2 둥근 모서리: `scene.css:471` `.participant .glow { border-radius: 50% }`
> - §8-5 픽셀 그리드 위반·블러 금지: `scene.css:201, 373, 472, 645` 다중 `blur(8~28px)`
> - §8-8 텍스트 절단: `active-camp.jsx:238, 242` 32자·24자 슬라이스 이중 적용
> - §8-1 1px 실선: `scene.css:120` `outline: 1px solid rgba(0,220,229,0.2)`
>
> 본 절의 자기 검증은 신뢰도가 결정적으로 손상되었으며, 본체 통합 판단의 근거로 채택 금지. 권위 자료는 `UX_EVAL_2026-04-29.md` §3.3.

### 3.4 IA·정보 위계(§7) 정합성

| 영역 | 발주서 명세 | 핸드오프 구현 |
|---|---|---|
| Top Status Bar | 프로젝트·미션·신선도·인원·차단·검토 6항 | 6항 모두 등장, 세 종류 dot tone(active/review/block/sync) |
| Left Terminal Rail | 압축 메타데이터 | LOCAL 섹션 7행 + Terminal Stations 4종 카드 |
| Center Camp Scene | 픽셀 캠프 + 미션 화로 + 참여자 | 1440×900 캔버스, 캠프파이어 hero + 4 participants 절대 위치 |
| Right Return Panel | 3블록 (Working now / Waiting on you / Next move) | 동일, count 표시·yeongi에 amber 좌측 강조선 |
| Bottom Activity Strip | 최근 3~5건 | 5건, 시간 역순 |

§7.3 복귀 우선순위(연기→등불→장작→모닥불→불씨)는 우측 패널의 yeongi 항목 amber 강조로 대응. 추후 자동 스크롤·포커스 이동 인터랙션은 본체 통합 시 추가.

### 3.5 결론

핸드오프 패키지는 발주서 §5(디자인 시스템)·§6(산출물)·§7(IA)·§8(금지)·§9(참고)와 정합한다. 발주서 §6.7 F-1/F-2/F-3 시안 3종이 모두 산출되었으며, 추가로 카테고리 A(화로) + B(동물) + D(UI 액센트) 및 환경 테마 3종 응용 팔레트(§6.5)가 함께 들어왔다.

미수령 산출물은 다음 절에서 후속 발주 항목으로 정리한다.

---

## 4. 미수령·후속 발주 항목

| 발주서 카테고리 | 핸드오프 수령 | 미수령 잔여 |
|---|---|---|
| A 화로 자산 | CSS·SVG로 5종 + core | PNG-8/24 sprite sheet (4프레임 애니메이션 포함) |
| B 동물 sprite | 6종 16×16 SVG `data:` URI | 5상태 × 4프레임 sprite sheet (총 120프레임) |
| C 환경 타일 | CSS gradient + clip-path 기반 | PNG 타일 6종 (Night Sky / Star Layer / Moon Haze / Ground Tile / Forest Edge / Camp Grounds) |
| D UI 액센트 | 4×4 코너 액센트 + state-pip + state-pip pulse | 16×16 status badge set, 32×48 terminal station sprite |
| E 환경 테마 응용 팔레트 | 3종 모두 tokens.css에 정의 | 응용 팔레트 가이드 문서 |
| F 화면 시안 | F-1/F-2/F-3 모두 1440×900 | 768px 폴백 시안 |
| G 모션 사양 | flicker, pulse-soft, twinkle, smoke-drift, aurora-drift 가동 | 프레임 단위 명세서(JSON) |
| H 매니페스트 | tokens.css가 곧 design-tokens 역할 | manifest.json + 사용 가이드 PDF |

핸드오프 1차분은 LoFi prototype-grade이며, 발주서 M2(발주 후 5주) 시점의 1차 산출물 수준이다. M3~M5 산출물(폴백 시안·모션 명세·인계 자료)은 후속 라운드로 진행.

---

## 5. Campsite 본체 통합 단계 계획

### 5.1 통합 원칙

- **CSS 4종(tokens / scene / pixel-art / multi)을 권위 자원으로 채택**한다
- jsx 5종은 React+Babel runtime이므로 production 자원이 아니다 — 시각 정보의 출처로만 활용
- 통합 후 Campsite는 Phaser 미가동 환경에서도 본 핸드오프 시각 시스템을 그대로 표상한다
- legacy HTML 폴백 경로는 유지

### 5.2 단계별 절차

#### Step 1 — 디자인 토큰 권위화 (부담 small)

- `design/system/tokens.css`로 `tokens.css` 사본을 둔다(권위 사본)
- 본체 통합 후 `lib/camp.sh`는 토큰을 inline 복제 대신 토큰 사본을 참조하거나 단일 진실원으로 가져간다

#### Step 2 — 픽셀 아트 채택 (부담 medium)

- `design/system/pixel-art.css`를 그대로 채택
- 6종 동물 SVG `data:` URI는 향후 PNG로 교체 가능하도록 매니페스트 분리(§6.2 참고)
- 발주서 카테고리 B(PNG sprite sheet)가 후속 도착하면 동일 위치에 교체

#### Step 3 — 화면 골격 이식 (부담 large)

- `lib/camp.sh:506 camp_render()`이 현재 inline으로 emit하는 HTML/CSS를 다음 구조로 분해
  - `lib/camp/templates/active-camp.html` (F-2)
  - `lib/camp/templates/empty-camp.html` (F-1)
  - `lib/camp/templates/multi-project.html` (F-3)
- 각 템플릿은 핸드오프의 시각 위계·영역 분할을 따른다(Top Status Bar / Left Rail / Center / Right Panel / Bottom Activity)
- 데이터 슬롯(`{{MISSION_TITLE}}`, `{{PARTICIPANTS_JSON}}`)을 정의하고 `camp.sh`가 채운다

#### Step 4 — 인터랙션 vanilla JS 변환 (부담 medium)

- Tweaks 패널은 prototype 도구이므로 채택하지 않는다
- Participant Drawer는 vanilla JS로 변환(현 `lib/camp-serve-poll.js`와 자연 결합)
- 환경 테마 토글은 `data-theme` 속성과 localStorage로 상태 보존
- Fire-state simulation은 production에서 비활성, 디버그 build에만 노출

#### Step 5 — 라이브 폴링 정합 (부담 small)

- `lib/camp-serve-poll.js`가 핸드오프의 `STATE_META`·`PARTICIPANTS` 데이터 구조와 일치하도록 보강
- 핸드오프 active-camp.jsx의 `meta`, `term`, `summaryKo/En`, `nextKo/En` 필드를 본체 schema로 매핑

#### Step 6 — 회귀 테스트 (부담 small)

- `tests/integration/test_camp.bats`에 새 화면 출력 골자 확인 테스트 추가
- 어휘 일치 확인 (`불씨/bulssi`, `mission`, `next move` 등)
- 거짓 완료 어휘 회귀 검사 자동화

각 step은 별도 commit·별도 PR 단위. 의존: 1 → 2 → 3 → 4 → 5 → 6.

### 5.3 일정 추정

| Step | 추정 |
|---|---|
| 1 | 1일 |
| 2 | 2일 |
| 3 | 5~8일 |
| 4 | 3일 |
| 5 | 1일 |
| 6 | 1일 |

총 13~16일. 단독 작업자 기준. 다중 에이전트 팀 동시 가동 시 단축 가능.

---

## 6. 보존 vs 변형 결정

### 6.1 그대로 채택

- 색채 토큰 4종 표면 + 5종 의미 + 5종 화로 + 3종 테마
- 픽셀 캠프파이어 구조(logs/embers/flame/sparks)
- 5종 fire-mini 변형(상태별 색·shape·애니메이션)
- 6종 동물 sprite의 SVG 인코딩
- pine·mountain·aurora 클립패스 산정
- Activity Strip의 5건 + 시간 역순
- Return Panel 3블록 구조와 yeongi amber 강조

### 6.2 부분 변형

- TerminalRail의 ts-cmd 32자 슬라이스 → max-width + ellipsis 또는 행 분할로 변경
- Mission Card의 backdrop-filter blur(8px) → 저성능 환경 대응을 위해 `@supports`로 가드
- 동물 sprite를 `data:` URI 인라인 → PNG 파일 + manifest 매핑으로 분리 (§4 후속 발주분 도착 시)
- Tweaks Panel은 prototype only — 본체 채택 금지

### 6.3 외부 의존 처리

- Google Fonts CDN → `lib/camp.sh`의 기존 fallback 정책 유지(인터넷 없으면 system font)
- React/Babel CDN → production 본체에는 가져가지 않는다
- 모든 인터랙션은 vanilla JS + customElements 또는 단순 IIFE로 변환

### 6.4 그대로 가져오지 않는 것

- DesignCanvas wrapper(.dc-* 클래스 일체) — 디자이너 도구이지 제품이 아님
- DCFocusOverlay·DCPostIt — 동일 사유
- TweaksPanel·useTweaks·EDITMODE-BEGIN 마커 — 동일 사유
- React/ReactDOM/Babel runtime
- `omelette` 호스트 브리지(`window.omelette?.writeFile`) — 발주처 외부 도구

---

## 7. 후속 commit 체크리스트

본 commit이 들여놓은 것:

- [x] 핸드오프 패키지 13건 영구 보관 (`design/handoff/2026-04-29-claude-design/`)
- [x] standalone 미리보기 스크립트(`start-preview.sh`)
- [x] 본 통합 가이드(INTEGRATION.md)

후속 commit에서 진행할 항목:

- [ ] Step 1 — `design/system/tokens.css` 권위 사본 분리 [BLOCKED — UX_EVAL P0 해소 후 진입]
- [ ] Step 2 — pixel-art.css 채택 + 동물 sprite manifest 분리 [BLOCKED — UX_EVAL P0 해소 후 진입]
- [ ] Step 3 — camp_render 분해 + 3 화면 템플릿 도입 [BLOCKED — UX_EVAL P0 해소 후 진입]
- [ ] Step 4 — Tweaks 제거, Drawer는 vanilla JS로 변환 [BLOCKED — UX_EVAL P0 해소 후 진입]
- [ ] Step 5 — camp-serve-poll.js 데이터 schema 보강 [BLOCKED — UX_EVAL P0 해소 후 진입]
- [ ] Step 6 — 회귀 테스트 보강 [BLOCKED — UX_EVAL P0 해소 후 진입]
- [ ] M3 산출물 후속 발주 (768px 폴백, 모션 사양 JSON, 매니페스트) [차단 사유 해소를 위한 선행 조건]

---

## 8. 디자이너 회신 기록

핸드오프와 함께 회신된 chat 트랜스크립트(`chats/chat1.md`)에서 디자이너가 명시한 시스템 약속:

- Type pairing: Space Grotesk(display+technical) + Inter(body) + JetBrains Mono(terminal) + Pretendard(KR)
- 3종 테마 토글, 화로 5종 시뮬레이션, 환경 강도 슬라이더, lofi 모션 토글
- 픽셀 아트는 CSS box-shadow 그리드 + SVG `data:` URI(향후 Aseprite PNG로 교체 가능)
- 시각 위계: Fire(campfire) > Mission card > Participants > Environment
- 0px 모서리, no #FFFFFF, no 1px borders, surface luminance로 분리, 4×4 tertiary 코너 액센트
- 발주서 §6.7 F-1/F-2/F-3 + 디자인 시스템 레퍼런스 카드를 한 캔버스에 묶음

이 약속은 발주서 §5와 일치한다.

---

## 9. 평가 결과와 차단 사유

본 핸드오프는 4인 자문팀(analyst·critic·code-reviewer·designer) 병렬 평가 결과 v1.0 임베드 부적격으로 판정되었다. 종합 보고서: `design/handoff/2026-04-29-claude-design/UX_EVAL_2026-04-29.md`.

### 9.1 P0 차단 사유 5항 (UX_EVAL §3 인용)

| 번호 | 사유 | 출처 |
|---|---|---|
| P0-1 | 페르소나-시나리오 불일치 — F-2 영웅 시안이 `payments-v1`(Stripe PCI-DSS) 단일 시나리오 고착, 발주서 §3.1 희원 페르소나 시험 불통과 | UX_EVAL_2026-04-29.md §3.1 |
| P0-2 | §6 산출물 70% 미수령 — PNG sprite 0건, 동물 sprite sheet 0건, 환경 PNG 6점 부재, 768px 폴백 부재, manifest.json·SHA-256·Figma 원본·사용 가이드 PDF 부재 | UX_EVAL_2026-04-29.md §3.2 |
| P0-3 | §8 절대 금지 4항 위반 — border-radius·blur·텍스트 절단·1px outline (위 §3.3 폐기 박스 참조) | UX_EVAL_2026-04-29.md §3.3 |
| P0-4 | WCAG 2.2 AA 6항 미준수 — 키보드(2.1.1)·포커스 순서(2.4.3)·이름·역할·값(4.1.2)·색상 비의존(1.4.1)·텍스트 콘트라스트(1.4.3)·비텍스트 콘텐츠(1.1.1) | UX_EVAL_2026-04-29.md §3.4 |
| P0-5 | 외부 의존 위험 — React/Babel CDN runtime, Google Fonts CDN, `text/babel` production 부적합 | UX_EVAL_2026-04-29.md §3.5 |

### 9.2 차단 해제 조건

본체 임베드(§5.2 Step 1~6) 진입은 위 P0 5항이 모두 해소된 M3 산출물 수령 이후로 보류된다. M3 발주 명세는 UX_EVAL_2026-04-29.md §6.2 표 참조. 임베드 예상 가능 시점: **2026-05-20 ± 1주** (UX_EVAL §6.3).

### 9.3 채택 가능 영역 (참고)

UX_EVAL §5에 따라 다음 시각 자산은 채택 가능 수준으로 평가됨: 화로 5종 의미 색채 분화, Camp/Focus 가족룩 어휘, Surface No-Line 원칙, 5영역 IA 골격, 복귀 우선순위 시각 작동, 거짓 완료 어휘 회피, 모션 사양 정합, CSS 토큰 구조. 단 **인터랙션 코드는 폐기 후 재작성** 전제이며, 채택 시점도 P0 해소 이후이다.

---

*Document version: v1.1*
*Last updated: 2026-04-29*
*Owner: Kiwon Cho*
