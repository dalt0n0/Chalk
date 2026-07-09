#!/usr/bin/env bash
#
# Chalk Community Edition installer for Debian/Ubuntu.
#
#   curl -fsSL https://raw.githubusercontent.com/dalt0n0/Chalk/main/scripts/install.sh | sudo bash
#
# What it does:
#   1. Installs Node.js 22 (NodeSource) and git if missing
#   2. Clones Chalk to /opt/chalk (or updates an existing clone)
#   3. Creates .env (SQLite), runs migrations, seeds
#      the community program library, builds the app
#   4. Installs and starts a systemd service (chalk.service) on port 3000
#
# Configurable via environment variables:
#   CHALK_DIR   install location            (default /opt/chalk)
#   CHALK_REPO  git remote                  (default github.com/dalt0n0/Chalk)
#   CHALK_PORT  listen port                 (default 3000)
#   CHALK_USER  system user for the service (default chalk)

set -euo pipefail

CHALK_DIR="${CHALK_DIR:-/opt/chalk}"
CHALK_REPO="${CHALK_REPO:-https://github.com/dalt0n0/Chalk.git}"
CHALK_PORT="${CHALK_PORT:-3000}"
CHALK_USER="${CHALK_USER:-chalk}"
NODE_MAJOR=22

log()  { echo -e "\033[1;37m[chalk]\033[0m $*"; }
fail() { echo -e "\033[1;31m[chalk] $*\033[0m" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || fail "Run as root: curl -fsSL .../install.sh | sudo bash"
command -v apt-get >/dev/null 2>&1 || fail "This installer targets Debian/Ubuntu (apt-get not found)."

log "Installing base packages..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq ca-certificates curl git >/dev/null

# --- Node.js -----------------------------------------------------------------
need_node=1
if command -v node >/dev/null 2>&1; then
  major="$(node -v | sed 's/^v\([0-9]*\).*/\1/')"
  if [ "$major" -ge 20 ]; then
    need_node=0
    log "Node.js $(node -v) found."
  fi
fi
if [ "$need_node" -eq 1 ]; then
  log "Installing Node.js ${NODE_MAJOR}.x from NodeSource..."
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash - >/dev/null
  apt-get install -y -qq nodejs >/dev/null
  log "Node.js $(node -v) installed."
fi

# --- Service user + source ---------------------------------------------------
if ! id "$CHALK_USER" >/dev/null 2>&1; then
  log "Creating system user '$CHALK_USER'..."
  useradd --system --home-dir "$CHALK_DIR" --shell /usr/sbin/nologin "$CHALK_USER"
fi

if [ -d "$CHALK_DIR/.git" ]; then
  log "Existing install found at $CHALK_DIR; pulling latest..."
  git -C "$CHALK_DIR" pull --ff-only
else
  log "Cloning $CHALK_REPO to $CHALK_DIR..."
  git clone --depth 1 "$CHALK_REPO" "$CHALK_DIR"
fi
cd "$CHALK_DIR"

# --- Configuration -----------------------------------------------------------
if [ ! -f .env ]; then
  log "Creating .env (SQLite)..."
  cp .env.example .env
  sed -i 's|^DATABASE_URL=.*|DATABASE_URL="file:./chalk.db"|' .env
else
  log ".env already exists; leaving it alone."
fi

# --- Build -------------------------------------------------------------------
log "Installing dependencies (this can take a minute)..."
npm ci --no-audit --no-fund >/dev/null

log "Applying database migrations..."
npx prisma migrate deploy

log "Seeding the community program library..."
npm run --silent db:seed

log "Building the app..."
npm run --silent build

chown -R "$CHALK_USER":"$CHALK_USER" "$CHALK_DIR"

# --- systemd -----------------------------------------------------------------
log "Installing systemd service..."
cat > /etc/systemd/system/chalk.service <<UNIT
[Unit]
Description=Chalk Community Edition
After=network.target

[Service]
Type=simple
User=${CHALK_USER}
WorkingDirectory=${CHALK_DIR}
Environment=NODE_ENV=production
Environment=PORT=${CHALK_PORT}
ExecStart=$(command -v npm) start
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable --now chalk.service

# --- Health check ------------------------------------------------------------
log "Waiting for the app to come up..."
for _ in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:${CHALK_PORT}/api/health" >/dev/null 2>&1; then
    log "Chalk is running."
    log ""
    log "  URL:      http://$(hostname -I 2>/dev/null | awk '{print $1}'):${CHALK_PORT}"
    log "  Service:  systemctl status chalk"
    log "  Logs:     journalctl -u chalk -f"
    log "  Config:   ${CHALK_DIR}/.env"
    log "  Update:   sudo ${CHALK_DIR}/scripts/update.sh"
    log ""
    log "Create your account in the browser; the first steps are importing a"
    log "community program and starting a workout. Enjoy."
    exit 0
  fi
  sleep 1
done
fail "The service did not become healthy in 30s. Check: journalctl -u chalk -e"
