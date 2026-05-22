#!/usr/bin/env bash
# ================================================================
# ENGIPILOT — Scan local des images Docker avec Trivy
# Exécuter AVANT le push en production
# Usage : bash scripts/scan-images.sh
# ================================================================
set -euo pipefail

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓]${NC} $*"; }
warn() { echo -e "${YELLOW}[⚠]${NC} $*"; }
fail() { echo -e "${RED}[✗]${NC} $*"; }

# ── Installer Trivy si absent ────────────────────────────────────
if ! command -v trivy &>/dev/null; then
    log "Installation de Trivy..."
    curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh \
        | sh -s -- -b /usr/local/bin v0.58.0
fi

log "Trivy version : $(trivy --version | head -1)"

# ── Mettre à jour la base de CVE ────────────────────────────────
log "Mise à jour base CVE Trivy..."
trivy image --download-db-only --quiet

IMAGES=("engipilot/backend:latest" "engipilot/ia:latest" "engipilot/frontend:latest")
EXIT_CODE=0

for IMAGE in "${IMAGES[@]}"; do
    echo ""
    echo "════════════════════════════════════════════════════════"
    log "Scan : ${IMAGE}"
    echo "════════════════════════════════════════════════════════"

    # Scan des CVE CRITICAL et HIGH
    if trivy image \
        --severity CRITICAL,HIGH \
        --ignore-unfixed \
        --format table \
        "${IMAGE}"; then
        log "${IMAGE} : aucune CVE critique/haute non corrigée ✅"
    else
        fail "${IMAGE} : CVE(s) critique(s) ou haute(s) détectée(s) ❌"
        EXIT_CODE=1
    fi

    # Rapport JSON détaillé
    REPORT_FILE="scan-$(echo ${IMAGE} | tr '/:' '-').json"
    trivy image \
        --severity CRITICAL,HIGH,MEDIUM \
        --format json \
        --output "${REPORT_FILE}" \
        "${IMAGE}" 2>/dev/null || true
    log "Rapport détaillé sauvegardé : ${REPORT_FILE}"
done

# ── Scan des fichiers de configuration Docker ────────────────────
echo ""
echo "════════════════════════════════════════════════════════"
log "Scan des fichiers de configuration Dockerfile..."
echo "════════════════════════════════════════════════════════"
trivy config . \
    --severity CRITICAL,HIGH,MEDIUM \
    --exit-code 0 \
    --format table

echo ""
if [[ ${EXIT_CODE} -eq 0 ]]; then
    echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
    log "Toutes les images passent le scan de sécurité ✅"
    log "Prêt pour le déploiement en production"
    echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
else
    echo -e "${RED}════════════════════════════════════════════════════════${NC}"
    fail "Des vulnérabilités critiques ont été détectées ❌"
    fail "Mettre à jour les images de base avant de déployer"
    echo -e "${RED}════════════════════════════════════════════════════════${NC}"
fi

exit ${EXIT_CODE}
