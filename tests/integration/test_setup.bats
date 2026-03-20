#!/usr/bin/env bats

load '../test_helper'

setup() {
    setup_temp_dir
    load_campsite_libs
    source "$PROJECT_ROOT/bin/campsite" 2>/dev/null || true

    # Isolate global campsite dir to temp so tests don't pollute real config
    export CAMPSITE_HOME="$TEST_TEMP_DIR/.campsite-home"
    mkdir -p "$CAMPSITE_HOME/user"
    printf '#!/usr/bin/env bash\n# test config\n' > "$CAMPSITE_HOME/user/config.sh"
}

teardown() {
    teardown_temp_dir
}

# ---------------------------------------------------------------------------
# Helper: run cmd_setup with piped input (non-interactive)
# ---------------------------------------------------------------------------
_run_setup() {
    run bash -c "
        export CAMPSITE_HOME='$CAMPSITE_HOME'
        export CAMPSITE_ROOT='$PROJECT_ROOT'
        source '$PROJECT_ROOT/lib/compat.sh'
        source '$PROJECT_ROOT/lib/common.sh'
        source '$PROJECT_ROOT/lib/detect.sh'
        source '$PROJECT_ROOT/lib/lock.sh'
        source '$PROJECT_ROOT/lib/hash.sh'
        source '$PROJECT_ROOT/lib/security.sh'
        source '$PROJECT_ROOT/lib/compile.sh'
        [[ -f '$PROJECT_ROOT/config/defaults.sh' ]] && source '$PROJECT_ROOT/config/defaults.sh'
        source '$PROJECT_ROOT/bin/campsite'
        cmd_setup
    " <<< "$1"
}

# ---------------------------------------------------------------------------
# Test 1: project path → workspace suggested, setup completes
# ---------------------------------------------------------------------------
@test "setup: project path infers workspace as parent" {
    # Create a mock project dir with a marker
    local proj="$TEST_TEMP_DIR/my-project"
    mkdir -p "$proj"
    touch "$proj/README.md"

    _run_setup "$(printf '%s\ny\n' "$proj")"

    [[ "$status" -eq 0 ]]
    echo "$output" | grep -q "That looks like a project folder"
    echo "$output" | grep -q "Suggested workspace"
    echo "$output" | grep -q "Setup complete"
}

# ---------------------------------------------------------------------------
# Test 2: workspace path → workspace used directly
# ---------------------------------------------------------------------------
@test "setup: workspace path is used directly" {
    # A plain dir with no project markers = workspace
    local ws="$TEST_TEMP_DIR/workspace"
    mkdir -p "$ws"

    _run_setup "$(printf '%s\nn\n' "$ws")"

    [[ "$status" -eq 0 ]]
    echo "$output" | grep -q "Workspace detected"
    echo "$output" | grep -q "Setup complete"
}

# ---------------------------------------------------------------------------
# Test 3: nonexistent path with valid parent → create offer
# ---------------------------------------------------------------------------
@test "setup: nonexistent path with valid parent offers creation" {
    local new_proj="$TEST_TEMP_DIR/brand-new-project"
    # parent ($TEST_TEMP_DIR) exists; new_proj does not

    _run_setup "$(printf '%s\ny\n' "$new_proj")"

    [[ "$status" -eq 0 ]]
    echo "$output" | grep -q "does not exist yet"
    echo "$output" | grep -q "Setup complete"
    # directory should have been created
    [[ -d "$new_proj" ]]
}

# ---------------------------------------------------------------------------
# Test 4: nonexistent path with valid parent → user declines → abort
# ---------------------------------------------------------------------------
@test "setup: declining creation on new-valid path aborts cleanly" {
    local new_proj="$TEST_TEMP_DIR/declined-project"

    _run_setup "$(printf '%s\nn\n' "$new_proj")"

    [[ "$status" -eq 0 ]]
    echo "$output" | grep -q "Aborting setup"
    [[ ! -d "$new_proj" ]]
}

