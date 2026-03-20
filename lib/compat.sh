#!/usr/bin/env bash
# Campsite compatibility layer — platform detection and portable utilities
[[ -n "${_CAMPSITE_COMPAT_LOADED:-}" ]] && return 0
_CAMPSITE_COMPAT_LOADED=1

detect_platform() {
    case "$(uname -s)" in
        Darwin) printf 'mac' ;;
        Linux)
            if grep -qi microsoft /proc/version 2>/dev/null; then
                printf 'wsl'
            else
                printf 'linux'
            fi
            ;;
        *) printf 'unknown' ;;
    esac
}

portable_sha256() {
    local file="$1"
    if command -v sha256sum >/dev/null 2>&1; then
        sha256sum "$file" | cut -d' ' -f1
    elif command -v shasum >/dev/null 2>&1; then
        shasum -a 256 "$file" | cut -d' ' -f1
    elif command -v openssl >/dev/null 2>&1; then
        openssl dgst -sha256 "$file" | awk '{print $NF}'
    else
        printf 'no-sha256-tool' >&2
        return 1
    fi
}

detect_device() {
    local platform
    platform="$(detect_platform)"
    case "$platform" in
        mac)
            scutil --get LocalHostName 2>/dev/null || hostname -s 2>/dev/null || hostname
            ;;
        wsl)
            local h
            h="$(hostname 2>/dev/null || cat /etc/hostname 2>/dev/null || printf 'unknown')"
            printf '%s-wsl' "$h"
            ;;
        linux)
            hostname 2>/dev/null || cat /etc/hostname 2>/dev/null || printf 'unknown'
            ;;
        *)
            printf 'unknown'
            ;;
    esac
}

portable_stat_mtime() {
    local file="$1"
    local platform
    platform="$(detect_platform)"
    case "$platform" in
        mac)
            stat -f %m "$file" 2>/dev/null
            ;;
        *)
            stat -c %Y "$file" 2>/dev/null
            ;;
    esac
}

# Returns 0 if stdout is a terminal (supports colors/ANSI)
is_terminal() {
    [[ -t 1 ]]
}
