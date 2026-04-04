#!/usr/bin/env bash
set -euo pipefail

# Campsite installer
# Usage:
#   Local (from git clone):  ./install.sh
#   Remote:                  curl -fsSL https://raw.githubusercontent.com/ReliOptic/campsite/main/install.sh | bash

CAMPSITE_HOME="${CAMPSITE_HOME:-$HOME/.campsite}"
CAMPSITE_VERSION="${CAMPSITE_VERSION:-}"
REPO_URL="https://github.com/ReliOptic/campsite"

# Colors (only if terminal)
if [[ -t 1 ]]; then
    GREEN='\033[32m'
    DIM='\033[2m'
    BOLD='\033[1m'
    RESET='\033[0m'
else
    GREEN='' DIM='' BOLD='' RESET=''
fi

info()  { printf "${GREEN}%s${RESET}\n" "$*"; }
dim()   { printf "${DIM}%s${RESET}\n" "$*"; }
fail()  { printf "\033[31m%s\033[0m\n" "$*" >&2; exit 1; }

# --- Detect if running from a git clone or remote ---
detect_source() {
    local script_dir
    script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

    if [[ -f "$script_dir/bin/campsite" && -d "$script_dir/lib" ]]; then
        SOURCE_MODE="local"
        SOURCE_DIR="$script_dir"
    else
        SOURCE_MODE="remote"
        SOURCE_DIR=""
    fi
}

# --- Remote: clone to temp dir ---
fetch_remote() {
    local tmpdir
    tmpdir="$(mktemp -d)"
    trap "rm -rf '$tmpdir'" EXIT

    if [[ -n "$CAMPSITE_VERSION" ]]; then
        info "Fetching campsite $CAMPSITE_VERSION..."
        git clone --depth 1 --branch "$CAMPSITE_VERSION" "$REPO_URL.git" "$tmpdir/campsite" 2>/dev/null \
            || fail "Failed to fetch version $CAMPSITE_VERSION"
    else
        info "Fetching campsite (latest)..."
        git clone --depth 1 "$REPO_URL.git" "$tmpdir/campsite" 2>/dev/null \
            || fail "Failed to clone repository"
    fi

    SOURCE_DIR="$tmpdir/campsite"
}

