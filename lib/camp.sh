#!/usr/bin/env bash
[[ -n "${_CAMPSITE_CAMP_LOADED:-}" ]] && return 0
_CAMPSITE_CAMP_LOADED=1

camp_dir() {
    local project_root="$1"
    local dir
    dir="$(project_campsite_dir "$project_root")/camp"
    mkdir -p "$dir"
    printf '%s' "$dir"
}

camp_index_path() {
    local project_root="$1"
    printf '%s/index.html' "$(camp_dir "$project_root")"
}

camp_mission_path() {
    local project_root="$1"
    printf '%s/mission.meta' "$(camp_dir "$project_root")"
}

camp_participants_path() {
    local project_root="$1"
    printf '%s/participants.tsv' "$(camp_dir "$project_root")"
}

camp_events_path() {
    local project_root="$1"
    printf '%s/events.tsv' "$(camp_dir "$project_root")"
}

camp_sessions_dir() {
    local project_root="$1"
    local dir
    dir="$(camp_dir "$project_root")/sessions"
    mkdir -p "$dir"
    printf '%s' "$dir"
}

camp_session_snapshot_path() {
    local project_root="$1" participant_id="$2"
    printf '%s/%s.meta' "$(camp_sessions_dir "$project_root")" "$participant_id"
}

camp_html_escape() {
    sed \
        -e 's/&/\&amp;/g' \
        -e 's/</\&lt;/g' \
        -e 's/>/\&gt;/g' \
        -e 's/"/\&quot;/g' \
        -e "s/'/\&#39;/g"
}

camp_clean_text() {
    tr '\t\r\n' '   ' | sed -e 's/[[:space:]][[:space:]]*/ /g' -e 's/^ //' -e 's/ $//'
}

camp_field_get() {
    local file="$1" field="$2"
    field_value_plain "$file" "$field" 2>/dev/null || true
}

camp_state_priority() {
    case "$1" in
        yeongi) printf '1' ;;
        deungbul) printf '2' ;;
        jangjak) printf '3' ;;
        modakbul) printf '4' ;;
        bulssi) printf '5' ;;
        *) printf '9' ;;
    esac
}

camp_validate_state() {
    case "$1" in
        bulssi|modakbul|deungbul|yeongi|jangjak) return 0 ;;
        *) fail "invalid camp state: $1" "Valid states: bulssi, modakbul, deungbul, yeongi, jangjak" ;;
    esac
}

camp_session_participant_id() {
    local tool="$1" pid="$2"
    printf 'session-%s-%s' "$(printf '%s' "$tool" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g')" "$pid"
}

camp_ensure_store() {
    local project_root="$1"
    local mission_file participants_file events_file
    mission_file="$(camp_mission_path "$project_root")"
    participants_file="$(camp_participants_path "$project_root")"
    events_file="$(camp_events_path "$project_root")"

    if [[ ! -f "$mission_file" ]]; then
        local project_name phase next_task
        project_name="$(basename "$project_root")"
        phase="$(field_value "$project_root/status.md" "phase" 2>/dev/null || echo "building")"
        next_task="$(field_value "$project_root/handoff.md" "task" 2>/dev/null || echo "Review current camp state and pick the next action")"
        cat > "$mission_file" <<EOF
id: main
title: $(printf '%s' "$next_task" | camp_clean_text)
summary: Return fast, understand the camp, resume the next meaningful action.
state: bulssi
phase: $(printf '%s' "$phase" | camp_clean_text)
next-action: $(printf '%s' "$next_task" | camp_clean_text)
project: $(printf '%s' "$project_name" | camp_clean_text)
updated-at: $(now_iso)
EOF
    fi

    if [[ ! -f "$participants_file" ]]; then
        printf 'id\tname\ttype\ttool\tterminal\tfire_state\tsummary\tblocker\tnext_action\tlast_updated\tpriority\n' > "$participants_file"
    fi

    if [[ ! -f "$events_file" ]]; then
        printf 'created_at\tparticipant_id\tfrom_state\tto_state\tsummary\n' > "$events_file"
    fi
}

