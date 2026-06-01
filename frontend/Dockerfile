# ═══════════════════════════════════════════════════════════════════════════
#  ENGIPILOT Frontend — Production Dockerfile
#  Multi-stage build: deps → builder → runner
#  Output: standalone mode for Docker
# ═══════════════════════════════════════════════════════════════════════════

# ── Stage 1 : Dépendances ────────────────────────────────────────────────
FROM node:22.12.0-alpine3.21 AS deps

WORKDIR /app

RUN npm install -g pnpm@9

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile


# ── Stage 2 : Build ─────────────────────────────────────────────────────
FROM node:22.12.0-alpine3.21 AS builder

WORKDIR /app

RUN npm install -g pnpm@9

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# ✅ Disable Next.js telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# ✅ Generate Prisma client before build
RUN pnpm prisma generate

# ✅ Execute Next.js build with verification
RUN pnpm build && \
    echo "📦 Build artifacts:" && \
    ls -lah .next/ && \
    echo "" && \
    if [ -f .next/required-server-files.json ]; then \
    echo "✅ required-server-files.json found — BUILD SUCCESS"; \
    else \
    echo "❌ required-server-files.json MISSING — BUILD FAILED"; \
    exit 1; \
    fi


# ── Stage 3 : Runtime ───────────────────────────────────────────────────
FROM node:22.12.0-alpine3.21 AS runner

WORKDIR /app

# ✅ Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# ✅ Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# ✅ Install pnpm (needed for runtime)
RUN npm install -g pnpm@9

# ✅ Copy build artifacts from builder
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# ✅ Switch to non-root user
USER nextjs

# ✅ Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# ✅ Expose port
EXPOSE 3000

# ✅ Start Next.js server in production mode
CMD ["pnpm", "start"]
