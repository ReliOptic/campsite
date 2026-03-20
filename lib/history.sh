#!/usr/bin/env bash
# Campsite session history tracking
[[ -n "${_CAMPSITE_HISTORY_LOADED:-}" ]] && return 0
_CAMPSITE_HISTORY_LOADED=1

_history_file() {
    local global_dir
    global_dir="$(campsite_global_dir)"
    printf '%s/history' "$global_dir"
}

# Append a session record
history_append() {
    local project="$1"
    local agent="$2"
    local device="$3"
    local timestamp="$4"
    local duration="$5"
    local outcome="$6"

    local hfile
    hfile="$(_history_file)"

    # Create with header if new
    if [[ ! -f "$hfile" ]]; then
        printf 'project,agent,device,timestamp,duration_seconds,outcome\n' > "$hfile"
    fi

    local project_name
    project_name="$(basename "$project")"

    printf '%s,%s,%s,%s,%s,%s\n' \
        "$project_name" "$agent" "$device" "$timestamp" "$duration" "$outcome" \
        >> "$hfile"
}

# Get the most recently used project path
# Returns project name (not full path)
history_last_project() {
    local hfile
    hfile="$(_history_file)"
    [[ -f "$hfile" ]] || return 1

    tail -1 "$hfile" | cut -d',' -f1
}

# Get the most used agent for a project
history_agent_for_project() {
    local project_name="$1"
    local hfile
    hfile="$(_history_file)"
    [[ -f "$hfile" ]] || return 1

    grep "^${project_name}," "$hfile" | cut -d',' -f2 | sort | uniq -c | sort -rn | head -1 | awk '{print $2}'
}

# Get recent history entries (last N)
history_recent() {
    local count="${1:-10}"
    local hfile
    hfile="$(_history_file)"
    [[ -f "$hfile" ]] || return 1

    tail -"$count" "$hfile"
}

# Return deduplicated MRU project list (most recent first)
# Each line: project_name,timestamp
history_mru_projects() {
    local count="${1:-10}"
    local hfile
    hfile="$(_history_file)"
    [[ -f "$hfile" ]] || return 1

    # Skip CSV header, reverse, deduplicate keeping first (most recent), limit
    tail -n +2 "$hfile" | tac 2>/dev/null | awk -F',' '!seen[$1]++ {print $1","$4}' | head -"$count"
}

# Resolve a project name back to its absolute path via workspace scan
history_resolve_project_path() {
    local name="$1"
    local workspace
    workspace="$(detect_workspace 2>/dev/null)" || return 1

    while IFS= read -r project; do
        if [[ "$(basename "$project")" == "$name" ]]; then
            printf '%s' "$project"
            return 0
        fi
    done < <(detect_all_projects "$workspace" 2>/dev/null)

    return 1
}

# Return human-readable relative time string
_history_relative_time() {
    local timestamp="$1"
    local sync_epoch now_epoch elapsed

    sync_epoch="$(date -d "$timestamp" +%s 2>/dev/null \
        || date -j -f '%Y-%m-%dT%H:%M:%SZ' "$timestamp" +%s 2>/dev/null \
        || echo 0)"
    now_epoch="$(date +%s)"
    elapsed=$(( now_epoch - sync_epoch ))

    if [[ $elapsed -lt 3600 ]]; then
        printf '%dm ago' "$(( elapsed / 60 ))"
    elif [[ $elapsed -lt 86400 ]]; then
        printf '%dh ago' "$(( elapsed / 3600 ))"
    else
        printf '%dd ago' "$(( elapsed / 86400 ))"
    fi
}
