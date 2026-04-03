# Campsite Spec-Driven PRD: Recovery-First Vibe Camp

> Owner: Kiwon Cho
> Status: Draft
> Last updated: 2026-04-03
> Based on: `docs/office-hours-vibe-camp-design.md`
> Foundation boundary: `docs/libghostty-foundation-boundary.md`

## 1. Product Summary

Campsite is evolving from a session context compiler into a recovery-first local work space for solo vibe coders.

The first product is not a generic multi-agent orchestrator. It is a terminal-first camp where local agents and terminal tasks "enter the camp," leave behind visible state, and let the human return later and understand the whole situation in about five seconds.

The web scene is the visible camp. The terminal remains the working edge.

## 2. Problem Statement

Solo builders using Claude Code, Codex, Gemini, Ghostty, and other local tools lose momentum when they context-switch away and return later.

The painful moment is not "I cannot run enough agents." The painful moment is:

- I do not know who is still working.
- I do not know what finished.
- I do not know what changed.
- I do not know what I should do next.

That recovery friction:

- lowers vibe-coding retention
- increases restart time after interruption
- pushes focused work later into the night
- makes multi-agent work feel messy even when output is technically progressing

## 3. Product Thesis

The first great Campsite experience is not more automation. It is better re-entry.

If Campsite can make a user step away, come back, and immediately regain working context, then it creates:

- higher retention for long-running creative/engineering sessions
- lower handoff friction between human and agent
- more trust in running multiple agents at once
- a stronger emotional loop than plain dashboards or logs

This requires:

- a spatial metaphor instead of a plain control panel
- a state model based on work phase and human intervention timing
- bounded automation, where agents leave behind useful state instead of silently creating more work

## 4. Goals

- G1: A returning user can understand camp state in 5 seconds or less.
- G2: The first screen answers three questions at a glance:
- who is active
- what reached a human review point
- what the next human action is
- G3: Campsite feels playful and alive without hiding critical state.
- G4: Solo vibe coders can manage multiple local agents without feeling scattered.
- G5: Campsite remains terminal-first and local-first.
- G6: Agent completion defaults to state capture, not uncontrolled follow-on execution.

## 5. Non-Goals

- Full multiplayer team world in v1
- Hosted orchestration backend
- Autonomous agent swarm that continuously self-assigns tasks
- Replacing agent CLIs with a proprietary runtime
- Deep IDE integration as a launch requirement
- Turning Campsite into a generic observability console

## 6. Primary User

### Primary Wedge

A solo vibe coder who:

- uses multiple local AI coding tools and terminals
- frequently context-switches between projects or responsibilities
- comes back to partially completed work and loses time rebuilding mental context
- wants work to feel alive and coherent, not like scattered logs

### Secondary User

Hackathon participants and small teams who may later adopt the same camp metaphor, but only after the solo recovery loop is strong.

## 7. Jobs To Be Done

When I come back after being away, I want to know what is going on in seconds so I can continue without reconstructing everything from memory.

When I let an agent keep working, I want to trust that it will leave behind a useful state, not a bigger mess.

When I open Campsite, I want the environment to feel motivating and legible, not like another enterprise dashboard.

When an agent reaches a meaningful stopping point, I want Campsite to show me whether I need to review, decide, unblock, or continue.

## 8. Product Principles

### 8.1 Recovery First

Every feature must improve the return-to-work loop before it improves concurrency, orchestration power, or visual complexity.

### 8.2 State Over Spectacle

Pixel art and camp metaphors are good only if they make task state easier to read.

### 8.3 Human Re-Entry Is The Core Loop

The core product action is not launching an agent. It is a human re-entering the camp and resuming useful work.

### 8.4 Bounded Autonomy

Agents may keep working. But the default automation target is summary and state capture, not self-propagating task creation.

### 8.5 Terminal Is Still Home

Users should be able to enter Campsite from a terminal workflow and still feel that the terminal is the real working surface.

## 9. Core User Experience

### 9.1 Hero Moment

The user has been away for hours. They reopen Campsite. In under five seconds they can tell:

- which agent is still actively working
- which work item is waiting for human judgment
- what the next best human action is

### 9.2 First Version Narrative

