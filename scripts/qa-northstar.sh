#!/usr/bin/env bash
# QA harness for the freshness-gate + hud features ("North Star" work).
# Self-contained: runs without bats, without shellcheck, without network.
# Exits non-zero if any check fails.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BIN="$ROOT/bin/campsite"
PASS=0
FAIL=0
FAILS=()

# Portable mtime-touch: prefer GNU `date -d`, fall back to BSD `date -v`.
_touch_age() {
    local file="$1" ago="$2"
    local ts
    ts="$(date -u -d "$ago" +%Y%m%d%H%M 2>/dev/null \
       || date -u -v-"${ago// /}" +%Y%m%d%H%M 2>/dev/null \
       || true)"
    [[ -n "$ts" ]] && touch -t "$ts" "$file"
}

run() {
    local name="$1"; shift
    local expect_rc="$1"; shift
    local pattern="$1"; shift
    local out rc
    out="$("$@" 2>&1)"
    rc=$?
    local ok=1
    [[ "$rc" == "$expect_rc" ]] || ok=0
    [[ -n "$pattern" ]] && ! grep -qE "$pattern" <<<"$out" && ok=0
    if [[ $ok -eq 1 ]]; then
        PASS=$((PASS+1))
        printf '  ✓ %s\n' "$name"
    else
        FAIL=$((FAIL+1)); FAILS+=("$name")
        printf '  ✗ %s (rc=%d expected=%s)\n' "$name" "$rc" "$expect_rc"
        printf '    output: %s\n' "$(printf '%s' "$out" | head -3 | tr '\n' '|')"
    fi
}

assert_eq() {
    local name="$1" got="$2" want="$3"
    if [[ "$got" == "$want" ]]; then
        PASS=$((PASS+1)); printf '  ✓ %s\n' "$name"
    else
        FAIL=$((FAIL+1)); FAILS+=("$name")
        printf '  ✗ %s (got=%q want=%q)\n' "$name" "$got" "$want"
    fi
}

# -----------------------------------------------------------------
# Setup workspace fixture
# -----------------------------------------------------------------
WS="$(mktemp -d)"
trap 'rm -rf "$WS"' EXIT

mkproj() {
    local name="$1" conf="$2" task="$3"
    mkdir -p "$WS/$name/.campsite"
    cat > "$WS/$name/status.md" <<EOF
# Status - $name
- phase: building
- confidence: $conf
- last-updated: 2026-04-27
EOF
    cat > "$WS/$name/handoff.md" <<EOF
# Handoff - $name
- task: $task
EOF
    cat > "$WS/$name/decisions.md" <<EOF
# Decisions - $name
EOF
    cat > "$WS/$name/README.md" <<EOF
# $name
EOF
}

mkproj fresh-camp high "do the fresh thing"
mkproj aging-camp high "do the aging thing"
mkproj stale-camp high "do the stale thing"

touch "$WS/fresh-camp/status.md" "$WS/fresh-camp/handoff.md"
_touch_age "$WS/aging-camp/status.md"  '36 hours ago'
_touch_age "$WS/aging-camp/handoff.md" '36 hours ago'
_touch_age "$WS/stale-camp/status.md"  '5 days ago'
_touch_age "$WS/stale-camp/handoff.md" '5 days ago'

export CAMPSITE_HOME="$ROOT" CAMPSITE_WORKSPACE="$WS"

# -----------------------------------------------------------------
# 1. Library helpers
# -----------------------------------------------------------------
printf '\n== 1. library helpers ==\n'

source "$ROOT/lib/compat.sh"
source "$ROOT/lib/common.sh"
source "$ROOT/config/defaults.sh"

assert_eq "freshness_level fresh"  "$(project_freshness_level "$WS/fresh-camp")" "fresh"
assert_eq "freshness_level aging"  "$(project_freshness_level "$WS/aging-camp")" "aging"
assert_eq "freshness_level stale"  "$(project_freshness_level "$WS/stale-camp")" "stale"

