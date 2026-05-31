import { NextRequest, NextResponse } from "next/server"
import { backendFetch, getToken, proxyResponse } from "@/lib/api-client"
import { uploadToMinio } from "@/lib/minio-client"

export const dynamic = "force-dynamic"

const EXT_TO_TYPE: Record<string, string> = {
  pdf: "REPORT", dwg: "PLAN", dxf: "PLAN",
  png: "PHOTO", jpg: "PHOTO", jpeg: "PHOTO",
  xlsx: "OTHER", xls: "OTHER", zip: "OTHER",
  mpp: "OTHER", xml: "OTHER",
}

const ALLOWED_EXT = new Set(["pdf","dwg","dxf","png","jpg","jpeg","xlsx","xls","zip"])
const MAX_BYTES   = 50 * 1024 * 1024

export async function GET(req: NextRequest) {
  const token = getToken(req)
  if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const projectId = req.nextUrl.searchParams.get("projectId") ?? undefined

  try {
    const qs = new URLSearchParams()
    if (projectId) qs.set("projectId", projectId)

    const res              = await backendFetch("/documents", token, { searchParams: qs })
    const { payload, status } = await proxyResponse(res)
    return NextResponse.json(payload, { status })
  } catch (err) {
    console.error("[proxy GET /documents]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// Upload: MinIO stays in frontend — metadata is persisted via backend
export async function POST(req: NextRequest) {
  const token = getToken(req)
  if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  try {
    const formData  = await req.formData()
    const file      = formData.get("file") as File | null
    const projectId = formData.get("projectId") as string | null

    if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 })

    const ext      = (file.name.split(".").pop() ?? "").toLowerCase()
    const mimeType = file.type || "application/octet-stream"

    if (!ALLOWED_EXT.has(ext))
      return NextResponse.json({ error: `Extension non supportée: .${ext}` }, { status: 400 })
    if (file.size > MAX_BYTES)
      return NextResponse.json({ error: "Fichier trop lourd (max 50 Mo)" }, { status: 413 })

    // Decode JWT to get companyId for MinIO path (no DB call needed)
    let companyId = "unknown"
    try {
      const [, payloadB64] = token.split(".")
      const decoded = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"))
      companyId = decoded.companyId ?? "unknown"
    } catch { /* use default */ }

    // Upload to MinIO
    const buffer     = Buffer.from(await file.arrayBuffer())
    const objectName = `docs/${companyId}/${projectId ?? "general"}/${Date.now()}_${file.name}`
    const url        = await uploadToMinio(buffer, objectName, mimeType)

    // Persist metadata in backend
    const docType = EXT_TO_TYPE[ext] ?? "OTHER"
    const res = await backendFetch("/documents", token, {
      method: "POST",
      body:   JSON.stringify({ name: file.name, type: docType, mimeType, size: file.size, url, projectId }),
    })
    const { payload, status } = await proxyResponse(res)
    return NextResponse.json(payload, { status: status === 200 ? 201 : status })
  } catch (err) {
    console.error("[proxy POST /documents]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const token = getToken(req)
  if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const id = req.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 })

  try {
    const res              = await backendFetch(`/documents/${id}`, token, { method: "DELETE" })
    const { payload, status } = await proxyResponse(res)
    return NextResponse.json(payload, { status })
  } catch (err) {
    console.error("[proxy DELETE /documents]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
