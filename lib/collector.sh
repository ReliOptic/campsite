#!/usr/bin/env bash
# Campsite signal collector — git/filesystem activity tracking
[[ -n "${_CAMPSITE_COLLECTOR_LOADED:-}" ]] && return 0
_CAMPSITE_COLLECTOR_LOADED=1

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

_collector_signals_dir() {
    local project_root="$1"
    local dir
    dir="$(project_campsite_dir "$project_root")/signals"
    mkdir -p "$dir"
    printf '%s' "$dir"
}

_collector_commits_path() {
    printf '%s/commits.tsv' "$(_collector_signals_dir "$1")"
}

_collector_git_snapshot_path() {
    printf '%s/git-snapshot.tsv' "$(_collector_signals_dir "$1")"
}

_collector_file_activity_path() {
    printf '%s/file-activity.tsv' "$(_collector_signals_dir "$1")"
}

_collector_events_path() {
    printf '%s/events.tsv' "$(_collector_signals_dir "$1")"
}

_collector_last_activity_path() {
    printf '%s/last-activity' "$(_collector_signals_dir "$1")"
}

# ---------------------------------------------------------------------------
# collector_ensure_store — initialise TSV headers if missing
# ---------------------------------------------------------------------------

collector_ensure_store() {
    local project_root="$1"
    local commits_f events_f git_snap_f file_act_f

    commits_f="$(_collector_commits_path "$project_root")"
    events_f="$(_collector_events_path "$project_root")"
    git_snap_f="$(_collector_git_snapshot_path "$project_root")"
    file_act_f="$(_collector_file_activity_path "$project_root")"

    if [[ ! -f "$commits_f" ]]; then
        printf 'timestamp\tcommit_hash\tauthor\tsubject\tfiles_changed\tinsertions\tdeletions\n' > "$commits_f"
    fi

    if [[ ! -f "$events_f" ]]; then
        printf 'timestamp\ttype\tdescription\tsource\n' > "$events_f"
    fi

    if [[ ! -f "$git_snap_f" ]]; then
        printf 'timestamp\tcommit_hash\tfiles_changed\tinsertions\tdeletions\n' > "$git_snap_f"
    fi

    if [[ ! -f "$file_act_f" ]]; then
        printf 'timestamp\tfile_path\tchange_type\n' > "$file_act_f"
    fi

    # Ensure last-activity sentinel exists
    local sentinel
    sentinel="$(_collector_last_activity_path "$project_root")"
    [[ -f "$sentinel" ]] || touch "$sentinel"
}

# ---------------------------------------------------------------------------
# collector_git_snapshot — capture current git state
# ---------------------------------------------------------------------------

collector_git_snapshot() {
    local project_root="$1"
    collector_ensure_store "$project_root"

    # Must be inside a git repo
    git -C "$project_root" rev-parse --is-inside-work-tree >/dev/null 2>&1 || return 0

    local ts commit_hash files_changed insertions deletions
    ts="$(now_iso)"
    commit_hash="$(git -C "$project_root" rev-parse HEAD 2>/dev/null || echo "none")"

    # Parse --stat output for numbers
    local diff_stat
    diff_stat="$(git -C "$project_root" diff --stat 2>/dev/null | tail -1)"

    files_changed=0
    insertions=0
    deletions=0

    if [[ -n "$diff_stat" ]] && [[ "$diff_stat" != *"0 files"* ]]; then
        # "3 files changed, 10 insertions(+), 2 deletions(-)"
        files_changed="$(printf '%s' "$diff_stat" | sed -n 's/.*\([0-9][0-9]*\) file.*/\1/p' || echo 0)"
        insertions="$(printf '%s' "$diff_stat" | sed -n 's/.*\([0-9][0-9]*\) insertion.*/\1/p' || echo 0)"
        deletions="$(printf '%s' "$diff_stat" | sed -n 's/.*\([0-9][0-9]*\) deletion.*/\1/p' || echo 0)"
    fi

    [[ -n "$files_changed" ]] || files_changed=0
    [[ -n "$insertions" ]] || insertions=0
    [[ -n "$deletions" ]] || deletions=0

    printf '%s\t%s\t%s\t%s\t%s\n' \
        "$ts" "$commit_hash" "$files_changed" "$insertions" "$deletions" \
        >> "$(_collector_git_snapshot_path "$project_root")"

    # Touch sentinel
    touch "$(_collector_last_activity_path "$project_root")"
}

