#!/usr/bin/env bats

load '../test_helper'

setup() {
    setup_temp_dir
    load_campsite_libs
    create_test_project
    
    # Mock command -v to pretend claude is installed
    command() {
        if [[ "$1" == "-v" && "$2" == "claude" ]]; then
            echo "/usr/bin/claude"
            return 0
        fi
        builtin command "$@"
    }
    export -f command
}

teardown() {
    teardown_temp_dir
}

@test "sync creates context file for available adapter" {
    cd "$TEST_PROJECT"
    
    compile_context "$TEST_PROJECT" "claude"
    
    [[ -f "$TEST_PROJECT/CLAUDE.md" ]]
}

@test "sync stores hash after compilation" {
    cd "$TEST_PROJECT"
    
    compile_context "$TEST_PROJECT" "claude"
    hash_store "$TEST_PROJECT"
    
    [[ -f "$TEST_PROJECT/.campsite/known-hash" ]]
}

@test "sync workflow: compile -> modify -> detect change" {
    cd "$TEST_PROJECT"
    
    # Initial sync
    compile_context "$TEST_PROJECT" "claude"
    hash_store "$TEST_PROJECT"
    
    # Verify clean state
    run hash_compare "$TEST_PROJECT"
    [[ "$status" -eq 0 ]]
    
    # Modify source file
    echo "modified" >> "$TEST_PROJECT/status.md"
    
    # Should detect change
    run hash_compare "$TEST_PROJECT"
    [[ "$status" -eq 1 ]]
}

@test "save workflow: cleanup compiled files" {
    cd "$TEST_PROJECT"
    
    # Create compiled files
    compile_context "$TEST_PROJECT" "claude"
    compile_context "$TEST_PROJECT" "codex"
    
    [[ -f "$TEST_PROJECT/CLAUDE.md" ]]
    [[ -f "$TEST_PROJECT/AGENTS.md" ]]
    
    # Cleanup
    compile_cleanup_all "$TEST_PROJECT"
    
    [[ ! -f "$TEST_PROJECT/CLAUDE.md" ]]
    [[ ! -f "$TEST_PROJECT/AGENTS.md" ]]
}

@test "save workflow: release lock" {
    cd "$TEST_PROJECT"
    
    lock_acquire "$TEST_PROJECT" "testuser" "testagent"
    [[ -f "$TEST_PROJECT/.campsite/lock" ]]
    
    lock_release "$TEST_PROJECT"
    [[ ! -f "$TEST_PROJECT/.campsite/lock" ]]
}

@test "full cycle: init -> sync -> work -> save" {
    local new_project="$TEST_TEMP_DIR/new-project"
    
    # Source campsite for cmd_init
    source "$PROJECT_ROOT/bin/campsite" 2>/dev/null || true
    
    # Init
    cmd_init "$new_project"
    [[ -f "$new_project/status.md" ]]
    
    # Sync
    compile_context "$new_project" "claude"
    hash_store "$new_project"
    lock_acquire "$new_project" "testuser" "claude"
    
    [[ -f "$new_project/CLAUDE.md" ]]
    [[ -f "$new_project/.campsite/lock" ]]
    
    # Work (modify files)
    echo "- added: new feature" >> "$new_project/status.md"
    
    # Save
    compile_cleanup_all "$new_project"
    lock_release "$new_project"
    hash_store "$new_project"
    
    [[ ! -f "$new_project/CLAUDE.md" ]]
    [[ ! -f "$new_project/.campsite/lock" ]]
}

@test "save --push creates checkpoint commit for tracked changes" {
    cd "$TEST_PROJECT"

    git init -b master >/dev/null 2>&1
    git config user.name "Test User"
    git config user.email "test@example.com"
    git add .
    git commit -m "initial" >/dev/null 2>&1

    local bare_remote="$TEST_TEMP_DIR/remote.git"
    git init --bare "$bare_remote" >/dev/null 2>&1
    git remote add origin "$bare_remote"
    git push -u origin master >/dev/null 2>&1

    echo "- note: checkpoint" >> "$TEST_PROJECT/status.md"

    run bash -c "
        export CAMPSITE_HOME='$CAMPSITE_HOME'
        cd '$TEST_PROJECT'
        '$PROJECT_ROOT/bin/campsite' save --push
    "

    [[ "$status" -eq 0 ]]
    git log --oneline -1 | grep -q "checkpoint:"
}
