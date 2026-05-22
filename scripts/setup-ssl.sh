#!/usr/bin/env bash
# ================================================================
# ENGIPILOT — Obtention du certificat SSL Let's Encrypt
# À exécuter UNE SEULE FOIS sur le Droplet, après que le DNS
# engipilot.ma pointe déjà vers l'IP du serveur.
#
# Prérequis :
#   - nginx container démarré (port 80 accessible publiquement)
#   - DNS propagé (vérifier : dig +short engipilot.ma)
#
# Usage : bash scripts/setup-ssl.sh
# ================================================================
set -euo pipefail

DOMAIN="engipilot.ma"
EMAIL="ismailamz27@gmail.com"
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()   { echo -e "${GREEN}[✓]${NC} $*"; }
warn()  { echo -e "${YELLOW}[⚠]${NC} $*"; }
error() { echo -e "${RED}[✗]${NC} $*"; exit 1; }

# ── 1. Vérifier que le DNS est propagé ──────────────────────────
log "Vérification DNS pour ${DOMAIN}..."
RESOLVED_IP=$(dig +short "${DOMAIN}" | tail -1)
SERVER_IP=$(curl -sf https://api.ipify.org || echo "")

if [[ -z "${RESOLVED_IP}" ]]; then
    error "Le domaine ${DOMAIN} ne résout pas. Configurer les enregistrements A d'abord."
fi

if [[ "${RESOLVED_IP}" != "${SERVER_IP}" ]]; then
    warn "ATTENTION : ${DOMAIN} pointe vers ${RESOLVED_IP}, ce serveur est ${SERVER_IP}"
    warn "Le certificat peut échouer si le DNS n'est pas encore propagé."
    read -rp "Continuer quand même ? (o/N) : " confirm
    [[ "${confirm,,}" == "o" ]] || exit 0
fi

# ── 2. Installer certbot ─────────────────────────────────────────
if ! command -v certbot &>/dev/null; then
    log "Installation de certbot..."
    apt-get update -qq
    apt-get install -y -qq certbot
fi

# ── 3. S'assurer que le répertoire webroot existe ────────────────
log "Création du répertoire webroot certbot..."
cd "${APP_DIR}"
docker compose -f docker-compose.prod.yml run --rm \
    -v "$(docker volume inspect engipilot_certbot_webroot --format '{{.Mountpoint}}'):/var/www/certbot" \
    nginx mkdir -p /var/www/certbot 2>/dev/null || true

# Le volume certbot_webroot est monté dans nginx via docker-compose.prod.yml
# On crée le dossier directement via docker exec
docker exec engipilot-nginx mkdir -p /var/www/certbot/.well-known/acme-challenge 2>/dev/null || true

# ── 4. Obtenir le certificat (webroot challenge via nginx) ────────
log "Obtention du certificat SSL pour ${DOMAIN} et www.${DOMAIN}..."

# Trouver le point de montage du volume certbot_webroot
WEBROOT_PATH=$(docker volume inspect engipilot_certbot_webroot --format '{{.Mountpoint}}' 2>/dev/null || echo "")

if [[ -z "${WEBROOT_PATH}" ]]; then
    error "Volume certbot_webroot introuvable. Démarrer nginx d'abord : docker compose -f docker-compose.prod.yml up -d nginx"
fi

certbot certonly \
    --webroot \
    --webroot-path "${WEBROOT_PATH}" \
    --email "${EMAIL}" \
    --agree-tos \
    --no-eff-email \
    --domains "${DOMAIN},www.${DOMAIN}"

# ── 5. Copier les certs dans le volume certbot_certs ────────────
log "Les certificats sont dans /etc/letsencrypt/live/${DOMAIN}/"
log "Le volume certbot_certs dans docker-compose.prod.yml les expose à nginx."

# ── 6. Configurer le renouvellement automatique ──────────────────
log "Configuration du renouvellement automatique..."

RENEW_SCRIPT="/usr/local/bin/engipilot-renew-ssl.sh"
cat > "${RENEW_SCRIPT}" << RENEWEOF
#!/usr/bin/env bash
# Renouvellement SSL automatique ENGIPILOT
set -euo pipefail
certbot renew --quiet --webroot --webroot-path "${WEBROOT_PATH}"
# Recharger nginx sans downtime
docker exec engipilot-nginx nginx -s reload
RENEWEOF
chmod +x "${RENEW_SCRIPT}"

# Cron : vérifier renouvellement deux fois par jour (recommandation Let's Encrypt)
CRON_JOB="0 3,15 * * * ${RENEW_SCRIPT} >> /var/log/engipilot-ssl-renew.log 2>&1"
(crontab -l 2>/dev/null | grep -v "engipilot-renew-ssl"; echo "${CRON_JOB}") | crontab -
log "Renouvellement automatique configuré (cron : 03h00 et 15h00)"

# ── 7. Redémarrer nginx avec les certificats ─────────────────────
log "Redémarrage nginx avec SSL activé..."
cd "${APP_DIR}"
docker compose -f docker-compose.prod.yml restart nginx

log ""
log "╔══════════════════════════════════════════════════════════╗"
log "║   CERTIFICAT SSL INSTALLÉ AVEC SUCCÈS                   ║"
log "╠══════════════════════════════════════════════════════════╣"
log "║  Domaine    : ${DOMAIN}                       ║"
log "║  Expire     : $(certbot certificates 2>/dev/null | grep 'Expiry Date' | head -1 | awk '{print $3, $4}')  ║"
log "║  Renouvell. : automatique (cron 03h00 + 15h00)          ║"
log "╠══════════════════════════════════════════════════════════╣"
log "║  Tester : https://${DOMAIN}                   ║"
log "╚══════════════════════════════════════════════════════════╝"