camp_set_mission() {
    local project_root="$1" title="$2" summary="${3:-}" state="${4:-}" next_action="${5:-}"
    camp_ensure_store "$project_root"

    local mission_file phase project_name current_summary current_state current_next_action
    mission_file="$(camp_mission_path "$project_root")"
    phase="$(field_value "$project_root/status.md" "phase" 2>/dev/null || echo "building")"
    project_name="$(basename "$project_root")"
    current_summary="$(camp_field_get "$mission_file" "summary")"
    current_state="$(camp_field_get "$mission_file" "state")"
    current_next_action="$(camp_field_get "$mission_file" "next-action")"

    [[ -n "$summary" ]] || summary="$current_summary"
    [[ -n "$summary" ]] || summary="Return fast, understand the camp, resume the next meaningful action."
    [[ -n "$state" ]] || state="$current_state"
    [[ -n "$state" ]] || state="bulssi"
    [[ -n "$next_action" ]] || next_action="$current_next_action"
    [[ -n "$next_action" ]] || next_action="$title"

    camp_validate_state "$state"

    cat > "$mission_file" <<EOF
id: main
title: $(printf '%s' "$title" | camp_clean_text)
summary: $(printf '%s' "$summary" | camp_clean_text)
state: $state
phase: $(printf '%s' "$phase" | camp_clean_text)
next-action: $(printf '%s' "$next_action" | camp_clean_text)
project: $(printf '%s' "$project_name" | camp_clean_text)
updated-at: $(now_iso)
EOF
}

camp_sync_mission_from_project() {
    local project_root="$1"
    local title phase
    title="$(field_value "$project_root/handoff.md" "task" 2>/dev/null || echo "Review current camp state and pick the next action")"
    phase="$(field_value "$project_root/status.md" "phase" 2>/dev/null || echo "building")"
    camp_set_mission \
        "$project_root" \
        "$title" \
        "Return fast, understand the camp, resume the next meaningful action." \
        "bulssi" \
        "$title"
    _portable_sed_i "s/^phase:.*/phase: $(printf '%s' "$phase" | camp_clean_text)/" "$(camp_mission_path "$project_root")"
}

camp_participant_get() {
    local project_root="$1" participant_id="$2"
    local participants_file
    participants_file="$(camp_participants_path "$project_root")"
    [[ -f "$participants_file" ]] || return 1
    awk -F'\t' -v id="$participant_id" 'NR > 1 && $1 == id { print; exit }' "$participants_file"
}

camp_participant_upsert() {
    local project_root="$1" participant_id="$2" name="$3" ptype="$4" tool="$5" terminal="$6" fire_state="$7" summary="$8" blocker="$9" next_action="${10}" priority="${11:-50}"
    camp_ensure_store "$project_root"
    camp_validate_state "$fire_state"

    local participants_file tmpfile
    participants_file="$(camp_participants_path "$project_root")"
    tmpfile="${participants_file}.tmp"

    name="$(printf '%s' "$name" | camp_clean_text)"
    ptype="$(printf '%s' "$ptype" | camp_clean_text)"
    tool="$(printf '%s' "$tool" | camp_clean_text)"
    terminal="$(printf '%s' "$terminal" | camp_clean_text)"
    summary="$(printf '%s' "$summary" | camp_clean_text)"
    blocker="$(printf '%s' "$blocker" | camp_clean_text)"
    next_action="$(printf '%s' "$next_action" | camp_clean_text)"

    awk -F'\t' -v id="$participant_id" 'NR == 1 || $1 != id { print }' "$participants_file" > "$tmpfile"
    printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' \
        "$participant_id" "$name" "$ptype" "$tool" "$terminal" "$fire_state" "$summary" "$blocker" "$next_action" "$(now_iso)" "$priority" \
        >> "$tmpfile"
    mv "$tmpfile" "$participants_file"
}

camp_event_append() {
    local project_root="$1" participant_id="$2" from_state="$3" to_state="$4" summary="$5"
    camp_ensure_store "$project_root"
    printf '%s\t%s\t%s\t%s\t%s\n' \
        "$(now_iso)" \
        "$(printf '%s' "$participant_id" | camp_clean_text)" \
        "$(printf '%s' "$from_state" | camp_clean_text)" \
        "$(printf '%s' "$to_state" | camp_clean_text)" \
        "$(printf '%s' "$summary" | camp_clean_text)" \
        >> "$(camp_events_path "$project_root")"
}

