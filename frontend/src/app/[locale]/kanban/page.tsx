"use client"
import { useState, useRef, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import dynamic from "next/dynamic"
import { KanbanSkeleton } from "@/components/ui/Skeleton"
import {
  Plus, ChevronDown, Search, Filter, SquareKanban,
  Users, AlertTriangle, CheckCircle2, RefreshCw,
} from "lucide-react"

const KanbanBoard = dynamic(
  () => import("@/components/kanban/KanbanBoard").then(m => m.KanbanBoard),
  { ssr: false, loading: () => <KanbanSkeleton /> }
)

interface ApiProject {
  id:     string
  name:   string
  status: string
}

async function fetchProjects(): Promise<ApiProject[]> {
  const res = await fetch("/api/projects")
  if (!res.ok) throw new Error("Erreur")
  return res.json()
}

const PRIO_OPTIONS = [
  { value:"",         label:"Toutes priorités" },
  { value:"CRITIQUE", label:"Critique" },
  { value:"HAUTE",    label:"Haute" },
  { value:"NORMALE",  label:"Normale" },
  { value:"BASSE",    label:"Basse" },
]

export default function KanbanPage() {
  const boardRef = useRef<{ openModal: () => void }>(null)
  const [projetId, setProjetId]         = useState("")
  const [search, setSearch]             = useState("")
  const [filterPrio, setFilterPrio]     = useState("")
  const [filterMember, setFilterMember] = useState("")

  const { data: projects = [], isLoading, refetch } = useQuery<ApiProject[]>({
    queryKey: ["projects"],
    queryFn:  fetchProjects,
  })

  // Auto-select first project once loaded
  useEffect(() => {
    if (projects.length > 0 && !projetId) setProjetId(projects[0].id)
  }, [projects, projetId])

  const effectiveProjectId = projetId || projects[0]?.id || ""
  const projet = projects.find(p => p.id === effectiveProjectId)

  return (
    <div className="flex flex-col gap-5 page-enter" style={{ height:"calc(100vh - 56px - 48px)" }}>

      {/* ══ HEADER ══ */}
      <div className="flex-shrink-0 relative rounded-2xl overflow-hidden border border-border"
        style={{ background:"linear-gradient(135deg, #635BFF08 0%, #ffffff 40%, #14b8a608 100%)" }}>
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage:"linear-gradient(#635BFF 1px,transparent 1px),linear-gradient(90deg,#635BFF 1px,transparent 1px)", backgroundSize:"32px 32px" }} />
        <div className="relative px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="flex items-center gap-1.5 text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full">
                <SquareKanban className="w-3 h-3" /> Workflow Board
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-bold bg-teal/10 text-teal border border-teal/20 px-2.5 py-1 rounded-full">
                Drag & Drop
              </span>
            </div>
            <h1 className="text-lg font-black text-foreground tracking-tight">
              {projet ? projet.name : isLoading ? "Chargement…" : "Sélectionner un projet"}
            </h1>
            <p className="text-xs text-muted-fg mt-0.5">
              {projects.length} projet{projects.length !== 1 ? "s" : ""} · Glissez-déposez entre colonnes
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => refetch()}
              className="p-2 border border-border rounded-xl bg-white hover:bg-muted transition-colors text-muted-fg shadow-card"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>

            {/* Project selector */}
            <div className="relative">
              <select
                value={effectiveProjectId}
                onChange={e => setProjetId(e.target.value)}
                disabled={isLoading || projects.length === 0}
                className="appearance-none bg-white border border-border rounded-xl pl-3 pr-8 py-2 text-xs font-semibold outline-none
                           focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer shadow-card text-foreground
                           disabled:opacity-50"
              >
                {projects.length === 0 && <option value="">Aucun projet</option>}
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-fg pointer-events-none" />
            </div>

            <button
              onClick={() => boardRef.current?.openModal()}
              disabled={!effectiveProjectId}
              className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> Nouvelle tâche
            </button>
          </div>
        </div>
      </div>

      {/* ══ FILTER BAR ══ */}
      <div className="flex-shrink-0 flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-border rounded-xl px-3 py-2 flex-1 max-w-xs shadow-card">
          <Search className="w-3.5 h-3.5 text-muted-fg flex-shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher une tâche..."
            className="bg-transparent text-xs outline-none flex-1 min-w-0 placeholder:text-muted-fg"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-muted-fg hover:text-foreground transition-colors">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 bg-white border border-border rounded-xl px-3 py-2 shadow-card">
          <AlertTriangle className="w-3 h-3 text-muted-fg" />
          <select
            value={filterPrio}
            onChange={e => setFilterPrio(e.target.value)}
            className="bg-transparent text-xs outline-none cursor-pointer text-foreground"
          >
            {PRIO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-1.5 bg-white border border-border rounded-xl px-3 py-2 shadow-card">
          <Users className="w-3 h-3 text-muted-fg" />
          <input
            value={filterMember}
            onChange={e => setFilterMember(e.target.value)}
            placeholder="Filtre membre…"
            className="bg-transparent text-xs outline-none w-24 placeholder:text-muted-fg"
          />
        </div>

        {(search || filterPrio || filterMember) && (
          <button
            onClick={() => { setSearch(""); setFilterPrio(""); setFilterMember("") }}
            className="flex items-center gap-1 text-xs font-semibold text-danger bg-danger/10 border border-danger/20 px-3 py-2 rounded-xl hover:bg-danger/15 transition-colors"
          >
            <Filter className="w-3 h-3" /> Effacer filtres
          </button>
        )}
      </div>

      {/* ══ BOARD ══ */}
      <div className="flex-1 min-h-0">
        {effectiveProjectId ? (
          <KanbanBoard
            ref={boardRef}
            projectId={effectiveProjectId}
            search={search}
            filterPrio={filterPrio}
            filterMember={filterMember}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <SquareKanban className="w-12 h-12 text-muted-fg/30 mx-auto mb-3" />
              <p className="text-sm font-semibold text-foreground">
                {isLoading ? "Chargement des projets…" : "Aucun projet disponible"}
              </p>
              <p className="text-xs text-muted-fg mt-1">
                {isLoading ? "Un instant…" : "Créez un projet dans la section Chantiers"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
