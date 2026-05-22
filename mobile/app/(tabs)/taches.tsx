import { useEffect, useState } from "react"
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, TouchableOpacity, RefreshControl,
  TextInput,
} from "react-native"
import { apiFetch } from "../../lib/api"
import { COLORS, RADIUS, SHADOW } from "../../lib/theme"

interface Project { id: string; name: string }
interface Task {
  id:            string
  titre:         string
  statut:        string
  priorite:      string
  avancement:    number
  date_echeance?: string
  responsable?:  string
  projet_id:     string
  tags?:         string[]
}

const STATUT_LABEL: Record<string, string> = {
  A_FAIRE:          "À faire",
  EN_COURS:         "En cours",
  CONTROLE_QUALITE: "En révision",
  TERMINE:          "Terminé",
}
const STATUT_COLOR: Record<string, string> = {
  A_FAIRE:          COLORS.mutedFg,
  EN_COURS:         COLORS.primary,
  CONTROLE_QUALITE: COLORS.purple,
  TERMINE:          COLORS.success,
}
const PRIO_COLOR: Record<string, string> = {
  CRITIQUE: COLORS.danger,
  HAUTE:    COLORS.warning,
  NORMALE:  COLORS.primary,
  BASSE:    COLORS.mutedFg,
}

function TaskCard({ task, onStatusUpdate }: { task: Task; onStatusUpdate: (id: string, statut: string) => void }) {
  const sColor = STATUT_COLOR[task.statut] ?? COLORS.mutedFg
  const pColor = PRIO_COLOR[task.priorite] ?? COLORS.mutedFg
  const overdue = task.date_echeance && new Date(task.date_echeance) < new Date() && task.statut !== "TERMINE"

  const NEXT_STATUS: Record<string, string> = {
    A_FAIRE: "EN_COURS",
    EN_COURS: "CONTROLE_QUALITE",
    CONTROLE_QUALITE: "TERMINE",
    TERMINE: "TERMINE",
  }

  return (
    <View style={[styles.taskCard, SHADOW.card]}>
      <View style={styles.taskTop}>
        <View style={[styles.prioBadge, { backgroundColor: pColor + "18" }]}>
          <Text style={[styles.prioBadgeText, { color: pColor }]}>{task.priorite}</Text>
        </View>
        {task.statut !== "TERMINE" && (
          <TouchableOpacity
            onPress={() => onStatusUpdate(task.id, NEXT_STATUS[task.statut] ?? task.statut)}
            style={[styles.advanceBtn, { backgroundColor: sColor + "15" }]}
          >
            <Text style={[styles.advanceBtnText, { color: sColor }]}>
              {task.statut === "CONTROLE_QUALITE" ? "✅ Terminer" : "▶ Avancer"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.taskTitle}>{task.titre}</Text>

      {task.tags && task.tags.length > 0 && (
        <View style={styles.tagRow}>
          {task.tags.slice(0, 3).map(t => (
            <View key={t} style={styles.tag}>
              <Text style={styles.tagText}>{t}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.taskBottom}>
        <View style={[styles.statutBadge, { backgroundColor: sColor + "15" }]}>
          <Text style={[styles.statutText, { color: sColor }]}>
            {STATUT_LABEL[task.statut] ?? task.statut}
          </Text>
        </View>

        {overdue && (
          <Text style={styles.overdueText}>⚠ {task.date_echeance}</Text>
        )}

        <View style={styles.progressWrap}>
          <Text style={styles.progressText}>{task.avancement}%</Text>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, {
              width: `${task.avancement}%` as any,
              backgroundColor: task.avancement === 100 ? COLORS.success : COLORS.primary,
            }]} />
          </View>
        </View>
      </View>
    </View>
  )
}

export default function TachesScreen() {
  const [projects, setProjects] = useState<Project[]>([])
  const [projectId, setProjectId] = useState("")
  const [tasks, setTasks]     = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefresh] = useState(false)
  const [search, setSearch]   = useState("")
  const [filter, setFilter]   = useState<string>("")

  async function loadProjects() {
    try {
      const data = await apiFetch<Project[]>("/api/projects")
      setProjects(data)
      if (data.length > 0) setProjectId(data[0].id)
    } catch (e) {
      console.error(e)
    }
  }

  async function loadTasks(pid: string, refresh = false) {
    if (!pid) return
    if (refresh) setRefresh(true); else setLoading(true)
    try {
      const data = await apiFetch<{ tasks: Task[] }>(`/api/tasks?projectId=${pid}`)
      setTasks(data.tasks)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false); setRefresh(false)
    }
  }

  useEffect(() => { loadProjects() }, [])
  useEffect(() => { if (projectId) loadTasks(projectId) }, [projectId])

  async function handleStatusUpdate(id: string, statut: string) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, statut } : t))
    try {
      await apiFetch(`/api/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ statut }),
      })
    } catch (e) {
      console.error(e)
    }
  }

  const filtered = tasks.filter(t => {
    const matchSearch = !search || t.titre.toLowerCase().includes(search.toLowerCase())
    const matchFilter = !filter || t.statut === filter
    return matchSearch && matchFilter
  })

  const FILTERS = [
    { key:"", label:"Toutes" },
    { key:"A_FAIRE",          label:"À faire" },
    { key:"EN_COURS",         label:"En cours" },
    { key:"CONTROLE_QUALITE", label:"Révision" },
    { key:"TERMINE",          label:"Terminé" },
  ]

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Tâches</Text>
        <Text style={styles.subtitle}>{tasks.length} tâche{tasks.length !== 1 ? "s" : ""}</Text>
      </View>

      {/* Project selector */}
      {projects.length > 1 && (
        <View style={styles.projRow}>
          {projects.map(p => (
            <TouchableOpacity
              key={p.id}
              onPress={() => setProjectId(p.id)}
              style={[styles.projChip, projectId === p.id && styles.projChipActive]}
            >
              <Text style={[styles.projChipText, projectId === p.id && { color: "#fff" }]} numberOfLines={1}>
                {p.name.length > 14 ? p.name.slice(0, 14) + "…" : p.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher…"
          placeholderTextColor={COLORS.mutedFg}
        />
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, filter === f.key && { color: "#fff" }]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={t => t.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadTasks(projectId, true)} colors={[COLORS.primary]} />}
          renderItem={({ item }) => (
            <TaskCard task={item} onStatusUpdate={handleStatusUpdate} />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>✅</Text>
              <Text style={styles.emptyTitle}>Aucune tâche</Text>
              <Text style={styles.emptySub}>Tout est à jour dans cette vue</Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12 },
  title:  { fontSize: 24, fontWeight: "900", color: COLORS.fg, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: COLORS.mutedFg, fontWeight: "600", marginTop: 2 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },

  projRow:   { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 10, flexWrap: "wrap" },
  projChip:  { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white },
  projChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  projChipText:   { fontSize: 11, fontWeight: "700", color: COLORS.fg },

  searchRow:   { paddingHorizontal: 16, marginBottom: 10 },
  searchInput: {
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 13, color: COLORS.fg,
  },

  filterRow:       { flexDirection: "row", paddingHorizontal: 16, gap: 6, marginBottom: 12, flexWrap: "wrap" },
  filterChip:      { paddingHorizontal: 12, paddingVertical: 5, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white },
  filterChipActive:{ backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText:      { fontSize: 11, fontWeight: "700", color: COLORS.fg },

  list: { paddingHorizontal: 16, paddingBottom: 32 },

  taskCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 10,
  },
  taskTop:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  prioBadge:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  prioBadgeText: { fontSize: 9, fontWeight: "900" },
  advanceBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  advanceBtnText: { fontSize: 10, fontWeight: "700" },

  taskTitle: { fontSize: 14, fontWeight: "700", color: COLORS.fg, lineHeight: 20, marginBottom: 8 },

  tagRow: { flexDirection: "row", gap: 5, flexWrap: "wrap", marginBottom: 8 },
  tag:    { paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.full, backgroundColor: COLORS.muted },
  tagText:{ fontSize: 9, fontWeight: "700", color: COLORS.mutedFg },

  taskBottom:  { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  statutBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  statutText:  { fontSize: 9, fontWeight: "800" },
  overdueText: { fontSize: 10, color: COLORS.danger, fontWeight: "600" },

  progressWrap: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6, minWidth: 80 },
  progressText: { fontSize: 10, fontWeight: "700", color: COLORS.fg, width: 28 },
  progressBg:   { flex: 1, height: 4, backgroundColor: COLORS.muted, borderRadius: RADIUS.full, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: RADIUS.full },

  empty:     { alignItems: "center", paddingTop: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle:{ fontSize: 16, fontWeight: "800", color: COLORS.fg },
  emptySub:  { fontSize: 12, color: COLORS.mutedFg, marginTop: 4 },
})
