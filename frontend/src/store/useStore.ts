import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Projet, Utilisateur } from "@/types"
import { hasPermission, hasAnyPermission } from "@/lib/rbac"
import type { Permission } from "@/lib/rbac"
import { clearAuthToken } from "@/lib/api"

interface AppState {
  user:          Utilisateur | null
  projetActif:   Projet | null
  sidebarOpen:   boolean

  // Actions
  setUser:        (user: Utilisateur | null) => void
  setProjetActif: (projet: Projet | null) => void
  setSidebarOpen: (open: boolean) => void
  logout:         () => void

  // Permission helpers (shortcuts so components don't import rbac directly)
  can:    (perm: Permission) => boolean
  canAny: (perms: Permission[]) => boolean
  isSuperAdmin: () => boolean
  isAdmin:      () => boolean
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user:        null,
      projetActif: null,
      sidebarOpen: true,

      setUser:        (user)        => set({ user }),
      setProjetActif: (projetActif) => set({ projetActif }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

      logout: () => {
        clearAuthToken()
        if (typeof window !== "undefined") {
          document.cookie = "engipilot_session=; path=/; max-age=0; SameSite=Lax"
        }
        set({ user: null, projetActif: null })
      },

      can:    (perm)  => hasPermission(get().user?.role, perm),
      canAny: (perms) => hasAnyPermission(get().user?.role, perms),
      isSuperAdmin: () => get().user?.role === "SUPER_ADMIN",
      isAdmin:      () => ["SUPER_ADMIN", "ADMIN_ENTREPRISE"].includes(get().user?.role ?? ""),
    }),
    {
      name:       "engipilot-store",
      partialize: (state) => ({ user: state.user, sidebarOpen: state.sidebarOpen }),
    }
  )
)
