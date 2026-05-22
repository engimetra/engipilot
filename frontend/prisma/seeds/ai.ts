import { PrismaClient } from "@prisma/client"

export async function seedAiData(
  prisma: PrismaClient,
  userId: string,
  projectId: string,
) {
  console.log("  → Seeding AI data…")

  // Conversation démo
  const conversation = await prisma.aiConversation.create({
    data: {
      userId,
      projectId,
      mode:  "CHAT",
      title: "Analyse SPI Usine Bouskoura",
      model: "gpt-4o-mini",
    },
  })

  await prisma.aiMessage.createMany({
    data: [
      {
        conversationId: conversation.id,
        role:           "user",
        content:        "Analyse le SPI du projet Usine Bouskoura et donne-moi des recommandations.",
      },
      {
        conversationId: conversation.id,
        role:           "assistant",
        content:        "## Analyse SPI — Usine Bouskoura\n\n**SPI = 0.72** → Retard critique détecté.\n\n**Analyse :**\nLe SPI en dessous de 0.75 indique un retard sévère sur le planning. La fin prédite est +46 jours par rapport au plan initial.\n\n**Recommandations :**\n→ Recruter 4 électriciens intérimaires\n→ Planification béton 2×/semaine\n→ Clôturer NC-047 et NC-046 en priorité",
        confidence:     88,
        sources:        ["Données EVM ENGIPILOT", "Normes FIDIC"],
      },
      {
        conversationId: conversation.id,
        role:           "user",
        content:        "Génère un PV de réunion pour la réunion chantier de ce matin.",
      },
      {
        conversationId: conversation.id,
        role:           "assistant",
        content:        "## PV — Réunion de Chantier | Usine Bouskoura | " + new Date().toLocaleDateString("fr-FR") + "\n\n**1. PARTICIPANTS**\n• Conducteur travaux · Chef de chantier · Représentants sous-traitants\n\n**2. AVANCEMENT GÉNÉRAL**\n• Avancement physique : 47% (prévu 65%)\n• SPI = 0.72 · CPI = 0.84\n\n**3. POINTS CRITIQUES**\n🔴 NC-047 ouverte — Coffrages Zone B\n🟠 Livraison acier retardée de 5 jours\n\n**4. DÉCISIONS PRISES**\n✓ Renfort équipe électricité (+4 intérimaires)\n✓ Réunion béton 2×/semaine\n\n**5. PROCHAINE RÉUNION**\nJeudi prochain 09h00",
        confidence:     92,
        sources:        ["Contexte ENGIPILOT"],
      },
    ],
  })

  // Alertes IA démo
  const DEMO_ALERTS = [
    { type: "DELAY_RISK" as const,     level: "CRITICAL" as const, message: "Retard critique prédit : +46 jours sur Usine Bouskoura", value: "+46j",  confidence: 88 },
    { type: "BUDGET_OVERRUN" as const, level: "CRITICAL" as const, message: "Dépassement budgétaire Station Énergie — EAC 283M vs BAT 210M (+34.8%)", value: "+34.8%", confidence: 91 },
    { type: "MATERIAL_ISSUE" as const, level: "HIGH" as const,     message: "Consommation béton anormale Zone C — ×1.34 vs norme", value: "×1.34",  confidence: 84 },
    { type: "HSE_RISK" as const,       level: "MEDIUM" as const,   message: "Taux de fréquence incidents HSE en hausse — TF = 8.5", value: "TF=8.5", confidence: 78 },
    { type: "NC_BLOCKAGE" as const,    level: "HIGH" as const,     message: "4 non-conformités ouvertes bloquant l'avancement", value: "4 NC",  confidence: 95 },
  ]

  await Promise.all(
    DEMO_ALERTS.map(a =>
      prisma.aiAlert.create({ data: { ...a, projectId } })
    )
  )

  // Mémoire IA utilisateur
  await prisma.aiMemory.upsert({
    where:  { userId_key: { userId, key: "preferred_language" } },
    update: {},
    create: { userId, key: "preferred_language", value: "fr", context: "Langue préférée de l'utilisateur" },
  })

  await prisma.aiMemory.upsert({
    where:  { userId_key: { userId, key: "last_project" } },
    update: {},
    create: { userId, key: "last_project", value: projectId, context: "Dernier projet consulté" },
  })

  console.log("  ✅ Données IA créées (conversation + 5 alertes + mémoire)")
}
