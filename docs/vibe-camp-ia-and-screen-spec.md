# Campsite IA and Screen Spec: Recovery-First Camp

> Owner: Kiwon Cho
> Status: Draft
> Last updated: 2026-04-03
> Parent: `docs/spec-driven-prd-vibe-camp.md`

## 1. Purpose

This document turns the vibe-camp PRD into a concrete information architecture and screen-level UX contract.

The guiding rule is simple:

- the user returns after interruption
- the user understands the camp in 5 seconds
- the user knows the next move without reading logs first

## 2. IA Overview

The v1 product should stay intentionally small.

Top-level information architecture:

1. Camp
2. Participant Detail
3. Mission Detail
4. Event Log
5. Settings

This is not a many-tab product. The camp scene is the primary surface. Everything else exists to support that return moment.

## 3. IA Principles

### 3.1 One Primary Surface

The `Camp` view is the default, landing, and resume destination.

### 3.2 Read Before Drill-Down

Users should not need to open drawers or detail panes to answer:

- who is active
- what needs review
- what to do next

### 3.3 Spatial First, Text Second

The visual camp should carry first-pass understanding. Text confirms, clarifies, and supports action.

### 3.4 Detail Lives One Click Away

Users can drill down quickly, but detail should not pollute the initial return screen.

## 4. Primary Objects

### 4.1 Campfire

Represents the current mission or the active work thread.

It must always show:

- mission title
- mission phase
- top next action
- count of active participants

### 4.2 Participant

Represents an agent, terminal session, or task that entered the camp.

It must always have:

- display name
- type
- fire-state
- last meaningful update
- next expected interaction

### 4.3 Return Panel

Represents the plain-language re-entry summary.

It must always show:

- active now
- waiting on you
- do this next

### 4.4 Event Log

Represents the recent timeline of camp changes.

It should help answer:

- what changed while I was gone
- what changed most recently

### 4.5 State Legend

Represents the meaning of the five fire-states.

It is especially important in the first few sessions, then can collapse.

## 5. Navigation Model

### 5.1 Global Navigation

V1 navigation should be lightweight:

- `Camp`
- `Log`
- `Settings`

Participant and mission views open as overlays, drawers, or side panels. They do not need top-nav tabs.

### 5.2 Resume Flow

On launch or resume:

1. open `Camp`
2. restore last known scene state
3. focus the highest-priority return target
4. surface the `Return Panel`

### 5.3 Priority Rules

Return focus priority:

1. `연기`
2. `등불`
3. `장작`
4. `모닥불`
5. `불씨`

This preserves the idea that human-needed states should pull attention first.

## 6. Screen Inventory

### 6.1 Screen A: Camp Overview

This is the hero screen and default destination.

Purpose:

- reorient the user fast
- show mission state
- show participant states
- expose one obvious next action

Required regions:

- top status bar
- left terminal/sidebar rail
- center camp scene
- right return panel
- bottom activity strip

#### Top Status Bar

Must show:

- project name
- current mission name
- current time or last sync freshness
- active participant count
- blocked count

#### Left Terminal Rail

Must show compact technical metadata:

- local status
- current workspace or branch
- last camp resume timestamp
- optional quick filters

This should echo the design system's terminal-sidebar idea.

#### Center Camp Scene

Must show:

- central campfire for mission
- participant placements around camp
- visible state auras
- simple environmental cues only if they support state reading

Rules:

- the campfire must be the visual anchor
- participants in `등불` and `연기` must read louder than `불씨`
- `모닥불` must visually feel active without becoming noisy

#### Right Return Panel

Must show three plain-language blocks:

- `Working now`
- `Waiting on you`
- `Next move`

This is the most important textual surface in v1.

#### Bottom Activity Strip

Must show the latest 3 to 5 meaningful camp events.

Examples:

- `Codex moved to 등불: auth tests passed, review login edge cases`
- `Claude moved to 연기: missing env for billing flow`
- `Gemini prepared 장작: draft release notes ready`

### 6.2 Screen B: Participant Detail

Purpose:

- explain one participant clearly
- provide enough context to act

Must show:

- participant name and type
- current fire-state
- short summary of current or last completed segment
- blocker reason if present
- prepared next action if present
- recent event history for that participant

Actions:

- open terminal or attach to source workflow
- acknowledge review-ready output
- mark blocker resolved
- start prepared next action

### 6.3 Screen C: Mission Detail

Purpose:

- explain the current campfire mission
- summarize why the camp exists right now

Must show:

- mission title
- mission summary
- current mission phase
- primary next action
- participant contributions
- recent mission-level changes

### 6.4 Screen D: Event Log

Purpose:

- provide chronological visibility without turning the main scene into a dashboard

Must show:

- timestamp
- participant
- prior state
- new state
- short summary

Default sort:

- newest first

Filters:

- by participant
- by state
- by unresolved only

### 6.5 Screen E: Settings

Purpose:

- configure bounded automation and visual behavior

Must show:

- fire-state definitions
- automation policy toggles
- local scene preferences
- terminal attach preferences

## 7. Camp Overview Wire Contract

This section defines what the first usable UI must support before polish.

### 7.1 Required Above-The-Fold Elements

The user must see without scrolling:

- mission title
- at least one participant in state
- one review-needed item if any exist
- one blocker if any exist
- one next action

### 7.2 Required At-A-Glance Copy

The `Return Panel` should use direct language:

- `2 still working`
- `1 waiting for your read`
- `Next: review Codex login summary`

Avoid poetic copy in the critical re-entry path.

### 7.3 Required Visual Distinctions

- `불씨` must look tentative
- `모닥불` must look energetically active
- `등불` must look stable and inviting
- `연기` must look unresolved and urgent
- `장작` must look staged and actionable

## 8. Mobile and Small-Screen Behavior

V1 can be laptop-first, but it should not break on smaller viewports.

Small-screen adaptation rules:

- keep the camp scene visible first
- collapse terminal rail into a toggle
- stack the return panel below the scene
- preserve the three key signals in the first viewport

## 9. Empty, Sparse, and Dense States

### 9.1 Empty Camp

Show:

- mission prompt
- invite to add first participant
- clear explanation of fire-states

### 9.2 Sparse Camp

If there is only one participant:

- keep the campfire visible
- avoid making the scene feel broken or lonely
- use the return panel to reinforce value

### 9.3 Dense Camp

If there are many participants:

- group visually by priority or state
- never hide `연기` or `등불`
- deprioritize `불씨` and low-signal participants

## 10. Interaction Priorities

Priority interactions:

1. resume the most important participant
2. inspect what changed
3. start the next prepared action
4. review a completed segment
5. understand why something is blocked

Everything else is secondary.

## 11. IA Acceptance Criteria

This IA and screen spec is accepted when:

- the camp overview alone answers the three re-entry questions
- participant detail supports decision-making without opening raw logs first
- event log is useful but not required for first-pass orientation
- screen structure still works when there is 1 participant and when there are 8+
- the product feels like a place, not a tab farm
