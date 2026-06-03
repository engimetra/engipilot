import { apiFetch } from "@/lib/api"

const TOKEN_KEY = "token"
const USER_KEY  = "user"
const COOKIE    = "engipilot_session"
const MAX_AGE   = 8 * 60 * 60 // 8h

export interface AuthUser {
  id:          string
  email:       string
  firstName:   string
  lastName:    string
  role:        string
  companyId:   string
}

// ── Session helpers ───────────────────────────────────────────────────────────

function setSession(token: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  // Cookie non-httpOnly pour satisfaire le middleware Next.js
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; secure" : ""
  document.cookie = `${COOKIE}=${token}; path=/; max-age=${MAX_AGE}; samesite=lax${secure}`
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  document.cookie = `${COOKIE}=; path=/; max-age=0; samesite=lax`
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

export function isAuthenticated(): boolean {
  return !!getToken()
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<AuthUser> {
  const res  = await apiFetch("/auth/login", {
    method: "POST",
    body:   JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? data.error ?? "Identifiants incorrects")

  const user = normalizeUser(data.user)
  setSession(data.accessToken, user)
  return user
}

export async function register(input: {
  firstName:   string
  lastName:    string
  email:       string
  password:    string
  companyName: string
}): Promise<AuthUser> {
  const res  = await apiFetch("/auth/register", {
    method: "POST",
    body:   JSON.stringify(input),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? data.error ?? "Erreur lors de la création du compte")

  const user = normalizeUser(data.user)
  setSession(data.accessToken, user)
  return user
}

export function logout(): void {
  clearSession()
  window.location.href = "/login"
}

// ── Normalizer ────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeUser(raw: any): AuthUser {
  return {
    id:        String(raw?.id ?? ""),
    email:     String(raw?.email ?? ""),
    firstName: String(raw?.firstName ?? raw?.first_name ?? ""),
    lastName:  String(raw?.lastName  ?? raw?.last_name  ?? ""),
    role:      String(raw?.role?.name ?? raw?.role ?? "MEMBER"),
    companyId: String(raw?.companyId ?? raw?.company?.id ?? ""),
  }
}
