/* ─────────────────────────────────────────────────────────────
   ENGIPILOT — Analytics Engine : KPI Engine
   Transformation des données projet en indicateurs exploitables (EVM)
───────────────────────────────────────────────────────────── */

export interface ProjectAnalyticsInput {
  completedTasks: number
  totalTasks: number
  plannedTime: number
  actualTime: number
  risks: unknown[]
  delays: number
  spent: number
  budget: number
  outputRate: number
  spi?: number
  cpi?: number
}

export type RiskLevel = "HIGH" | "MEDIUM" | "LOW"

export interface EvmIndicators {
  spi: number
  cpi: number
  eac: number
  vac: number
  sv: number
  cv: number
}

export interface AnalyticsOutput {
  progress: number
  efficiency: number
  riskLevel: RiskLevel
  summary: {
    delays: number
    budgetUsage: number
    productivity: number
  }
  evm?: EvmIndicators
}

export function analyticsEngine(project: ProjectAnalyticsInput): AnalyticsOutput {
  const progress = project.totalTasks > 0
    ? Math.min(100, (project.completedTasks / project.totalTasks) * 100)
    : 0

  const efficiency = project.actualTime > 0
    ? project.plannedTime / project.actualTime
    : 1

  const riskLevel: RiskLevel = project.risks.length > 5 ? "HIGH"
    : project.risks.length > 3 ? "MEDIUM"
    : "LOW"

  const budgetUsage = project.budget > 0
    ? (project.spent / project.budget) * 100
    : 0

  const output: AnalyticsOutput = {
    progress,
    efficiency: Math.round(efficiency * 100) / 100,
    riskLevel,
    summary: {
      delays: project.delays,
      budgetUsage: Math.round(budgetUsage * 10) / 10,
      productivity: project.outputRate,
    },
  }

  if (project.spi !== undefined && project.cpi !== undefined && project.budget > 0) {
    const eac = project.budget / project.cpi
    output.evm = {
      spi: project.spi,
      cpi: project.cpi,
      eac: Math.round(eac),
      vac: Math.round(project.budget - eac),
      sv:  Math.round((project.spi - 1) * project.plannedTime),
      cv:  Math.round((project.cpi - 1) * project.spent),
    }
  }

  return output
}
