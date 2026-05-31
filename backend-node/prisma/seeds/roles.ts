import { prisma } from "./_client"

const ROLES = [
  { name: "SUPER_ADMIN", description: "Accès total à la plateforme" },
  { name: "ADMIN",       description: "Gestion entreprise complète" },
  { name: "MANAGER",     description: "Gestion des projets assignés" },
  { name: "ENGINEER",    description: "Saisie et suivi chantier" },
  { name: "HSE",         description: "Gestion sécurité et incidents" },
  { name: "MEMBER",      description: "Accès standard lecture/écriture" },
  { name: "VIEWER",      description: "Accès lecture seule" },
]

const RESOURCES = [
  "projects", "sites", "tasks", "workers", "equipment",
  "materials", "budgets", "expenses", "documents",
  "incidents", "analytics", "notifications", "users",
  "reports", "ai", "settings",
]

const ACTIONS = ["view", "create", "update", "delete", "export", "approve"]

export async function seedRoles() {
  console.log("  → Seeding roles…")

  const roles = await Promise.all(
    ROLES.map(r =>
      prisma.role.upsert({
        where:  { name: r.name },
        update: { description: r.description },
        create: r,
      })
    )
  )

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

  const roleMap     = new Map(roles.map(r => [r.name, r.id]))
  const allPermIds  = perms.map(p => p.id)

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

  const managerId    = roleMap.get("MANAGER")!
  const managerPerms = perms.filter(
    p => !["users", "settings"].includes(p.resource) || p.action === "view"
  )
  await Promise.all(
    managerPerms.map(p =>
      prisma.rolePermission.upsert({
        where:  { roleId_permissionId: { roleId: managerId, permissionId: p.id } },
        update: {},
        create: { roleId: managerId, permissionId: p.id },
      })
    )
  )

  const engineerId        = roleMap.get("ENGINEER")!
  const engineerActions   = ["view", "create", "update"]
  const engineerResources = ["projects", "sites", "tasks", "workers", "equipment", "materials", "documents", "incidents", "notifications"]
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

  const hseId   = roleMap.get("HSE")!
  const hsePerms = perms.filter(p =>
    (p.resource === "incidents" && ["view", "create", "update", "delete"].includes(p.action)) ||
    (p.action === "view" && ["projects", "sites", "analytics", "reports"].includes(p.resource))
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

  const viewerId = roleMap.get("VIEWER")!
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
