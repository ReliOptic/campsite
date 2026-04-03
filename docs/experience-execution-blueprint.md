# Campsite Experience Execution Blueprint

> Status: Draft
> Last updated: 2026-04-03
> Purpose: align execution plan, implementation shape, UX/UI system, and emotional direction in one document
> Companion docs:
> - `docs/spec-driven-prd-vibe-camp.md`
> - `docs/family-look-spec.md`
> - `docs/DESIGN.md`
> - `docs/hybrid-testing-strategy.md`

## 1. What We Are Actually Building

Campsite is a recovery-first AI workspace.

It is not:

- only a terminal
- only a web page
- only a context compiler
- only a multi-agent orchestrator

It is one workspace with two connected surfaces:

- `Focus mode`
  terminal-first execution, speed, sharpness, deep work
- `Camp mode`
  spatial recovery, state visibility, ambient understanding, vibe

The product succeeds when a builder can work in terminal flow, step out into Campsite to recover context, and return without feeling they changed products.

## 2. User Experience We Want

The target feeling is:

- I can build in a terminal without losing momentum
- I can step into Campsite when I need room to think
- the space helps me remember what is alive
- the product feels calm, wide, and warm
- AI is active, but the experience is not frantic

This is not "automation at all costs."

This is:

- long-breath autonomy
- recovery instead of panic
- review instead of blind delegation
- tranquil flow instead of infinite-loop aggression

## 3. Product Philosophy

### 3.1 발상

Campsite gives the builder power to direct AI with clear goals, context, and mission framing.

Product implication:

- mission must always be visible
- context must survive interruption
- the workspace should help a user restart an idea cleanly

### 3.2 검토

Campsite helps the builder control output and turn rough AI work into good finished work.

Product implication:

- review-ready states must be obvious
- blocked states must be obvious
- the system should favor human judgment points over false completion

### 3.3 체력

Campsite helps the builder sustain more ideation and more review without collapsing into chaos.

Product implication:

- reduce restart friction
- reduce context rebuild time
- make multiple threads legible
- preserve mental energy across interruptions

## 4. Core Experience Loop

The primary loop is:

1. enter Focus mode and start working
2. sync mission and state into the workspace
3. let agents or terminals progress in bounded ways
4. step away for life, travel, work, or family
5. re-enter via Campsite
6. understand the state in five seconds
7. choose the next move
8. return to execution

Everything in the product should strengthen this loop.

## 5. Modes As One World

### 5.1 Focus Mode

Focus mode is where execution happens.

It should feel:

- compressed
- crisp
- text-led
- operational
- terminal-native

It should answer:

- what is the mission
- what is active now
- what is waiting on me
- what is the next move

### 5.2 Camp Mode

Camp mode is where recovery and orientation happen.

It should feel:

- spacious
- legible
- atmospheric
- warm but not cute-for-its-own-sake
- like a place, not a dashboard

It should answer:

- who is still working
- what reached review
- what is blocked
- what I should pick up next

### 5.3 Shared Grammar

The two modes must share:

- the same mission language
- the same fire-state names
- the same semantic colors
- the same emotional tone
- the same answer to "what should I do next"

## 6. State Model

The product must not lie with simplistic completion language.

Use fire-state semantics:

- `불씨 / bulssi`
  newly started or low-confidence work
- `모닥불 / modakbul`
  active work in progress
- `등불 / deungbul`
  bounded progress ready for review
- `연기 / yeongi`
  blocked or human-needed state
- `장작 / jangjak`
  prepared next move, not yet burning

The emotional rule:

- no false endings
- no fake certainty
- no "done" when the real state is "come look at this"

## 7. UX Hierarchy

On both surfaces, the product should answer in this order:

1. what is alive
2. what needs me
3. what I should do next
4. what changed while I was away

This is more important than:

- decorative richness
- extra controls
- orchestration complexity

## 8. UI Direction

### 8.1 Composition

The visual system should combine:

