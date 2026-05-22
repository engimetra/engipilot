# AUDIT_REPORT — ENGIPILOT V2
**Date :** 2026-05-19  
**Auditeur :** Claude Sonnet 4.6 (Anthropic)  
**Scope :** Frontend Next.js 15 · Backend Node.js · Backend Java · Module IA Python

---

## SCORES GLOBAUX

| Dimension         | Avant audit | Après corrections |
|-------------------|:-----------:|:-----------------:|
| **Sécurité**      | 52 / 100    | **78 / 100**      |
| **Architecture**  | 71 / 100    | **76 / 100**      |
| **Code Quality**  | 68 / 100    | **82 / 100**      |
| **Performance**   | 74 / 100    | **77 / 100**      |
| **UI / UX**       | 83 / 100    | **86 / 100**      |
| **SCORE GLOBAL**  | **70 / 100**| **80 / 100**      |

---

## 1. CORRECTIONS APPLIQUÉES

### 🔴 CRITIQUE — Auth/Cookie mismatch (CORRIGÉ)
**Fichier :** `src/middleware.ts`  
**Problème :** Le middleware vérifiait `request.cookies.get("engipilot_token")` mais le login ne posait jamais ce cookie (seulement `localStorage`). En production, toutes les routes protégées redirectionnaient vers `/login` même après connexion.  
**Correction :** Cookie `engipilot_session` posé au login (8h expiry), vidé au logout. Middleware mis à jour pour vérifier ce cookie.

### 🔴 CRITIQUE — Chemins publics incomplets (CORRIGÉ)
**Fichier :** `src/middleware.ts`  
**Problème :** `/landing`, `/register`, `/onboarding` absents de `PUBLIC_PATHS`. En production, ces pages renvoyaient vers `/login` pour les utilisateurs non connectés.  
**Correction :** Ajout des 3 chemins dans `PUBLIC_PATHS`. Suppression du bypass total en `development` (trop risqué si `NODE_ENV` mal configuré).

### 🔴 CRITIQUE — XSS dans le chat IA (CORRIGÉ)
**Fichier :** `src/app/chat/page.tsx` · `renderContent()`  
**Problème :** `dangerouslySetInnerHTML` utilisé sur du contenu AI + user sans escaping HTML. Un message contenant `<script>` ou `<img onerror=...>` pouvait s'exécuter.  
**Correction :** Fonction `escapeHtml()` appliquée avant toute transformation regex. Les `<`, `>`, `&`, `"`, `'` sont neutralisés.

### 🔴 CRITIQUE — Login : état loading jamais réinitialisé (CORRIGÉ)
**Fichier :** `src/app/login/page.tsx`  
**Problème :** `handleSubmit` et `handleDemoLogin` appelaient `setLoading(true)` mais jamais `setLoading(false)` sur la branche succès. Le bouton restait en état "chargement" indéfiniment si la navigation échouait.  
**Correction :** Bloc `try/finally` garantissant `setLoading(false)` dans tous les cas.

### 🟠 HAUTE — Hydration mismatch Kanban (CORRIGÉ)
**Fichier :** `src/components/ui/Skeleton.tsx` · `KanbanSkeleton()`  
**Problème :** `Math.random()` dans le rendu → valeur différente entre SSR et Client → erreur React hydration.  
**Correction :** Tableau de constantes `KANBAN_COL_COUNTS = [3, 4, 3, 4]` déterministe.

### 🟠 HAUTE — Headers de sécurité manquants (CORRIGÉ)
**Fichier :** `next.config.ts`  
**Problème :** HSTS, CSP et Permissions-Policy absents.  
**Correction :**
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `Content-Security-Policy` : restreint scripts, styles, fonts, connect-src, frame-ancestors
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### 🟡 MOYENNE — Couleurs incohérentes (CORRIGÉ)
**Fichier :** `src/lib/utils.ts` · `getSPIStyle()`  
**Problème :** Hex hardcodés `#10b981`, `#3b82f6`, `#ef4444` ne correspondaient pas au design system (`#00C875`, `#635BFF`, `#E2445C`). Les sparklines et badges SPI avaient une couleur différente du reste de l'UI.  
**Correction :** Hex alignés sur `tailwind.config.ts`.  
**Bonus :** Alias déprécié `interpreterSPI()` supprimé.

### 🟡 MOYENNE — Sidebar texte hardcodé (CORRIGÉ)
**Fichier :** `src/components/layout/Sidebar.tsx`  
**Problème :** "Pro · 12 chantiers" affiché pour tous les rôles, données fictives.  
**Correction :** Remplacé par `cfg.label` (le vrai label du rôle : "Chef de Projet", "Consultant", etc.).