# --- Install files ---
install_files() {
    local src="$1"

    info "Installing to $CAMPSITE_HOME..."

    # Create directory structure
    mkdir -p "$CAMPSITE_HOME"/{bin,lib,adapters,templates,config}
    mkdir -p "$CAMPSITE_HOME"/user/adapters

    # Copy core files
    cp "$src/bin/campsite" "$CAMPSITE_HOME/bin/campsite"
    chmod +x "$CAMPSITE_HOME/bin/campsite"

    # Copy libraries
    if [[ -d "$src/lib" ]]; then
        cp "$src"/lib/*.sh "$CAMPSITE_HOME/lib/"
    fi

    # Copy built-in adapters
    if [[ -d "$src/adapters" ]]; then
        for f in "$src"/adapters/*; do
            [[ -f "$f" ]] && cp "$f" "$CAMPSITE_HOME/adapters/"
        done
    fi

    # Copy templates
    cp "$src"/templates/* "$CAMPSITE_HOME/templates/"

    # Copy default config
    if [[ -f "$src/config/defaults.sh" ]]; then
        cp "$src/config/defaults.sh" "$CAMPSITE_HOME/config/defaults.sh"
    fi

    # Write version
    if [[ -f "$src/VERSION" ]]; then
        cp "$src/VERSION" "$CAMPSITE_HOME/VERSION"
    else
        printf 'dev\n' > "$CAMPSITE_HOME/VERSION"
    fi

    # ── Phaser camp-client (optional, requires node/npm) ──────────────────────
    # When camp-client/dist/ is already present in the source (e.g. pre-built
    # release tarball or a git clone where `npm run build` has already been run),
    # copy it directly.  Otherwise attempt to build from source if node is
    # available.  A warning is printed if building is not possible — the CLI
    # still works using the legacy HTML renderer.
    #
    # Future: a GitHub Releases tarball download path can replace the build step
    # here by fetching a pre-built dist/ archive and extracting it directly.
    local phaser_dest="$CAMPSITE_HOME/camp-client/dist"
    if [[ -d "$src/camp-client/dist" ]]; then
        dim "  copying pre-built Phaser dist..."
        mkdir -p "$CAMPSITE_HOME/camp-client"
        cp -r "$src/camp-client/dist" "$CAMPSITE_HOME/camp-client/dist"
        dim "  Phaser storyworld renderer installed"
    elif [[ -d "$src/camp-client" ]] && command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
        dim "  building Phaser camp-client (node $(node --version))..."
        (
            cd "$src/camp-client" \
            && npm install --silent 2>/dev/null \
            && npm run build 2>/dev/null
        ) && {
            mkdir -p "$CAMPSITE_HOME/camp-client"
            cp -r "$src/camp-client/dist" "$CAMPSITE_HOME/camp-client/dist"
            dim "  Phaser storyworld renderer installed"
        } || {
            printf '\033[33m  warning: Phaser client build failed — using legacy HTML renderer\033[0m\n'
        }
    else
        printf '\033[33m  note: node/npm not found — skipping Phaser build (legacy HTML renderer will be used)\033[0m\n'
        printf '\033[2m  To enable the Phaser storyworld later: cd %s/camp-client && npm install && npm run build\033[0m\n' "$src"
    fi

    # Create user config if not exists
    if [[ ! -f "$CAMPSITE_HOME/user/config.sh" ]]; then
        cat > "$CAMPSITE_HOME/user/config.sh" <<'USERCONF'
#!/usr/bin/env bash
# Campsite user configuration
# This file is never overwritten by install/update.

# Workspace root (uncomment and set):
# CAMPSITE_WORKSPACE="/path/to/your/workspace"
USERCONF
    fi
}

# --- PATH integration ---
setup_path() {
    local shell_block
    shell_block='
# Campsite
export CAMPSITE_HOME="$HOME/.campsite"
export PATH="$CAMPSITE_HOME/bin:$PATH"
# Shell wrapper for campsite go (cd requires same-shell execution)
campsite() {
    if [[ "${1:-}" == "go" ]]; then
        local target
        target="$(command campsite "$@")" || return $?
        if [[ -n "$target" && -d "$target" ]]; then
            cd "$target" || return 1
            printf "  \033[32m✓\033[0m jumped to: %s\n" "$target"
            return 0
        fi
    fi
    command campsite "$@"
}'

    local modified=0

    for profile in "$HOME/.bashrc" "$HOME/.zshrc" "$HOME/.profile" "$HOME/.bash_profile"; do
        if [[ -f "$profile" ]]; then
            if ! grep -q 'CAMPSITE_HOME' "$profile" 2>/dev/null; then
                printf '%s\n' "$shell_block" >> "$profile"
                modified=1
                dim "  added PATH to $profile"
            else
                dim "  PATH already in $profile"
            fi
        fi
    done

    if [[ $modified -eq 0 ]]; then
        dim "  PATH entries already configured"
    fi
}

# --- Dependency check ---
check_dependencies() {
    local missing=()

    # Bash version — indexed arrays and [[ ]] work on 3.2+, no associative arrays used
    if [[ "${BASH_VERSINFO[0]}" -lt 3 ]]; then
        missing+=("bash 3.2+ (current: $BASH_VERSION)")
    fi

    # Required tools
    for tool in sed awk; do
        command -v "$tool" >/dev/null 2>&1 || missing+=("$tool")
    done

    # SHA256 (any one of these)
    if ! command -v sha256sum >/dev/null 2>&1 && \
       ! command -v shasum >/dev/null 2>&1 && \
       ! command -v openssl >/dev/null 2>&1; then
        missing+=("sha256sum or shasum or openssl")
    fi

    if [[ ${#missing[@]} -gt 0 ]]; then
        fail "missing dependencies: ${missing[*]}"
    fi
}

# --- Main ---
main() {
    info "campsite installer"
    printf '\n'

    check_dependencies
    detect_source

    if [[ "$SOURCE_MODE" == "remote" ]]; then
        fetch_remote
    fi

    install_files "$SOURCE_DIR"
    setup_path

    local version
    version="$(cat "$CAMPSITE_HOME/VERSION" 2>/dev/null || cat "$CAMPSITE_HOME/version" 2>/dev/null || echo 'unknown')"

    printf '\n'
    info "campsite $version installed to $CAMPSITE_HOME"
    printf '\n'
    dim "Restart your shell or run:"
    dim "  export CAMPSITE_HOME=\"\$HOME/.campsite\""
    dim "  export PATH=\"\$CAMPSITE_HOME/bin:\$PATH\""
    printf '\n'
    dim "Then try:"
    dim "  campsite --version"
}

main "$@"
