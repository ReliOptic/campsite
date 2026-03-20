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

# -------------------------------------------------------
# Sync-state: records git HEAD + timestamp at sync time
# Used by campsite recover to show what changed during a crashed session
# -------------------------------------------------------

sync_state_file() {
    local project_root="$1"
    printf '%s/sync-state' "$(project_campsite_dir "$project_root")"
}

# Save current sync state (git HEAD + timestamp) to .campsite/sync-state
sync_state_save() {
    local project_root="$1"
    local state_file
    state_file="$(sync_state_file "$project_root")"

    {
        printf 'synced-at: %s\n' "$(now_iso)"
        # Record git HEAD if this is a git repo
        if git -C "$project_root" rev-parse HEAD >/dev/null 2>&1; then
            printf 'git-head: %s\n' "$(git -C "$project_root" rev-parse HEAD 2>/dev/null)"
        fi
    } > "$state_file"
}

# Show recovery info: elapsed time + git diff since last sync
# Prints to stdout. Returns 1 if no sync-state available.
sync_state_show() {
    local project_root="$1"
    local state_file
    state_file="$(sync_state_file "$project_root")"

    [[ -f "$state_file" ]] || return 1

    local synced_at git_head
    synced_at="$(field_value_plain "$state_file" "synced-at")"
    git_head="$(field_value_plain "$state_file" "git-head")"

    # Elapsed time since last sync
    if [[ -n "$synced_at" ]]; then
        # Convert ISO timestamp to epoch for elapsed calculation
        local sync_epoch now_epoch elapsed
        sync_epoch="$(date -d "$synced_at" +%s 2>/dev/null \
            || date -j -f '%Y-%m-%dT%H:%M:%SZ' "$synced_at" +%s 2>/dev/null \
            || echo 0)"
        now_epoch="$(date +%s)"
        elapsed=$(( now_epoch - sync_epoch ))

        if [[ $elapsed -lt 3600 ]]; then
            printf '  마지막 sync: %d분 전 (%s)\n' "$(( elapsed / 60 ))" "$synced_at"
        elif [[ $elapsed -lt 86400 ]]; then
            printf '  마지막 sync: %d시간 전 (%s)\n' "$(( elapsed / 3600 ))" "$synced_at"
        else
            printf '  마지막 sync: %d일 전 (%s)\n' "$(( elapsed / 86400 ))" "$synced_at"
        fi
    fi

    # Git diff since sync
    if [[ -n "$git_head" ]] && git -C "$project_root" rev-parse HEAD >/dev/null 2>&1; then
        local current_head
        current_head="$(git -C "$project_root" rev-parse HEAD 2>/dev/null)"

        if [[ "$git_head" == "$current_head" ]]; then
            printf '  git 변경사항: 없음 (코드 변경 없음)\n'
        else
            printf '  세션 중 변경된 파일:\n'
            git -C "$project_root" diff --stat "${git_head}..HEAD" 2>/dev/null \
                | head -20 \
                | sed 's/^/    /'
            local commit_count
            commit_count="$(git -C "$project_root" rev-list --count "${git_head}..HEAD" 2>/dev/null || echo 0)"
            if [[ "$commit_count" -gt 0 ]]; then
                printf '  새 커밋: %s개\n' "$commit_count"
            fi
        fi
    else
        # Not a git repo — check mtime of source files
        local status_mtime handoff_mtime sync_epoch
        sync_epoch="$(date -d "$synced_at" +%s 2>/dev/null \
            || date -j -f '%Y-%m-%dT%H:%M:%SZ' "$synced_at" +%s 2>/dev/null \
            || echo 0)"
        status_mtime="$(portable_stat_mtime "$project_root/status.md" 2>/dev/null || echo 0)"
        handoff_mtime="$(portable_stat_mtime "$project_root/handoff.md" 2>/dev/null || echo 0)"

        if [[ $status_mtime -gt $sync_epoch ]] || [[ $handoff_mtime -gt $sync_epoch ]]; then
            printf '  변경 감지: status.md 또는 handoff.md가 sync 이후 수정됨\n'
        else
            printf '  변경 감지: source 파일 변경 없음\n'
        fi
    fi
}
