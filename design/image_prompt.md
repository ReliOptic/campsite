# Campsite Image Prompt Pack

이 폴더는 `Campsite`의 recovery-first vibe camp UI에 들어갈 이미지 소스를 모으는 곳입니다.

의도:

- 나노바나나2 같은 이미지 모델로 필요한 자산을 체계적으로 생성한다
- 생성한 결과물을 `design/generated/`에 저장한다
- 실제 채택한 레퍼런스나 수정본은 `design/reference/`, `design/export/`에 정리한다

권장 폴더 사용:

- `design/generated/`
  첫 생성본, 변형본, 실험본
- `design/reference/`
  스타일 레퍼런스, 무드보드, 선택된 기준 시안
- `design/export/`
  실제 앱에 넣을 확정 PNG/WebP/SVG 정리본

## Global Style Prompt

아래 공통 스타일 문구를 각 프롬프트에 붙여서 일관성을 유지합니다.

```text
2D lofi pixel art, digital camp at night, cozy but operational, not cute-for-the-sake-of-cute, sharp geometric silhouettes, crisp pixel edges, strong readable forms, dark midnight palette with ember orange, lantern gold, moonlight lavender, neon cyan accents, terminal-native atmosphere, indie hacking energy, slightly futuristic, no fantasy medieval props, no rounded mobile-game UI, composition optimized for app UI layering, transparent background if possible
```

## Output Rules

- 가능하면 `transparent background`
- 너무 디테일하게 그리지 말고 UI 위에 얹기 좋은 단순한 실루엣 유지
- 한 장면에 정보가 너무 많지 않게
- 과한 카툰 감성, 어린이 게임 느낌, 판타지 RPG 느낌은 피하기
- `readable at small size`를 항상 의식

## Naming Convention

파일명 예시:

```text
campfire-core-v1.png
smoke-blocked-v2.png
participant-agent-ghostty-v1.png
wood-stack-next-action-v1.png
```

## Required Asset List

### 1. Campfire Core

용도:

- 메인 mission 카드 뒤 중심 불
- 캠프의 중심축

프롬프트:

```text
Main campfire for a local-first coding camp UI, top-down to slight isometric view, warm ember core, elegant pixel flames, steady focal glow, feels like the center of an active mission, readable at medium size, no characters, transparent background, 2D lofi pixel art, digital camp at night, cozy but operational, not cute-for-the-sake-of-cute, sharp geometric silhouettes, crisp pixel edges, strong readable forms, dark midnight palette with ember orange, lantern gold, moonlight lavender, neon cyan accents, terminal-native atmosphere, indie hacking energy
```

### 2. Campfire Low State

용도:

- `불씨`

프롬프트:

```text
Small ember fire for a coding camp interface, weak newly-started flame, sparse sparks, low confidence but alive, subtle glow, transparent background, readable as a tentative state, 2D lofi pixel art, digital camp at night, cozy but operational
```

### 3. Campfire Active State

용도:

- `모닥불`

프롬프트:

```text
Active campfire state for a coding workspace UI, healthy focused flame, energetic but controlled, strong warm glow, visually says active work in progress, transparent background, 2D lofi pixel art, digital camp at night, cozy but operational
```

### 4. Lantern Review State

용도:

- `등불`
- 완료가 아니라 읽고 판단해야 하는 안정 상태

프롬프트:

```text
Review-ready lantern for a coding camp UI, stable warm light, calm and inviting, clearly different from active fire, suggests a finished segment waiting for human judgment, transparent background, 2D lofi pixel art, digital camp at night, cozy but operational
```

### 5. Smoke Blocked State

용도:

- `연기`

프롬프트:

```text
Blocked-work smoke signal for a coding camp UI, soft drifting smoke plume, gray-blue with faint cyan edge, readable as unresolved and needing help, not disaster, transparent background, 2D lofi pixel art, digital camp at night, cozy but operational
```

### 6. Wood Stack Next Action

용도:

- `장작`

프롬프트:

```text
Prepared wood stack for a coding camp UI, neatly arranged logs ready to feed the fire, visually communicates next action prepared, not active yet, subtle readiness glow, transparent background, 2D lofi pixel art, digital camp at night, cozy but operational
```

### 7. Agent Participant Base Sprite

용도:

- 에이전트 participant 기본 아이콘
- Claude, Codex, Gemini 공통 베이스

프롬프트:

```text
Minimal participant sprite for an AI coding agent inside a digital camp UI, small seated workstation silhouette, screen glow on face or body, ambiguous non-human mascot feel, readable at tiny size, transparent background, 2D lofi pixel art, digital camp at night, cozy but operational
```

