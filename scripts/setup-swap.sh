#!/usr/bin/env bash
# ================================================================
# ENGIPILOT — Création d'un fichier swap (2 GB)
# Nécessaire sur les Droplets 2 GB pour absorber les pics mémoire
# Usage : sudo bash scripts/setup-swap.sh
# ================================================================
set -euo pipefail

SWAP_SIZE="2G"
SWAP_FILE="/swapfile"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓]${NC} $*"; }
warn() { echo -e "${YELLOW}[⚠]${NC} $*"; }

[[ $EUID -ne 0 ]] && { echo "Exécuter en root : sudo bash $0"; exit 1; }

# Vérifier si swap existe déjà
if swapon --show | grep -q "${SWAP_FILE}"; then
    warn "Swap déjà actif sur ${SWAP_FILE} — rien à faire"
    free -h
    exit 0
fi

log "Création du fichier swap ${SWAP_SIZE}..."
fallocate -l "${SWAP_SIZE}" "${SWAP_FILE}"
chmod 600 "${SWAP_FILE}"
mkswap "${SWAP_FILE}"
swapon "${SWAP_FILE}"

# Persistance au redémarrage
if ! grep -q "${SWAP_FILE}" /etc/fstab; then
    echo "${SWAP_FILE} none swap sw 0 0" >> /etc/fstab
fi

# Réduire la tendance à utiliser le swap (swappiness=10 = RAM en priorité)
sysctl vm.swappiness=10
echo "vm.swappiness=10" >> /etc/sysctl.conf

log "Swap configuré :"
free -h
log "swappiness=10 (RAM prioritaire, swap en secours)"
