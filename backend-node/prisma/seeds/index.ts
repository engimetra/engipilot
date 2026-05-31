// ═══════════════════════════════════════════════════════════════
//  ENGIPILOT — Database Seed (MySQL / backend-node)
//  Ordre : company → roles → users → projects → tasks →
//          budgets → incidents → notifications → analytics → AI
// ═══════════════════════════════════════════════════════════════
import { prisma }                          from "./_client"
import { seedRoles }                       from "./roles"
import { seedUsers }                       from "./users"
import { seedProjects, seedTasks }         from "./projects"
import { seedAiData }                      from "./ai"

async function main() {
  console.log("\n╔══════════════════════════════════════════════╗")
  console.log("║  ENGIPILOT — Database Seed (MySQL)          ║")
  console.log("╚══════════════════════════════════════════════╝\n")

  // 1. Entreprise principale
  console.log("→ Seeding company…")
  const company = await prisma.company.upsert({
    where:  { siret: "DEMO00000001MA" },
    update: {},
    create: {
      name:    "ENGIPILOT Demo SA",
      siret:   "DEMO00000001MA",
      city:    "Casablanca",
      country: "MA",
      email:   "contact@engipilot.ma",
      website: "https://engipilot.ma",
      plan:    "ENTERPRISE",
    },
  })
  console.log(`  ✅ Company: ${company.name}`)

  // 2. Rôles & Permissions
  const { roleMap } = await seedRoles()

  // 3. Utilisateurs démo
  const users        = await seedUsers(company.id, roleMap)
  const adminUser    = users.find(u => u.email === "admin@engipilot.ma")!
  const managerUser  = users.find(u => u.email === "manager@engipilot.ma")!
  const engineerUser = users.find(u => u.email === "engineer@engipilot.ma")!

  // 4. Projets démo
  const projects    = await seedProjects(company.id, adminUser.id, managerUser.id)
  const mainProject = projects[0]

  // 5. Tâches démo
  console.log("  → Seeding tasks…")
  await seedTasks(mainProject.id, engineerUser.id)
  console.log("  ✅ Tâches créées")

  // 6. Budget démo
  console.log("  → Seeding budgets…")
  await prisma.budget.upsert({
    where:  { id: "budget-seed-001" },
    update: {},
    create: {
      id:            "budget-seed-001",
      name:          "Budget Général — Phase 2",
      type:          "GENERAL",
      status:        "ACTIVE",
      amountPlanned: 210_000_000,
      amountActual:  176_400_000,
      projectId:     mainProject.id,
    },
  })
  console.log("  ✅ Budget créé")

  // 7. Incident HSE démo
  console.log("  → Seeding HSE incidents…")
  await prisma.incident.create({
    data: {
      title:       "Chute de matériaux — Zone B",
      description: "Chute de coffrages depuis niveau R+2 — aucun blessé, zone sécurisée",
      type:        "NEAR_MISS",
      severity:    "HIGH",
      status:      "UNDER_INVESTIGATION",
      date:        new Date("2025-05-10"),
      location:    "Zone B — Niveau R+2",
      reportedBy:  "Karim Tazi (HSE)",
      projectId:   mainProject.id,
    },
  })
  console.log("  ✅ Incident HSE créé")

  // 8. Notifications démo
  console.log("  → Seeding notifications…")
  const NOTIFS = [
    { title: "Alerte critique — SPI 0.72",      message: "Le projet Usine Bouskoura accuse un retard critique (SPI=0.72). Action requise.",  type: "AI_ALERT" as const },
    { title: "Rapport hebdomadaire disponible", message: "Le rapport S-21 est prêt à consulter dans la section Rapports.",                    type: "INFO"     as const },
    { title: "NC-046 levée",                    message: "La non-conformité NC-046 a été clôturée avec succès.",                               type: "SUCCESS"  as const },
    { title: "Stock béton faible",              message: "Le stock de béton Zone C est en dessous du seuil minimum (15 m³ restants).",          type: "WARNING"  as const },
    { title: "Nouvelles prédictions IA",        message: "5 nouvelles alertes IA générées. Consultez le module Intelligence IA.",              type: "AI_ALERT" as const },
    { title: "Nouveau membre ajouté",           message: "Salma El Fassi a rejoint le projet Villas Ain Diab en tant qu'ingénieure.",           type: "INFO"     as const },
  ]

  await Promise.all(
    NOTIFS.map(n =>
      prisma.notification.create({
        data: { ...n, userId: adminUser.id, projectId: mainProject.id },
      })
    )
  )
  console.log("  ✅ Notifications créées")

  // 9. Analytics snapshot
  console.log("  → Seeding analytics…")
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  await prisma.analytic.upsert({
    where:  { projectId_period_date: { projectId: mainProject.id, period: "DAILY", date: today } },
    update: {},
    create: {
      projectId: mainProject.id,
      period:    "DAILY",
      date:      today,
      spi:       0.72,
      cpi:       0.84,
      progress:  47,
      incidents: 2,
      tfRate:    8.5,
    },
  })
  console.log("  ✅ Analytics créé")

  // 10. Données IA
  await seedAiData(adminUser.id, mainProject.id)

  console.log("\n╔══════════════════════════════════════════════╗")
  console.log("║  ✅ Seed terminé avec succès !               ║")
  console.log("╠══════════════════════════════════════════════╣")
  console.log("║  Compte admin: admin@engipilot.ma            ║")
  console.log("║  Mot de passe: Engipilot2024!                ║")
  console.log("╚══════════════════════════════════════════════╝\n")
}

main()
  .catch(e => { console.error("❌ Seed failed:", e); process.exit(1) })
  .finally(() => prisma.$disconnect())
