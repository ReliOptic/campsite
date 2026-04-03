# Campsite SVG Sprite Reference

Inline SVG sprites embedded in camp render HTML. All icons use `<rect>` elements on a pixel grid — no curves, 0px radius.

## Fire State Icons (16x16 viewBox)

### bulssi (불씨) — ember seed
Small low flame, 3 rects. Ember orange, low opacity.

### modakbul (모닥불) — active fire
Full flame shape: wood base, orange body, yellow mid, white tip. 7 rects.

### deungbul (등불) — lantern review
Lantern form: pole, glass body in review-gold, cap, wick glow. 5 rects.

### yeongi (연기) — smoke blocked
Drifting column: 5 rects at alternating x-offsets, decreasing opacity upward. CSS drift animation.

### jangjak (장작) — wood stack
Three stacked log rows, green-tinted ready state. 3 rects.

## Campfire Icon (32x32 viewBox)

Larger campfire for mission label. Wood base (brown), flame body (ember), flame mid (gold), flame tip (warm white). 7 rects.

## Color Reference

| Token | Hex | Usage |
|-------|-----|-------|
| ember | #ff9f4a | bulssi, modakbul, campfire flame |
| review | #f6d365 | deungbul lantern, flame mid |
| smoke | #8fa1b3 | yeongi smoke column |
| ready | #7fd98f | jangjak wood stack |
| wood | #8B5E3C / #6B4226 | campfire base, bulssi base |
| tip | #ffe0b2 | flame/wick highlight |
