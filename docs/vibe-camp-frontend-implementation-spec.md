# Campsite Frontend Implementation Spec: Recovery-First Camp

> Owner: Kiwon Cho
> Status: Draft
> Last updated: 2026-04-03
> Parents:
> - `docs/spec-driven-prd-vibe-camp.md`
> - `docs/vibe-camp-ia-and-screen-spec.md`
> - `docs/DESIGN.md`

## 1. Purpose

This document translates the vibe-camp PRD and IA into an implementation-facing frontend contract.

It defines:

- page structure
- component boundaries
- view model shape
- state mapping
- interaction events
- implementation priorities

It is intentionally product-first, not framework-specific.

## 2. Frontend Scope For v1

V1 frontend scope:

- render the camp overview
- render participant detail
- render mission detail
- render event log
- render settings for basic policies
- restore camp state on resume

Out of scope for v1:

- multiplayer presence
- remote sync
- full pixel animation engine
- autonomous agent planning UI
- advanced scene editing

## 3. Rendering Model

The frontend should use a layered rendering model:

1. `App shell`
2. `Scene layer`
3. `Operational overlays`
4. `Detail panels`
5. `Transient notifications`

### 3.1 App Shell

Contains:

- top bar
- nav
- layout frame

### 3.2 Scene Layer

Contains:

- campfire
- participant sprites or tiles
- environment accents
- state aura effects

### 3.3 Operational Overlays

Contains:

- return panel
- activity strip
- state legend

### 3.4 Detail Panels

Contains:

- participant drawer or modal
- mission drawer or modal
- settings view

## 4. View Model

The frontend should render from a stable view model that is already oriented around recovery.

Suggested top-level shape:

```ts
type CampViewModel = {
  project: {
    id: string
    name: string
    branch?: string
  }
  mission: MissionViewModel
  participants: ParticipantViewModel[]
  events: CampEventViewModel[]
  returnSummary: ReturnSummaryViewModel
  settings: CampSettingsViewModel
  updatedAt: string
}

type MissionViewModel = {
  id: string
  title: string
  summary: string
  state: FireState
  nextAction?: NextActionViewModel
}

type ParticipantViewModel = {
  id: string
  name: string
  type: "agent" | "terminal" | "task"
  tool?: string
  fireState: FireState
  summary?: string
  blocker?: string
  nextAction?: NextActionViewModel
  lastUpdatedAt: string
  priorityScore: number
  positionHint?: { x: number; y: number }
}

type CampEventViewModel = {
  id: string
  participantId?: string
  createdAt: string
  fromState?: FireState
  toState: FireState
  summary: string
}

type ReturnSummaryViewModel = {
  activeNow: SummaryChip[]
  waitingOnYou: SummaryChip[]
  nextMove?: NextActionViewModel
}

type NextActionViewModel = {
  id: string
  label: string
  participantId?: string
  actionType: "review" | "resume" | "unblock" | "start-prepared"
}

type SummaryChip = {
  id: string
  label: string
  participantId?: string
}

type CampSettingsViewModel = {
  autoPoliciesEnabled: boolean
  reducedMotion: boolean
  compactMode: boolean
}

type FireState = "bulssi" | "modakbul" | "deungbul" | "yeongi" | "jangjak"
```

## 5. Component Architecture

### 5.1 App-Level Components

- `CampApp`
- `CampLayout`
- `TopStatusBar`
- `PrimaryNav`

### 5.2 Scene Components

- `CampScene`
- `CampfireCore`
- `ParticipantNode`
- `StateAura`
- `CampBackground`

### 5.3 Overlay Components

- `ReturnPanel`
- `ActivityStrip`
- `StateLegend`
- `ToastStack`

### 5.4 Detail Components

- `ParticipantPanel`
- `MissionPanel`
- `EventLogView`
- `SettingsView`

### 5.5 Utility Components

- `PixelBadge`
- `FireStateChip`
- `PriorityMarker`
- `TerminalMetaRail`

## 6. Component Responsibilities

### 6.1 CampScene

Responsibilities:

- lay out mission and participants
- apply visual hierarchy
- manage selection state

Rules:

- must not own business logic
- should receive pre-ranked participants
- should support deterministic layout from `positionHint` or priority rules

### 6.2 ParticipantNode

Responsibilities:

- render one participant
- reflect fire-state visually
- expose hover, focus, and click affordances

Required props:

- name
- type
- fireState
- priority
- selected
- summary preview