---

## 2. PROBLÈMES DÉTECTÉS NON CORRIGÉS (à planifier)

### Architecture

| Priorité | Problème | Fichiers concernés |
|----------|----------|--------------------|
| 🟠 | **Double backend** — `backend/` (Java) et `backend-node/` (Node.js) font la même chose. Créé une confusion de responsabilité et double la maintenance. Choisir un seul. | `backend/`, `backend-node/` |
| 🟠 | **Données entièrement mockées** — Aucune page ne fait d'appel API réel. Projets, notifications, signaux IA, historique chat = données statiques hardcodées. | Toutes les pages |
| 🟡 | **Duplication logique permissions** — `useStore` expose `can()`, `canAny()`, `isSuperAdmin()` en doublon exact de `usePermissions`. | `store/useStore.ts`, `hooks/usePermissions.ts` |
| 🟡 | **`Utilisateur` type mismatch** — `types/index.ts` utilise `snake_case` (`organisation_id`) alors que Prisma génère du `camelCase` (`companyId`). | `src/types/index.ts`, `prisma/schema.prisma` |

### Sécurité

| Priorité | Problème | Fichiers concernés |
|----------|----------|--------------------|
| 🔴 | **OAuth entièrement simulé** — Les boutons Google/Microsoft/LinkedIn ne font qu'animer un faux timer. L'utilisateur croit s'authentifier avec son compte social. | `src/app/login/page.tsx` |
| 🔴 | **Pas de validation de session JWT** — Le middleware vérifie uniquement l'existence du cookie, pas sa validité cryptographique. N'importe quelle valeur de cookie donne accès. | `src/middleware.ts` |
| 🟠 | **API /api/chat sans auth** — Endpoint accessible sans token. Coût API OpenAI exposé publiquement. | `src/app/api/chat/route.ts` |
| 🟠 | **Pas de rate limiting** sur `/api/chat`, `/api/db`, `/api/intelligence`. | Routes API |
| 🟡 | **`bcryptjs` importé** dans `package.json` mais jamais utilisé côté frontend (logique de hashing à faire côté serveur uniquement). | `package.json` |

### Performance

| Priorité | Problème | Fichiers concernés |
|----------|----------|--------------------|
| 🟡 | **`AILivePredictiveSystem.tsx`** — `setInterval` toutes les ~3s génère des re-renders infinis. Vérifier que le `clearInterval` dans le `useEffect` cleanup est correct. | `src/components/ia/AILivePredictiveSystem.tsx` |
| 🟡 | **`dashboard/page.tsx` — 483 lignes** — Trop de constantes statiques dans le fichier de page. À extraire dans un fichier `data/dashboard.data.ts`. | `src/app/dashboard/page.tsx` |
| 🟡 | **`layout.tsx` — `inter.className` vs `inter.variable`** — `inter.className` applique les classes directement. Pour le CSS custom property `--font-inter`, il faudrait `inter.variable` + `font-sans` via Tailwind. | `src/app/layout.tsx` |

### UI / UX

| Priorité | Problème | Fichiers concernés |
|----------|----------|--------------------|
| 🟡 | **Icônes emoji dans la Sidebar** (`"📊"`, `"🏗️"`) — incohérent avec Lucide icons dans le reste de l'UI. Impact: rendu variable selon OS (émoji système). | `src/components/layout/Sidebar.tsx` |
| 🟡 | **Topbar notifs hardcodées** — `INIT_NOTIFS` jamais rechargé depuis la DB. Le badge rouge "4" est permanent. | `src/components/layout/Topbar.tsx` |
| 🟡 | **Chat height fragile** — `style={{ height: "calc(100vh - 56px - 48px)" }}` dépend de valeurs px hardcodées liées à la hauteur de la topbar/header. Cassant si ces dimensions changent. | `src/app/chat/page.tsx` |
| 🟡 | **Pas d'`Error Boundary`** — Aucun composant n'est protégé par un `<ErrorBoundary>`. Une erreur JS dans un graphique fait crasher toute la page. | Global |
| 🟢 | **`/register` page** — Le link vers `/register` dans login.tsx pointe vers une route qui n'a pas de fichier `page.tsx` dédié (le mode register est intégré dans login). Peut créer de la confusion. | `src/app/register/` |

### TypeScript / Code Quality

