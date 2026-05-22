#!/usr/bin/env bash
# ================================================================
# ENGIPILOT — Script de configuration sécurisée du serveur
# Recommandation encadreur : NE PAS utiliser le compte root pour SSH
#
# Usage :  sudo bash setup-server.sh
# Prérequis : Ubuntu 22.04 ou 24.04 LTS
# ================================================================
set -euo pipefail

# ── Variables configurables ──────────────────────────────────────
DEPLOY_USER="engipilot"
DEPLOY_HOME="/home/${DEPLOY_USER}"
PROJECT_DIR="${DEPLOY_HOME}/app"
SSH_PORT=22                     # Changer si nécessaire (ex : 2222)

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()   { echo -e "${GREEN}[✓]${NC} $*"; }
warn()  { echo -e "${YELLOW}[⚠]${NC} $*"; }
error() { echo -e "${RED}[✗]${NC} $*"; exit 1; }

# ── Vérification root ────────────────────────────────────────────
[[ $EUID -ne 0 ]] && error "Ce script doit être exécuté en tant que root"

log "=== Configuration sécurisée ENGIPILOT ==="

# ── 1. Mise à jour système ───────────────────────────────────────
log "Mise à jour du système..."
apt-get update -qq && apt-get upgrade -y -qq

# ── 2. Création de l'utilisateur dédié ──────────────────────────
log "Création de l'utilisateur dédié '${DEPLOY_USER}'..."

if id "${DEPLOY_USER}" &>/dev/null; then
    warn "L'utilisateur '${DEPLOY_USER}' existe déjà — on continue"
else
    useradd -m -s /bin/bash -d "${DEPLOY_HOME}" "${DEPLOY_USER}"
    # Générer un mot de passe aléatoire fort
    GENERATED_PASS=$(openssl rand -base64 32)
    echo "${DEPLOY_USER}:${GENERATED_PASS}" | chpasswd
    log "Utilisateur '${DEPLOY_USER}' créé"
    echo ""
    warn "MOT DE PASSE GÉNÉRÉ (à sauvegarder dans un gestionnaire de mots de passe) :"
    warn "  Utilisateur : ${DEPLOY_USER}"
    warn "  Mot de passe: ${GENERATED_PASS}"
    echo ""
fi

# Ajouter au groupe docker et sudo (sudo limité via sudoers)
usermod -aG docker "${DEPLOY_USER}" 2>/dev/null || warn "Groupe docker absent — installer Docker d'abord"
usermod -aG sudo "${DEPLOY_USER}"

# ── 3. Configuration SSH sécurisée ──────────────────────────────
log "Configuration SSH sécurisée..."

SSHD_CONFIG="/etc/ssh/sshd_config"
cp "${SSHD_CONFIG}" "${SSHD_CONFIG}.backup.$(date +%Y%m%d)"

# Désactiver la connexion root via SSH (recommandation encadreur)
if grep -q "^PermitRootLogin" "${SSHD_CONFIG}"; then
    sed -i 's/^PermitRootLogin.*/PermitRootLogin no/' "${SSHD_CONFIG}"
else
    echo "PermitRootLogin no" >> "${SSHD_CONFIG}"
fi

# Désactiver l'auth par mot de passe (forcer les clés SSH)
if grep -q "^PasswordAuthentication" "${SSHD_CONFIG}"; then
    sed -i 's/^PasswordAuthentication.*/PasswordAuthentication no/' "${SSHD_CONFIG}"
else
    echo "PasswordAuthentication no" >> "${SSHD_CONFIG}"
fi

# Autres paramètres de sécurité SSH
cat >> "${SSHD_CONFIG}" << 'SSHEOF'

# === ENGIPILOT Security Configuration ===
AllowUsers engipilot           # Seul l'utilisateur engipilot peut se connecter
MaxAuthTries 3                 # Bloquer après 3 tentatives échouées
ClientAliveInterval 300        # Déconnecter les sessions inactives après 5 min
ClientAliveCountMax 2
X11Forwarding no               # Désactiver le forwarding X11
PrintMotd no
Banner /etc/ssh/banner         # Bannière d'avertissement
SSHEOF

# Créer une bannière d'avertissement légale
cat > /etc/ssh/banner << 'BANNEREOF'
╔══════════════════════════════════════════════════════════════╗
║   ENGIPILOT — Accès Autorisé Uniquement                     ║
║   Toute connexion non autorisée est interdite et tracée.    ║
║   Les accès sont journalisés et audités.                    ║
╚══════════════════════════════════════════════════════════════╝
BANNEREOF

