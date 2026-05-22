import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { verifyJwt } from "@/lib/jwt"
import { uploadToMinio } from "@/lib/minio-client"

export const dynamic = "force-dynamic"

function auth(req: NextRequest) {
  const token = req.cookies.get("engipilot_session")?.value
  if (!token) return null
  return verifyJwt(token)
}

const EXT_TO_TYPE: Record<string, string> = {
  pdf: "REPORT", dwg: "PLAN", dxf: "PLAN",
  png: "PHOTO",  jpg: "PHOTO", jpeg: "PHOTO",
  xlsx: "OTHER", xls: "OTHER", zip: "OTHER",
  mpp: "OTHER",  xml: "OTHER",
}

const ALLOWED_EXT = new Set(["pdf","dwg","dxf","png","jpg","jpeg","xlsx","xls","zip"])
const MAX_BYTES    = 50 * 1024 * 1024

// ── GET /api/documents?projectId= ────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const projectId = req.nextUrl.searchParams.get("projectId") ?? undefined

  try {
    const docs = await prisma.document.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        ...(projectId
          ? { projectId }
          : { project: { companyId: payload.companyId } }),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, type: true, mimeType: true,
        size: true, url: true, version: true, createdAt: true,
        uploadedBy: { select: { firstName: true, lastName: true } },
      },
    })

    return NextResponse.json(docs)
  } catch (err) {
    console.error("[GET /api/documents]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// ── POST /api/documents — upload fichier vers MinIO + Prisma ─────────────────
export async function POST(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  try {
    const formData  = await req.formData()
    const file      = formData.get("file") as File | null
    const projectId = formData.get("projectId") as string | null

    if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 })

    const ext      = (file.name.split(".").pop() ?? "").toLowerCase()
    const mimeType = file.type || "application/octet-stream"

    if (!ALLOWED_EXT.has(ext)) {
      return NextResponse.json({ error: `Extension non supportée: .${ext}` }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Fichier trop lourd (max 50 Mo)" }, { status: 413 })
    }

    // Vérifier que le projet appartient à la company
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: { id: projectId, companyId: payload.companyId, isActive: true },
      })
      if (!project) return NextResponse.json({ error: "Projet introuvable" }, { status: 404 })
    }

    // Upload MinIO
    const buffer     = Buffer.from(await file.arrayBuffer())
    const objectName = `docs/${payload.companyId}/${projectId ?? "general"}/${Date.now()}_${file.name}`
    const url        = await uploadToMinio(buffer, objectName, mimeType)

    // Sauvegarder en base
    const docType = (EXT_TO_TYPE[ext] ?? "OTHER") as
      "PLAN" | "CONTRACT" | "REPORT" | "PHOTO" | "VIDEO" |
      "NC_REPORT" | "PV_MEETING" | "HSE_DOCUMENT" | "PERMIT" | "INVOICE" | "OTHER"

    const doc = await prisma.document.create({
      data: {
        name:         file.name,
        type:         docType,
        mimeType,
        size:         file.size,
        url,
        uploadedById: payload.sub,
        ...(projectId ? { projectId } : {}),
      },
      select: {
        id: true, name: true, type: true, mimeType: true,
        size: true, url: true, version: true, createdAt: true,
        uploadedBy: { select: { firstName: true, lastName: true } },
      },
    })

    return NextResponse.json(doc, { status: 201 })
  } catch (err) {
    console.error("[POST /api/documents]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// ── DELETE /api/documents?id= ─────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const payload = auth(req)
  if (!payload) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const id = req.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 })

  try {
    await prisma.document.updateMany({
      where: { id, uploadedById: payload.sub },
      data:  { isActive: false, deletedAt: new Date() },
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[DELETE /api/documents]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
