#!/usr/bin/env bats

load '../test_helper'

setup() {
    setup_temp_dir
    load_campsite_libs
    source "$CAMPSITE_LIB/collector.sh"
    source "$CAMPSITE_LIB/agent.sh"
    source "$CAMPSITE_LIB/firestate.sh"
    source "$CAMPSITE_LIB/camp.sh"
    create_test_project
}

teardown() {
    teardown_temp_dir
}

# ---------------------------------------------------------------------------
# camp_html_escape
# ---------------------------------------------------------------------------

@test "camp_html_escape escapes ampersand" {
    result="$(printf 'a & b' | camp_html_escape)"
    [[ "$result" == "a &amp; b" ]]
}

@test "camp_html_escape escapes angle brackets" {
    result="$(printf '<script>' | camp_html_escape)"
    [[ "$result" == "&lt;script&gt;" ]]
}

@test "camp_html_escape escapes double quotes" {
    result="$(printf '"value"' | camp_html_escape)"
    [[ "$result" == "&quot;value&quot;" ]]
}

@test "camp_html_escape escapes single quotes" {
    result="$(printf "it's" | camp_html_escape)"
    [[ "$result" == "it&#39;s" ]]
}

# ---------------------------------------------------------------------------
# camp_clean_text
# ---------------------------------------------------------------------------

@test "camp_clean_text replaces tabs with spaces" {
    result="$(printf 'a\tb' | camp_clean_text)"
    [[ "$result" == "a b" ]]
}

@test "camp_clean_text collapses multiple spaces" {
    result="$(printf 'a   b' | camp_clean_text)"
    [[ "$result" == "a b" ]]
}

@test "camp_clean_text strips leading and trailing spaces" {
    result="$(printf ' hello ' | camp_clean_text)"
    [[ "$result" == "hello" ]]
}

# ---------------------------------------------------------------------------
# camp_state_priority
# ---------------------------------------------------------------------------

@test "camp_state_priority: yeongi has highest priority (1)" {
    [[ "$(camp_state_priority "yeongi")" == "1" ]]
}

@test "camp_state_priority: bulssi has lowest named priority (5)" {
    [[ "$(camp_state_priority "bulssi")" == "5" ]]
}

@test "camp_state_priority: unknown state returns 9" {
    [[ "$(camp_state_priority "unknown")" == "9" ]]
}

@test "camp_state_priority ordering is correct" {
    local yeongi deungbul jangjak modakbul bulssi
    yeongi="$(camp_state_priority "yeongi")"
    deungbul="$(camp_state_priority "deungbul")"
    jangjak="$(camp_state_priority "jangjak")"
    modakbul="$(camp_state_priority "modakbul")"
    bulssi="$(camp_state_priority "bulssi")"
    [[ "$yeongi" -lt "$deungbul" ]]
    [[ "$deungbul" -lt "$jangjak" ]]
    [[ "$jangjak" -lt "$modakbul" ]]
    [[ "$modakbul" -lt "$bulssi" ]]
}

# ---------------------------------------------------------------------------
# camp_validate_state
# ---------------------------------------------------------------------------

@test "camp_validate_state accepts bulssi" {
    run camp_validate_state "bulssi"
    [[ "$status" -eq 0 ]]
}

@test "camp_validate_state accepts all valid states" {
    for s in bulssi modakbul deungbul yeongi jangjak; do
        run camp_validate_state "$s"
        [[ "$status" -eq 0 ]]
    done
}

@test "camp_validate_state rejects unknown state" {
    run camp_validate_state "invalid_state"
    [[ "$status" -ne 0 ]]
}

# ---------------------------------------------------------------------------
# camp_session_participant_id
# ---------------------------------------------------------------------------

@test "camp_session_participant_id produces lowercase slug" {
    result="$(camp_session_participant_id "Claude" "12345")"
    [[ "$result" == "session-claude-12345" ]]
}

@test "camp_session_participant_id replaces spaces with dashes" {
    result="$(camp_session_participant_id "my tool" "999")"
    [[ "$result" == "session-my-tool-999" ]]
}

# ---------------------------------------------------------------------------
# camp_ensure_store
# ---------------------------------------------------------------------------

@test "camp_ensure_store creates camp directory" {
    camp_ensure_store "$TEST_PROJECT"
    [[ -d "$TEST_PROJECT/.campsite/camp" ]]
}

@test "camp_ensure_store creates mission.meta file" {
    camp_ensure_store "$TEST_PROJECT"
    [[ -f "$TEST_PROJECT/.campsite/camp/mission.meta" ]]
}

@test "camp_ensure_store creates participants.tsv with header" {
    camp_ensure_store "$TEST_PROJECT"
    local f="$TEST_PROJECT/.campsite/camp/participants.tsv"
    [[ -f "$f" ]]
    head -1 "$f" | grep -q "id"
    head -1 "$f" | grep -q "fire_state"
}

@test "camp_ensure_store creates events.tsv with header" {
    camp_ensure_store "$TEST_PROJECT"
    local f="$TEST_PROJECT/.campsite/camp/events.tsv"
    [[ -f "$f" ]]
    head -1 "$f" | grep -q "created_at"
    head -1 "$f" | grep -q "from_state"
}

