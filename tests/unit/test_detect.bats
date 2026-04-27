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

# --- detect_project tests ---

@test "detect_project finds project from project root" {
    cd "$TEST_PROJECT"
    
    result="$(detect_project)"
    [[ "$result" == "$TEST_PROJECT" ]]
}

@test "detect_project finds project from subdirectory" {
    mkdir -p "$TEST_PROJECT/src/deep/nested"
    cd "$TEST_PROJECT/src/deep/nested"
    
    result="$(detect_project)"
    [[ "$result" == "$TEST_PROJECT" ]]
}

@test "detect_project fails without status.md" {
    rm "$TEST_PROJECT/status.md"
    cd "$TEST_PROJECT"
    
    run detect_project
    [[ "$status" -ne 0 ]]
}

@test "detect_project fails without handoff.md" {
    rm "$TEST_PROJECT/handoff.md"
    cd "$TEST_PROJECT"
    
    run detect_project
    [[ "$status" -ne 0 ]]
}

# --- detect_workspace tests ---

@test "detect_workspace uses CAMPSITE_WORKSPACE env var" {
    export CAMPSITE_WORKSPACE="$TEST_TEMP_DIR/workspace"
    mkdir -p "$CAMPSITE_WORKSPACE"
    
    result="$(detect_workspace)"
    [[ "$result" == "$CAMPSITE_WORKSPACE" ]]
}

@test "detect_workspace finds WORKSPACE.md" {
    unset CAMPSITE_WORKSPACE
    
    mkdir -p "$TEST_TEMP_DIR/workspace/project1"
    touch "$TEST_TEMP_DIR/workspace/WORKSPACE.md"
    cd "$TEST_TEMP_DIR/workspace/project1"
    
    result="$(detect_workspace)"
    [[ "$result" == "$TEST_TEMP_DIR/workspace" ]]
}

# --- detect_all_projects tests ---

@test "detect_all_projects finds multiple projects" {
    mkdir -p "$TEST_TEMP_DIR/workspace"
    export CAMPSITE_WORKSPACE="$TEST_TEMP_DIR/workspace"
    
    # Create two projects
    create_test_project "$TEST_TEMP_DIR/workspace/project1"
    create_test_project "$TEST_TEMP_DIR/workspace/project2"
    
    result="$(detect_all_projects "$TEST_TEMP_DIR/workspace")"
    
    [[ "$result" == *"project1"* ]]
    [[ "$result" == *"project2"* ]]
}

@test "detect_all_projects ignores non-campsite directories" {
    mkdir -p "$TEST_TEMP_DIR/workspace"
    export CAMPSITE_WORKSPACE="$TEST_TEMP_DIR/workspace"
    
    create_test_project "$TEST_TEMP_DIR/workspace/campsite-project"
    mkdir -p "$TEST_TEMP_DIR/workspace/not-a-project"
    
    result="$(detect_all_projects "$TEST_TEMP_DIR/workspace")"
    
    [[ "$result" == *"campsite-project"* ]]
    [[ "$result" != *"not-a-project"* ]]
}

# --- detect_terminal_surface tests ---

@test "detect_terminal_surface prefers TERM_PROGRAM when known" {
    TERM_PROGRAM=ghostty run detect_terminal_surface
    [[ "$status" -eq 0 ]]
    [[ "$output" == "ghostty" ]]
}

@test "detect_terminal_surface detects tmux" {
    skip "requires live TMUX socket — run manually inside a tmux session"
}
