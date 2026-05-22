import { useEffect, useState, useCallback } from "react"
import {
  View, Text, ScrollView, RefreshControl,
  TouchableOpacity, StyleSheet, ActivityIndicator,
} from "react-native"
import { useRouter } from "expo-router"
import { apiFetch } from "../../lib/api"
import { COLORS, RADIUS, SHADOW } from "../../lib/theme"

interface DashboardData {
  kpis: {
    totalProjects:  number
    activeProjects: number
    avgProgress:    number
    avgSpi:         number | null
    criticalDelays: number
    incidentCount:  number
    notifCount:     number
    budgetPct:      number
  }
  portfolio: { onTrack: number; atRisk: number; critical: number; ahead: number }
  alerts: {
    id: string; level: string; message: string
    value?: string; confidence: number
    project: { name: string; city: string | null }
  }[]
}

const LEVEL_COLOR: Record<string, string> = {
  CRITICAL: COLORS.danger,
  HIGH:     "#f97316",
  MEDIUM:   COLORS.warning,
  LOW:      COLORS.success,
  INFO:     COLORS.primary,
}

function KpiCard({ label, value, color, bg, emoji }: { label:string; value:string; color:string; bg:string; emoji:string }) {
  return (
    <View style={[styles.kpiCard, SHADOW.card]}>
      <View style={[styles.kpiIcon, { backgroundColor: bg }]}>
        <Text style={{ fontSize: 16 }}>{emoji}</Text>
      </View>
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  )
}