camp_session_start() {
    local project_root="$1" tool="$2" pid="$3" terminal="$4"
    camp_ensure_store "$project_root"
    camp_sync_mission_from_project "$project_root"

    local participant_id summary next_action
    participant_id="$(camp_session_participant_id "$tool" "$pid")"
    next_action="$(field_value "$project_root/handoff.md" "task" 2>/dev/null || echo "")"
    summary="Active session in ${terminal:-terminal}. Working through the current mission."

    cat > "$(camp_session_snapshot_path "$project_root" "$participant_id")" <<EOF
started-at: $(now_iso)
tool: $(printf '%s' "$tool" | camp_clean_text)
terminal: $(printf '%s' "$terminal" | camp_clean_text)
phase: $(field_value "$project_root/status.md" "phase" 2>/dev/null || echo "")
confidence: $(field_value "$project_root/status.md" "confidence" 2>/dev/null || echo "")
task: $(field_value "$project_root/handoff.md" "task" 2>/dev/null || echo "")
last-agent: $(field_value "$project_root/status.md" "last-agent" 2>/dev/null || echo "")
last-device: $(field_value "$project_root/status.md" "last-device" 2>/dev/null || echo "")
EOF

    camp_participant_upsert "$project_root" "$participant_id" "$tool" "agent" "$tool" "$terminal" "modakbul" "$summary" "" "$next_action" "25"
    camp_event_append "$project_root" "$participant_id" "" "modakbul" "Session started in ${terminal:-terminal}."
    printf '%s' "$participant_id"
}

camp_session_finish() {
    local project_root="$1" tool="$2" pid="$3" outcome="${4:-normal}" state_changed="${5:-0}"
    camp_ensure_store "$project_root"
    camp_sync_mission_from_project "$project_root"

    local participant_id existing
    participant_id="$(camp_session_participant_id "$tool" "$pid")"
    existing="$(camp_participant_get "$project_root" "$participant_id")"
    [[ -n "$existing" ]] || return 0

    IFS=$'\t' read -r _id name ptype stored_tool terminal old_state summary blocker next_action _last_updated priority <<< "$existing"

    local new_state new_summary
    next_action="$(field_value "$project_root/handoff.md" "task" 2>/dev/null || echo "$next_action")"
    local snapshot_file
    snapshot_file="$(camp_session_snapshot_path "$project_root" "$participant_id")"

    if [[ "$outcome" != "normal" ]]; then
        new_state="yeongi"
        new_summary="Session ended abnormally. Human review is needed before trusting the result."
        blocker="Session ended unexpectedly."
    elif [[ "$state_changed" == "1" ]]; then
        new_state="deungbul"
        local old_phase new_phase old_task new_task old_confidence new_confidence changes=""
        old_phase="$(camp_field_get "$snapshot_file" "phase")"
        old_task="$(camp_field_get "$snapshot_file" "task")"
        old_confidence="$(camp_field_get "$snapshot_file" "confidence")"
        new_phase="$(field_value "$project_root/status.md" "phase" 2>/dev/null || echo "")"
        new_task="$(field_value "$project_root/handoff.md" "task" 2>/dev/null || echo "")"
        new_confidence="$(field_value "$project_root/status.md" "confidence" 2>/dev/null || echo "")"

        if [[ -n "$old_phase" && -n "$new_phase" && "$old_phase" != "$new_phase" ]]; then
            changes="phase ${old_phase} -> ${new_phase}. "
        fi
        if [[ -n "$old_task" && -n "$new_task" && "$old_task" != "$new_task" ]]; then
            changes="${changes}next task updated. "
        fi
        if [[ -n "$old_confidence" && -n "$new_confidence" && "$old_confidence" != "$new_confidence" ]]; then
            changes="${changes}confidence ${old_confidence} -> ${new_confidence}. "
        fi
        [[ -n "$changes" ]] || changes="status or handoff changed during the session. "
        new_summary="Session ended with updated project state. ${changes}Review the latest handoff and decide the next move."
        blocker=""
    else
        new_state="jangjak"
        new_summary="Session ended without updating status files. The next action is prepared for the next resume from ${terminal:-this terminal}."
        blocker=""
    fi

    camp_participant_upsert "$project_root" "$participant_id" "$name" "$ptype" "$stored_tool" "$terminal" "$new_state" "$new_summary" "$blocker" "$next_action" "$priority"
    camp_event_append "$project_root" "$participant_id" "$old_state" "$new_state" "$new_summary"
    rm -f "$snapshot_file" 2>/dev/null || true
}