- a warm hearth center
- a clear state-driven camp layout
- quiet background atmosphere
- hard-edged terminal discipline

### 8.2 Environment

The product should support place-adaptive vibes such as:

- aurora north
- granite forest
- canyon daylight
- travel-inspired quiet camps

But the world must stay recognizably Campsite because:

- the hearth is always central
- fire-state colors keep their meaning
- the mission language stays fixed
- the mood stays tranquil

### 8.3 Terminal Family Look

The terminal side should not become generic CLI output.

It should preserve:

- same state names
- same mission framing
- same calm tone
- same review-first hierarchy

The terminal is not the opposite of the camp.
It is the close-up view of the same world.

## 9. Implementation Architecture

### 9.1 Foundation

Foundation can be strong and low-level.

Examples:

- shell-based project orchestration
- local state store
- file-driven source of truth
- terminal foundation such as `libghostty`

Foundation owns:

- terminal rendering
- embedding
- process control
- performance
- local filesystem contracts

### 9.2 Product Layer

Campsite owns:

- mission semantics
- recovery loop
- fire-state semantics
- participant lifecycle
- family look
- tranquil autonomy
- review culture

This boundary must stay clear.

## 10. Execution Plan

### Step 1. Reliability Before Spectacle

Goal:

- make core loop trustworthy before polishing visuals

Deliverables:

- local camp state
- sync/save/peek integration
- session lifecycle capture
- safe checkpoint push
- hybrid smoke coverage

Success signal:

- the user can trust the system state

### Step 2. Focus Mode Becomes Productive And Distinct

Goal:

- make terminal output feel like Campsite, not generic shell glue

Deliverables:

- mission-first status output
- stronger `working-now`, `waiting-on-you`, `next-move` summaries
- clearer freshness semantics
- reduced placeholder noise

Success signal:

- a user can stay in terminal mode and still feel the product identity

### Step 3. Camp Mode Becomes Truthful

Goal:

- make the camp scene reflect real state rather than decorative approximation

Deliverables:

- render from live participant state
- better summaries per participant
- stronger distinction between `등불`, `연기`, and `장작`
- sparse-state behavior that does not over-speak

Success signal:

- the camp is useful on a real return, not only in demos

### Step 4. Visual System Deepens

Goal:

- increase emotional pull without sacrificing clarity

Deliverables:

- designed fire-state assets
- environment themes
- stronger scene composition
- refined terminal family look

Success signal:

- users describe it as a place they want to come back to

### Step 5. Bounded Autonomy

Goal:

- let the workspace feel alive without turning into chaos

Deliverables:

- explicit post-task policies
- review-ready summaries
- blocker capture
- limited auto-follow-up only when authored by the user

Success signal:

- AI feels active, but the user still feels in control

### Step 6. Shared Camp Futures

Goal:

- open a future path for small-team handoff without breaking solo clarity

Deliverables:

- branch handoff concepts
- shared mission thread design
- teammate presence model

Success signal:

- team expansion feels like a natural extension of solo Campsite

## 11. Testing And Review

Use hybrid validation:

- Ralph-style loops for command reliability
- human review for product truth

Automated loops should verify:

- sync/save/peek behavior
- state transitions
- render generation
- checkpoint push

Human review should verify:

- five-second clarity
- Camp mode and Focus mode coherence
- truthful summaries
- calm emotional tone

## 12. UX/UI Guardrails

Never do these:

- show "done" when review is actually needed
- make scenery stronger than state
- let Camp mode become toy-like
- let Focus mode become generic enterprise CLI output
- let automation feel louder than the human

Always do these:

- keep mission visible
- keep next move obvious
- keep state language consistent
- keep the hearth central
- keep the tone calm and direct

## 13. Definition Of Product Quality

Campsite feels complete when:

- a user can leave and return without panic
- AI progress is visible without becoming noisy
- terminal work and camp recovery feel like one world
- the experience supports travel, life, family, and deep work together
- the product gives energy instead of draining it

That is the standard.