export default function DashboardScreen() {
  const router    = useRouter()
  const [data, setData]   = useState<DashboardData | null>(null)
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefresh]  = useState(false)

  async function load(refresh = false) {
    if (refresh) setRefresh(true); else setLoading(true)
    try {
      const d = await apiFetch<DashboardData>("/api/dashboard")
      setData(d)
    } catch (e) {
      console.error("Dashboard load error", e)
    } finally {
      setLoading(false); setRefresh(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement du tableau de bord…</Text>
      </View>
    )
  }

  const k = data?.kpis
  const p = data?.portfolio

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[COLORS.primary]} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreet}>Bonjour 👋</Text>
          <Text style={styles.headerTitle}>Tableau de bord</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: COLORS.primary + "15" }]}>
          <Text style={[styles.badgeText, { color: COLORS.primary }]}>
            {k?.notifCount ?? 0} alertes
          </Text>
        </View>
      </View>

      {/* KPI Grid */}
      <View style={styles.kpiGrid}>
        <KpiCard label="Projets actifs"  value={String(k?.activeProjects ?? 0)} color={COLORS.primary}  bg={COLORS.primary+"15"}  emoji="🏗️" />
        <KpiCard label="Avancement moy." value={`${k?.avgProgress ?? 0}%`}      color={COLORS.success}  bg={COLORS.success+"15"}  emoji="📈" />
        <KpiCard label="Budget consommé" value={`${k?.budgetPct ?? 0}%`}         color={COLORS.warning}  bg={COLORS.warning+"15"}  emoji="💰" />
        <KpiCard label="Incidents"       value={String(k?.incidentCount ?? 0)}   color={COLORS.danger}   bg={COLORS.danger+"15"}   emoji="⚠️" />
      </View>

      {/* Portfolio Status */}
      {p && (
        <View style={[styles.card, SHADOW.card]}>
          <Text style={styles.cardTitle}>Portfolio projets</Text>
          <View style={styles.portRow}>
            {[
              { label:"En avance",   value: p.ahead,    color: COLORS.primary },
              { label:"Dans les délais", value: p.onTrack,  color: COLORS.success },
              { label:"À risque",    value: p.atRisk,   color: COLORS.warning },
              { label:"Critique",    value: p.critical, color: COLORS.danger  },
            ].map(s => (
              <View key={s.label} style={styles.portItem}>
                <Text style={[styles.portValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.portLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* AI Alerts */}
      {data?.alerts && data.alerts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alertes IA</Text>
          {data.alerts.slice(0, 4).map(a => {
            const color = LEVEL_COLOR[a.level] ?? COLORS.primary
            return (
              <View key={a.id} style={[styles.alertCard, { borderLeftColor: color }, SHADOW.card]}>
                <View style={styles.alertTop}>
                  <View style={[styles.alertBadge, { backgroundColor: color + "15" }]}>
                    <Text style={[styles.alertBadgeText, { color }]}>{a.level}</Text>
                  </View>
                  <Text style={styles.alertProject}>{a.project.city ?? ""} · {a.project.name}</Text>
                  <Text style={styles.alertConf}>{a.confidence}%</Text>
                </View>
                <Text style={styles.alertMsg}>{a.message}</Text>
                {a.value && <Text style={styles.alertVal}>Valeur: {a.value}</Text>}
              </View>
            )
          })}
        </View>
      )}

      {/* SPI Info */}
      {k?.avgSpi != null && (
        <View style={[styles.spiCard, SHADOW.card]}>
          <Text style={styles.spiLabel}>SPI Moyen Portfolio</Text>
          <Text style={[styles.spiValue, { color: k.avgSpi >= 0.85 ? COLORS.success : k.avgSpi >= 0.70 ? COLORS.warning : COLORS.danger }]}>
            {Number(k.avgSpi).toFixed(2)}
          </Text>
          <Text style={styles.spiSub}>
            {k.avgSpi >= 0.85 ? "✅ Dans les délais" : k.avgSpi >= 0.70 ? "⚠️ Léger retard" : "🔴 Retard critique"}
          </Text>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 16, paddingTop: 60, paddingBottom: 32 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.bg, gap: 12 },
  loadingText: { fontSize: 13, color: COLORS.mutedFg },

  header:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  headerGreet: { fontSize: 13, color: COLORS.mutedFg, fontWeight: "600" },
  headerTitle: { fontSize: 22, fontWeight: "900", color: COLORS.fg, letterSpacing: -0.5 },
  badge:       { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full },
  badgeText:   { fontSize: 11, fontWeight: "700" },

  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  kpiCard: {
    width: "47%", backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg, padding: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },
  kpiIcon:  { width: 36, height: 36, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  kpiValue: { fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  kpiLabel: { fontSize: 10, color: COLORS.mutedFg, fontWeight: "600", marginTop: 2, textTransform: "uppercase" },

  card:      { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
  cardTitle: { fontSize: 13, fontWeight: "800", color: COLORS.fg, marginBottom: 12 },

  portRow:   { flexDirection: "row", justifyContent: "space-between" },
  portItem:  { alignItems: "center", flex: 1 },
  portValue: { fontSize: 20, fontWeight: "900" },
  portLabel: { fontSize: 9, color: COLORS.mutedFg, marginTop: 2, textAlign: "center", fontWeight: "600" },

  section:     { marginBottom: 4 },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: COLORS.fg, marginBottom: 10 },

  alertCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    borderLeftWidth: 3, padding: 12, marginBottom: 8,
  },
  alertTop:       { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  alertBadge:     { paddingHorizontal: 7, paddingVertical: 2, borderRadius: RADIUS.full },
  alertBadgeText: { fontSize: 9, fontWeight: "900" },
  alertProject:   { flex: 1, fontSize: 10, color: COLORS.mutedFg, fontWeight: "600" },
  alertConf:      { fontSize: 10, color: COLORS.mutedFg },
  alertMsg:       { fontSize: 13, fontWeight: "600", color: COLORS.fg, lineHeight: 18 },
  alertVal:       { fontSize: 11, color: COLORS.mutedFg, marginTop: 4 },

  spiCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: 20, borderWidth: 1, borderColor: COLORS.border,
    alignItems: "center", marginTop: 4,
  },
  spiLabel: { fontSize: 11, fontWeight: "700", color: COLORS.mutedFg, textTransform: "uppercase", letterSpacing: 0.5 },
  spiValue: { fontSize: 40, fontWeight: "900", letterSpacing: -1, marginVertical: 4 },
  spiSub:   { fontSize: 12, color: COLORS.mutedFg, fontWeight: "600" },
})
