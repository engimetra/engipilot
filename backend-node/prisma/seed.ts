import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database…")

  // ── Rôles ────────────────────────────────────────────────
  const roles = await Promise.all([
    prisma.role.upsert({ where: { name: "SUPER_ADMIN" }, update: {}, create: { name: "SUPER_ADMIN", description: "Accès total" } }),
    prisma.role.upsert({ where: { name: "ADMIN" },       update: {}, create: { name: "ADMIN",       description: "Administrateur entreprise" } }),
    prisma.role.upsert({ where: { name: "MANAGER" },     update: {}, create: { name: "MANAGER",     description: "Chef de projet" } }),
    prisma.role.upsert({ where: { name: "ENGINEER" },    update: {}, create: { name: "ENGINEER",    description: "Ingénieur chantier" } }),
    prisma.role.upsert({ where: { name: "MEMBER" },      update: {}, create: { name: "MEMBER",      description: "Membre standard" } }),
    prisma.role.upsert({ where: { name: "VIEWER" },      update: {}, create: { name: "VIEWER",      description: "Lecture seule" } }),
  ])
  console.log("✅ Roles created:", roles.map(r => r.name))

  // ── Permissions ──────────────────────────────────────────
  const resources = ["projects", "tasks", "sites", "workers", "equipment", "materials", "budgets", "expenses", "documents", "incidents", "analytics", "notifications", "users"]
  const actions   = ["view", "create", "update", "delete"]

  const perms = await Promise.all(
    resources.flatMap(resource =>
      actions.map(action =>
        prisma.permission.upsert({
          where:  { action_resource: { action, resource } },
          update: {},
          create: { action, resource },
        })
      )
    )
  )
  console.log(`✅ ${perms.length} permissions created`)

  // ── Entreprise démo ──────────────────────────────────────
  const company = await prisma.company.upsert({
    where:  { siret: "12345678901234" },
    update: {},
    create: { name: "ENGIPILOT Demo SA", siret: "12345678901234", city: "Casablanca", country: "MA", plan: "PRO" },
  })

  // ── Utilisateur admin démo ───────────────────────────────
  const adminRole     = roles.find(r => r.name === "ADMIN")!
  const passwordHash  = await bcrypt.hash("engipilot2024", 12)

  const adminUser = await prisma.user.upsert({
    where:  { email: "admin@engipilot.ma" },
    update: {},
    create: {
      email: "admin@engipilot.ma",
      passwordHash,
      firstName: "Admin",
      lastName:  "ENGIPILOT",
      companyId: company.id,
      roleId:    adminRole.id,
    },
  })
  console.log("✅ Admin user:", adminUser.email)

  // ── Projet démo ──────────────────────────────────────────
  const project = await prisma.project.upsert({
    where:  { reference: "DEMO-001" },
    update: {},
    create: {
      name:          "Usine Bouskoura",
      reference:     "DEMO-001",
      description:   "Construction usine agroalimentaire — Phase 2",
      type:          "INDUSTRIAL",
      status:        "ACTIVE",
      startDate:     new Date("2024-01-15"),
      endDate:       new Date("2025-12-31"),
      budgetInitial: 210_000_000,
      spi:           0.72,
      cpi:           0.84,
      progress:      47,
      city:          "Bouskoura",
      country:       "MA",
      clientName:    "Groupe Omnium Industries",
      companyId:     company.id,
    },
  })

  await prisma.projectMember.upsert({
    where:  { projectId_userId: { projectId: project.id, userId: adminUser.id } },
    update: {},
    create: { projectId: project.id, userId: adminUser.id, role: "MANAGER" },
  })
  console.log("✅ Demo project:", project.name)

  console.log("\n🎉 Seed completed!")
  console.log("   Admin: admin@engipilot.ma / engipilot2024")
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
