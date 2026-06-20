import { NextRequest } from "next/server"

function getBase(): string {
  return (process.env.BACKEND_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://engipilot-backend:8080/api/v1").replace(/\/$/, "")
}

export function getToken(req: NextRequest): string | null {
  return req.cookies.get("engipilot_session")?.value ?? null
}

type FetchOpts = {
  method?: string
  body?: string | FormData
  extraHeaders?: Record<string, string>
  searchParams?: URLSearchParams
}

export async function backendFetch(
  path: string,
  token: string | null,
  opts: FetchOpts = {},
): Promise<Response> {
  const headers: Record<string, string> = { ...opts.extraHeaders }
  if (token) headers["Authorization"] = `Bearer ${token}`
  if (opts.body && typeof opts.body === "string") headers["Content-Type"] = "application/json"

  const base = getBase()
  const qs  = opts.searchParams?.toString()
  const url = qs ? `${base}${path}?${qs}` : `${base}${path}`

  return fetch(url, { method: opts.method ?? "GET", headers, body: opts.body })
}

export async function proxyResponse(
  res: Response,
): Promise<{ payload: unknown; status: number }> {
  let json: unknown
  try {
    json = await res.json()
  } catch {
    return { payload: { error: "Réponse backend invalide" }, status: res.status }
  }

  if (!res.ok) {
    const err = json as { message?: string; error?: string }
    return {
      payload: { error: err.message ?? err.error ?? "Erreur backend" },
      status:  res.status,
    }
  }

  const wrapped = json as { success?: boolean; data?: unknown; content?: unknown; totalElements?: unknown }
  let payload: unknown
  if (wrapped.success !== undefined) {
    payload = wrapped.data ?? null
  } else if (Array.isArray((wrapped as { content?: unknown }).content)) {
    // Spring paginated response: { content: [], totalElements: N, ... }
    payload = wrapped.content
  } else {
    payload = json
  }
  return { payload, status: res.status }
}
