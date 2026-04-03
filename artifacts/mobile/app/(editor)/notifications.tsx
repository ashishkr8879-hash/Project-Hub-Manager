import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { useEditorTheme } from "@/hooks/useEditorTheme";
import { fetchNotifications, markNotificationsRead, type AppNotification } from "@/hooks/useApi";

const ICON_MAP: Record<string, { icon: "folder-plus"|"upload"|"check-circle"|"x-circle"|"message-circle"|"edit-2"; bg: string; color: string }> = {
  project_assigned:   { icon: "folder-plus",   bg: "#e8edf8", color: "#3b5bdb" },
  video_submitted:    { icon: "upload",         bg: "#e8f5e9", color: "#22c55e" },
  video_approved:     { icon: "check-circle",   bg: "#e8f5e9", color: "#22c55e" },
  video_rejected:     { icon: "x-circle",       bg: "#fee2e2", color: "#ef4444" },
  message_received:   { icon: "message-circle", bg: "#f3e8ff", color: "#7c3aed" },
  revision_requested: { icon: "edit-2",         bg: "#fef9c3", color: "#d97706" },
};

export default function EditorNotificationsScreen() {
  const colors = useColors();
  const { currentUser } = useApp();
  const theme = useEditorTheme(currentUser?.specialization);
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const queryClient = useQueryClient();
  const userId = currentUser?.editorId ?? currentUser?.id ?? "";

  const { data: notifications = [], isLoading, refetch } = useQuery({
    queryKey: ["notifications", userId],
    queryFn: () => fetchNotifications(userId),
    enabled: !!userId,
    refetchInterval: 15000,
  });

  useEffect(() => {
    const unread = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unread.length > 0) {
      markNotificationsRead(userId, unread).then(() => {
        queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
      });
    }
  }, [notifications, userId, queryClient]);

  function handleNotifTap(item: AppNotification) {
    if (!item.projectId) return;
    const openChat = item.type === "message_received" || item.type === "revision_requested";
    router.push({
      pathname: "/(editor)/work",
      params: { openProjectId: item.projectId, openChat: openChat ? "1" : "0" },
    } as never);
  }

  function renderItem({ item }: { item: AppNotification }) {
    const cfg = ICON_MAP[item.type] ?? ICON_MAP.project_assigned;
    const timeAgo = formatTimeAgo(item.createdAt);
    const tappable = !!item.projectId;

    return (
      <TouchableOpacity
        activeOpacity={tappable ? 0.7 : 1}
        onPress={tappable ? () => handleNotifTap(item) : undefined}
        style={[styles.card, { backgroundColor: colors.card, borderColor: item.read ? colors.border : colors.primary, borderLeftWidth: item.read ? 1 : 3 }]}
      >
        <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
          <Feather name={cfg.icon} size={18} color={cfg.color} />
        </View>
        <View style={styles.cardBody}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.title}</Text>
          <Text style={[styles.cardMsg, { color: colors.mutedForeground }]}>{item.message}</Text>
          <Text style={[styles.cardTime, { color: colors.mutedForeground }]}>{timeAgo}</Text>
        </View>
        <View style={styles.cardRight}>
          {!item.read && <View style={[styles.dot, { backgroundColor: colors.primary }]} />}
          {tappable && <Feather name="chevron-right" size={16} color={colors.mutedForeground} />}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      data={notifications}
      keyExtractor={(n) => n.id}
      renderItem={renderItem}
      contentContainerStyle={[styles.listContent, { paddingBottom: bottomPad + 100 }]}
      refreshing={isLoading}
      onRefresh={refetch}
      ListEmptyComponent={
        <View style={[styles.empty, { borderColor: colors.border }]}>
          <Feather name="bell" size={32} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No notifications yet</Text>
        </View>
      }
      scrollEnabled={!!notifications.length}
    />
  );
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const styles = StyleSheet.create({
  listContent: { padding: 16, gap: 0 },
  card: { flexDirection: "row", alignItems: "flex-start", borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10, gap: 12 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  cardBody: { flex: 1, gap: 3 },
  cardTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  cardMsg: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  cardTime: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  cardRight: { alignItems: "center", gap: 4, flexShrink: 0 },
  dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  empty: { alignItems: "center", padding: 40, borderRadius: 16, borderWidth: 1, gap: 8, margin: 16 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
