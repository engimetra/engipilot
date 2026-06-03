"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"
import {
  login as authLogin,
  register as authRegister,
  logout as authLogout,
  getUser,
  isAuthenticated,
  type AuthUser,
} from "@/services/auth"

// ─── Types ────────────────────────────────────────────────────────────────────

interface LoginInput    { email: string; password: string }
interface RegisterInput { firstName: string; lastName: string; email: string; password: string; companyName: string }

interface AuthContextValue {
  currentUser:     AuthUser | null
  isLoading:       boolean
  isAuthenticated: boolean
  login:           (input: LoginInput)    => Promise<void>
  register:        (input: RegisterInput) => Promise<void>
  logout:          () => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [isLoading,   setIsLoading]   = useState(true)

  // Restaurer la session depuis localStorage au montage
  useEffect(() => {
    if (isAuthenticated()) {
      setCurrentUser(getUser())
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async ({ email, password }: LoginInput) => {
    const user = await authLogin(email, password)
    setCurrentUser(user)
  }, [])

  const register = useCallback(async (input: RegisterInput) => {
    const user = await authRegister(input)
    setCurrentUser(user)
  }, [])

  const logout = useCallback(() => {
    authLogout()
    setCurrentUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{
      currentUser,
      isLoading,
      isAuthenticated: !!currentUser,
      login,
      register,
      logout,
    }}>
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
