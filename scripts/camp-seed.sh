#!/usr/bin/env bash
set -euo pipefail

# Seed a camp with realistic participants for dev/QA testing.
# Usage: bash scripts/camp-seed.sh [project-path]

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$ROOT/lib/compat.sh"
source "$ROOT/lib/common.sh"
source "$ROOT/lib/detect.sh"
source "$ROOT/lib/lock.sh"
source "$ROOT/lib/hash.sh"
source "$ROOT/lib/security.sh"
source "$ROOT/lib/compile.sh"
source "$ROOT/lib/history.sh"
source "$ROOT/lib/ui.sh"
source "$ROOT/lib/camp.sh"
[[ -f "$ROOT/config/defaults.sh" ]] && source "$ROOT/config/defaults.sh"

PROJECT="${1:-$(detect_project 2>/dev/null || pwd)}"
camp_ensure_store "$PROJECT"

# Mission
camp_set_mission "$PROJECT" \
    "Ship auth checkpoint and verify edge cases" \
    "Auth migration is in progress. Two agents are working, one is blocked on a test failure, one has finished and is waiting for review." \
    "modakbul" \
    "Review Claude Worker's auth flow, then unblock Codex on the failing test"

# Participant 1: active agent
camp_participant_upsert "$PROJECT" "session-claude-8821" \
    "Claude Worker" "agent" "claude" "ghostty" \
    "modakbul" \
    "Implementing OAuth2 token refresh flow. Halfway through — refresh endpoint works, revocation endpoint next." \
    "" \
    "Finish revocation endpoint, then update handoff" \
    "25"

# Participant 2: waiting for review
camp_participant_upsert "$PROJECT" "session-codex-4410" \
    "Codex Reviewer" "agent" "codex" "iterm2" \
    "deungbul" \
    "Session migration script is ready. All 14 unit tests pass. Needs human review before merging." \
    "" \
    "Review the migration diff and approve or request changes" \
    "30"

# Participant 3: blocked
camp_participant_upsert "$PROJECT" "session-gemini-7703" \
    "Gemini Tester" "agent" "gemini" "vscode" \
    "yeongi" \
    "Rate limiter integration test fails on CI. Passes locally. Suspect timezone-dependent assertion." \
    "CI test failure: test_rate_limiter_window asserts UTC midnight but CI runs in PST" \
    "Fix timezone assumption in test assertion" \
    "20"

# Participant 4: prepared next action
camp_participant_upsert "$PROJECT" "terminal-prep" \
    "Terminal Prep" "terminal" "ghostty" "ghostty" \
    "jangjak" \
    "Next auth checkpoint is staged. Resume from ghostty to push." \
    "" \
    "Run campsite save --push to checkpoint auth progress" \
    "40"

# Events
camp_event_append "$PROJECT" "session-claude-8821" "" "modakbul" "claude started in ghostty."
camp_event_append "$PROJECT" "session-codex-4410" "" "modakbul" "codex started in iterm2."
camp_event_append "$PROJECT" "session-codex-4410" "modakbul" "deungbul" "codex finished with changes: next task updated."
camp_event_append "$PROJECT" "session-gemini-7703" "" "modakbul" "gemini started in vscode."
camp_event_append "$PROJECT" "session-gemini-7703" "modakbul" "yeongi" "gemini session ended abnormally. Review before trusting the result."
camp_event_append "$PROJECT" "terminal-prep" "" "jangjak" "Terminal checkpoint staged."

info "camp seeded with 4 participants and 6 events"
printf "  modakbul: Claude Worker (active)\n"
printf "  deungbul: Codex Reviewer (review-ready)\n"
printf "  yeongi:   Gemini Tester (blocked)\n"
printf "  jangjak:  Terminal Prep (next action ready)\n"
