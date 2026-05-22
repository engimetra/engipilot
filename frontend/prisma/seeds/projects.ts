import { PrismaClient } from "@prisma/client"

const DEMO_PROJECTS = [
  {
    name:          "Usine Agroalimentaire Bouskoura",
    reference:     "PROJ-2024-001",
    description:   "Construction d'une usine agroalimentaire de 12 000 m² — Phase 2 Génie Civil & Électricité",
    type:          "INDUSTRIAL" as const,
    status:        "ACTIVE" as const,
    startDate:     new Date("2024-01-15"),
    endDate:       new Date("2025-12-31"),
    budgetInitial: 210_000_000,
    spi:           0.72,
    cpi:           0.84,
    progress:      47,
    city:          "Bouskoura",
    country:       "MA",
    clientName:    "Groupe Omnium Industries",
    clientContact: "+212 5 22 XX XX XX",
  },
  {
    name:          "Station Énergie Mohammedia",
    reference:     "PROJ-2024-002",
    description:   "Installation station de production énergétique — Capacité 150 MW",
    type:          "INFRASTRUCTURE" as const,
    status:        "ACTIVE" as const,
    startDate:     new Date("2024-03-01"),
    endDate:       new Date("2026-06-30"),
    budgetInitial: 210_000_000,
    budgetActual:  283_000_000,
    spi:           0.89,
    cpi:           0.74,
    progress:      38,
    city:          "Mohammedia",
    country:       "MA",
    clientName:    "ONEE",
  },
  {
    name:          "Villas Ain Diab Prestige",
    reference:     "PROJ-2024-003",
    description:   "Résidence de luxe 24 villas — Façade océan · Finitions premium",
    type:          "RESIDENTIAL" as const,
    status:        "ACTIVE" as const,
    startDate:     new Date("2024-04-10"),
    endDate:       new Date("2025-09-30"),
    budgetInitial: 85_000_000,
    spi:           1.04,
    cpi:           1.02,
    progress:      72,
    city:          "Casablanca",
    country:       "MA",
    clientName:    "Groupe Addoha",
  },
  {
    name:          "Résidence Al Andalous",
    reference:     "PROJ-2024-004",
    description:   "Résidence 120 appartements R+8 — Infrastructures VRD complètes",
    type:          "RESIDENTIAL" as const,
    status:        "ACTIVE" as const,
    startDate:     new Date("2024-02-01"),
    endDate:       new Date("2025-11-30"),
    budgetInitial: 150_000_000,
    spi:           0.94,
    cpi:           0.87,
    progress:      63,
    city:          "Rabat",
    country:       "MA",
    clientName:    "Alliances Développement",
  },
]

export async function seedProjects(
  prisma: PrismaClient,
  companyId: string,
  adminId: string,
  managerId: string,
) {
  console.log("  → Seeding projects…")

  const projects = await Promise.all(
    DEMO_PROJECTS.map(async p => {
      const project = await prisma.project.upsert({
        where:  { reference: p.reference },
        update: {},
        create: { ...p, companyId },
      })

      // Membres
      await prisma.projectMember.upsert({
        where:  { projectId_userId: { projectId: project.id, userId: adminId } },
        update: {},
        create: { projectId: project.id, userId: adminId, role: "ADMIN" },
      })
      await prisma.projectMember.upsert({
        where:  { projectId_userId: { projectId: project.id, userId: managerId } },
        update: {},
        create: { projectId: project.id, userId: managerId, role: "MANAGER" },
      })

      return project
    })
  )

  console.log(`  ✅ ${projects.length} projets créés`)
  return projects
}

export async function seedTasks(
  prisma: PrismaClient,
  projectId: string,
  assigneeId: string,
  creatorId: string,
) {
  const TASKS = [
    { title: "Étude géotechnique Zone A", status: "DONE" as const, priority: "HIGH" as const, progress: 100, estimatedHours: 40 },
    { title: "Coulage dalle béton — Zone B1", status: "IN_PROGRESS" as const, priority: "URGENT" as const, progress: 65, estimatedHours: 120 },
    { title: "Installation câblage électrique", status: "IN_PROGRESS" as const, priority: "HIGH" as const, progress: 30, estimatedHours: 80 },
    { title: "Réception matériaux acier", status: "TODO" as const, priority: "HIGH" as const, progress: 0, estimatedHours: 8 },
    { title: "Levée NC-047 — Coffrages", status: "BLOCKED" as const, priority: "URGENT" as const, progress: 0, estimatedHours: 16 },
    { title: "Rapport hebdomadaire S-21", status: "TODO" as const, priority: "MEDIUM" as const, progress: 0, estimatedHours: 4 },
    { title: "Inspection qualité béton Zone C", status: "IN_REVIEW" as const, priority: "HIGH" as const, progress: 90, estimatedHours: 12 },
    { title: "Mise à jour planning Gantt", status: "DONE" as const, priority: "MEDIUM" as const, progress: 100, estimatedHours: 6 },
  ]

  await Promise.all(
    TASKS.map((t, i) =>
      prisma.task.create({
        data: {
          ...t,
          projectId,
          assigneeId,
          creatorId,
          columnOrder: i,
          startDate:   new Date(),
          endDate:     new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000),
        },
      })
    )
  )
}