### 6.3 ReturnPanel

Responsibilities:

- summarize re-entry state in plain language
- render next action CTA

Rules:

- copy must be literal and operational
- no decorative prose in the critical path

### 6.4 ParticipantPanel

Responsibilities:

- explain why this participant matters now
- show summary, blocker, and next action
- bridge back into the terminal or workflow

## 7. Visual Mapping Spec

The design system already defines "Digital Hearth." This frontend should make that operational.

### 7.1 Color Mapping By State

- `bulssi`
  Low-intensity ember tones. Small aura, low confidence feel.
- `modakbul`
  Brightest warm active glow. Motion allowed.
- `deungbul`
  Stable warm light with calm edge emphasis. Inviting, readable.
- `yeongi`
  Diffuse gray-cyan smoke effect. Must feel unresolved.
- `jangjak`
  Structured stacked form with subtle readiness glow. Not active, but prepared.

### 7.2 Motion Rules

- `modakbul` may animate lightly
- `bulssi` may pulse slowly
- `deungbul` should mostly hold steady
- `yeongi` may drift subtly
- `jangjak` should not animate like active fire

Reduced motion mode must flatten these effects without losing state readability.

### 7.3 Typography Usage

- headline and camp labels use `Space Grotesk`
- body and summaries use `Inter`
- technical metadata uses the design system's small terminal treatment

### 7.4 Shape Rules

- keep zero-radius hard edges
- use tonal depth before borders
- use pixel accents sparingly and only at meaningful boundaries

## 8. Priority and Sorting Logic

The frontend should not rely only on chronological order.

Suggested priority ordering:

1. `yeongi`
2. `deungbul`
3. `jangjak`
4. `modakbul`
5. `bulssi`

Tie-breakers:

1. explicit priority score
2. most recent update
3. mission relevance

This ordering should affect:

- selection on resume
- return panel copy
- participant placement prominence
- activity strip item choice

## 9. State Transition UX Rules

### 9.1 `bulssi` -> `modakbul`

UI response:

- strengthen glow
- move participant into active grouping
- update return panel if active count changed

### 9.2 `modakbul` -> `deungbul`

UI response:

- add review-ready emphasis
- insert event into activity strip
- elevate participant in resume priority

### 9.3 Any -> `yeongi`

UI response:

- show blocker reason in activity strip
- mark participant as human-needed
- promote to top return focus

### 9.4 Any -> `jangjak`

UI response:

- surface prepared next action
- render a clear CTA in participant panel
- do not auto-run

## 10. Data Update Model

V1 can use a simple update strategy.

Preferred sequence:

1. initial camp snapshot load
2. incremental participant/event updates
3. local optimistic UI for explicit user actions

The frontend should be able to handle:

- full snapshot replacement
- partial participant update
- appended event
- mission update

## 11. Failure and Degraded States

### 11.1 Scene Fails To Render

Fallback behavior:

- show terminal-style overview list
- keep return panel text visible
- preserve next action CTA

### 11.2 Participant Missing Or Crashed

Fallback behavior:

- preserve last known state
- mark as disconnected or stale
- do not silently remove it from the camp

### 11.3 Empty Data

Fallback behavior:

- render empty camp onboarding state
- explain how to add first participant

## 12. Accessibility and Clarity

- State must not depend on color alone.
- Each fire-state needs text and shape support.
- Keyboard focus order must prioritize next action and active issues.
- Panels and overlays must be keyboard dismissible.
- Motion must have a reduced-motion mode.

## 13. Implementation Milestones

### Milestone 1: Structural Prototype

- app shell
- camp overview layout
- static participant nodes
- return panel
- activity strip

### Milestone 2: Interactive Recovery Loop

- selection
- participant panel
- mission panel
- event log
- resume priority behavior

### Milestone 3: Real State Wiring

- fire-state updates
- event feed updates
- summary rendering
- prepared next action rendering

### Milestone 4: Visual Depth

- pixel-art environment polish
- motion tuning
- reduced-motion support
- responsive refinement

## 14. Frontend Acceptance Criteria

The frontend spec is accepted when:

- a static demo already communicates the three re-entry signals clearly
- state changes visibly alter hierarchy and recommended action
- `deungbul`, `yeongi`, and `jangjak` are distinguishable without reading all details
- the scene still feels like Campsite, not a generic kanban or dashboard
- the terminal fallback remains usable if the scene fails
