#!/usr/bin/env bash
# Test helper — common setup for all bats tests

# Resolve project root
TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$TEST_DIR/.." && pwd)"

# Set up campsite environment for testing
export CAMPSITE_ROOT="$PROJECT_ROOT"
export CAMPSITE_HOME="$PROJECT_ROOT"
export CAMPSITE_LIB="$PROJECT_ROOT/lib"
export CAMPSITE_TEMPLATES="$PROJECT_ROOT/templates"

# Create temp directory for test fixtures
setup_temp_dir() {
    export TEST_TEMP_DIR="$(mktemp -d)"
    export TEST_PROJECT="$TEST_TEMP_DIR/test-project"
    mkdir -p "$TEST_PROJECT"
}

teardown_temp_dir() {
    if [[ -n "${TEST_TEMP_DIR:-}" && -d "$TEST_TEMP_DIR" ]]; then
        rm -rf "$TEST_TEMP_DIR"
    fi
}

# Load campsite libraries
load_campsite_libs() {
    source "$CAMPSITE_LIB/compat.sh"
    source "$CAMPSITE_LIB/common.sh"
    source "$CAMPSITE_LIB/detect.sh"
    source "$CAMPSITE_LIB/lock.sh"
    source "$CAMPSITE_LIB/hash.sh"
    source "$CAMPSITE_LIB/security.sh"
    source "$CAMPSITE_LIB/compile.sh"
    
    if [[ -f "$PROJECT_ROOT/config/defaults.sh" ]]; then
        source "$PROJECT_ROOT/config/defaults.sh"
    fi
}

# Create a minimal valid campsite project
create_test_project() {
    local project_path="${1:-$TEST_PROJECT}"
    mkdir -p "$project_path/.campsite"
    
    cat > "$project_path/status.md" << 'EOF'
# Status - test-project

## Current State

- phase: building
- confidence: medium
- last-updated: 2026-03-20
- last-agent: claude
- last-device: test-machine

## What Works

- basic functionality

## What Does Not Work Yet

- tests

## Blockers

- none
EOF

    cat > "$project_path/handoff.md" << 'EOF'
# Handoff - test-project

## Next Session

- task: implement tests
- context: testing framework setup complete
- blockers: none

## Notes

Test project for bats testing.
EOF

    cat > "$project_path/decisions.md" << 'EOF'
# Decisions - test-project

## 2026-03-20: Use bats for testing

- decision: Use bats-core for bash testing
- rationale: Standard bash testing framework
- alternatives: shunit2, manual testing
EOF

    cat > "$project_path/README.md" << 'EOF'
# Test Project

A test project for campsite testing.
EOF
}
