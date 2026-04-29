# 미채택 자원 격리 표기 — design/system/

> 본 문서는 `design/handoff/2026-04-29-claude-design/` 핸드오프 패키지에서
> UX 평가 §3 P0 차단 사유에 해당하는 자산을 격리 기록한다.
>
> 본체 통합 시 본 목록에 포함된 자산은 **절대로 동봉되지 않는다**.
> M3 보정 라운드 후 재검토 가능 항목만 따로 표기한다.

---

## 1. P0-3 위반 자산 — §8 절대 금지 4항

UX_EVAL §3.3 인용. INTEGRATION.md 의 자기 검증("10항 중 9항 완전 준수")과 정면 충돌하는 항목.

### 1.1 둥근 모서리 (§8-2 위반)

| 자산 | 출처 | 위반 사유 |
|---|---|---|
| `.participant .glow { border-radius: 50% }` | `scene.css:471` | 발주서 §8 "절대 금지 사항" 2항 "둥근 모서리(>0px)" 명시 위반 |

→ **M3 재검토**: 가능. clip-path 또는 정사각 후광으로 재설계 시 채택 가능.

### 1.2 픽셀 그리드 위반·블러 사용 (§8-5 위반)

| 자산 | 출처 | 위반 사유 |
|---|---|---|
| `.aurora .ribbon { filter: blur(28px) }` | `scene.css:201` | 발주서 §8-5 "블러 금지" |
| `.mission-card { backdrop-filter: blur(8px) }` | `scene.css:373` | 발주서 §8-5 |
| `.participant .glow { filter: blur(8px) }` | `scene.css:472` | 발주서 §8-5 |
| `.drawer-backdrop { backdrop-filter: blur(2px) }` | `scene.css:645` | 발주서 §8-5 |

→ **M3 재검토**: 가능. blur 제거 후 단색 `box-shadow` 또는 점층 gradient 로 대체 시 채택 가능.

### 1.3 텍스트 절단 (§8-8 위반)

| 자산 | 출처 | 위반 사유 |
|---|---|---|
| 32자·24자 슬라이스 이중 적용 | `active-camp.jsx:238, 242` | 발주서 §8-8 "텍스트 절단 금지" |

→ **M3 재검토**: 불가. 인터랙션 코드 전체가 vanilla JS 재작성 대상 (UX_EVAL §3.4).

### 1.4 1px 실선 (§8-1 위반)

| 자산 | 출처 | 위반 사유 |
|---|---|---|
| `.term-station[data-active="true"] { outline: 1px solid rgba(0,220,229,0.2) }` | `scene.css:120` | 발주서 §8-1 "1px 실선 금지" |

→ **M3 재검토**: 가능. 활성 표현을 surface 명도 위계로 대체 (`--surface-highest` 만 사용) 시 채택 가능.

---

## 2. P0-4 위반 자산 — WCAG 2.2 AA 6항

UX_EVAL §3.4 인용. 시각 자산은 채택 가능하나 인터랙션 코드는 폐기.

| 자산 | WCAG 기준 | 위반 사유 |
|---|---|---|
| `<div onClick>` 클릭 핸들러 (term-station / participant / item / mini-camp) | 2.1.1 키보드 | `role="button"`·`tabIndex`·Enter/Space 핸들러 부재 |
| `.drawer-backdrop` + `.drawer` 시스템 (`scene.css:641-802`) | 2.4.3 / 4.1.2 | focus trap 부재, ESC 핸들러 부재, `role="dialog"`·`aria-modal`·`aria-labelledby` 부재 |
| `.state-pip` 색상 단독 의존 | 1.4.1 색상 비의존 | 형태·아이콘 동반 부재로 색맹 사용자 식별 불가 |
| Canyon `--on-surface-faint #9a826b` on `--surface-low #d6c0a3` ≈ 2.6:1 | 1.4.3 콘트라스트 | AA 4.5:1 미달 |
| 동물 sprite·flame 의미 시각 요소 | 1.1.1 비텍스트 콘텐츠 | `alt` / `aria-label` 부재 |

→ **M3 재검토**: 시각 자산은 채택 가능 (tokens.css 에 Canyon 콘트라스트 주석 동봉). 인터랙션 코드는 본체 vanilla JS 재작성 시점에 신설 — 핸드오프 코드 채택 불가.

---

## 3. P0-2 위반 자산 — §6 산출물 70% 미수령

UX_EVAL §3.2 인용. 핸드오프 패키지 자체가 M2 LoFi prototype 위상이므로 다음은 본 라운드에서 동봉 자체가 불가능.

| 미수령 산출물 | 발주서 카테고리 |
|---|---|
| PNG-8/24 sprite sheet (화로 6점) | A |
| 5상태 × 4프레임 동물 sprite (총 120프레임) | B |
| 환경 PNG 6점 | C |
| 768px 폴백 시안 | F |
| manifest.json + SHA-256 | H |
| Figma·Penpot 원본 | H |
| 사용 가이드 PDF | H |

→ **M3 재검토**: 후속 발주의 결정적 산출물. P0 우선순위 (UX_EVAL §6.2).

---

## 4. P0-5 위반 자산 — 외부 의존 위험

UX_EVAL §3.5 인용. 본체 통합 시 일체 제거 (INTEGRATION.md §6.4 와 일치).

| 자산 | 위반 사유 |
|---|---|
| React 18 + Babel CDN runtime (`active-camp.jsx`, `focus-mode.jsx`, `multi-camp.jsx`, `campsite-app.jsx`) | 발주서 §5.7 CSP `unsafe-eval` 요구, 초기 페인트 지연, production 부적합 |
| Google Fonts CDN (Pretendard, Space Grotesk, JetBrains Mono) | 인터넷 단절 시 한글 위계 붕괴 |
| Babel `text/babel` 컴파일 | production 부적합 |

→ **M3 재검토**: 불가. tokens.css 의 font-family 체인은 system-ui fallback 으로 충분. 본체 통합 시 폰트 로컬 호스팅 또는 system 스택 단독 사용.

---

## 5. P0-1 위반 자산 — 페르소나 불일치

UX_EVAL §3.1 인용.

| 자산 | 위반 사유 |
|---|---|
| F-2 영웅 시안 `payments-v1` 시나리오 | 발주서 §3.1 페르소나 희원(32세, 비코더, 30분 사이드 프로젝트) 작업 범주 외. Stripe PCI-DSS 보안 검토는 §10.3 페르소나 시험 통과 불가. |

→ **M3 재검토**: 시각 자산(F-2 의 layout/scene)은 채택 가능. **시나리오 D(희원·로그인 페이지)** 변형 시안 후속 발주 필수.

---

## 6. 변경 이력

| 날짜 | 변경 | 사유 |
|---|---|---|
| 2026-04-29 | 초기 격리 표기 (Track C) | UX_EVAL §3 P0 5항 합의 기반 분리 |
