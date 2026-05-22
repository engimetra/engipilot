# ENGIPILOT — Guide de Sécurité

> Document répondant aux recommandations de l'encadreur :
> 1. **SSH sans root** — Utiliser un utilisateur dédié
> 2. **Images Docker stables** — Versions épinglées + scan Trivy

---

## 1. Connexion SSH sans root

### Problème (avant)
```bash
# MAUVAISE PRATIQUE — Ne plus utiliser
ssh root@serveur-ip
```

### Solution (après)
```bash
# BONNE PRATIQUE — Utilisateur dédié
ssh engipilot@serveur-ip
```

### Mise en place (une seule fois)

```bash
# Sur le serveur, en tant que root (pour la configuration initiale uniquement)
sudo bash scripts/setup-server.sh
```

Ce script automatise :
- Création de l'utilisateur `engipilot` avec mot de passe fort
- **Désactivation de la connexion root SSH** (`PermitRootLogin no`)
- **Désactivation de l'auth par mot de passe** (clés SSH uniquement)
- Configuration du pare-feu UFW (ports 22, 80, 443)
- Installation Fail2ban (protection brute force)
- Permissions sudo limitées (uniquement Docker et déploiement)

### Ajouter votre clé SSH
```bash
# Depuis votre machine locale
ssh-keygen -t ed25519 -C "engipilot-deploy"
ssh-copy-id -i ~/.ssh/id_ed25519.pub engipilot@<IP_SERVEUR>

# Tester la connexion
ssh engipilot@<IP_SERVEUR>
# Ne doit PAS demander de mot de passe (clé SSH uniquement)
```

### Vérifier la configuration SSH
```bash
# Sur le serveur
grep "PermitRootLogin\|PasswordAuthentication\|AllowUsers" /etc/ssh/sshd_config
# Attendu :
#   PermitRootLogin no
#   PasswordAuthentication no
#   AllowUsers engipilot
```

---

## 2. Images Docker stables et sécurisées

### Problème (avant)
```yaml
# MAUVAISE PRATIQUE — Tags flottants
image: minio/minio:latest          # Version inconnue
image: prom/prometheus:latest      # Peut changer sans avertissement
image: grafana/grafana:latest      # Vulnérabilités potentielles
```

### Solution (après)
```yaml
# BONNE PRATIQUE — Versions précises et épinglées
image: minio/minio:RELEASE.2024-11-07T00-52-20Z
image: prom/prometheus:v2.55.1
image: grafana/grafana:11.4.0
image: postgres:17.2-alpine3.21
image: redis:7.4.2-alpine3.21
image: nginx:1.27.3-alpine3.20
image: confluentinc/cp-kafka:7.5.6
```

### Pourquoi épingler les versions ?
- **Reproductibilité** : le même build donne la même image
- **Sécurité** : pas de mise à jour surprise incluant des vulnérabilités
- **Stabilité** : pas de régression lors d'un re-déploiement
- **Audit** : traçabilité exacte de ce qui est déployé

### Avantages des images Alpine
Les images `*-alpine` sont utilisées pour :
- Taille réduite (< 10 MB vs > 100 MB pour les images standard)
- Surface d'attaque réduite (moins de packages installés)
- Démarrage plus rapide

---

## 3. Scan des images avec Trivy

### Installation locale de Trivy
```bash
# macOS
brew install trivy

# Linux
curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh \
    | sh -s -- -b /usr/local/bin v0.58.0

# Vérification
trivy --version
```

### Scanner manuellement les images
```bash
# Avant de déployer, scanner les 3 images
bash scripts/scan-images.sh
```

### Comprendre le résultat
```
backend:latest (alpine 3.21.0)
================================
Total: 0 (HIGH: 0, CRITICAL: 0)  ← Aucune vulnérabilité → OK ✅
```

```
ia:latest (python 3.11.11 slim)
================================
┌──────────────────┬──────────────────┬──────────┐
│    Library       │  Vulnerability   │ Severity │
├──────────────────┼──────────────────┼──────────┤
│ libexpat1        │ CVE-2024-45492   │ HIGH     │  ← À corriger
└──────────────────┴──────────────────┴──────────┘
```

Si CVE HIGH ou CRITICAL trouvée :
```bash
# Mettre à jour l'image de base dans le Dockerfile
# FROM python:3.11.11-slim-bookworm → FROM python:3.11.12-slim-bookworm
# Puis rebuilder
docker compose build --no-cache ia-service
# Rescanner
bash scripts/scan-images.sh
```

### Scan dans le CI/CD (automatique)

Le pipeline GitHub Actions (`.github/workflows/ci-cd.yml`) inclut :
```yaml
- name: Scan Trivy — Backend
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: 'engipilot/backend:latest'
    severity: 'CRITICAL,HIGH'
    exit-code: '1'    # ← Le pipeline ÉCHOUE si CVE critique trouvée
```

Cela signifie : **impossible de déployer si une image contient une CVE critique**.

---

## 4. Sécurité des Dockerfiles

### Principe du moindre privilège — Non-root dans tous les containers

```dockerfile
# MAUVAISE PRATIQUE (root par défaut)
FROM python:3.11-slim
CMD ["uvicorn", "..."]

# BONNE PRATIQUE (utilisateur dédié)
FROM python:3.11-slim
RUN useradd -m -u 1000 engipilot && chown -R engipilot:engipilot /app
USER engipilot           # ← Non-root
CMD ["uvicorn", "..."]
```

Tous les Dockerfiles ENGIPILOT utilisent un utilisateur non-root.

### HEALTHCHECK intégré

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/actuator/health || exit 1
```

Docker redémarre automatiquement le container si le healthcheck échoue.

### Principe no-new-privileges dans docker-compose

```yaml
security_opt:
  - no-new-privileges:true    # Empêche l'escalade de privilèges
```

---

## 5. Checklist sécurité complète

### Serveur
- [x] Utilisateur SSH dédié `engipilot` créé
- [x] Connexion root SSH désactivée (`PermitRootLogin no`)
- [x] Auth par mot de passe SSH désactivée (clés uniquement)
- [x] Pare-feu UFW configuré (22, 80, 443)
- [x] Fail2ban actif (protection brute force)

### Images Docker
- [x] Toutes les versions épinglées (pas de `:latest`)
- [x] Images Alpine utilisées (surface d'attaque réduite)
- [x] Scan Trivy dans le CI/CD (bloquant si CVE critique)
- [x] Tous les containers tournent en non-root
- [x] `no-new-privileges: true` sur tous les services

### Application
- [x] JWT_SECRET fort (64+ chars)
- [x] HTTPS en production (Caddy / Let's Encrypt)
- [x] Rate limiting Nginx
- [x] Headers sécurité HTTP (X-Frame-Options, CSP...)
- [x] Multi-tenant (isolation données par organisation)
- [x] Audit logs (toutes les actions tracées)

---

## 6. Références

- [CIS Docker Benchmark](https://www.cisecurity.org/benchmark/docker)
- [OWASP Docker Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html)
- [Trivy Documentation](https://aquasecurity.github.io/trivy/)
- [SSH Hardening Guide](https://www.ssh-audit.com/hardening_guides.html)
