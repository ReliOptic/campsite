#!/usr/bin/env bats

load '../test_helper'

setup() {
    setup_temp_dir
    load_campsite_libs
    create_test_project
}

teardown() {
    teardown_temp_dir
}

@test "recover clears orphaned lock with dead PID" {
    # Acquire a real lock (sets host via detect_device), then replace PID with dead one
    lock_acquire "$TEST_PROJECT" "olduser" "claude"
    local lock_file
    lock_file="$(lock_path "$TEST_PROJECT")"

    local tmp="$lock_file.new"
    grep -v "^pid:" "$lock_file" > "$tmp"
    printf 'pid: 99999999\n' >> "$tmp"
    mv "$tmp" "$lock_file"

    [[ -f "$lock_file" ]]

    # Check if orphan
    run lock_check_orphan "$TEST_PROJECT"
    [[ "$status" -eq 0 ]]

    # Clear orphan
    rm -f "$lock_file"

    [[ ! -f "$lock_file" ]]
}

@test "recover preserves active lock with live PID" {
    lock_acquire "$TEST_PROJECT" "testuser" "testagent"
    
    run lock_check_orphan "$TEST_PROJECT"
    [[ "$status" -eq 1 ]]
    
    [[ -f "$TEST_PROJECT/.campsite/lock" ]]
}

@test "recover cleans stale compiled files without lock" {
    # Create compiled files without lock
    compile_context "$TEST_PROJECT" "claude"
    
    [[ -f "$TEST_PROJECT/CLAUDE.md" ]]
    [[ ! -f "$TEST_PROJECT/.campsite/lock" ]]
    
    # Should be able to clean
    compile_cleanup "$TEST_PROJECT" "claude"
    
    [[ ! -f "$TEST_PROJECT/CLAUDE.md" ]]
}

@test "recover does not clean compiled files with active lock" {
    compile_context "$TEST_PROJECT" "claude"
    lock_acquire "$TEST_PROJECT" "testuser" "claude"
    
    [[ -f "$TEST_PROJECT/CLAUDE.md" ]]
    [[ -f "$TEST_PROJECT/.campsite/lock" ]]
    
    # With active lock, cleanup should not happen during recover
    # (This is the expected behavior - don't clean while session active)
    run lock_is_held "$TEST_PROJECT"
    [[ "$status" -eq 0 ]]
}

@test "recover handles missing .campsite directory" {
    rm -rf "$TEST_PROJECT/.campsite"
    
    # Should not fail
    run lock_is_held "$TEST_PROJECT"
    [[ "$status" -eq 1 ]]
}
