#!/usr/bin/env bash
# Standalone preview launcher for the self-resource Active Camp sample.
# Serves design/system/ on port 4292 (handoff preview uses 4291).
#
# Usage:
#   bash design/system/preview/start-preview.sh [port]

set -euo pipefail

PORT="${1:-4292}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"          # design/system/
ENTRY_REL="preview/active-camp.html"

if ! [[ -f "$SERVE_DIR/$ENTRY_REL" ]]; then
    printf 'fatal: entry not found at %s/%s\n' "$SERVE_DIR" "$ENTRY_REL" >&2
    exit 1
fi

URL="http://localhost:${PORT}/${ENTRY_REL}"

printf '\n  Campsite self-resource Active Camp preview\n'
printf '  ──────────────────────────────────────────\n'
printf '  serving: %s\n' "$SERVE_DIR"
printf '  entry  : %s\n' "$ENTRY_REL"
printf '  url    : %s\n\n' "$URL"
printf '  Stop with Ctrl-C.\n\n'

( sleep 0.6
  if command -v open >/dev/null 2>&1; then
      open "$URL" >/dev/null 2>&1 || true
  elif command -v xdg-open >/dev/null 2>&1; then
      xdg-open "$URL" >/dev/null 2>&1 || true
  fi
) &

cd "$SERVE_DIR"

if command -v python3 >/dev/null 2>&1; then
    exec python3 -m http.server "$PORT" --bind 127.0.0.1
elif command -v python >/dev/null 2>&1; then
    exec python -m http.server "$PORT" --bind 127.0.0.1
else
    printf 'fatal: python3 or python required\n' >&2
    exit 1
fi
