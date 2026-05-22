#!/bin/bash
# Obtention initiale du certificat Let's Encrypt pour engipilot.ma
# À exécuter UNE SEULE FOIS sur le serveur, avant de lancer le stack complet.
#
# Prérequis :
#   - DNS A record engipilot.ma → IP du serveur déjà propagé
#   - Ports 80 et 443 ouverts sur le pare-feu
#   - Docker et docker compose installés
#   - Variable EMAIL définie : EMAIL=admin@engipilot.ma ./infra/setup-ssl.sh
#
# Usage :
#   EMAIL=admin@engipilot.ma DOMAIN=engipilot.ma ./infra/setup-ssl.sh

set -e

EMAIL="${EMAIL:?La variable EMAIL est obligatoire (ex: admin@engipilot.ma)}"
DOMAIN="${DOMAIN:-engipilot.ma}"

echo "[1/4] Création des volumes certbot s'ils n'existent pas..."
docker volume create engipilot_certbot_webroot 2>/dev/null || true
docker volume create engipilot_certbot_certs   2>/dev/null || true

echo "[2/4] Démarrage nginx en mode HTTP uniquement pour le challenge ACME..."
# Remplacer temporairement la config SSL par une config HTTP-only
docker compose -f docker-compose.prod.yml up -d nginx

echo "[3/4] Obtention du certificat Let's Encrypt (webroot)..."
docker run --rm \
  -v engipilot_certbot_webroot:/var/www/certbot \
  -v engipilot_certbot_certs:/etc/letsencrypt \
  certbot/certbot:v3.0.1 certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "${EMAIL}" \
    --agree-tos \
    --no-eff-email \
    --domains "${DOMAIN},www.${DOMAIN}"

echo "[4/4] Redémarrage complet du stack avec HTTPS actif..."
docker compose -f docker-compose.prod.yml up -d

echo ""
echo "Certificat obtenu avec succès pour ${DOMAIN} et www.${DOMAIN}"
echo "Renouvellement automatique assuré par le service certbot (toutes les 12h)."
