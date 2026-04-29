# design/system/ — Campsite 디자인 권위 자원

> **본 디렉토리는 핸드오프 채택분의 단일 진실원이다.**
>
> 본체 `lib/camp.sh` 통합 시 디자인 자산은 **오직 본 디렉토리에서만** 가져온다.
> `design/handoff/2026-04-29-claude-design/` 는 더 이상 권위 자료가 아니며,
> 후속 라운드(M3) 산출물 수령 시까지 LoFi prototype 으로 격리된다.

---

## 1. 위상

- **단일 진실원**: 본체 빌드·통합·문서화는 본 디렉토리만 참조한다.
- **추출 기준**: `design/handoff/.../UX_EVAL_2026-04-29.md` §5 "강점 — 채택 가능한 부분" 4인 합의 항목만.
- **격리 기준**: 동 평가서 §3 P0 차단 사유 5항은 `REJECTED.md` 에 격리 표기, 본 디렉토리에 동봉되지 않는다.
- **라이선스**: 모든 채택 자원 CC BY 4.0 (발주서 §13.2).

---

## 2. 파일 책임 영역

| 파일 | 책임 | 의존 |
|---|---|---|
| `tokens.css` | CSS 변수 단일 출처. Surface 4단계, Aurora Dark / Canyon Daylight / Granite & Pine 3종 테마, 5종 화로 의미 색채, type utility, corner accents 4×4. | (없음) |
| `motion.css` | 7종 keyframes 의 권위 사양 (`flicker`, `spark-rise`, `pulse-soft`, `smoke-drift`, `aurora-drift`, `twinkle`, `pip-pulse`). 셀렉터·블러·rounded 일체 제외. | `tokens.css` (모션 곡선이 토큰 의존하지는 않음. 명시 의존은 없음) |
| `fire-states.css` | `.fire-mini` 5상태 (불씨/모닥불/등불/연기/장작) 셀렉터 정의. | `tokens.css`, `motion.css` |
| `surface.css` | Top Status Bar / Right Return Panel / Center Next-Move Box / Bottom Activity Strip 의 No-Line surface 위계. yeongi 우선순위 강조선. | `tokens.css`, `motion.css` (pip-pulse) |
| `ACCEPTED.md` | 채택 자원 매니페스트 (출처·사유·라이선스·잔여 검토). | (문서) |
| `REJECTED.md` | 미채택 자원 격리 표기 (P0 위반 5항·M3 재검토 가능 여부). | (문서) |
| `README.md` | 본 문서. 단일 진실원 선언·임포트 우선순위·향후 통합 가이드. | (문서) |

---

## 3. 임포트 우선순위 (lib/camp.sh 통합 시)

본체 CSS 빌드 또는 inline 임베드 시 **반드시 다음 순서**를 따른다.

```css
/* 1. 토큰 — 모든 후속 파일이 의존 */
@import "design/system/tokens.css";

/* 2. 모션 — 셀렉터 파일이 keyframes 를 참조 */
@import "design/system/motion.css";

/* 3. 의미 색채 컴포넌트 */
@import "design/system/fire-states.css";

/* 4. 레이아웃·위계 */
@import "design/system/surface.css";

/* 5. 본체 vanilla JS 인터랙션 (별도 작성, 핸드오프 코드 사용 금지) */
/* 본체 통합 시 신설 예정 — Drawer / focus trap / role=button 등 a11y 충족 */
```

순서를 어기면 `var(--bulssi)`, `animation: flicker` 등이 미정의 상태로 깨진다.

---

## 4. 본체 통합 시 사용 금지 자료

UX_EVAL §6.1·§6.4 의 결정적 권고에 따라 다음은 권위 자료로 인용 금지.

- `design/handoff/2026-04-29-claude-design/INTEGRATION.md` 의 자기 검증 결과 ("10항 중 9항 완전 준수" 자평) — UX_EVAL §3.3 에서 4항 위반이 명백히 적발되어 신뢰도 손상
- `design/handoff/.../project/*.jsx` 모든 React 인터랙션 코드 — UX_EVAL §3.4 a11y 위반 + §3.5 외부 의존
- `design/handoff/.../project/styles/scene.css` 중 본 추출에서 제외된 셀렉터 (Drawer / mission-card 의 backdrop-filter / participant glow border-radius / aurora ribbon blur 등)

---

## 5. M3 라운드 후 갱신 절차

UX_EVAL §6.2 권고 산출물 수령 시:

1. 신규 핸드오프 패키지를 `design/handoff/<YYYY-MM-DD>-*/` 에 격리 수령.
2. 본 평가 골격을 재가동하여 채택/미채택 분류.
3. 채택분만 `design/system/` 에 verbatim 또는 정제 추가.
4. `ACCEPTED.md` / `REJECTED.md` / 본 문서의 변경 이력 갱신.
5. 본체 `lib/camp.sh` 임포트 순서 재검증.

---

## 6. 변경 이력

| 날짜 | 변경 |
|---|---|
| 2026-04-29 | 초기 추출 — Track C 핸드오프 채택분 분리 (tokens / motion / fire-states / surface) |
