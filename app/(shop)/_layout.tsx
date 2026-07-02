/**
 * app/(shop)/_layout.tsx
 *
 * Tab navigator for the shop-owner dashboard. Tab `name` must match the
 * EXACT filename (without .tsx) inside this folder:
 *   DashboardScreen.tsx
 *   ProductsScreen.tsx
 *   ProductFormScreen.tsx   (hidden from the tab bar - opened via push)
 *   MessagesScreen.tsx
 *   ShopProfileScreen.tsx
 */

import { router, Tabs } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

const PRIMARY = "#008100";
const PRIMARY_DARK = "#1a3a1a";
const PRIMARY_SOFT = "#e8f5e9";

const TabIcon = ({
  emoji,
  focused,
  isDark,
}: {
  emoji: string;
  focused: boolean;
  isDark: boolean;
}) => (
  <View style={iconStyles.wrap}>
    <View
      style={[
        iconStyles.inner,
        focused && { backgroundColor: isDark ? PRIMARY_DARK : PRIMARY_SOFT },
      ]}
    >
      <Text style={{ fontSize: 20 }}>{emoji}</Text>
    </View>
    {focused && <View style={[iconStyles.dot, { backgroundColor: PRIMARY }]} />}
  </View>
);

const iconStyles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", width: 48, height: 36 },
  inner: { width: 46, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  dot: { position: "absolute", bottom: -4, width: 4, height: 4, borderRadius: 2 },
});

const AddFAB = ({ isDark }: { isDark: boolean }) => (
  <Pressable
    onPress={() => router.push("/(shop)/ProductFormScreen")}
    style={({ pressed }) => [fab.outer, pressed && { opacity: 0.85, transform: [{ scale: 0.94 }] }]}
  >
    <View style={fab.inner}>
      <Text style={fab.plus}>+</Text>
    </View>
    <Text style={[fab.label, { color: isDark ? "#475569" : "#94a3b8" }]}>Add</Text>
  </Pressable>
);

const fab = StyleSheet.create({
  outer: { alignItems: "center", justifyContent: "center", marginTop: -20 },
  inner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 14,
    shadowOpacity: 0.5,
    elevation: 12,
    borderWidth: 3,
    borderColor: "#fff",
  },
  plus: { color: "#fff", fontSize: 30, fontWeight: "300", lineHeight: 32, marginTop: -1 },
  label: { fontSize: 10, fontWeight: "700", marginTop: 4, letterSpacing: 0.2 },
});

export default function ShopTabsLayout() {
  const isDark = useColorScheme() === "dark";

  const tabBarStyle = {
    height: Platform.OS === "ios" ? 86 : 66,
    backgroundColor: isDark ? "#0f172a" : "#ffffff",
    borderTopWidth: 0,
    elevation: 24,
    shadowColor: isDark ? "#000" : PRIMARY,
    shadowOpacity: isDark ? 0.45 : 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -6 } as const,
    paddingBottom: Platform.OS === "ios" ? 20 : 8,
    paddingTop: 8,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    position: "absolute" as const,
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: PRIMARY,
        tabBarInactiveTintColor: isDark ? "#475569" : "#94a3b8",
        tabBarLabelStyle: { fontSize: 9.3, fontWeight: "700", letterSpacing: 0.2, marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="DashboardScreen"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} isDark={isDark} />,
        }}
      />
      <Tabs.Screen
        name="ProductsScreen"
        options={{
          title: "Products",
          tabBarIcon: ({ focused }) => <TabIcon emoji="📦" focused={focused} isDark={isDark} />,
        }}
      />
      <Tabs.Screen
        name="NotificationScreen"
        options={{
          title: "Notifications",
           tabBarIcon: ({ focused }) => <TabIcon emoji="🔔" focused={focused} isDark={isDark} />,
          //tabBarButton: () => <AddFAB isDark={isDark} />,
        }}
      />
      <Tabs.Screen
        name="MessagesScreen"
        options={{
          title: "Messages",
          tabBarIcon: ({ focused }) => <TabIcon emoji="💬" focused={focused} isDark={isDark} />,
        }}
      />
      <Tabs.Screen
        name="ShopProfileScreen"
        options={{
          title: "Shop",
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏪" focused={focused} isDark={isDark} />,
        }}
      />
    </Tabs>
  );
}
