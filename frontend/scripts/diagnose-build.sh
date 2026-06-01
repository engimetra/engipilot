#!/bin/bash

# ═══════════════════════════════════════════════════════════════
#  ENGIPILOT Frontend Build Diagnostics
#  Vérifie tous les pré-requis avant de lancer le build
# ═══════════════════════════════════════════════════════════════

set -e

echo "📋 ENGIPILOT Frontend Build Diagnostics"
echo "========================================"

# ── 1. Vérifier Node.js et pnpm ───────────────────────────────
echo ""
echo "1️⃣  Node.js & Package Manager"
echo "─────────────────────────────"
node --version || echo "❌ Node.js not found"
pnpm --version || echo "❌ pnpm not found"

# ── 2. Vérifier structure de répertoires ───────────────────────
echo ""
echo "2️⃣  Directory Structure"
echo "─────────────────────"
[ -d "src" ] && echo "✅ src/" || echo "❌ src/ missing"
[ -d "public" ] && echo "✅ public/" || echo "❌ public/ missing"
[ -f "next.config.ts" ] && echo "✅ next.config.ts" || echo "❌ next.config.ts missing"
[ -f "package.json" ] && echo "✅ package.json" || echo "❌ package.json missing"
[ -f "tsconfig.json" ] && echo "✅ tsconfig.json" || echo "❌ tsconfig.json missing"
[ -f "tailwind.config.ts" ] && echo "✅ tailwind.config.ts" || echo "❌ tailwind.config.ts missing"
[ -f "postcss.config.js" ] && echo "✅ postcss.config.js" || echo "❌ postcss.config.js missing"

# ── 3. Vérifier dépendances critiques ────────────────────────
echo ""
echo "3️⃣  Critical Dependencies"
echo "──────────────────────────"
grep -q '"next"' package.json && echo "✅ next in package.json" || echo "❌ next not found"
grep -q '"react"' package.json && echo "✅ react in package.json" || echo "❌ react not found"
grep -q '"next-intl"' package.json && echo "✅ next-intl in package.json" || echo "❌ next-intl not found"
grep -q '"tailwindcss"' package.json && echo "✅ tailwindcss in package.json" || echo "❌ tailwindcss not found"

# ── 4. Vérifier fichiers de configuration clés ────────────────
echo ""
echo "4️⃣  Key Config Files"
echo "────────────────────"
[ -f ".env.production" ] && echo "✅ .env.production exists" || echo "⚠️  .env.production missing"
[ -d "node_modules" ] && echo "✅ node_modules exists" || echo "❌ node_modules missing (run pnpm install)"

# ── 5. Vérifier format des fichiers ──────────────────────────
echo ""
echo "5️⃣  File Format Check"
echo "─────────────────────"
if [ -f "src/app/globals.css" ]; then
  head -n 3 src/app/globals.css | grep -q "@tailwind" && echo "✅ globals.css has @tailwind directives" || echo "❌ globals.css missing @tailwind"
fi

# ── 6. Vérifier build scripts ────────────────────────────────
echo ""
echo "6️⃣  Build Scripts"
echo "─────────────────"
grep -q '"build": "next build"' package.json && echo "✅ build script configured" || echo "❌ build script not found"
grep -q '"start": "next start"' package.json && echo "✅ start script configured" || echo "❌ start script not found"

# ── 7. Suggestions ──────────────────────────────────────────
echo ""
echo "7️⃣  Next Steps"
echo "──────────────"
echo "• Run: pnpm install"
echo "• Run: pnpm build"
echo "• Check: ls -la .next/ (should contain required-server-files.json)"
echo "• Run: pnpm start"
echo ""

echo "✅ Diagnostics complete!"
