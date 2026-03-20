# Design System Strategy: The Nocturnal Interface

## 1. Overview & Creative North Star: "The Digital Hearth"
This design system is built upon the concept of **"The Digital Hearth."** It envisions the UI not as a flat screen, but as a high-tech campsite nestled in a pixelated wilderness. The goal is to balance the warmth of nostalgia (lofi pixel aesthetics) with the precision of a futuristic terminal.

To move beyond a "template" look, we reject the rigid, centered grid. Instead, we embrace **Intentional Asymmetry**. Layouts should feel like a scout’s map or a glowing terminal—important technical data pushed to the edges (using the monospace scale), while the "warmth" of the content sits in the center. We break the fourth wall with overlapping elements, where a terminal-style label might bleed over the edge of a container, suggesting a system that is alive and unconstrained.

## 2. Colors: Tonal Depth & The Neon Glow
The palette is a journey through a midnight forest, illuminated by a humming cybernetic core.

*   **Primary (`#cdc1e0`) & Secondary (`#bac8dc`):** These are our "moonlight" tones. Use them for high-level information and interactive states.
*   **Tertiary (`#00dce5`):** This is our "Neon Cyan" spark. Use it sparingly—it is the glowing ember of the campsite. It should be reserved for critical CTAs, active states, and "high-tech" accents.
*   **Surface Hierarchy (The Nesting Rule):** We define depth through background shifts, never lines.
    *   **Background (`#131318`):** The deep night sky.
    *   **Surface Container Low (`#1b1b20`):** Use for large structural blocks.
    *   **Surface Container High (`#2a292f`):** Use for interactive cards or floating panels to create a "lifted" effect.
*   **The "No-Line" Rule:** 1px solid borders are strictly prohibited for sectioning. To separate a sidebar from a main feed, transition from `surface` to `surface-container-low`.
*   **The "Glass & Gradient" Rule:** For primary actions, use a subtle linear gradient from `primary` to `primary-container`. For floating overlays, use a backdrop-blur (12px–20px) with `surface-variant` at 60% opacity to create a "frosted terminal" effect.

## 3. Typography: Technical Soul
The contrast between `Space Grotesk` (Sans-Serif) and `Inter` (used here as a clean, highly legible companion) creates a sense of "Humanity vs. Machine."

*   **Display & Headlines (Space Grotesk):** These are your "Editorial" voices. Use `display-lg` for hero moments, leaning into the wide apertures of the typeface to feel futuristic. 
*   **Technical Labels (Space Grotesk @ `label-sm`):** Despite being a sans-serif, when used at tiny scales with all-caps and increased letter-spacing (0.05rem), it mimics the look of a crisp monospace terminal. Use this for metadata and system status.
*   **Body (Inter):** All long-form content uses Inter. It provides the "clean" contrast to the more stylistic headers, ensuring readability against the dark, high-contrast background.

## 4. Elevation & Depth: Tonal Layering
In this system, shadows are light, not dark.

*   **The Layering Principle:** To create a card, place a `surface-container-highest` (`#35343a`) shape onto a `surface` background. The delta in luminance creates the "edge."
*   **Ambient Shadows:** For floating elements (like modals), use a shadow color derived from `on-surface` (`#e4e1e9`) at 5% opacity with a blur of 32px. This simulates the soft glow of a screen reflecting off a surface, rather than a muddy black shadow.
*   **The Ghost Border:** If accessibility requires a stroke (e.g., in a complex form), use `outline-variant` (`#49454e`) at 20% opacity. It should be felt, not seen.
*   **Pixel Art Accents:** Use 4px x 4px "corner accents" in `tertiary` to frame containers, nodding to the pixel-art aesthetic without cluttering the UI with actual low-res textures.

## 5. Components: The High-Tech Toolkit

### Buttons
*   **Primary:** Solid `tertiary` (`#00dce5`) with `on-tertiary` text. Absolutely square corners (`0px`).
*   **Secondary:** `surface-container-high` background with a `tertiary` "Ghost Border."
*   **States:** On hover, primary buttons should "flicker" (opacity shift to 80%) to mimic a vintage monitor.

### Inputs & Fields
*   **Style:** No background. Use a bottom-only "Ghost Border" using `outline`. 
*   **Focus:** The bottom border transforms into a solid `tertiary` line. Helper text should use `label-sm` in a monospace-style treatment.

### Chips & Tags
*   **Style:** Small, rectangular boxes with `primary-container` background. 
*   **Typography:** Use `label-sm` to keep them feeling like "system data."

### Cards & Lists
*   **No Dividers:** Separate list items using `spacing-4` (0.9rem) of vertical whitespace. 
*   **Interactive Lists:** On hover, the entire list item background should shift to `surface-container-low`.

### The "Terminal" Sidebar (Custom Component)
A fixed-position element using `surface-container-lowest` that houses system stats (time, connection status, coordinates) using `label-sm`. This reinforces the "high-tech campsite" narrative.

## 6. Do's and Don'ts

### Do:
*   **Do** embrace hard edges. Every corner must be `0px`. This is a digital world; curves feel too "organic" for this specific aesthetic.
*   **Do** use `spacing` level `2` and `3` to create massive "breathing room" between sections. (Original was `spacing-16` and `spacing-24`, which were interpreted as `spacing: 2` and `spacing: 3` based on the level of whitespace desired).
*   **Do** use asymmetrical margins. Try pushing a headline 2rem further to the right than the body text below it.

### Don't:
*   **Don't** use 100% white. The brightest text should be `on-surface` (`#e4e1e9`) to reduce eye strain and maintain the lofi mood.
*   **Don't** use standard drop shadows. If a component feels "flat," increase the surface container tier instead of adding a shadow.
*   **Don't** use icons with rounded terminals. Select sharp, pixel-perfect, or geometric icon sets to match the `0px` border radius.