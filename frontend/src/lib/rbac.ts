/**
 * ENGIPILOT — RBAC (Role-Based Access Control)
 * Architecture multi-tenant SaaS : SUPER_ADMIN plateforme vs utilisateurs opérationnels.
 */

import type { RolePlateforme } from "@/types"

// ── Permission atoms ───────────────────────────────────────────────────────────
export type Permission =
  // Navigation / modules
  | "view:dashboard"    | "view:chantiers"  | "view:kanban"    | "view:planning"
  | "view:analytics"    | "view:ia"         | "view:chat"      | "view:hse"
  | "view:qualite"      | "view:rapports"   | "view:documents" | "view:equipes"
  | "view:notifications"| "view:approvisionnement"
  // Administration
  | "view:admin"        | "view:parametres" | "view:facturation"| "view:onboarding"
  | "manage:platform"   | "manage:ai"       | "manage:infrastructure"
  | "view:logs"         | "view:monitoring"
  // Projets / chantiers
  | "create:projet"     | "edit:projet"     | "delete:projet"
  | "create:chantier"   | "edit:chantier"   | "delete:chantier"
  // Tâches
  | "create:tache"      | "edit:tache"      | "delete:tache"   | "assign:tache"
  // Rapports / documents
  | "create:rapport"    | "edit:rapport"    | "validate:rapport"
  | "upload:document"   | "delete:document"
  // Utilisateurs
  | "create:user"       | "edit:user"       | "delete:user"
  // Exports
  | "export:pdf"        | "export:excel"
  // IA
  | "use:ia"            | "configure:ia"

const ALL_PERMISSIONS: Permission[] = [
  "view:dashboard","view:chantiers","view:kanban","view:planning",
  "view:analytics","view:ia","view:chat","view:hse","view:qualite",
  "view:rapports","view:documents","view:equipes","view:notifications",
  "view:approvisionnement",
  "view:admin","view:parametres","view:facturation","view:onboarding",
  "manage:platform","manage:ai","manage:infrastructure",
  "view:logs","view:monitoring",
  "create:projet","edit:projet","delete:projet",
  "create:chantier","edit:chantier","delete:chantier",
  "create:tache","edit:tache","delete:tache","assign:tache",
  "create:rapport","edit:rapport","validate:rapport",
  "upload:document","delete:document",
  "create:user","edit:user","delete:user",
  "export:pdf","export:excel",
  "use:ia","configure:ia",
]

