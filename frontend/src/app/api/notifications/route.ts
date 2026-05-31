import { NextRequest, NextResponse } from "next/server"
import { backendFetch, getToken, proxyResponse } from "@/lib/api-client"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const token = getToken(req)
  if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  try {
    const res              = await backendFetch("/notifications", token)
    const { payload, status } = await proxyResponse(res)
    return NextResponse.json(payload, { status })
  } catch (err) {
    console.error("[proxy GET /notifications]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const token = getToken(req)
  if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  try {
    const body             = await req.json()
    const res              = await backendFetch("/notifications", token, {
      method: "POST",
      body:   JSON.stringify(body),
    })
    const { payload, status } = await proxyResponse(res)
    return NextResponse.json(payload, { status })
  } catch (err) {
    console.error("[proxy POST /notifications]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const token = getToken(req)
  if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  try {
    const { id, all } = await req.json() as { id?: string; all?: boolean }

    if (all) {
      const res              = await backendFetch("/notifications/read-all", token, { method: "PATCH" })
      const { payload, status } = await proxyResponse(res)
      return NextResponse.json(payload, { status })
    }

    if (id) {
      const res              = await backendFetch(`/notifications/${id}/read`, token, { method: "PATCH" })
      const { payload, status } = await proxyResponse(res)
      return NextResponse.json(payload, { status })
    }

    return NextResponse.json({ error: "id ou all requis" }, { status: 400 })
  } catch (err) {
    console.error("[proxy PATCH /notifications]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const token = getToken(req)
  if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  try {
    const id  = req.nextUrl.searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 })

    const res              = await backendFetch(`/notifications/${id}`, token, { method: "DELETE" })
    const { payload, status } = await proxyResponse(res)
    return NextResponse.json(payload, { status })
  } catch (err) {
    console.error("[proxy DELETE /notifications]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