### 8. Claude-Like Participant Variant

용도:

- Claude 계열 participant 변형

프롬프트:

```text
AI coding participant sprite variant for a warm thoughtful model, subtle amber and cream monitor glow, focused posture, terminal-native vibe, readable at small size, transparent background, 2D lofi pixel art, digital camp at night, cozy but operational
```

### 9. Codex-Like Participant Variant

용도:

- Codex 계열 participant 변형

프롬프트:

```text
AI coding participant sprite variant for a sharp implementation-focused model, cool cyan monitor glow, precise geometric silhouette, calm but productive, readable at small size, transparent background, 2D lofi pixel art, digital camp at night, cozy but operational
```

### 10. Gemini-Like Participant Variant

용도:

- Gemini 계열 participant 변형

프롬프트:

```text
AI coding participant sprite variant for a research and exploration oriented model, lavender and cyan highlights, curious posture, readable at small size, transparent background, 2D lofi pixel art, digital camp at night, cozy but operational
```

### 11. Terminal Station

용도:

- 사람이 직접 개입하는 terminal participant

프롬프트:

```text
Terminal workstation sprite for a digital camp UI, compact desk or crate with glowing terminal screen, clearly a human intervention station, readable at small size, transparent background, 2D lofi pixel art, digital camp at night, cozy but operational
```

### 12. Camp Ground Tile

용도:

- 장면 바닥

프롬프트:

```text
Seamless pixel ground tile for a nocturnal coding campsite, dark soil mixed with subtle grass and packed paths, understated, not noisy, supports UI overlays, tileable texture, 2D lofi pixel art, digital camp at night
```

### 13. Tree / Forest Edge Set

용도:

- 외곽 배경

프롬프트:

```text
Forest edge set for a nocturnal digital campsite, dark pine silhouettes with soft moonlit edges, atmospheric but not cluttered, transparent background, 2D lofi pixel art, digital camp at night
```

### 14. Rock / Crate / Utility Prop Set

용도:

- 캠프 주변 소품

프롬프트:

```text
Utility prop set for a coding campsite UI, rocks, crates, compact equipment boxes, simple readable silhouettes, useful for scene dressing without clutter, transparent background, 2D lofi pixel art, digital camp at night, cozy but operational
```

### 15. Neon UI Frame Corners

용도:

- 패널 코너 장식

프롬프트:

```text
Pixel UI frame corner accents for a futuristic campsite interface, sharp cyan and lavender corner brackets, tiny but high contrast, transparent background, 2D lofi pixel art, digital camp at night
```

### 16. Status Badge Set

용도:

- `불씨`, `모닥불`, `등불`, `연기`, `장작`용 작은 배지

프롬프트:

```text
Five tiny pixel status badges for a coding camp UI, ember, fire, lantern, smoke, wood stack motifs, each badge clearly distinct at small size, transparent background, 2D lofi pixel art, digital camp at night, cozy but operational
```

### 17. Night Sky Backdrop

용도:

- 전체 scene 배경

프롬프트:

```text
Wide night sky backdrop for a digital coding campsite, deep midnight gradient, subtle stars, faint moon haze, slight futuristic glow, low noise so UI remains readable, 2D lofi pixel art, digital camp at night
```

### 18. Camp Overview Hero Scene

용도:

- 랜딩/hero mockup

프롬프트:

```text
Full hero scene for a recovery-first coding camp product, central campfire mission, several AI coding participants around it, one smoke signal, one lantern, one wood stack ready, digital nocturnal campsite, local terminal-native vibe, beautiful but operational, composition suitable for product hero image, 2D lofi pixel art, digital camp at night, cozy but operational
```

## Follow-Up Variant Prompts

생성 후 이런 추가 프롬프트로 다듬으면 좋습니다.

### More Readable

```text
make silhouettes simpler, increase contrast, reduce texture noise, optimize for small UI size
```

### More Operational

```text
less whimsical, more terminal-native, clearer status communication, less decorative clutter
```

### More Cozy

```text
warmer ember tones, slightly softer atmosphere, stronger feeling of late-night focused making
```

### Transparent Cleanup

```text
remove background completely, isolate object cleanly, preserve crisp pixel silhouette
```

## Suggested First Batch

처음에는 이 6개만 뽑아도 충분합니다.

1. `campfire-core`
2. `campfire-low-state`
3. `campfire-active-state`
4. `lantern-review-state`
5. `smoke-blocked-state`
6. `wood-stack-next-action`

그 다음 participant sprite와 배경 세트를 붙이면 됩니다.
