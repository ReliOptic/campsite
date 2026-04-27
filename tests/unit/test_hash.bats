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

# --- hash_compute tests ---

@test "hash_compute does not write known-hash file" {
    rm -f "$TEST_PROJECT/.campsite/known-hash"
    hash_compute "$TEST_PROJECT"

    [[ ! -f "$TEST_PROJECT/.campsite/known-hash" ]]
}

@test "hash_store creates known-hash file" {
    rm -f "$TEST_PROJECT/.campsite/known-hash"
    hash_store "$TEST_PROJECT"

    [[ -f "$TEST_PROJECT/.campsite/known-hash" ]]
}

@test "hash_compute returns consistent hash" {
    hash1="$(hash_compute "$TEST_PROJECT")"
    hash2="$(hash_compute "$TEST_PROJECT")"
    
    [[ "$hash1" == "$hash2" ]]
}

@test "hash_compute changes when source file changes" {
    hash1="$(hash_compute "$TEST_PROJECT")"
    
    echo "new content" >> "$TEST_PROJECT/status.md"
    hash2="$(hash_compute "$TEST_PROJECT")"
    
    [[ "$hash1" != "$hash2" ]]
}

# --- hash_compare tests ---

@test "hash_compare returns 0 when files unchanged" {
    hash_store "$TEST_PROJECT"
    
    run hash_compare "$TEST_PROJECT"
    [[ "$status" -eq 0 ]]
}

@test "hash_compare returns 1 when files changed" {
    hash_store "$TEST_PROJECT"
    
    echo "modified" >> "$TEST_PROJECT/status.md"
    
    run hash_compare "$TEST_PROJECT"
    [[ "$status" -eq 1 ]]
}

@test "hash_compare returns 2 when no stored hash" {
    rm -f "$TEST_PROJECT/.campsite/known-hash"
    
    run hash_compare "$TEST_PROJECT"
    [[ "$status" -eq 2 ]]
}

# --- hash_store tests ---

@test "hash_store creates hash file without output" {
    rm -f "$TEST_PROJECT/.campsite/known-hash"
    
    result="$(hash_store "$TEST_PROJECT")"
    
    [[ -z "$result" ]]
    [[ -f "$TEST_PROJECT/.campsite/known-hash" ]]
}

# --- CAMPSITE_SOURCE_FILES config ---

@test "hash_compute respects CAMPSITE_SOURCE_FILES" {
    export CAMPSITE_SOURCE_FILES="status.md"
    
    hash1="$(hash_compute "$TEST_PROJECT")"
    
    echo "change" >> "$TEST_PROJECT/handoff.md"
    hash2="$(hash_compute "$TEST_PROJECT")"
    
    # handoff.md not in source files, so hash should not change
    [[ "$hash1" == "$hash2" ]]
}
