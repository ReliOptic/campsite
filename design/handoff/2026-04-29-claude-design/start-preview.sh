#!/usr/bin/env bash
# Standalone preview launcher for the Claude Design handoff bundle.
# Required because the prototype loads `.jsx` files at runtime via Babel,
# which fails over file:// due to CORS. A trivial HTTP server is enough.
#
# Usage:
#   bash design/handoff/2026-04-29-claude-design/start-preview.sh [port]
#
# Default port: 4291

set -euo pipefail

PORT="${1:-4291}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVE_DIR="$SCRIPT_DIR/project"
ENTRY="Campsite Camp View.html"

if ! [[ -f "$SERVE_DIR/$ENTRY" ]]; then
    printf 'fatal: entry file not found at %s/%s\n' "$SERVE_DIR" "$ENTRY" >&2
    exit 1
fi

# Encoded entry path for the URL (spaces → %20).
ENC_ENTRY="${ENTRY// /%20}"
URL="http://localhost:${PORT}/${ENC_ENTRY}"

printf '\n  Campsite design handoff preview\n'
printf '  ───────────────────────────────\n'
printf '  serving: %s\n' "$SERVE_DIR"
printf '  entry  : %s\n' "$ENTRY"
printf '  url    : %s\n\n' "$URL"
printf '  Stop with Ctrl-C.\n\n'

# Best-effort browser open. macOS: open. Linux: xdg-open. Else: print only.
( sleep 0.6
  if command -v open >/dev/null 2>&1; then
      open "$URL" >/dev/null 2>&1 || true
  elif command -v xdg-open >/dev/null 2>&1; then
      xdg-open "$URL" >/dev/null 2>&1 || true
  fi
) &

cd "$SERVE_DIR"

# Prefer python3 (ships on macOS + every modern Linux); fall back to python.
if command -v python3 >/dev/null 2>&1; then
    exec python3 -m http.server "$PORT" --bind 127.0.0.1
elif command -v python >/dev/null 2>&1; then
    exec python -m http.server "$PORT" --bind 127.0.0.1
else
    printf 'fatal: neither python3 nor python is available for the preview server.\n' >&2
    printf '       Install python or use any static server pointed at: %s\n' "$SERVE_DIR" >&2
    exit 1
fi
