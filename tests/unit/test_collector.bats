#!/usr/bin/env bats

load '../test_helper'

setup() {
    setup_temp_dir
    load_campsite_libs
    source "$CAMPSITE_LIB/collector.sh"
    create_test_project
}

teardown() {
    teardown_temp_dir
}

# ---------------------------------------------------------------------------
# collector_ensure_store
# ---------------------------------------------------------------------------

@test "collector_ensure_store creates signals directory" {
    collector_ensure_store "$TEST_PROJECT"
    [[ -d "$TEST_PROJECT/.campsite/signals" ]]
}

@test "collector_ensure_store creates commits.tsv with header" {
    collector_ensure_store "$TEST_PROJECT"
    local f="$TEST_PROJECT/.campsite/signals/commits.tsv"
    [[ -f "$f" ]]
    head -1 "$f" | grep -q "timestamp"
    head -1 "$f" | grep -q "commit_hash"
}

@test "collector_ensure_store creates events.tsv with header" {
    collector_ensure_store "$TEST_PROJECT"
    local f="$TEST_PROJECT/.campsite/signals/events.tsv"
    [[ -f "$f" ]]
    head -1 "$f" | grep -q "timestamp"
    head -1 "$f" | grep -q "type"
}

@test "collector_ensure_store creates git-snapshot.tsv with header" {
    collector_ensure_store "$TEST_PROJECT"
    local f="$TEST_PROJECT/.campsite/signals/git-snapshot.tsv"
    [[ -f "$f" ]]
    head -1 "$f" | grep -q "timestamp"
}

@test "collector_ensure_store creates file-activity.tsv with header" {
    collector_ensure_store "$TEST_PROJECT"
    local f="$TEST_PROJECT/.campsite/signals/file-activity.tsv"
    [[ -f "$f" ]]
    head -1 "$f" | grep -q "timestamp"
}

@test "collector_ensure_store creates last-activity sentinel file" {
    collector_ensure_store "$TEST_PROJECT"
    [[ -f "$TEST_PROJECT/.campsite/signals/last-activity" ]]
}

@test "collector_ensure_store is idempotent — does not overwrite existing store" {
    collector_ensure_store "$TEST_PROJECT"
    local commits_f="$TEST_PROJECT/.campsite/signals/commits.tsv"
    # Append a data row
    printf '2026-01-01T00:00:00Z\tabc123\tAuthor\tSubject\t1\t2\t3\n' >> "$commits_f"
    local lines_before
    lines_before="$(wc -l < "$commits_f" | tr -d ' ')"

    # Second call must not truncate
    collector_ensure_store "$TEST_PROJECT"
    local lines_after
    lines_after="$(wc -l < "$commits_f" | tr -d ' ')"
    [[ "$lines_after" -eq "$lines_before" ]]
}

# ---------------------------------------------------------------------------
# collector_record_event
# ---------------------------------------------------------------------------

@test "collector_record_event appends an event row" {
    collector_ensure_store "$TEST_PROJECT"
    collector_record_event "$TEST_PROJECT" "test_event" "something happened" "bats"
    local events_f="$TEST_PROJECT/.campsite/signals/events.tsv"
    local count
    count="$(awk 'NR > 1' "$events_f" | wc -l | tr -d ' ')"
    [[ "$count" -eq 1 ]]
}

@test "collector_record_event sanitises tab characters in description" {
    collector_ensure_store "$TEST_PROJECT"
    collector_record_event "$TEST_PROJECT" "test_event" "$(printf 'has\ttab')" "bats"
    local events_f="$TEST_PROJECT/.campsite/signals/events.tsv"
    # Third field must not contain a raw tab (would shift columns)
    local desc_field
    desc_field="$(awk -F'\t' 'NR == 2 { print $3 }' "$events_f")"
    [[ "$desc_field" != *$'\t'* ]]
}

@test "collector_record_event touches last-activity sentinel" {
    collector_ensure_store "$TEST_PROJECT"
    local sentinel="$TEST_PROJECT/.campsite/signals/last-activity"
    local before
    before="$(stat -f '%m' "$sentinel" 2>/dev/null || stat -c '%Y' "$sentinel" 2>/dev/null)"
    sleep 1
    collector_record_event "$TEST_PROJECT" "ping" "test" "bats"
    local after
    after="$(stat -f '%m' "$sentinel" 2>/dev/null || stat -c '%Y' "$sentinel" 2>/dev/null)"
    [[ "$after" -ge "$before" ]]
}

# ---------------------------------------------------------------------------
# collector_record_commit
# ---------------------------------------------------------------------------

@test "collector_record_commit appends a commit row" {
    collector_ensure_store "$TEST_PROJECT"
    collector_record_commit "$TEST_PROJECT" "abc123" "Author" "Initial commit" "3" "10" "2"
    local commits_f="$TEST_PROJECT/.campsite/signals/commits.tsv"
    local count
    count="$(awk 'NR > 1' "$commits_f" | wc -l | tr -d ' ')"
    [[ "$count" -eq 1 ]]
}

@test "collector_record_commit records commit data in correct columns" {
    collector_ensure_store "$TEST_PROJECT"
    collector_record_commit "$TEST_PROJECT" "deadbeef" "Jane" "Fix bug" "1" "5" "0"
    local commits_f="$TEST_PROJECT/.campsite/signals/commits.tsv"
    local hash_col
    hash_col="$(awk -F'\t' 'NR == 2 { print $2 }' "$commits_f")"
    [[ "$hash_col" == "deadbeef" ]]
}

