import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const DEMO_USERS = [
  {
    id: "admin-1",
    name: "Sarah Admin",
    role: "admin" as const,
    subtitle: "Full access",
  },
  {
    id: "e1",
    name: "Alice Johnson",
    role: "editor" as const,
    editorId: "e1",
    subtitle: "Editor",
  },
  {
    id: "e2",
    name: "Bob Martinez",
    role: "editor" as const,
    editorId: "e2",
    subtitle: "Editor",
  },
  {
    id: "e3",
    name: "Clara Lee",
    role: "editor" as const,
    editorId: "e3",
    subtitle: "Editor",
  },
];

export default function LoginScreen() {
  const colors = useColors();
  const { setCurrentUser } = useApp();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string | null>(null);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  async function handleLogin(userId: string) {
    const user = DEMO_USERS.find((u) => u.id === userId);
    if (!user) return;
    setSelected(userId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentUser({
      id: user.id,
      name: user.name,
      role: user.role,
      editorId: user.editorId,
    });
    await new Promise((r) => setTimeout(r, 200));
    router.replace(user.role === "admin" ? "/(admin)" : "/(editor)");
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topInset + 32, paddingBottom: bottomInset + 32 },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.hero}>
        <View style={[styles.logoWrap, { backgroundColor: colors.primary }]}>
          <Feather name="briefcase" size={36} color="#fff" />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Project Manager
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Select your profile to continue
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          ADMIN
        </Text>
        {DEMO_USERS.filter((u) => u.role === "admin").map((user) => (
          <UserRow
            key={user.id}
            user={user}
            selected={selected === user.id}
            onPress={() => handleLogin(user.id)}
            accentColor={colors.adminPrimary}
            colors={colors}
          />
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          EDITORS
        </Text>
        {DEMO_USERS.filter((u) => u.role === "editor").map((user) => (
          <UserRow
            key={user.id}
            user={user}
            selected={selected === user.id}
            onPress={() => handleLogin(user.id)}
            accentColor={colors.editorPrimary}
            colors={colors}
          />
        ))}
      </View>
    </ScrollView>
  );
}

function UserRow({
  user,
  selected,
  onPress,
  accentColor,
  colors,
}: {
  user: (typeof DEMO_USERS)[0];
  selected: boolean;
  onPress: () => void;
  accentColor: string;
  colors: ReturnType<typeof useColors>;
}) {
  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[
        styles.row,
        {
          backgroundColor: colors.card,
          borderColor: selected ? accentColor : colors.border,
          borderWidth: selected ? 2 : 1,
        },
      ]}
    >
      <View style={[styles.avatar, { backgroundColor: `${accentColor}20` }]}>
        <Text style={[styles.avatarText, { color: accentColor }]}>{initials}</Text>
      </View>
      <View style={styles.rowInfo}>
        <Text style={[styles.rowName, { color: colors.foreground }]}>{user.name}</Text>
        <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
          {user.subtitle}
        </Text>
      </View>
      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 24, gap: 0 },
  hero: { alignItems: "center", marginBottom: 40, gap: 12 },
  logoWrap: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  section: { marginBottom: 24, gap: 10 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  rowInfo: { flex: 1, gap: 2 },
  rowName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  rowSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
