import path from "node:path"
import fs from "node:fs"
import { defineConfig } from "prisma/config"

// Charge .env.local manuellement car Prisma 7 ne le lit pas automatiquement
function readEnvFile(file: string): void {
  try {
    const content = fs.readFileSync(path.join(__dirname, file), "utf8")
    for (const line of content.split("\n")) {
      if (!line.trim() || line.startsWith("#")) continue
      const idx = line.indexOf("=")
      if (idx === -1) continue
      const key = line.slice(0, idx).trim()
      const val = line.slice(idx + 1).trim().replace(/^["']|["']$/g, "")
      if (key && !process.env[key]) process.env[key] = val
    }
  } catch { /* fichier absent — on continue */ }
}

readEnvFile(".env.local")
readEnvFile(".env")

// ═══════════════════════════════════════════════════════════════
//  ENGIPILOT — Prisma 7 Configuration
// ═══════════════════════════════════════════════════════════════
export default defineConfig({
  schema: path.join(__dirname, "prisma/schema.prisma"),
  datasource: {
    url: process.env.DATABASE_URL ?? "postgresql://postgres:password@localhost:5432/engipilot?schema=public",
  },
})
