#!/usr/bin/env bash
# Campsite TUI components — launcher, selection, display
[[ -n "${_CAMPSITE_UI_LOADED:-}" ]] && return 0
_CAMPSITE_UI_LOADED=1

# ANSI color codes
if is_terminal; then
    _C_GREEN='\033[32m'
    _C_RED='\033[31m'
    _C_YELLOW='\033[33m'
    _C_DIM='\033[2m'
    _C_BOLD='\033[1m'
    _C_RESET='\033[0m'
    _C_CYAN='\033[36m'
else
    _C_GREEN='' _C_RED='' _C_YELLOW='' _C_DIM='' _C_BOLD='' _C_RESET='' _C_CYAN=''
fi

# Print the campsite header
ui_header() {
    printf '\n'
    printf "${_C_BOLD}  campsite${_C_RESET}\n"
    printf '\n'
}

# Display project list with status indicators
# Sets PROJECT_LIST array as side effect
ui_project_list() {
    local -a projects=()
    local ghost_project=""

    # Read projects into array
    while IFS= read -r dir; do
        projects+=("$dir")
    done < <(detect_all_projects 2>/dev/null || true)

    if [[ ${#projects[@]} -eq 0 ]]; then
        fail "no campsite projects found"
    fi

    # Ghost suggestion: last used project
    ghost_project="$(history_last_project 2>/dev/null || true)"

    PROJECT_LIST=("${projects[@]}")

    local i=1
    for dir in "${projects[@]}"; do
        local name
        name="$(basename "$dir")"
        local phase
        phase="$(field_value "$dir/status.md" "phase" 2>/dev/null || echo "?")"
        local status_indicator=""

        # Lock status
        if lock_is_held "$dir" 2>/dev/null; then
            local held_tool
            held_tool="$(field_value_plain "$(project_campsite_dir "$dir")/lock" "tool" 2>/dev/null || echo "?")"
            status_indicator="${_C_RED}locked${_C_RESET} │ $held_tool"
        elif [[ "$phase" == "blocked" ]]; then
            status_indicator="${_C_YELLOW}blocked${_C_RESET}"
        else
            status_indicator="${_C_GREEN}available${_C_RESET}"
        fi

        # Staleness check
        local mtime now_epoch age
        mtime="$(portable_stat_mtime "$dir/status.md" 2>/dev/null || echo 0)"
        now_epoch="$(date +%s)"
        age=$(( now_epoch - mtime ))
        local stale_seconds=$(( CAMPSITE_STALE_DAYS * 86400 ))
        local stale_warn=""
        if [[ $age -gt $stale_seconds ]]; then
            local days=$(( age / 86400 ))
            stale_warn=" ${_C_YELLOW}${days}d stale${_C_RESET}"
        fi

        # Ghost hint
        local ghost=""
        if [[ "$name" == "$ghost_project" ]]; then
            ghost=" ${_C_DIM}← default${_C_RESET}"
        fi

        printf "  ${_C_DIM}%2d${_C_RESET}  %-20s │ %-10s │ %b%b%b\n" \
            "$i" "$name" "$phase" "$status_indicator" "$stale_warn" "$ghost"

        ((i++))
    done
    printf '\n'
}

# Display available agents for a project
# Sets AGENT_LIST array as side effect
ui_agent_list() {
    local project_root="${1:-}"
    local -a agents=()
    local ghost_agent=""

    # Ghost suggestion: most used agent for this project
    if [[ -n "$project_root" ]]; then
        ghost_agent="$(history_agent_for_project "$(basename "$project_root")" 2>/dev/null || true)"
    fi

    while IFS= read -r adapter; do
        # Load adapter to get command name
        local adapter_file
        adapter_file="$(_adapter_find "$adapter" 2>/dev/null)" || continue
        local cmd
        cmd="$(field_value_plain "$adapter_file" "command")"
        if command -v "$cmd" >/dev/null 2>&1; then
            agents+=("$adapter")
        fi
    done < <(adapter_list 2>/dev/null || true)

    if [[ ${#agents[@]} -eq 0 ]]; then
        fail "no agent commands found in PATH. Install an AI coding agent (claude, codex, gemini, etc.)"
    fi

    AGENT_LIST=("${agents[@]}")

    printf "  agents:\n"
    local i=1
    for adapter in "${agents[@]}"; do
        local ghost=""
        if [[ "$adapter" == "$ghost_agent" ]]; then
            ghost=" ${_C_DIM}← default${_C_RESET}"
        fi
        printf "  ${_C_DIM}%2d${_C_RESET}  %s%b\n" "$i" "$adapter" "$ghost"
        ((i++))
    done
    printf '\n'
}

# Prompt user to select from a numbered list
# Args: prompt_text, array_size, default_index (1-based, 0=none)
# Returns selected index (1-based) via stdout
ui_select() {
    local prompt="$1"
    local size="$2"
    local default="${3:-0}"

    local default_hint=""
    if [[ $default -gt 0 ]]; then
        default_hint=" ${_C_DIM}[${default}]${_C_RESET}"
    fi

    printf "  %b%b: " "$prompt" "$default_hint"
    read -r choice

    # Empty = default
    if [[ -z "$choice" && $default -gt 0 ]]; then
        printf '%d' "$default"
        return 0
    fi

    # Validate numeric
    if [[ "$choice" =~ ^[0-9]+$ ]] && [[ "$choice" -ge 1 ]] && [[ "$choice" -le "$size" ]]; then
        printf '%d' "$choice"
        return 0
    fi

    fail "invalid selection: $choice"
}

# Yes/No confirmation
ui_confirm() {
    local prompt="$1"
    printf "  %s [y/N]: " "$prompt"
    read -r answer
    case "$answer" in
        [yY]|[yY][eE][sS]) return 0 ;;
        *) return 1 ;;
    esac
}

# Session start banner
ui_banner() {
    local project="$1"
    local agent="$2"
    local device="$3"

    printf '\n'
    printf "  ${_C_BOLD}%s${_C_RESET} │ %s │ %s\n" "$(basename "$project")" "$agent" "$device"

    local phase
    phase="$(field_value "$project/status.md" "phase" 2>/dev/null || echo "?")"
    local task
    task="$(field_value "$project/handoff.md" "task" 2>/dev/null || echo "?")"

    printf "  phase: %s\n" "$phase"
    printf "  next: %s\n" "$task"
    printf '\n'
}

# Full interactive launcher flow
# Returns: sets SELECTED_PROJECT and SELECTED_AGENT
launcher() {
    ui_header

    # Project selection
    ui_project_list
    local project_count=${#PROJECT_LIST[@]}

    # Find default project index
    local default_project=0
    local ghost
    ghost="$(history_last_project 2>/dev/null || true)"
    if [[ -n "$ghost" ]]; then
        for i in "${!PROJECT_LIST[@]}"; do
            if [[ "$(basename "${PROJECT_LIST[$i]}")" == "$ghost" ]]; then
                default_project=$((i + 1))
                break
            fi
        done
    fi

    local project_idx
    project_idx="$(ui_select "project" "$project_count" "$default_project")"
    SELECTED_PROJECT="${PROJECT_LIST[$((project_idx - 1))]}"

    # Check if selected project is locked
    if lock_is_held "$SELECTED_PROJECT" 2>/dev/null; then
        fail "$(basename "$SELECTED_PROJECT") is locked. Use 'campsite recover' to clear stale locks."
    fi

    # Agent selection
    ui_agent_list "$SELECTED_PROJECT"
    local agent_count=${#AGENT_LIST[@]}

    local default_agent=0
    local ghost_agent
    ghost_agent="$(history_agent_for_project "$(basename "$SELECTED_PROJECT")" 2>/dev/null || true)"
    if [[ -n "$ghost_agent" ]]; then
        for i in "${!AGENT_LIST[@]}"; do
            if [[ "${AGENT_LIST[$i]}" == "$ghost_agent" ]]; then
                default_agent=$((i + 1))
                break
            fi
        done
    fi

    # If only one agent, auto-select
    if [[ $agent_count -eq 1 ]]; then
        SELECTED_AGENT="${AGENT_LIST[0]}"
    else
        local agent_idx
        agent_idx="$(ui_select "agent" "$agent_count" "$default_agent")"
        SELECTED_AGENT="${AGENT_LIST[$((agent_idx - 1))]}"
    fi
}
