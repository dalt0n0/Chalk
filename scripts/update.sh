#!/usr/bin/env bash
#
# Update an existing Chalk Community Edition install (see install.sh).
# Usage: sudo /opt/chalk/scripts/update.sh

set -euo pipefail

CHALK_DIR="${CHALK_DIR:-/opt/chalk}"
CHALK_USER="${CHALK_USER:-chalk}"
CHALK_PORT="${CHALK_PORT:-3000}"

log()  { echo -e "\033[1;37m[chalk]\033[0m $*"; }
fail() { echo -e "\033[1;31m[chalk] $*\033[0m" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || fail "Run as root: sudo $0"
[ -d "$CHALK_DIR/.git" ] || fail "No install found at $CHALK_DIR."

cd "$CHALK_DIR"

log "Pulling latest..."
git pull --ff-only

log "Installing dependencies..."
npm ci --no-audit --no-fund >/dev/null

log "Applying database migrations..."
npx prisma migrate deploy

log "Rebuilding..."
npm run --silent build

chown -R "$CHALK_USER":"$CHALK_USER" "$CHALK_DIR"

log "Restarting service..."
systemctl restart chalk.service

for _ in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:${CHALK_PORT}/api/health" >/dev/null 2>&1; then
    log "Update complete. Chalk is healthy."
    exit 0
  fi
  sleep 1
done
fail "Service is not healthy after the update. Check: journalctl -u chalk -e"
