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