@test "camp_ensure_store is idempotent" {
    camp_ensure_store "$TEST_PROJECT"
    local participants_f="$TEST_PROJECT/.campsite/camp/participants.tsv"
    printf 'dummy_row\n' >> "$participants_f"
    local lines_before
    lines_before="$(wc -l < "$participants_f" | tr -d ' ')"
    camp_ensure_store "$TEST_PROJECT"
    local lines_after
    lines_after="$(wc -l < "$participants_f" | tr -d ' ')"
    [[ "$lines_after" -eq "$lines_before" ]]
}

# ---------------------------------------------------------------------------
# camp_participant_upsert / camp_participant_get
# ---------------------------------------------------------------------------

@test "camp_participant_upsert inserts a new participant" {
    camp_ensure_store "$TEST_PROJECT"
    camp_participant_upsert "$TEST_PROJECT" "p-001" "Claude" "agent" "claude" "terminal-1" "bulssi" "Working on tests" "" "Write tests" "50"
    result="$(camp_participant_get "$TEST_PROJECT" "p-001")"
    [[ -n "$result" ]]
}

@test "camp_participant_upsert stores correct participant id" {
    camp_ensure_store "$TEST_PROJECT"
    camp_participant_upsert "$TEST_PROJECT" "p-abc" "Gemini" "agent" "gemini" "term-2" "modakbul" "Summary" "" "Next step" "30"
    local id_col
    id_col="$(camp_participant_get "$TEST_PROJECT" "p-abc" | awk -F'\t' '{print $1}')"
    [[ "$id_col" == "p-abc" ]]
}

@test "camp_participant_upsert stores correct fire_state" {
    camp_ensure_store "$TEST_PROJECT"
    camp_participant_upsert "$TEST_PROJECT" "p-state" "Bot" "agent" "bot" "term-3" "yeongi" "Error state" "Blocker" "Fix error" "10"
    local state_col
    state_col="$(camp_participant_get "$TEST_PROJECT" "p-state" | awk -F'\t' '{print $6}')"
    [[ "$state_col" == "yeongi" ]]
}

@test "camp_participant_upsert updates existing participant (no duplicate rows)" {
    camp_ensure_store "$TEST_PROJECT"
    camp_participant_upsert "$TEST_PROJECT" "p-upd" "Agent" "agent" "tool" "term" "bulssi" "First" "" "Step 1" "50"
    camp_participant_upsert "$TEST_PROJECT" "p-upd" "Agent" "agent" "tool" "term" "modakbul" "Second" "" "Step 2" "50"

    local participants_f="$TEST_PROJECT/.campsite/camp/participants.tsv"
    local count
    count="$(awk -F'\t' '$1 == "p-upd"' "$participants_f" | wc -l | tr -d ' ')"
    [[ "$count" -eq 1 ]]
}

@test "camp_participant_upsert updates fire_state on second upsert" {
    camp_ensure_store "$TEST_PROJECT"
    camp_participant_upsert "$TEST_PROJECT" "p-chg" "X" "agent" "x" "t" "bulssi" "S" "" "N" "50"
    camp_participant_upsert "$TEST_PROJECT" "p-chg" "X" "agent" "x" "t" "jangjak" "S2" "" "N2" "50"
    local state_col
    state_col="$(camp_participant_get "$TEST_PROJECT" "p-chg" | awk -F'\t' '{print $6}')"
    [[ "$state_col" == "jangjak" ]]
}

@test "camp_participant_get returns empty for nonexistent participant" {
    camp_ensure_store "$TEST_PROJECT"
    result="$(camp_participant_get "$TEST_PROJECT" "nonexistent-id")"
    [[ -z "$result" ]]
}

@test "camp_participant_upsert rejects invalid fire_state" {
    camp_ensure_store "$TEST_PROJECT"
    run camp_participant_upsert "$TEST_PROJECT" "p-bad" "X" "agent" "x" "t" "invalid" "S" "" "N" "50"
    [[ "$status" -ne 0 ]]
}

# ---------------------------------------------------------------------------
# camp_participant_count
# ---------------------------------------------------------------------------

@test "camp_participant_count returns 0 for empty store" {
    camp_ensure_store "$TEST_PROJECT"
    result="$(camp_participant_count "$TEST_PROJECT")"
    [[ "$result" == "0" ]]
}

@test "camp_participant_count returns correct count after inserts" {
    camp_ensure_store "$TEST_PROJECT"
    camp_participant_upsert "$TEST_PROJECT" "p-c1" "A" "agent" "a" "t" "bulssi" "S" "" "N" "50"
    camp_participant_upsert "$TEST_PROJECT" "p-c2" "B" "agent" "b" "t" "modakbul" "S" "" "N" "50"
    result="$(camp_participant_count "$TEST_PROJECT")"
    [[ "$result" == "2" ]]
}

# ---------------------------------------------------------------------------
# camp_event_append
# ---------------------------------------------------------------------------

