import { NextRequest, NextResponse } from "next/server"
import { backendFetch, getToken, proxyResponse } from "@/lib/api-client"

export const dynamic = "force-dynamic"

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const token = getToken(req)
  if (!token) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  try {
    const res = await backendFetch(`/admin/users/${params.id}`, token, { method: "DELETE" })
    const { payload, status } = await proxyResponse(res)
    return NextResponse.json(payload, { status })
  } catch (err) {
    console.error("[proxy DELETE /admin/users/:id]", err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