camp_register_sync() {
    local project_root="$1" adapter_name="${2:-all}"
    camp_ensure_store "$project_root"
    camp_sync_mission_from_project "$project_root"
    camp_event_append "$project_root" "campfire" "" "bulssi" "Context synced for ${adapter_name}."
}

camp_capture_locked_session_on_save() {
    local project_root="$1" state_changed="${2:-0}"
    local lock_file
    lock_file="$(lock_path "$project_root")"
    [[ -f "$lock_file" ]] || return 0

    local tool pid
    tool="$(field_value_plain "$lock_file" "tool" 2>/dev/null || echo "manual")"
    pid="$(field_value_plain "$lock_file" "pid" 2>/dev/null || echo "")"
    [[ -n "$pid" ]] || return 0

    camp_session_finish "$project_root" "$tool" "$pid" "normal" "$state_changed"
}

camp_default_seed() {
    local project_root="$1"
    camp_ensure_store "$project_root"

    local participants_file
    participants_file="$(camp_participants_path "$project_root")"
    if [[ "$(wc -l < "$participants_file" | tr -d ' ')" -gt 1 ]]; then
        return 0
    fi

    local last_agent next_task
    last_agent="$(field_value "$project_root/status.md" "last-agent" 2>/dev/null || echo "claude")"
    next_task="$(field_value "$project_root/handoff.md" "task" 2>/dev/null || echo "Review current camp state and pick the next action")"

    camp_participant_upsert "$project_root" "${last_agent}-active" "$last_agent" "agent" "$last_agent" "ghostty" "modakbul" "Still working on the current mission thread." "" "" "40"
    camp_participant_upsert "$project_root" "codex-review" "codex" "agent" "codex" "warp" "deungbul" "A bounded segment is ready for your read." "" "Review the completed segment and decide whether to continue." "20"
    camp_participant_upsert "$project_root" "gemini-blocked" "gemini" "agent" "gemini" "wezterm" "yeongi" "Blocked on a product tradeoff." "Needs human judgment on the next tradeoff." "" "10"
    camp_participant_upsert "$project_root" "terminal-next" "terminal" "terminal" "ghostty" "ghostty" "jangjak" "Prepared next action is staged." "" "$next_task" "30"

    camp_event_append "$project_root" "${last_agent}-active" "" "modakbul" "Entered the camp and started active work."
    camp_event_append "$project_root" "codex-review" "" "deungbul" "Reached a review-ready segment."
    camp_event_append "$project_root" "gemini-blocked" "" "yeongi" "Needs help choosing the next tradeoff."
    camp_event_append "$project_root" "terminal-next" "" "jangjak" "Prepared the next action."
}

camp_overview_lines() {
    local project_root="$1"
    camp_ensure_store "$project_root"
    camp_default_seed "$project_root"

    local participants_file
    participants_file="$(camp_participants_path "$project_root")"

    awk -F'\t' '
        NR == 1 { next }
        $6 == "modakbul" { active[++active_n] = $2 }
        $6 == "deungbul" || $6 == "yeongi" { waiting[++wait_n] = $2 " (" $6 ")" }
        $6 == "jangjak" && next_action == "" { next_action = $9; next_name = $2 }
        END {
            active_line = ""
            for (i = 1; i <= active_n; i++) {
                active_line = active_line (i > 1 ? ", " : "") active[i]
            }
            waiting_line = ""
            for (i = 1; i <= wait_n; i++) {
                waiting_line = waiting_line (i > 1 ? ", " : "") waiting[i]
            }
            if (active_line == "") active_line = "none"
            if (waiting_line == "") waiting_line = "none"
            if (next_action == "") next_action = "none prepared"
            if (next_name == "") next_name = "camp"
            print "ACTIVE\t" active_line
            print "WAITING\t" waiting_line
            print "NEXT\t" next_name ": " next_action
        }
    ' "$participants_file"
}

