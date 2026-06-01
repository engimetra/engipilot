# ENGIPILOT Frontend — Production Debugging Guide

## 🔴 Erreurs Corrigées

### 1. **EvalError: Code generation from strings disallowed for this context**
✅ **Cause** : Middleware sans déclaration `runtime: "edge"`
✅ **Fix** : Ajout de `export const runtime = "edge"` dans `src/middleware.ts`

### 2. **Module parse failed: Unexpected character '@' in globals.css**
✅ **Cause** : PostCSS pas configuré ou fichier CSS non traité
✅ **Fix** : Vérification que `postcss.config.js` inclut tailwindcss (✅ OK)
✅ **Note** : Peut aussi être symptôme d'un build qui échoue en silenceUSE

### 3. **ENOENT: .next/required-server-files.json**
✅ **Cause** : Build n'a jamais été exécuté
✅ **Fix** : Dockerfile.prod contient `pnpm build` (✅ Vérifié)
✅ **Action** : S'assurer que build produit `.next/` avec ce fichier

### 4. **CSP Error avec 'unsafe-eval'**
✅ **Cause** : Content-Security-Policy autorise eval() en production
✅ **Fix** : Removed `'unsafe-eval'` from CSP in `next.config.ts`
✅ **Raison** : next-intl et runtime.edge n'ont pas besoin de eval()

---

## 🧪 Checklist de Vérification

### Avant le Build

```bash
# 1. Installer dépendances
pnpm install

# 2. Vérifier configuration
cat package.json | grep -A2 '"build"'
cat package.json | grep -A2 '"start"'

# 3. Vérifier .env.production
cat .env.production | grep NEXT_PUBLIC_

# 4. Vérifier TypeScript
pnpm typecheck

# 5. Vérifier linting
pnpm lint
```

### Pendant le Build

```bash
# 1. Exécuter build
pnpm build

# 2. Vérifier output
ls -lah .next/
ls -la .next/required-server-files.json

# 3. Vérifier standalone output
ls -la .next/standalone/
ls -la .next/static/

# 4. Vérifier Prisma client généré
ls -la .next/server/lib/prisma/
```

### Avant le Démarrage

```bash
# 1. Vérifier build artifact
[ -f ".next/required-server-files.json" ] && echo "✅ OK" || echo "❌ MISSING"

# 2. Vérifier permissions
chmod +x .next/standalone/server.js || true

# 3. Vérifier PORT
export PORT=3000
export HOSTNAME="0.0.0.0"

# 4. Test start
pnpm start

# 5. Curl test
curl http://localhost:3000
```

---

## 🐳 Docker Build & Run

### Build

```bash
docker build -f Dockerfile.prod -t engipilot-frontend:latest .

# Avec logs détaillés
docker build -f Dockerfile.prod --progress=plain -t engipilot-frontend:latest . 2>&1 | tee build.log
```

### Run

```bash
# Voir les logs du build
grep "required-server-files.json" build.log

# Si "✅ required-server-files.json found" → OK
# Si "❌ required-server-files.json MISSING" → Build failed

# Lancer le conteneur avec logs
docker run -it -p 3000:3000 \
  -e NODE_ENV=production \
  -e NEXT_TELEMETRY_DISABLED=1 \
  -e PORT=3000 \
  -e HOSTNAME="0.0.0.0" \
  -e NEXT_PUBLIC_API_URL="http://localhost:8080/api/v1" \
  engipilot-frontend:latest
```

### Docker Compose

```bash
# Build et run
docker compose build frontend
docker compose up frontend

# Vérifier logs
docker compose logs frontend -f
```

---

## 🔍 Diagnostic des Erreurs

### HTTP 500 - Startup Failure

**Causes possibles** :
1. ✅ `.next/required-server-files.json` absent → BUILD FAILED
   - Vérifier logs du stage 2 du Dockerfile
   - Exécuter `pnpm build` localement pour vérifier

2. ✅ `NODE_ENV` not set to production
   - Check: Dockerfile déclare `ENV NODE_ENV=production`

3. ✅ PORT not listening on 0.0.0.0
   - Check: Dockerfile déclare `ENV HOSTNAME="0.0.0.0"`

4. ✅ NEXT_PUBLIC_* vars not injected
   - Check: .env.prod or docker-compose.yml environment vars

5. ✅ Prisma client not generated
   - Check: Dockerfile run `pnpm prisma generate` before build

### Logs to Check

**In Docker container** :
```bash
# See startup logs
docker logs engipilot-frontend

# If error about missing .next files
# → Rebuild with full Docker logs shown
docker build --progress=plain -f Dockerfile.prod -t engipilot:test . 2>&1 | tail -100
```

---

## 📝 Fichiers Modifiés

### 1. src/middleware.ts
- ✅ Ajout : `export const runtime = "edge"`
- ✅ Raison : Support de next-intl avec Edge Runtime

### 2. next.config.ts
- ✅ Changement : CSP `script-src` removed `'unsafe-eval'`
- ✅ Raison : next-intl/edge n'a pas besoin de eval()

### 3. .env.production
- ✅ Ajout : `NEXT_PUBLIC_IA_URL` et `NEXT_PUBLIC_WS_URL`
- ✅ Ajout : `NODE_ENV=production`
- ✅ Raison : Complétude des variables nécessaires au build

### 4. Dockerfile.prod
- ✅ Ajout : Debug logs pour vérifier `required-server-files.json`
- ✅ Raison : Vérifier que build réussit

---

## ✅ Commandes de Test Final

```bash
# 1. Build local
cd frontend
pnpm install
pnpm build
ls -la .next/required-server-files.json  # Should exist

# 2. Start local
pnpm start

# 3. Test via Nginx
curl -H "Host: engipilot.ma" http://localhost:3000
# or via Nginx proxy
curl http://localhost/  # Should proxy to frontend:3000

# 4. Check logs
docker logs engipilot-nginx -f
docker logs engipilot-frontend -f
```

---

## 🚀 Production Checklist

- [ ] Build successful locally (`pnpm build`)
- [ ] `.next/required-server-files.json` exists
- [ ] Docker image builds without errors
- [ ] `next start` works in container
- [ ] Nginx can proxy to frontend:3000
- [ ] HTTP 200 response on GET /
- [ ] Middleware runs on Edge Runtime
- [ ] No CSP violations in browser console
- [ ] API routes work (proxy to backend)
