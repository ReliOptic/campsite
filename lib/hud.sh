#!/usr/bin/env bash
# Campsite HUD — always-alive top strip showing every camp's live state.
# Designed to be embedded in a tmux status-line (--line) or run as a
# foreground polling display (default).
[[ -n "${_CAMPSITE_HUD_LOADED:-}" ]] && return 0
_CAMPSITE_HUD_LOADED=1

# State → single glyph. Wide-char glyphs avoided for tmux width safety.
_hud_glyph() {
    case "$1" in
        modakbul) printf '%s' '●' ;;  # actively working
        bulssi)   printf '%s' '◉' ;;  # spark, just started
        deungbul) printf '%s' '◌' ;;  # waiting for review
        yeongi)   printf '%s' '⚠' ;;  # something wrong
        jangjak)  printf '%s' '○' ;;  # idle, prepared
        *)        printf '%s' '·' ;;
    esac
}

# Compact human age: 23s / 4m / 1h 12m / 2d
_hud_pretty_age() {
    local s="${1:-0}"
    [[ "$s" -lt 0 ]] 2>/dev/null && s=0
    if   [[ "$s" -lt 60    ]]; then printf '%ds' "$s"
    elif [[ "$s" -lt 3600  ]]; then printf '%dm' $(( s / 60 ))
    elif [[ "$s" -lt 86400 ]]; then
        local h=$(( s / 3600 )) m=$(( (s % 3600) / 60 ))
        if [[ "$m" -eq 0 ]]; then printf '%dh' "$h"; else printf '%dh %dm' "$h" "$m"; fi
    else
        printf '%dd' $(( s / 86400 ))
    fi
}

# Best one-line activity blurb for a camp.
# Priority: active agent name + uptime > recent commit count > idle age.
_hud_activity() {
    local project="$1"
    local now
    now="$(date +%s)"

    # Active agent → "claude · 1m12s"
    local active
    active="$(agent_list_active "$project" 2>/dev/null | head -n 1)"
    if [[ -n "$active" ]]; then
        local agent_name started_at
        agent_name="$(printf '%s' "$active" | awk -F'\t' '{print $2}')"
        started_at="$(printf '%s' "$active" | awk -F'\t' '{print $3}')"
        if [[ -n "$started_at" && "$started_at" =~ ^[0-9]+$ ]]; then
            printf '%s · %s' "$agent_name" "$(_hud_pretty_age $(( now - started_at )))"
        else
            printf '%s' "$agent_name"
        fi
        return 0
    fi

    # Idle → "idle 4h"
    local last_ts
    last_ts="$(collector_last_activity_ts "$project" 2>/dev/null || echo 0)"
    if [[ "$last_ts" -gt 0 ]] 2>/dev/null; then
        printf 'idle %s' "$(_hud_pretty_age $(( now - last_ts )))"
    else
        printf 'idle'
    fi
}

# Plain line writer. The hud_loop redraw clears the whole screen each frame,
# so per-line clear-to-EOL is unnecessary and would leak literal escapes when
# the destination isn't a TTY (e.g. captured by tmux #()).
_hud_print_line() {
    printf '%s\n' "$1"
}

# ---------------------------------------------------------------------------
# hud_render_line — emit a single, tmux-status-line-friendly summary.
#   Format:  ● name/claude·1m12s · ◌ foo/idle·12m · ⚠ bar/exit=1
#   Trims to terminal width (or COLUMNS) when set.
# ---------------------------------------------------------------------------
hud_render_line() {
    local sep=' · '
    local out=''
    local first=1
    local project
    while IFS= read -r project; do
        [[ -d "$project" ]] || continue
        local glyph state activity name segment
        state="$(firestate_derive "$project" 2>/dev/null || echo 'jangjak')"
        glyph="$(_hud_glyph "$state")"
        name="$(basename "$project")"
        activity="$(_hud_activity "$project")"
        segment="${glyph} ${name}/${activity}"
        if [[ $first -eq 1 ]]; then
            out="$segment"; first=0
        else
            out="${out}${sep}${segment}"
        fi
    done < <(detect_all_projects 2>/dev/null || true)

    [[ -z "$out" ]] && out='○ no camps'
    printf '%s' "$out"
}

