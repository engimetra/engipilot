import { PrismaClient } from "@prisma/client"

const ROLES = [
  { name: "SUPER_ADMIN", displayName: "Super Administrateur", description: "Accès total à la plateforme", isSystem: true },
  { name: "ADMIN",       displayName: "Administrateur",       description: "Gestion entreprise complète", isSystem: true },
  { name: "MANAGER",     displayName: "Chef de Projet",       description: "Gestion des projets assignés", isSystem: true },
  { name: "ENGINEER",    displayName: "Ingénieur",            description: "Saisie et suivi chantier", isSystem: true },
  { name: "HSE",         displayName: "Responsable HSE",      description: "Gestion sécurité et incidents", isSystem: true },
  { name: "MEMBER",      displayName: "Membre",               description: "Accès standard lecture/écriture", isSystem: true },
  { name: "VIEWER",      displayName: "Lecteur",              description: "Accès lecture seule", isSystem: true },
]

const RESOURCES = [
  "projects", "sites", "tasks", "workers", "equipment",
  "materials", "budgets", "expenses", "documents",
  "incidents", "analytics", "notifications", "users",
  "reports", "ai", "settings",
]

const ACTIONS = ["view", "create", "update", "delete", "export", "approve"]

export async function seedRoles(prisma: PrismaClient) {
  console.log("  → Seeding roles…")

  // Rôles
  const roles = await Promise.all(
    ROLES.map(r =>
      prisma.role.upsert({
        where:  { name: r.name },
        update: { displayName: r.displayName },
        create: r,
      })
    )
  )

  // Permissions (toutes les combinaisons action × resource)
  console.log("  → Seeding permissions…")
  const perms = await Promise.all(
    RESOURCES.flatMap(resource =>
      ACTIONS.map(action =>
        prisma.permission.upsert({
          where:  { action_resource: { action, resource } },
          update: {},
          create: { action, resource, description: `${action}:${resource}` },
        })
      )
    )
  )

  // Attribution des permissions par rôle
  const permMap = new Map(perms.map(p => [`${p.action}:${p.resource}`, p.id]))
  const roleMap = new Map(roles.map(r => [r.name, r.id]))

  // SUPER_ADMIN & ADMIN → tout
  const allPermIds = perms.map(p => p.id)
  for (const roleName of ["SUPER_ADMIN", "ADMIN"]) {
    const roleId = roleMap.get(roleName)!
    await Promise.all(
      allPermIds.map(permissionId =>
        prisma.rolePermission.upsert({
          where:  { roleId_permissionId: { roleId, permissionId } },
          update: {},
          create: { roleId, permissionId },
        })
      )
    )
  }

  // MANAGER → tout sauf users/settings
  const managerPerms = perms.filter(p => !["users", "settings"].includes(p.resource) || p.action === "view")
  const managerId = roleMap.get("MANAGER")!
  await Promise.all(
    managerPerms.map(p =>
      prisma.rolePermission.upsert({
        where:  { roleId_permissionId: { roleId: managerId, permissionId: p.id } },
        update: {},
        create: { roleId: managerId, permissionId: p.id },
      })
    )
  )

  // ENGINEER → view + create + update sur chantier/tâches/workers
  const engineerActions   = ["view", "create", "update"]
  const engineerResources = ["projects", "sites", "tasks", "workers", "equipment", "materials", "documents", "incidents", "notifications"]
  const engineerId = roleMap.get("ENGINEER")!
  await Promise.all(
    perms
      .filter(p => engineerActions.includes(p.action) && engineerResources.includes(p.resource))
      .map(p =>
        prisma.rolePermission.upsert({
          where:  { roleId_permissionId: { roleId: engineerId, permissionId: p.id } },
          update: {},
          create: { roleId: engineerId, permissionId: p.id },
        })
      )
  )

  // HSE → spécialisé incidents
  const hseId = roleMap.get("HSE")!
  const hsePerms = perms.filter(p =>
    (p.resource === "incidents" && ["view","create","update","delete"].includes(p.action)) ||
    (["view"].includes(p.action) && ["projects","sites","analytics","reports"].includes(p.resource))
  )
  await Promise.all(
    hsePerms.map(p =>
      prisma.rolePermission.upsert({
        where:  { roleId_permissionId: { roleId: hseId, permissionId: p.id } },
        update: {},
        create: { roleId: hseId, permissionId: p.id },
      })
    )
  )

  // MEMBER → view + create + update limités
  const memberId = roleMap.get("MEMBER")!
  await Promise.all(
    perms
      .filter(p => ["view", "create"].includes(p.action) && !["users", "settings", "budgets"].includes(p.resource))
      .map(p =>
        prisma.rolePermission.upsert({
          where:  { roleId_permissionId: { roleId: memberId, permissionId: p.id } },
          update: {},
          create: { roleId: memberId, permissionId: p.id },
        })
      )
  )

  // VIEWER → view uniquement
  const viewerId = roleMap.get("VIEWER")!
  const viewPermId = permMap.get("view:projects") ?? ""
  await Promise.all(
    perms
      .filter(p => p.action === "view")
      .map(p =>
        prisma.rolePermission.upsert({
          where:  { roleId_permissionId: { roleId: viewerId, permissionId: p.id } },
          update: {},
          create: { roleId: viewerId, permissionId: p.id },
        })
      )
  )

  console.log(`  ✅ ${roles.length} rôles · ${perms.length} permissions`)
  return { roles, roleMap }
}
