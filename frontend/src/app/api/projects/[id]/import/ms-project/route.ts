import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { verifyJwt } from "@/lib/jwt"

export const dynamic = "force-dynamic"

const SPRING_URL = process.env.SPRING_BOOT_URL ?? "http://localhost:8080"

function auth(req: NextRequest) {
  const token = req.cookies.get("engipilot_session")?.value
  if (!token) return null
  return verifyJwt(token)
}

// POST /api/projects/[id]/import/ms-project
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const token = req.cookies.get("engipilot_session")?.value
  const { id } = await params

  try {
    // Vérifier que le projet appartient à la company
    const project = await prisma.project.findFirst({
      where: { id: id, companyId: payload.companyId, isActive: true },
    })
    if (!project) return NextResponse.json({ error: "Projet introuvable" }, { status: 404 })

    // Récupérer le fichier .mpp depuis le body
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file) return NextResponse.json({ error: "Fichier .mpp manquant" }, { status: 400 })

    const ext = (file.name.split(".").pop() ?? "").toLowerCase()
    if (!["mpp", "mpt", "xml"].includes(ext)) {
      return NextResponse.json({ error: "Format non supporté (.mpp, .mpt ou .xml requis)" }, { status: 400 })
    }

    // Proxy vers Spring Boot — MPXJ parse uniquement
    const proxyForm = new FormData()
    proxyForm.append("file", file, file.name)

    const springRes = await fetch(`${SPRING_URL}/api/v1/ms-project/parse`, {
      method:  "POST",
      headers: { Authorization: `Bearer ${token}` },
      body:    proxyForm,
    })

    if (!springRes.ok) {
      const err = await springRes.json().catch(() => ({ error: "Erreur Spring Boot" }))
      return NextResponse.json(err, { status: springRes.status })
    }

    const parsed = await springRes.json() as {
      projectName: string
      tasks: {
        title: string
        progress: number
        startDate?: string
        endDate?: string
        durationDays?: number
        notes?: string
      }[]
      count: number
    }

    // Créer les tâches dans Prisma
    let importees  = 0
    const erreurs: string[] = []

    for (const t of parsed.tasks) {
      try {
        await prisma.task.create({
          data: {
            title:       t.title,
            description: t.notes ?? null,
            progress:    t.progress,
            status:      "TODO",
            priority:    "MEDIUM",
            startDate:   t.startDate ? new Date(t.startDate) : null,
            endDate:     t.endDate   ? new Date(t.endDate)   : null,
            projectId:   id,
            creatorId:   payload.sub,
          },
        })
        importees++
      } catch (e) {
        erreurs.push(`"${t.title}": ${(e as Error).message}`)
      }
    }

    return NextResponse.json({
      message:    `${importees} tâche(s) importée(s) depuis MS Project`,
      importees,
      erreurs,
      projectName: parsed.projectName,
    })
  } catch (err) {
    console.error("[POST /api/projects/[id]/import/ms-project]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
