#!/usr/bin/env bash
# Campsite agent lifecycle manager — launch, monitor, and track AI agents
[[ -n "${_CAMPSITE_AGENT_LOADED:-}" ]] && return 0
_CAMPSITE_AGENT_LOADED=1

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

_agent_sessions_dir() {
    local project_root="$1"
    local dir
    dir="$(project_campsite_dir "$project_root")/sessions"
    mkdir -p "$dir"
    printf '%s' "$dir"
}

_agent_session_dir() {
    local project_root="$1" session_id="$2"
    local dir
    dir="$(_agent_sessions_dir "$project_root")/$session_id"
    mkdir -p "$dir"
    printf '%s' "$dir"
}

# ---------------------------------------------------------------------------
# agent_launch — execute agent with monitoring
#
# Usage: agent_launch <project_root> <agent_name> <agent_cmd...>
#
# Replaces the raw `exec` or direct invocation. Wraps the agent process with:
#   - PID tracking
#   - Output capture (via `script` on macOS, tee fallback elsewhere)
#   - Background polling for git snapshots
#   - Automatic event recording on start/finish
#
# Returns the agent's exit code.
# ---------------------------------------------------------------------------

agent_launch() {
    local project_root="$1" agent_name="$2"
    shift 2
    local agent_cmd="$*"

    local session_id="${agent_name}-$(date +%s)"
    local session_dir
    session_dir="$(_agent_session_dir "$project_root" "$session_id")"

    # Record metadata
    printf '%s' "$agent_name" > "$session_dir/agent.name"
    printf 'running' > "$session_dir/status"
    date +%s > "$session_dir/started_at"

    # Record event
    collector_record_event "$project_root" "agent_start" "$agent_name started (session $session_id)" "$agent_name" 2>/dev/null || true

    # Start background poller
    agent_poll "$project_root" "$session_dir" &
    local poller_pid=$!
    printf '%s' "$poller_pid" > "$session_dir/poller.pid"

    # Run the agent (foreground, preserving tty)
    # We capture output to a log file while still passing through to the terminal
    local exit_code=0

    if [[ "$(detect_platform 2>/dev/null)" == "mac" ]] && command -v script >/dev/null 2>&1; then
        # macOS `script` syntax: script -q <logfile> <command>
        script -q "$session_dir/output.log" $agent_cmd || exit_code=$?
    else
        # Linux / fallback: use tee
        $agent_cmd 2>&1 | tee "$session_dir/output.log" || exit_code=${PIPESTATUS[0]:-$?}
    fi

    # Record PID (of this wrapper, for reference)
    printf '%s' "$$" > "$session_dir/agent.pid"

    # Finish
    printf '%s' "$exit_code" > "$session_dir/exit_code"
    date +%s > "$session_dir/finished_at"

    if [[ "$exit_code" -eq 0 ]]; then
        printf 'finished' > "$session_dir/status"
        collector_record_event "$project_root" "agent_end" "$agent_name finished successfully" "$agent_name" 2>/dev/null || true
    else
        printf 'crashed' > "$session_dir/status"
        collector_record_event "$project_root" "agent_error" "$agent_name exited with code $exit_code" "$agent_name" 2>/dev/null || true
    fi

    # Stop poller
    kill "$poller_pid" 2>/dev/null || true
    wait "$poller_pid" 2>/dev/null || true
    rm -f "$session_dir/poller.pid" 2>/dev/null || true

    return $exit_code
}

# ---------------------------------------------------------------------------
# agent_poll — background poller that periodically snapshots git state
# ---------------------------------------------------------------------------

agent_poll() {
    local project_root="$1" session_dir="$2"

    while [[ -f "$session_dir/status" ]] && [[ "$(cat "$session_dir/status" 2>/dev/null)" == "running" ]]; do
        collector_git_snapshot "$project_root" 2>/dev/null || true
        touch "$(_collector_last_activity_path "$project_root")" 2>/dev/null || true
        sleep 10
    done
}

# ---------------------------------------------------------------------------
# agent_list_active — list currently running agent sessions
#
# Output: one line per active session: session_id<TAB>agent_name<TAB>pid<TAB>started_at
# ---------------------------------------------------------------------------

