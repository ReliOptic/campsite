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
    local mission_short
    mission_short="$(printf '%s' "$next_action" | cut -c1-80)"
    summary="${tool} session active in ${terminal:-terminal}. Mission: ${mission_short:-unknown}."

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

    local derived_state
    derived_state="$(firestate_derive "$project_root" 2>/dev/null || echo "bulssi")"

    camp_participant_upsert "$project_root" "$participant_id" "$tool" "agent" "$tool" "$terminal" "$derived_state" "$summary" "" "$next_action" "25"
    camp_event_append "$project_root" "$participant_id" "" "$derived_state" "${tool} started in ${terminal:-terminal}."

    # Signal collection
    collector_record_event "$project_root" "session_start" "${tool} session started in ${terminal:-terminal}" "$tool" 2>/dev/null || true
    collector_git_snapshot "$project_root" 2>/dev/null || true

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

    local _ep; _ep="$(printf '%s' "$existing" | tr '\t' '\037')"
    IFS=$'\037' read -r _id name ptype stored_tool terminal old_state summary blocker next_action _last_updated priority <<< "$_ep"

    local new_state new_summary
    next_action="$(field_value "$project_root/handoff.md" "task" 2>/dev/null || echo "$next_action")"
    local snapshot_file
    snapshot_file="$(camp_session_snapshot_path "$project_root" "$participant_id")"

    if [[ "$outcome" != "normal" ]]; then
        new_state="yeongi"
        new_summary="${stored_tool} session ended abnormally. Review before trusting the result."
        blocker="Unexpected exit from ${stored_tool} in ${terminal:-terminal}."
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
        [[ -n "$changes" ]] || changes="state updated. "
        new_summary="${stored_tool} finished with changes: ${changes}Review the handoff."
        blocker=""
    else
        new_state="$(firestate_derive "$project_root" 2>/dev/null || echo "jangjak")"
        new_summary="${stored_tool} session ended. No state updates. Ready to resume from ${terminal:-terminal}."
        blocker=""
    fi

    camp_participant_upsert "$project_root" "$participant_id" "$name" "$ptype" "$stored_tool" "$terminal" "$new_state" "$new_summary" "$blocker" "$next_action" "$priority"
    camp_event_append "$project_root" "$participant_id" "$old_state" "$new_state" "$new_summary"

    # Signal collection
    collector_record_event "$project_root" "session_end" "${stored_tool} session ended (${outcome})" "$stored_tool" 2>/dev/null || true
    collector_git_snapshot "$project_root" 2>/dev/null || true

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
    local lock_pid_file
    lock_pid_file="$(lock_path "$project_root")/pid"
    [[ -f "$lock_pid_file" ]] || return 0

    local tool pid
    tool="$(field_value_plain "$lock_pid_file" "tool" 2>/dev/null || echo "manual")"
    pid="$(field_value_plain "$lock_pid_file" "pid" 2>/dev/null || echo "")"
    [[ -n "$pid" ]] || return 0

    camp_session_finish "$project_root" "$tool" "$pid" "normal" "$state_changed"
}

camp_participant_count() {
    local project_root="$1"
    camp_ensure_store "$project_root"

    local participants_file
    participants_file="$(camp_participants_path "$project_root")"
    awk 'NR > 1 { count++ } END { print count + 0 }' "$participants_file"
}

