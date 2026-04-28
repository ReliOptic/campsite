#!/usr/bin/env bats

load '../test_helper'

setup() {
    setup_temp_dir
    export CAMPSITE_HOME="$TEST_TEMP_DIR/.campsite-home"
    mkdir -p "$CAMPSITE_HOME/user"
    printf '#!/usr/bin/env bash\n# test config\n' > "$CAMPSITE_HOME/user/config.sh"
    create_test_project
}

teardown() {
    teardown_temp_dir
}

_run_camp() {
    run bash -c "
        export CAMPSITE_HOME='$CAMPSITE_HOME'
        export CAMPSITE_DISABLE_PHASER=1
        cd '$TEST_PROJECT'
        '$PROJECT_ROOT/bin/campsite' camp \"\$@\"
    " -- "$@"
}

@test "camp --print-path renders html into project .campsite directory" {
    _run_camp --print-path --no-open

    [[ "$status" -eq 0 ]]
    [[ "$output" = "$TEST_PROJECT/.campsite/camp/index.html" ]]
    [[ -f "$TEST_PROJECT/.campsite/camp/index.html" ]]
}

@test "camp html includes project context and fire states" {
    _run_camp --print-path --no-open
    [[ "$status" -eq 0 ]]

    grep -q "test-project" "$TEST_PROJECT/.campsite/camp/index.html"
    grep -q "implement tests" "$TEST_PROJECT/.campsite/camp/index.html"
    grep -q "불씨" "$TEST_PROJECT/.campsite/camp/index.html"
    grep -q "모닥불" "$TEST_PROJECT/.campsite/camp/index.html"
    grep -q "등불" "$TEST_PROJECT/.campsite/camp/index.html"
    grep -q "연기" "$TEST_PROJECT/.campsite/camp/index.html"
    grep -q "장작" "$TEST_PROJECT/.campsite/camp/index.html"
}

@test "camp overview stays quiet when no real participants exist" {
    _run_camp overview

    [[ "$status" -eq 0 ]]
    echo "$output" | grep -q "working-now: (no active sessions"
    echo "$output" | grep -q "waiting-on-you: (nothing needs review)"
    echo "$output" | grep -q "next-move: implement tests"
}

@test "camp html uses truthful empty state when no real participants exist" {
    _run_camp --print-path --no-open

    [[ "$status" -eq 0 ]]
    grep -q "participantCount: 0" "$TEST_PROJECT/.campsite/camp/index.html"
    grep -q "조용한" "$TEST_PROJECT/.campsite/camp/index.html"
}

@test "camp participant enter and update persist local state files" {
    _run_camp participant enter worker-a --name="Claude Worker" --tool=claude --terminal=ghostty --state=bulssi --summary="Started auth work"
    [[ "$status" -eq 0 ]]

    _run_camp participant update worker-a --terminal=ghostty --state=deungbul --summary="Auth flow is ready for review" --next-action="Review edge cases"
    [[ "$status" -eq 0 ]]

    grep -q $'^worker-a\tClaude Worker\tagent\tclaude\tghostty\tdeungbul\tAuth flow is ready for review\t\tReview edge cases\t' "$TEST_PROJECT/.campsite/camp/participants.tsv"
    grep -q "worker-a" "$TEST_PROJECT/.campsite/camp/events.tsv"
    grep -q "deungbul" "$TEST_PROJECT/.campsite/camp/events.tsv"
}

@test "camp overview prints working waiting and next move from stored state" {
    _run_camp mission set "Ship auth checkpoint" --summary="Return fast and decide the next auth action." --next-action="Review worker-a"
    [[ "$status" -eq 0 ]]

    _run_camp participant enter worker-a --name="Claude Worker" --tool=claude --state=modakbul --summary="Running auth migration"
    [[ "$status" -eq 0 ]]

    _run_camp participant enter reviewer --name="Codex Reviewer" --tool=codex --state=deungbul --summary="Ready for human review"
    [[ "$status" -eq 0 ]]

    _run_camp participant enter prep --name="Terminal Prep" --type=terminal --tool=ghostty --state=jangjak --next-action="Review worker-a"
    [[ "$status" -eq 0 ]]

    _run_camp overview
    [[ "$status" -eq 0 ]]
    echo "$output" | grep -q "mission: Ship auth checkpoint"
    echo "$output" | grep -q "working-now: Claude Worker"
    echo "$output" | grep -q "waiting-on-you: Codex Reviewer (deungbul)"
    echo "$output" | grep -q "next-move: Terminal Prep: Review worker-a"
}

@test "sync registers mission state and camp sync event" {
    run bash -c "
        export CAMPSITE_HOME='$CAMPSITE_HOME'
        cd '$TEST_PROJECT'
        '$PROJECT_ROOT/bin/campsite' sync --adapter=claude
    "

    [[ "$status" -eq 0 ]]
    [[ -f "$TEST_PROJECT/.campsite/camp/mission.meta" ]]
    [[ -f "$TEST_PROJECT/.campsite/camp/events.tsv" ]]
    grep -q "implement tests" "$TEST_PROJECT/.campsite/camp/mission.meta"
    grep -q "Context synced for claude." "$TEST_PROJECT/.campsite/camp/events.tsv"
}

@test "save captures locked session into camp state when project changed" {
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
        source '$PROJECT_ROOT/lib/history.sh'
        source '$PROJECT_ROOT/lib/ui.sh'
        source '$PROJECT_ROOT/lib/camp.sh'
        [[ -f '$PROJECT_ROOT/config/defaults.sh' ]] && source '$PROJECT_ROOT/config/defaults.sh'
        source '$PROJECT_ROOT/bin/campsite'
        cd '$TEST_PROJECT'
        hash_store '$TEST_PROJECT'
        lock_acquire '$TEST_PROJECT' tester claude
        camp_session_start '$TEST_PROJECT' claude \$\$ 'test-tty' >/dev/null
        printf '\n- notes: updated\n' >> '$TEST_PROJECT/handoff.md'
        cmd_save
    "

    [[ "$status" -eq 0 ]]
    grep -q "session-claude-" "$TEST_PROJECT/.campsite/camp/participants.tsv"
    grep -q "deungbul" "$TEST_PROJECT/.campsite/camp/participants.tsv"
    grep -q "next task updated\|finished with changes" "$TEST_PROJECT/.campsite/camp/events.tsv"
}

@test "peek includes camp overview summary when camp state exists" {
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
        source '$PROJECT_ROOT/lib/history.sh'
        source '$PROJECT_ROOT/lib/ui.sh'
        source '$PROJECT_ROOT/lib/camp.sh'
        [[ -f '$PROJECT_ROOT/config/defaults.sh' ]] && source '$PROJECT_ROOT/config/defaults.sh'
        source '$PROJECT_ROOT/bin/campsite'
        cd '$TEST_PROJECT'
        lock_acquire '$TEST_PROJECT' tester claude
        camp_session_start '$TEST_PROJECT' claude \$\$ 'test-tty' >/dev/null
        cmd_peek
    "

    [[ "$status" -eq 0 ]]
    echo "$output" | grep -q "working-now:"
    echo "$output" | grep -q "waiting-on-you:"
    echo "$output" | grep -q "next-move:"
}
