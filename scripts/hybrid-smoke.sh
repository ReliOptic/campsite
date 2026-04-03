#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

PROJECT="$TMPDIR/project"
REMOTE="$TMPDIR/remote.git"
HOME_DIR="$TMPDIR/home"

cp -R "$ROOT" "$PROJECT"
rm -rf "$PROJECT/.git"
mkdir -p "$HOME_DIR/user"
printf '#!/usr/bin/env bash\n' > "$HOME_DIR/user/config.sh"

cd "$PROJECT"

git init -b master >/dev/null 2>&1
git config user.name "Hybrid Smoke"
git config user.email "hybrid-smoke@example.com"
git add .
git commit -m "initial" >/dev/null 2>&1

git init --bare "$REMOTE" >/dev/null 2>&1
git remote add origin "$REMOTE"
git push -u origin master >/dev/null 2>&1

export CAMPSITE_HOME="$HOME_DIR"

printf '%s\n' "1. status"
bash bin/campsite status >/dev/null

printf '%s\n' "2. sync"
bash bin/campsite sync --adapter=claude >/dev/null || true

printf '%s\n' "3. camp overview"
bash bin/campsite camp overview >/dev/null

printf '%s\n' "4. camp render"
bash bin/campsite camp render --print-path --no-open >/dev/null

printf '%s\n' "5. save --push"
echo "- note: hybrid-smoke" >> status.md
bash bin/campsite save --push >/dev/null

printf '%s\n' "6. verify checkpoint commit"
git log --oneline -1 | grep -q "checkpoint:"

printf '%s\n' "7. verify remote advanced"
git --git-dir="$REMOTE" log refs/heads/master --oneline -1 | grep -q "checkpoint:"

printf '%s\n' "Hybrid smoke passed"
