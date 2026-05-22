"use client"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Search, Plus, Filter, ChevronUp, ChevronDown, ExternalLink, X, RefreshCw, Pencil, Trash2, AlertTriangle } from "lucide-react"
import Link from "next/link"

// ── Types ────────────────────────────────────────────────────────────────────
interface ApiProject {
  id:            string
  name:          string
  reference:     string
  status:        string
  type:          string
  progress:      number | string
  startDate:     string
  endDate:       string
  budgetInitial: number | string
  budgetActual:  number | string
  spi:           number | string | null
  cpi:           number | string | null
  city:          string | null
  clientName:    string | null
  createdAt:     string
  members:       { user: { firstName: string; lastName: string } }[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const PALETTE = ["#635BFF","#E2445C","#FDAB3D","#00C875","#8b5cf6","#0ea5e9","#f97316"]
const pickColor = (id: string) => PALETTE[id.charCodeAt(0) % PALETTE.length]

const STATUS_DISPLAY: Record<string, string> = {
  ACTIVE:    "EN_COURS",
  DRAFT:     "PLANIFIE",
  PAUSED:    "EN_COURS",
  COMPLETED: "TERMINE",
  CANCELLED: "TERMINE",
  ARCHIVED:  "TERMINE",
}

const STATUT_STYLE: Record<string, string> = {
  EN_COURS: "bg-success/10 text-success border-success/20",
  RETARD:   "bg-danger/10 text-danger border-danger/20",
  PLANIFIE: "bg-primary/10 text-primary border-primary/20",
  TERMINE:  "bg-muted text-muted-fg border-border",
}

function formatBudget(val: number | string): string {
  const n = Number(val)
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M MAD"
  if (n >= 1_000)     return (n / 1_000).toFixed(0)     + "K MAD"
  return n.toFixed(0) + " MAD"
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-MA", { day: "2-digit", month: "2-digit", year: "2-digit" })
}

function retardFromSpi(spi: number | string | null): string {
  const s = spi !== null ? Number(spi) : null
  if (s === null)  return "—"
  if (s >= 0.95)   return "—"
  if (s >= 0.85)   return "+8j"
  if (s >= 0.75)   return "+12j"
  if (s >= 0.65)   return "+32j"
  return "+46j"
}

function statut(project: ApiProject): string {
  const spi = project.spi !== null ? Number(project.spi) : null
  const display = STATUS_DISPLAY[project.status] ?? "EN_COURS"
  if (display === "EN_COURS" && spi !== null && spi < 0.9) return "RETARD"
  return display
}

function initiales(nom: string) {
  return nom.trim().split(/\s+/).map(p => p[0]?.toUpperCase() ?? "").slice(0, 2).join("")
}

// ── API calls ────────────────────────────────────────────────────────────────
async function fetchProjects(): Promise<ApiProject[]> {
  const res = await fetch("/api/projects")
  if (!res.ok) throw new Error("Impossible de charger les projets")
  return res.json()
}

async function createProject(data: {
  name: string; startDate: string; endDate: string; budgetInitial: number;
  status: string; type: string; city?: string; clientName?: string;
}) {
  const res = await fetch("/api/projects", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? "Erreur création")
  return json
}

async function updateProject(id: string, data: {
  name?: string; startDate?: string; endDate?: string; budgetInitial?: number;
  status?: string; type?: string; city?: string | null; clientName?: string | null;
}) {
  const res = await fetch(`/api/projects/${id}`, {
    method:  "PUT",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? "Erreur modification")
  return json
}

async function deleteProject(id: string) {
  const res = await fetch(`/api/projects/${id}`, { method: "DELETE" })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? "Erreur suppression")
  return json
}

// ── Types UI ─────────────────────────────────────────────────────────────────
type SortKey = "nom" | "avancement" | "budget" | "fin" | null

const FORM_INIT = {
  nom: "", clientName: "", budget: "", debut: "", fin: "",
  status: "ACTIVE", type: "CONSTRUCTION", city: "",
}

// ── Page component ────────────────────────────────────────────────────────────
export default function ChantiersPage() {
  const queryClient = useQueryClient()
  const [search, setSearch]           = useState("")
  const [filterStatut, setFilterStatut] = useState("TOUS")
  const [sortBy, setSortBy]           = useState<SortKey>(null)
  const [sortAsc, setSortAsc]         = useState(true)
  const [showModal, setShowModal]     = useState(false)
  const [form, setForm]               = useState(FORM_INIT)
  const [formError, setFormError]     = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editId, setEditId]               = useState<string | null>(null)
  const [editForm, setEditForm]           = useState(FORM_INIT)
  const [editFormError, setEditFormError] = useState<string | null>(null)
  const [deleteId, setDeleteId]           = useState<string | null>(null)

  const { data: projects = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["projects"],
    queryFn:  fetchProjects,
  })