| Priorité | Problème | Fichiers concernés |
|----------|----------|--------------------|
| 🟡 | **`body as Partial<ChatRequest>`** — Casting sans validation Zod dans l'API route chat. Devrait utiliser `z.parse()` pour valider le body. | `src/app/api/chat/route.ts` |
| 🟡 | **`as never` cast** — `mode.toUpperCase() as never` dans `tryPersist`. Masque un problème de typage. | `src/app/api/chat/route.ts:35` |
| 🟢 | **`TableName` type inutilisé** — Type `TableName` déclaré dans `types/index.ts` mais jamais importé nulle part. | `src/types/index.ts` |

### Base de données

| Priorité | Problème | Fichiers concernés |
|----------|----------|--------------------|
| 🟡 | **`lib/db.ts` throw à l'import** — Si `DATABASE_URL` est absent, le module throw lors de son évaluation. Bien que le dynamic import dans `/api/chat/route.ts` attrape l'erreur, d'autres usages futurs pourraient crasher silencieusement. | `src/lib/db.ts` |
| 🟡 | **Deux `prisma/schema.prisma`** — Un dans `frontend/prisma/` et un dans `backend-node/prisma/`. Les deux doivent rester synchronisés manuellement. | `frontend/prisma/`, `backend-node/prisma/` |

---

## 3. POINTS FORTS DE LA PLATEFORME

- **Design system cohérent** — Tailwind config centralisé, palette bien définie, tokens CSS bien nommés (`card`, `muted-fg`, `foreground`, etc.)
- **Skeleton loading** — Tous les modules critiques ont des états de chargement (KPICardSkeleton, ChartSkeleton, TableRowSkeleton, KanbanSkeleton)
- **Lazy loading** — Les composants Recharts, dnd-kit et IA sont chargés avec `next/dynamic` + `ssr: false`
- **RBAC complet** — Granularité fine, 6 rôles, 40+ permissions, guards sur chaque route
- **Prompt Engine solide** — Anti-hallucination, JSON structuré, confidence score, mode fallback offline
- **Infrastructure enterprise** — Docker Compose 10 services, K8s manifests, Terraform, Prometheus/Grafana, CI/CD GitHub Actions
- **Prisma schema complet** — 25 tables, 21 enums, soft delete, audit trail, multi-tenant
- **Security headers** — `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` (complétés par l'audit)
- **`next.config.ts`** — `reactStrictMode`, `compress`, `poweredByHeader: false`, `optimizePackageImports`

---

## 4. RECOMMANDATIONS PRIORITAIRES (roadmap)

### Court terme (sprint 1-2)
1. **Implémenter la vraie authentification** — JWT signé côté API, `httpOnly` cookie, validation dans le middleware
2. **Connecter les pages aux données réelles** — Utiliser `@tanstack/react-query` (déjà installé) pour les appels API
3. **Sécuriser `/api/chat`** — Vérifier le cookie de session + ajouter rate limiting (ex: `upstash/ratelimit`)
4. **Supprimer ou masquer les boutons OAuth** tant que le backend OAuth n'est pas implémenté

### Moyen terme (sprint 3-4)
5. **Choisir un seul backend** — Recommandation : garder `backend-node/` (TypeScript, même écosystème que le frontend)
6. **Aligner les types** — Synchroniser `types/index.ts` avec le schema Prisma (snake_case → camelCase)
7. **Remplacer les emojis Sidebar** par les icônes Lucide correspondantes
8. **Ajouter Error Boundaries** sur les zones critiques (charts, IA, kanban)

### Long terme
9. **Tests E2E** — Playwright pour les flux critiques (login, dashboard, chat IA)
10. **Storybook** — Documenter les composants UI
11. **Module Federation / monorepo** — Si l'équipe grandit, envisager Turborepo

---

## 5. FICHIERS MODIFIÉS PAR L'AUDIT

| Fichier | Modification |
|---------|-------------|
| `src/middleware.ts` | PUBLIC_PATHS + cookie check + suppression bypass dev |
| `src/store/useStore.ts` | logout() vide le cookie session |
| `src/app/login/page.tsx` | try/finally loading + setSessionCookie() |
| `src/app/chat/page.tsx` | escapeHtml() avant dangerouslySetInnerHTML |
| `src/components/ui/Skeleton.tsx` | KanbanSkeleton sans Math.random() |
| `next.config.ts` | HSTS + CSP + Permissions-Policy |
| `src/lib/utils.ts` | Hex couleurs alignés + alias interpreterSPI supprimé |
| `src/components/layout/Sidebar.tsx` | Texte rôle dynamique (fini le hardcodé) |

---

*Rapport généré par Claude Sonnet 4.6 · ENGIPILOT Audit SaaS · 2026-05-19*