# ---------------------------------------------------------------------------
# hud_render_full — full-screen multi-line render. ANSI-colored when on a TTY.
# ---------------------------------------------------------------------------
hud_render_full() {
    local spinner_char="${1:-·}"
    local now
    now="$(date +%s)"

    local _b='' _d='' _r='' _y='' _g='' _c='' _red=''
    if is_terminal; then
        _b='\033[1m'; _d='\033[2m'; _r='\033[0m'
        _y='\033[33m'; _g='\033[32m'; _c='\033[36m'; _red='\033[31m'
    fi

    _hud_print_line ""
    _hud_print_line "$(printf '  %bcampsite hud%b  %b%s  %s%b' "$_b" "$_r" "$_d" "$spinner_char" "$(date '+%H:%M:%S')" "$_r")"
    _hud_print_line ""

    local count=0
    local project
    while IFS= read -r project; do
        [[ -d "$project" ]] || continue
        count=$(( count + 1 ))

        local name state glyph activity
        name="$(basename "$project")"
        state="$(firestate_derive "$project" 2>/dev/null || echo 'jangjak')"
        glyph="$(_hud_glyph "$state")"
        activity="$(_hud_activity "$project")"

        local color="$_d"
        case "$state" in
            modakbul) color="$_y" ;;
            bulssi)   color="$_y" ;;
            deungbul) color="$_c" ;;
            yeongi)   color="$_red" ;;
            jangjak)  color="$_d" ;;
        esac

        local label
        label="$(firestate_label_ko "$state")"

        local stated_conf level eff_conf conf_line=""
        stated_conf="$(field_value "$project/status.md" "confidence" 2>/dev/null || echo "unknown")"
        level="$(project_freshness_level "$project" 2>/dev/null || echo fresh)"
        eff_conf="$(effective_confidence "$stated_conf" "$level")"
        if [[ "$eff_conf" != "$stated_conf" && "$eff_conf" != "unknown" ]]; then
            conf_line=" ${_d}· conf ${stated_conf}→${eff_conf} (${level})${_r}"
        fi

        local task
        task="$(field_value "$project/handoff.md" "task" 2>/dev/null || echo "")"
        [[ -z "$task" ]] && task="(no mission set)"
        # Trim very long missions
        if [[ ${#task} -gt 70 ]]; then
            task="${task:0:67}…"
        fi

        local lock_marker=""
        if lock_is_held "$project" 2>/dev/null; then
            lock_marker=" ${_red}[locked]${_r}"
        fi

        _hud_print_line "$(printf '  %b%s%b  %b%-18s%b  %s%b' \
            "$color" "$glyph" "$_r" "$_b" "$name" "$_r" "$label" "$lock_marker")"
        _hud_print_line "$(printf '     %b%s%b%b' "$_d" "$activity" "$_r" "$conf_line")"
        _hud_print_line "$(printf '     %b▸ %s%b' "$_d" "$task" "$_r")"
        _hud_print_line ""
    done < <(detect_all_projects 2>/dev/null || true)

    if [[ $count -eq 0 ]]; then
        _hud_print_line "  ${_d}no camps detected.${_r}"
        _hud_print_line "  ${_d}run 'campsite init' inside a project, or set CAMPSITE_WORKSPACE.${_r}"
        _hud_print_line ""
    fi

    _hud_print_line "$(printf '  %b%d camp%s · %s · Ctrl-C to exit%b' \
        "$_d" "$count" "$( [[ "$count" -eq 1 ]] && echo '' || echo 's' )" "$(date '+%Y-%m-%d %H:%M:%S')" "$_r")"
}

# ---------------------------------------------------------------------------
# hud_render_json — machine-readable snapshot, one object per camp.
# ---------------------------------------------------------------------------
hud_render_json() {
    local now
    now="$(date +%s)"
    printf '['
    local first=1 project
    while IFS= read -r project; do
        [[ -d "$project" ]] || continue
        local name state activity stated_conf level eff_conf task locked last_ts
        name="$(basename "$project")"
        state="$(firestate_derive "$project" 2>/dev/null || echo 'jangjak')"
        activity="$(_hud_activity "$project")"
        stated_conf="$(field_value "$project/status.md" "confidence" 2>/dev/null || echo "unknown")"
        level="$(project_freshness_level "$project" 2>/dev/null || echo fresh)"
        eff_conf="$(effective_confidence "$stated_conf" "$level")"
        task="$(field_value "$project/handoff.md" "task" 2>/dev/null || echo "")"
        last_ts="$(collector_last_activity_ts "$project" 2>/dev/null || echo 0)"
        if lock_is_held "$project" 2>/dev/null; then locked=true; else locked=false; fi

        # Minimal JSON escape: backslash and double-quote
        _esc() { printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'; }

        if [[ $first -eq 1 ]]; then first=0; else printf ','; fi
        printf '{"name":"%s","state":"%s","activity":"%s","confidence":"%s","effective_confidence":"%s","freshness":"%s","task":"%s","last_activity":%s,"locked":%s}' \
            "$(_esc "$name")" "$state" "$(_esc "$activity")" "$stated_conf" "$eff_conf" "$level" "$(_esc "$task")" "$last_ts" "$locked"
    done < <(detect_all_projects 2>/dev/null || true)
    printf ']\n'
}

# ---------------------------------------------------------------------------
# hud_loop — alternate-screen polling renderer for `campsite hud`.
#   interval: seconds between frames (default 1)
# ---------------------------------------------------------------------------
hud_loop() {
    local interval="${1:-1}"

    # Frames for the tiny "alive" tick — calm, not hyperactive.
    local frames=( '·' '∙' '•' '∙' )
    local frame_count=${#frames[@]}
    local i=0

    # Enter alternate screen; hide cursor.
    is_terminal && printf '\033[?1049h\033[?25l'

    _restore() {
        is_terminal && printf '\033[?25h\033[?1049l'
    }
    trap _restore EXIT INT TERM

    while true; do
        # Home + erase entire screen — drops residue from previous frame.
        is_terminal && printf '\033[H\033[2J'
        hud_render_full "${frames[$(( i % frame_count ))]}"
        i=$(( i + 1 ))
        sleep "$interval"
    done
}
