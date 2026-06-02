"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"
import { useRouter } from "next/navigation"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string
  email: string
  fullName: string
  role: string
  organisationId: string
}

export interface RegisterInput {
  firstName: string
  lastName: string
  email: string
  password: string
}

export interface LoginInput {
  email: string
  password: string
}

interface AuthContextValue {
  currentUser: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  register: (input: RegisterInput) => Promise<void>
  login: (input: LoginInput) => Promise<void>
  logout: () => Promise<void>
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

// ─── Normalizer ───────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toAuthUser(raw: any): AuthUser {
  return {
    id: String(raw?.id ?? ""),
    email: String(raw?.email ?? ""),
    fullName: String(
      raw?.fullName ??
      raw?.full_name ??
      `${raw?.prenom ?? raw?.firstName ?? ""} ${raw?.nom ?? raw?.lastName ?? ""}`.trim()
    ),
    role: String(raw?.role ?? "UTILISATEUR_STANDARD"),
    organisationId: String(
      raw?.organisationId ??
      raw?.organisation_id ??
      raw?.organisation?.id ??
      "00000000-0000-0000-0000-000000000001"
    ),
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Restore session on mount via httpOnly cookie check
  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data?.user) setCurrentUser(toAuthUser(data.user))
      })
      .catch(() => null)
      .finally(() => setIsLoading(false))
  }, [])

  const register = useCallback(
    async ({ firstName, lastName, email, password }: RegisterInput) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erreur lors de la création du compte")
      if (data.user) setCurrentUser(toAuthUser(data.user))
      router.push("/dashboard")
    },
    [router]
  )

  const login = useCallback(
    async ({ email, password }: LoginInput) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Identifiants incorrects")
      if (data.user) setCurrentUser(toAuthUser(data.user))
      router.push("/dashboard")
    },
    [router]
  )

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    setCurrentUser(null)
    router.push("/login")
  }, [router])

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        isAuthenticated: !!currentUser,
        register,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth() doit être utilisé dans <AuthProvider>")
  return ctx
}