camp_overview_lines() {
    local project_root="$1"
    camp_ensure_store "$project_root"

    local participants_file
    participants_file="$(camp_participants_path "$project_root")"
    local mission_file fallback_next_action
    mission_file="$(camp_mission_path "$project_root")"
    fallback_next_action="$(camp_field_get "$mission_file" "next-action")"
    [[ -n "$fallback_next_action" ]] || fallback_next_action="$(field_value "$project_root/handoff.md" "task" 2>/dev/null || echo "Open the mission and choose the next move.")"

    awk -F'\t' -v fallback_next_action="$fallback_next_action" '
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
            if (active_line == "") active_line = "none yet"
            if (waiting_line == "") waiting_line = "none waiting"
            if (next_action == "") next_action = fallback_next_action
            if (next_name == "") next_name = "mission"
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

    local mission_file participants_file events_file
    mission_file="$(camp_mission_path "$project_root")"
    participants_file="$(camp_participants_path "$project_root")"
    events_file="$(camp_events_path "$project_root")"

    local project_name mission_title mission_next_action
    project_name="$(basename "$project_root")"
    mission_title="$(camp_field_get "$mission_file" "title")"
    mission_next_action="$(camp_field_get "$mission_file" "next-action")"

    local project_name_html mission_title_html mission_next_action_html
    project_name_html="$(printf '%s' "$project_name" | camp_html_escape)"
    mission_title_html="$(printf '%s' "$mission_title" | camp_html_escape)"
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
    active_line_html="$(printf '%s' "${active_line:-none yet}" | camp_html_escape)"
    waiting_line_html="$(printf '%s' "${waiting_line:-none waiting}" | camp_html_escape)"
    next_line_html="$(printf '%s' "${next_line:-none}" | camp_html_escape)"

    # Build participant JSON via awk to avoid bash read empty-field bug
    local participant_json
    participant_json="$(awk -F'\t' '
        function esc(s) { gsub(/\\/, "\\\\", s); gsub(/"/, "\\\"", s); gsub(/\n/, " ", s); return s }
        NR == 1 { next }
        {
            if (NR > 2) printf ","
            printf "{\"name\":\"%s\",\"state\":\"%s\",\"summary\":\"%s\",\"blocker\":\"%s\",\"next\":\"%s\",\"tool\":\"%s\",\"terminal\":\"%s\"}",
                esc($2), esc($6), esc($7), esc($8), esc($9), esc($4), esc($5)
        }
    ' "$participants_file")"

    local participant_count
    participant_count="$(camp_participant_count "$project_root")"

    # Last activity timestamp for "last seen" display
    local last_activity_iso=""
    if [[ -f "$events_file" ]]; then
        last_activity_iso="$(awk 'NR>1{last=$1} END{print last}' "$events_file")"
    fi
    local last_activity_html=""
    if [[ -n "$last_activity_iso" ]]; then
        last_activity_html="$(printf '%s' "$last_activity_iso" | camp_html_escape)"
    fi

    # Check for campfire-core asset (base64 inline if small enough)
    local campfire_b64=""
    local export_dir
    export_dir="$(printf '%s/design/export' "$project_root")"
    local campfire_file=""
    for f in "$export_dir"/campfire-core*.png "$export_dir"/campfire-core*.webp "$export_dir"/campfire-core*.svg; do
        if [[ -f "$f" ]]; then
            # Only inline if under 15KB
            local fsize
            fsize="$(wc -c < "$f" | tr -d ' ')"
            if [[ "$fsize" -lt 15360 ]]; then
                campfire_b64="$(camp_assets_base64 "$f" 2>/dev/null || true)"
            fi
            break
        fi
    done

    cat > "$output_path" <<'HTMLEOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet">
  <title>Camp</title>
  <style>
    :root {
      --bg: #131318; --surface: #1b1b20; --card: #222228;
      --text: #e4e1e9; --muted: #8a8a9a;
      --ember: #ff9f4a; --review: #f6d365; --smoke: #8fa1b3; --ready: #7fd98f; --cyan: #00dce5;
    }
    * { box-sizing: border-box; margin: 0; }
    body { min-height: 100vh; font-family: Inter, system-ui, sans-serif; color: var(--text); background: var(--bg); overflow-x: hidden; }
    .camp { max-width: 640px; margin: 0 auto; padding: 48px 24px; position: relative; z-index: 5; }

    /* Header — project name only */
    .camp-header { margin-bottom: 40px; }
    .camp-name { font-family: "Space Grotesk", system-ui, sans-serif; font-size: 14px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }

    /* Night sky */
    .sky { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
    .star { position: absolute; border-radius: 50%; background: #fff; }
    .moon-haze { position: absolute; top: -5%; right: 10%; width: 350px; height: 350px; border-radius: 50%; background: radial-gradient(circle, rgba(205,193,224,0.07) 0%, transparent 60%); }

    /* Mission — the campfire */
    .mission { margin-bottom: 48px; padding: 24px; background: var(--surface); border-left: 3px solid var(--ember); position: relative; }
    .fire-glow { position: absolute; top: 50%; left: 0; width: 300px; height: 300px; transform: translate(-40%, -50%); background: radial-gradient(circle, rgba(255,159,74,0.14) 0%, rgba(255,159,74,0.05) 35%, transparent 65%); pointer-events: none; animation: flicker 3s ease-in-out infinite alternate; }
    .mission-label { font-family: "Space Grotesk", system-ui, sans-serif; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ember); margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
    .mission-icon { flex-shrink: 0; }
    .mission-title { font-family: "Space Grotesk", system-ui, sans-serif; font-size: 20px; line-height: 1.4; margin-bottom: 12px; }
    .mission-next { font-size: 14px; color: var(--cyan); }

    /* Corner accents — 4px pixel neon brackets */
    .corner-accent { position: absolute; width: 4px; height: 4px; background: var(--cyan); opacity: 0.5; }
    .corner-accent.br { bottom: 0; right: 0; }
    .corner-accent.tl { top: 0; left: 0; }

    /* Return rows — the core recovery interface */
    .return-section { margin-bottom: 40px; }
    .return-row { padding: 16px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
    .return-row:first-child { border-top: 1px solid rgba(255,255,255,0.04); }
    .return-label { font-family: "Space Grotesk", system-ui, sans-serif; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); margin-bottom: 6px; }
    .return-value { font-size: 15px; line-height: 1.5; }
    .return-row[data-type="working"] .return-value { color: var(--ember); }
    .return-row[data-type="waiting"] .return-value { color: var(--review); }
    .return-row[data-type="next"] .return-value { color: var(--cyan); }

    /* Participant list — drill-down from return view */
    .participants { margin-bottom: 40px; }
    .participants-label { font-family: "Space Grotesk", system-ui, sans-serif; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); margin-bottom: 12px; }
    .participant { padding: 14px 16px; background: var(--surface); margin-bottom: 2px; cursor: pointer; transition: background 0.15s; }
    .participant:hover { background: var(--card); }
    .participant-header { display: flex; justify-content: space-between; align-items: center; }
    .participant-name { font-size: 14px; font-weight: 500; }
    .state-chip { font-family: "Space Grotesk", system-ui, sans-serif; font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase; padding: 3px 8px; display: inline-flex; align-items: center; gap: 4px; }
    .state-chip svg { width: 12px; height: 12px; flex-shrink: 0; }
    .state-modakbul { background: rgba(255,159,74,0.15); color: var(--ember); }
    .state-deungbul { background: rgba(246,211,101,0.15); color: var(--review); }
    .state-yeongi { background: rgba(143,161,179,0.15); color: var(--smoke); }
    .state-yeongi svg { animation: drift 3s ease-in-out infinite alternate; }
    .state-jangjak { background: rgba(127,217,143,0.15); color: var(--ready); }
    .state-bulssi { background: rgba(255,159,74,0.08); color: var(--ember); }

    /* Participant detail — hidden by default */
    .participant-detail { display: none; margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.04); font-size: 13px; line-height: 1.5; }
    .participant-detail .detail-label { font-family: "Space Grotesk", system-ui, sans-serif; font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); display: block; margin-bottom: 4px; margin-top: 10px; }
    .participant-detail .detail-label:first-child { margin-top: 0; }
    .detail-blocker { color: var(--smoke); }
    .detail-next { color: var(--ready); }
    .detail-resume { color: var(--cyan); font-family: "Space Grotesk", system-ui, sans-serif; }

    /* Empty state */
    .empty { padding: 24px; background: var(--surface); color: var(--muted); font-size: 14px; text-align: center; }

    /* Last seen */
    .last-seen { color: var(--muted); font-size: 12px; margin-bottom: 16px; }
    .last-seen span { color: var(--text); }

    /* Ground hint */
    .camp::after { content: ""; display: block; height: 1px; margin-top: 32px; background: linear-gradient(to right, transparent 0%, rgba(143,161,179,0.1) 30%, rgba(143,161,179,0.1) 70%, transparent 100%); }

    /* State summary bar */
    .state-bar { display: flex; gap: 2px; height: 4px; margin-bottom: 16px; border-radius: 0; overflow: hidden; }
    .state-bar-seg { height: 100%; transition: width 0.5s ease; }

    /* Footer */
    .camp-footer { color: var(--muted); font-size: 11px; padding-top: 12px; display: flex; justify-content: space-between; align-items: center; }

    /* Active participant pulse */
    .participant[data-state="modakbul"] { box-shadow: inset 0 0 0 rgba(255,159,74,0); animation: pulse 3s ease-in-out infinite; }

    /* Environment scene */
    .ground { position: fixed; bottom: 0; left: 0; right: 0; height: 15vh;
      background: linear-gradient(to top, #0d1f0d, #1a3d1a); z-index: 1; pointer-events: none; }
    .forest { position: fixed; bottom: 15vh; left: 0; right: 0; z-index: 2; pointer-events: none; }
    .ground-props { position: fixed; bottom: 0; left: 0; right: 0; height: 15vh; z-index: 3; pointer-events: none; }
    /* Stones around campfire */
    .stone { position: absolute; border-radius: 50%; background: #2a3a2a; }
    /* Grass blades */
    .grass { position: absolute; bottom: 14vh; width: 1px; background: linear-gradient(to top, #1a3d1a, #2d5a2d); }

    /* Animations */
    @keyframes twinkle { from { opacity: 0.6; } to { opacity: 1; } }
    @keyframes flicker { 0% { opacity: 0.85; } 50% { opacity: 1; } 100% { opacity: 0.9; } }
    @keyframes drift { from { transform: translateY(-50%); } to { transform: translateY(calc(-50% - 2px)); } }
    @keyframes pulse { 0%,100% { box-shadow: inset 0 0 0 rgba(255,159,74,0); } 50% { box-shadow: inset 0 0 12px rgba(255,159,74,0.04); } }
    @keyframes sway { 0%,100% { transform: skewX(0deg); } 50% { transform: skewX(2deg); } }
    @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; } }
  </style>
</head>
<body>
  <!-- SVG sprite sheet -->
  <svg xmlns="http://www.w3.org/2000/svg" style="display:none">
    <symbol id="ico-campfire" viewBox="0 0 32 32">
      <rect x="10" y="26" width="12" height="2" fill="#8B5E3C"/>
      <rect x="8" y="28" width="16" height="2" fill="#6B4226"/>
      <rect x="14" y="18" width="4" height="8" fill="#ff9f4a"/>
      <rect x="12" y="16" width="8" height="4" fill="#ff9f4a"/>
      <rect x="12" y="14" width="8" height="2" fill="#f6d365"/>
      <rect x="14" y="12" width="4" height="2" fill="#f6d365"/>
      <rect x="16" y="10" width="2" height="2" fill="#ffe0b2"/>
    </symbol>
    <symbol id="ico-bulssi" viewBox="0 0 16 16">
      <rect x="7" y="10" width="2" height="4" fill="#ff9f4a" opacity="0.6"/>
      <rect x="7" y="8" width="2" height="2" fill="#ff9f4a" opacity="0.8"/>
      <rect x="6" y="12" width="4" height="2" fill="#8B5E3C" opacity="0.5"/>
    </symbol>
    <symbol id="ico-modakbul" viewBox="0 0 16 16">
      <rect x="5" y="12" width="6" height="2" fill="#8B5E3C"/>
      <rect x="6" y="8" width="4" height="4" fill="#ff9f4a"/>
      <rect x="5" y="6" width="6" height="3" fill="#ff9f4a"/>
      <rect x="6" y="4" width="4" height="2" fill="#f6d365"/>
      <rect x="7" y="2" width="2" height="2" fill="#ffe0b2"/>
    </symbol>
    <symbol id="ico-deungbul" viewBox="0 0 16 16">
      <rect x="7" y="10" width="2" height="4" fill="#8a8a9a"/>
      <rect x="6" y="6" width="4" height="4" fill="#f6d365" opacity="0.9"/>
      <rect x="5" y="5" width="6" height="1" fill="#f6d365"/>
      <rect x="5" y="10" width="6" height="1" fill="#8a8a9a"/>
      <rect x="7" y="4" width="2" height="1" fill="#ffe0b2"/>
    </symbol>
    <symbol id="ico-yeongi" viewBox="0 0 16 16">
      <rect x="7" y="12" width="2" height="2" fill="#8fa1b3" opacity="0.4"/>
      <rect x="6" y="10" width="2" height="2" fill="#8fa1b3" opacity="0.5"/>
      <rect x="7" y="8" width="2" height="2" fill="#8fa1b3" opacity="0.6"/>
      <rect x="8" y="6" width="2" height="2" fill="#8fa1b3" opacity="0.5"/>
      <rect x="7" y="4" width="2" height="2" fill="#8fa1b3" opacity="0.3"/>
    </symbol>
    <symbol id="ico-jangjak" viewBox="0 0 16 16">
      <rect x="3" y="11" width="10" height="2" fill="#7fd98f" opacity="0.7"/>
      <rect x="4" y="9" width="8" height="2" fill="#7fd98f" opacity="0.8"/>
      <rect x="5" y="7" width="6" height="2" fill="#7fd98f" opacity="0.6"/>
    </symbol>
  </svg>
  <div class="sky" id="sky"><div class="moon-haze"></div></div>

  <!-- Ground layer -->
  <div class="ground"></div>

  <!-- Forest silhouette — left edge -->
  <svg class="forest" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 30" preserveAspectRatio="none" style="width:32vw;height:22vh;position:fixed;bottom:14vh;left:0;z-index:2;">
    <polygon points="0,30 6,10 12,30" fill="#1a2e1a"/>
    <polygon points="8,30 16,6 24,30" fill="#162614"/>
    <polygon points="18,30 26,12 34,30" fill="#1a2e1a"/>
    <polygon points="28,30 34,16 40,30" fill="#162614"/>
    <polygon points="2,30 8,18 14,30" fill="#1e331e" opacity="0.7"/>
  </svg>

  <!-- Forest silhouette — right edge -->
  <svg class="forest" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 30" preserveAspectRatio="none" style="width:32vw;height:22vh;position:fixed;bottom:14vh;right:0;z-index:2;">
    <polygon points="60,30 66,16 72,30" fill="#162614"/>
    <polygon points="68,30 76,10 84,30" fill="#1a2e1a"/>
    <polygon points="76,30 84,14 92,30" fill="#162614"/>
    <polygon points="84,30 92,8 100,30" fill="#1a2e1a"/>
    <polygon points="86,30 92,18 98,30" fill="#1e331e" opacity="0.7"/>
  </svg>

  <!-- Ground props: stones + grass -->
  <div class="ground-props" id="ground-props"></div>

  <div class="camp">
    <header class="camp-header">
      <div class="camp-name" id="camp-name"></div>
      <div class="last-seen" id="last-seen"></div>
    </header>

    <section class="mission">
      <div class="fire-glow"></div>
      <span class="corner-accent br"></span>
      <div class="mission-label"><svg class="mission-icon" width="18" height="18"><use href="#ico-campfire"/></svg>Mission</div>
      <h1 class="mission-title" id="mission-title"></h1>
      <div class="mission-next" id="mission-next"></div>
    </section>

    <section class="return-section">
      <div class="return-row" data-type="working">
        <div class="return-label">Working now</div>
        <div class="return-value" id="working-now"></div>
      </div>
      <div class="return-row" data-type="waiting">
        <div class="return-label">Waiting on you</div>
        <div class="return-value" id="waiting-on-you"></div>
      </div>
      <div class="return-row" data-type="next">
        <div class="return-label">Next move</div>
        <div class="return-value" id="next-move"></div>
      </div>
    </section>

    <section class="participants">
      <div class="participants-label" id="participants-label"></div>
      <div id="participant-list"></div>
    </section>

    <div class="state-bar" id="state-bar"></div>
    <footer class="camp-footer">
      <span id="camp-footer"></span>
      <span id="camp-streak" style="color:var(--ember);font-size:10px"></span>
    </footer>
  </div>
  <script>
HTMLEOF

    # Inject data as JS
    cat >> "$output_path" <<EOF
    const DATA = {
      name: "${project_name_html}",
      mission: "${mission_title_html}",
      missionNext: "${mission_next_action_html}",
      workingNow: "${active_line_html}",
      waitingOnYou: "${waiting_line_html}",
      nextMove: "${next_line_html}",
      participantCount: ${participant_count},
      participants: [${participant_json}],
      lastActivity: "${last_activity_html}"
    };
EOF

    # Inject campfire asset if available
    if [[ -n "$campfire_b64" ]]; then
        cat >> "$output_path" <<EOF
    document.querySelector(".fire-glow").style.backgroundImage = "url(${campfire_b64})";
    document.querySelector(".fire-glow").style.backgroundSize = "contain";
    document.querySelector(".fire-glow").style.backgroundRepeat = "no-repeat";
    document.querySelector(".fire-glow").style.backgroundPosition = "center";
    document.querySelector(".fire-glow").style.opacity = "0.6";
EOF
    fi

    cat >> "$output_path" <<'HTMLEOF'
    const stateLabels = {bulssi:"불씨",modakbul:"모닥불",deungbul:"등불",yeongi:"연기",jangjak:"장작"};

    document.getElementById("camp-name").textContent = DATA.name;
    if (DATA.lastActivity) {
      const ago = (function(iso) {
        const d = new Date(iso), now = new Date(), s = Math.floor((now - d) / 1000);
        if (s < 60) return "방금 전";
        if (s < 3600) return Math.floor(s/60) + "분 전";
        if (s < 86400) return Math.floor(s/3600) + "시간 전";
        return Math.floor(s/86400) + "일 전";
      })(DATA.lastActivity);
      document.getElementById("last-seen").innerHTML = "마지막으로 여기 있었어요: <span>" + ago + "</span>";
    }
    document.getElementById("mission-title").textContent = DATA.mission;
    document.getElementById("mission-next").textContent = DATA.missionNext ? "→ " + DATA.missionNext : "";
    document.getElementById("working-now").textContent = DATA.workingNow;
    document.getElementById("waiting-on-you").textContent = DATA.waitingOnYou;
    document.getElementById("next-move").textContent = DATA.nextMove;
    document.getElementById("camp-footer").textContent = DATA.participantCount + " participants in camp";

    const list = document.getElementById("participant-list");
    if (DATA.participants.length === 0) {
      list.innerHTML = '<div class="empty"><svg width="24" height="24" style="opacity:0.4;margin-bottom:8px"><use href="#ico-campfire"/></svg><div>조용한 밤이에요.</div><div style="margin-top:6px;color:var(--cyan);font-size:12px">첫 미션을 정해보세요 — campsite camp mission set &quot;...&quot;</div></div>';
      document.getElementById("participants-label").textContent = "";
    } else {
      document.getElementById("participants-label").textContent = "In the camp";
      DATA.participants.forEach(p => {
        const el = document.createElement("div");
        el.className = "participant";
        el.setAttribute("data-state", p.state);
        const label = stateLabels[p.state] || p.state;
        let detailHtml = '<span class="detail-label">Summary</span>' + esc(p.summary);
        if (p.blocker) detailHtml += '<span class="detail-label">Blocker</span><span class="detail-blocker">' + esc(p.blocker) + '</span>';
        if (p.next) detailHtml += '<span class="detail-label">Next action</span><span class="detail-next">' + esc(p.next) + '</span>';
        detailHtml += '<span class="detail-label">Resume</span><span class="detail-resume">' + esc(p.tool) + ' in ' + esc(p.terminal) + '</span>';
        const icoSvg = '<svg width="12" height="12"><use href="#ico-' + p.state + '"/></svg>';
        el.innerHTML = '<div class="participant-header"><span class="participant-name">' + esc(p.name) + '</span><span class="state-chip state-' + p.state + '">' + icoSvg + label + '</span></div><div class="participant-detail">' + detailHtml + '</div>';
        el.onclick = () => {
          const d = el.querySelector(".participant-detail");
          d.style.display = d.style.display === "block" ? "none" : "block";
        };
        list.appendChild(el);
      });
    }

    function esc(s) {
      if (!s) return "";
      const d = document.createElement("div"); d.textContent = s; return d.innerHTML;
    }

    // State summary bar
    (function() {
      const colors = {modakbul:"var(--ember)",deungbul:"var(--review)",yeongi:"var(--smoke)",jangjak:"var(--ready)",bulssi:"rgba(255,159,74,0.4)"};
      const counts = {};
      DATA.participants.forEach(p => { counts[p.state] = (counts[p.state]||0) + 1; });
      const bar = document.getElementById("state-bar");
      const total = DATA.participants.length || 1;
      ["modakbul","deungbul","yeongi","jangjak","bulssi"].forEach(s => {
        if (!counts[s]) return;
        const seg = document.createElement("div");
        seg.className = "state-bar-seg";
        seg.style.width = (counts[s]/total*100) + "%";
        seg.style.background = colors[s];
        seg.title = s + ": " + counts[s];
        bar.appendChild(seg);
      });
    })();

    // Generate stars
    (function() {
      const sky = document.getElementById("sky");
      const count = 35;
      for (let i = 0; i < count; i++) {
        const s = document.createElement("div");
        s.className = "star";
        const size = Math.random() > 0.7 ? 2 : 1;
        s.style.width = size + "px";
        s.style.height = size + "px";
        s.style.left = (Math.random() * 100) + "vw";
        s.style.top = (Math.random() * 60) + "vh";
        s.style.opacity = 0.3 + Math.random() * 0.5;
        s.style.animationDuration = (4 + Math.random() * 4) + "s";
        s.style.animationDelay = (Math.random() * 4) + "s";
        s.style.animation = "twinkle " + (4 + Math.random()*4).toFixed(1) + "s ease-in-out " + (Math.random()*4).toFixed(1) + "s infinite alternate";
        sky.appendChild(s);
      }
    })();

    // Generate ground props: stones + grass blades
    (function() {
      const props = document.getElementById("ground-props");
      if (!props) return;
      // Stones clustered near center (campfire area)
      const stoneDefs = [
        {l:"44%",b:"10vh",w:"10px",h:"7px"}, {l:"48%",b:"8vh",w:"7px",h:"5px"},
        {l:"52%",b:"9vh",w:"9px",h:"6px"}, {l:"56%",b:"11vh",w:"6px",h:"4px"},
        {l:"42%",b:"12vh",w:"5px",h:"4px"}
      ];
      stoneDefs.forEach(function(def) {
        const st = document.createElement("div");
        st.className = "stone";
        st.style.left = def.l; st.style.bottom = def.b;
        st.style.width = def.w; st.style.height = def.h;
        props.appendChild(st);
      });
      // Grass blades scattered across ground
      for (var i = 0; i < 28; i++) {
        const g = document.createElement("div");
        g.className = "grass";
        const h = 6 + Math.random() * 10;
        g.style.left = (Math.random() * 100) + "vw";
        g.style.height = h + "px";
        g.style.opacity = 0.5 + Math.random() * 0.4;
        g.style.animation = "sway " + (3 + Math.random() * 3).toFixed(1) + "s ease-in-out " + (Math.random() * 2).toFixed(1) + "s infinite";
        props.appendChild(g);
      }
    })();
  </script>
</body>
</html>
HTMLEOF

    printf '%s' "$output_path"
}

# ---------------------------------------------------------------------------
# camp_phaser_dist_dir — locate the Phaser build output directory.
#
# Search order:
#   1. CAMPSITE_ROOT/camp-client/dist  — git-clone dev path set by bin/campsite
#   2. $HOME/.campsite/camp-client/dist — default installed location
#   3. CAMPSITE_HOME/camp-client/dist  — custom install path
#
# Prints the path and returns 0 when found; prints nothing and returns 1 if
# no dist is available.
# ---------------------------------------------------------------------------
camp_phaser_dist_dir() {
    [[ -n "${CAMPSITE_DISABLE_PHASER:-}" ]] && return 1
    local candidate
    # Check CAMPSITE_ROOT (set by bin/campsite — could be ~/.campsite OR the
    # git-clone root depending on how _resolve_root resolved it).
    if [[ -n "${CAMPSITE_ROOT:-}" && -d "$CAMPSITE_ROOT/camp-client/dist" ]]; then
        printf '%s' "$CAMPSITE_ROOT/camp-client/dist"
        return 0
    fi
    # Default installed location
    candidate="$HOME/.campsite/camp-client/dist"
    if [[ -d "$candidate" ]]; then
        printf '%s' "$candidate"
        return 0
    fi
    # Custom CAMPSITE_HOME
    if [[ -n "${CAMPSITE_HOME:-}" && -d "$CAMPSITE_HOME/camp-client/dist" ]]; then
        printf '%s' "$CAMPSITE_HOME/camp-client/dist"
        return 0
    fi
    # Last resort: check next to lib/ (the actual git-clone, even when
    # CAMPSITE_ROOT resolved to ~/.campsite because that exists).
    # _CAMPSITE_CAMP_LOADED is sourced from CAMPSITE_LIB which is set in the
    # bin script; we can derive the repo root from CAMPSITE_LIB.
    if [[ -n "${CAMPSITE_LIB:-}" ]]; then
        candidate="$(cd "$CAMPSITE_LIB/.." 2>/dev/null && pwd)/camp-client/dist"
        if [[ -d "$candidate" ]]; then
            printf '%s' "$candidate"
            return 0
        fi
    fi
    return 1
}

# ---------------------------------------------------------------------------
# camp_render_phaser — Phaser-based renderer.
#
# Steps:
#   1. Generate camp.json via cmd_export (writes to .campsite/camp/camp.json).
#   2. Copy camp-client/dist/* into .campsite/camp/phaser/.
#   3. Patch the copied index.html to inject window.CAMP_STATE from camp.json.
#   4. Return the path to the patched index.html.
#
# Returns the absolute path of the rendered index.html on stdout.
# ---------------------------------------------------------------------------
camp_render_phaser() {
    local project_root="$1"

    # Locate the Phaser build
    local dist_dir
    dist_dir="$(camp_phaser_dist_dir)" || return 1

    local camp_d
    camp_d="$(camp_dir "$project_root")"

    # 1. Generate / refresh camp.json
    local camp_json="$camp_d/camp.json"
    # Call cmd_export which writes camp.json and also prints JSON to stdout.
    # We suppress stdout here — we only need the side-effect of writing the file.
    cmd_export > /dev/null 2>&1 || true
    # If cmd_export didn't create it (e.g. project not fully init'd), write a
    # minimal stub so the Phaser client can still load.
    if [[ ! -f "$camp_json" ]]; then
        printf '{"mission":{"title":"","status":"active"},"projects":[],"last_session":"","events_summary":[]}\n' > "$camp_json"
    fi

    # 2. Copy dist into .campsite/camp/phaser/
    local phaser_dir="$camp_d/phaser"
    mkdir -p "$phaser_dir"

    # Copy index.html and assets/ subtree
    cp "$dist_dir/index.html" "$phaser_dir/index.html"
    if [[ -d "$dist_dir/assets" ]]; then
        mkdir -p "$phaser_dir/assets"
        cp "$dist_dir/assets/"* "$phaser_dir/assets/" 2>/dev/null || true
    fi

    # 3. Inject window.CAMP_STATE before the first <script> tag
    # We read camp.json, strip newlines so it fits on one JS line, then patch
    # the copied index.html.
    local camp_json_inline
    # Use awk to collapse the JSON to a single line (bash 3.2 safe — no $'...')
    camp_json_inline="$(awk 'BEGIN{ORS=""}{print}' "$camp_json")"

    # Build the injection snippet
    local inject_script
    inject_script="<script>window.CAMP_STATE = ${camp_json_inline};<\/script>"

    # Insert the <script> tag before the first <script type="module"...> line
    # Use a temp file for portability (BSD sed -i needs an extension).
    local tmp_html
    tmp_html="$(mktemp)"
    # sed: on the line matching '<script type="module"', prepend the inject line.
    sed "s|<script type=\"module\"|${inject_script}<script type=\"module\"|" \
        "$phaser_dir/index.html" > "$tmp_html"
    mv "$tmp_html" "$phaser_dir/index.html"

    printf '%s/index.html' "$phaser_dir"
}

# ---------------------------------------------------------------------------
# camp_render_phaser_serve — Phaser serve: copy + inject live-poll snippet.
#
# Same as camp_render_phaser but also:
#   - Writes camp.json into the phaser dir so the Python server can expose it.
#   - Returns the directory that should be served.
# ---------------------------------------------------------------------------
camp_render_phaser_serve() {
    local project_root="$1"

    # Render once (also copies dist + patches index.html)
    local html_path
    html_path="$(camp_render_phaser "$project_root")" || return 1

    local phaser_dir
    phaser_dir="$(dirname "$html_path")"
    local camp_d
    camp_d="$(camp_dir "$project_root")"

    # Refresh signals before serving
    collector_git_snapshot "$project_root" 2>/dev/null || true
    collector_file_activity "$project_root" 2>/dev/null || true

    # Symlink / copy camp.json into phaser dir so the HTTP server exposes it.
    cp "$camp_d/camp.json" "$phaser_dir/camp.json" 2>/dev/null || true

    # Inject live-poll <script> if not already present.
    if ! grep -q 'phaser-live-poll' "$html_path" 2>/dev/null; then
        local poll_script
        poll_script='<script id="phaser-live-poll">setInterval(async()=>{try{const r=await fetch("camp.json?t="+Date.now());if(!r.ok)return;const d=await r.json();if(window.__campGame&&window.__campGame.scene){const s=window.__campGame.scene.getScene("CampScene")||window.__campGame.scene.getScene("ReturnScene");if(s&&s.refreshState)s.refreshState(d);}window.CAMP_STATE=d;}catch(e){}},3000);<\/script>'
        local tmp_html
        tmp_html="$(mktemp)"
        sed "s|</body>|${poll_script}</body>|" "$html_path" > "$tmp_html"
        mv "$tmp_html" "$html_path"
    fi

    printf '%s' "$phaser_dir"
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
    warn "could not open browser. Open manually: $file_path"
    return 1
}
