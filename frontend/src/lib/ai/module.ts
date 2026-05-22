/* ─────────────────────────────────────────────────────────────
   ENGIPILOT — Module IA : Raisonnement et Analyse
   Détection d'insights à partir des données projet (règles métier BTP)
───────────────────────────────────────────────────────────── */

export interface ProjectData {
  delay: number
  cost: number
  budget: number
  workers: number
  requiredWorkers: number
  spi?: number
  cpi?: number
  nbNcOuvertes?: number
  absencePct?: number
}

export type InsightType =
  | "DELAY_RISK"
  | "BUDGET_OVERRUN"
  | "RESOURCE_SHORTAGE"
  | "SPI_CRITICAL"
  | "CPI_CRITICAL"
  | "NC_ALERT"
  | "ABSENTEEISM"

export type InsightLevel = "HIGH" | "MEDIUM" | "LOW"

export interface AIInsight {
  type: InsightType
  level: InsightLevel
  message: string
  value?: string | number
}

export function aiModule(data: ProjectData): AIInsight[] {
  const insights: AIInsight[] = []

  if (data.delay > 3) {
    insights.push({
      type:    "DELAY_RISK",
      level:   data.delay > 10 ? "HIGH" : "MEDIUM",
      message: "Risque de retard détecté sur le projet",
      value:   `+${data.delay}j`,
    })
  }

  if (data.cost > data.budget) {
    const overrunPct = ((data.cost - data.budget) / data.budget) * 100
    insights.push({
      type:    "BUDGET_OVERRUN",
      level:   overrunPct > 15 ? "HIGH" : "MEDIUM",
      message: "Dépassement de budget probable",
      value:   `+${overrunPct.toFixed(1)}%`,
    })
  }

  if (data.workers < data.requiredWorkers) {
    insights.push({
      type:    "RESOURCE_SHORTAGE",
      level:   "MEDIUM",
      message: "Manque de ressources humaines",
      value:   `${data.requiredWorkers - data.workers} manquant(s)`,
    })
  }

  if (data.spi !== undefined && data.spi < 0.80) {
    insights.push({
      type:    "SPI_CRITICAL",
      level:   data.spi < 0.75 ? "HIGH" : "MEDIUM",
      message: "SPI critique — retard significatif sur le planning",
      value:   data.spi,
    })
  }

  if (data.cpi !== undefined && data.cpi < 0.85) {
    insights.push({
      type:    "CPI_CRITICAL",
      level:   data.cpi < 0.75 ? "HIGH" : "MEDIUM",
      message: "CPI sous le seuil — dépassement budgétaire en cours",
      value:   data.cpi,
    })
  }

  if (data.nbNcOuvertes !== undefined && data.nbNcOuvertes > 3) {
    insights.push({
      type:    "NC_ALERT",
      level:   "HIGH",
      message: "Non-conformités ouvertes — blocage qualité probable",
      value:   data.nbNcOuvertes,
    })
  }

  if (data.absencePct !== undefined && data.absencePct > 20) {
    insights.push({
      type:    "ABSENTEEISM",
      level:   "MEDIUM",
      message: "Taux d'absentéisme élevé — risque sur la productivité",
      value:   `${data.absencePct}%`,
    })
  }

  return insights
}
