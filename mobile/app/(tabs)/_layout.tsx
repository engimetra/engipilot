import { Tabs } from "expo-router"
import { View, Text } from "react-native"
import { COLORS } from "../../lib/theme"

function TabIcon({ focused, color, label, emoji }: { focused: boolean; color: string; label: string; emoji: string }) {
  return (
    <View style={{ alignItems: "center", gap: 2 }}>
      <Text style={{ fontSize: focused ? 22 : 20 }}>{emoji}</Text>
      {focused && <Text style={{ fontSize: 9, fontWeight: "700", color }}>{label}</Text>}
    </View>
  )
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown:        false,
        tabBarActiveTintColor:   COLORS.primary,
        tabBarInactiveTintColor: COLORS.mutedFg,
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopColor:  COLORS.border,
          borderTopWidth:  1,
          height:          64,
          paddingBottom:   8,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} label="Dashboard" emoji="📊" />
          ),
        }}
      />
      <Tabs.Screen
        name="taches"
        options={{
          title: "Tâches",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} label="Tâches" emoji="✅" />
          ),
        }}
      />
      <Tabs.Screen
        name="incidents"
        options={{
          title: "HSE",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} label="HSE" emoji="⚠️" />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: "Profil",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} label="Profil" emoji="👤" />
          ),
        }}
      />
    </Tabs>
  )
}