camp_overview_print() {
    local project_root="$1"
    local mission_file mission_title
    mission_file="$(camp_mission_path "$project_root")"
    camp_ensure_store "$project_root"
    camp_default_seed "$project_root"
    mission_title="$(camp_field_get "$mission_file" "title")"

    printf '\n'
    printf "  ${_C_BOLD:-}camp overview${_C_RESET:-}\n"
    printf "  mission: %s\n" "$mission_title"
    while IFS=$'\t' read -r label value; do
        case "$label" in
            ACTIVE) printf "  working-now: %s\n" "$value" ;;
            WAITING) printf "  waiting-on-you: %s\n" "$value" ;;
            NEXT) printf "  next-move: %s\n" "$value" ;;
        esac
    done < <(camp_overview_lines "$project_root")
    printf '\n'
}

camp_render_participants_dataset() {
    local project_root="$1"
    local participants_file tmpfile
    participants_file="$(camp_participants_path "$project_root")"
    tmpfile="$(mktemp)"

    awk -F'\t' '
        NR == 1 { next }
        {
            state = $6
            priority = 9
            if (state == "yeongi") priority = 1
            else if (state == "deungbul") priority = 2
            else if (state == "jangjak") priority = 3
            else if (state == "modakbul") priority = 4
            else if (state == "bulssi") priority = 5
            print priority "\t" $0
        }
    ' "$participants_file" | sort -t$'\t' -k1,1n -k11,11n -k10,10r > "$tmpfile"

    cat "$tmpfile"
    rm -f "$tmpfile"
}

camp_render() {
    local project_root="$1"
    local output_path
    output_path="$(camp_index_path "$project_root")"

    camp_ensure_store "$project_root"
    camp_default_seed "$project_root"

    local mission_file participants_file events_file
    mission_file="$(camp_mission_path "$project_root")"
    participants_file="$(camp_participants_path "$project_root")"
    events_file="$(camp_events_path "$project_root")"

    local project_name phase confidence last_updated mission_title mission_summary mission_next_action
    project_name="$(basename "$project_root")"
    phase="$(field_value "$project_root/status.md" "phase" 2>/dev/null || echo "building")"
    confidence="$(field_value "$project_root/status.md" "confidence" 2>/dev/null || echo "medium")"
    last_updated="$(field_value "$project_root/status.md" "last-updated" 2>/dev/null || echo "$(today_date)")"
    mission_title="$(camp_field_get "$mission_file" "title")"
    mission_summary="$(camp_field_get "$mission_file" "summary")"
    mission_next_action="$(camp_field_get "$mission_file" "next-action")"

    local project_name_html phase_html confidence_html last_updated_html mission_title_html mission_summary_html mission_next_action_html
    project_name_html="$(printf '%s' "$project_name" | camp_html_escape)"
    phase_html="$(printf '%s' "$phase" | camp_html_escape)"
    confidence_html="$(printf '%s' "$confidence" | camp_html_escape)"
    last_updated_html="$(printf '%s' "$last_updated" | camp_html_escape)"
    mission_title_html="$(printf '%s' "$mission_title" | camp_html_escape)"
    mission_summary_html="$(printf '%s' "$mission_summary" | camp_html_escape)"
    mission_next_action_html="$(printf '%s' "$mission_next_action" | camp_html_escape)"

    local active_line waiting_line next_line
    while IFS=$'\t' read -r label value; do
        case "$label" in
            ACTIVE) active_line="$value" ;;
            WAITING) waiting_line="$value" ;;
            NEXT) next_line="$value" ;;
        esac
    done < <(camp_overview_lines "$project_root")

    local active_line_html waiting_line_html next_line_html
    active_line_html="$(printf '%s' "${active_line:-none}" | camp_html_escape)"
    waiting_line_html="$(printf '%s' "${waiting_line:-none}" | camp_html_escape)"
    next_line_html="$(printf '%s' "${next_line:-none}" | camp_html_escape)"

    local participant_cards=""
    local participant_count
    participant_count="$(awk 'NR > 1 { count++ } END { print count + 0 }' "$participants_file")"
    local idx=0
    while IFS=$'\t' read -r _priority id name ptype tool terminal fire_state summary blocker next_action row_updated priority; do
        idx=$((idx + 1))
        local card_class="participant-${idx}"
        if [[ $idx -gt 4 ]]; then
            card_class="participant-extra"
        fi
        local state_label=""
        case "$fire_state" in
            bulssi) state_label="불씨" ;;
            modakbul) state_label="모닥불" ;;
            deungbul) state_label="등불" ;;
            yeongi) state_label="연기" ;;
            jangjak) state_label="장작" ;;
            *) state_label="$fire_state" ;;
        esac
        local body="$summary"
        [[ -n "$body" ]] || body="No summary captured yet."
        if [[ -n "$blocker" ]]; then
            body="$body Blocker: $blocker"
        elif [[ -n "$next_action" ]]; then
            body="$body Next: $next_action"
        fi
        participant_cards="${participant_cards}
          <article class=\"participant ${card_class}\" data-state=\"$(printf '%s' "$fire_state" | camp_html_escape)\">
            <header>
              <h3 class=\"participant-name\">$(printf '%s' "$name" | camp_html_escape)</h3>
              <span class=\"state-chip state-$(printf '%s' "$fire_state" | camp_html_escape)\">$(printf '%s' "$state_label" | camp_html_escape)</span>
            </header>
            <p>$(printf '%s' "$body" | camp_html_escape)</p>
            <div class=\"meta\">$(printf '%s' "$ptype" | camp_html_escape) • $(printf '%s' "$tool" | camp_html_escape) • $(printf '%s' "$terminal" | camp_html_escape)</div>
          </article>"
    done < <(camp_render_participants_dataset "$project_root")

    local activity_items=""
    local event_count=0
    while IFS=$'\t' read -r created_at participant_id from_state to_state summary; do
        [[ "$created_at" == "created_at" ]] && continue
        event_count=$((event_count + 1))
        local participant_name
        participant_name="$(camp_participant_get "$project_root" "$participant_id" | awk -F'\t' 'NR == 1 { print $2 }')"
        [[ -n "$participant_name" ]] || participant_name="$participant_id"
        activity_items="<article class=\"activity-item\">
        <div class=\"event-time\">$(printf '%s' "$created_at" | camp_html_escape)</div>
        <p><strong>$(printf '%s' "$participant_name" | camp_html_escape)</strong> moved to <span class=\"state-chip state-$(printf '%s' "$to_state" | camp_html_escape)\">$(printf '%s' "$to_state" | camp_html_escape)</span>. $(printf '%s' "$summary" | camp_html_escape)</p>
      </article>
