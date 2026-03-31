import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import { useColors } from "@/hooks/useColors";

function NativeEditorTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Dashboard</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="work">
        <Icon sf={{ default: "checklist", selected: "checklist.checked" }} />
        <Label>My Work</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicEditorTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.editorPrimary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: true,
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: {
          fontFamily: "Inter_600SemiBold",
          color: colors.foreground,
        },
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
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View
              style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]}
            />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="house" tintColor={color} size={24} />
            ) : (
              <Feather name="home" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="work"
        options={{
          title: "My Work",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="checklist" tintColor={color} size={24} />
            ) : (
              <Feather name="check-square" size={22} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

export default function EditorTabLayout() {
  if (isLiquidGlassAvailable()) return <NativeEditorTabLayout />;
  return <ClassicEditorTabLayout />;
}
