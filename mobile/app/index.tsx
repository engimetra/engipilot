import { Redirect } from "expo-router"
import { useEffect, useState } from "react"
import { View, ActivityIndicator } from "react-native"
import { getMe } from "../lib/auth"
import { COLORS } from "../lib/theme"

export default function Index() {
  const [loading, setLoading] = useState(true)
  const [authed, setAuthed]   = useState(false)

  useEffect(() => {
    getMe().then(user => {
      setAuthed(!!user)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <View style={{ flex:1, alignItems:"center", justifyContent:"center", backgroundColor: COLORS.bg }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    )
  }

  return authed ? <Redirect href="/(tabs)" /> : <Redirect href="/(auth)/login" />
}