# ---------------------------------------------------------------------------
# collector_record_commit — append a commit record (called from git hook)
# ---------------------------------------------------------------------------

collector_record_commit() {
    local project_root="$1" commit_hash="$2" author="$3" subject="$4" files_changed="$5" insertions="$6" deletions="$7"
    collector_ensure_store "$project_root"

    local ts
    ts="$(now_iso)"

    # Sanitise fields: replace tabs/newlines
    subject="$(printf '%s' "$subject" | tr '\t\r\n' '   ')"
    author="$(printf '%s' "$author" | tr '\t\r\n' '   ')"

    printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\n' \
        "$ts" "$commit_hash" "$author" "$subject" "$files_changed" "$insertions" "$deletions" \
        >> "$(_collector_commits_path "$project_root")"

    # Also record as event
    collector_record_event "$project_root" "commit" "${author}: ${subject} (${files_changed} files)" "git"

    touch "$(_collector_last_activity_path "$project_root")"
}

# ---------------------------------------------------------------------------
# collector_file_activity — detect file changes since last check
# ---------------------------------------------------------------------------

collector_file_activity() {
    local project_root="$1"
    collector_ensure_store "$project_root"

    local sentinel last_check_file
    sentinel="$(_collector_last_activity_path "$project_root")"
    last_check_file="$(_collector_signals_dir "$project_root")/last-file-check"

    local ts
    ts="$(now_iso)"

    # Find files modified since last check
    local ref_file="$last_check_file"
    [[ -f "$ref_file" ]] || ref_file="$sentinel"

    # Check status.md and handoff.md for changes
    local file_act_f
    file_act_f="$(_collector_file_activity_path "$project_root")"

    for check_file in "$project_root/status.md" "$project_root/handoff.md"; do
        if [[ -f "$check_file" ]] && [[ "$check_file" -nt "$ref_file" ]]; then
            local fname
            fname="$(basename "$check_file")"
            printf '%s\t%s\tmodified\n' "$ts" "$fname" >> "$file_act_f"
            collector_record_event "$project_root" "file_change" "$fname modified" "filesystem"
        fi
    done

    # Update last-check sentinel
    touch "$last_check_file"
    touch "$sentinel"
}

# ---------------------------------------------------------------------------
# collector_record_event — append an event to the event log
# ---------------------------------------------------------------------------

collector_record_event() {
    local project_root="$1" event_type="$2" description="$3" source="${4:-system}"
    collector_ensure_store "$project_root"

    local ts
    ts="$(now_iso)"

    # Sanitise
    description="$(printf '%s' "$description" | tr '\t\r\n' '   ')"
    source="$(printf '%s' "$source" | tr '\t\r\n' '   ')"

    printf '%s\t%s\t%s\t%s\n' \
        "$ts" "$event_type" "$description" "$source" \
        >> "$(_collector_events_path "$project_root")"

    touch "$(_collector_last_activity_path "$project_root")"
}

# ---------------------------------------------------------------------------
# collector_last_activity_ts — return epoch seconds of last activity
# ---------------------------------------------------------------------------

collector_last_activity_ts() {
    local project_root="$1"
    local sentinel
    sentinel="$(_collector_last_activity_path "$project_root")"

    if [[ ! -f "$sentinel" ]]; then
        # No sentinel = no recorded activity, return 0
        printf '0'
        return
    fi

    portable_stat_mtime "$sentinel" 2>/dev/null || printf '0'
}

# ---------------------------------------------------------------------------
# collector_absence_summary — generate JSON summary of what happened while away
# ---------------------------------------------------------------------------

