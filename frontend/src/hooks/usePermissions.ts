"use client"
import { useStore } from "@/store/useStore"
import { hasPermission, hasAnyPermission, hasAllPermissions, ROLE_CONFIG } from "@/lib/rbac"
import type { Permission } from "@/lib/rbac"

export function usePermissions() {
  const user = useStore(s => s.user)
  const role = user?.role

  return {
    /** Vérifie une permission unique */
    can:     (perm: Permission) => hasPermission(role, perm),
    /** Vérifie si au moins une permission est accordée */
    canAny:  (perms: Permission[]) => hasAnyPermission(role, perms),
    /** Vérifie si toutes les permissions sont accordées */
    canAll:  (perms: Permission[]) => hasAllPermissions(role, perms),

    /** Helpers rôle rapides */
    isSuperAdmin:    role === "SUPER_ADMIN",
    isAdmin:         role === "SUPER_ADMIN" || role === "ADMIN_ENTREPRISE",
    isProjectLevel:  role === "CHEF_PROJET"  || role === "CHEF_CHANTIER",
    isReadOnly:      role === "CONSULTANT"   || role === "UTILISATEUR_STANDARD",

    /** Données affichage */
    role,
    roleConfig: role ? ROLE_CONFIG[role] : null,
    user,
  }
}
