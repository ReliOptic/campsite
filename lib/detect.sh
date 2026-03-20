#!/usr/bin/env bash
# Campsite project and workspace auto-detection
[[ -n "${_CAMPSITE_DETECT_LOADED:-}" ]] && return 0
_CAMPSITE_DETECT_LOADED=1

# Walk up from a directory to find the nearest Campsite project
# (directory containing both status.md and handoff.md)
# Returns absolute path or exits with error
detect_project() {
    local start="${1:-$PWD}"
    local dir
    dir="$(cd "$start" 2>/dev/null && pwd)" || fail "cannot access: $start"
    local max="${CAMPSITE_MAX_WALK_UP:-20}"
    local i=0

    while [[ $i -lt $max ]]; do
        if [[ -f "$dir/status.md" && -f "$dir/handoff.md" ]]; then
            printf '%s' "$dir"
            return 0
        fi
        local parent
        parent="$(dirname "$dir")"
        [[ "$parent" == "$dir" ]] && break  # reached root
        dir="$parent"
        ((i++))
    done

    fail "no campsite project found (walked up $i levels from $start)"
}

# Walk up from a directory to find a workspace root
# (directory containing WORKSPACE.md or multiple project dirs)
detect_workspace() {
    # 1. Environment variable
    if [[ -n "${CAMPSITE_WORKSPACE:-}" && -d "$CAMPSITE_WORKSPACE" ]]; then
        printf '%s' "$CAMPSITE_WORKSPACE"
        return 0
    fi

    # 2. User config
    local global_dir
    global_dir="$(campsite_global_dir)"
    if [[ -f "$global_dir/user/config.sh" ]]; then
        # shellcheck disable=SC1091
        source "$global_dir/user/config.sh"
        if [[ -n "${CAMPSITE_WORKSPACE:-}" && -d "$CAMPSITE_WORKSPACE" ]]; then
            printf '%s' "$CAMPSITE_WORKSPACE"
            return 0
        fi
    fi

    # 3. Walk up looking for WORKSPACE.md
    local dir="$PWD"
    local max="${CAMPSITE_MAX_WALK_UP:-20}"
    local i=0

    while [[ $i -lt $max ]]; do
        if [[ -f "$dir/WORKSPACE.md" ]]; then
            printf '%s' "$dir"
            return 0
        fi
        local parent
        parent="$(dirname "$dir")"
        [[ "$parent" == "$dir" ]] && break
        dir="$parent"
        ((i++))
    done

    return 1
}

# List all projects under a workspace root
# Prints one absolute path per line
detect_all_projects() {
    local root="${1:-}"

    # Try to find workspace root if not given
    if [[ -z "$root" ]]; then
        root="$(detect_workspace 2>/dev/null)" || true
    fi

    if [[ -z "$root" || ! -d "$root" ]]; then
        fail "no workspace root found. Set CAMPSITE_WORKSPACE or run from within a workspace."
    fi

    # Look for directories containing status.md + handoff.md
    local found=0
    for dir in "$root"/*/; do
        [[ -d "$dir" ]] || continue
        if [[ -f "$dir/status.md" && -f "$dir/handoff.md" ]]; then
            printf '%s\n' "${dir%/}"
            ((found++))
        fi
    done

    # Also check subdirectories one level deeper (projects/*)
    if [[ $found -eq 0 ]]; then
        for dir in "$root"/*/*/; do
            [[ -d "$dir" ]] || continue
            if [[ -f "$dir/status.md" && -f "$dir/handoff.md" ]]; then
                printf '%s\n' "${dir%/}"
                ((found++))
            fi
        done
    fi

    [[ $found -gt 0 ]] || fail "no campsite projects found under $root"
}
