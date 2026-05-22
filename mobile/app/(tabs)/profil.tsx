import { useEffect, useState } from "react"
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert,
} from "react-native"
import { useRouter } from "expo-router"
import { getMe, logout, type AuthUser } from "../../lib/auth"
import { COLORS, RADIUS, SHADOW } from "../../lib/theme"

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN:  "Super Admin",
  ADMIN:        "Admin Entreprise",
  MANAGER:      "Chef de Projet",
  ENGINEER:     "Chef de Chantier",
  HSE:          "Responsable HSE",
  MEMBER:       "Membre",
  VIEWER:       "Consultant",
}

const ROLE_COLOR: Record<string, string> = {
  SUPER_ADMIN:  COLORS.danger,
  ADMIN:        COLORS.primary,
  MANAGER:      COLORS.teal,
  ENGINEER:     COLORS.success,
  HSE:          COLORS.warning,
  MEMBER:       COLORS.purple,
  VIEWER:       COLORS.mutedFg,
}

export default function ProfilScreen() {
  const router = useRouter()
  const [user, setUser]     = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMe().then(u => { setUser(u); setLoading(false) })
  }, [])

  async function handleLogout() {
    Alert.alert(
      "Déconnexion",
      "Voulez-vous vous déconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Déconnecter",
          style: "destructive",
          onPress: async () => {
            await logout()
            router.replace("/(auth)/login")
          },
        },
      ]
    )
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    )
  }

  const initiales = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "??"
  const roleColor = ROLE_COLOR[user?.role ?? ""] ?? COLORS.primary

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>

      {/* Avatar + Info */}
      <View style={styles.profileCard}>
        <View style={[styles.avatar, { backgroundColor: roleColor + "20" }]}>
          <Text style={[styles.avatarText, { color: roleColor }]}>{initiales}</Text>
        </View>
        <Text style={styles.fullName}>{user?.firstName} {user?.lastName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={[styles.roleBadge, { backgroundColor: roleColor + "18" }]}>
          <Text style={[styles.roleText, { color: roleColor }]}>
            {ROLE_LABEL[user?.role ?? ""] ?? user?.role ?? "—"}
          </Text>
        </View>
        {user?.company && (
          <Text style={styles.company}>🏢 {user.company}</Text>
        )}
      </View>

      {/* App info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Application</Text>
        {[
          { label: "Version",    value: "1.0.0" },
          { label: "Plateforme", value: "iOS / Android" },
          { label: "Backend",    value: "Next.js 15 + Prisma 7" },
          { label: "Entreprise", value: user?.company ?? "—" },
        ].map(r => (
          <View key={r.label} style={styles.infoRow}>
            <Text style={styles.infoLabel}>{r.label}</Text>
            <Text style={styles.infoValue}>{r.value}</Text>
          </View>
        ))}
      </View>

      {/* Links */}
      <View style={styles.linksCard}>
        {[
          { label: "📊 Tableau de bord web",  sub: "Ouvrir dans le navigateur" },
          { label: "📩 Support",               sub: "support@engipilot.ma" },
          { label: "📄 Politique confidentialité", sub: "Voir le document" },
        ].map(l => (
          <TouchableOpacity key={l.label} style={styles.linkRow} activeOpacity={0.7}>
            <View style={{ flex: 1 }}>
              <Text style={styles.linkLabel}>{l.label}</Text>
              <Text style={styles.linkSub}>{l.sub}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} activeOpacity={0.85}>
        <Text style={styles.logoutText}>🚪 Se déconnecter</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>EngiPilot · SaaS BTP © 2025</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 16, paddingTop: 60, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.bg },

  profileCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: 24, alignItems: "center", marginBottom: 16,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOW.card,
  },
  avatar:     { width: 72, height: 72, borderRadius: RADIUS.full, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  avatarText: { fontSize: 26, fontWeight: "900" },
  fullName:   { fontSize: 20, fontWeight: "900", color: COLORS.fg },
  email:      { fontSize: 13, color: COLORS.mutedFg, marginTop: 4 },
  roleBadge:  { marginTop: 10, paddingHorizontal: 14, paddingVertical: 5, borderRadius: RADIUS.full },
  roleText:   { fontSize: 12, fontWeight: "800" },
  company:    { fontSize: 12, color: COLORS.mutedFg, marginTop: 8, fontWeight: "600" },

  infoCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOW.card,
  },
  infoTitle: { fontSize: 12, fontWeight: "800", color: COLORS.mutedFg, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 },
  infoRow:   { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.muted },
  infoLabel: { fontSize: 13, color: COLORS.mutedFg, fontWeight: "600" },
  infoValue: { fontSize: 13, color: COLORS.fg, fontWeight: "700" },

  linksCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    marginBottom: 20, borderWidth: 1, borderColor: COLORS.border, ...SHADOW.card, overflow: "hidden",
  },
  linkRow:   { flexDirection: "row", alignItems: "center", padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.muted },
  linkLabel: { fontSize: 13, fontWeight: "700", color: COLORS.fg },
  linkSub:   { fontSize: 11, color: COLORS.mutedFg, marginTop: 2 },
  arrow:     { fontSize: 20, color: COLORS.mutedFg, fontWeight: "300" },

  logoutBtn: {
    backgroundColor: COLORS.danger + "12", borderWidth: 1, borderColor: COLORS.danger + "30",
    borderRadius: RADIUS.md, paddingVertical: 14, alignItems: "center",
  },
  logoutText: { color: COLORS.danger, fontSize: 15, fontWeight: "800" },
  footer:     { textAlign: "center", fontSize: 11, color: COLORS.mutedFg, marginTop: 24 },
})
