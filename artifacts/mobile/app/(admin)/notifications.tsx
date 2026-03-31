import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import {
  fetchNotifications,
  fetchPendingVideos,
  markNotificationsRead,
  reviewVideo,
  type AppNotification,
  type VideoSubmission,
} from "@/hooks/useApi";

type Tab = "notifications" | "pending_reviews";

const ICON_MAP = {
  project_assigned: { icon: "folder-plus" as const, bg: "#e8edf8", color: "#3b5bdb" },
  video_submitted:  { icon: "upload" as const,       bg: "#e8f5e9", color: "#22c55e" },
  video_approved:   { icon: "check-circle" as const, bg: "#e8f5e9", color: "#22c55e" },
  video_rejected:   { icon: "x-circle" as const,     bg: "#fee2e2", color: "#ef4444" },
};

export default function AdminNotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("notifications");
  const [reviewModal, setReviewModal] = useState<VideoSubmission | null>(null);

  const { data: notifications = [], isLoading: nLoading, refetch: refetchNotifs } = useQuery({
    queryKey: ["notifications", "admin"],
    queryFn: () => fetchNotifications("admin"),
    refetchInterval: 15000,
  });

  const { data: pendingVideos = [], isLoading: vLoading, refetch: refetchVideos } = useQuery({
    queryKey: ["pending-videos"],
    queryFn: fetchPendingVideos,
    refetchInterval: 20000,
  });

  useEffect(() => {
    const unread = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unread.length > 0) {
      markNotificationsRead("admin", unread).then(() => {
        queryClient.invalidateQueries({ queryKey: ["notifications", "admin"] });
      });
    }
  }, [notifications, queryClient]);

  function renderNotif({ item }: { item: AppNotification }) {
    const cfg = ICON_MAP[item.type] ?? ICON_MAP.project_assigned;
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: item.read ? colors.border : colors.primary, borderLeftWidth: item.read ? 1 : 3 }]}>
        <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
          <Feather name={cfg.icon} size={18} color={cfg.color} />
        </View>
        <View style={styles.cardBody}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.title}</Text>
          <Text style={[styles.cardMsg, { color: colors.mutedForeground }]}>{item.message}</Text>
          <Text style={[styles.cardTime, { color: colors.mutedForeground }]}>{formatTimeAgo(item.createdAt)}</Text>
        </View>
        {!item.read && <View style={[styles.dot, { backgroundColor: colors.primary }]} />}
      </View>
    );
  }

  function renderPendingVideo({ item }: { item: VideoSubmission }) {
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.warning, borderLeftWidth: 3 }]}>
        <View style={[styles.iconWrap, { backgroundColor: "#fef3c7" }]}>
          <Feather name="film" size={18} color={colors.warning} />
        </View>
        <View style={styles.cardBody}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={1}>{item.fileName}</Text>
          <Text style={[styles.cardMsg, { color: colors.mutedForeground }]}>
            {item.editorName} • {item.projectName ?? item.projectId}
          </Text>
          <Text style={[styles.cardMeta, { color: colors.mutedForeground }]}>
            {item.fileSize} • {formatTimeAgo(item.submittedAt)}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setReviewModal(item)}
          style={[styles.reviewBtn, { backgroundColor: colors.primary }]}>
          <Text style={styles.reviewBtnText}>Review</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {(["notifications", "pending_reviews"] as Tab[]).map((t) => {
          const active = tab === t;
          const count = t === "notifications" ? unreadCount : pendingVideos.length;
          return (
            <TouchableOpacity key={t} onPress={() => setTab(t)}
              style={[styles.tabBtn, active && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}>
              <Text style={[styles.tabText, { color: active ? colors.primary : colors.mutedForeground }]}>
                {t === "notifications" ? "Notifications" : "Pending Reviews"}
              </Text>
              {count > 0 && (
                <View style={[styles.tabBadge, { backgroundColor: t === "notifications" ? "#e8edf8" : "#fef3c7" }]}>
                  <Text style={[styles.tabBadgeText, { color: t === "notifications" ? colors.primary : colors.warning }]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {tab === "notifications" ? (
        nLoading ? <View style={styles.loader}><ActivityIndicator color={colors.primary} /></View> : (
          <FlatList
            data={notifications}
            keyExtractor={(n) => n.id}
            renderItem={renderNotif}
            contentContainerStyle={[styles.listContent, { paddingBottom: bottomPad + 100 }]}
            refreshing={nLoading}
            onRefresh={refetchNotifs}
            ListEmptyComponent={
              <View style={[styles.empty, { borderColor: colors.border }]}>
                <Feather name="bell" size={32} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No notifications</Text>
              </View>
            }
            scrollEnabled={!!notifications.length}
          />
        )
      ) : (
        vLoading ? <View style={styles.loader}><ActivityIndicator color={colors.primary} /></View> : (
          <FlatList
            data={pendingVideos}
            keyExtractor={(v) => v.id}
            renderItem={renderPendingVideo}
            contentContainerStyle={[styles.listContent, { paddingBottom: bottomPad + 100 }]}
            refreshing={vLoading}
            onRefresh={refetchVideos}
            ListEmptyComponent={
              <View style={[styles.empty, { borderColor: colors.border }]}>
                <Feather name="check-circle" size={32} color={colors.success} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No pending reviews</Text>
              </View>
            }
            scrollEnabled={!!pendingVideos.length}
          />
        )
      )}

      {reviewModal && (
        <ReviewModal
          video={reviewModal}
          colors={colors}
          insets={insets}
          onClose={() => setReviewModal(null)}
          onDone={() => {
            setReviewModal(null);
            refetchVideos();
            refetchNotifs();
            queryClient.invalidateQueries({ queryKey: ["pending-videos"] });
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
          }}
        />
      )}
    </View>
  );
}

function ReviewModal({
  video, colors, insets, onClose, onDone,
}: {
  video: VideoSubmission;
  colors: ReturnType<typeof useColors>;
  insets: ReturnType<typeof import("react-native-safe-area-context").useSafeAreaInsets>;
  onClose: () => void;
  onDone: () => void;
}) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  async function handle(action: "approve" | "reject") {
    if (action === "reject" && !note.trim()) {
      Alert.alert("Note Required", "Please add a rejection reason for the editor.");
      return;
    }
    setLoading(action);
    try {
      await reviewVideo(video.id, action, note.trim() || undefined);
      Haptics.notificationAsync(
        action === "approve" ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning
      );
      onDone();
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "Review failed");
    } finally { setLoading(null); }
  }

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: colors.card, paddingBottom: bottomPad + 16 }]}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Review Video</Text>
            <TouchableOpacity onPress={onClose}><Feather name="x" size={20} color={colors.mutedForeground} /></TouchableOpacity>
          </View>

          <View style={[styles.videoInfo, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Feather name="film" size={16} color={colors.mutedForeground} />
            <View style={styles.videoInfoText}>
              <Text style={[styles.videoFileName, { color: colors.foreground }]}>{video.fileName}</Text>
              <Text style={[styles.videoMeta, { color: colors.mutedForeground }]}>
                {video.editorName} • {video.fileSize} • Deliverable #{video.deliverableIndex}
              </Text>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Note (required for rejection)</Text>
            <TextInput
              style={[styles.noteInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
              value={note} onChangeText={setNote}
              placeholder="Add feedback for the editor..."
              placeholderTextColor={colors.mutedForeground}
              multiline numberOfLines={3}
            />
          </View>

          <View style={styles.reviewActions}>
            <TouchableOpacity onPress={() => handle("reject")} disabled={!!loading}
              style={[styles.rejectBtn, { backgroundColor: "#fee2e2", borderColor: "#fecaca" }]}>
              {loading === "reject" ? <ActivityIndicator color="#b91c1c" />
                : <><Feather name="x" size={16} color="#b91c1c" /><Text style={[styles.reviewBtnLabel, { color: "#b91c1c" }]}>Reject</Text></>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handle("approve")} disabled={!!loading}
              style={[styles.approveBtn, { backgroundColor: colors.success }]}>
              {loading === "approve" ? <ActivityIndicator color="#fff" />
                : <><Feather name="check" size={16} color="#fff" /><Text style={[styles.reviewBtnLabel, { color: "#fff" }]}>Approve</Text></>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBar: { flexDirection: "row", borderBottomWidth: 1 },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, gap: 6 },
  tabText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  tabBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  tabBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { padding: 16 },
  card: { flexDirection: "row", alignItems: "flex-start", borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10, gap: 12 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  cardBody: { flex: 1, gap: 3 },
  cardTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  cardMsg: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  cardMeta: { fontSize: 11, fontFamily: "Inter_400Regular" },
  cardTime: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 4, flexShrink: 0 },
  reviewBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignSelf: "center" },
  reviewBtnText: { color: "#fff", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  empty: { alignItems: "center", padding: 40, borderRadius: 16, borderWidth: 1, gap: 8, margin: 16 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 16 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#e2e8f0", alignSelf: "center", marginBottom: 8 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  videoInfo: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
  videoInfoText: { flex: 1, gap: 2 },
  videoFileName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  videoMeta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  field: { gap: 6 },
  fieldLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  noteInput: { padding: 12, borderRadius: 12, borderWidth: 1, fontSize: 14, fontFamily: "Inter_400Regular", minHeight: 80, textAlignVertical: "top" },
  reviewActions: { flexDirection: "row", gap: 12 },
  rejectBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 14, borderRadius: 14, borderWidth: 1, gap: 6 },
  approveBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 14, borderRadius: 14, gap: 6 },
  reviewBtnLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
