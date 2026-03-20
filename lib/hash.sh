#!/usr/bin/env bash
# Campsite hash-based integrity verification
[[ -n "${_CAMPSITE_HASH_LOADED:-}" ]] && return 0
_CAMPSITE_HASH_LOADED=1

# Compute combined hash of source-of-truth files
# Stores result in .campsite/known-hash
hash_compute() {
    local project_root="$1"
    local campsite_dir
    campsite_dir="$(project_campsite_dir "$project_root")"

    local combined=""
    for file in "$project_root/status.md" "$project_root/handoff.md"; do
        if [[ -f "$file" ]]; then
            local h
            h="$(portable_sha256 "$file")"
            combined="${combined}${h}"
        fi
    done

    # Hash the combined hashes
    local final
    final="$(printf '%s' "$combined" | sha256sum 2>/dev/null | cut -d' ' -f1 \
        || printf '%s' "$combined" | shasum -a 256 2>/dev/null | cut -d' ' -f1 \
        || printf '%s' "$combined")"

    printf '%s' "$final" > "$campsite_dir/known-hash"
    printf '%s' "$final"
}

# Compare current hash with stored hash
# Returns: 0 = match, 1 = mismatch, 2 = no stored hash
hash_compare() {
    local project_root="$1"
    local campsite_dir
    campsite_dir="$(project_campsite_dir "$project_root")"
    local hash_file="$campsite_dir/known-hash"

    [[ -f "$hash_file" ]] || return 2

    local stored current
    stored="$(cat "$hash_file")"
    current="$(hash_compute "$project_root")"

    if [[ "$stored" == "$current" ]]; then
        return 0
    else
        return 1
    fi
}

# Store current hash without returning it
hash_store() {
    local project_root="$1"
    hash_compute "$project_root" > /dev/null
}
