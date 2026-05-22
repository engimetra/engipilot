import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { verifyJwt } from "@/lib/jwt"

export const dynamic = "force-dynamic"

function auth(req: NextRequest) {
  const token = req.cookies.get("engipilot_session")?.value
  if (!token) return null
  return verifyJwt(token)
}

const MEMBER_COLORS = ["#635BFF", "#FDAB3D", "#E2445C", "#00C875", "#8b5cf6"]

function statusToFrontend(status: string): string {
  switch (status) {
    case "IN_PROGRESS": return "EN_COURS"
    case "IN_REVIEW":   return "CONTROLE_QUALITE"
    case "DONE":        return "TERMINE"
    default:            return "A_FAIRE"  // TODO | BACKLOG | BLOCKED
  }
}

function statusToDb(status: string): string {
  switch (status) {
    case "EN_COURS":         return "IN_PROGRESS"
    case "CONTROLE_QUALITE": return "IN_REVIEW"
    case "TERMINE":          return "DONE"
    default:                 return "TODO"
  }
}

function priorityToFrontend(priority: string): string {
  switch (priority) {
    case "URGENT": return "CRITIQUE"
    case "HIGH":   return "HAUTE"
    case "LOW":    return "BASSE"
    default:       return "NORMALE"
  }
}

function priorityToDb(priority: string): string {
  switch (priority) {
    case "CRITIQUE": return "URGENT"
    case "HAUTE":    return "HIGH"
    case "BASSE":    return "LOW"
    default:         return "MEDIUM"
  }
}

// GET /api/tasks?projectId=xxx
export async function GET(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const projectId = req.nextUrl.searchParams.get("projectId")
  if (!projectId) return NextResponse.json({ error: "projectId requis" }, { status: 400 })

  try {
    const project = await prisma.project.findFirst({
      where: { id: projectId, companyId: payload.companyId, deletedAt: null },
    })
    if (!project) return NextResponse.json({ error: "Projet introuvable" }, { status: 404 })

    const tasks = await prisma.task.findMany({
      where: {
        projectId,
        isActive:  true,
        deletedAt: null,
        status:    { notIn: ["CANCELLED"] },
      },
      orderBy: [{ columnOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true, title: true, description: true, status: true, priority: true,
        tags: true, progress: true, endDate: true, createdAt: true,
        assignee: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    // Build dynamic members map from unique assignees
    const membersMap: Record<string, { name: string; initials: string; color: string }> = {}
    let colorIdx = 0
    for (const t of tasks) {
      if (t.assignee && !membersMap[t.assignee.id]) {
        const ini = `${t.assignee.firstName[0]}${t.assignee.lastName[0]}`.toUpperCase()
        membersMap[t.assignee.id] = {
          name:     `${t.assignee.firstName} ${t.assignee.lastName}`,
          initials: ini,
          color:    MEMBER_COLORS[colorIdx++ % MEMBER_COLORS.length],
        }
      }
    }

    const mapped = tasks.map(t => ({
      id:            t.id,
      titre:         t.title,
      description:   t.description ?? undefined,
      statut:        statusToFrontend(t.status),
      priorite:      priorityToFrontend(t.priority),
      tags:          t.tags,
      avancement:    Math.round(Number(t.progress)),
      date_echeance: t.endDate ? t.endDate.toISOString().split("T")[0] : undefined,
      responsable:   t.assignee?.id ?? null,
      projet_id:     projectId,
      created_at:    t.createdAt.toISOString(),
    }))

    return NextResponse.json({ tasks: mapped, members: membersMap })
  } catch (err) {
    console.error("[GET /api/tasks]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST /api/tasks
export async function POST(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  try {
    const body = await req.json()
    const { projectId, titre, statut, priorite, responsable, avancement, date_echeance, description, tags } = body

    if (!projectId || !titre?.trim()) {
      return NextResponse.json({ error: "projectId et titre requis" }, { status: 400 })
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, companyId: payload.companyId, deletedAt: null },
    })
    if (!project) return NextResponse.json({ error: "Projet introuvable" }, { status: 404 })

    const task = await prisma.task.create({
      data: {
        title:       titre.trim(),
        description: description || null,
        status:      statusToDb(statut ?? "A_FAIRE") as any,
        priority:    priorityToDb(priorite ?? "NORMALE") as any,
        tags:        tags ?? [],
        progress:    avancement ?? 0,
        endDate:     date_echeance ? new Date(date_echeance) : null,
        assigneeId:  responsable || null,
        creatorId:   payload.sub,
        projectId,
      },
      select: {
        id: true, title: true, description: true, status: true, priority: true,
        tags: true, progress: true, endDate: true, createdAt: true,
        assignee: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    return NextResponse.json({
      id:            task.id,
      titre:         task.title,
      description:   task.description ?? undefined,
      statut:        statusToFrontend(task.status),
      priorite:      priorityToFrontend(task.priority),
      tags:          task.tags,
      avancement:    Math.round(Number(task.progress)),
      date_echeance: task.endDate ? task.endDate.toISOString().split("T")[0] : undefined,
      responsable:   task.assignee?.id ?? null,
      projet_id:     projectId,
      created_at:    task.createdAt.toISOString(),
    }, { status: 201 })
  } catch (err) {
    console.error("[POST /api/tasks]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
