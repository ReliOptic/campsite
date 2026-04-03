# Campsite x libghostty Boundary Spec

> Status: Draft
> Last updated: 2026-04-03
> Purpose: keep the technical foundation strong without losing the product philosophy

## 1. Why This Document Exists

`libghostty` looks like a strong terminal foundation for Campsite.

That is good.

But strong foundations can still lead to weak products if the product starts inheriting the wrong priorities from the foundation.

This document defines the boundary:

- what `libghostty` is responsible for
- what `Campsite` is responsible for
- what must never be outsourced from product philosophy into terminal infrastructure

## 2. Decision

`libghostty` is a strong candidate for the terminal foundation layer.

Why:

- mature terminal core
- strong performance reputation
- native-feeling platform direction
- embeddable library model

This makes it a good fit for:

- terminal rendering
- input handling
- terminal session embedding
- terminal-native execution surfaces inside Focus mode

It does **not** define the Campsite product by itself.

## 3. The Boundary

### 3.1 libghostty Owns

- terminal emulation
- rendering performance
- terminal input/output behavior
- low-level embedding surface
- platform-native terminal infrastructure

### 3.2 Campsite Owns

- mission framing
- recovery loop
- camp state model
- `불씨 / 모닥불 / 등불 / 연기 / 장작`
- participant lifecycle
- handoff logic
- review semantics
- tranquil autonomy
- family look between Camp mode and Focus mode
- place-adaptive atmosphere

If Ghostty gives us a strong engine, Campsite decides where the vehicle goes and what the ride feels like.

## 4. Product Philosophy Must Stay Above The Terminal Layer

Campsite is not being built to become "a good terminal."

Campsite is being built to become:

- a place for 발상
- a place for 검토
- a place for 체력

This means:

- terminal performance is necessary
- terminal performance is not the product promise

The product promise is:

- the user can think better
- the user can review better
- the user can sustain longer creative arcs without chaos

## 5. What We Must Not Accidentally Inherit

If `libghostty` becomes the foundation, Campsite must avoid drifting into these traps:

### 5.1 Terminal-First Identity Collapse

Bad outcome:

- Campsite becomes "Ghostty plus some UI"

Why this is wrong:

- the product is not an emulator brand extension
- the product is a recovery-first AI workspace

### 5.2 Performance As Product Story

Bad outcome:

- product messaging starts sounding like benchmark marketing

Why this is wrong:

- users may value speed
- but they come back for flow, recovery, and long-breath autonomy

### 5.3 Infrastructure Dictates UX

Bad outcome:

- the embed constraints of the terminal decide the product shape

Why this is wrong:

- Campsite should decide the world first
- the terminal layer should support that world, not flatten it

## 6. Foundation Principles

### 6.1 Use libghostty For Strength, Not Identity

We should borrow:

- robustness
- speed
- native behavior

We should not borrow:

- product voice
- product hierarchy
- product meaning

### 6.2 Focus Mode Is Built On The Terminal, Not Reducible To It

Focus mode may be powered by a terminal foundation.

But Focus mode still belongs to Campsite because it adds:

- mission framing
- fire-state semantics
- structured return cues
- continuity with Camp mode

### 6.3 Camp Mode Must Stay Product-Led

Camp mode cannot become an ornamental shell around a terminal engine.

It must stay the place where:

- users zoom out
- recover
- notice state
- redirect
- re-enter

## 7. Tranquil Autonomy Boundary

`libghostty` can help make continuous terminal execution reliable.

That is useful.

But Campsite must still reject the wrong style of autonomy:

- not infinite anxious looping
- not runaway background automation
- not frantic "always doing more" energy

Campsite autonomy should feel:

- steady
- composable
- inspectable
- recoverable
- life-compatible

This is a product rule, not a terminal rule.

## 8. Place-Adaptive Vibe Boundary

The world around the work may shift:

- aurora north
- granite forest
- canyon daylight
- travel-inspired place mood

That vibe system belongs to Campsite.

`libghostty` may host or render Focus mode surfaces inside that world, but it does not define the world's emotional character.

## 9. Implementation Guidance

If we adopt `libghostty`, structure the system like this:

### Layer 1: Terminal Foundation

- terminal core
- rendering
- process/session attachment

### Layer 2: Campsite State Layer

- mission
- participant
- fire-state
- handoff and return summaries

### Layer 3: Campsite Experience Layer

- Camp mode scene
- Focus mode operational shell
- family look
- voice and copy
- environment themes

This order matters.

If Layer 1 starts leaking upward, the product gets flattened.

## 10. Decision Test

Any future decision involving `libghostty` should pass this test:

1. Does this make the foundation more reliable or more native?
2. Does it preserve Campsite's product language and state semantics?
3. Does it strengthen the recovery loop?
4. Does it keep tranquil autonomy intact?
5. Does it keep Camp mode and Focus mode feeling like one world?

If the answer to 1 is yes but 2 through 5 get weaker, the change is wrong.

## 11. Final Position

`libghostty` can be the engine.

It must not become the product.

Campsite stays responsible for:

- the mission
- the mood
- the recovery loop
- the review culture
- the long-breath creative flow

That boundary is what keeps the foundation strong and the philosophy intact.
