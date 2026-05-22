import { apiFetch, setToken, clearToken, getToken } from "./api"

export interface AuthUser {
  id:        string
  email:     string
  firstName: string
  lastName:  string
  role:      string
  avatar?:   string
  company:   string
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const data = await apiFetch<{ user: AuthUser; token?: string }>("/api/auth/login", {
    method: "POST",
    body:   JSON.stringify({ email, password }),
  })
  // Next.js sets an httpOnly cookie; for mobile we also accept a token in body
  if (data.token) await setToken(data.token)
  return data.user
}

export async function logout(): Promise<void> {
  await apiFetch("/api/auth/logout", { method: "POST" }).catch(() => {})
  await clearToken()
}

export async function getMe(): Promise<AuthUser | null> {
  const token = await getToken()
  if (!token) return null
  try {
    const data = await apiFetch<{ user: AuthUser }>("/api/auth/me", { token })
    return data.user
  } catch {
    return null
  }
}