  const mutation = useMutation({
    mutationFn: createProject,
    onSuccess:  () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      setShowModal(false)
      setForm(FORM_INIT)
      setFormError(null)
    },
    onError: (err: Error) => setFormError(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateProject>[1] }) =>
      updateProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      setShowEditModal(false)
      setEditId(null)
      setEditForm(FORM_INIT)
      setEditFormError(null)
    },
    onError: (err: Error) => setEditFormError(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["projects"] })
      const previous = queryClient.getQueryData<ApiProject[]>(["projects"])
      queryClient.setQueryData<ApiProject[]>(["projects"], (old = []) =>
        old.filter(p => p.id !== id)
      )
      return { previous }
    },
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(["projects"], context.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      setDeleteId(null)
    },
  })

  const handleSort = (key: SortKey) => {
    if (sortBy === key) setSortAsc(a => !a)
    else { setSortBy(key); setSortAsc(true) }
  }

  const filtered = projects
    .map(p => ({
      ...p,
      _statut:    statut(p),
      _avancement: Number(p.progress),
      _retard:    retardFromSpi(p.spi),
      _budget:    formatBudget(p.budgetInitial),
      _debut:     formatDate(p.startDate),
      _fin:       formatDate(p.endDate),
      _color:     pickColor(p.id),
      _responsable: p.members[0]
        ? `${p.members[0].user.firstName[0]}. ${p.members[0].user.lastName}`
        : "—",
      _initiales: p.members[0]
        ? initiales(`${p.members[0].user.firstName} ${p.members[0].user.lastName}`)
        : "??",
    }))
    .filter(c =>
      (filterStatut === "TOUS" || c._statut === filterStatut) &&
      (c.name.toLowerCase().includes(search.toLowerCase()) || c.reference.includes(search))
    )
    .sort((a, b) => {
      if (!sortBy) return 0
      const map: Record<SortKey & string, string> = {
        nom:       a.name,
        avancement:String(a._avancement),
        budget:    String(a.budgetInitial),
        fin:       a.endDate,
      }
      const va = map[sortBy] ?? ""
      const vb = sortBy === "nom" ? b.name : sortBy === "avancement" ? String(b._avancement) : sortBy === "budget" ? String(b.budgetInitial) : b.endDate
      return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va)
    })

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortBy === col
      ? sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
      : <ChevronUp className="w-3 h-3 opacity-0 group-hover:opacity-40" />

  function handleEditOpen(p: ApiProject) {
    setEditId(p.id)
    setEditForm({
      nom:        p.name,
      clientName: p.clientName ?? "",
      budget:     String(p.budgetInitial),
      debut:      p.startDate.slice(0, 10),
      fin:        p.endDate.slice(0, 10),
      status:     p.status,
      type:       p.type,
      city:       p.city ?? "",
    })
    setEditFormError(null)
    setShowEditModal(true)
  }

  function handleUpdate() {
    setEditFormError(null)
    if (!editForm.nom.trim()) { setEditFormError("Nom du chantier requis"); return }
    if (!editId) return
    updateMutation.mutate({
      id: editId,
      data: {
        name:          editForm.nom.trim(),
        startDate:     editForm.debut || undefined,
        endDate:       editForm.fin   || undefined,
        budgetInitial: editForm.budget ? Number(editForm.budget) : undefined,
        status:        editForm.status,
        type:          editForm.type,
        city:          editForm.city       || null,
        clientName:    editForm.clientName || null,
      },
    })
  }

  function handleCreate() {
    setFormError(null)
    if (!form.nom.trim()) { setFormError("Nom du chantier requis"); return }
    if (!form.debut)      { setFormError("Date de début requise"); return }
    if (!form.fin)        { setFormError("Date de fin requise"); return }
    if (!form.budget || isNaN(Number(form.budget))) { setFormError("Budget invalide (nombre en MAD)"); return }

    mutation.mutate({
      name:          form.nom.trim(),
      startDate:     form.debut,
      endDate:       form.fin,
      budgetInitial: Number(form.budget),
      status:        form.status,
      type:          form.type,
      city:          form.city || undefined,
      clientName:    form.clientName || undefined,
    })
  }

  return (
    <div className="space-y-5 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Gestion des Chantiers</h1>
          <p className="text-sm text-muted-fg mt-1">
            {isLoading ? "Chargement…" : `${filtered.length} chantier${filtered.length !== 1 ? "s" : ""} · Données réelles`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2 border border-border rounded-lg bg-white hover:bg-muted transition-colors text-muted-fg shadow-card"
            title="Rafraîchir"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Nouveau chantier
          </button>
        </div>
      </div>

      {/* Error banner */}
      {isError && (
        <div className="bg-danger/8 border border-danger/20 text-danger text-sm px-4 py-3 rounded-lg">
          Impossible de charger les projets — vérifiez votre connexion.
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-border rounded-lg px-3 py-2 flex-1 max-w-xs shadow-card">
          <Search className="w-4 h-4 text-muted-fg flex-shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Nom ou code chantier..."
            className="bg-transparent text-sm outline-none flex-1 min-w-0 placeholder:text-muted-fg"
          />
        </div>
        <div className="flex items-center gap-1.5 bg-white border border-border rounded-lg px-3 py-2 shadow-card">
          <Filter className="w-3.5 h-3.5 text-muted-fg" />
          <select
            value={filterStatut}
            onChange={e => setFilterStatut(e.target.value)}
            className="bg-transparent text-sm outline-none cursor-pointer text-foreground"
          >
            <option value="TOUS">Tous les statuts</option>
            <option value="EN_COURS">En cours</option>
            <option value="RETARD">Retard</option>
            <option value="PLANIFIE">Planifié</option>
            <option value="TERMINE">Terminé</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-border rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" className="rounded border-border" />
                </th>
                {[
                  { label: "Chantier",    key: "nom"        as SortKey },
                  { label: "Responsable", key: null },
                  { label: "Statut",      key: null },
                  { label: "Avancement",  key: "avancement" as SortKey },
                  { label: "SPI/Retard",  key: null },
                  { label: "Budget",      key: "budget"     as SortKey },
                  { label: "Fin prévue",  key: "fin"        as SortKey },
                  { label: "",            key: null },
                ].map(({ label, key }) => (
                  <th
                    key={label}
                    onClick={() => key && handleSort(key)}
                    className={`text-left px-4 py-3 text-xs font-semibold text-muted-fg uppercase tracking-wide whitespace-nowrap group
                      ${key ? "cursor-pointer hover:text-foreground select-none" : ""}`}
                  >
                    <span className="flex items-center gap-1">
                      {label}
                      {key && <SortIcon col={key} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-muted-fg text-sm">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      Chargement des projets…
                    </div>
                  </td>
                </tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-muted-fg text-sm">
                    Aucun chantier trouvé. Créez votre premier projet.
                  </td>
                </tr>
              )}
              {filtered.map(c => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors duration-100">
                  <td className="px-4 py-3.5">
                    <input type="checkbox" className="rounded border-border" />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-foreground">{c.name}</div>
                    <div className="text-xs text-muted-fg font-mono mt-0.5">{c.reference}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: c._color + "20", color: c._color }}
                      >
                        {c._initiales}
                      </div>
                      <span className="text-xs text-foreground">{c._responsable}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full font-semibold border ${STATUT_STYLE[c._statut] ?? STATUT_STYLE.EN_COURS}`}>
                      {c._statut.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden flex-shrink-0">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${c._avancement}%`,
                            background: c._avancement > 75 ? "#00C875"
                              : c._avancement > 50 ? "#635BFF"
                              : c._avancement > 30 ? "#FDAB3D"
                              : "#E2445C",
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-foreground tabular-nums">{c._avancement}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs font-semibold tabular-nums ${
                      c._retard === "—" ? "text-success" : "text-warning"
                    }`}>
                      {c._retard}
                      {c.spi !== null && (
                        <span className="ml-1 text-muted-fg font-normal">SPI {Number(c.spi).toFixed(2)}</span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs font-mono text-foreground tabular-nums">{c._budget}</td>
                  <td className="px-4 py-3.5 text-xs font-mono text-muted-fg tabular-nums">{c._fin}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/chantiers/${c.id}`}
                        className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:text-primary-hover transition-colors"
                      >
                        Voir <ExternalLink className="w-3 h-3" />
                      </Link>
                      <button
                        onClick={() => handleEditOpen(c)}
                        className="p-1.5 rounded-lg text-muted-fg hover:text-foreground hover:bg-muted transition-colors"
                        title="Modifier"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteId(c.id)}
                        className="p-1.5 rounded-lg text-muted-fg hover:text-danger hover:bg-danger/8 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer count */}
        <div className="px-5 py-3 border-t border-border flex items-center justify-between bg-muted/20">
          <span className="text-xs text-muted-fg">{filtered.length} résultat{filtered.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Modal Nouveau chantier */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) { setShowModal(false); setForm(FORM_INIT); setFormError(null) } }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-border">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="text-base font-bold text-foreground">Nouveau chantier</h2>
                <p className="text-xs text-muted-fg mt-0.5">Créé en base de données</p>
              </div>
              <button
                onClick={() => { setShowModal(false); setForm(FORM_INIT); setFormError(null) }}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-fg hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {formError && (
                <div className="text-sm text-danger bg-danger/8 border border-danger/20 rounded-lg px-3 py-2">
                  {formError}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">
                  Nom du chantier <span className="text-danger">*</span>
                </label>
                <input
                  value={form.nom}
                  onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                  placeholder="Ex: Résidence Les Orangers"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Statut</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-white"
                  >
                    <option value="DRAFT">Planifié</option>
                    <option value="ACTIVE">En cours</option>
                    <option value="PAUSED">En pause</option>
                    <option value="COMPLETED">Terminé</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Type</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-white"
                  >
                    <option value="CONSTRUCTION">Construction</option>
                    <option value="RENOVATION">Rénovation</option>
                    <option value="INFRASTRUCTURE">Infrastructure</option>
                    <option value="INDUSTRIAL">Industriel</option>
                    <option value="RESIDENTIAL">Résidentiel</option>
                    <option value="COMMERCIAL">Commercial</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">
                    Date début <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date" value={form.debut}
                    onChange={e => setForm(f => ({ ...f, debut: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">
                    Date fin <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date" value={form.fin}
                    onChange={e => setForm(f => ({ ...f, fin: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">
                    Budget initial (MAD) <span className="text-danger">*</span>
                  </label>
                  <input
                    value={form.budget}
                    onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
                    placeholder="Ex: 45000000"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Ville</label>
                  <input
                    value={form.city}
                    onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                    placeholder="Ex: Casablanca"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">Client</label>
                <input
                  value={form.clientName}
                  onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
                  placeholder="Ex: Société Immobilière Maghreb"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-muted/20 rounded-b-2xl">
              <button
                onClick={() => { setShowModal(false); setForm(FORM_INIT); setFormError(null) }}
                className="px-4 py-2 text-sm border border-border rounded-lg bg-white hover:bg-muted transition-colors text-foreground"
              >
                Annuler
              </button>
              <button
                onClick={handleCreate}
                disabled={mutation.isPending}
                className="btn-primary disabled:opacity-60"
              >
                {mutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Création…
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" strokeWidth={2.5} />
                    Créer le chantier
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Modifier chantier ────────────────────────────────────────── */}
      {showEditModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) { setShowEditModal(false); setEditId(null); setEditFormError(null) } }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-border">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="text-base font-bold text-foreground">Modifier le chantier</h2>
                <p className="text-xs text-muted-fg mt-0.5">Modifications sauvegardées en base PostgreSQL</p>
              </div>
              <button
                onClick={() => { setShowEditModal(false); setEditId(null); setEditFormError(null) }}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-fg hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {editFormError && (
                <div className="text-sm text-danger bg-danger/8 border border-danger/20 rounded-lg px-3 py-2">
                  {editFormError}
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">
                  Nom du chantier <span className="text-danger">*</span>
                </label>
                <input
                  value={editForm.nom}
                  onChange={e => setEditForm(f => ({ ...f, nom: e.target.value }))}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Statut</label>
                  <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-white">
                    <option value="DRAFT">Planifié</option>
                    <option value="ACTIVE">En cours</option>
                    <option value="PAUSED">En pause</option>
                    <option value="COMPLETED">Terminé</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Type</label>
                  <select value={editForm.type} onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-white">
                    <option value="CONSTRUCTION">Construction</option>
                    <option value="RENOVATION">Rénovation</option>
                    <option value="INFRASTRUCTURE">Infrastructure</option>
                    <option value="INDUSTRIAL">Industriel</option>
                    <option value="RESIDENTIAL">Résidentiel</option>
                    <option value="COMMERCIAL">Commercial</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Date début</label>
                  <input type="date" value={editForm.debut} onChange={e => setEditForm(f => ({ ...f, debut: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Date fin</label>
                  <input type="date" value={editForm.fin} onChange={e => setEditForm(f => ({ ...f, fin: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Budget (MAD)</label>
                  <input value={editForm.budget} onChange={e => setEditForm(f => ({ ...f, budget: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Ville</label>
                  <input value={editForm.city} onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">Client</label>
                <input value={editForm.clientName} onChange={e => setEditForm(f => ({ ...f, clientName: e.target.value }))}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-muted/20 rounded-b-2xl">
              <button
                onClick={() => { setShowEditModal(false); setEditId(null); setEditFormError(null) }}
                className="px-4 py-2 text-sm border border-border rounded-lg bg-white hover:bg-muted transition-colors text-foreground"
              >
                Annuler
              </button>
              <button onClick={handleUpdate} disabled={updateMutation.isPending} className="btn-primary disabled:opacity-60">
                {updateMutation.isPending
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sauvegarde…</>
                  : <><Pencil className="w-4 h-4" /> Sauvegarder</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmation suppression ───────────────────────────────────────── */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-danger" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">Supprimer ce chantier ?</h2>
                <p className="text-xs text-muted-fg mt-0.5">Cette action est irréversible.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm border border-border rounded-lg bg-white hover:bg-muted transition-colors text-foreground"
              >
                Annuler
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm bg-danger text-white rounded-lg hover:bg-danger/90 transition-colors font-semibold disabled:opacity-60 flex items-center gap-2"
              >
                {deleteMutation.isPending
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Suppression…</>
                  : <><Trash2 className="w-4 h-4" /> Supprimer</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
