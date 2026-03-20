#!/usr/bin/env bash
# Campsite project locking with PID-based orphan detection
[[ -n "${_CAMPSITE_LOCK_LOADED:-}" ]] && return 0
_CAMPSITE_LOCK_LOADED=1

lock_path() {
    printf '%s' "$(project_campsite_dir "$1")/lock"
}

lock_acquire() {
    local project_root="$1"
    local actor="${2:-${USER:-unknown}}"
    local tool="${3:-manual}"
    local lock_file
    lock_file="$(lock_path "$project_root")"

    # Check existing lock
    if [[ -f "$lock_file" ]]; then
        if lock_check_orphan "$project_root"; then
            warn "clearing orphaned lock (stale PID)"
            rm -f "$lock_file"
        else
            local held_by held_tool held_host
            held_by="$(field_value_plain "$lock_file" "actor")"
            held_tool="$(field_value_plain "$lock_file" "tool")"
            held_host="$(field_value_plain "$lock_file" "host")"
            fail "project locked by $held_by ($held_tool on $held_host). Use 'campsite recover' to clear stale locks."
        fi
    fi

    {
        printf 'actor: %s\n' "$actor"
        printf 'tool: %s\n' "$tool"
        printf 'pid: %s\n' "$$"
        printf 'host: %s\n' "$(detect_device)"
        printf 'started-at: %s\n' "$(now_iso)"
        # Current task from handoff.md (for campsite peek)
        local task
        task="$(field_value "$project_root/handoff.md" "task" 2>/dev/null || true)"
        [[ -n "$task" ]] && printf 'task: %s\n' "$task"
        # Terminal identifier (for multi-terminal disambiguation)
        local _tty
        _tty="$(tty 2>/dev/null)" || _tty="unknown"
        [[ "$_tty" == "not a tty" ]] && _tty="non-interactive"
        printf 'terminal: %s\n' "$_tty"
    } > "$lock_file"
}

lock_release() {
    local project_root="$1"
    local lock_file
    lock_file="$(lock_path "$project_root")"

    [[ -f "$lock_file" ]] || return 0

    # Only release if we own it (PID check)
    local lock_pid
    lock_pid="$(field_value_plain "$lock_file" "pid")"
    if [[ -n "$lock_pid" && "$lock_pid" != "$$" ]]; then
        warn "lock owned by PID $lock_pid, not releasing (current PID: $$)"
        return 1
    fi

    rm -f "$lock_file"
}

# Returns 0 if lock exists but the owning process is dead (orphaned)
# Handles cross-device scenarios where PID validation is meaningless
lock_check_orphan() {
    local project_root="$1"
    local lock_file
    lock_file="$(lock_path "$project_root")"

    [[ -f "$lock_file" ]] || return 1  # no lock = not orphaned

    local lock_pid lock_host current_host
    lock_pid="$(field_value_plain "$lock_file" "pid")"
    lock_host="$(field_value_plain "$lock_file" "host")"
    current_host="$(detect_device)"

    [[ -n "$lock_pid" ]] || return 0  # no PID recorded = treat as orphan

    # Cross-device check: if lock is from different host, PID validation is meaningless
    if [[ -n "$lock_host" && "$lock_host" != "$current_host" ]]; then
        # Different machine — use age-based fallback only
        local lock_age_limit="${CAMPSITE_LOCK_EXPIRY:-86400}"
        local lock_mtime now_epoch
        lock_mtime="$(portable_stat_mtime "$lock_file" 2>/dev/null || echo 0)"
        now_epoch="$(date +%s)"
        local age=$(( now_epoch - lock_mtime ))

        if [[ $age -gt $lock_age_limit ]]; then
            return 0  # old enough to be orphan
        fi

        # Lock is fresh but from different host — cannot determine, assume held
        return 1
    fi

    # Same host — check if PID is alive
    if kill -0 "$lock_pid" 2>/dev/null; then
        # PID is alive — but could be a different process (PID reuse)
        # Fall back to age check
        local lock_age_limit="${CAMPSITE_LOCK_EXPIRY:-86400}"
        local lock_mtime now_epoch
        lock_mtime="$(portable_stat_mtime "$lock_file" 2>/dev/null || echo 0)"
        now_epoch="$(date +%s)"
        local age=$(( now_epoch - lock_mtime ))

        if [[ $age -gt $lock_age_limit ]]; then
            return 0  # old enough to be orphan despite PID reuse
        fi

        return 1  # PID alive and lock is fresh — not orphaned
    fi

    return 0  # PID is dead — orphaned
}

# Returns 0 if lock is held (exists and not orphaned)
lock_is_held() {
    local project_root="$1"
    local lock_file
    lock_file="$(lock_path "$project_root")"

    [[ -f "$lock_file" ]] || return 1

    if lock_check_orphan "$project_root"; then
        return 1  # orphaned = not truly held
    fi

    return 0
}

# Show lock info
lock_info() {
    local project_root="$1"
    local lock_file
    lock_file="$(lock_path "$project_root")"

    [[ -f "$lock_file" ]] || return 1
    cat "$lock_file"
}
