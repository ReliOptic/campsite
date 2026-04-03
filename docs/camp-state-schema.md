# Campsite Camp State Schema

> Status: Draft
> Last updated: 2026-04-03
> Source of truth for local camp persistence

## Purpose

This document defines the local file contract for the recovery-first camp state.

The goal is to keep the storage format:

- shell-friendly
- local-first
- human-readable
- easy to render into the camp UI

## Storage Location

All camp state lives under:

`<project>/.campsite/camp/`

## Files

### 1. `mission.meta`

Plain key-value file describing the active campfire mission.

Fields:

- `id`
- `title`
- `summary`
- `state`
- `phase`
- `next-action`
- `project`
- `updated-at`

Example:

```text
id: main
title: Ship auth checkpoint
summary: Return fast and decide the next auth action.
state: bulssi
phase: building
next-action: Review worker-a
project: campsite
updated-at: 2026-04-03T00:00:00Z
```

### 2. `participants.tsv`

Tab-separated table for camp participants.

Header:

```text
id	name	type	tool	terminal	fire_state	summary	blocker	next_action	last_updated	priority
```

Field meanings:

- `id`: stable participant id
- `name`: user-facing display name
- `type`: `agent`, `terminal`, or `task`
- `tool`: source tool or terminal
- `terminal`: terminal or execution surface when known
- `fire_state`: `bulssi`, `modakbul`, `deungbul`, `yeongi`, `jangjak`
- `summary`: latest useful plain-language summary
- `blocker`: blocker reason when relevant
- `next_action`: prepared next human action
- `last_updated`: ISO-8601 UTC timestamp
- `priority`: optional integer hint for ordering

### 3. `events.tsv`

Tab-separated append-only event log.

Header:

```text
created_at	participant_id	from_state	to_state	summary
```

Field meanings:

- `created_at`: ISO-8601 UTC timestamp
- `participant_id`: id of the participant that changed
- `from_state`: previous fire-state
- `to_state`: new fire-state
- `summary`: single-line human-readable transition summary

### 4. `sessions/<participant-id>.meta`

Temporary key-value snapshot captured at session start.

Purpose:

- remember the starting `status.md` and `handoff.md` signals
- generate a better exit summary on session finish

Typical fields:

- `started-at`
- `tool`
- `terminal`
- `phase`
- `confidence`
- `task`
- `last-agent`
- `last-device`

## Fire-State Contract

Allowed `fire_state` values:

- `bulssi`
- `modakbul`
- `deungbul`
- `yeongi`
- `jangjak`

Meaning:

- `bulssi`: newly started, still weak
- `modakbul`: active focused execution
- `deungbul`: segment complete, waiting on human judgment
- `yeongi`: blocked, needs help
- `jangjak`: next action prepared

## CLI Commands Backed By This Schema

- `campsite camp mission set ...`
- `campsite camp participant enter ...`
- `campsite camp participant update ...`
- `campsite camp overview`
- `campsite camp render`

## Design Rules

- Text fields must stay single-line and shell-safe.
- Tabs and newlines are normalized out before persistence.
- UI is a consumer of these files, not the source of truth.
- `events.tsv` is append-only.
- `participants.tsv` holds current state only.
- `sessions/*.meta` is temporary session scaffolding and may be deleted once a session is finalized.