# Redémarrer SSH
systemctl restart sshd
log "SSH configuré : connexion root désactivée, user '${DEPLOY_USER}' uniquement"

# ── 4. Configurer les clés SSH pour l'utilisateur ───────────────
log "Configuration des clés SSH..."
mkdir -p "${DEPLOY_HOME}/.ssh"
chmod 700 "${DEPLOY_HOME}/.ssh"
touch "${DEPLOY_HOME}/.ssh/authorized_keys"
chmod 600 "${DEPLOY_HOME}/.ssh/authorized_keys"
chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "${DEPLOY_HOME}/.ssh"

warn "IMPORTANT : Ajouter votre clé SSH publique dans ${DEPLOY_HOME}/.ssh/authorized_keys"
warn "  Depuis votre machine locale : ssh-copy-id ${DEPLOY_USER}@<IP_SERVEUR>"
warn "  Ou manuellement : cat ~/.ssh/id_rsa.pub | ssh ${DEPLOY_USER}@<IP_SERVEUR> 'cat >> ~/.ssh/authorized_keys'"

# ── 5. Configurer sudo limité pour l'utilisateur ────────────────
log "Configuration sudo limitée..."
cat > "/etc/sudoers.d/${DEPLOY_USER}" << SUDOEOF
# Permissions sudo limitées pour l'utilisateur ENGIPILOT
# L'utilisateur peut exécuter Docker et les commandes de déploiement
${DEPLOY_USER} ALL=(ALL) NOPASSWD: /usr/bin/docker, /usr/bin/docker-compose, /usr/local/bin/docker-compose
${DEPLOY_USER} ALL=(ALL) NOPASSWD: /bin/systemctl restart engipilot, /bin/systemctl status engipilot
${DEPLOY_USER} ALL=(ALL) NOPASSWD: /usr/bin/apt-get update, /usr/bin/apt-get upgrade
SUDOEOF
chmod 440 "/etc/sudoers.d/${DEPLOY_USER}"

# ── 6. Firewall UFW ─────────────────────────────────────────────
log "Configuration du pare-feu UFW..."
apt-get install -y -qq ufw
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow "${SSH_PORT}/tcp" comment 'SSH'
ufw allow 80/tcp  comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
# Ports applicatifs accessibles uniquement en local (via reverse proxy)
# 8080, 8001, 3000 ne sont PAS exposés publiquement
ufw --force enable
log "Pare-feu configuré : ports 22, 80, 443 ouverts uniquement"

# ── 7. Fail2ban — protection brute force SSH ────────────────────
log "Installation Fail2ban..."
apt-get install -y -qq fail2ban
cat > /etc/fail2ban/jail.local << 'FAIL2BAN'
[DEFAULT]
bantime  = 3600       # Bloquer 1 heure
findtime = 600        # Fenêtre de détection : 10 minutes
maxretry = 5          # 5 tentatives max

[sshd]
enabled = true
port    = ssh
logpath = %(sshd_log)s
backend = %(sshd_backend)s
FAIL2BAN
systemctl enable --now fail2ban
log "Fail2ban activé — protection brute force SSH"

# ── 8. Docker ───────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
    log "Installation Docker..."
    curl -fsSL https://get.docker.com | sh
    usermod -aG docker "${DEPLOY_USER}"
    log "Docker installé"
else
    log "Docker déjà installé ($(docker --version))"
fi

# ── 9. Créer le répertoire de l'application ─────────────────────
log "Création du répertoire de l'application..."
mkdir -p "${PROJECT_DIR}"
chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "${PROJECT_DIR}"

# ── 10. Résumé final ────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   CONFIGURATION SERVEUR TERMINÉE                        ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  Utilisateur SSH dédié : ${DEPLOY_USER}                      ║"
echo "║  Connexion root SSH    : DÉSACTIVÉE                     ║"
echo "║  Auth par mot de passe : DÉSACTIVÉE (clés SSH requis)   ║"
echo "║  Pare-feu              : ACTIF (80, 443, 22)            ║"
echo "║  Fail2ban              : ACTIF                          ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  PROCHAINES ÉTAPES :                                    ║"
echo "║  1. Copier votre clé SSH publique :                     ║"
echo "║     ssh-copy-id ${DEPLOY_USER}@<IP_SERVEUR>                 ║"
echo "║  2. Tester la connexion :                               ║"
echo "║     ssh ${DEPLOY_USER}@<IP_SERVEUR>                         ║"
echo "║  3. Déployer ENGIPILOT :                                ║"
echo "║     cd ${PROJECT_DIR} && bash deploy.sh                  ║"
echo "╚══════════════════════════════════════════════════════════╝"
