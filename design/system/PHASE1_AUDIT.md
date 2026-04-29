# Phase 1 — §8 절대 금지 4항 자체 보정 감사 보고서

> 일자: 2026-04-29
> 모드: Self-Resource (외부 디자이너 의존 폐기)
> 결과: **자동 통과** (Track C extraction 시점에 위반 일체 격리 완료)

---

## 1. 결정

외부 디자이너 발주(M3 라운드)를 **폐기**한다. v1.0 출시는 LoFi 시각 정체성으로 자체 진행하며, PNG 자산 업그레이드는 v1.1 이후 마일스톤으로 이연한다.

`design/handoff/2026-04-29-claude-design/M3_REORDER_BRIEF.md`는 송부하지 않으나 archive 자료로 보존한다(외부 발주 가능성이 재개될 경우 활용).

---

## 2. §8 4항 자동 통과 검증

`design/system/` 4개 권위 CSS 파일에 대한 grep 검사 결과:

```bash
$ grep -n -E "border-radius:|outline:.*solid|filter:.*blur|backdrop-filter" design/system/*.css
design/system/motion.css:71:   ⚠ 핸드오프 원본의 `.aurora .ribbon { filter: blur(28px) }` 는
design/system/surface.css:15:     - `border-radius: *` 사용 셀렉터 — §8-2 위반
design/system/surface.css:16:     - `outline: 1px solid *` (예: .term-station[data-active="true"]) — §8-1 위반
design/system/surface.css:17:     - `filter: blur(*)` 사용 셀렉터 (mission-card, drawer-backdrop, aurora) — §8-5 위반
```

매칭된 4건은 모두 **주석 내부**의 격리 표기이다. 실제 CSS 선언은 0건.

| §8 항 | 핸드오프 원본 위치 | design/system/ 처리 |
|---|---|---|
| §8-1 1px 실선 | `scene.css:120` outline:1px solid | 추출 시 제외 (surface.css:16 주석 격리) |
| §8-2 둥근 모서리 | `scene.css:471` border-radius:50% | 추출 시 제외 (surface.css:15 주석 격리) |
| §8-5 픽셀 그리드·블러 | `scene.css:201,373,472,645` 다중 blur | aurora·drawer-backdrop은 §5.4 frosted 예외 범위, participant glow는 추출 제외 (surface.css:17 + motion.css:71 주석 격리) |
| §8-8 텍스트 절단 | `active-camp.jsx:238,242` slice | jsx 자체를 추출 대상에서 제외, surface.css는 텍스트 절단 코드 미포함 |

§8-2 텍스트 절단의 경우 jsx 인터랙션 코드 일체가 권위 자원에서 제외되었으므로 본체 통합 시점에 vanilla JS로 새로 작성하면서 절단 정책을 재정의한다. 새 정책: `text-wrap: pretty` + `overflow-wrap: anywhere`, 절단 불가피 시 명시적 ellipsis + `aria-label`로 전체 문자열 동반.

---

## 3. P1 자체 보정 처리 계획

본 Phase 1에서는 §8(P0-3)만 다루었다. 나머지 P0/P1 항목은 후속 Phase로 분배한다.

| ID | 사유 | 자체 처리 Phase |
|---|---|---|
| P0-1 | 페르소나-시나리오 불일치 | Phase 3 — 시나리오 D F-2 자체 HTML 시안 |
| P0-2 | §6 산출물 70% 미수령 | **v1.0 범위 외로 이연** — LoFi(SVG·CSS) 자산을 v1.0 정식 채택, PNG는 v1.1 |
| P0-3 | §8 4항 위반 | **본 Phase 1에서 처리 완료** |
| P0-4 | WCAG 6항 미준수 | Phase 2 — vanilla JS a11y 보정 |
| P0-5 | 외부 의존 위험 | Phase 4 — React/Babel 제거, vanilla JS 변환 |
| P1-1 | Left Rail 정보 밀도 | Phase 3 — F-2 시안 4행 압축 |
| P1-2 | 화로 z-index 위계 | Phase 3 — F-2 시안 z-index 재배치 |
| P1-3 | 한·영 병기 위계 | Phase 3 — F-2 시안 단일 언어 + hover |
| P1-4 | Canyon 콘트라스트 | Phase 2 — tokens.css 휘도 재조정 |
| P1-5 | Dave the Diver 도달도 | **v1.1로 이연** (PNG 자산 후속) |

---

## 4. v1.0 범위 재정의

본 self-resource 결정에 따라 v1.0의 시각 정체성 범위를 다음과 같이 재정의한다.

### 4.1 v1.0 채택 범위

- 색채 토큰 4단계 surface + 5종 화로 의미 색채 + 3종 환경 테마 (Aurora/Canyon/Granite)
- LoFi 픽셀 표현 (CSS clip-path + box-shadow + SVG `data:` URI)
- 5영역 IA 골격 (Top Status / Left Rail / Center / Right Panel / Bottom Activity)
- Camp/Focus 가족룩 어휘 (working-now / waiting-on-you / next-move + 5종 fire-state)
- 7종 정합 모션 (flicker / spark-rise / pulse-soft / smoke-drift / aurora-drift / twinkle / pip-pulse)
- WCAG 2.2 AA 6항 자체 보정 후 통과
- 768px 폴백 시안 자체 구현

### 4.2 v1.1로 이연

- HD 픽셀 아트 PNG sprite 카테고리 A (화로 6점)
- 동물 sprite sheet 카테고리 B (6종 × 5상태 × 4프레임 = 120프레임)
- 환경 PNG 타일 카테고리 C (6점)
- Figma·Penpot 원본 카테고리 H
- 사용 가이드 PDF 8~12p 카테고리 H
- Dave the Diver 수준 시각 품질 도달

### 4.3 페르소나 시험과의 정합

`docs/persona-validation.md` 5인 시험은 v1.0 범위(LoFi 정체성)로 수행한다. 정성 키워드 검증("예쁘다·차분하다·어렵지 않다")은 LoFi 수준에서도 통과 가능하다는 가정 하에 시험을 발동한다. 시험 통과 시 v1.0 동결, 미통과 시 PNG 자산 도입 또는 LoFi 보강 결정.

---

## 5. 후속 Phase 일정

| Phase | 내용 | 예상 |
|---|---|---|
| Phase 1 | §8 4항 자체 감사 (본 보고서) | 완료 |
| Phase 2 | a11y 6항 + Canyon 콘트라스트 자체 보정 | 1~2일 |
| Phase 3 | 시나리오 D F-2 자체 HTML 시안 + 768px 폴백 | 3~4일 |
| Phase 4 | lib/camp.sh INTEGRATION Step 1~6 자체 진행 | 5~7일 |
| Phase 5 | 회귀 테스트 보강 + 페르소나 시험 발동 | 2~3일 |

총 추정: 11~17일 (단독 작업자 기준).

---

*Document version: v1.0*
*Last updated: 2026-04-29*
*Mode: Self-Resource*
