#!/usr/bin/env bash
# Campsite project locking with PID-based orphan detection
# Lock is implemented as a directory (.campsite/lock/) for atomic mkdir-based
# acquisition (TOCTOU-safe). Metadata is stored in .campsite/lock/pid.
[[ -n "${_CAMPSITE_LOCK_LOADED:-}" ]] && return 0
_CAMPSITE_LOCK_LOADED=1

# Returns the lock directory path (.campsite/lock)
lock_path() {
    printf '%s' "$(project_campsite_dir "$1")/lock"
}

# Returns the PID metadata file path inside the lock directory
_lock_pid_file() {
    printf '%s/pid' "$(lock_path "$1")"
}

lock_acquire() {
    local project_root="$1"
    local actor="${2:-${USER:-unknown}}"
    local tool="${3:-manual}"
    local lock_dir
    lock_dir="$(lock_path "$project_root")"

    # Attempt atomic acquisition: mkdir succeeds only in one process
    if ! mkdir "$lock_dir" 2>/dev/null; then
        # Directory already exists — check for orphan
        if lock_check_orphan "$project_root"; then
            warn "clearing orphaned lock (stale PID)"
            rm -rf "$lock_dir"
            # Retry acquisition after clearing orphan
            mkdir "$lock_dir" 2>/dev/null || {
                fail "could not acquire lock after clearing orphan"
            }
        else
            local pid_file held_by held_tool held_host
            pid_file="$(_lock_pid_file "$project_root")"
            held_by="$(field_value_plain "$pid_file" "actor" 2>/dev/null || echo "?")"
            held_tool="$(field_value_plain "$pid_file" "tool" 2>/dev/null || echo "?")"
            held_host="$(field_value_plain "$pid_file" "host" 2>/dev/null || echo "?")"
            fail "project locked by $held_by ($held_tool on $held_host). Use 'campsite recover' to clear stale locks."
        fi
    fi

    # Write metadata into the lock directory
    local pid_file
    pid_file="$(_lock_pid_file "$project_root")"
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
        _tty="$(detect_terminal_surface)"
        printf 'terminal: %s\n' "$_tty"
    } > "$pid_file"
    field_cache_invalidate "$pid_file" 2>/dev/null || true
}

lock_release() {
    local project_root="$1"
    local lock_dir pid_file
    lock_dir="$(lock_path "$project_root")"
    pid_file="$(_lock_pid_file "$project_root")"

    [[ -d "$lock_dir" ]] || return 0

    # Only release if we own it (PID check)
    local lock_pid
    lock_pid="$(field_value_plain "$pid_file" "pid" 2>/dev/null || true)"
    if [[ -n "$lock_pid" && "$lock_pid" != "$$" ]]; then
        warn "lock owned by PID $lock_pid, not releasing (current PID: $$)"
        return 1
    fi

    field_cache_invalidate "$pid_file" 2>/dev/null || true
    rm -rf "$lock_dir"
}

# Returns 0 if lock exists but the owning process is dead (orphaned)
# Handles cross-device scenarios where PID validation is meaningless
lock_check_orphan() {
    local project_root="$1"
    local lock_dir pid_file
    lock_dir="$(lock_path "$project_root")"
    pid_file="$(_lock_pid_file "$project_root")"

    [[ -d "$lock_dir" ]] || return 1  # no lock = not orphaned

    local lock_pid lock_host current_host
    lock_pid="$(field_value_plain "$pid_file" "pid" 2>/dev/null || true)"
    lock_host="$(field_value_plain "$pid_file" "host" 2>/dev/null || true)"
    current_host="$(detect_device)"

    [[ -n "$lock_pid" ]] || return 0  # no PID recorded = treat as orphan

    # Cross-device check: if lock is from different host, PID validation is meaningless
    if [[ -n "$lock_host" && "$lock_host" != "$current_host" ]]; then
        # Different machine — use age-based fallback only
        local lock_age_limit="${CAMPSITE_LOCK_EXPIRY:-86400}"
        local lock_mtime now_epoch
        lock_mtime="$(portable_stat_mtime "$pid_file" 2>/dev/null || echo 0)"
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
        lock_mtime="$(portable_stat_mtime "$pid_file" 2>/dev/null || echo 0)"
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
    local lock_dir
    lock_dir="$(lock_path "$project_root")"

    [[ -d "$lock_dir" ]] || return 1

    if lock_check_orphan "$project_root"; then
        return 1  # orphaned = not truly held
    fi

    return 0
}

# Show lock info
lock_info() {
    local project_root="$1"
    local pid_file
    pid_file="$(_lock_pid_file "$project_root")"

    [[ -f "$pid_file" ]] || return 1
    cat "$pid_file"
}
