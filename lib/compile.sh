#!/usr/bin/env bash
# Campsite context compiler — adapter-based compilation
[[ -n "${_CAMPSITE_COMPILE_LOADED:-}" ]] && return 0
_CAMPSITE_COMPILE_LOADED=1

# Adapter config variables (set by adapter_load)
ADAPTER_NAME=""
ADAPTER_CONTEXT_FILE=""
ADAPTER_LOCATION=""
ADAPTER_FORMAT=""
ADAPTER_COMMAND=""
ADAPTER_SECTIONS=""

# Find adapter file by name
# Checks user overrides first, then built-in
_adapter_find() {
    local name="$1"
    local global_dir
    global_dir="$(campsite_global_dir)"

    # User override
    local user_path="$global_dir/user/adapters/${name}.sh"
    [[ -f "$user_path" ]] && { printf '%s' "$user_path"; return 0; }

    # Built-in (installed location)
    local builtin_path="$global_dir/adapters/${name}.sh"
    [[ -f "$builtin_path" ]] && { printf '%s' "$builtin_path"; return 0; }

    # Dev mode: source tree
    if [[ -n "${CAMPSITE_ROOT:-}" ]]; then
        local dev_path="$CAMPSITE_ROOT/adapters/${name}.sh"
        [[ -f "$dev_path" ]] && { printf '%s' "$dev_path"; return 0; }
    fi

    return 1
}

