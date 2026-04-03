# Campsite Family Look Spec

> Status: Draft
> Last updated: 2026-04-03
> Companion to: `docs/DESIGN.md`

## 1. Why This Exists

Campsite is not two products.

It is one world with two modes:

- `Camp mode`
- `Focus mode`

`Camp mode` is the spatial recovery surface.
`Focus mode` is the deep-work operational surface.

They must feel like the same product at all times.

That means family look is not mainly about illustration style.
It starts with:

- state language
- tone
- information hierarchy
- mission framing
- color semantics

If those stay aligned, the product feels whole.
If those drift, the product splits into "cute UI" and "serious CLI." That would be a mistake.

## 2. Product Philosophy

Campsite makes this promise to builders:

### 2.1 발상 (Ideation)

Campsite is a place that gives you power to direct AI and AI agents with clear goals and context.

This means:

- helping you frame the mission
- helping you assign intent cleanly
- helping you return to an idea without losing the thread

### 2.2 검토 (Review)

Campsite is a place that helps you control AI output and turn raw output into good finished work.

This means:

- making review-ready states obvious
- making blockers obvious
- making human judgment the center of quality

### 2.3 체력 (Stamina)

Campsite is a place that gives you the ability to do more ideation and more review at the same time without collapsing into chaos.

This means:

- lowering restart friction
- increasing recovery speed
- making multiple work threads feel legible instead of overwhelming

## 3. The Two Modes

### 3.1 Camp Mode

Purpose:

- space
- recovery
- ambient understanding
- re-entry
- vibe

Primary user questions:

- what is happening here
- who is still working
- what needs me now
- where should I jump back in

Visual behavior:

- spatial
- atmospheric
- state-driven
- emotionally warm but operational

Experience goal:

- the user can drop out of terminal execution and into Campsite without feeling like they left the product
- Campsite feels like the shared world around the work, not a separate dashboard
- it creates room to breathe, notice state, and choose the next move
- the visual world can adapt to place-vibes like aurora north, granite forest, canyon daylight, or a travel-inspired mood without losing Campsite identity

### 3.2 Focus Mode

Purpose:

- text
- speed
- execution
- deep work

Primary user questions:

- what is the next command
- what is blocked
- what changed
- what should I review or do now

Visual behavior:

- compressed
- terminal-forward
- low ceremony
- high signal density

Experience goal:

- the user can stay in flow while building in the terminal
- Campsite should feel present even when the visual camp is not open
- moving from Focus mode to Camp mode should feel like zooming out inside the same world
- even in pure terminal use, the language should still carry the same tranquil, wide-open, late-night camp energy

## 4. Shared Product Grammar

Camp mode and Focus mode must share the same grammar.

### 4.1 Shared State Names

Always use the same fire-state semantics:

- `불씨 / bulssi`
- `모닥불 / modakbul`
- `등불 / deungbul`
- `연기 / yeongi`
- `장작 / jangjak`

Never invent a second naming system for Focus mode.

Bad:

- camp says `등불`
- terminal says `done`

Good:

- camp says `등불`
- terminal says `deungbul (review-ready)`

### 4.2 Shared Mission Language

Both modes must describe work as:

- mission
- participant
- state
- next move

Bad:

- web says `mission`
- terminal says `task queue item`

Good:

- both say `mission`
- both say `next move`

### 4.3 Shared Tone

Tone in both modes should be:

- direct
- calm
- late-night focused
- not corporate
- not toy-like
- tranquil, not frantic

Camp mode can be warmer.
Focus mode can be tighter.
But neither should feel like a different company.

## 5. Shared Color Semantics

Colors should mean the same thing in both modes.

### 5.1 Ember Range

Use for:

- `불씨`
- `모닥불`
- mission heat
- active making energy

### 5.2 Lantern Gold

Use for:

- `등불`
- review-ready work
- stable human judgment points

### 5.3 Smoke Blue-Gray

Use for:

- `연기`
- blockers
- unresolved decision points

### 5.4 Ready Green

Use for:

- `장작`
- staged next action
- prepared but not yet burning work

### 5.5 Neon Cyan

Use sparingly for:

- active CTA
- selected focus
- system edge highlight

In terminal mode, these should map to ANSI colors with the same semantic meaning.

## 5.6 Shared Environment Logic

The surrounding world may change.

Examples:

- aurora north
- canyon daylight
- granite forest
- family-travel-inspired mood

But the product identity stays stable because:

- the hearth remains the center
- state colors remain consistent
- mission language stays the same
- tranquility stays the emotional baseline

## 6. Shared Hierarchy

Both modes must answer the same three questions first:

1. who is active
2. what needs review or intervention
3. what the next move is

Camp mode answers this with space and scene.
Focus mode answers this with text and ordering.

But the hierarchy must remain identical.

## 7. Translation Rules Between Modes

The same state should translate cleanly between spatial UI and terminal UI.

This is also the experiential bridge:

- Focus mode is where the builder pushes hard
- Camp mode is where the builder regains context, reflects, redirects, and re-enters
- the transition between them should feel like changing altitude, not switching apps
- both modes should support long-breath autonomy rather than endless anxious looping

### Example Mapping

- `Camp mode`
  - glowing active fire around a participant
- `Focus mode`
  - `modakbul  claude  active on auth flow`

- `Camp mode`
  - lantern near participant
- `Focus mode`
  - `deungbul  codex  review-ready`

- `Camp mode`
  - smoke plume
- `Focus mode`
  - `yeongi  gemini  blocked on tradeoff`

- `Camp mode`
  - stacked wood
- `Focus mode`
  - `jangjak  terminal  next move prepared`

## 8. UI Rules By Mode

### 8.1 Camp Mode Rules

- prioritize atmosphere only after clarity
- show participants as spatial beings in one shared camp
- make return-to-work the hero interaction
- let the mission fire anchor the scene

### 8.2 Focus Mode Rules

- prioritize text compression and command adjacency
- keep banners, summaries, and next-move blocks short
- use the same state labels as camp mode
- never fall back to generic CLI language if a Campsite term already exists

## 9. Copy Rules

### Always Prefer

- `mission`
- `participant`
- `working now`
- `waiting on you`
- `next move`
- `review-ready`
- `blocked`
- `prepared`

### Avoid

- generic dashboard speak
- project manager jargon
- cutesy fantasy writing
- fake urgency language

## 10. Family-Look Acceptance Test

The family look is working if:

- a screenshot of Camp mode and a screenshot of Focus mode obviously belong to the same product
- a user can learn the fire-state language once and apply it everywhere
- Camp mode feels more spacious, but not softer in logic
- Focus mode feels more compressed, but not colder in philosophy
- both modes strengthen the same three promises:
  - 발상
  - 검토
  - 체력

## 11. Product Promise

Campsite is the place where builders:

- form better missions
- review AI work with more control
- build the stamina to do both repeatedly

And it should feel like a place where:

- the world around the work can match your actual life and travel vibe
- AI can keep moving without making the whole experience frantic
- you can sustain a long creative arc, not just win a short productivity sprint

It should also feel like this:

- you are working in the terminal
- you step into Campsite when you need space, recovery, and shared state
- you step back into the terminal without losing the thread

In the future, this world should naturally extend to teams:

- multiple people can gather in the same Campsite
- talk in the same shared work space
- hand off git branches and work threads
- receive missions, branches, and context from each other without collapsing into coordination chaos

That is the product.
Not just orchestration.
Not just memory.
Not just a cute camp.