1. User launches or re-enters Campsite from terminal.
2. Local web UI opens a pixel-art camp scene.
3. Agents and terminal tasks appear as camp participants.
4. Each participant is represented through a visible fire-state.
5. The center campfire represents the current mission or working thread.
6. Returning user reads the camp, clicks into the relevant participant or campfire summary, and resumes work.

### 9.3 UX Intent

The desired user feeling is:

- I am working in a terminal-first environment
- when I need to zoom out, I can slip into Campsite
- Campsite gives me room to recover, understand, and vibe
- when I go back into execution, I do not feel like I switched products

Camp mode is the spatial breathing room around the work.
Focus mode is the sharp edge where the work gets done.
The user should feel both as one continuous experience.

## 10. Core State Model

Campsite must avoid a simplistic "done/not done" model.

Instead, work is represented by fire-state phases:

- `불씨` (`bulssi`)
  Newly started work. It exists, but it is still weak and should be watched.
- `모닥불` (`modakbul`)
  Active, focused work in progress.
- `등불` (`deungbul`)
  A meaningful segment is complete and waiting on human review or judgment.
- `연기` (`yeongi`)
  Work is blocked or needs help.
- `장작` (`jangjak`)
  The next meaningful action is prepared and ready to be picked up.

### 10.1 State Semantics

- `불씨` is not idle. It means the task just started or only has low-confidence progress.
- `모닥불` means the system believes work is actively progressing.
- `등불` means "come read this," not "the mission is over."
- `연기` means the human is needed now.
- `장작` means there is a prepared next step, but Campsite should not assume it should run automatically.

### 10.2 State Transition Rules

- New agent/task entry defaults to `불씨`.
- Confirmed active execution transitions to `모닥불`.
- Completion of a bounded segment transitions to `등불`.
- Detected blocker or explicit request for human input transitions to `연기`.
- Generated next-step recommendation transitions to `장작`.
- A human may promote `장작` back to `불씨` by explicitly starting that next action.

## 11. Functional Requirements

### 11.1 Session Entry

- FR1: User can enter Campsite from terminal via a single command.
- FR2: Entering Campsite opens or attaches to a local web scene.
- FR3: Campsite can register local agent sessions and terminal tasks as camp participants.

### 11.2 Recovery Screen

- FR4: The main camp scene must surface active participants, review-ready participants, and next actions without requiring navigation.
- FR5: The user must be able to identify the three key signals in one screen:
- who is active
- what needs review
- what to do next
- FR6: The center mission or campfire must summarize the current working thread.

### 11.3 State Capture

- FR7: When a participant changes phase, Campsite stores the new fire-state.
- FR8: On segment completion, Campsite should prompt or infer a short result summary.
- FR9: On blocker detection, Campsite must capture why the task is blocked.
- FR10: On ready-for-review transitions, Campsite must preserve enough context for the human to decide quickly.
- FR11: Campsite should support a prepared next action without automatically running it by default.

### 11.4 Bounded Automation

- FR12: Campsite may support explicit post-task policies such as "run tests after this finishes."
- FR13: Campsite must not default to open-ended self-assigned follow-up work.
- FR14: Automatic follow-on behavior must be visible and user-authored.

### 11.5 UX and Visual Layer

- FR15: The visual layer must use camp/fire metaphors to encode real state.
- FR16: Visual polish must not hide whether a task is active, blocked, review-ready, or staged.
- FR17: Pixel-art scenes must remain legible on laptop-sized screens.

### 11.6 Local-First Operation

- FR18: v1 must work without a hosted backend.
- FR19: Camp state must be stored locally.
- FR20: Campsite must preserve a useful terminal-only fallback path if the web scene fails.

## 12. Non-Functional Requirements

- NFR1: Camp state should load fast enough that the main scene appears effectively instantly on local machines.
- NFR2: The primary camp scene should be readable within 5 seconds by a returning user with no extra training.
- NFR3: The system should degrade gracefully when a participant exits unexpectedly.
- NFR4: The visual layer should feel expressive but remain lightweight enough for a local-first CLI tool.
- NFR5: The state model should be stable enough that users learn the metaphor after a few sessions.

## 12.1 Foundation Boundary

If Campsite adopts a stronger terminal foundation such as `libghostty`, that layer must remain a foundation, not a product identity.

The boundary is:

- terminal rendering and embedding may be delegated downward
- mission language, fire-state semantics, recovery UX, tranquil autonomy, and family look stay owned by Campsite

See:

