#!/usr/bin/env bash
# Campsite common utilities
[[ -n "${_CAMPSITE_COMMON_LOADED:-}" ]] && return 0
_CAMPSITE_COMMON_LOADED=1

fail() {
    printf '\033[31merror:\033[0m %s\n' "$1" >&2
    if [[ -n "${2:-}" ]]; then
        printf '  \033[2mhint:\033[0m %s\n' "$2" >&2
    fi
    exit 1
}

warn() {
    printf '\033[33mwarning:\033[0m %s\n' "$1" >&2
}

info() {
    printf '\033[32m✓\033[0m %s\n' "$1"
}

# Extract field value from markdown list (- key: value)
field_value() {
    local file="$1" field="$2"
    sed -n "s/^[[:space:]]*-[[:space:]]*${field}:[[:space:]]*//p" "$file" | head -n 1
}

# Extract field value from plain key-value file (key: value)
field_value_plain() {
    local file="$1" field="$2"
    sed -n "s/^${field}:[[:space:]]*//p" "$file" | head -n 1
}

slug_from_path() {
    basename "$1" \
        | tr '[:upper:]' '[:lower:]' \
        | sed -e 's/[^a-z0-9]/-/g' -e 's/-\{2,\}/-/g' -e 's/^-//' -e 's/-$//'
}

require_file() {
    local path="$1" label="${2:-$1}"
    [[ -f "$path" ]] || fail "missing: $label ($path)"
}

# Returns the global campsite directory, creating if needed
campsite_global_dir() {
    local dir="${CAMPSITE_HOME:-$HOME/.campsite}"
    mkdir -p "$dir"
    printf '%s' "$dir"
}

# Returns the project-local .campsite directory, creating if needed
project_campsite_dir() {
    local project_root="$1"
    local dir="$project_root/.campsite"
    mkdir -p "$dir"
    printf '%s' "$dir"
}

# Resolve a path to absolute
# For existing paths: returns canonical absolute path
# For new paths: returns absolute path (parent must exist)
resolve_path() {
    local path="$1"
    
    if [[ -z "$path" ]]; then
        fail "resolve_path: empty path provided"
    fi
    
    if [[ "$path" = /* ]]; then
        # Absolute path
        if [[ -e "$path" ]]; then
            # Path exists — return as-is
            printf '%s' "$path"
        elif [[ -d "$(dirname "$path")" ]]; then
            # Parent exists — valid for new file/dir creation
            printf '%s' "$path"
        else
            fail "path does not exist: $path"
        fi
    else
        # Relative path
        if [[ -d "$path" ]]; then
            # Directory exists — cd and pwd
            cd "$path" && pwd
        elif [[ -f "$path" ]]; then
            # File exists — resolve via dirname
            local dir file
            dir="$(cd "$(dirname "$path")" && pwd)"
            file="$(basename "$path")"
            printf '%s/%s' "$dir" "$file"
        elif [[ -d "$(dirname "$path")" ]]; then
            # Parent exists — valid for new file/dir
            local dir file
            dir="$(cd "$(dirname "$path")" && pwd)"
            file="$(basename "$path")"
            printf '%s/%s' "$dir" "$file"
        else
            fail "cannot resolve path: $path"
        fi
    fi
}

# Current timestamp in ISO-8601 UTC
now_iso() {
    date -u '+%Y-%m-%dT%H:%M:%SZ'
}

# Current date YYYY-MM-DD
today_date() {
    date -u '+%Y-%m-%d'
}
