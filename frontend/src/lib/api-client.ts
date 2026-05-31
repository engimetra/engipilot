import { NextRequest } from "next/server"

// Server-side base URL — never exposed to the browser
const BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1").replace(/\/$/, "")

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

  const qs  = opts.searchParams?.toString()
  const url = qs ? `${BASE}${path}?${qs}` : `${BASE}${path}`

  return fetch(url, { method: opts.method ?? "GET", headers, body: opts.body })
}

// Backend returns { success, data, message, meta? }
// This helper extracts data and normalises errors
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

  const wrapped = json as { success?: boolean; data?: unknown }
  return {
    payload: wrapped.success !== undefined ? (wrapped.data ?? null) : json,
    status:  res.status,
  }
}
