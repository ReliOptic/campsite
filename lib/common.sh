#!/usr/bin/env bash
# Campsite common utilities
[[ -n "${_CAMPSITE_COMMON_LOADED:-}" ]] && return 0
_CAMPSITE_COMMON_LOADED=1

# ---------------------------------------------------------------------------
# Field-value cache — bash 3.2 compatible (no associative arrays)
# Cache dir: /tmp/campsite-field-cache/
# Cache key file: {md5_of_filepath}_{sanitized_field}
# Stale check: cache file mtime vs source file mtime
# ---------------------------------------------------------------------------

_CAMPSITE_FIELD_CACHE_DIR="/tmp/campsite-field-cache"
# Create once at source time; mkdir -p is idempotent
mkdir -p "$_CAMPSITE_FIELD_CACHE_DIR" 2>/dev/null || true

# _field_cache_hash <string>  → short stable hash of the string (no subshell fork path)
_field_cache_hash() {
    local str="$1"
    if command -v md5 >/dev/null 2>&1; then
        printf '%s' "$str" | md5
    elif command -v md5sum >/dev/null 2>&1; then
        printf '%s' "$str" | md5sum | cut -d' ' -f1
    else
        # cksum always available on POSIX; use just the numeric checksum
        printf '%s' "$str" | cksum | awk '{print $1}'
    fi
}

# _field_cache_path <file> <field> → prints cache file path
_field_cache_path() {
    local file="$1" field="$2"
    local file_hash
    file_hash="$(_field_cache_hash "$file")"
    # Sanitize field name: replace non-alphanumeric with _
    local safe_field
    safe_field="$(printf '%s' "$field" | tr -c 'a-zA-Z0-9' '_')"
    printf '%s/%s_%s' "$_CAMPSITE_FIELD_CACHE_DIR" "$file_hash" "$safe_field"
}

# _field_src_mtime <file> → prints source file mtime as integer seconds
_field_src_mtime() {
    local file="$1"
    if [[ "$(uname -s)" == "Darwin" ]]; then
        stat -f %m "$file" 2>/dev/null || printf '0'
    else
        stat -c %Y "$file" 2>/dev/null || printf '0'
    fi
}

# field_cache_read <file> <field>
# Cache format: line 1 = recorded mtime of source file, line 2+ = value.
# Returns 0 and prints value on hit; returns 1 on miss or stale.
field_cache_read() {
    local file="$1" field="$2"
    local cache_path
    cache_path="$(_field_cache_path "$file" "$field")"

    [[ -f "$cache_path" ]] || return 1

    # Read recorded mtime from first line of cache file
    local recorded_mtime
    recorded_mtime="$(head -n 1 "$cache_path" 2>/dev/null)"

    # Compare against current source mtime
    local src_mtime
    src_mtime="$(_field_src_mtime "$file")"

    [[ "$recorded_mtime" == "$src_mtime" ]] || return 1

    # Print value (everything after the first line)
    tail -n +2 "$cache_path"
    return 0
}

# field_cache_write <file> <field> <value>
# Writes mtime + value to the cache (silently ignores write failures).
field_cache_write() {
    local file="$1" field="$2" value="$3"
    local cache_path src_mtime
    cache_path="$(_field_cache_path "$file" "$field")"
    src_mtime="$(_field_src_mtime "$file")"
    {
        printf '%s\n' "$src_mtime"
        printf '%s' "$value"
    } > "$cache_path" 2>/dev/null || true
}

# field_cache_invalidate <file>
# Removes all cache entries for the given file.
field_cache_invalidate() {
    local file="$1"
    local file_hash
    file_hash="$(_field_cache_hash "$file")"
    # shellcheck disable=SC2086
    rm -f "$_CAMPSITE_FIELD_CACHE_DIR/${file_hash}_"* 2>/dev/null || true
}

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
    [[ -f "$file" ]] || return 0
    local cached
    if cached="$(field_cache_read "$file" "md_${field}")"; then
        printf '%s' "$cached"
        return 0
    fi
    local value
    value="$(sed -n "s/^[[:space:]]*-[[:space:]]*${field}:[[:space:]]*//p" "$file" | head -n 1)"
    field_cache_write "$file" "md_${field}" "$value"
    printf '%s' "$value"
}

# Extract field value from plain key-value file (key: value)
field_value_plain() {
    local file="$1" field="$2"
    [[ -f "$file" ]] || return 0
    local cached
    if cached="$(field_cache_read "$file" "kv_${field}")"; then
        printf '%s' "$cached"
        return 0
    fi
    local value
    value="$(sed -n "s/^${field}:[[:space:]]*//p" "$file" | head -n 1)"
    field_cache_write "$file" "kv_${field}" "$value"
    printf '%s' "$value"
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
