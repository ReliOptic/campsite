#!/usr/bin/env bash
# Campsite credential pattern scanning
[[ -n "${_CAMPSITE_SECURITY_LOADED:-}" ]] && return 0
_CAMPSITE_SECURITY_LOADED=1

# Pattern for common credential indicators
_CREDENTIAL_PATTERN='(api[_-]?key|secret|password|passwd|token|credential|private[_-]?key|AWS_SECRET|AWS_ACCESS|GITHUB_TOKEN|OPENAI_API_KEY|ANTHROPIC_API_KEY)'

# Scan a single file for credential patterns
# Returns 0 if clean, 1 if found
scan_credentials() {
    local file="$1"
    [[ -f "$file" ]] || return 0

    if grep -inE "$_CREDENTIAL_PATTERN" "$file" 2>/dev/null | grep -vE '^\s*(#|//|<!--)' | head -5 > /dev/null 2>&1; then
        warn "potential credentials in $file:"
        grep -inE "$_CREDENTIAL_PATTERN" "$file" 2>/dev/null | grep -vE '^\s*(#|//|<!--)' | head -5 >&2
        return 1
    fi

    return 0
}

# Scan all source-of-truth files in a project
# Returns 0 if clean, 1 if any findings
scan_project_files() {
    local project_root="$1"
    local found=0

    for file in "$project_root/status.md" "$project_root/handoff.md" "$project_root/decisions.md"; do
        if [[ -f "$file" ]]; then
            scan_credentials "$file" || found=1
        fi
    done

    return $found
}