collector_absence_summary() {
    local project_root="$1"

    local last_ts
    last_ts="$(collector_last_activity_ts "$project_root")"
    local now
    now="$(date +%s)"
    local absence=$(( now - last_ts ))

    # If no real absence (< 5 min), return empty
    if [[ "$absence" -lt 300 ]] 2>/dev/null; then
        printf ''
        return
    fi

    # Human-readable absence
    local absence_human
    if [[ "$absence" -lt 3600 ]]; then
        absence_human="$(( absence / 60 ))분"
    elif [[ "$absence" -lt 86400 ]]; then
        absence_human="$(( absence / 3600 ))시간"
    else
        absence_human="$(( absence / 86400 ))일"
    fi

    # Count commits during absence
    local commits_during=0
    local commits_f
    commits_f="$(_collector_commits_path "$project_root")"
    if [[ -f "$commits_f" ]]; then
        commits_during="$(awk 'NR > 1' "$commits_f" 2>/dev/null | wc -l | tr -d ' ')"
    fi

    # Count events during absence
    local events_during=0
    local events_f
    events_f="$(_collector_events_path "$project_root")"
    if [[ -f "$events_f" ]]; then
        events_during="$(awk 'NR > 1' "$events_f" 2>/dev/null | wc -l | tr -d ' ')"
    fi

    # Last agent info
    local last_agent="" last_agent_status=""
    local sessions_dir
    sessions_dir="$(project_campsite_dir "$project_root")/sessions"
    if [[ -d "$sessions_dir" ]]; then
        local latest_session
        latest_session="$(ls -td "$sessions_dir"/*/ 2>/dev/null | head -1)"
        if [[ -n "$latest_session" && -d "$latest_session" ]]; then
            last_agent="$(cat "$latest_session/agent.name" 2>/dev/null || echo "")"
            last_agent_status="$(cat "$latest_session/status" 2>/dev/null || echo "")"
        fi
    fi

    # Top events (last 5 from signals)
    local top_events_json="[]"
    if [[ -f "$events_f" ]]; then
        local tarr="["
        local tfirst=1
        local tlines
        tlines="$(awk -F'\t' 'NR > 1 && NF >= 3' "$events_f" 2>/dev/null | tail -5)"
        while IFS=$'\t' read -r tts ttype tdesc tsource; do
            [[ -z "$tts" ]] && continue
            [[ $tfirst -eq 0 ]] && tarr="$tarr,"
            # Escape for JSON
            tdesc="$(printf '%s' "$tdesc" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' -e 's/	/\\t/g')"
            tarr="$tarr{\"time\":\"$tts\",\"desc\":\"$tdesc\"}"
            tfirst=0
        done <<< "$tlines"
        tarr="$tarr]"
        top_events_json="$tarr"
    fi

    # Escape strings
    last_agent="$(printf '%s' "$last_agent" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g')"
    last_agent_status="$(printf '%s' "$last_agent_status" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g')"
    absence_human="$(printf '%s' "$absence_human" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g')"

    printf '{
  "absenceSeconds": %s,
  "absenceHuman": "%s",
  "commitsDuringAbsence": %s,
  "eventsDuringAbsence": %s,
  "lastAgent": "%s",
  "lastAgentStatus": "%s",
  "topEvents": %s
}' "$absence" "$absence_human" "${commits_during:-0}" "${events_during:-0}" "$last_agent" "$last_agent_status" "$top_events_json"
}

# ---------------------------------------------------------------------------
# collector_recent_commits_count — count commits in the last N seconds
# ---------------------------------------------------------------------------

collector_recent_commits_count() {
    local project_root="$1" window_sec="${2:-3600}"
    local commits_f
    commits_f="$(_collector_commits_path "$project_root")"

    [[ -f "$commits_f" ]] || { printf '0'; return; }

    # Count non-header lines (simple count, all recent)
    local total
    total="$(awk 'NR > 1' "$commits_f" 2>/dev/null | wc -l | tr -d ' ')"
    printf '%s' "${total:-0}"
}

# ---------------------------------------------------------------------------
# collector_recent_events — return last N events as TSV lines
# ---------------------------------------------------------------------------

collector_recent_events() {
    local project_root="$1" limit="${2:-5}"
    local events_f
    events_f="$(_collector_events_path "$project_root")"

    [[ -f "$events_f" ]] || return 0

    awk 'NR > 1' "$events_f" 2>/dev/null | tail -"$limit"
}

# ---------------------------------------------------------------------------
# collector_install_git_hook — install post-commit hook
# ---------------------------------------------------------------------------