# List all available adapter names
adapter_list() {
    local global_dir
    global_dir="$(campsite_global_dir)"
    local -A seen

    # Built-in adapters (installed)
    if [[ -d "$global_dir/adapters" ]]; then
        for f in "$global_dir/adapters"/*.sh; do
            [[ -f "$f" ]] || continue
            local name
            name="$(basename "$f" .sh)"
            seen[$name]=1
            printf '%s\n' "$name"
        done
    fi

    # Dev mode adapters
    if [[ -n "${CAMPSITE_ROOT:-}" && -d "$CAMPSITE_ROOT/adapters" ]]; then
        for f in "$CAMPSITE_ROOT/adapters"/*.sh; do
            [[ -f "$f" ]] || continue
            local name
            name="$(basename "$f" .sh)"
            [[ -n "${seen[$name]:-}" ]] && continue
            seen[$name]=1
            printf '%s\n' "$name"
        done
    fi

    # User adapters (override, but may also add new ones)
    if [[ -d "$global_dir/user/adapters" ]]; then
        for f in "$global_dir/user/adapters"/*.sh; do
            [[ -f "$f" ]] || continue
            local name
            name="$(basename "$f" .sh)"
            [[ -n "${seen[$name]:-}" ]] && continue
            seen[$name]=1
            printf '%s\n' "$name"
        done
    fi
}

# Load adapter config into ADAPTER_* variables
adapter_load() {
    local name="$1"
    local adapter_file
    adapter_file="$(_adapter_find "$name")" || fail "adapter not found: $name"

    ADAPTER_NAME="$(field_value_plain "$adapter_file" "name")"
    ADAPTER_CONTEXT_FILE="$(field_value_plain "$adapter_file" "context-file")"
    ADAPTER_LOCATION="$(field_value_plain "$adapter_file" "location")"
    ADAPTER_FORMAT="$(field_value_plain "$adapter_file" "format")"
    ADAPTER_COMMAND="$(field_value_plain "$adapter_file" "command")"
    ADAPTER_SECTIONS="$(field_value_plain "$adapter_file" "sections")"

    [[ -n "$ADAPTER_CONTEXT_FILE" ]] || fail "adapter $name missing context-file"
    [[ -n "$ADAPTER_COMMAND" ]] || fail "adapter $name missing command"
}

# Extract the last N decisions from decisions.md
# Decisions are separated by ## headers (level 2)
_extract_recent_decisions() {
    local file="$1"
    local count="${CAMPSITE_DECISION_COUNT:-5}"
    
    [[ -f "$file" ]] || return 0
    
    # Use awk to extract last N decision blocks
    # Each block starts with "## " and ends before the next "## " or EOF
    awk -v n="$count" '
        /^## / {
            # Store the line number where each decision starts
            starts[++num_decisions] = NR
        }
        {
            # Store all lines
            lines[NR] = $0
        }
        END {
            if (num_decisions == 0) {
                # No decisions found, print everything
                for (i = 1; i <= NR; i++) print lines[i]
            } else {
                # Calculate which decision to start from
                start_from = num_decisions - n + 1
                if (start_from < 1) start_from = 1
                
                # Print from the start of the chosen decision to the end
                start_line = starts[start_from]
                for (i = start_line; i <= NR; i++) print lines[i]
            }
        }
    ' "$file"
}

# Compile context for a specific adapter
# Returns the path to the compiled file
compile_context() {
    local project_root="$1"
    local adapter_name="$2"

    adapter_load "$adapter_name"

    local project_name
    project_name="$(basename "$project_root")"

    # Determine output path
    local output_path
    case "${ADAPTER_LOCATION:-project-root}" in
        project-root)
            output_path="$project_root/$ADAPTER_CONTEXT_FILE"
            ;;
        *)
            output_path="$project_root/$ADAPTER_CONTEXT_FILE"
            ;;
    esac

    # Create parent dir if needed (for .github/copilot-instructions.md)
    mkdir -p "$(dirname "$output_path")"

    # Safety: don't overwrite non-campsite files
    if [[ -f "$output_path" ]]; then
        local marker="${CAMPSITE_HEADER_MARKER:-<!-- Generated by campsite sync. Do not edit directly. -->}"
        if ! head -5 "$output_path" | grep -qF "campsite sync" 2>/dev/null; then
            fail "$output_path exists and was not generated by campsite. Refusing to overwrite."
        fi
    fi

    # Build the compiled context
    {
        # Header
        printf '%s\n' "${CAMPSITE_HEADER_MARKER:-<!-- Generated by campsite sync. Do not edit directly. -->}"
        printf '<!-- Source: status.md, handoff.md, decisions.md, README.md -->\n\n'
        printf '# %s — Session Context\n\n' "$project_name"

        # Sections based on adapter config
        local sections="${ADAPTER_SECTIONS:-status handoff decisions readme}"
        for section in $sections; do
            case "$section" in
                readme)
                    if [[ -f "$project_root/README.md" ]]; then
                        printf '## Project Overview\n\n'
                        cat "$project_root/README.md"
                        printf '\n\n'
                    fi
                    ;;
                status)
                    if [[ -f "$project_root/status.md" ]]; then
                        printf '## Current Status\n\n'
                        cat "$project_root/status.md"
                        printf '\n\n'
                    fi
                    ;;
                handoff)
                    if [[ -f "$project_root/handoff.md" ]]; then
                        printf '## Next Action\n\n'
                        cat "$project_root/handoff.md"
                        printf '\n\n'
                    fi
                    ;;
                decisions)
                    if [[ -f "$project_root/decisions.md" ]]; then
                        printf '## Recent Decisions\n\n'
                        _extract_recent_decisions "$project_root/decisions.md"
                        printf '\n\n'
                    fi
                    ;;
            esac
        done

        # Session protocol
        printf '## Session Protocol\n\n'
        printf 'Before ending this session, update status.md and handoff.md with:\n'
        printf '%s\n' '- What you accomplished'
        printf '%s\n' '- What the next session should do'
        printf '%s\n' '- Any blockers or open questions'
        printf '\n'
        printf 'This ensures the next session (on any device, any agent) can continue seamlessly.\n'

    } > "$output_path"

    printf '%s' "$output_path"
}

# Remove compiled file for an adapter
compile_cleanup() {
    local project_root="$1"
    local adapter_name="$2"

    adapter_load "$adapter_name"

    local output_path
    case "${ADAPTER_LOCATION:-project-root}" in
        project-root)
            output_path="$project_root/$ADAPTER_CONTEXT_FILE"
            ;;
        *)
            output_path="$project_root/$ADAPTER_CONTEXT_FILE"
            ;;
    esac

    if [[ -f "$output_path" ]]; then
        # Only remove if it's campsite-generated
        if head -5 "$output_path" | grep -qF "campsite sync" 2>/dev/null; then
            rm -f "$output_path"
        fi
    fi
}

# Clean all compiled files in a project
compile_cleanup_all() {
    local project_root="$1"

    while IFS= read -r adapter_name; do
        compile_cleanup "$project_root" "$adapter_name" 2>/dev/null || true
    done < <(adapter_list)
}
