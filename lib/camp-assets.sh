#!/usr/bin/env bash
[[ -n "${_CAMPSITE_CAMP_ASSETS_LOADED:-}" ]] && return 0
_CAMPSITE_CAMP_ASSETS_LOADED=1

# Asset export directory (repo-level)
camp_assets_export_dir() {
    local project_root="$1"
    printf '%s/design/export' "$project_root"
}

# Runtime asset directory (per-project camp dir)
camp_assets_runtime_dir() {
    local project_root="$1"
    local dir
    dir="$(camp_dir "$project_root")/assets"
    mkdir -p "$dir"
    printf '%s' "$dir"
}

# Copy exported assets to the runtime camp directory
# Returns 0 if assets were copied, 1 if no exports exist
camp_assets_install() {
    local project_root="$1"
    local export_dir runtime_dir
    export_dir="$(camp_assets_export_dir "$project_root")"
    runtime_dir="$(camp_assets_runtime_dir "$project_root")"

    if [[ ! -d "$export_dir" ]]; then
        return 1
    fi

    local count=0
    local f
    for f in "$export_dir"/*.png "$export_dir"/*.webp "$export_dir"/*.svg; do
        [[ -f "$f" ]] || continue
        cp "$f" "$runtime_dir/"
        count=$((count + 1))
    done

    if [[ $count -eq 0 ]]; then
        return 1
    fi
    return 0
}

# Convert a small image file to a base64 data URI
# Usage: camp_assets_base64 path/to/image.png
# Outputs: data:image/png;base64,...
camp_assets_base64() {
    local file="$1"
    [[ -f "$file" ]] || return 1

    local mime
    case "$file" in
        *.png)  mime="image/png" ;;
        *.webp) mime="image/webp" ;;
        *.svg)  mime="image/svg+xml" ;;
        *.jpg|*.jpeg) mime="image/jpeg" ;;
        *) return 1 ;;
    esac

    local b64
    b64="$(base64 < "$file" | tr -d '\n')"
    printf 'data:%s;base64,%s' "$mime" "$b64"
}

# List available exported asset filenames (without path)
camp_assets_manifest() {
    local project_root="$1"
    local export_dir
    export_dir="$(camp_assets_export_dir "$project_root")"

    [[ -d "$export_dir" ]] || return 0

    local f
    for f in "$export_dir"/*.png "$export_dir"/*.webp "$export_dir"/*.svg; do
        [[ -f "$f" ]] || continue
        basename "$f"
    done
}

# Check if a specific asset exists in exports
camp_assets_has() {
    local project_root="$1" name="$2"
    local export_dir
    export_dir="$(camp_assets_export_dir "$project_root")"
    [[ -f "$export_dir/$name" ]]
}
