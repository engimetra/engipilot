"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { ShieldOff } from "lucide-react"
import { usePermissions } from "@/hooks/usePermissions"
import type { Permission } from "@/lib/rbac"

interface RoleGuardProps {
  permission: Permission
  children: React.ReactNode
  /** Redirect instead of showing the blocked screen (default: false) */
  redirect?: boolean
  redirectTo?: string
}

export function RoleGuard({ permission, children, redirect = false, redirectTo = "/dashboard" }: RoleGuardProps) {
  const { can, user } = usePermissions()
  const router = useRouter()
  const allowed = can(permission)

  useEffect(() => {
    if (!user) {
      router.replace("/login")
    } else if (!allowed && redirect) {
      router.replace(redirectTo)
    }
  }, [user, allowed, redirect, redirectTo, router])

  if (!user) return null

  if (!allowed) {
    if (redirect) return null
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6">
        <div className="w-14 h-14 rounded-2xl bg-danger/10 flex items-center justify-center">
          <ShieldOff className="w-7 h-7 text-danger" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Accès restreint</h2>
          <p className="text-sm text-muted-fg mt-1 max-w-sm">
            Vous n'avez pas les permissions nécessaires pour accéder à cette section.
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard")}
          className="btn-primary mt-2"
        >
          Retour au Dashboard
        </button>
      </div>
    )
  }

  return <>{children}</>
}