- `docs/libghostty-foundation-boundary.md`
- `docs/family-look-spec.md`

## 13. UX Spec

### 13.1 Information Hierarchy

The initial scene must prioritize:

1. active work
2. human-needed work
3. next action

Everything else is secondary.

### 13.2 Main Scene Objects

- `Campfire`
  Represents the current mission or main thread.
- `Participants`
  Agents, terminals, or tasks that have entered the camp.
- `State aura`
  Fire-state visualization around each participant.
- `Return panel`
  A compact summary that restates the three key signals in plain language.

### 13.3 Interaction Model

- Clicking a participant opens its recent summary, current state, and next action.
- Clicking the campfire opens the mission summary and work thread context.
- Review-ready participants should be visually louder than idle or newly started ones.
- Blocked participants should be unmistakable without being alarming noise all the time.

## 14. Command and System Spec

The exact command names can change, but the system needs these capabilities:

- launch or attach to local camp UI
- register a participant entering the camp
- update participant state
- record a summary on phase transition
- surface current camp overview
- restore last known camp state after interruption

Representative command surface:

- `campsite camp`
- `campsite enter --participant <id> --type <agent|terminal|task>`
- `campsite update --participant <id> --state <bulssi|modakbul|deungbul|yeongi|jangjak>`
- `campsite overview`
- `campsite resume`

## 15. Success Metrics

### 15.1 Product Metrics

- Median time-to-orient after return
- Number of successful same-day return sessions
- Percentage of return sessions that proceed to action within 30 seconds
- Number of tasks reaching `등불` or `장작` with usable summaries

### 15.2 Experience Metrics

- User-reported feeling of "I know what is going on"
- User-reported reduction in restart friction
- Demo reaction quality: "I want to use this" versus "nice concept"

## 16. Risks

### 16.1 Cute But Useless

Risk:
The camp metaphor becomes decorative and stops helping actual work.

Mitigation:
Every visual element must map to a real product question or action.

### 16.2 Too Much Automation

Risk:
Agents continue doing work that burns tokens, drifts scope, or creates false confidence.

Mitigation:
Default to state capture and explicit user-authored automation policies only.

### 16.3 State Ambiguity

Risk:
Users cannot tell the difference between "done for now," "blocked," and "ready for review."

Mitigation:
Keep state count low and semantics strict.

### 16.4 Premature Team Scope

Risk:
The product expands into multiplayer before the solo loop works.

Mitigation:
Treat solo re-entry as the gating success condition for future expansion.

## 17. Rollout Plan

### Phase 1: Solo Recovery Loop

- launch local camp scene
- register participants
- display fire-states
- support camp overview and resume flow

### Phase 2: State Capture Depth

- summaries on state transitions
- review-ready details
- blocker capture
- prepared next action capture

### Phase 3: Bounded Automation

- explicit post-task policies
- safe chained actions
- visibility into policy-triggered follow-up work

### Phase 4: Team and Hackathon Extensions

- shared viewing
- camp visiting
- team handoff metaphors

## 18. Open Questions

- What is the right default mapping from raw process signals to fire-states?
- Should the campfire represent a single mission or allow multiple concurrent fires?
- How much summary text is enough before it turns into clutter?
- What is the smallest useful visual prototype that proves the recovery loop?
- What should happen when an agent disappears without a clean exit?
- How should the future team mode work when multiple people gather in the same Campsite, talk, and hand off branches or mission threads to each other?

## 19. Spec Acceptance Criteria

This PRD is successful if the first implementation can demonstrate all of the following:

- A user starts more than one local participant and sees them represented in one camp.
- A user leaves and returns later.
- On return, the user can correctly identify active work, review-ready work, and next action in under 5 seconds.
- At least one participant can transition into `등불` with a readable summary.
- At least one participant can transition into `연기` with a visible blocker reason.
- At least one participant can transition into `장작` with a prepared next action.
- The product feels more like a place than a dashboard, while still being operationally clear.

## 20. Relationship To Existing Campsite PRD

`Campsite-prd-v2.md` remains the harness and protocol contract for the existing compiler product.

This document defines the next product layer:

- how Campsite should feel
- what new user problem it should solve
- what experience and state model should guide implementation

The two documents are complementary:

- `Campsite-prd-v2.md` explains the current harness foundation
- `docs/spec-driven-prd-vibe-camp.md` explains the next recovery-first product direction
