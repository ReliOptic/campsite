#!/usr/bin/env bash
# Campsite credential pattern scanning
[[ -n "${_CAMPSITE_SECURITY_LOADED:-}" ]] && return 0
_CAMPSITE_SECURITY_LOADED=1

# Pattern for credential keywords that should have an assignment
_CREDENTIAL_KEYWORDS='(api[_-]?key|secret[_-]?key|password|passwd|private[_-]?key|AWS_SECRET|AWS_ACCESS|GITHUB_TOKEN|OPENAI_API_KEY|ANTHROPIC_API_KEY)'

# Pattern requiring assignment operator followed by a value (reduces false positives)
# Matches: key=value, key: value, key="value", key='value'
_CREDENTIAL_ASSIGNMENT_PATTERN="${_CREDENTIAL_KEYWORDS}[[:space:]]*[=:][[:space:]]*['\"]?[A-Za-z0-9+/=_-]{8,}"

# False positive patterns to exclude
_FALSE_POSITIVE_PATTERNS='(token limit|secret feature|password policy|api key rotation|token bucket|access token endpoint|password reset|secret sauce)'

# Scan a single file for credential patterns
# Returns 0 if clean, 1 if found
scan_credentials() {
    local file="$1"
    [[ -f "$file" ]] || return 0

    # Skip if CAMPSITE_SKIP_SECURITY is set
    [[ -n "${CAMPSITE_SKIP_SECURITY:-}" ]] && return 0

    local findings
    findings="$(grep -inE "$_CREDENTIAL_ASSIGNMENT_PATTERN" "$file" 2>/dev/null \
        | grep -vE '^\s*(#|//|<!--|%|;)' \
        | grep -viE "$_FALSE_POSITIVE_PATTERNS" \
        | head -5)"

    if [[ -n "$findings" ]]; then
        warn "potential credentials in $file:"
        printf '%s\n' "$findings" >&2
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
