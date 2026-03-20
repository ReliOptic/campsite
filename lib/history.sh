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