export const ROLE_PERMISSIONS: Record<RolePlateforme, Permission[]> = {

  SUPER_ADMIN: ALL_PERMISSIONS,

  ADMIN_ENTREPRISE: [
    "view:dashboard","view:chantiers","view:kanban","view:planning",
    "view:analytics","view:ia","view:chat","view:hse","view:qualite",
    "view:rapports","view:documents","view:equipes","view:notifications",
    "view:approvisionnement","view:facturation","view:onboarding","view:admin","view:parametres",
    "create:projet","edit:projet","delete:projet",
    "create:chantier","edit:chantier","delete:chantier",
    "create:tache","edit:tache","delete:tache","assign:tache",
    "create:rapport","edit:rapport","validate:rapport",
    "upload:document","delete:document",
    "create:user","edit:user",
    "export:pdf","export:excel",
    "use:ia",
  ],

  ADMIN: [
    "view:dashboard","view:chantiers","view:kanban","view:planning",
    "view:analytics","view:ia","view:chat","view:hse","view:qualite",
    "view:rapports","view:documents","view:equipes","view:notifications",
    "view:approvisionnement","view:facturation","view:onboarding","view:admin","view:parametres",
    "create:projet","edit:projet","delete:projet",
    "create:chantier","edit:chantier","delete:chantier",
    "create:tache","edit:tache","delete:tache","assign:tache",
    "create:rapport","edit:rapport","validate:rapport",
    "upload:document","delete:document",
    "create:user","edit:user",
    "export:pdf","export:excel",
    "use:ia",
  ],

  CHEF_PROJET: [
    "view:dashboard","view:chantiers","view:kanban","view:planning",
    "view:analytics","view:ia","view:chat","view:hse","view:qualite",
    "view:rapports","view:documents","view:equipes","view:notifications",
    "view:approvisionnement",
    "create:projet","edit:projet",
    "create:chantier","edit:chantier",
    "create:tache","edit:tache","delete:tache","assign:tache",
    "create:rapport","edit:rapport","validate:rapport",
    "upload:document",
    "export:pdf","export:excel",
    "use:ia",
  ],

  CHEF_CHANTIER: [
    "view:dashboard","view:chantiers","view:kanban","view:planning",
    "view:hse","view:qualite","view:rapports","view:documents",
    "view:notifications","view:approvisionnement",
    "edit:chantier",
    "create:tache","edit:tache","assign:tache",
    "create:rapport","edit:rapport",
    "upload:document",
    "export:pdf",
  ],

  CONSULTANT: [
    "view:dashboard","view:chantiers","view:planning",
    "view:analytics","view:rapports","view:documents",
    "view:notifications",
    "export:pdf","export:excel",
  ],

  LECTEUR: [
    "view:dashboard","view:chantiers","view:planning",
    "view:rapports","view:documents","view:notifications",
    "export:pdf",
  ],

  UTILISATEUR_STANDARD: [
    "view:dashboard","view:kanban","view:documents","view:notifications",
    "edit:tache",
    "export:pdf",
  ],
}

// ── Vérification permission ────────────────────────────────────────────────────
export function hasPermission(role: RolePlateforme | undefined | null, perm: Permission): boolean {
  if (!role) return false
  return ROLE_PERMISSIONS[role]?.includes(perm) ?? false
}

export function hasAnyPermission(role: RolePlateforme | undefined | null, perms: Permission[]): boolean {
  return perms.some(p => hasPermission(role, p))
}

export function hasAllPermissions(role: RolePlateforme | undefined | null, perms: Permission[]): boolean {
  return perms.every(p => hasPermission(role, p))
}

// ── Config affichage des rôles ────────────────────────────────────────────────
export const ROLE_CONFIG: Record<RolePlateforme, {
  label: string
  shortLabel: string
  description: string
  color: string
  bg: string
  ring: string
  tier: "platform" | "enterprise" | "project" | "readonly"
}> = {
  SUPER_ADMIN: {
    label:       "Super Admin",
    shortLabel:  "SUPER ADMIN",
    description: "Accès total plateforme & développement",
    color:       "text-white",
    bg:          "bg-gradient-to-r from-[#1e512d] to-[#ff751f]",
    ring:        "ring-green-400/50",
    tier:        "platform",
  },
  ADMIN_ENTREPRISE: {
    label:       "Admin Entreprise",
    shortLabel:  "ADMIN ENTREPRISE",
    description: "Accès total + gestion utilisateurs et organisation",
    color:       "text-danger",
    bg:          "bg-danger/10",
    ring:        "ring-danger/30",
    tier:        "enterprise",
  },
  ADMIN: {
    label:       "Admin",
    shortLabel:  "ADMIN",
    description: "Accès total + gestion des utilisateurs",
    color:       "text-danger",
    bg:          "bg-danger/10",
    ring:        "ring-danger/30",
    tier:        "enterprise",
  },
  CHEF_PROJET: {
    label:       "Chef de Projet",
    shortLabel:  "CHEF PROJET",
    description: "Gestion des projets assignés",
    color:       "text-primary",
    bg:          "bg-primary/10",
    ring:        "ring-primary/30",
    tier:        "project",
  },
  CHEF_CHANTIER: {
    label:       "Chef de Chantier",
    shortLabel:  "CHEF CHANTIER",
    description: "Terrain, rapports & HSE",
    color:       "text-warning",
    bg:          "bg-warning/10",
    ring:        "ring-warning/30",
    tier:        "project",
  },
  CONSULTANT: {
    label:       "Consultant",
    shortLabel:  "CONSULTANT",
    description: "Lecture seule & exports",
    color:       "text-purple-600",
    bg:          "bg-purple-100",
    ring:        "ring-purple-200",
    tier:        "readonly",
  },
  LECTEUR: {
    label:       "Lecteur",
    shortLabel:  "LECTEUR",
    description: "Lecture seule sur tous les modules",
    color:       "text-muted-fg",
    bg:          "bg-muted",
    ring:        "ring-border",
    tier:        "readonly",
  },
  UTILISATEUR_STANDARD: {
    label:       "Utilisateur",
    shortLabel:  "UTILISATEUR",
    description: "Accès limité aux projets assignés",
    color:       "text-muted-fg",
    bg:          "bg-muted",
    ring:        "ring-border",
    tier:        "readonly",
  },
}

