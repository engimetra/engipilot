import { useEffect, useState } from "react"
import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { getMe, type AuthUser } from "../lib/auth"

// Simple global auth state — no external lib needed
export let _authUser: AuthUser | null = null
export function setAuthUser(u: AuthUser | null) { _authUser = u }

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  )
}
