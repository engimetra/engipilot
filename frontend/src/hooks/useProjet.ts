"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "@/lib/api"
import type { Projet, EVMResult, Tache } from "@/types"

interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

// ── Projets ───────────────────────────────────────────────────────
export function useProjets(page = 0, statut?: string) {
  const params = new URLSearchParams({ page: String(page), size: "20" })
  if (statut) params.set("statut", statut)
  return useQuery({
    queryKey: ["projets", page, statut],
    queryFn: () => api.get<PageResponse<Projet>>(`/projets?${params}`).then(r => r.data),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })
}

export function useProjet(id: string) {
  return useQuery({
    queryKey: ["projet", id],
    queryFn: () => api.get<Projet>(`/projets/${id}`).then(r => r.data),
    enabled: !!id,
  })
}

export function useKPIsEVM(projetId: string) {
  return useQuery({
    queryKey: ["kpis-evm", projetId],
    queryFn: () => api.get<EVMResult>(`/projets/${projetId}/kpis/evm`).then(r => r.data),
    enabled: !!projetId,
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}

// ── Tâches Kanban ─────────────────────────────────────────────────
export function useTaches(projetId: string) {
  return useQuery({
    queryKey: ["taches", projetId],
    queryFn: () => api.get<Tache[]>(`/projets/${projetId}/taches`).then(r => r.data),
    enabled: !!projetId,
  })
}

export function useChangerStatutTache() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ projetId, tacheId, statut }: { projetId: string; tacheId: string; statut: string }) =>
      api.patch(`/projets/${projetId}/taches/${tacheId}/statut`, { statut }).then(r => r.data),
    onSuccess: (_, { projetId }) => {
      qc.invalidateQueries({ queryKey: ["taches", projetId] })
    },
  })
}

// ── Mutations projets ─────────────────────────────────────────────
export function useUpdateAvancement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, avancement }: { id: string; avancement: number }) =>
      api.patch(`/projets/${id}/avancement`, { avancementPhysique: avancement }).then(r => r.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["projet", id] })
      qc.invalidateQueries({ queryKey: ["kpis-evm", id] })
      qc.invalidateQueries({ queryKey: ["projets"] })
    },
  })
}
