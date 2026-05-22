"use client"
import { useState, useRef, useEffect, useMemo, forwardRef, useImperativeHandle } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  DndContext, DragOverlay, closestCorners,
  PointerSensor, KeyboardSensor, TouchSensor,
  useSensor, useSensors,
  type DragStartEvent, type DragEndEvent, type DragOverEvent,
} from "@dnd-kit/core"
import {
  SortableContext, useSortable, sortableKeyboardCoordinates,
  verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable"
import { useDroppable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import {
  Plus, X, Calendar, MessageSquare, Paperclip,
  GripVertical, CheckCircle2, Clock, AlertTriangle, Zap,
  ChevronDown, Trash2,
} from "lucide-react"
import type { StatutTache } from "@/types"

// ── Types ────────────────────────────────────────────────────────────────────
type KTask = {
  id:            string
  projet_id:     string
  titre:         string
  description?:  string
  statut:        StatutTache
  priorite:      "CRITIQUE" | "HAUTE" | "NORMALE" | "BASSE"
  responsable?:  string | null
  date_echeance?: string
  avancement:    number
  created_at:    string
  tags?:         string[]
  comment_count?: number
  attach_count?:  number
}

type MemberInfo = { name: string; initials: string; color: string; bg: string; text: string }

// ── Config ───────────────────────────────────────────────────────────────────
const COLONNES: { id: StatutTache; label: string; accent: string; dot: string; dotBg: string }[] = [
  { id: "A_FAIRE",          label: "À faire",          accent: "text-muted-fg",  dot: "bg-muted-fg",  dotBg: "bg-muted"      },
  { id: "EN_COURS",         label: "En cours",          accent: "text-primary",   dot: "bg-primary",   dotBg: "bg-primary/10" },
  { id: "CONTROLE_QUALITE", label: "Contrôle qualité",  accent: "text-purple",    dot: "bg-purple",    dotBg: "bg-purple/10"  },
  { id: "TERMINE",          label: "Terminé",           accent: "text-success",   dot: "bg-success",   dotBg: "bg-success/10" },
]

const COLOR_CLASSES: Record<string, { bg: string; text: string }> = {
  "#635BFF": { bg: "bg-primary/10", text: "text-primary"   },
  "#FDAB3D": { bg: "bg-warning/10", text: "text-warning"   },
  "#E2445C": { bg: "bg-danger/10",  text: "text-danger"    },
  "#00C875": { bg: "bg-success/10", text: "text-success"   },
  "#8b5cf6": { bg: "bg-purple/10",  text: "text-purple"    },
}


const PRIO_CONFIG: Record<string, { bg:string; text:string; border:string; icon: React.ElementType; label:string }> = {
  CRITIQUE: { bg:"bg-danger/10",  text:"text-danger",  border:"border-danger/30",  icon:AlertTriangle, label:"Critique" },
  HAUTE:    { bg:"bg-warning/10", text:"text-warning", border:"border-warning/30", icon:Zap,           label:"Haute"    },
  NORMALE:  { bg:"bg-primary/10", text:"text-primary", border:"border-primary/30", icon:Clock,         label:"Normale"  },
  BASSE:    { bg:"bg-muted",      text:"text-muted-fg",border:"border-border",     icon:CheckCircle2,  label:"Basse"    },
}

const ALL_TAGS = ["Béton", "Structure", "Électricité", "Plomberie", "HSE", "Urgent", "Bloqué", "Révision"]
const TAG_COLORS: Record<string, string> = {
  Béton:"bg-warning/10 text-warning", Structure:"bg-primary/10 text-primary",
  Électricité:"bg-purple/10 text-purple", Plomberie:"bg-teal/10 text-teal",
  HSE:"bg-danger/10 text-danger", Urgent:"bg-danger/10 text-danger",
  Bloqué:"bg-muted text-muted-fg", Révision:"bg-success/10 text-success",
}

const FORM_INIT = {
  titre:"", priorite:"NORMALE" as KTask["priorite"],
  responsable:"", date_echeance:"", avancement:0, description:"", tags:[] as string[],
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function isOverdue(date?: string) {
  if (!date) return false
  return new Date(date) < new Date()
}

async function patchTask(id: string, data: Record<string, unknown>) {
  await fetch(`/api/tasks/${id}`, {
    method:  "PATCH",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(data),
  }).catch(err => console.error("Task patch failed", err))
}

async function deleteTask(id: string) {
  await fetch(`/api/tasks/${id}`, { method: "DELETE" })
    .catch(err => console.error("Task delete failed", err))
}

// ── SortableCard ─────────────────────────────────────────────────────────────
function SortableCard({
  tache, members, onDelete, onClick,
}: {
  tache:   KTask
  members: Record<string, MemberInfo>
  onDelete: (id: string) => void
  onClick:  (tache: KTask) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tache.id })
  const prio    = PRIO_CONFIG[tache.priorite]
  const PrioIcon = prio.icon
  const member  = tache.responsable ? (members[tache.responsable] ?? null) : null
  const overdue = isOverdue(tache.date_echeance) && tache.statut !== "TERMINE"

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className={`bg-white border rounded-2xl p-4 shadow-card group cursor-pointer
        ${isDragging ? "ring-2 ring-primary shadow-card-lg" : "hover:shadow-card-md hover:border-primary/25"}
        transition-all duration-150`}
      onClick={() => onClick(tache)}
    >
      <div className="flex items-start justify-between mb-3">
        <span className={`inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-full border ${prio.bg} ${prio.text} ${prio.border}`}>
          <PrioIcon className="w-2.5 h-2.5" strokeWidth={2.5} /> {prio.label}
        </span>
        <div className="flex items-center gap-1">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted transition-colors">
            <GripVertical className="w-3.5 h-3.5 text-muted-fg/40 group-hover:text-muted-fg transition-colors" />
          </div>
          <button
            onClick={e => { e.stopPropagation(); onDelete(tache.id) }}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-danger/10 text-muted-fg/40 hover:text-danger transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <p className="text-sm font-semibold text-foreground leading-snug mb-2.5">{tache.titre}</p>

      {tache.tags && tache.tags.length > 0 && (
        <div className="flex gap-1 flex-wrap mb-2.5">
          {tache.tags.map(tag => (
            <span key={tag} className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${TAG_COLORS[tag] ?? "bg-muted text-muted-fg"}`}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {tache.date_echeance && (
        <div className={`flex items-center gap-1 text-[10px] mb-2.5 ${overdue ? "text-danger font-semibold" : "text-muted-fg"}`}>
          <Calendar className="w-3 h-3 flex-shrink-0" />
          {overdue && "⚠ "}{tache.date_echeance}
        </div>
      )}

      {tache.avancement > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-muted-fg">Avancement</span>
            <span className={`font-bold ${tache.avancement === 100 ? "text-success" : "text-foreground"}`}>{tache.avancement}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width:`${tache.avancement}%`,
                background: tache.avancement === 100 ? "#00C875" : tache.avancement >= 60 ? "#635BFF" : "#FDAB3D" }} />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {(tache.comment_count ?? 0) > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-muted-fg">
              <MessageSquare className="w-3 h-3" /> {tache.comment_count}
            </span>
          )}
          {(tache.attach_count ?? 0) > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-muted-fg">
              <Paperclip className="w-3 h-3" /> {tache.attach_count}
            </span>
          )}
        </div>
        {member && (
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0 ${member.bg} ${member.text}`}
            title={member.name}
          >
            {member.initials}
          </div>
        )}
      </div>
    </div>
  )
}

// ── DroppableColumn ───────────────────────────────────────────────────────────
function DroppableColumn({
  col, tasks, members, onAdd, onDelete, onTaskClick,
}: {
  col:     typeof COLONNES[0]
  tasks:   KTask[]
  members: Record<string, MemberInfo>
  onAdd:   () => void
  onDelete:(id: string) => void
  onTaskClick: (t: KTask) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id })

  return (
    <div className={`flex flex-col rounded-2xl border transition-all duration-200 overflow-hidden
      ${isOver ? "border-primary/40 shadow-card ring-2 ring-primary/20" : "border-border bg-muted/30"}`}>
      <div className="px-4 py-3 bg-white border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${col.dot}`} />
          <span className={`font-bold text-sm ${col.accent}`}>{col.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-black px-2 py-0.5 rounded-full ${col.dotBg} ${col.accent}`}>
            {tasks.length}
          </span>
          <button
            onClick={onAdd}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-muted transition-colors text-muted-fg hover:text-primary"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div ref={setNodeRef} className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-[160px]">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(t => (
            <SortableCard key={t.id} tache={t} members={members} onDelete={onDelete} onClick={onTaskClick} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <button
            onClick={onAdd}
            className="w-full flex flex-col items-center justify-center py-10 rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-all group"
          >
            <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center mb-2 group-hover:bg-primary/10">
              <Plus className="w-5 h-5 text-muted-fg group-hover:text-primary" />
            </div>
            <p className="text-xs text-muted-fg group-hover:text-primary">Ajouter une tâche</p>
          </button>
        )}
      </div>
    </div>
  )
}

// ── TaskDetailModal ───────────────────────────────────────────────────────────
function TaskDetailModal({
  tache, members, onClose, onUpdate, onDelete,
}: {
  tache:   KTask
  members: Record<string, MemberInfo>
  onClose: () => void
  onUpdate:(t: KTask) => void
  onDelete:(id: string) => void
}) {
  const [t, setT] = useState(tache)
  const prio   = PRIO_CONFIG[t.priorite]
  const member = t.responsable ? (members[t.responsable] ?? null) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) { onUpdate(t); onClose() } }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-border flex flex-col max-h-[90vh]">
        <div className="flex items-start justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded-full border flex-shrink-0 ${prio.bg} ${prio.text} ${prio.border}`}>
              {prio.label}
            </span>
            <input
              value={t.titre}
              onChange={e => setT(prev => ({ ...prev, titre: e.target.value }))}
              className="text-base font-bold text-foreground flex-1 outline-none bg-transparent border-b border-transparent focus:border-primary/30 pb-0.5 transition-colors"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
            <button onClick={() => { onDelete(t.id); onClose() }}
              className="p-1.5 rounded-lg hover:bg-danger/10 text-muted-fg hover:text-danger transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={() => { onUpdate(t); onClose() }}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-fg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-3 divide-x divide-border">
            <div className="col-span-2 px-6 py-5 space-y-5">
              <div>
                <label className="text-xs font-semibold text-muted-fg uppercase tracking-wider block mb-1.5">Description</label>
                <textarea
                  rows={3}
                  value={t.description ?? ""}
                  onChange={e => setT(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Ajouter une description..."
                  className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 resize-none transition-all text-foreground placeholder:text-muted-fg"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-muted-fg uppercase tracking-wider">Avancement</label>
                  <span className={`text-sm font-black ${t.avancement === 100 ? "text-success" : "text-primary"}`}>{t.avancement}%</span>
                </div>
                <input
                  type="range" min="0" max="100" value={t.avancement}
                  onChange={e => setT(prev => ({ ...prev, avancement: +e.target.value }))}
                  className="w-full accent-primary"
                />
                <div className="h-2 bg-muted rounded-full overflow-hidden mt-1">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width:`${t.avancement}%`,
                      background: t.avancement === 100 ? "#00C875" : t.avancement >= 60 ? "#635BFF" : "#FDAB3D" }} />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-fg uppercase tracking-wider block mb-2">Tags</label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_TAGS.map(tag => {
                    const active = (t.tags ?? []).includes(tag)
                    return (
                      <button key={tag}
                        onClick={() => setT(prev => ({
                          ...prev,
                          tags: active
                            ? (prev.tags ?? []).filter(x => x !== tag)
                            : [...(prev.tags ?? []), tag],
                        }))}
                        className={`text-[10px] font-bold px-2 py-1 rounded-full border transition-all
                          ${active ? TAG_COLORS[tag] + " border-current/20" : "bg-muted text-muted-fg border-border hover:border-primary/30"}`}
                      >
                        {tag}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="px-4 py-5 space-y-4 bg-muted/20">
              <div>
                <label className="text-[10px] font-semibold text-muted-fg uppercase tracking-wider block mb-1.5">Colonne</label>
                <select
                  value={t.statut}
                  onChange={e => setT(prev => ({ ...prev, statut: e.target.value as StatutTache }))}
                  className="w-full text-xs border border-border rounded-lg px-2 py-1.5 outline-none focus:border-primary bg-white"
                >
                  {COLONNES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-fg uppercase tracking-wider block mb-1.5">Priorité</label>
                <select
                  value={t.priorite}
                  onChange={e => setT(prev => ({ ...prev, priorite: e.target.value as KTask["priorite"] }))}
                  className="w-full text-xs border border-border rounded-lg px-2 py-1.5 outline-none focus:border-primary bg-white"
                >
                  {Object.entries(PRIO_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-fg uppercase tracking-wider block mb-1.5">Échéance</label>
                <input
                  type="date" value={t.date_echeance ?? ""}
                  onChange={e => setT(prev => ({ ...prev, date_echeance: e.target.value }))}
                  className="w-full text-xs border border-border rounded-lg px-2 py-1.5 outline-none focus:border-primary bg-white"
                />
              </div>
              {member && (
                <div className={`flex items-center gap-2 p-2 rounded-lg ${member.bg}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black ${member.bg} ${member.text}`}>
                    {member.initials}
                  </div>
                  <span className={`text-xs font-semibold ${member.text}`}>{member.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-muted/20 rounded-b-2xl flex-shrink-0">
          <button onClick={() => { onUpdate(t); onClose() }}
            className="px-4 py-2 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors">
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  )
}

// ── CreateModal ──────────────────────────────────────────────────────────────
function CreateModal({
  defaultStatut, members, onClose, onSubmit,
}: {
  defaultStatut: StatutTache
  members:       Record<string, MemberInfo>
  onClose: () => void
  onSubmit:(f: typeof FORM_INIT, statut: StatutTache) => void
}) {
  const [form, setForm]   = useState({ ...FORM_INIT })
  const [statut, setStatut] = useState(defaultStatut)
  const [error, setError]  = useState("")

  function submit() {
    if (!form.titre.trim()) { setError("Titre requis"); return }
    onSubmit(form, statut)
    onClose()
  }

  const memberEntries = Object.entries(members)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-border">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-bold text-foreground">Nouvelle tâche</h2>
            <p className="text-xs text-muted-fg mt-0.5">Colonne : <span className="font-semibold">{COLONNES.find(c => c.id === statut)?.label}</span></p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-fg"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">Titre <span className="text-danger">*</span></label>
            <input
              value={form.titre}
              onChange={e => { setForm(f => ({ ...f, titre: e.target.value })); setError("") }}
              placeholder="Ex: Ferraillage poteaux Zone D"
              className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all ${error ? "border-danger" : "border-border focus:border-primary"}`}
            />
            {error && <p className="text-xs text-danger mt-1">{error}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">Priorité</label>
              <select value={form.priorite} onChange={e => setForm(f => ({ ...f, priorite: e.target.value as KTask["priorite"] }))}
                className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary bg-white">
                {Object.entries(PRIO_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">Responsable</label>
              <select value={form.responsable} onChange={e => setForm(f => ({ ...f, responsable: e.target.value }))}
                className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary bg-white">
                <option value="">— Non assigné —</option>
                {memberEntries.length === 0 && (
                  <option disabled value="">Aucun membre dans ce projet</option>
                )}
                {memberEntries.map(([id, m]) => (
                  <option key={id} value={id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">Échéance</label>
              <input type="date" value={form.date_echeance} onChange={e => setForm(f => ({ ...f, date_echeance: e.target.value }))}
                className="w-full border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary bg-white" />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">Avancement : {form.avancement}%</label>
              <input type="range" min="0" max="100" value={form.avancement}
                onChange={e => setForm(f => ({ ...f, avancement: +e.target.value }))} className="w-full mt-2.5 accent-primary" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">Colonne cible</label>
            <div className="flex gap-2 flex-wrap">
              {COLONNES.map(c => (
                <button key={c.id} onClick={() => setStatut(c.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition-colors ${statut === c.id ? "bg-primary text-white border-primary" : "border-border text-muted-fg hover:border-primary/50"}`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 px-6 py-4 border-t border-border bg-muted/20 rounded-b-2xl justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-xl bg-white hover:bg-muted transition-colors">Annuler</button>
          <button onClick={submit} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors">
            <Plus className="w-4 h-4" /> Créer la tâche
          </button>
        </div>
      </div>
    </div>
  )
}

// ── KanbanBoard ──────────────────────────────────────────────────────────────
export const KanbanBoard = forwardRef<
  { openModal: () => void },
  { search?: string; filterPrio?: string; filterMember?: string; projectId?: string }
>(function KanbanBoard({ search = "", filterPrio = "", filterMember = "", projectId }, ref) {
  useImperativeHandle(ref, () => ({ openModal: () => openCreate("A_FAIRE") }))

  const { data: apiData } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn:  () => fetch(`/api/tasks?projectId=${projectId}`).then(r => r.json()),
    enabled:  !!projectId,
  })

  // Fetch real project members for the responsable selector
  const { data: projectMembers = [] } = useQuery<{ id: string; name: string; initials: string; color: string }[]>({
    queryKey: ["project-members", projectId],
    queryFn:  () => fetch(`/api/projects/${projectId}/members`).then(r => r.json()),
    enabled:  !!projectId,
    staleTime: 5 * 60 * 1000,
  })

  // Build members dict: real project members first, then fallback to task assignees
  const members = useMemo<Record<string, MemberInfo>>(() => {
    if (projectMembers.length > 0) {
      const dict: Record<string, MemberInfo> = {}
      for (const m of projectMembers) {
        const cls = COLOR_CLASSES[m.color] ?? { bg: "bg-muted", text: "text-muted-fg" }
        dict[m.id] = { name: m.name, initials: m.initials, color: m.color, bg: cls.bg, text: cls.text }
      }
      return dict
    }
    // fallback: members derived from task assignees in API response
    if (apiData?.members) {
      const dynamic: Record<string, MemberInfo> = {}
      for (const [id, m] of Object.entries(apiData.members as Record<string, { name: string; initials: string; color: string }>)) {
        const cls = COLOR_CLASSES[m.color] ?? { bg: "bg-muted", text: "text-muted-fg" }
        dynamic[id] = { name: m.name, initials: m.initials, color: m.color, bg: cls.bg, text: cls.text }
      }
      if (Object.keys(dynamic).length > 0) return dynamic
    }
    return {}
  }, [projectMembers, apiData?.members])

  const [taches, setTaches]         = useState<KTask[]>([])
  const [activeTask, setActiveTask] = useState<KTask | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showDetail, setShowDetail] = useState<KTask | null>(null)
  const [createStatut, setCreateStatut] = useState<StatutTache>("A_FAIRE")
  const [counter, setCounter]       = useState(100)

  // Sync tasks from API
  useEffect(() => {
    if (apiData?.tasks) setTaches(apiData.tasks)
  }, [apiData?.tasks])

  // Track status change during drag for API persistence
  const dragStatusRef = useRef<{ id: string; newStatus: StatutTache } | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  )

  function openCreate(statut: StatutTache) {
    setCreateStatut(statut)
    setShowCreate(true)
  }

  function findColumnOfTask(id: string): StatutTache | null {
    return taches.find(t => t.id === id)?.statut ?? null
  }

  function handleDragStart({ active }: DragStartEvent) {
    setActiveTask(taches.find(t => t.id === active.id) ?? null)
    dragStatusRef.current = null
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) return
    const activeId = String(active.id)
    const overId   = String(over.id)
    if (activeId === overId) return

    const activeCol = findColumnOfTask(activeId)
    const isOverCol = COLONNES.some(c => c.id === overId)
    const overCol   = isOverCol ? (overId as StatutTache) : findColumnOfTask(overId)

    if (overCol && activeCol !== overCol) {
      setTaches(prev => prev.map(t => t.id === activeId ? { ...t, statut: overCol } : t))
      dragStatusRef.current = { id: activeId, newStatus: overCol }
    }
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveTask(null)
    if (!over) return
    const activeId = String(active.id)
    const overId   = String(over.id)
    const isOverCol = COLONNES.some(c => c.id === overId)

    if (!isOverCol) {
      const col = findColumnOfTask(activeId)
      if (!col) return
      setTaches(prev => {
        const colTasks = prev.filter(t => t.statut === col)
        const rest     = prev.filter(t => t.statut !== col)
        const oi = colTasks.findIndex(t => t.id === activeId)
        const ni = colTasks.findIndex(t => t.id === overId)
        if (oi < 0 || ni < 0 || oi === ni) return prev
        return [...rest, ...arrayMove(colTasks, oi, ni)]
      })
    }

    // Persist status change
    if (projectId && dragStatusRef.current) {
      const { id, newStatus } = dragStatusRef.current
      patchTask(id, { statut: newStatus })
    }
    dragStatusRef.current = null
  }

  async function handleCreate(form: typeof FORM_INIT, statut: StatutTache) {
    if (!projectId) {
      // Offline fallback
      const t: KTask = {
        id: `local-${counter}`, titre: form.titre.trim(), statut,
        priorite: form.priorite, responsable: form.responsable || null,
        avancement: form.avancement, projet_id: "local",
        date_echeance: form.date_echeance || undefined,
        description: form.description || undefined,
        tags: form.tags, created_at: new Date().toISOString(),
      }
      setTaches(prev => [t, ...prev])
      setCounter(c => c + 1)
      return
    }

    const res = await fetch("/api/tasks", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        titre:         form.titre.trim(),
        statut,
        priorite:      form.priorite,
        responsable:   form.responsable || null,
        avancement:    form.avancement,
        date_echeance: form.date_echeance || undefined,
        description:   form.description  || undefined,
        tags:          form.tags,
      }),
    })
    if (res.ok) {
      const task = await res.json()
      setTaches(prev => [task, ...prev])
    }
  }

  function handleUpdate(updated: KTask) {
    setTaches(prev => prev.map(t => t.id === updated.id ? updated : t))
    if (projectId) {
      patchTask(updated.id, {
        titre:         updated.titre,
        statut:        updated.statut,
        priorite:      updated.priorite,
        avancement:    updated.avancement,
        date_echeance: updated.date_echeance,
        description:   updated.description,
        tags:          updated.tags,
      })
    }
  }

  function handleDelete(id: string) {
    setTaches(prev => prev.filter(t => t.id !== id))
    if (projectId) deleteTask(id)
  }

  const filtered = taches.filter(t => {
    const matchSearch  = !search      || t.titre.toLowerCase().includes(search.toLowerCase())
    const matchPrio    = !filterPrio  || t.priorite === filterPrio
    const matchMember  = !filterMember || (
      (members[t.responsable ?? ""]?.name ?? "").toLowerCase().includes(filterMember.toLowerCase()) ||
      (members[t.responsable ?? ""]?.initials ?? "").toLowerCase().includes(filterMember.toLowerCase())
    )
    return matchSearch && matchPrio && matchMember
  })

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-4 gap-4 h-full">
          {COLONNES.map(col => (
            <DroppableColumn
              key={col.id}
              col={col}
              tasks={filtered.filter(t => t.statut === col.id)}
              members={members}
              onAdd={() => openCreate(col.id)}
              onDelete={handleDelete}
              onTaskClick={t => setShowDetail(t)}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask && (
            <div className="bg-white border border-primary rounded-2xl p-4 shadow-card-lg opacity-95 rotate-1 cursor-grabbing w-[260px]">
              <p className="text-sm font-semibold text-foreground">{activeTask.titre}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {showCreate && (
        <CreateModal
          defaultStatut={createStatut}
          members={members}
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
        />
      )}

      {showDetail && (
        <TaskDetailModal
          tache={showDetail}
          members={members}
          onClose={() => setShowDetail(null)}
          onUpdate={handleUpdate}
          onDelete={id => { handleDelete(id); setShowDetail(null) }}
        />
      )}
    </>
  )
})
