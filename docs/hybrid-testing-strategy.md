# Campsite Hybrid Testing Strategy

> Status: Active
> Last updated: 2026-04-03
> Goal: test Campsite for both mechanical reliability and product truth

## 1. Why Hybrid

`Campsite` cannot be tested well with only one loop.

If we only run mechanical loops, we miss the actual product:

- does return-to-work feel clear
- does Camp mode and Focus mode feel like one world
- does the product stay calm instead of frantic

If we only do human review, we miss repeatable reliability:

- do session transitions work
- do lock and recovery flows hold up
- does `save --push` behave safely

So the correct testing model is hybrid:

- **Ralph-style loop** for reliability
- **Campsite review loop** for product truth

## 2. Two Test Lanes

### 2.1 Lane A: Mechanical Loop Testing

Use this for:

- command correctness
- file contract correctness
- session lifecycle correctness
- git checkpoint correctness
- recovery edge cases

Typical loop:

1. create temp project
2. run `sync`
3. mutate project state
4. run session/camp transitions
5. run `save`, `peek`, `recover`, or `save --push`
6. assert resulting files and output

This is where Ralph-style loops shine.

### 2.2 Lane B: Product Review Testing

Use this for:

- clarity
- vibe
- recovery quality
- emotional coherence

Core question:

Does Campsite help a human return and understand the work fast?

## 3. What Ralph Loops Are Good For

Ralph loops are useful in Campsite when the question is:

- did the command work
- did the state file update correctly
- did the transition happen
- did git behave safely

Rule:

`Use Ralph loops for reliability, not for meaning.`

## 4. What Requires Human Review

These must always go through human judgment:

- return-to-work clarity
- Camp mode vs Focus mode consistency
- whether output feels calm or noisy
- whether seeded camp state is helping or lying
- whether the visual scene feels like a place instead of a dashboard
- whether product copy sounds like Campsite

## 5. Test Pyramid For Campsite

### Layer 1: Unit Tests

- pure shell helpers
- parsing
- freshness
- state mapping

### Layer 2: Integration Tests

- command flows
- temp git repos
- camp state lifecycle

### Layer 3: Hybrid Smoke

- one quick high-value end-to-end shell harness
- checks status, sync, camp overview, render, and save --push

### Layer 4: Review Gate

- manual review of clarity, family look, and tranquil autonomy

## 6. Review Checklist

### 6.1 Recovery

- Can I tell what is happening quickly?
- Can I tell what needs me now?
- Can I tell the next move without scanning everything?

### 6.2 Truthfulness

- Does the camp state reflect reality?
- Are placeholders overstating what is happening?
- Is any output creating false confidence?

### 6.3 Family Look

- Does Focus mode feel like the same world as Camp mode?
- Are fire-state names consistent?
- Is the tone calm, direct, and non-corporate?

### 6.4 Tranquil Autonomy

- Does the product feel alive without feeling frantic?
- Does automation support recovery instead of creating chaos?

## 7. Operational Workflow

Recommended development loop:

1. implement one vertical slice
2. run unit and integration tests if available
3. run `scripts/hybrid-smoke.sh`
4. manually inspect terminal output
5. manually inspect camp render
6. record findings in `status.md`, `handoff.md`, or `implementation-tracker.md`

## 8. Handoff Rule

When handing off work, leave:

- what mechanical tests were added
- what was actually run
- what was only reviewed manually
- what still needs human judgment

## 9. Current Execution Rule

For the current Campsite codebase:

- use automated loops for shell and git correctness
- use manual review for camp clarity and vibe
- do not confuse passing loops with finished product quality
