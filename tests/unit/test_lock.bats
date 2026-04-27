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

# --- lock_path tests ---

@test "lock_path returns correct path" {
    result="$(lock_path "$TEST_PROJECT")"
    [[ "$result" == "$TEST_PROJECT/.campsite/lock" ]]
}

# --- lock_acquire tests ---

@test "lock_acquire creates lock file" {
    lock_acquire "$TEST_PROJECT" "testuser" "testagent"

    [[ -d "$TEST_PROJECT/.campsite/lock" ]]
    [[ -f "$TEST_PROJECT/.campsite/lock/pid" ]]
}

@test "lock_acquire stores correct metadata" {
    lock_acquire "$TEST_PROJECT" "testuser" "testagent"

    local pid_file
    pid_file="$(lock_path "$TEST_PROJECT")/pid"

    actor="$(field_value_plain "$pid_file" "actor")"
    tool="$(field_value_plain "$pid_file" "tool")"
    pid="$(field_value_plain "$pid_file" "pid")"

    [[ "$actor" == "testuser" ]]
    [[ "$tool" == "testagent" ]]
    [[ "$pid" == "$$" ]]
}

@test "lock_acquire fails if already locked" {
    lock_acquire "$TEST_PROJECT" "user1" "agent1"

    # Create a fake process to hold the lock
    # (simulate another terminal with a running process)
    # We'll use a subshell sleep to hold the lock
    (
        sleep 10 &
        lock_pid=$!
        pid_file="$(lock_path "$TEST_PROJECT")/pid"
        sed -i "s/^pid:.*/pid: $lock_pid/" "$pid_file" 2>/dev/null \
            || sed "s/^pid:.*/pid: $lock_pid/" "$pid_file" > "$pid_file.tmp" \
            && mv "$pid_file.tmp" "$pid_file"
        sleep 1
        kill $lock_pid 2>/dev/null || true
    ) &
    sleep 0.5

    run lock_acquire "$TEST_PROJECT" "user2" "agent2"
    [[ "$status" -ne 0 ]]
}

# --- lock_release tests ---

@test "lock_release removes lock file" {
    lock_acquire "$TEST_PROJECT" "testuser" "testagent"
    lock_release "$TEST_PROJECT"

    [[ ! -d "$TEST_PROJECT/.campsite/lock" ]]
}

@test "lock_release does nothing if no lock" {
    rm -rf "$TEST_PROJECT/.campsite/lock"
    
    run lock_release "$TEST_PROJECT"
    [[ "$status" -eq 0 ]]
}

# --- lock_is_held tests ---

@test "lock_is_held returns 0 when locked" {
    lock_acquire "$TEST_PROJECT" "testuser" "testagent"
    
    run lock_is_held "$TEST_PROJECT"
    [[ "$status" -eq 0 ]]
}

@test "lock_is_held returns 1 when not locked" {
    rm -rf "$TEST_PROJECT/.campsite/lock"

    run lock_is_held "$TEST_PROJECT"
    [[ "$status" -eq 1 ]]
}

# --- lock_check_orphan tests ---

@test "lock_check_orphan returns 0 for dead PID" {
    lock_acquire "$TEST_PROJECT" "testuser" "testagent"

    # Modify PID to a non-existent process
    pid_file="$(lock_path "$TEST_PROJECT")/pid"
    echo "pid: 99999999" >> "$pid_file.new"
    grep -v "^pid:" "$pid_file" >> "$pid_file.new"
    mv "$pid_file.new" "$pid_file"

    run lock_check_orphan "$TEST_PROJECT"
    [[ "$status" -eq 0 ]]
}

@test "lock_check_orphan returns 1 for live PID" {
    lock_acquire "$TEST_PROJECT" "testuser" "testagent"
    
    run lock_check_orphan "$TEST_PROJECT"
    [[ "$status" -eq 1 ]]
}

@test "lock_check_orphan returns 1 when no lock exists" {
    rm -rf "$TEST_PROJECT/.campsite/lock"

    run lock_check_orphan "$TEST_PROJECT"
    [[ "$status" -eq 1 ]]
}
