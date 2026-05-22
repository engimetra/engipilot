import api from "@/lib/api"

const IA_URL = process.env.NEXT_PUBLIC_IA_URL ?? "http://localhost:8001"

export interface KPIInput {
  projet_id: string
  spi: number; cpi: number
  avancement_physique: number; avancement_theorique: number
  budget_consomme_pct: number
  effectif_actuel: number; effectif_prevu: number
  nb_nc_ouvertes: number; nb_incidents_hse: number
  duree_prevue_jours: number; jours_ecoules: number
}

export interface PredictionResult {
  projet_id: string
  retard_predit_jours: number; confiance_retard: number; interpretation_retard: string
  depassement_predit_pct: number; confiance_depassement: number; interpretation_depassement: string
  recommandations: string[]; niveau_alerte: "OK" | "ATTENTION" | "CRITIQUE"
}

export interface ChatResponse {
  response: string; suggestions: string[]; type: string
}

export const iaService = {
  predire: (kpis: KPIInput) =>
    fetch(`${IA_URL}/api/v1/predictions/retard-budget`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(kpis),
    }).then(r => r.json() as Promise<PredictionResult>),

  chat: (message: string, projetId?: string) =>
    fetch(`${IA_URL}/api/v1/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, projet_id: projetId }),
    }).then(r => r.json() as Promise<ChatResponse>),

  sante: () =>
    fetch(`${IA_URL}/health`).then(r => r.json()),
}
