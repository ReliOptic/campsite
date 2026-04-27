#!/usr/bin/env bats

load '../test_helper'

setup() {
    setup_temp_dir
    load_campsite_libs
    source "$CAMPSITE_LIB/collector.sh"
    source "$CAMPSITE_LIB/agent.sh"
    create_test_project
    collector_ensure_store "$TEST_PROJECT"
}

teardown() {
    teardown_temp_dir
}

# ---------------------------------------------------------------------------
# _agent_sessions_dir
# ---------------------------------------------------------------------------

@test "_agent_sessions_dir creates and returns sessions directory" {
    result="$(_agent_sessions_dir "$TEST_PROJECT")"
    [[ -d "$result" ]]
    [[ "$result" == "$TEST_PROJECT/.campsite/sessions" ]]
}

# ---------------------------------------------------------------------------
# _agent_session_dir
# ---------------------------------------------------------------------------

@test "_agent_session_dir creates session subdirectory" {
    result="$(_agent_session_dir "$TEST_PROJECT" "test-session-001")"
    [[ -d "$result" ]]
    [[ "$result" == "$TEST_PROJECT/.campsite/sessions/test-session-001" ]]
}

# ---------------------------------------------------------------------------
# agent_list_active — fixture-based tests (no real processes)
# ---------------------------------------------------------------------------

@test "agent_list_active returns empty when no sessions directory" {
    result="$(agent_list_active "$TEST_PROJECT")"
    [[ -z "$result" ]]
}

@test "agent_list_active returns empty when no running sessions" {
    # Create a finished session
    local session_dir="$TEST_PROJECT/.campsite/sessions/claude-99999"
    mkdir -p "$session_dir"
    printf 'claude' > "$session_dir/agent.name"
    printf 'finished' > "$session_dir/status"
    date +%s > "$session_dir/started_at"
    date +%s > "$session_dir/finished_at"
    printf '0' > "$session_dir/exit_code"

    result="$(agent_list_active "$TEST_PROJECT")"
    [[ -z "$result" ]]
}

@test "agent_list_active lists a running session with live PID" {
    # Use the current shell PID — it is alive
    local live_pid="$$"
    local session_dir="$TEST_PROJECT/.campsite/sessions/claude-${live_pid}"
    mkdir -p "$session_dir"
    printf 'claude' > "$session_dir/agent.name"
    printf 'running' > "$session_dir/status"
    date +%s > "$session_dir/started_at"
    printf '%s' "$live_pid" > "$session_dir/agent.pid"

    result="$(agent_list_active "$TEST_PROJECT")"
    [[ -n "$result" ]]
    [[ "$result" == *"claude"* ]]
}

@test "agent_list_active marks zombie session as crashed" {
    # Use a PID that cannot possibly be alive
    local dead_pid=999999999
    local session_dir="$TEST_PROJECT/.campsite/sessions/claude-${dead_pid}"
    mkdir -p "$session_dir"
    printf 'claude' > "$session_dir/agent.name"
    printf 'running' > "$session_dir/status"
    date +%s > "$session_dir/started_at"
    printf '%s' "$dead_pid" > "$session_dir/agent.pid"

    agent_list_active "$TEST_PROJECT" >/dev/null

    local status_after
    status_after="$(cat "$session_dir/status")"
    [[ "$status_after" == "crashed" ]]
}

# ---------------------------------------------------------------------------
# agent_active_count
# ---------------------------------------------------------------------------

@test "agent_active_count returns 0 when no sessions" {
    result="$(agent_active_count "$TEST_PROJECT")"
    [[ "$result" == "0" ]]
}

@test "agent_active_count returns 0 when only finished sessions exist" {
    local session_dir="$TEST_PROJECT/.campsite/sessions/bot-1"
    mkdir -p "$session_dir"
    printf 'bot' > "$session_dir/agent.name"
    printf 'finished' > "$session_dir/status"
    date +%s > "$session_dir/started_at"
    printf '0' > "$session_dir/exit_code"

    result="$(agent_active_count "$TEST_PROJECT")"
    [[ "$result" == "0" ]]
}

@test "agent_active_count returns 1 for one live running session" {
    local live_pid="$$"
    local session_dir="$TEST_PROJECT/.campsite/sessions/claude-live"
    mkdir -p "$session_dir"
    printf 'claude' > "$session_dir/agent.name"
    printf 'running' > "$session_dir/status"
    date +%s > "$session_dir/started_at"
    printf '%s' "$live_pid" > "$session_dir/agent.pid"

    result="$(agent_active_count "$TEST_PROJECT")"
    [[ "$result" == "1" ]]
}

# ---------------------------------------------------------------------------
# agent_last_exit_code
# ---------------------------------------------------------------------------

@test "agent_last_exit_code returns empty when no sessions directory" {
    result="$(agent_last_exit_code "$TEST_PROJECT")"
    [[ -z "$result" ]]
}

