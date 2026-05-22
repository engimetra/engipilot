#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
#  ENGIPILOT — Vérification infrastructure
#  Usage : bash scripts/check-infra.sh
# ═══════════════════════════════════════════════════════════════════

set -euo pipefail
BOLD='\033[1m'; GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; RESET='\033[0m'

ok()   { echo -e "  ${GREEN}✅ $1${RESET}"; }
fail() { echo -e "  ${RED}❌ $1${RESET}"; }
warn() { echo -e "  ${YELLOW}⚠  $1${RESET}"; }

echo ""
echo -e "${BOLD}═══════════════════════════════════════════${RESET}"
echo -e "${BOLD}  ENGIPILOT — Vérification Infrastructure  ${RESET}"
echo -e "${BOLD}═══════════════════════════════════════════${RESET}"
echo ""

# ── 1. PostgreSQL natif ──────────────────────────────────────────
echo -e "${BOLD}[1/5] PostgreSQL (natif Windows)${RESET}"
if "/c/Program Files/PostgreSQL/17/bin/pg_isready" -h localhost -p 5432 -U postgres -q 2>/dev/null; then
  ok "PostgreSQL 17 — localhost:5432 — OK"
else
  fail "PostgreSQL n'est PAS accessible sur :5432"
  echo "      → Démarrer via Services Windows : postgresql-x64-17"
  echo "      → Ou : net start postgresql-x64-17"
fi
echo ""

# ── 2. Docker Desktop ────────────────────────────────────────────
echo -e "${BOLD}[2/5] Docker Desktop${RESET}"
if docker info --format '{{.ServerVersion}}' 2>/dev/null | grep -q "^[0-9]"; then
  DOCKER_VER=$(docker info --format '{{.ServerVersion}}' 2>/dev/null)
  ok "Docker Engine ${DOCKER_VER} — OK"
  DOCKER_OK=true
else
  fail "Docker Desktop engine est arrêté ou crashé"
  echo "      → Clic droit sur l'icône Docker dans la barre des tâches"
  echo "      → Quit Docker Desktop, puis relancer"
  DOCKER_OK=false
fi
echo ""

# ── 3. Conteneurs Docker ─────────────────────────────────────────
echo -e "${BOLD}[3/5] Conteneurs Docker (infra)${RESET}"
if [ "${DOCKER_OK:-false}" = "true" ]; then
  SERVICES=("engipilot-redis" "engipilot-kafka" "engipilot-minio")
  ALL_UP=true
  for svc in "${SERVICES[@]}"; do
    STATUS=$(docker inspect --format='{{.State.Status}}' "$svc" 2>/dev/null || echo "absent")
    HEALTH=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}n/a{{end}}' "$svc" 2>/dev/null || echo "")
    if [ "$STATUS" = "running" ]; then
      ok "$svc — $STATUS (health: $HEALTH)"
    else
      fail "$svc — $STATUS"
      ALL_UP=false
    fi
  done
  if [ "$ALL_UP" = "false" ]; then
    echo ""
    warn "Démarrer les services manquants :"
    echo "      docker compose -f docker-compose.infra.yml up -d"
  fi
else
  warn "Docker arrêté — impossible de vérifier les conteneurs"
fi
echo ""

# ── 4. Frontend Next.js ──────────────────────────────────────────
echo -e "${BOLD}[4/5] Frontend Next.js${RESET}"
if curl -sf http://localhost:3000/api/auth/me -o /dev/null 2>/dev/null; then
  ok "Next.js — http://localhost:3000 — OK"
elif curl -sf http://localhost:3000 -o /dev/null 2>/dev/null; then
  ok "Next.js — http://localhost:3000 — OK (pas encore authentifié)"
else
  warn "Next.js n'est PAS démarré"
  echo "      → cd frontend && pnpm dev"
fi
echo ""

# ── 5. Résumé ports ─────────────────────────────────────────────
echo -e "${BOLD}[5/5] Ports actifs${RESET}"
PORTS=(5432 3000 6379 9092 9000 9001 9090 3001)
LABELS=("PostgreSQL" "Next.js" "Redis" "Kafka" "MinIO API" "MinIO Console" "Prometheus" "Grafana")
for i in "${!PORTS[@]}"; do
  PORT=${PORTS[$i]}
  LABEL=${LABELS[$i]}
  if command -v nc &>/dev/null; then
    nc -z -w1 localhost "$PORT" 2>/dev/null && ok ":${PORT} ${LABEL}" || warn ":${PORT} ${LABEL} — fermé"
  else
    (echo >/dev/tcp/localhost/"$PORT") &>/dev/null && ok ":${PORT} ${LABEL}" || warn ":${PORT} ${LABEL} — fermé"
  fi
done
echo ""
echo -e "${BOLD}═══════════════════════════════════════════${RESET}"
echo ""
