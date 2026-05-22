import api from "@/lib/api"
import type { Projet, EVMResult, Tache, RapportJournalier, NonConformite, IncidentHSE } from "@/types"

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export const projetService = {
  // ── Projets ──────────────────────────────────────────────────
  lister: (page = 0, size = 20, statut?: string) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) })
    if (statut) params.set("statut", statut)
    return api.get<PageResponse<Projet>>(`/projets?${params}`).then(r => r.data)
  },

  getById: (id: string) =>
    api.get<Projet>(`/projets/${id}`).then(r => r.data),

  creer: (data: Partial<Projet>) =>
    api.post<Projet>("/projets", data).then(r => r.data),

  modifier: (id: string, data: Partial<Projet>) =>
    api.put<Projet>(`/projets/${id}`, data).then(r => r.data),

  mettreAJourAvancement: (id: string, avancement: number) =>
    api.patch<Projet>(`/projets/${id}/avancement`, { avancementPhysique: avancement }).then(r => r.data),

  supprimer: (id: string) =>
    api.delete(`/projets/${id}`),

  getKPIsEVM: (id: string) =>
    api.get<EVMResult>(`/projets/${id}/kpis/evm`).then(r => r.data),

  // ── Tâches ───────────────────────────────────────────────────
  getTaches: (projetId: string) =>
    api.get<Tache[]>(`/projets/${projetId}/taches`).then(r => r.data),

  creerTache: (projetId: string, data: Partial<Tache>) =>
    api.post<Tache>(`/projets/${projetId}/taches`, data).then(r => r.data),

  changerStatutTache: (projetId: string, tacheId: string, statut: string) =>
    api.patch(`/projets/${projetId}/taches/${tacheId}/statut`, { statut }).then(r => r.data),

  // ── Rapports ─────────────────────────────────────────────────
  getRapports: (projetId: string, page = 0) =>
    api.get<PageResponse<RapportJournalier>>(`/projets/${projetId}/rapports?page=${page}`).then(r => r.data),

  soumettreRapport: (projetId: string, data: Partial<RapportJournalier>) =>
    api.post<RapportJournalier>(`/projets/${projetId}/rapports`, data).then(r => r.data),

  validerRapport: (projetId: string, rapportId: string) =>
    api.patch(`/projets/${projetId}/rapports/${rapportId}/valider`).then(r => r.data),

  // ── NC ───────────────────────────────────────────────────────
  getNCs: (projetId: string) =>
    api.get<PageResponse<NonConformite>>(`/projets/${projetId}/nc`).then(r => r.data),

  creerNC: (projetId: string, data: Partial<NonConformite>) =>
    api.post<NonConformite>(`/projets/${projetId}/nc`, data).then(r => r.data),

  changerStatutNC: (projetId: string, ncId: string, statut: string) =>
    api.patch(`/projets/${projetId}/nc/${ncId}/statut`, { statut }).then(r => r.data),

  // ── HSE ──────────────────────────────────────────────────────
  getIncidents: (projetId: string) =>
    api.get<IncidentHSE[]>(`/projets/${projetId}/hse/incidents`).then(r => r.data),

  declarerIncident: (projetId: string, data: Partial<IncidentHSE>) =>
    api.post<IncidentHSE>(`/projets/${projetId}/hse/incidents`, data).then(r => r.data),

  getKPIsHSE: (projetId: string) =>
    api.get(`/projets/${projetId}/hse/kpis`).then(r => r.data),
}