# Worst-of-N: status fresh + handoff stale → stale
mkdir -p "$WS/mixed/.campsite"
printf '# Status\n- phase: building\n' > "$WS/mixed/status.md"
printf '# Handoff\n'                    > "$WS/mixed/handoff.md"
touch "$WS/mixed/status.md"
_touch_age "$WS/mixed/handoff.md" '7 days ago'
assert_eq "freshness worst-of-N" \
    "$(project_freshness_level "$WS/mixed")" "stale"

assert_eq "ec high+fresh"     "$(effective_confidence high   fresh)" "high"
assert_eq "ec high+aging"     "$(effective_confidence high   aging)" "medium"
assert_eq "ec high+stale"     "$(effective_confidence high   stale)" "low"
assert_eq "ec medium+aging"   "$(effective_confidence medium aging)" "low"
assert_eq "ec medium+stale"   "$(effective_confidence medium stale)" "low"
assert_eq "ec low+aging"      "$(effective_confidence low    aging)" "low"
assert_eq "ec unknown+stale"  "$(effective_confidence unknown stale)" "unknown"
assert_eq "ec ''+aging"       "$(effective_confidence ''     aging)" "unknown"

assert_eq "gate strict fresh" "$(freshness_gate_action fresh)" "proceed"
assert_eq "gate strict aging" "$(freshness_gate_action aging)" "warn"
assert_eq "gate strict stale" "$(freshness_gate_action stale)" "block"

assert_eq "gate warn aging"   "$(CAMPSITE_FRESHNESS_POLICY=warn freshness_gate_action aging)" "warn"
assert_eq "gate warn stale"   "$(CAMPSITE_FRESHNESS_POLICY=warn freshness_gate_action stale)" "warn"
assert_eq "gate off aging"    "$(CAMPSITE_FRESHNESS_POLICY=off  freshness_gate_action aging)" "proceed"
assert_eq "gate off stale"    "$(CAMPSITE_FRESHNESS_POLICY=off  freshness_gate_action stale)" "proceed"

# -----------------------------------------------------------------
# 2. Launcher freshness gate decision matrix
#
# We can't drive the interactive launcher from a script, so test the
# gate function in isolation by sourcing a faithful copy of its logic.
# -----------------------------------------------------------------
printf '\n== 2. launcher gate decision matrix ==\n'

_test_gate() {
    local project="$1" force="${2:-0}"
    [[ "${CAMPSITE_FORCE:-0}" == "1" ]] && force=1
    local level action
    level="$(project_freshness_level "$project")"
    action="$(freshness_gate_action "$level")"
    case "$action" in
        proceed) return 0 ;;
        warn)    printf 'WARN:%s\n' "$level"  >&2; return 0 ;;
        block)
            if [[ "$force" == "1" ]]; then
                printf 'FORCE:%s\n' "$level" >&2; return 0
            fi
            printf 'BLOCK:%s\n' "$level" >&2; return 2 ;;
    esac
}

gate_check() {
    local name="$1" expect_rc="$2" expect_pat="$3"; shift 3
    local out rc
    out="$(_test_gate "$@" 2>&1)"
    rc=$?
    local ok=1
    [[ "$rc" == "$expect_rc" ]] || ok=0
    [[ -n "$expect_pat" ]] && ! grep -qE "$expect_pat" <<<"$out" && ok=0
    if [[ $ok -eq 1 ]]; then
        PASS=$((PASS+1)); printf '  ✓ %s\n' "$name"
    else
        FAIL=$((FAIL+1)); FAILS+=("$name")
        printf '  ✗ %s (rc=%d expected=%s out=%q)\n' "$name" "$rc" "$expect_rc" "$out"
    fi
}

