import { NextRequest, NextResponse } from "next/server"
import { backendFetch, getToken, proxyResponse } from "@/lib/api-client"

export const dynamic = "force-dynamic"

type Ctx = { params: Promise<{ id: string }> }

// POST /api/projects/[id]/import/ms-project
// Proxied to backend which handles MPXJ parsing via Spring Boot + task creation
export async function POST(req: NextRequest, { params }: Ctx) {
  const token = getToken(req)
  if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  const { id } = await params

  try {
    const formData = await req.formData()
    const file     = formData.get("file") as File | null
    if (!file) return NextResponse.json({ error: "Fichier .mpp manquant" }, { status: 400 })

    const ext = (file.name.split(".").pop() ?? "").toLowerCase()
    if (!["mpp", "mpt", "xml"].includes(ext))
      return NextResponse.json({ error: "Format non supporté (.mpp, .mpt ou .xml requis)" }, { status: 400 })

    // Forward the multipart form directly to backend
    const proxyForm = new FormData()
    proxyForm.append("file", file, file.name)

    const res              = await backendFetch(`/projects/${id}/import/ms-project`, token, {
      method: "POST",
      body:   proxyForm,
    })
    const { payload, status } = await proxyResponse(res)
    return NextResponse.json(payload, { status })
  } catch (err) {
    console.error("[proxy POST /projects/:id/import/ms-project]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
