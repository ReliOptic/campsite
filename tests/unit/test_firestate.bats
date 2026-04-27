#!/usr/bin/env bats

load '../test_helper'

setup() {
    setup_temp_dir
    load_campsite_libs
    source "$CAMPSITE_LIB/collector.sh"
    source "$CAMPSITE_LIB/agent.sh"
    source "$CAMPSITE_LIB/firestate.sh"
    create_test_project
    collector_ensure_store "$TEST_PROJECT"
}

teardown() {
    teardown_temp_dir
}

# ---------------------------------------------------------------------------
# firestate_color
# ---------------------------------------------------------------------------

@test "firestate_color returns orange for bulssi" {
    result="$(firestate_color "bulssi")"
    [[ "$result" == "#ff6600" ]]
}

@test "firestate_color returns amber for modakbul" {
    result="$(firestate_color "modakbul")"
    [[ "$result" == "#ffaa00" ]]
}

@test "firestate_color returns warm-yellow for deungbul" {
    result="$(firestate_color "deungbul")"
    [[ "$result" == "#ffdd88" ]]
}

@test "firestate_color returns grey for yeongi" {
    result="$(firestate_color "yeongi")"
    [[ "$result" == "#888888" ]]
}

@test "firestate_color returns brown for jangjak" {
    result="$(firestate_color "jangjak")"
    [[ "$result" == "#cc8844" ]]
}

@test "firestate_color returns fallback color for unknown state" {
    result="$(firestate_color "unknown_state")"
    [[ "$result" == "#cc8844" ]]
}

# ---------------------------------------------------------------------------
# firestate_label_ko
# ---------------------------------------------------------------------------

@test "firestate_label_ko returns Korean label for bulssi" {
    result="$(firestate_label_ko "bulssi")"
    [[ "$result" == *"불씨"* ]]
}

@test "firestate_label_ko returns Korean label for modakbul" {
    result="$(firestate_label_ko "modakbul")"
    [[ "$result" == *"모닥불"* ]]
}

@test "firestate_label_ko returns Korean label for deungbul" {
    result="$(firestate_label_ko "deungbul")"
    [[ "$result" == *"등불"* ]]
}

@test "firestate_label_ko returns Korean label for yeongi" {
    result="$(firestate_label_ko "yeongi")"
    [[ "$result" == *"연기"* ]]
}

@test "firestate_label_ko returns Korean label for jangjak" {
    result="$(firestate_label_ko "jangjak")"
    [[ "$result" == *"장작"* ]]
}

@test "firestate_label_ko returns fallback for unknown state" {
    result="$(firestate_label_ko "???")"
    [[ "$result" == "알 수 없음" ]]
}

# ---------------------------------------------------------------------------
# firestate_label_en
# ---------------------------------------------------------------------------

@test "firestate_label_en returns English label for bulssi" {
    result="$(firestate_label_en "bulssi")"
    [[ "$result" == "Spark — getting started" ]]
}

@test "firestate_label_en returns English label for modakbul" {
    result="$(firestate_label_en "modakbul")"
    [[ "$result" == "Bonfire — actively working" ]]
}

@test "firestate_label_en returns fallback for unknown" {
    result="$(firestate_label_en "nope")"
    [[ "$result" == "Unknown" ]]
}

# ---------------------------------------------------------------------------
# firestate_derive — state transition paths
# ---------------------------------------------------------------------------

# Helper: stub collector/agent functions to control inputs to firestate_derive.
# Functions are exported so that subshells created by $(...) can see them.
_stub_signals() {
    local active_agents="${1:-0}"
    local recent_commits="${2:-0}"
    local last_exit="${3:-}"
    local absence_sec="${4:-0}"

    local now
    now="$(date +%s)"
    local fake_ts=$(( now - absence_sec ))

    # Export values as env vars so stubs can read them inside subshells
    export _STUB_ACTIVE_AGENTS="$active_agents"
    export _STUB_RECENT_COMMITS="$recent_commits"
    export _STUB_LAST_EXIT="$last_exit"
    export _STUB_FAKE_TS="$fake_ts"

    agent_active_count()            { printf '%s' "$_STUB_ACTIVE_AGENTS"; }
    collector_recent_commits_count(){ printf '%s' "$_STUB_RECENT_COMMITS"; }
    agent_last_exit_code()          { printf '%s' "$_STUB_LAST_EXIT"; }
    collector_last_activity_ts()    { printf '%s' "$_STUB_FAKE_TS"; }

    export -f agent_active_count
    export -f collector_recent_commits_count
    export -f agent_last_exit_code
    export -f collector_last_activity_ts
}

@test "firestate_derive: agent active + recent commits → modakbul" {
    _stub_signals 1 3 "" 60
    result="$(firestate_derive "$TEST_PROJECT")"
    [[ "$result" == "modakbul" ]]
}

@test "firestate_derive: agent active + no commits → bulssi" {
    _stub_signals 1 0 "" 60
    result="$(firestate_derive "$TEST_PROJECT")"
    [[ "$result" == "bulssi" ]]
}

@test "firestate_derive: recent error exit within 30min → yeongi" {
    _stub_signals 0 0 "1" 600
    result="$(firestate_derive "$TEST_PROJECT")"
    [[ "$result" == "yeongi" ]]
}

@test "firestate_derive: no agent + recent commits within 30min → deungbul" {
    _stub_signals 0 2 "" 300
    result="$(firestate_derive "$TEST_PROJECT")"
    [[ "$result" == "deungbul" ]]
}

@test "firestate_derive: 4h+ absence → jangjak" {
    _stub_signals 0 0 "" 18000
    result="$(firestate_derive "$TEST_PROJECT")"
    [[ "$result" == "jangjak" ]]
}

@test "firestate_derive: default (no agent, no commits, within 4h) → deungbul" {
    _stub_signals 0 0 "" 3600
    result="$(firestate_derive "$TEST_PROJECT")"
    [[ "$result" == "deungbul" ]]
}

@test "firestate_derive: error exit code 0 does not trigger yeongi" {
    _stub_signals 0 0 "0" 600
    result="$(firestate_derive "$TEST_PROJECT")"
    [[ "$result" != "yeongi" ]]
}

@test "firestate_derive: error exit older than 30min does not trigger yeongi" {
    _stub_signals 0 0 "1" 2000
    result="$(firestate_derive "$TEST_PROJECT")"
    [[ "$result" != "yeongi" ]]
}
