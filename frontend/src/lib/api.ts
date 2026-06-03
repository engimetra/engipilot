const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1"

export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
  })
}

export default apiFetch