collector_install_git_hook() {
    local project_root="$1"

    # Must be a git repo
    local git_dir
    git_dir="$(git -C "$project_root" rev-parse --git-dir 2>/dev/null)" || return 0

    # Resolve to absolute path
    if [[ "$git_dir" != /* ]]; then
        git_dir="$project_root/$git_dir"
    fi

    local hooks_dir="$git_dir/hooks"
    mkdir -p "$hooks_dir"

    local hook_file="$hooks_dir/post-commit"

    # Don't overwrite existing hook that isn't ours
    if [[ -f "$hook_file" ]] && ! grep -q 'campsite-collector' "$hook_file" 2>/dev/null; then
        # Append to existing hook
        cat >> "$hook_file" <<'HOOKEOF'

# --- campsite-collector post-commit hook ---
if command -v campsite >/dev/null 2>&1; then
    _cs_root="$(git rev-parse --show-toplevel 2>/dev/null)"
    if [[ -d "$_cs_root/.campsite" ]]; then
        _cs_hash="$(git rev-parse HEAD 2>/dev/null)"
        _cs_author="$(git log -1 --format='%an' 2>/dev/null)"
        _cs_subject="$(git log -1 --format='%s' 2>/dev/null)"
        _cs_stat="$(git diff --stat HEAD~1..HEAD 2>/dev/null | tail -1)"
        _cs_files="$(printf '%s' "$_cs_stat" | sed -n 's/[[:space:]]*\([0-9][0-9]*\) file.*/\1/p')"
        _cs_ins="$(printf '%s' "$_cs_stat" | sed -n 's/.*\([0-9][0-9]*\) insertion.*/\1/p')"
        _cs_del="$(printf '%s' "$_cs_stat" | sed -n 's/.*\([0-9][0-9]*\) deletion.*/\1/p')"
        _cs_ts="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
        printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\n' \
            "$_cs_ts" "$_cs_hash" "$_cs_author" "$_cs_subject" "${_cs_files:-0}" "${_cs_ins:-0}" "${_cs_del:-0}" \
            >> "$_cs_root/.campsite/signals/commits.tsv" 2>/dev/null
        printf '%s\tcommit\t%s: %s (%s files)\tgit\n' \
            "$_cs_ts" "$_cs_author" "$_cs_subject" "${_cs_files:-0}" \
            >> "$_cs_root/.campsite/signals/events.tsv" 2>/dev/null
        touch "$_cs_root/.campsite/signals/last-activity" 2>/dev/null
    fi
fi
# --- end campsite-collector ---
HOOKEOF
        chmod +x "$hook_file"
        return 0
    fi

    # If no existing hook or it's already ours, write fresh
    if [[ -f "$hook_file" ]] && grep -q 'campsite-collector' "$hook_file" 2>/dev/null; then
        return 0  # Already installed
    fi

    cat > "$hook_file" <<'HOOKEOF'
#!/usr/bin/env bash
# campsite-collector post-commit hook
# Auto-records commits to .campsite/signals/commits.tsv

_cs_root="$(git rev-parse --show-toplevel 2>/dev/null)"
if [[ -d "$_cs_root/.campsite" ]]; then
    _cs_hash="$(git rev-parse HEAD 2>/dev/null)"
    _cs_author="$(git log -1 --format='%an' 2>/dev/null)"
    _cs_subject="$(git log -1 --format='%s' 2>/dev/null)"
    _cs_stat="$(git diff --stat HEAD~1..HEAD 2>/dev/null | tail -1)"
    _cs_files="$(printf '%s' "$_cs_stat" | sed -n 's/[[:space:]]*\([0-9][0-9]*\) file.*/\1/p')"
    _cs_ins="$(printf '%s' "$_cs_stat" | sed -n 's/.*\([0-9][0-9]*\) insertion.*/\1/p')"
    _cs_del="$(printf '%s' "$_cs_stat" | sed -n 's/.*\([0-9][0-9]*\) deletion.*/\1/p')"
    _cs_ts="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"

    # Ensure signals directory + headers
    mkdir -p "$_cs_root/.campsite/signals"
    if [[ ! -f "$_cs_root/.campsite/signals/commits.tsv" ]]; then
        printf 'timestamp\tcommit_hash\tauthor\tsubject\tfiles_changed\tinsertions\tdeletions\n' \
            > "$_cs_root/.campsite/signals/commits.tsv"
    fi
    if [[ ! -f "$_cs_root/.campsite/signals/events.tsv" ]]; then
        printf 'timestamp\ttype\tdescription\tsource\n' \
            > "$_cs_root/.campsite/signals/events.tsv"
    fi

    printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\n' \
        "$_cs_ts" "$_cs_hash" "$_cs_author" "$_cs_subject" "${_cs_files:-0}" "${_cs_ins:-0}" "${_cs_del:-0}" \
        >> "$_cs_root/.campsite/signals/commits.tsv" 2>/dev/null

    printf '%s\tcommit\t%s: %s (%s files)\tgit\n' \
        "$_cs_ts" "$_cs_author" "$_cs_subject" "${_cs_files:-0}" \
        >> "$_cs_root/.campsite/signals/events.tsv" 2>/dev/null

    touch "$_cs_root/.campsite/signals/last-activity" 2>/dev/null
fi
HOOKEOF
    chmod +x "$hook_file"
}