agent_list_active() {
    local project_root="$1"
    local sessions_dir
    sessions_dir="$(_agent_sessions_dir "$project_root")"

    [[ -d "$sessions_dir" ]] || return 0

    local session_dir
    for session_dir in "$sessions_dir"/*/; do
        [[ -d "$session_dir" ]] || continue
        local status_file="$session_dir/status"
        [[ -f "$status_file" ]] || continue

        local status
        status="$(cat "$status_file" 2>/dev/null)"

        if [[ "$status" == "running" ]]; then
            # Verify the process is actually alive
            local pid_file="$session_dir/agent.pid"
            if [[ -f "$pid_file" ]]; then
                local pid
                pid="$(cat "$pid_file" 2>/dev/null)"
                if [[ -n "$pid" ]] && ! kill -0 "$pid" 2>/dev/null; then
                    # Process died without cleanup — mark as crashed
                    printf 'crashed' > "$status_file"
                    date +%s > "$session_dir/finished_at"
                    printf '1' > "$session_dir/exit_code"
                    collector_record_event "$project_root" "agent_error" "$(cat "$session_dir/agent.name" 2>/dev/null) crashed (zombie detected)" "system" 2>/dev/null || true
                    continue
                fi
            fi

            local session_id agent_name started_at
            session_id="$(basename "$session_dir")"
            agent_name="$(cat "$session_dir/agent.name" 2>/dev/null || echo "unknown")"
            started_at="$(cat "$session_dir/started_at" 2>/dev/null || echo "0")"

            printf '%s\t%s\t%s\n' "$session_id" "$agent_name" "$started_at"
        fi
    done
}

# ---------------------------------------------------------------------------
# agent_active_count — number of currently running agents
# ---------------------------------------------------------------------------

agent_active_count() {
    local project_root="$1"
    local count
    count="$(agent_list_active "$project_root" 2>/dev/null | wc -l | tr -d ' ')"
    printf '%s' "${count:-0}"
}

# ---------------------------------------------------------------------------
# agent_last_exit_code — exit code of the most recently finished session
# ---------------------------------------------------------------------------

agent_last_exit_code() {
    local project_root="$1"
    local sessions_dir
    sessions_dir="$(_agent_sessions_dir "$project_root")"

    [[ -d "$sessions_dir" ]] || { printf ''; return; }

    # Find the most recently finished session by finished_at
    local latest_code="" latest_ts=0
    local session_dir
    for session_dir in "$sessions_dir"/*/; do
        [[ -d "$session_dir" ]] || continue
        local finished_file="$session_dir/finished_at"
        [[ -f "$finished_file" ]] || continue

        local ts
        ts="$(cat "$finished_file" 2>/dev/null || echo 0)"
        if [[ "$ts" -gt "$latest_ts" ]] 2>/dev/null; then
            latest_ts="$ts"
            latest_code="$(cat "$session_dir/exit_code" 2>/dev/null || echo "")"
        fi
    done

    printf '%s' "$latest_code"
}

# ---------------------------------------------------------------------------
# agent_get_summary — short summary of a session
# ---------------------------------------------------------------------------

agent_get_summary() {
    local project_root="$1" session_id="$2"
    local session_dir
    session_dir="$(_agent_sessions_dir "$project_root")/$session_id"

    [[ -d "$session_dir" ]] || { printf 'Session not found'; return 1; }

    local agent_name status started_at finished_at exit_code
    agent_name="$(cat "$session_dir/agent.name" 2>/dev/null || echo "unknown")"
    status="$(cat "$session_dir/status" 2>/dev/null || echo "unknown")"
    started_at="$(cat "$session_dir/started_at" 2>/dev/null || echo "?")"
    finished_at="$(cat "$session_dir/finished_at" 2>/dev/null || echo "")"
    exit_code="$(cat "$session_dir/exit_code" 2>/dev/null || echo "")"

    printf '%s (%s)' "$agent_name" "$status"
    if [[ -n "$finished_at" && -n "$started_at" && "$started_at" != "?" ]]; then
        local duration=$(( finished_at - started_at ))
        printf ' — %ds' "$duration"
    fi
    if [[ -n "$exit_code" ]]; then
        printf ' exit=%s' "$exit_code"
    fi
    printf '\n'

    # Last 5 lines of output
    if [[ -f "$session_dir/output.log" ]]; then
        printf '--- last output ---\n'
        tail -5 "$session_dir/output.log" 2>/dev/null
    fi
}

# ---------------------------------------------------------------------------
# agent_cleanup_old — remove session dirs older than N days (default 7)
# ---------------------------------------------------------------------------

agent_cleanup_old() {
    local project_root="$1" max_age_days="${2:-7}"
    local sessions_dir
    sessions_dir="$(_agent_sessions_dir "$project_root")"

    [[ -d "$sessions_dir" ]] || return 0

    find "$sessions_dir" -maxdepth 1 -type d -mtime +"$max_age_days" -exec rm -rf {} + 2>/dev/null || true
}