@test "agent_last_exit_code returns empty when no finished sessions" {
    local session_dir="$TEST_PROJECT/.campsite/sessions/active-1"
    mkdir -p "$session_dir"
    printf 'running' > "$session_dir/status"

    result="$(agent_last_exit_code "$TEST_PROJECT")"
    [[ -z "$result" ]]
}

@test "agent_last_exit_code returns exit code of finished session" {
    local session_dir="$TEST_PROJECT/.campsite/sessions/done-1"
    mkdir -p "$session_dir"
    printf 'claude' > "$session_dir/agent.name"
    printf 'finished' > "$session_dir/status"
    date +%s > "$session_dir/finished_at"
    printf '0' > "$session_dir/exit_code"

    result="$(agent_last_exit_code "$TEST_PROJECT")"
    [[ "$result" == "0" ]]
}

@test "agent_last_exit_code returns nonzero exit code for crashed session" {
    local session_dir="$TEST_PROJECT/.campsite/sessions/crash-1"
    mkdir -p "$session_dir"
    printf 'claude' > "$session_dir/agent.name"
    printf 'crashed' > "$session_dir/status"
    date +%s > "$session_dir/finished_at"
    printf '1' > "$session_dir/exit_code"

    result="$(agent_last_exit_code "$TEST_PROJECT")"
    [[ "$result" == "1" ]]
}

@test "agent_last_exit_code returns exit code of the most recently finished session" {
    # Older session — exit 1
    local ts_old=$(( $(date +%s) - 60 ))
    local session_old="$TEST_PROJECT/.campsite/sessions/old-session"
    mkdir -p "$session_old"
    printf '1' > "$session_old/exit_code"
    printf '%s' "$ts_old" > "$session_old/finished_at"

    # Newer session — exit 0
    local ts_new="$(date +%s)"
    local session_new="$TEST_PROJECT/.campsite/sessions/new-session"
    mkdir -p "$session_new"
    printf '0' > "$session_new/exit_code"
    printf '%s' "$ts_new" > "$session_new/finished_at"

    result="$(agent_last_exit_code "$TEST_PROJECT")"
    [[ "$result" == "0" ]]
}

# ---------------------------------------------------------------------------
# agent_get_summary
# ---------------------------------------------------------------------------

@test "agent_get_summary returns error for nonexistent session" {
    run agent_get_summary "$TEST_PROJECT" "no-such-session"
    [[ "$status" -ne 0 ]]
}

@test "agent_get_summary includes agent name and status" {
    local session_dir="$TEST_PROJECT/.campsite/sessions/sum-1"
    mkdir -p "$session_dir"
    printf 'claude' > "$session_dir/agent.name"
    printf 'finished' > "$session_dir/status"
    local ts
    ts="$(date +%s)"
    printf '%s' "$ts" > "$session_dir/started_at"
    printf '%s' "$(( ts + 30 ))" > "$session_dir/finished_at"
    printf '0' > "$session_dir/exit_code"

    result="$(agent_get_summary "$TEST_PROJECT" "sum-1")"
    [[ "$result" == *"claude"* ]]
    [[ "$result" == *"finished"* ]]
}

@test "agent_get_summary includes duration when both timestamps present" {
    local session_dir="$TEST_PROJECT/.campsite/sessions/dur-1"
    mkdir -p "$session_dir"
    printf 'bot' > "$session_dir/agent.name"
    printf 'finished' > "$session_dir/status"
    local ts
    ts="$(date +%s)"
    printf '%s' "$ts" > "$session_dir/started_at"
    printf '%s' "$(( ts + 120 ))" > "$session_dir/finished_at"
    printf '0' > "$session_dir/exit_code"

    result="$(agent_get_summary "$TEST_PROJECT" "dur-1")"
    [[ "$result" == *"120s"* ]]
}

@test "agent_get_summary includes exit code" {
    local session_dir="$TEST_PROJECT/.campsite/sessions/exit-1"
    mkdir -p "$session_dir"
    printf 'bot' > "$session_dir/agent.name"
    printf 'crashed' > "$session_dir/status"
    local ts
    ts="$(date +%s)"
    printf '%s' "$ts" > "$session_dir/started_at"
    printf '%s' "$(( ts + 5 ))" > "$session_dir/finished_at"
    printf '2' > "$session_dir/exit_code"

    result="$(agent_get_summary "$TEST_PROJECT" "exit-1")"
    [[ "$result" == *"exit=2"* ]]
}

# ---------------------------------------------------------------------------
# agent_cleanup_old
# ---------------------------------------------------------------------------

@test "agent_cleanup_old returns 0 when no sessions directory" {
    run agent_cleanup_old "$TEST_PROJECT" 7
    [[ "$status" -eq 0 ]]
}

@test "agent_cleanup_old leaves recent sessions intact" {
    local session_dir="$TEST_PROJECT/.campsite/sessions/recent-1"
    mkdir -p "$session_dir"
    printf 'bot' > "$session_dir/agent.name"

    agent_cleanup_old "$TEST_PROJECT" 7
    [[ -d "$session_dir" ]]
}
