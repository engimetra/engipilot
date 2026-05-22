import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { verifyJwt } from "@/lib/jwt"

export const dynamic = "force-dynamic"

function auth(req: NextRequest) {
  const token = req.cookies.get("engipilot_session")?.value
  if (!token) return null
  return verifyJwt(token)
}

// ── GET /api/projects/[id]/members ───────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  const { id } = await params

  try {
    const project = await prisma.project.findFirst({
      where: { id: id, companyId: payload.companyId, isActive: true },
    })
    if (!project) return NextResponse.json({ error: "Projet introuvable" }, { status: 404 })

    const members = await prisma.projectMember.findMany({
      where: { projectId: id },
      select: {
        role: true,
        user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
      orderBy: { joinedAt: "asc" },
    })

    const COLORS = ["#635BFF", "#FDAB3D", "#E2445C", "#00C875", "#8b5cf6", "#0ea5e9", "#f97316"]

    const result = members.map((m, i) => ({
      id:       m.user.id,
      name:     `${m.user.firstName} ${m.user.lastName}`,
      initials: `${m.user.firstName[0]}${m.user.lastName[0]}`.toUpperCase(),
      color:    COLORS[i % COLORS.length],
      role:     m.role,
      avatar:   m.user.avatar,
    }))

    return NextResponse.json(result)
  } catch (err) {
    console.error("[GET /api/projects/[id]/members]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
