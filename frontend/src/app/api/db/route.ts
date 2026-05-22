/* ─────────────────────────────────────────────────────────────
   ENGIPILOT — GET /api/db
   Health check base de données + métriques Prisma
───────────────────────────────────────────────────────────── */
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(): Promise<NextResponse> {
  const start = Date.now()

  try {
    // Ping PostgreSQL
    await prisma.$queryRaw`SELECT 1`
    const latencyMs = Date.now() - start

    // Compte les enregistrements principaux
    const [companies, users, projects, tasks, aiAlerts, notifications] = await Promise.all([
      prisma.company.count(),
      prisma.user.count(),
      prisma.project.count(),
      prisma.task.count(),
      prisma.aiAlert.count(),
      prisma.notification.count(),
    ])

    return NextResponse.json({
      status:    "connected",
      provider:  "PostgreSQL",
      orm:       "Prisma 7",
      latencyMs,
      tables: {
        companies, users, projects, tasks, aiAlerts, notifications,
      },
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json(
      {
        status:  "error",
        message: error.message,
        hint:    "Vérifiez DATABASE_URL dans .env.local et que PostgreSQL est démarré",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}
