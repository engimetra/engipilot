"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"

// ── Types (camelCase = format JSON Spring Boot) ───────────────────────────

export interface Incident {
  id: string
  type: string
  description: string
  dateIncident: string
  lieu: string | null
  gravite: "MINEUR" | "MAJEUR" | "CRITIQUE"
  statut: "EN_COURS" | "RESOLUE"
  nombreJoursArret: number | null
  nombreBlesses: number | null
  mesuresPrises: string | null
  projetId: string
  createdAt: string
}

export interface KPIsHSE {
  tf: number
  tg: number
  accidents: number
  presquAccidents: number
  enCours: number
  heuresSansAccident: number
}

export interface NonConformite {
  id: string
  reference: string
  description: string
  priorite: "CRITIQUE" | "MAJEURE" | "MINEURE"
  statut: "OUVERTE" | "EN_COURS" | "RESOLUE" | "FERMEE"
  lot: string | null
  zone: string | null
  responsable: string | null
  dateConstat: string
  dateResolution: string | null
  projetId: string
  createdAt: string
}

export interface RapportJournalier {
  id: string
  dateRapport: string
  numeroRapport: string
  meteo: string
  effectifTotal: number
  travauxRealises: string
  avancementJournalier: number
  problemes: string | null
  statut: "BROUILLON" | "SOUMIS" | "VALIDE"
  projetId: string
  createdAt: string
}

// ── HSE ──────────────────────────────────────────────────────────────────

export function useIncidents(projetId: string) {
  return useQuery({
    queryKey: ["incidents", projetId],
    queryFn: () => api.get<Incident[]>(`/projets/${projetId}/hse/incidents`).then(r => r.data),
    enabled: !!projetId,
    staleTime: 30_000,
  })
}

export function useKPIsHSE(projetId: string) {
  return useQuery({
    queryKey: ["kpis-hse", projetId],
    queryFn: () => api.get<KPIsHSE>(`/projets/${projetId}/hse/kpis`).then(r => r.data),
    enabled: !!projetId,
    staleTime: 60_000,
    refetchInterval: 120_000,
  })
}

export function useDeclareIncident(projetId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      type: string
      description: string
      dateIncident: string
      lieu?: string
      gravite?: string
      nombreJoursArret?: number
      nombreBlesses?: number
      mesuresPrises?: string
    }) => api.post<Incident>(`/projets/${projetId}/hse/incidents`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["incidents", projetId] })
      qc.invalidateQueries({ queryKey: ["kpis-hse", projetId] })
    },
  })
}

export function useChangerStatutIncident(projetId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, statut }: { id: string; statut: string }) =>
      api.patch<Incident>(`/projets/${projetId}/hse/incidents/${id}/statut?statut=${statut}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["incidents", projetId] })
      qc.invalidateQueries({ queryKey: ["kpis-hse", projetId] })
    },
  })
}

// ── Non-Conformités ───────────────────────────────────────────────────────

export function useNonConformites(projetId: string) {
  return useQuery({
    queryKey: ["nc", projetId],
    queryFn: () => api.get<NonConformite[]>(`/projets/${projetId}/nc`).then(r => r.data),
    enabled: !!projetId,
    staleTime: 30_000,
  })
}

export function useCreerNC(projetId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      description: string
      priorite: string
      lot?: string
      zone?: string
      responsable?: string
      dateConstat: string
    }) => api.post<NonConformite>(`/projets/${projetId}/nc`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["nc", projetId] }),
  })
}

export function useChangerStatutNC() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ projetId, id, statut }: { projetId: string; id: string; statut: string }) =>
      api.patch<NonConformite>(`/projets/${projetId}/nc/${id}/statut?statut=${statut}`).then(r => r.data),
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ["nc", data.projetId] }),
  })
}

// ── Rapports journaliers ──────────────────────────────────────────────────

export function useRapports(projetId: string) {
  return useQuery({
    queryKey: ["rapports", projetId],
    queryFn: () => api.get<RapportJournalier[]>(`/projets/${projetId}/rapports`).then(r => r.data),
    enabled: !!projetId,
    staleTime: 30_000,
  })
}

export function useCreerRapport(projetId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      dateRapport: string
      meteo?: string
      effectifTotal?: number
      travauxRealises: string
      avancementJournalier?: number
      problemes?: string
    }) => api.post<RapportJournalier>(`/projets/${projetId}/rapports`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rapports", projetId] }),
  })
}
