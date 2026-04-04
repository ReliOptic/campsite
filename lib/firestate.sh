#!/usr/bin/env bash
# Campsite fire state derivation — signal-based fire state engine
[[ -n "${_CAMPSITE_FIRESTATE_LOADED:-}" ]] && return 0
_CAMPSITE_FIRESTATE_LOADED=1

# ---------------------------------------------------------------------------
# firestate_derive — determine fire state from real signals
#
# Priority order:
#   1. Agent active + recent commits → modakbul (활발)
#   2. Agent active, no commits yet → bulssi (시작 중)
#   3. Recent agent error exit → yeongi (문제 있음)
#   4. Agent ended + changes + within 30min → deungbul (검토 대기)
#   5. 4h+ absence → jangjak (대기)
#   6. Default → deungbul
# ---------------------------------------------------------------------------

firestate_derive() {
    local project_root="$1"

    local now
    now="$(date +%s)"

    # Last activity timestamp (epoch)
    local last_activity
    last_activity="$(collector_last_activity_ts "$project_root" 2>/dev/null || echo 0)"
    local absence_sec=$(( now - last_activity ))

    # Active agent count
    local active_agents
    active_agents="$(agent_active_count "$project_root" 2>/dev/null || echo 0)"

    # Recent commit count
    local recent_commits
    recent_commits="$(collector_recent_commits_count "$project_root" 3600 2>/dev/null || echo 0)"

    # Last agent exit code
    local last_exit
    last_exit="$(agent_last_exit_code "$project_root" 2>/dev/null || echo "")"

    # 1. Agent active + recent commits → modakbul
    if [[ "$active_agents" -gt 0 ]] 2>/dev/null && [[ "$recent_commits" -gt 0 ]] 2>/dev/null; then
        printf 'modakbul'
        return
    fi

    # 2. Agent active, no commits → bulssi
    if [[ "$active_agents" -gt 0 ]] 2>/dev/null; then
        printf 'bulssi'
        return
    fi

    # 3. Recent agent error exit (within 30min) → yeongi
    if [[ -n "$last_exit" ]] && [[ "$last_exit" -gt 0 ]] 2>/dev/null && [[ "$absence_sec" -lt 1800 ]] 2>/dev/null; then
        printf 'yeongi'
        return
    fi

    # 4. Agent ended + changes + within 30min → deungbul
    if [[ "$absence_sec" -lt 1800 ]] 2>/dev/null && [[ "$recent_commits" -gt 0 ]] 2>/dev/null; then
        printf 'deungbul'
        return
    fi

    # 5. 4h+ absence → jangjak
    if [[ "$absence_sec" -gt 14400 ]] 2>/dev/null; then
        printf 'jangjak'
        return
    fi

    # 6. Default
    printf 'deungbul'
}

# ---------------------------------------------------------------------------
# firestate_color — state → hex color (matches dashboard CSS variables)
# ---------------------------------------------------------------------------

firestate_color() {
    case "$1" in
        bulssi)   printf '#ff6600' ;;
        modakbul) printf '#ffaa00' ;;
        deungbul) printf '#ffdd88' ;;
        yeongi)   printf '#888888' ;;
        jangjak)  printf '#cc8844' ;;
        *)        printf '#cc8844' ;;
    esac
}

# ---------------------------------------------------------------------------
# firestate_label_ko — state → Korean label
# ---------------------------------------------------------------------------

firestate_label_ko() {
    case "$1" in
        bulssi)   printf '불씨 — 시작하는 중' ;;
        modakbul) printf '모닥불 — 활발하게 진행 중' ;;
        deungbul) printf '등불 — 검토를 기다리는 중' ;;
        yeongi)   printf '연기 — 문제가 있어요' ;;
        jangjak)  printf '장작 — 준비됨, 기다리는 중' ;;
        *)        printf '알 수 없음' ;;
    esac
}

# ---------------------------------------------------------------------------
# firestate_label_en — state → English label (fallback)
# ---------------------------------------------------------------------------

firestate_label_en() {
    case "$1" in
        bulssi)   printf 'Spark — getting started' ;;
        modakbul) printf 'Bonfire — actively working' ;;
        deungbul) printf 'Lantern — waiting for review' ;;
        yeongi)   printf 'Smoke — something went wrong' ;;
        jangjak)  printf 'Firewood — prepared, waiting' ;;
        *)        printf 'Unknown' ;;
    esac
}
