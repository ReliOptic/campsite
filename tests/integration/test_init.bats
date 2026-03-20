#!/usr/bin/env bats

load '../test_helper'

setup() {
    setup_temp_dir
    load_campsite_libs
    
    # Source the main campsite script for cmd_* functions
    # But avoid running main()
    source "$PROJECT_ROOT/bin/campsite" 2>/dev/null || true
}

teardown() {
    teardown_temp_dir
}

@test "campsite init creates project structure" {
    cmd_init "$TEST_PROJECT"
    
    [[ -d "$TEST_PROJECT" ]]
    [[ -d "$TEST_PROJECT/.campsite" ]]
    [[ -d "$TEST_PROJECT/scripts" ]]
    [[ -d "$TEST_PROJECT/docs" ]]
    [[ -d "$TEST_PROJECT/src" ]]
    [[ -d "$TEST_PROJECT/tests" ]]
}

@test "campsite init creates required files" {
    cmd_init "$TEST_PROJECT"
    
    [[ -f "$TEST_PROJECT/README.md" ]]
    [[ -f "$TEST_PROJECT/status.md" ]]
    [[ -f "$TEST_PROJECT/handoff.md" ]]
    [[ -f "$TEST_PROJECT/decisions.md" ]]
    [[ -f "$TEST_PROJECT/.gitignore" ]]
}

@test "campsite init sets correct status.md header" {
    cmd_init "$TEST_PROJECT"
    
    head -1 "$TEST_PROJECT/status.md" | grep -q "# Status"
}

@test "campsite init sets correct handoff.md header" {
    cmd_init "$TEST_PROJECT"
    
    head -1 "$TEST_PROJECT/handoff.md" | grep -q "# Handoff"
}

@test "campsite init creates bootstrap script" {
    cmd_init "$TEST_PROJECT"
    
    [[ -f "$TEST_PROJECT/scripts/bootstrap.sh" ]]
    [[ -x "$TEST_PROJECT/scripts/bootstrap.sh" ]]
}

@test "campsite init is idempotent" {
    cmd_init "$TEST_PROJECT"
    echo "custom content" >> "$TEST_PROJECT/README.md"
    
    cmd_init "$TEST_PROJECT"
    
    # Should not overwrite existing files
    grep -q "custom content" "$TEST_PROJECT/README.md"
}

@test "campsite init replaces placeholders" {
    cmd_init "$TEST_PROJECT"
    
    # Should replace project-name with actual slug
    ! grep -q "project-name" "$TEST_PROJECT/status.md"
    
    # Should replace yyyy-mm-dd with actual date
    ! grep -q "yyyy-mm-dd" "$TEST_PROJECT/status.md"
}
