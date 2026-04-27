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
            fail "path not accessible: $path" \
             "Check the parent directory exists, or use 'campsite setup --here' to start from the current folder."
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
            fail "path not found: $path" \
                 "Use an absolute path, or run from within the target directory."
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

file_age_seconds() {
    local file="$1"
    local mtime now_epoch
    mtime="$(portable_stat_mtime "$file" 2>/dev/null || echo 0)"
    now_epoch="$(date +%s)"
    printf '%s' $(( now_epoch - mtime ))
}

freshness_level_for_file() {
    local file="$1"
    local stale_seconds=$(( ${CAMPSITE_STALE_DAYS:-2} * 86400 ))
    local age
    age="$(file_age_seconds "$file")"

    if [[ "$age" -le $(( stale_seconds / 2 )) ]]; then
        printf 'fresh'
    elif [[ "$age" -le "$stale_seconds" ]]; then
        printf 'aging'
    else
        printf 'stale'
    fi
}

freshness_label_for_file() {
    local file="$1"
    local age
    age="$(file_age_seconds "$file")"

    if [[ "$age" -lt 3600 ]]; then
        printf '%dm old' $(( age / 60 ))
    elif [[ "$age" -lt 86400 ]]; then
        printf '%dh old' $(( age / 3600 ))
    else
        printf '%dd old' $(( age / 86400 ))
    fi
}

# Worst freshness across the source-of-truth files (status.md + handoff.md).
# Result: fresh < aging < stale (returns the most degraded level seen).
project_freshness_level() {
    local project="$1"
    local files="${CAMPSITE_SOURCE_FILES:-status.md handoff.md}"
    local worst="fresh"
    local f level
    for f in $files; do
        [[ -f "$project/$f" ]] || continue
        level="$(freshness_level_for_file "$project/$f")"
        case "$level" in
            stale) worst="stale" ;;
            aging) [[ "$worst" != "stale" ]] && worst="aging" ;;
        esac
    done
    printf '%s' "$worst"
}

# Confidence rank: low=1, medium=2, high=3 (everything else => 0 unknown).
_confidence_rank() {
    case "$1" in
        high)   printf '3' ;;
        medium) printf '2' ;;
        low)    printf '1' ;;
        *)      printf '0' ;;
    esac
}

_rank_confidence() {
    case "$1" in
        3) printf 'high' ;;
        2) printf 'medium' ;;
        1) printf 'low' ;;
        *) printf 'unknown' ;;
    esac
}

# Effective confidence = stated confidence degraded by freshness.
# - aging: drop one rank (high→medium, medium→low)
# - stale: floor at low
# Unknown stated confidence stays unknown.
effective_confidence() {
    local stated="$1" freshness="$2"
    local rank
    rank="$(_confidence_rank "$stated")"
    if [[ "$rank" -eq 0 ]]; then
        printf 'unknown'
        return 0
    fi
    case "$freshness" in
        stale) rank=1 ;;
        aging) (( rank > 1 )) && rank=$(( rank - 1 )) ;;
    esac
    _rank_confidence "$rank"
}

# Decide what the launcher should do given a freshness level.
# Returns (stdout): proceed | warn | block
# Driven by CAMPSITE_FRESHNESS_POLICY (default: strict)
#   strict: aging→warn, stale→block
#   warn:   aging→warn, stale→warn
#   off:    everything proceeds
freshness_gate_action() {
    local freshness="$1"
    local policy="${CAMPSITE_FRESHNESS_POLICY:-strict}"

    [[ "$freshness" == "fresh" ]] && { printf 'proceed'; return 0; }

    case "$policy" in
        off)    printf 'proceed' ;;
        warn)   printf 'warn' ;;
        strict|*)
            case "$freshness" in
                stale) printf 'block' ;;
                aging) printf 'warn' ;;
                *)     printf 'proceed' ;;
            esac
            ;;
    esac
}