gate_check "fresh proceeds silently"   0 ""        "$WS/fresh-camp"
gate_check "aging warns but proceeds"  0 "WARN"    "$WS/aging-camp"
gate_check "stale blocks (rc=2)"       2 "BLOCK"   "$WS/stale-camp"
gate_check "stale + --force proceeds"  0 "FORCE"   "$WS/stale-camp" 1
CAMPSITE_FORCE=1 gate_check "stale + CAMPSITE_FORCE=1 proceeds" 0 "FORCE" "$WS/stale-camp" 0
CAMPSITE_FRESHNESS_POLICY=warn gate_check "warn policy: stale → warn" 0 "WARN" "$WS/stale-camp" 0
CAMPSITE_FRESHNESS_POLICY=off  gate_check "off policy: stale → proceed" 0 "" "$WS/stale-camp" 0

# -----------------------------------------------------------------
# 3. campsite hud — line / json / once
# -----------------------------------------------------------------
printf '\n== 3. campsite hud (line/json/once) ==\n'

LINE_OUT="$("$BIN" hud --line 2>&1)"
if [[ "$LINE_OUT" == *"fresh-camp"* && "$LINE_OUT" == *"aging-camp"* && "$LINE_OUT" == *"stale-camp"* ]]; then
    PASS=$((PASS+1)); printf '  ✓ hud --line lists all camps\n'
else
    FAIL=$((FAIL+1)); FAILS+=("hud --line lists all camps")
    printf '  ✗ hud --line lists all camps\n    got: %s\n' "$LINE_OUT"
fi

JSON_OUT="$("$BIN" hud --json 2>&1)"
if [[ "$JSON_OUT" =~ ^\[.*\]$ ]]; then
    PASS=$((PASS+1)); printf '  ✓ hud --json shape\n'
else
    FAIL=$((FAIL+1)); FAILS+=("hud --json shape")
fi
if [[ "$JSON_OUT" == *'"name":"stale-camp"'*'"effective_confidence":"low"'*'"freshness":"stale"'* ]]; then
    PASS=$((PASS+1)); printf '  ✓ hud --json: stale-camp shows degraded confidence\n'
else
    FAIL=$((FAIL+1)); FAILS+=("hud --json stale-camp degradation")
fi
if command -v python3 >/dev/null 2>&1; then
    if printf '%s' "$JSON_OUT" | python3 -c 'import sys,json; json.load(sys.stdin)' 2>/dev/null; then
        PASS=$((PASS+1)); printf '  ✓ hud --json parses as valid JSON\n'
    else
        FAIL=$((FAIL+1)); FAILS+=("hud --json valid JSON")
    fi
fi

ONCE_OUT="$("$BIN" hud --once 2>&1)"
for camp in fresh-camp aging-camp stale-camp mixed; do
    if [[ "$ONCE_OUT" == *"$camp"* ]]; then
        PASS=$((PASS+1)); printf '  ✓ hud --once mentions %s\n' "$camp"
    else
        FAIL=$((FAIL+1)); FAILS+=("hud --once mentions $camp")
    fi
done
if [[ "$ONCE_OUT" == *"high→low"* ]]; then
    PASS=$((PASS+1)); printf '  ✓ hud --once shows degraded confidence inline\n'
else
    FAIL=$((FAIL+1)); FAILS+=("hud --once degraded confidence")
fi

# -----------------------------------------------------------------
# 4. Edge cases
# -----------------------------------------------------------------
printf '\n== 4. hud edge cases ==\n'

EMPTY_WS="$(mktemp -d)"
EMPTY_OUT="$(CAMPSITE_WORKSPACE="$EMPTY_WS" "$BIN" hud --once 2>&1)"
if [[ "$EMPTY_OUT" == *"no camps detected"* ]]; then
    PASS=$((PASS+1)); printf '  ✓ empty workspace: graceful empty state\n'
else
    FAIL=$((FAIL+1)); FAILS+=("empty workspace")
fi
LINE_EMPTY="$(CAMPSITE_WORKSPACE="$EMPTY_WS" "$BIN" hud --line 2>&1)"
if [[ -n "$LINE_EMPTY" ]]; then
    PASS=$((PASS+1)); printf '  ✓ hud --line empty workspace fallback\n'
