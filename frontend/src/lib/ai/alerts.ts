/* ─────────────────────────────────────────────────────────────
   ENGIPILOT — Alert Engine : Détection automatique des risques
   Règles If/Then sur signaux BTP (HSE, planning, budget, matériaux)
───────────────────────────────────────────────────────────── */

export interface AlertInput {
  safetyRisk?: boolean
  delayDays?: number
  materialIssue?: boolean
  budgetOverrunPct?: number
  nbIncidentsHse?: number
  spi?: number
  cpi?: number
  nbNcOuvertes?: number
}

export type AlertType =
  | "HSE_RISK"
  | "SCHEDULE_DELAY"
  | "MATERIAL_ISSUE"
  | "BUDGET_CRITICAL"
  | "HSE_INCIDENT"
  | "SPI_ALERT"
  | "CPI_ALERT"
  | "NC_BLOCKAGE"

export type AlertLevel = "HIGH" | "MEDIUM" | "LOW"

export interface Alert {
  type: AlertType
  level: AlertLevel
  message: string
}

export function alertEngine(input: AlertInput): Alert[] {
  const alerts: Alert[] = []

  if (input.safetyRisk === true) {
    alerts.push({
      type:    "HSE_RISK",
      level:   "HIGH",
      message: "Risque de sécurité détecté sur le chantier",
    })
  }

  if (input.delayDays !== undefined && input.delayDays > 5) {
    alerts.push({
      type:    "SCHEDULE_DELAY",
      level:   input.delayDays > 15 ? "HIGH" : "MEDIUM",
      message: `Retard important sur le planning (+${input.delayDays}j)`,
    })
  }

  if (input.materialIssue === true) {
    alerts.push({
      type:    "MATERIAL_ISSUE",
      level:   "HIGH",
      message: "Problème détecté sur les matériaux",
    })
  }

  if (input.budgetOverrunPct !== undefined && input.budgetOverrunPct > 10) {
    alerts.push({
      type:    "BUDGET_CRITICAL",
      level:   input.budgetOverrunPct > 20 ? "HIGH" : "MEDIUM",
      message: `Dépassement budgétaire de ${input.budgetOverrunPct.toFixed(1)}%`,
    })
  }

  if (input.nbIncidentsHse !== undefined && input.nbIncidentsHse > 0) {
    alerts.push({
      type:    "HSE_INCIDENT",
      level:   input.nbIncidentsHse > 2 ? "HIGH" : "MEDIUM",
      message: `${input.nbIncidentsHse} incident(s) HSE enregistré(s)`,
    })
  }

  if (input.spi !== undefined && input.spi < 0.85) {
    alerts.push({
      type:    "SPI_ALERT",
      level:   input.spi < 0.75 ? "HIGH" : "MEDIUM",
      message: `SPI à ${input.spi.toFixed(2)} — sous le seuil d'alerte (0.85)`,
    })
  }

  if (input.cpi !== undefined && input.cpi < 0.90) {
    alerts.push({
      type:    "CPI_ALERT",
      level:   input.cpi < 0.80 ? "HIGH" : "MEDIUM",
      message: `CPI à ${input.cpi.toFixed(2)} — dépassement budgétaire probable`,
    })
  }

  if (input.nbNcOuvertes !== undefined && input.nbNcOuvertes > 3) {
    alerts.push({
      type:    "NC_BLOCKAGE",
      level:   "HIGH",
      message: `${input.nbNcOuvertes} NC ouvertes — blocage qualité recommandé`,
    })
  }

  return alerts
}
