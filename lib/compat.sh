#!/usr/bin/env bash
# Campsite compatibility layer — platform detection and portable utilities
[[ -n "${_CAMPSITE_COMPAT_LOADED:-}" ]] && return 0
_CAMPSITE_COMPAT_LOADED=1

_CAMPSITE_PLATFORM=""

# Sets _CAMPSITE_PLATFORM in the current shell context (no subshell).
# Callers that need the value should call this then read $_CAMPSITE_PLATFORM directly.
# detect_platform() also prints the value for callers that use $() substitution,
# but note that subshell callers will not benefit from the cache.
_campsite_init_platform() {
    [[ -n "$_CAMPSITE_PLATFORM" ]] && return 0
    case "$(uname -s)" in
        Darwin) _CAMPSITE_PLATFORM='mac' ;;
        Linux)
            if grep -qi microsoft /proc/version 2>/dev/null; then
                _CAMPSITE_PLATFORM='wsl'
            else
                _CAMPSITE_PLATFORM='linux'
            fi
            ;;
        *) _CAMPSITE_PLATFORM='unknown' ;;
    esac
}

detect_platform() {
    _campsite_init_platform
    printf '%s' "$_CAMPSITE_PLATFORM"
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
    _campsite_init_platform
    case "$_CAMPSITE_PLATFORM" in
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
    _campsite_init_platform
    case "$_CAMPSITE_PLATFORM" in
        mac)
            stat -f %m "$file" 2>/dev/null
            ;;
        *)
            stat -c %Y "$file" 2>/dev/null
            ;;
    esac
}

# Portable in-place sed (works on both GNU and BSD sed)
_portable_sed_i() {
    local expression="$1" file="$2"
    local tmpfile="${file}.campsite_tmp"
    sed "$expression" "$file" > "$tmpfile" && mv "$tmpfile" "$file"
}

# Returns 0 if stdout is a terminal (supports colors/ANSI)
is_terminal() {
    [[ -t 1 ]]
}