else
    FAIL=$((FAIL+1)); FAILS+=("hud --line empty fallback")
fi
rm -rf "$EMPTY_WS"

run "hud unknown flag fails"  1 "unknown flag"           "$BIN" hud --bogus
run "hud --help shows usage"  0 "polling full-screen HUD" "$BIN" hud --help

# Long mission gets ellipsis-truncated
mkdir -p "$WS/longy/.campsite"
LONG_TASK="lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua"
printf '# Status\n- phase: building\n- confidence: high\n' > "$WS/longy/status.md"
printf '# Handoff\n- task: %s\n' "$LONG_TASK"            > "$WS/longy/handoff.md"
printf '# Decisions\n'                                    > "$WS/longy/decisions.md"
LONGOUT="$("$BIN" hud --once 2>&1)"
if [[ "$LONGOUT" == *"…"* ]]; then
    PASS=$((PASS+1)); printf '  ✓ long mission gets ellipsis-truncated\n'
else
    FAIL=$((FAIL+1)); FAILS+=("long mission truncation")
fi

# JSON escaping
printf '# Handoff\n- task: do "stuff" with \\backslash and "more"\n' > "$WS/longy/handoff.md"
JSONESC="$("$BIN" hud --json 2>&1)"
if command -v python3 >/dev/null 2>&1; then
    if printf '%s' "$JSONESC" | python3 -c 'import sys,json; data=json.load(sys.stdin); [print(c["task"]) for c in data if c["name"]=="longy"]' 2>/dev/null | grep -q '"stuff"'; then
        PASS=$((PASS+1)); printf '  ✓ hud --json escapes quotes and backslash\n'
    else
        FAIL=$((FAIL+1)); FAILS+=("json escaping")
    fi
fi
rm -rf "$WS/longy"

# -----------------------------------------------------------------
# 5. Polling loop liveness
# -----------------------------------------------------------------
printf '\n== 5. hud loop ==\n'

LOOPOUT="$(timeout 1 "$BIN" hud --interval=0.2 2>&1 || true)"
if [[ "$LOOPOUT" == *"campsite hud"* ]]; then
    PASS=$((PASS+1)); printf '  ✓ hud loop renders header\n'
else
    FAIL=$((FAIL+1)); FAILS+=("hud loop renders")
fi

# -----------------------------------------------------------------
# 6. Regression — existing commands still work
# -----------------------------------------------------------------
printf '\n== 6. regression ==\n'

run "campsite help"               0 "Interactive launcher"      "$BIN" help
run "campsite --version"          0 "[0-9]"                     "$BIN" --version
run "help mentions --force"       0 "campsite --force"          "$BIN" help
run "help mentions policy env"    0 "CAMPSITE_FRESHNESS_POLICY" "$BIN" help

# `campsite status` from inside the campsite repo itself
( cd "$ROOT" && "$BIN" status   > /dev/null 2>&1 ) \
    && { PASS=$((PASS+1)); printf '  ✓ campsite status (in own repo)\n'; } \
    || { FAIL=$((FAIL+1)); FAILS+=("campsite status in own repo"); printf '  ✗ campsite status (in own repo)\n'; }

( cd "$ROOT" && "$BIN" validate > /dev/null 2>&1 ) \
    && { PASS=$((PASS+1)); printf '  ✓ campsite validate (in own repo)\n'; } \
    || { FAIL=$((FAIL+1)); FAILS+=("campsite validate in own repo"); printf '  ✗ campsite validate (in own repo)\n'; }

# -----------------------------------------------------------------
# Summary
# -----------------------------------------------------------------
printf '\n========================================\n'
printf 'PASS: %d   FAIL: %d\n' "$PASS" "$FAIL"
if (( FAIL > 0 )); then
    printf '\nFailed:\n'
    for t in "${FAILS[@]}"; do printf '  - %s\n' "$t"; done
    exit 1
fi
printf 'all green\n'
exit 0
