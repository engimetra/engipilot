import { useState } from "react"
import {
  View, Text, ScrollView, StyleSheet,
  TextInput, TouchableOpacity, Alert,
} from "react-native"
import { COLORS, RADIUS, SHADOW } from "../../lib/theme"

const SEVERITY_OPTIONS = ["NEGLIGIBLE", "LOW", "MEDIUM", "HIGH", "CRITICAL"]
const TYPE_OPTIONS     = ["ACCIDENT", "NEAR_MISS", "NON_CONFORMITY", "OBSERVATION", "HSE_RISK", "PROPERTY_DAMAGE"]

const TYPE_LABEL: Record<string, string>     = {
  ACCIDENT:"Accident", NEAR_MISS:"Presqu'accident",
  NON_CONFORMITY:"Non-conformité", OBSERVATION:"Observation",
  HSE_RISK:"Risque HSE", PROPERTY_DAMAGE:"Dommage matériel",
}
const SEV_COLOR: Record<string, string> = {
  NEGLIGIBLE: COLORS.mutedFg,
  LOW:        COLORS.success,
  MEDIUM:     COLORS.warning,
  HIGH:       "#f97316",
  CRITICAL:   COLORS.danger,
}

export default function IncidentsScreen() {
  const [title, setTitle]         = useState("")
  const [description, setDesc]    = useState("")
  const [type, setType]           = useState("OBSERVATION")
  const [severity, setSeverity]   = useState("MEDIUM")
  const [location, setLocation]   = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)

  function reset() {
    setTitle(""); setDesc(""); setType("OBSERVATION")
    setSeverity("MEDIUM"); setLocation(""); setSubmitted(false)
  }

  async function handleSubmit() {
    if (!title.trim() || !description.trim()) {
      Alert.alert("Champs requis", "Titre et description sont obligatoires.")
      return
    }
    setSubmitting(true)
    try {
      // POST to backend when incidents API is available
      // await apiFetch("/api/incidents", { method: "POST", body: JSON.stringify({ title, description, type, severity, location }) })
      await new Promise(r => setTimeout(r, 800)) // simulate API
      setSubmitted(true)
    } catch (e: any) {
      Alert.alert("Erreur", e.message ?? "Impossible de soumettre le rapport")
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <View style={styles.successWrap}>
        <Text style={styles.successIcon}>✅</Text>
        <Text style={styles.successTitle}>Rapport soumis</Text>
        <Text style={styles.successSub}>Votre rapport HSE a été enregistré et transmis au responsable.</Text>
        <TouchableOpacity onPress={reset} style={styles.newBtn}>
          <Text style={styles.newBtnText}>Nouveau rapport</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Rapport HSE</Text>
        <Text style={styles.subtitle}>Déclarer un incident ou observation de sécurité</Text>
      </View>

      {/* Type */}
      <View style={styles.section}>
        <Text style={styles.label}>Type d'événement</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optRow}>
          {TYPE_OPTIONS.map(t => (
            <TouchableOpacity
              key={t}
              onPress={() => setType(t)}
              style={[styles.optChip, type === t && styles.optChipActive]}
            >
              <Text style={[styles.optChipText, type === t && { color: "#fff" }]}>
                {TYPE_LABEL[t] ?? t}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Severity */}
      <View style={styles.section}>
        <Text style={styles.label}>Sévérité</Text>
        <View style={styles.sevRow}>
          {SEVERITY_OPTIONS.map(s => {
            const color = SEV_COLOR[s] ?? COLORS.mutedFg
            return (
              <TouchableOpacity
                key={s}
                onPress={() => setSeverity(s)}
                style={[styles.sevChip, { borderColor: color + "60" }, severity === s && { backgroundColor: color, borderColor: color }]}
              >
                <Text style={[styles.sevText, { color: severity === s ? "#fff" : color }]}>{s}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      {/* Form fields */}
      <View style={styles.section}>
        <Text style={styles.label}>Titre <Text style={{ color: COLORS.danger }}>*</Text></Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Ex: Chute de matériaux Zone C"
          placeholderTextColor={COLORS.mutedFg}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Description <Text style={{ color: COLORS.danger }}>*</Text></Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDesc}
          placeholder="Décrivez l'incident, les circonstances, les personnes impliquées…"
          placeholderTextColor={COLORS.mutedFg}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Localisation</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="Ex: Zone D, Niveau R+3, Axe B-C"
          placeholderTextColor={COLORS.mutedFg}
        />
      </View>

      {/* Severity warning */}
      {(severity === "HIGH" || severity === "CRITICAL") && (
        <View style={[styles.warnBox, { borderColor: SEV_COLOR[severity] + "40" }]}>
          <Text style={[styles.warnText, { color: SEV_COLOR[severity] }]}>
            ⚠ Incident {severity === "CRITICAL" ? "critique" : "grave"} — le responsable HSE sera notifié immédiatement.
          </Text>
        </View>
      )}

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={submitting}
        style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
        activeOpacity={0.85}
      >
        <Text style={styles.submitText}>
          {submitting ? "Envoi en cours…" : "📤 Soumettre le rapport"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 16, paddingTop: 60, paddingBottom: 40 },

  header:   { marginBottom: 24 },
  title:    { fontSize: 24, fontWeight: "900", color: COLORS.fg, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: COLORS.mutedFg, fontWeight: "600", marginTop: 4 },

  section: { marginBottom: 20 },
  label:   { fontSize: 11, fontWeight: "700", color: COLORS.fgLight, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },

  optRow:    { gap: 8 },
  optChip:   { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white },
  optChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  optChipText:   { fontSize: 12, fontWeight: "700", color: COLORS.fg },

  sevRow:  { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  sevChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.full, borderWidth: 1.5, backgroundColor: "transparent" },
  sevText: { fontSize: 10, fontWeight: "800" },

  input: {
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: COLORS.fg,
  },
  textArea: { minHeight: 100 },

  warnBox: {
    borderWidth: 1, borderRadius: RADIUS.md,
    padding: 12, marginBottom: 16,
    backgroundColor: COLORS.danger + "08",
  },
  warnText: { fontSize: 12, fontWeight: "600", lineHeight: 18 },

  submitBtn: {
    backgroundColor: COLORS.danger, borderRadius: RADIUS.md,
    paddingVertical: 16, alignItems: "center",
    ...SHADOW.md,
  },
  submitText: { color: "#fff", fontSize: 15, fontWeight: "800" },

  successWrap:  { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, backgroundColor: COLORS.bg },
  successIcon:  { fontSize: 60, marginBottom: 16 },
  successTitle: { fontSize: 22, fontWeight: "900", color: COLORS.fg },
  successSub:   { fontSize: 13, color: COLORS.mutedFg, textAlign: "center", marginTop: 8, lineHeight: 20 },
  newBtn: {
    marginTop: 28, backgroundColor: COLORS.primary,
    paddingHorizontal: 28, paddingVertical: 14, borderRadius: RADIUS.md,
  },
  newBtnText: { color: "#fff", fontSize: 14, fontWeight: "800" },
})
