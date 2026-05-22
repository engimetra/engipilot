import { useState } from "react"
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView, Alert,
} from "react-native"
import { useRouter } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { login } from "../../lib/auth"
import { COLORS, RADIUS, SHADOW } from "../../lib/theme"

const DEMO_ACCOUNTS = [
  { label: "Admin",        email: "admin@engipilot.ma",    password: "Engipilot2024!",  color: COLORS.primary },
  { label: "Chef Projet",  email: "manager@engipilot.ma",  password: "Manager2024!",    color: COLORS.teal    },
  { label: "Chef Chantier",email: "engineer@engipilot.ma", password: "Engineer2024!",   color: COLORS.success },
  { label: "HSE",          email: "hse@engipilot.ma",      password: "Hse2024!",        color: COLORS.warning },
]

export default function LoginScreen() {
  const router = useRouter()
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState("")
  const [showPass, setShowPass] = useState(false)

  async function handleLogin(em?: string, pw?: string) {
    const e = em ?? email.trim()
    const p = pw ?? password
    if (!e || !p) { setError("Email et mot de passe requis"); return }
    setLoading(true); setError("")
    try {
      await login(e, p)
      router.replace("/(tabs)")
    } catch (err: any) {
      setError(err.message === "SESSION_EXPIRED" ? "Session expirée" : "Identifiants incorrects")
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            <Text style={styles.logoText}>EP</Text>
          </View>
          <Text style={styles.title}>EngiPilot</Text>
          <Text style={styles.subtitle}>Plateforme BTP Intelligente</Text>
        </View>

        {/* Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Connexion</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={t => { setEmail(t); setError("") }}
              placeholder="votre@email.ma"
              placeholderTextColor={COLORS.mutedFg}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Mot de passe</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={password}
                onChangeText={t => { setPassword(t); setError("") }}
                placeholder="••••••••"
                placeholderTextColor={COLORS.mutedFg}
                secureTextEntry={!showPass}
                autoComplete="password"
              />
              <TouchableOpacity onPress={() => setShowPass(v => !v)} style={styles.eyeBtn}>
                <Text style={styles.eyeText}>{showPass ? "Masquer" : "Voir"}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={() => handleLogin()}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.loginBtnText}>Se connecter</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Demo accounts */}
        <View style={styles.demoSection}>
          <Text style={styles.demoTitle}>Comptes de démonstration</Text>
          <View style={styles.demoGrid}>
            {DEMO_ACCOUNTS.map(a => (
              <TouchableOpacity
                key={a.email}
                style={[styles.demoChip, { borderColor: a.color + "40" }]}
                onPress={() => handleLogin(a.email, a.password)}
                activeOpacity={0.8}
              >
                <View style={[styles.demoAvatar, { backgroundColor: a.color + "20" }]}>
                  <Text style={[styles.demoAvatarText, { color: a.color }]}>
                    {a.label[0]}
                  </Text>
                </View>
                <Text style={styles.demoLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={styles.footer}>EngiPilot v1.0 · SaaS BTP Maroc</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: COLORS.primary },
  scroll:  { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },

  header: { alignItems: "center", paddingTop: 80, paddingBottom: 32 },
  logoWrap: {
    width: 64, height: 64, borderRadius: RADIUS.xl,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  logoText:   { fontSize: 26, fontWeight: "900", color: "#fff" },
  title:      { fontSize: 28, fontWeight: "900", color: "#fff", letterSpacing: -0.5 },
  subtitle:   { fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 4 },

  card: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: 24, ...SHADOW.md,
  },
  cardTitle: { fontSize: 18, fontWeight: "800", color: COLORS.fg, marginBottom: 20 },

  errorBox: {
    backgroundColor: COLORS.danger + "12", borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.danger + "30",
    padding: 12, marginBottom: 16,
  },
  errorText: { fontSize: 13, color: COLORS.danger, fontWeight: "600" },

  field:     { marginBottom: 16 },
  label:     { fontSize: 12, fontWeight: "700", color: COLORS.fgLight, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: COLORS.fg, backgroundColor: COLORS.bg,
  },
  inputRow:  { flexDirection: "row", alignItems: "center", gap: 8 },
  eyeBtn:    { paddingHorizontal: 8 },
  eyeText:   { fontSize: 12, color: COLORS.primary, fontWeight: "600" },

  loginBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    paddingVertical: 14, alignItems: "center", marginTop: 8,
  },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnText:     { color: "#fff", fontSize: 15, fontWeight: "800" },

  demoSection: { marginTop: 28 },
  demoTitle:   { fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.6)", textAlign: "center", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 },
  demoGrid:    { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  demoChip: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1, borderRadius: RADIUS.full,
    paddingVertical: 8, paddingHorizontal: 14,
  },
  demoAvatar: { width: 26, height: 26, borderRadius: RADIUS.full, alignItems: "center", justifyContent: "center" },
  demoAvatarText: { fontSize: 11, fontWeight: "900" },
  demoLabel: { fontSize: 12, fontWeight: "700", color: "#fff" },

  footer: { textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 32 },
})