@test "camp_event_append adds a row to events.tsv" {
    camp_ensure_store "$TEST_PROJECT"
    camp_event_append "$TEST_PROJECT" "p-001" "bulssi" "modakbul" "Transitioned"
    local count
    count="$(awk 'NR > 1' "$(camp_events_path "$TEST_PROJECT")" | wc -l | tr -d ' ')"
    [[ "$count" -eq 1 ]]
}

@test "camp_event_append records correct from/to states" {
    camp_ensure_store "$TEST_PROJECT"
    camp_event_append "$TEST_PROJECT" "p-ev" "yeongi" "deungbul" "Recovered"
    local from_col to_col
    from_col="$(awk -F'\t' 'NR == 2 { print $3 }' "$(camp_events_path "$TEST_PROJECT")")"
    to_col="$(awk -F'\t' 'NR == 2 { print $4 }' "$(camp_events_path "$TEST_PROJECT")")"
    [[ "$from_col" == "yeongi" ]]
    [[ "$to_col" == "deungbul" ]]
}

# ---------------------------------------------------------------------------
# camp_session_start
# ---------------------------------------------------------------------------

@test "camp_session_start returns a participant id" {
    result="$(camp_session_start "$TEST_PROJECT" "claude" "$$" "terminal-1")"
    [[ -n "$result" ]]
    [[ "$result" == session-claude-* ]]
}

@test "camp_session_start inserts participant into store" {
    local pid="$$"
    local participant_id
    participant_id="$(camp_session_start "$TEST_PROJECT" "claude" "$pid" "terminal-1")"
    result="$(camp_participant_get "$TEST_PROJECT" "$participant_id")"
    [[ -n "$result" ]]
}

@test "camp_session_start writes session snapshot file" {
    local pid="$$"
    local participant_id
    participant_id="$(camp_session_start "$TEST_PROJECT" "claude" "$pid" "terminal-1")"
    local snapshot
    snapshot="$(camp_session_snapshot_path "$TEST_PROJECT" "$participant_id")"
    [[ -f "$snapshot" ]]
}

@test "camp_session_start records a session_start event" {
    camp_session_start "$TEST_PROJECT" "claude" "$$" "terminal-1" >/dev/null
    local count
    count="$(awk -F'\t' 'NR > 1 && $2 == "session_start"' "$TEST_PROJECT/.campsite/signals/events.tsv" 2>/dev/null | wc -l | tr -d ' ')"
    [[ "$count" -ge 1 ]]
}

# ---------------------------------------------------------------------------
# camp_session_finish
# ---------------------------------------------------------------------------

@test "camp_session_finish updates participant state to yeongi on abnormal outcome" {
    local pid="$$"
    local participant_id
    participant_id="$(camp_session_start "$TEST_PROJECT" "claude" "$pid" "terminal-1")"
    camp_session_finish "$TEST_PROJECT" "claude" "$pid" "crash" "0"
    local state_col
    state_col="$(camp_participant_get "$TEST_PROJECT" "$participant_id" | awk -F'\t' '{print $6}')"
    [[ "$state_col" == "yeongi" ]]
}

@test "camp_session_finish updates participant state to deungbul when state_changed=1" {
    local pid="$$"
    local participant_id
    participant_id="$(camp_session_start "$TEST_PROJECT" "claude" "$pid" "terminal-1")"
    camp_session_finish "$TEST_PROJECT" "claude" "$pid" "normal" "1"
    local state_col
    state_col="$(camp_participant_get "$TEST_PROJECT" "$participant_id" | awk -F'\t' '{print $6}')"
    [[ "$state_col" == "deungbul" ]]
}

@test "camp_session_finish removes session snapshot file" {
    local pid="$$"
    local participant_id
    participant_id="$(camp_session_start "$TEST_PROJECT" "claude" "$pid" "terminal-1")"
    local snapshot
    snapshot="$(camp_session_snapshot_path "$TEST_PROJECT" "$participant_id")"
    camp_session_finish "$TEST_PROJECT" "claude" "$pid" "normal" "0"
    [[ ! -f "$snapshot" ]]
}

@test "camp_session_finish is a no-op for nonexistent participant" {
    run camp_session_finish "$TEST_PROJECT" "ghost" "00000" "normal" "0"
    [[ "$status" -eq 0 ]]
}

# ---------------------------------------------------------------------------
# relative_time
# ---------------------------------------------------------------------------

@test "relative_time: seconds < 60 returns Xs ago" {
    local ts
    ts="$(date -v-5S +%Y-%m-%dT%H:%M:%S)"
    result="$(relative_time "$ts")"
    [[ "$result" =~ ^[0-9]+s\ ago$ ]]
}

@test "relative_time: 65 seconds ago returns 1m ago" {
    local ts
    ts="$(date -v-65S +%Y-%m-%dT%H:%M:%S)"
    result="$(relative_time "$ts")"
    [[ "$result" == "1m ago" ]]
}

@test "relative_time: 2 hours ago returns 2h ago" {
    local ts
    ts="$(date -v-7200S +%Y-%m-%dT%H:%M:%S)"
    result="$(relative_time "$ts")"
    [[ "$result" == "2h ago" ]]
}