# ---------------------------------------------------------------------------
# Test 5: completely invalid path → alternatives shown, fallback to option 1
# ---------------------------------------------------------------------------
@test "setup: invalid path shows alternatives and falls back" {
    _run_setup "$(printf '/this/does/not/exist/at/all\n1\ny\n')"

    [[ "$status" -eq 0 ]]
    echo "$output" | grep -q "parent does not exist"
    echo "$output" | grep -q "Try one of these instead"
    echo "$output" | grep -q "Setup complete"
}

# ---------------------------------------------------------------------------
# Test 6: --here flag uses current directory
# ---------------------------------------------------------------------------
@test "setup --here uses current directory" {
    # Run inside a dir that has a project marker
    local proj="$TEST_TEMP_DIR/here-project"
    mkdir -p "$proj/.git"

    run bash -c "
        export CAMPSITE_HOME='$CAMPSITE_HOME'
        export CAMPSITE_ROOT='$PROJECT_ROOT'
        cd '$proj'
        source '$PROJECT_ROOT/lib/compat.sh'
        source '$PROJECT_ROOT/lib/common.sh'
        source '$PROJECT_ROOT/lib/detect.sh'
        source '$PROJECT_ROOT/lib/lock.sh'
        source '$PROJECT_ROOT/lib/hash.sh'
        source '$PROJECT_ROOT/lib/security.sh'
        source '$PROJECT_ROOT/lib/compile.sh'
        [[ -f '$PROJECT_ROOT/config/defaults.sh' ]] && source '$PROJECT_ROOT/config/defaults.sh'
        source '$PROJECT_ROOT/bin/campsite'
        cmd_setup --here
    " <<< "y"

    [[ "$status" -eq 0 ]]
    echo "$output" | grep -q "Using current folder"
    echo "$output" | grep -q "Setup complete"
}

# ---------------------------------------------------------------------------
# Test 7: setup writes workspace to config file
# ---------------------------------------------------------------------------
@test "setup writes workspace path to user config" {
    local ws="$TEST_TEMP_DIR/my-workspace"
    mkdir -p "$ws"

    _run_setup "$(printf '%s\nn\n' "$ws")"

    [[ "$status" -eq 0 ]]
    grep -q "CAMPSITE_WORKSPACE" "$CAMPSITE_HOME/user/config.sh"
    grep -q "$ws" "$CAMPSITE_HOME/user/config.sh"
}

# ---------------------------------------------------------------------------
# Test 8: setup creates setup-complete marker
# ---------------------------------------------------------------------------
@test "setup creates setup-complete marker file" {
    local ws="$TEST_TEMP_DIR/ws"
    mkdir -p "$ws"

    _run_setup "$(printf '%s\nn\n' "$ws")"

    [[ "$status" -eq 0 ]]
    [[ -f "$CAMPSITE_HOME/setup-complete" ]]
}

# ---------------------------------------------------------------------------
# Test 9: output never contains internal tmp/test fixture paths
# ---------------------------------------------------------------------------
@test "setup output does not expose internal temp paths" {
    local ws="$TEST_TEMP_DIR/clean-ws"
    mkdir -p "$ws"

    _run_setup "$(printf '%s\nn\n' "$ws")"

    # The bats BATS_TMPDIR or /tmp patterns from internals must not appear
    # We allow TEST_TEMP_DIR since that IS the user-visible path in this test
    ! echo "$output" | grep -q "campsite-e2e-test"
    ! echo "$output" | grep -q "cannot resolve path"
    ! echo "$output" | grep -q "resolve_path:"
}

# ---------------------------------------------------------------------------
# Test 10: completed setup shows Next steps
# ---------------------------------------------------------------------------
@test "setup output includes next steps after completion" {
    local ws="$TEST_TEMP_DIR/ws2"
    mkdir -p "$ws"

    _run_setup "$(printf '%s\nn\n' "$ws")"

    [[ "$status" -eq 0 ]]
    echo "$output" | grep -q "Next steps"
    echo "$output" | grep -q "campsite sync"
}