${activity_items}"
        [[ $event_count -ge 4 ]] && break
    done < <(tac "$events_file" 2>/dev/null || tail -r "$events_file" 2>/dev/null || cat "$events_file")

    [[ -n "$activity_items" ]] || activity_items='<article class="activity-item"><div class="event-time">now</div><p>No camp events yet.</p></article>'

    cat > "$output_path" <<EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project_name_html} Camp</title>
  <style>
    :root {
      --bg: #131318;
      --surface-low: #1b1b20;
      --surface-high: #2a292f;
      --surface-top: #35343a;
      --text: #e4e1e9;
      --muted: #bac8dc;
      --tertiary: #00dce5;
      --ember: #ff9f4a;
      --review: #f6d365;
      --smoke: #8fa1b3;
      --ready: #7fd98f;
      --shadow: rgba(228, 225, 233, 0.06);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: Inter, ui-sans-serif, system-ui, sans-serif;
      color: var(--text);
      background:
        radial-gradient(circle at top, rgba(0,220,229,0.10), transparent 30%),
        radial-gradient(circle at bottom, rgba(255,159,74,0.12), transparent 35%),
        linear-gradient(180deg, #17171d 0%, var(--bg) 50%, #0f1014 100%);
    }
    .app { min-height: 100vh; display: grid; grid-template-columns: 240px 1fr 320px; grid-template-rows: auto 1fr auto; gap: 16px; padding: 18px; }
    .topbar, .rail, .return-panel, .activity, .scene-shell { background: var(--surface-low); box-shadow: 0 0 0 1px rgba(255,255,255,0.02), 0 18px 48px var(--shadow); }
    .topbar { grid-column: 1 / 4; display: flex; justify-content: space-between; align-items: center; padding: 16px 18px; }
    .brand { display: flex; flex-direction: column; gap: 4px; }
    .eyebrow, .meta, .event-time { font-family: "Space Grotesk", ui-sans-serif, system-ui, sans-serif; font-size: 12px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); }
    .title, .panel-title, .mission-title { font-family: "Space Grotesk", ui-sans-serif, system-ui, sans-serif; margin: 0; }
    .top-stats { display: flex; gap: 18px; flex-wrap: wrap; justify-content: flex-end; }
    .stat { background: var(--surface-high); padding: 10px 12px; min-width: 120px; }
    .stat strong { display: block; margin-top: 4px; color: var(--text); font-size: 14px; }
    .rail { padding: 18px; display: flex; flex-direction: column; gap: 18px; }
    .rail-block, .return-block, .participant, .mission-card, .activity-item { background: var(--surface-high); padding: 14px; }
    .scene-shell { padding: 18px; display: flex; flex-direction: column; gap: 16px; }
    .scene { flex: 1; min-height: 540px; background: linear-gradient(180deg, rgba(0,0,0,0.10), rgba(0,0,0,0.25)), linear-gradient(0deg, rgba(44,73,54,0.35), rgba(44,73,54,0.02) 36%), var(--surface-top); position: relative; overflow: hidden; padding: 24px; }
    .scene::before { content: ""; position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px); background-size: 24px 24px; opacity: 0.12; pointer-events: none; }
    .mission-card { position: absolute; left: 50%; top: 52%; transform: translate(-50%, -50%); width: min(360px, calc(100% - 48px)); padding: 18px; background: radial-gradient(circle at top, rgba(255,159,74,0.26), transparent 45%), linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02)), #2d2621; box-shadow: 0 0 32px rgba(255,159,74,0.18); z-index: 2; }
    .mission-title { font-size: 24px; margin-bottom: 8px; }
    .mission-summary { margin: 0 0 12px; color: var(--text); line-height: 1.5; }
    .cta { display: inline-block; padding: 10px 12px; background: linear-gradient(180deg, rgba(0,220,229,0.85), rgba(0,220,229,0.65)); color: #071013; font-family: "Space Grotesk", ui-sans-serif, system-ui, sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
    .participant-grid { position: relative; min-height: 100%; z-index: 1; }
    .participant { position: absolute; width: 210px; box-shadow: 0 0 0 1px rgba(255,255,255,0.02); }
    .participant[data-state="modakbul"] { box-shadow: 0 0 20px rgba(255,159,74,0.18); }
    .participant[data-state="deungbul"] { box-shadow: 0 0 20px rgba(246,211,101,0.16); }
    .participant[data-state="yeongi"] { box-shadow: 0 0 20px rgba(143,161,179,0.14); }
    .participant[data-state="jangjak"] { box-shadow: 0 0 20px rgba(127,217,143,0.14); }
    .participant-1 { left: 4%; top: 14%; }
    .participant-2 { right: 5%; top: 12%; }
    .participant-3 { left: 10%; bottom: 10%; }
    .participant-4 { right: 8%; bottom: 14%; }
    .participant-extra { left: 50%; bottom: 2%; transform: translateX(-50%); width: min(540px, calc(100% - 48px)); }
    .participant header { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 10px; }
    .participant-name { margin: 0; font-size: 17px; font-family: "Space Grotesk", ui-sans-serif, system-ui, sans-serif; }
    .state-chip { padding: 4px 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; font-family: "Space Grotesk", ui-sans-serif, system-ui, sans-serif; }
    .state-bulssi { background: rgba(255,159,74,0.12); color: var(--ember); }
    .state-modakbul { background: rgba(255,159,74,0.18); color: #ffbf7e; }
    .state-deungbul { background: rgba(246,211,101,0.16); color: var(--review); }
    .state-yeongi { background: rgba(143,161,179,0.15); color: #d5e2ee; }
    .state-jangjak { background: rgba(127,217,143,0.16); color: var(--ready); }
    .participant p, .return-block p, .rail-block p, .activity-item p { margin: 0; color: var(--text); line-height: 1.45; font-size: 14px; }
    .participant .meta { margin-top: 10px; }
    .return-panel { padding: 18px; display: flex; flex-direction: column; gap: 14px; }
    .panel-title { font-size: 20px; margin: 0 0 4px; }
    .return-block strong { display: block; margin-bottom: 8px; font-family: "Space Grotesk", ui-sans-serif, system-ui, sans-serif; font-size: 13px; letter-spacing: 0.06em; text-transform: uppercase; }
    .activity { grid-column: 1 / 4; padding: 14px 18px 18px; display: grid; gap: 10px; }
    .activity-item { display: grid; grid-template-columns: 140px 1fr; gap: 12px; align-items: start; }
    .legend { display: grid; gap: 8px; }
    .legend-row { display: flex; align-items: center; gap: 10px; color: var(--muted); font-size: 13px; }
    .footer-note { color: var(--muted); font-size: 12px; line-height: 1.5; }
    @media (max-width: 1120px) { .app { grid-template-columns: 1fr; grid-template-rows: auto auto auto auto auto; } .topbar, .activity { grid-column: 1; } .scene { min-height: 640px; } .participant-1 { left: 2%; top: 8%; } .participant-2 { right: 2%; top: 8%; } .participant-3 { left: 5%; bottom: 7%; } .participant-4 { right: 5%; bottom: 7%; } .participant-extra { left: 50%; bottom: 3%; } }
    @media (max-width: 720px) { .scene { min-height: 920px; } .mission-card { position: relative; left: auto; top: auto; transform: none; width: 100%; margin-bottom: 16px; } .participant { position: relative; width: 100%; left: auto; right: auto; top: auto; bottom: auto; transform: none; margin-bottom: 12px; } .participant-grid { display: flex; flex-direction: column; } .activity-item { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <div class="app">
    <section class="topbar">
      <div class="brand">
        <div class="eyebrow">Campsite camp overview</div>
        <h1 class="title">${project_name_html}</h1>
        <div class="meta">Recovery-first local scene for returning in under 5 seconds</div>
      </div>
      <div class="top-stats">
        <div class="stat"><div class="eyebrow">Phase</div><strong>${phase_html}</strong></div>
        <div class="stat"><div class="eyebrow">Confidence</div><strong>${confidence_html}</strong></div>
        <div class="stat"><div class="eyebrow">Updated</div><strong>${last_updated_html}</strong></div>
        <div class="stat"><div class="eyebrow">Active camp</div><strong>${participant_count} participants</strong></div>
      </div>
    </section>
    <aside class="rail">
      <section class="rail-block">
        <div class="eyebrow">Terminal rail</div>
        <p><strong>Workspace:</strong> ${project_name_html}</p>
        <p><strong>Mission:</strong> ${mission_title_html}</p>
        <p><strong>Resume path:</strong> re-enter camp, inspect return panel, choose one action</p>
      </section>
      <section class="rail-block">
        <div class="eyebrow">State legend</div>
        <div class="legend">
          <div class="legend-row"><span class="state-chip state-bulssi">불씨</span> newly started, still weak</div>
          <div class="legend-row"><span class="state-chip state-modakbul">모닥불</span> active focused execution</div>
          <div class="legend-row"><span class="state-chip state-deungbul">등불</span> ready for human review</div>
          <div class="legend-row"><span class="state-chip state-yeongi">연기</span> blocked, needs help</div>
          <div class="legend-row"><span class="state-chip state-jangjak">장작</span> next action prepared</div>
        </div>
      </section>
      <section class="rail-block">
        <div class="eyebrow">Prototype note</div>
        <p class="footer-note">This scene is now backed by local camp state files. UI is a consumer, not the source of truth.</p>
      </section>
    </aside>
    <main class="scene-shell">
      <div class="eyebrow">Camp scene</div>
      <section class="scene">
        <article class="mission-card">
          <div class="eyebrow">Campfire mission</div>
          <h2 class="mission-title">${mission_title_html}</h2>
          <p class="mission-summary">${mission_summary_html}</p>
          <span class="cta">Next: ${mission_next_action_html}</span>
        </article>
        <div class="participant-grid">
${participant_cards}
        </div>
      </section>
    </main>
    <aside class="return-panel">
      <div><div class="eyebrow">Return panel</div><h2 class="panel-title">Read the camp fast</h2></div>
      <section class="return-block"><strong>Working now</strong><p>${active_line_html}</p></section>
      <section class="return-block"><strong>Waiting on you</strong><p>${waiting_line_html}</p></section>
      <section class="return-block"><strong>Next move</strong><p>${next_line_html}</p></section>
    </aside>
    <section class="activity">
      <div class="eyebrow">Recent camp events</div>
${activity_items}
    </section>
  </div>
</body>
</html>
EOF

    printf '%s' "$output_path"
}

camp_open_browser() {
    local file_path="$1"
    if command -v open >/dev/null 2>&1; then
        open "$file_path" >/dev/null 2>&1 &
        return 0
    fi
    if command -v xdg-open >/dev/null 2>&1; then
        xdg-open "$file_path" >/dev/null 2>&1 &
        return 0
    fi
    return 1
}