// ── Hiérarchie routes → permission requise ─────────────────────────────────────
export const ROUTE_PERMISSION: Record<string, Permission> = {
  "/dashboard":         "view:dashboard",
  "/chantiers":         "view:chantiers",
  "/kanban":            "view:kanban",
  "/planning":          "view:planning",
  "/analytics":         "view:analytics",
  "/ia":                "view:ia",
  "/chat":              "view:chat",
  "/hse":               "view:hse",
  "/qualite":           "view:qualite",
  "/rapports":          "view:rapports",
  "/documents":         "view:documents",
  "/equipes":           "view:equipes",
  "/notifications":     "view:notifications",
  "/approvisionnement": "view:approvisionnement",
  "/admin":             "view:admin",
  "/parametres":        "view:parametres",
  "/facturation":       "view:facturation",
  "/onboarding":        "view:onboarding",
}

// ── Utilisateurs démo ─────────────────────────────────────────────────────────
export const DEMO_USERS: Record<RolePlateforme, {
  prenom: string; nom: string; email: string
  role: RolePlateforme; organisation_id: string
}> = {
  SUPER_ADMIN:          { prenom: "Ismail",  nom: "AMZIL",    email: "ismail.amzil@engipilot.ma",   role: "SUPER_ADMIN",          organisation_id: "org_engipilot" },
  ADMIN_ENTREPRISE:     { prenom: "Nadia",   nom: "Amrani",   email: "nadia.amrani@btpmaroc.ma",    role: "ADMIN_ENTREPRISE",     organisation_id: "org_btpmaroc" },
  ADMIN:                { prenom: "Karim",   nom: "Benali",   email: "karim.benali@btpmaroc.ma",    role: "ADMIN",                organisation_id: "org_btpmaroc" },
  CHEF_PROJET:          { prenom: "Youssef", nom: "El Fassi", email: "youssef.elfassi@btpmaroc.ma", role: "CHEF_PROJET",          organisation_id: "org_btpmaroc" },
  CHEF_CHANTIER:        { prenom: "Hassan",  nom: "Moussaoui",email: "hassan.m@btpmaroc.ma",        role: "CHEF_CHANTIER",        organisation_id: "org_btpmaroc" },
  CONSULTANT:           { prenom: "Sara",    nom: "Tazi",     email: "sara.tazi@consulting.ma",     role: "CONSULTANT",           organisation_id: "org_btpmaroc" },
  LECTEUR:              { prenom: "Ahmed",   nom: "Idrissi",  email: "ahmed.idrissi@btpmaroc.ma",   role: "LECTEUR",              organisation_id: "org_btpmaroc" },
  UTILISATEUR_STANDARD: { prenom: "Fatima", nom: "Zahra",    email: "fatima.zahra@btpmaroc.ma",    role: "UTILISATEUR_STANDARD", organisation_id: "org_btpmaroc" },
}
