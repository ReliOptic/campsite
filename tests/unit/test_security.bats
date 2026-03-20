#!/usr/bin/env bats

load '../test_helper'

setup() {
    setup_temp_dir
    load_campsite_libs
}

teardown() {
    teardown_temp_dir
}

# --- scan_credentials tests ---

@test "scan_credentials detects API key pattern" {
    cat > "$TEST_TEMP_DIR/test.md" << 'EOF'
api_key: sk-1234567890abcdef
EOF
    
    run scan_credentials "$TEST_TEMP_DIR/test.md"
    [[ "$status" -ne 0 ]]
}

@test "scan_credentials detects password pattern" {
    cat > "$TEST_TEMP_DIR/test.md" << 'EOF'
password: mysecretpassword123
EOF
    
    run scan_credentials "$TEST_TEMP_DIR/test.md"
    [[ "$status" -ne 0 ]]
}

@test "scan_credentials passes clean file" {
    cat > "$TEST_TEMP_DIR/test.md" << 'EOF'
# Project Status

- phase: building
- task: implement feature
EOF
    
    run scan_credentials "$TEST_TEMP_DIR/test.md"
    [[ "$status" -eq 0 ]]
}

@test "scan_credentials ignores comments" {
    cat > "$TEST_TEMP_DIR/test.md" << 'EOF'
# api_key: should be ignored
// password: also ignored
<!-- secret: html comment -->
EOF
    
    run scan_credentials "$TEST_TEMP_DIR/test.md"
    [[ "$status" -eq 0 ]]
}

# --- scan_project_files tests ---

@test "scan_project_files checks all source files" {
    create_test_project "$TEST_PROJECT"
    
    run scan_project_files "$TEST_PROJECT"
    [[ "$status" -eq 0 ]]
}

@test "scan_project_files detects credentials in status.md" {
    create_test_project "$TEST_PROJECT"
    echo "api_key: secret123" >> "$TEST_PROJECT/status.md"
    
    run scan_project_files "$TEST_PROJECT"
    [[ "$status" -ne 0 ]]
}
