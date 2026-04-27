#!/usr/bin/env bats

load '../test_helper'

setup() {
    setup_temp_dir
    load_campsite_libs
}

teardown() {
    teardown_temp_dir
}

# --- field_value tests ---

@test "field_value extracts value from markdown list" {
    cat > "$TEST_TEMP_DIR/test.md" << 'EOF'
# Test

- phase: building
- confidence: high
EOF
    
    result="$(field_value "$TEST_TEMP_DIR/test.md" "phase")"
    [[ "$result" == "building" ]]
}

@test "field_value returns empty for missing field" {
    cat > "$TEST_TEMP_DIR/test.md" << 'EOF'
# Test

- phase: building
EOF
    
    result="$(field_value "$TEST_TEMP_DIR/test.md" "missing")"
    [[ -z "$result" ]]
}

@test "field_value handles spaces in value" {
    cat > "$TEST_TEMP_DIR/test.md" << 'EOF'
- task: implement new feature
EOF
    
    result="$(field_value "$TEST_TEMP_DIR/test.md" "task")"
    [[ "$result" == "implement new feature" ]]
}

# --- field_value_plain tests ---

@test "field_value_plain extracts from key: value format" {
    cat > "$TEST_TEMP_DIR/test.txt" << 'EOF'
name: claude
command: claude
EOF
    
    result="$(field_value_plain "$TEST_TEMP_DIR/test.txt" "name")"
    [[ "$result" == "claude" ]]
}

# --- slug_from_path tests ---

@test "slug_from_path converts path to lowercase slug" {
    result="$(slug_from_path "/path/to/My-Project")"
    [[ "$result" == "my-project" ]]
}

@test "slug_from_path handles spaces and special chars" {
    result="$(slug_from_path "/path/to/My Project (v2)")"
    [[ "$result" == "my-project-v2" ]]
}

@test "slug_from_path removes leading/trailing dashes" {
    result="$(slug_from_path "/path/to/--test--")"
    [[ "$result" == "test" ]]
}

# --- resolve_path tests ---

@test "resolve_path returns absolute path for existing directory" {
    mkdir -p "$TEST_TEMP_DIR/subdir"
    cd "$TEST_TEMP_DIR"
    
    result="$(resolve_path "subdir")"
    [[ "$result" == "$TEST_TEMP_DIR/subdir" ]]
}

@test "resolve_path returns absolute path unchanged" {
    mkdir -p "$TEST_TEMP_DIR/subdir"
    
    result="$(resolve_path "$TEST_TEMP_DIR/subdir")"
    [[ "$result" == "$TEST_TEMP_DIR/subdir" ]]
}

@test "resolve_path handles new file in existing directory" {
    result="$(resolve_path "$TEST_TEMP_DIR/newfile.txt")"
    [[ "$result" == "$TEST_TEMP_DIR/newfile.txt" ]]
}

@test "resolve_path fails for non-existent parent" {
    run resolve_path "$TEST_TEMP_DIR/nonexistent/dir/file.txt"
    [[ "$status" -ne 0 ]]
}

# --- campsite_global_dir tests ---

@test "campsite_global_dir returns CAMPSITE_HOME" {
    export CAMPSITE_HOME="$TEST_TEMP_DIR/.campsite"
    
    result="$(campsite_global_dir)"
    [[ "$result" == "$TEST_TEMP_DIR/.campsite" ]]
    [[ -d "$result" ]]
}

# --- project_campsite_dir tests ---

@test "project_campsite_dir creates .campsite directory" {
    result="$(project_campsite_dir "$TEST_PROJECT")"
    [[ "$result" == "$TEST_PROJECT/.campsite" ]]
    [[ -d "$result" ]]
}

# --- now_iso tests ---

@test "now_iso returns ISO 8601 format" {
    result="$(now_iso)"
    [[ "$result" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$ ]]
}

# --- today_date tests ---

@test "today_date returns YYYY-MM-DD format" {
    result="$(today_date)"
    [[ "$result" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]
}

# --- freshness tests ---

@test "freshness_level_for_file returns fresh for new file" {
    touch "$TEST_TEMP_DIR/fresh.txt"
    result="$(freshness_level_for_file "$TEST_TEMP_DIR/fresh.txt")"
    [[ "$result" == "fresh" ]]
}

@test "freshness_label_for_file returns age label" {
    touch "$TEST_TEMP_DIR/fresh.txt"
    result="$(freshness_label_for_file "$TEST_TEMP_DIR/fresh.txt")"
    [[ "$result" == *"old" ]]
}

# --- project_freshness_level tests ---

@test "project_freshness_level returns fresh for new files" {
    touch "$TEST_TEMP_DIR/status.md" "$TEST_TEMP_DIR/handoff.md"
    result="$(project_freshness_level "$TEST_TEMP_DIR")"
    [[ "$result" == "fresh" ]]
}

@test "project_freshness_level returns worst level across files" {
    # status.md fresh, handoff.md ancient → worst is stale
    touch "$TEST_TEMP_DIR/status.md"
    touch -t "$(date -u -v-30d +%Y%m%d%H%M 2>/dev/null || date -u -d '30 days ago' +%Y%m%d%H%M)" "$TEST_TEMP_DIR/handoff.md"
    result="$(project_freshness_level "$TEST_TEMP_DIR")"
    [[ "$result" == "stale" ]]
}

# --- effective_confidence tests ---

@test "effective_confidence: fresh state preserves stated confidence" {
    [[ "$(effective_confidence high fresh)"   == "high"   ]]
    [[ "$(effective_confidence medium fresh)" == "medium" ]]
    [[ "$(effective_confidence low fresh)"    == "low"    ]]
}

@test "effective_confidence: aging state degrades one rank" {
    [[ "$(effective_confidence high aging)"   == "medium" ]]
    [[ "$(effective_confidence medium aging)" == "low"    ]]
    [[ "$(effective_confidence low aging)"    == "low"    ]]
}

@test "effective_confidence: stale state floors at low" {
    [[ "$(effective_confidence high stale)"   == "low" ]]
    [[ "$(effective_confidence medium stale)" == "low" ]]
    [[ "$(effective_confidence low stale)"    == "low" ]]
}

@test "effective_confidence: unknown stays unknown" {
    [[ "$(effective_confidence unknown stale)" == "unknown" ]]
    [[ "$(effective_confidence "" aging)"      == "unknown" ]]
}

# --- freshness_gate_action tests ---

@test "freshness_gate_action: fresh always proceeds" {
    [[ "$(freshness_gate_action fresh)" == "proceed" ]]
    CAMPSITE_FRESHNESS_POLICY=off  result="$(freshness_gate_action fresh)"
    [[ "$result" == "proceed" ]]
}

@test "freshness_gate_action: strict policy blocks stale, warns aging" {
    [[ "$(freshness_gate_action stale)" == "block" ]]
    [[ "$(freshness_gate_action aging)" == "warn"  ]]
}

@test "freshness_gate_action: warn policy never blocks" {
    CAMPSITE_FRESHNESS_POLICY=warn
    [[ "$(freshness_gate_action stale)" == "warn" ]]
    [[ "$(freshness_gate_action aging)" == "warn" ]]
}

@test "freshness_gate_action: off policy proceeds on everything" {
    CAMPSITE_FRESHNESS_POLICY=off
    [[ "$(freshness_gate_action stale)" == "proceed" ]]
    [[ "$(freshness_gate_action aging)" == "proceed" ]]
}
