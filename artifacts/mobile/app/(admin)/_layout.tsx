import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import { useColors } from "@/hooks/useColors";

function NativeAdminTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "chart.bar", selected: "chart.bar.fill" }} />
        <Label>Dashboard</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="projects">
        <Icon sf={{ default: "folder", selected: "folder.fill" }} />
        <Label>Projects</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="create">
        <Icon sf={{ default: "plus.circle", selected: "plus.circle.fill" }} />
        <Label>Create</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="notifications">
        <Icon sf={{ default: "bell", selected: "bell.fill" }} />
        <Label>Inbox</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "person.circle", selected: "person.circle.fill" }} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicAdminTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.adminPrimary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: true,
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { fontFamily: "Inter_600SemiBold", color: colors.foreground },
        headerShadowVisible: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.background,
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={100} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
          ) : null,
      }}
    >
      <Tabs.Screen name="index" options={{
        title: "Dashboard",
        tabBarIcon: ({ color }) => isIOS
          ? <SymbolView name="chart.bar" tintColor={color} size={24} />
          : <Feather name="bar-chart-2" size={22} color={color} />,
      }} />
      <Tabs.Screen name="projects" options={{
        title: "Projects",
        tabBarIcon: ({ color }) => isIOS
          ? <SymbolView name="folder" tintColor={color} size={24} />
          : <Feather name="folder" size={22} color={color} />,
      }} />
      <Tabs.Screen name="create" options={{
        title: "New Project",
        tabBarIcon: ({ color }) => isIOS
          ? <SymbolView name="plus.circle" tintColor={color} size={24} />
          : <Feather name="plus-circle" size={22} color={color} />,
      }} />
      <Tabs.Screen name="notifications" options={{
        title: "Inbox",
        tabBarIcon: ({ color }) => isIOS
          ? <SymbolView name="bell" tintColor={color} size={24} />
          : <Feather name="bell" size={22} color={color} />,
      }} />
      <Tabs.Screen name="profile" options={{
        title: "Admin Profile",
        tabBarIcon: ({ color }) => isIOS
          ? <SymbolView name="person.circle" tintColor={color} size={24} />
          : <Feather name="user-circle" size={22} color={color} />,
      }} />
    </Tabs>
  );
}

export default function AdminTabLayout() {
  if (isLiquidGlassAvailable()) return <NativeAdminTabLayout />;
  return <ClassicAdminTabLayout />;
}
