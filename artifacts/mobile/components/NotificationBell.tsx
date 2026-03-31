import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { fetchNotifications } from "@/hooks/useApi";

interface Props {
  targetRoute: "/(admin)/notifications" | "/(editor)/notifications";
}

export function NotificationBell({ targetRoute }: Props) {
  const colors = useColors();
  const { currentUser } = useApp();
  const userId = currentUser?.role === "admin" ? "admin" : (currentUser?.editorId ?? "");

  const { data: notifs = [] } = useQuery({
    queryKey: ["notifications", userId],
    queryFn: () => fetchNotifications(userId),
    refetchInterval: 15000,
    enabled: !!userId,
  });

  const unread = notifs.filter((n) => !n.read).length;

  return (
    <TouchableOpacity
      onPress={() => router.push(targetRoute as never)}
      style={[styles.btn, { backgroundColor: colors.muted }]}
    >
      <Feather name="bell" size={18} color={colors.foreground} />
      {unread > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.destructive }]}>
          <Text style={styles.badgeText}>{unread > 9 ? "9+" : unread}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 6,
    right: 6,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  badgeText: { color: "#fff", fontSize: 9, fontFamily: "Inter_700Bold" },
});
