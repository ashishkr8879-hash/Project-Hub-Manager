import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
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
import { StatusBadge } from "@/components/StatusBadge";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import {
  fetchEditorProjects,
  fetchEditorVideos,
  submitVideo,
  updateProjectStatus,
  type Project,
  type VideoSubmission,
} from "@/hooks/useApi";

type Tab = "active" | "rejected";

export default function WorkScreen() {
  const colors = useColors();
  const { currentUser } = useApp();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const queryClient = useQueryClient();
  const editorId = currentUser?.editorId ?? currentUser?.id ?? "";
  const [tab, setTab] = useState<Tab>("active");
  const [updating, setUpdating] = useState<string | null>(null);
  const [uploadModal, setUploadModal] = useState<Project | null>(null);

  const { data: projects = [], isLoading, refetch } = useQuery({
    queryKey: ["editor-projects", editorId],
    queryFn: () => fetchEditorProjects(editorId),
    enabled: !!editorId,
  });

  const { data: allVideos = [], refetch: refetchVideos } = useQuery({
    queryKey: ["editor-videos", editorId],
    queryFn: () => fetchEditorVideos(editorId),
    enabled: !!editorId,
  });

  const rejectedVideos = allVideos.filter((v) => v.status === "rejected");
  const activeProjects = projects.filter((p) => p.status !== "completed");

  async function handleMarkInProgress(project: Project) {
    setUpdating(project.id);
    try {
      await updateProjectStatus(project.id, "in_progress");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      queryClient.invalidateQueries({ queryKey: ["editor-projects"] });
    } catch { Alert.alert("Error", "Could not update project status"); }
    finally { setUpdating(null); }
  }

  async function handleAddDeliverable(project: Project) {
    if (project.completedDeliverables >= project.totalDeliverables) return;
    const newCount = project.completedDeliverables + 1;
    const newStatus = newCount >= project.totalDeliverables ? "completed" : "in_progress";
    setUpdating(project.id);
    try {
      await updateProjectStatus(project.id, newStatus, newCount);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      queryClient.invalidateQueries({ queryKey: ["editor-projects"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    } catch { Alert.alert("Error", "Could not update deliverable count"); }
    finally { setUpdating(null); }
  }

  function renderProject({ item }: { item: Project }) {
    const progress = item.totalDeliverables > 0 ? item.completedDeliverables / item.totalDeliverables : 0;
    const isCompleted = item.status === "completed";
    const isUpdating = updating === item.id;
    const projectVideos = allVideos.filter((v) => v.projectId === item.id);
    const pendingReview = projectVideos.filter((v) => v.status === "pending_review").length;

    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: isCompleted ? "#dcfce7" : colors.border, opacity: isCompleted ? 0.75 : 1 }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitles}>
            <Text style={[styles.projectName, { color: colors.foreground }]} numberOfLines={1}>{item.projectName}</Text>
            <Text style={[styles.clientName, { color: colors.mutedForeground }]} numberOfLines={1}>{item.clientName}</Text>
          </View>
          <StatusBadge status={item.status} />
        </View>

        {item.notes && (
          <View style={[styles.noteRow, { backgroundColor: colors.secondary }]}>
            <Feather name="message-circle" size={12} color={colors.primary} />
            <Text style={[styles.noteText, { color: colors.foreground }]} numberOfLines={2}>{item.notes}</Text>
          </View>
        )}

        <View style={styles.progressRow}>
          <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
            <View style={[styles.progressFill, { backgroundColor: isCompleted ? colors.success : colors.editorPrimary, width: `${Math.round(progress * 100)}%` as `${number}%` }]} />
          </View>
          <Text style={[styles.progressCount, { color: colors.mutedForeground }]}>{item.completedDeliverables}/{item.totalDeliverables}</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
            <Feather name="clock" size={11} /> {item.totalDeliverables - item.completedDeliverables} remaining
          </Text>
          {item.deadline && (
            <Text style={[styles.metaText, { color: colors.warning }]}>
              <Feather name="calendar" size={11} /> Due {new Date(item.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </Text>
          )}
          {pendingReview > 0 && (
            <Text style={[styles.metaText, { color: colors.primary }]}>
              <Feather name="eye" size={11} /> {pendingReview} in review
            </Text>
          )}
        </View>

        {!isCompleted && (
          <View style={styles.actions}>
            {item.status === "pending" && (
              <TouchableOpacity onPress={() => handleMarkInProgress(item)} disabled={isUpdating}
                style={[styles.actionBtn, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}30`, flex: 1 }]}>
                {isUpdating ? <ActivityIndicator size="small" color={colors.primary} />
                  : <><Feather name="play" size={14} color={colors.primary} /><Text style={[styles.actionText, { color: colors.primary }]}>Start Work</Text></>}
              </TouchableOpacity>
            )}
            {item.status === "in_progress" && (
              <>
                <TouchableOpacity onPress={() => handleAddDeliverable(item)} disabled={isUpdating}
                  style={[styles.actionBtn, { backgroundColor: `${colors.editorPrimary}15`, borderColor: `${colors.editorPrimary}30`, flex: 1 }]}>
                  {isUpdating ? <ActivityIndicator size="small" color={colors.editorPrimary} />
                    : <><Feather name="check" size={14} color={colors.editorPrimary} /><Text style={[styles.actionText, { color: colors.editorPrimary }]}>Mark Done</Text></>}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setUploadModal(item)}
                  style={[styles.actionBtn, { backgroundColor: `${colors.success}15`, borderColor: `${colors.success}30` }]}>
                  <Feather name="upload" size={14} color={colors.success} />
                  <Text style={[styles.actionText, { color: colors.success }]}>Upload</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
    );
  }

  function renderRejected({ item }: { item: VideoSubmission }) {
    const project = projects.find((p) => p.id === item.projectId);
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: "#fee2e2", borderLeftWidth: 4, borderLeftColor: colors.destructive }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitles}>
            <Text style={[styles.projectName, { color: colors.foreground }]} numberOfLines={1}>{item.fileName}</Text>
            <Text style={[styles.clientName, { color: colors.mutedForeground }]}>{project?.projectName ?? item.projectId}</Text>
          </View>
          <View style={[styles.rejBadge, { backgroundColor: "#fee2e2" }]}>
            <Text style={[styles.rejBadgeText, { color: "#b91c1c" }]}>Rejected</Text>
          </View>
        </View>
        {item.reviewNote && (
          <View style={[styles.noteRow, { backgroundColor: "#fff5f5" }]}>
            <Feather name="alert-circle" size={12} color={colors.destructive} />
            <Text style={[styles.noteText, { color: colors.destructive }]}>{item.reviewNote}</Text>
          </View>
        )}
        <View style={styles.metaRow}>
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{item.fileSize}</Text>
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
            {new Date(item.reviewedAt ?? item.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </Text>
        </View>
        {project && project.status === "in_progress" && (
          <TouchableOpacity onPress={() => setUploadModal(project)}
            style={[styles.actionBtn, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}30`, alignSelf: "flex-start" }]}>
            <Feather name="upload" size={14} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.primary }]}>Re-upload</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Tab bar */}
      <View style={[styles.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {(["active", "rejected"] as Tab[]).map((t) => {
          const active = tab === t;
          const count = t === "active" ? activeProjects.length : rejectedVideos.length;
          return (
            <TouchableOpacity key={t} onPress={() => setTab(t)} style={[styles.tabBtn, active && { borderBottomColor: colors.editorPrimary, borderBottomWidth: 2 }]}>
              <Text style={[styles.tabText, { color: active ? colors.editorPrimary : colors.mutedForeground }]}>
                {t === "active" ? "Active Work" : "Rejected Videos"}
              </Text>
              {count > 0 && (
                <View style={[styles.tabBadge, { backgroundColor: t === "rejected" ? "#fee2e2" : colors.secondary }]}>
                  <Text style={[styles.tabBadgeText, { color: t === "rejected" ? "#b91c1c" : colors.primary }]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {isLoading ? (
        <View style={styles.loader}><ActivityIndicator color={colors.editorPrimary} /></View>
      ) : tab === "active" ? (
        <FlatList
          data={activeProjects}
          keyExtractor={(p) => p.id}
          renderItem={renderProject}
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomPad + 100 }]}
          ListEmptyComponent={
            <View style={[styles.empty, { borderColor: colors.border }]}>
              <Feather name="inbox" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No active projects</Text>
            </View>
          }
          refreshing={isLoading}
          onRefresh={refetch}
          scrollEnabled={!!activeProjects.length}
        />
      ) : (
        <FlatList
          data={rejectedVideos}
          keyExtractor={(v) => v.id}
          renderItem={renderRejected}
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomPad + 100 }]}
          ListEmptyComponent={
            <View style={[styles.empty, { borderColor: colors.border }]}>
              <Feather name="check-circle" size={32} color={colors.success} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No rejected videos</Text>
            </View>
          }
          refreshing={isLoading}
          onRefresh={() => { refetch(); refetchVideos(); }}
          scrollEnabled={!!rejectedVideos.length}
        />
      )}

      {uploadModal && (
        <UploadModal
          project={uploadModal}
          editorId={editorId}
          colors={colors}
          insets={insets}
          onClose={() => setUploadModal(null)}
          onSuccess={() => {
            setUploadModal(null);
            refetchVideos();
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
          }}
        />
      )}
    </View>
  );
}

function UploadModal({
  project, editorId, colors, insets, onClose, onSuccess,
}: {
  project: Project;
  editorId: string;
  colors: ReturnType<typeof useColors>;
  insets: ReturnType<typeof import("react-native-safe-area-context").useSafeAreaInsets>;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [deliverableIndex, setDeliverableIndex] = useState("1");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!fileName.trim()) { Alert.alert("Error", "Please enter the file name"); return; }
    setLoading(true);
    try {
      await submitVideo(project.id, {
        editorId, fileName: fileName.trim(),
        fileSize: fileSize.trim() || "Unknown", deliverableIndex: parseInt(deliverableIndex, 10) || 1,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess();
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "Upload failed");
    } finally { setLoading(false); }
  }

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: colors.card, paddingBottom: bottomPad + 16 }]}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Upload Video</Text>
            <TouchableOpacity onPress={onClose}><Feather name="x" size={20} color={colors.mutedForeground} /></TouchableOpacity>
          </View>
          <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>{project.projectName}</Text>

          <View style={styles.modalFields}>
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>File Name</Text>
              <TextInput style={[styles.modalInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
                value={fileName} onChangeText={setFileName} placeholder="e.g. brand_video_v2.mp4" placeholderTextColor={colors.mutedForeground} />
            </View>
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>File Size</Text>
              <TextInput style={[styles.modalInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
                value={fileSize} onChangeText={setFileSize} placeholder="e.g. 250 MB" placeholderTextColor={colors.mutedForeground} />
            </View>
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Deliverable #</Text>
              <TextInput style={[styles.modalInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
                value={deliverableIndex} onChangeText={setDeliverableIndex} keyboardType="numeric" placeholder="1" placeholderTextColor={colors.mutedForeground} />
            </View>
          </View>

          <TouchableOpacity onPress={handleSubmit} disabled={loading}
            style={[styles.uploadBtn, { backgroundColor: loading ? colors.muted : colors.editorPrimary }]}>
            {loading ? <ActivityIndicator color="#fff" />
              : <><Feather name="upload" size={16} color="#fff" /><Text style={styles.uploadBtnText}>Submit to Admin</Text></>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
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
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12, gap: 10 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  cardTitles: { flex: 1, gap: 2 },
  projectName: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  clientName: { fontSize: 13, fontFamily: "Inter_400Regular" },
  noteRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, padding: 10, borderRadius: 8 },
  noteText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular" },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  progressBar: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  progressCount: { fontSize: 12, fontFamily: "Inter_500Medium", minWidth: 32, textAlign: "right" },
  metaRow: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  metaText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  actions: { flexDirection: "row", gap: 8 },
  actionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 10, borderRadius: 10, borderWidth: 1, gap: 6 },
  actionText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  rejBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: "flex-start" },
  rejBadgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  empty: { alignItems: "center", padding: 40, borderRadius: 16, borderWidth: 1, gap: 8 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 16 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#e2e8f0", alignSelf: "center", marginBottom: 8 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  modalSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: -8 },
  modalFields: { gap: 12 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  modalInput: { padding: 12, borderRadius: 12, borderWidth: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  uploadBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 14, borderRadius: 14, gap: 8, marginTop: 4 },
  uploadBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