@test "collector_record_commit also records an event" {
    collector_ensure_store "$TEST_PROJECT"
    collector_record_commit "$TEST_PROJECT" "abc123" "Author" "Subject" "1" "1" "0"
    local events_f="$TEST_PROJECT/.campsite/signals/events.tsv"
    local count
    count="$(awk 'NR > 1' "$events_f" | wc -l | tr -d ' ')"
    [[ "$count" -ge 1 ]]
}

# ---------------------------------------------------------------------------
# collector_recent_commits_count
# ---------------------------------------------------------------------------

@test "collector_recent_commits_count returns 0 when no commits file" {
    result="$(collector_recent_commits_count "$TEST_PROJECT" 3600)"
    [[ "$result" == "0" ]]
}

@test "collector_recent_commits_count returns 0 for empty store" {
    collector_ensure_store "$TEST_PROJECT"
    result="$(collector_recent_commits_count "$TEST_PROJECT" 3600)"
    [[ "$result" == "0" ]]
}

@test "collector_recent_commits_count counts data rows excluding header" {
    collector_ensure_store "$TEST_PROJECT"
    collector_record_commit "$TEST_PROJECT" "aaa" "A" "Commit 1" "1" "1" "0"
    collector_record_commit "$TEST_PROJECT" "bbb" "B" "Commit 2" "2" "2" "0"
    result="$(collector_recent_commits_count "$TEST_PROJECT" 3600)"
    [[ "$result" == "2" ]]
}

# ---------------------------------------------------------------------------
# collector_rotate_tsv
# ---------------------------------------------------------------------------

@test "collector_rotate_tsv does nothing when file does not exist" {
    run collector_rotate_tsv "$TEST_TEMP_DIR/nonexistent.tsv" 10 5
    [[ "$status" -eq 0 ]]
}

@test "collector_rotate_tsv does nothing when under max_lines" {
    local f="$TEST_TEMP_DIR/test.tsv"
    printf 'header\n' > "$f"
    for i in $(seq 1 5); do
        printf 'row%s\n' "$i" >> "$f"
    done
    local lines_before
    lines_before="$(wc -l < "$f" | tr -d ' ')"
    collector_rotate_tsv "$f" 10 5
    local lines_after
    lines_after="$(wc -l < "$f" | tr -d ' ')"
    [[ "$lines_after" -eq "$lines_before" ]]
}

@test "collector_rotate_tsv trims to keep_lines + header when over max_lines" {
    local f="$TEST_TEMP_DIR/test.tsv"
    printf 'col1\tcol2\n' > "$f"
    for i in $(seq 1 20); do
        printf 'row%s\tval%s\n' "$i" "$i" >> "$f"
    done
    # 21 lines total (1 header + 20 data). max=10, keep=5
    collector_rotate_tsv "$f" 10 5
    local lines_after
    lines_after="$(wc -l < "$f" | tr -d ' ')"
    # expect: 1 header + 5 data = 6
    [[ "$lines_after" -eq 6 ]]
}

@test "collector_rotate_tsv preserves header row after rotation" {
    local f="$TEST_TEMP_DIR/test.tsv"
    printf 'timestamp\ttype\tdescription\tsource\n' > "$f"
    for i in $(seq 1 20); do
        printf 'ts%s\ttype%s\tdesc%s\tsrc%s\n' "$i" "$i" "$i" "$i" >> "$f"
    done
    collector_rotate_tsv "$f" 10 5
    local header
    header="$(head -1 "$f")"
    [[ "$header" == "timestamp	type	description	source" ]]
}

@test "collector_rotate_tsv keeps the most recent rows" {
    local f="$TEST_TEMP_DIR/test.tsv"
    printf 'header\n' > "$f"
    for i in $(seq 1 20); do
        printf 'row%s\n' "$i" >> "$f"
    done
    collector_rotate_tsv "$f" 10 5
    # Last row must be row20 (most recent)
    local last_row
    last_row="$(tail -1 "$f")"
    [[ "$last_row" == "row20" ]]
}

# ---------------------------------------------------------------------------
# collector_last_activity_ts
# ---------------------------------------------------------------------------

@test "collector_last_activity_ts returns 0 when no sentinel" {
    result="$(collector_last_activity_ts "$TEST_PROJECT")"
    [[ "$result" == "0" ]]
}

@test "collector_last_activity_ts returns nonzero after ensure_store" {
    collector_ensure_store "$TEST_PROJECT"
    result="$(collector_last_activity_ts "$TEST_PROJECT")"
    [[ "$result" -gt 0 ]]
}

# ---------------------------------------------------------------------------
# collector_recent_events
# ---------------------------------------------------------------------------

@test "collector_recent_events returns empty when no events file" {
    result="$(collector_recent_events "$TEST_PROJECT" 5)"
    [[ -z "$result" ]]
}

@test "collector_recent_events returns at most limit lines" {
    collector_ensure_store "$TEST_PROJECT"
    for i in $(seq 1 10); do
        collector_record_event "$TEST_PROJECT" "type$i" "desc$i" "src"
    done
    count="$(collector_recent_events "$TEST_PROJECT" 3 | wc -l | tr -d ' ')"
    [[ "$count" -eq 3 ]]
}
