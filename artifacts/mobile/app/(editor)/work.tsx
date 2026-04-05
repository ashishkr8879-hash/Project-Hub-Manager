import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { StatusBadge } from "@/components/StatusBadge";
import { ChatModal } from "@/components/ChatModal";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { useEditorTheme } from "@/hooks/useEditorTheme";
import {
  fetchEditorProjects,
  fetchEditorVideos,
  submitVideo,
  updateProjectStatus,
  fetchProjectReferences,
  addReference,
  deleteReference,
  type Project,
  type VideoSubmission,
  type ProjectReference,
} from "@/hooks/useApi";

type Tab = "active" | "approved" | "rejected";

type SpecConfig = {
  uploadLabel: string;
  uploadPlaceholder: string;
  uploadIcon: React.ComponentProps<typeof Feather>["name"];
  tabLabel: string;
  approvedLabel: string;
  rejectedLabel: string;
  workBannerIcon: React.ComponentProps<typeof Feather>["name"];
  workBannerColor: string;
  workBannerTitle: string;
  workBannerSub: string;
};

function getSpecConfig(spec?: string): SpecConfig {
  switch (spec) {
    case "Graphic Designer":
      return {
        uploadLabel: "Submit Design",
        uploadPlaceholder: "e.g. logo_v3_final.png",
        uploadIcon: "image",
        tabLabel: "Active Work",
        approvedLabel: "Approved Designs",
        rejectedLabel: "Revision Requested",
        workBannerIcon: "layers",
        workBannerColor: "#ec4899",
        workBannerTitle: "Design Studio",
        workBannerSub: "Upload PNGs, PSDs, AI files & brand assets",
      };
    case "Social Media Manager":
      return {
        uploadLabel: "Submit Content",
        uploadPlaceholder: "e.g. reel_march_week2.mp4",
        uploadIcon: "instagram",
        tabLabel: "Active Campaigns",
        approvedLabel: "Published Content",
        rejectedLabel: "Rejected Posts",
        workBannerIcon: "share-2",
        workBannerColor: "#0ea5e9",
        workBannerTitle: "Content Pipeline",
        workBannerSub: "Submit posts, reels, carousels & stories",
      };
    case "Website Development":
      return {
        uploadLabel: "Submit Milestone",
        uploadPlaceholder: "e.g. homepage_v2_staging.zip",
        uploadIcon: "code",
        tabLabel: "Active Projects",
        approvedLabel: "Approved Milestones",
        rejectedLabel: "Rejected Builds",
        workBannerIcon: "monitor",
        workBannerColor: "#10b981",
        workBannerTitle: "Dev Dashboard",
        workBannerSub: "Submit builds, staging links & code packages",
      };
    case "Ads Setup":
      return {
        uploadLabel: "Submit Campaign",
        uploadPlaceholder: "e.g. fb_ads_may_campaign.pdf",
        uploadIcon: "bar-chart-2",
        tabLabel: "Active Campaigns",
        approvedLabel: "Approved Campaigns",
        rejectedLabel: "Rejected Ads",
        workBannerIcon: "target",
        workBannerColor: "#f97316",
        workBannerTitle: "Ads Manager",
        workBannerSub: "Submit ad creatives, reports & campaign decks",
      };
    default: // Video Editor
      return {
        uploadLabel: "Upload Video",
        uploadPlaceholder: "e.g. brand_video_v2.mp4",
        uploadIcon: "video",
        tabLabel: "Active Work",
        approvedLabel: "Approved Videos",
        rejectedLabel: "Rejected Videos",
        workBannerIcon: "video",
        workBannerColor: "#7c3aed",
        workBannerTitle: "Video Studio",
        workBannerSub: "Upload MP4s, edits, reels & ad cuts for review",
      };
  }
}

export default function WorkScreen() {
  const colors = useColors();
  const { currentUser } = useApp();
  const theme = useEditorTheme(currentUser?.specialization);
  const spec = currentUser?.specialization;
  const specConfig = getSpecConfig(spec);
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const queryClient = useQueryClient();
  const editorId = currentUser?.editorId ?? currentUser?.id ?? "";
  const { openProjectId, openChat } = useLocalSearchParams<{ openProjectId?: string; openChat?: string }>();
  const [tab, setTab] = useState<Tab>("active");
  const [updating, setUpdating] = useState<string | null>(null);
  const [uploadModal, setUploadModal] = useState<Project | null>(null);
  const [chatProject, setChatProject] = useState<Project | null>(null);

  const { data: projects = [], isLoading, refetch } = useQuery({
    queryKey: ["editor-projects", editorId],
    queryFn: () => fetchEditorProjects(editorId),
    enabled: !!editorId,
    refetchInterval: 20000,
  });

  // Deep-link: auto-open project/chat from notification tap
  useEffect(() => {
    if (openProjectId && projects.length > 0) {
      const found = projects.find((p) => p.id === openProjectId);
      if (found) {
        if (openChat === "1") {
          setChatProject(found);
        } else {
          setUploadModal(found);
        }
      }
    }
  }, [openProjectId, openChat, projects]);

  const { data: allVideos = [], refetch: refetchVideos } = useQuery({
    queryKey: ["editor-videos", editorId],
    queryFn: () => fetchEditorVideos(editorId),
    enabled: !!editorId,
  });

  const rejectedVideos = allVideos.filter((v) => v.status === "rejected");
  const approvedVideos = allVideos.filter((v) => v.status === "approved");
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
      <View style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: isCompleted ? "#dcfce7" : item.revisionRequested ? "#fde047" : colors.border },
        item.revisionRequested && { borderWidth: 2 },
        { opacity: isCompleted ? 0.75 : 1 },
      ]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitles}>
            <Text style={[styles.projectName, { color: colors.foreground }]} numberOfLines={1}>{item.projectName}</Text>
            <Text style={[styles.clientName, { color: colors.mutedForeground }]} numberOfLines={1}>{item.clientName}</Text>
          </View>
          <StatusBadge status={item.status} />
        </View>

        {/* Revision/customise badge */}
        {item.revisionRequested && (
          <View style={[styles.revisionBanner, { backgroundColor: "#fef9c3", borderColor: "#fde047" }]}>
            <Feather name="edit-2" size={13} color="#b45309" />
            <Text style={[styles.revisionBannerText, { color: "#92400e" }]}>Admin requested customisation — check messages</Text>
          </View>
        )}

        {item.notes && (
          <View style={[styles.noteRow, { backgroundColor: colors.secondary }]}>
            <Feather name="message-circle" size={12} color={colors.primary} />
            <Text style={[styles.noteText, { color: colors.foreground }]} numberOfLines={2}>{item.notes}</Text>
          </View>
        )}

        <View style={styles.progressRow}>
          <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
            <View style={[styles.progressFill, { backgroundColor: isCompleted ? colors.success : theme.primary, width: `${Math.round(progress * 100)}%` as `${number}%` }]} />
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
                  style={[styles.actionBtn, { backgroundColor: `${theme.primary}15`, borderColor: `${theme.primary}30`, flex: 1 }]}>
                  {isUpdating ? <ActivityIndicator size="small" color={theme.primary} />
                    : <><Feather name="check" size={14} color={theme.primary} /><Text style={[styles.actionText, { color: theme.primary }]}>Mark Done</Text></>}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setUploadModal(item)}
                  style={[styles.actionBtn, { backgroundColor: `${colors.success}15`, borderColor: `${colors.success}30` }]}>
                  <Feather name="upload" size={14} color={colors.success} />
                  <Text style={[styles.actionText, { color: colors.success }]}>Upload</Text>
                </TouchableOpacity>
              </>
            )}
            {/* Chat / Customise button — always visible for active projects */}
            <TouchableOpacity
              onPress={() => setChatProject(item)}
              style={[
                styles.actionBtn,
                { backgroundColor: item.revisionRequested ? "#fef3c7" : `${theme.primary}12`, borderColor: item.revisionRequested ? "#f59e0b" : `${theme.primary}30` },
              ]}
            >
              <Feather name="message-circle" size={14} color={item.revisionRequested ? "#b45309" : theme.primary} />
              <Text style={[styles.actionText, { color: item.revisionRequested ? "#b45309" : theme.primary }]}>
                {item.revisionRequested ? "Customise!" : "Chat"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Chat button for completed projects too */}
        {isCompleted && (
          <TouchableOpacity
            onPress={() => setChatProject(item)}
            style={[styles.actionBtn, { backgroundColor: `${theme.primary}10`, borderColor: `${theme.primary}20`, alignSelf: "flex-start" }]}
          >
            <Feather name="message-circle" size={13} color={theme.primary} />
            <Text style={[styles.actionText, { color: theme.primary, fontSize: 12 }]}>Chat</Text>
          </TouchableOpacity>
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
        <View style={styles.actions}>
          {project && project.status === "in_progress" && (
            <TouchableOpacity onPress={() => setUploadModal(project)}
              style={[styles.actionBtn, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}30`, flex: 1 }]}>
              <Feather name="upload" size={14} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.primary }]}>Re-upload</Text>
            </TouchableOpacity>
          )}
          {project && (
            <TouchableOpacity onPress={() => setChatProject(project)}
              style={[styles.actionBtn, { backgroundColor: `${theme.primary}12`, borderColor: `${theme.primary}25` }]}>
              <Feather name="message-circle" size={14} color={theme.primary} />
              <Text style={[styles.actionText, { color: theme.primary }]}>Chat</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  function renderApproved({ item }: { item: VideoSubmission }) {
    const project = projects.find((p) => p.id === item.projectId);
    const reviewedDate = item.reviewedAt
      ? new Date(item.reviewedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
      : new Date(item.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: "#dcfce7", borderLeftWidth: 4, borderLeftColor: colors.success }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitles}>
            <Text style={[styles.projectName, { color: colors.foreground }]} numberOfLines={1}>{item.fileName}</Text>
            <Text style={[styles.clientName, { color: colors.mutedForeground }]}>{project?.projectName ?? item.projectId}</Text>
          </View>
          <View style={[styles.rejBadge, { backgroundColor: "#dcfce7" }]}>
            <Feather name="check-circle" size={11} color={colors.success} />
            <Text style={[styles.rejBadgeText, { color: "#15803d" }]}>Approved</Text>
          </View>
        </View>

        <View style={[styles.noteRow, { backgroundColor: "#f0fdf4" }]}>
          <Feather name="thumbs-up" size={12} color={colors.success} />
          <Text style={[styles.noteText, { color: "#15803d" }]}>Admin approved this submission</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
            <Feather name="hard-drive" size={11} /> {item.fileSize}
          </Text>
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
            <Feather name="calendar" size={11} /> Deliverable #{item.deliverableIndex}
          </Text>
          <Text style={[styles.metaText, { color: colors.success }]}>
            <Feather name="check" size={11} /> {reviewedDate}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => Linking.openURL(item.fileName).catch(() => Alert.alert("Open File", `File: ${item.fileName}\nSize: ${item.fileSize}\n\nThis file was submitted and approved. Open your file manager to locate it.`))}
            style={[styles.actionBtn, { backgroundColor: `${colors.success}15`, borderColor: `${colors.success}30`, flex: 1 }]}
          >
            <Feather name="download" size={14} color={colors.success} />
            <Text style={[styles.actionText, { color: colors.success }]}>Open / Play</Text>
          </TouchableOpacity>
          {project && (
            <TouchableOpacity onPress={() => setChatProject(project)}
              style={[styles.actionBtn, { backgroundColor: `${theme.primary}12`, borderColor: `${theme.primary}25` }]}>
              <Feather name="message-circle" size={14} color={theme.primary} />
              <Text style={[styles.actionText, { color: theme.primary }]}>Chat</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Specialization banner */}
      <View style={[styles.specBanner, { backgroundColor: `${specConfig.workBannerColor}12`, borderBottomColor: `${specConfig.workBannerColor}30` }]}>
        <View style={[styles.specBannerIcon, { backgroundColor: `${specConfig.workBannerColor}20` }]}>
          <Feather name={specConfig.workBannerIcon} size={18} color={specConfig.workBannerColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.specBannerTitle, { color: specConfig.workBannerColor }]}>{specConfig.workBannerTitle}</Text>
          <Text style={[styles.specBannerSub, { color: colors.mutedForeground }]}>{specConfig.workBannerSub}</Text>
        </View>
        <View style={[styles.specBannerCount, { backgroundColor: `${specConfig.workBannerColor}18` }]}>
          <Text style={[styles.specBannerCountText, { color: specConfig.workBannerColor }]}>{activeProjects.length} active</Text>
        </View>
      </View>

      {/* Tab bar */}
      <View style={[styles.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {([
          { key: "active" as Tab, label: specConfig.tabLabel, count: activeProjects.length, badgeBg: colors.secondary, badgeText: colors.primary },
          { key: "approved" as Tab, label: specConfig.approvedLabel, count: approvedVideos.length, badgeBg: "#dcfce7", badgeText: "#15803d" },
          { key: "rejected" as Tab, label: specConfig.rejectedLabel, count: rejectedVideos.length, badgeBg: "#fee2e2", badgeText: "#b91c1c" },
        ]).map(({ key, label, count, badgeBg, badgeText }) => {
          const active = tab === key;
          return (
            <TouchableOpacity key={key} onPress={() => setTab(key)} style={[styles.tabBtn, active && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}>
              <Text style={[styles.tabText, { color: active ? theme.primary : colors.mutedForeground }]} numberOfLines={1}>{label}</Text>
              {count > 0 && (
                <View style={[styles.tabBadge, { backgroundColor: badgeBg }]}>
                  <Text style={[styles.tabBadgeText, { color: badgeText }]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {isLoading ? (
        <View style={styles.loader}><ActivityIndicator color={theme.primary} /></View>
      ) : tab === "active" ? (
        <FlatList
          data={activeProjects}
          keyExtractor={(p) => p.id}
          renderItem={renderProject}
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomPad + 100 }]}
          ListEmptyComponent={
            <View style={[styles.empty, { borderColor: colors.border }]}>
              <Feather name="inbox" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No active projects assigned</Text>
            </View>
          }
          refreshing={isLoading}
          onRefresh={refetch}
          scrollEnabled={!!activeProjects.length}
        />
      ) : tab === "approved" ? (
        <FlatList
          data={approvedVideos}
          keyExtractor={(v) => v.id}
          renderItem={renderApproved}
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomPad + 100 }]}
          ListEmptyComponent={
            <View style={[styles.empty, { borderColor: colors.border }]}>
              <Feather name="award" size={32} color={colors.success} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No approved submissions yet</Text>
            </View>
          }
          refreshing={isLoading}
          onRefresh={() => { refetch(); refetchVideos(); }}
          scrollEnabled={!!approvedVideos.length}
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
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No rejected submissions</Text>
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
          specConfig={specConfig}
          onClose={() => setUploadModal(null)}
          onSuccess={() => {
            setUploadModal(null);
            refetchVideos();
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
          }}
        />
      )}

      {chatProject && currentUser && (
        <ChatModal
          visible={!!chatProject}
          onClose={() => setChatProject(null)}
          project={chatProject}
          currentUserId={editorId}
          currentUserName={currentUser.name}
          role="editor"
        />
      )}
    </View>
  );
}

function UploadModal({
  project, editorId, colors, insets, specConfig, onClose, onSuccess,
}: {
  project: Project;
  editorId: string;
  colors: ReturnType<typeof useColors>;
  insets: ReturnType<typeof import("react-native-safe-area-context").useSafeAreaInsets>;
  specConfig: SpecConfig;
  onClose: () => void;
  onSuccess: () => void;
}) {
  type ModalTab = "upload" | "references";
  const [modalTab, setModalTab] = useState<ModalTab>("upload");

  // Upload state
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [deliverableIndex, setDeliverableIndex] = useState("1");
  const [uploading, setUploading] = useState(false);

  // Reference state
  const queryClient = useQueryClient();
  const [showAddRef, setShowAddRef] = useState(false);
  const [refMode, setRefMode] = useState<"file" | "link" | null>(null);
  const [refTitle, setRefTitle] = useState("");
  const [refUrl, setRefUrl] = useState("");
  const [refNote, setRefNote] = useState("");
  const [refFile, setRefFile] = useState<{ name: string; size: string; type: string } | null>(null);
  const [addingRef, setAddingRef] = useState(false);

  const { data: references = [], isLoading: refsLoading, refetch: refetchRefs } = useQuery({
    queryKey: ["project-refs", project.id],
    queryFn: () => fetchProjectReferences(project.id),
  });

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  async function handleSubmitVideo() {
    if (!fileName.trim()) { Alert.alert("Error", "Please enter the file name"); return; }
    setUploading(true);
    try {
      await submitVideo(project.id, {
        editorId, fileName: fileName.trim(),
        fileSize: fileSize.trim() || "Unknown", deliverableIndex: parseInt(deliverableIndex, 10) || 1,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess();
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "Upload failed");
    } finally { setUploading(false); }
  }

  async function handlePickRefFile() {
    const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: false });
    if (!res.canceled && res.assets[0]) {
      const asset = res.assets[0];
      const sizeKB = asset.size ? `${(asset.size / 1024).toFixed(0)} KB` : "Unknown";
      setRefFile({ name: asset.name, size: sizeKB, type: asset.mimeType ?? "application/octet-stream" });
    }
  }

  async function handleAddRef() {
    if (!refTitle.trim()) { Alert.alert("Error", "Please enter a title"); return; }
    if (refMode === "link" && !refUrl.trim()) { Alert.alert("Error", "Please enter a URL"); return; }
    setAddingRef(true);
    try {
      await addReference(project.id, {
        title: refTitle.trim(),
        url: refMode === "link" ? refUrl.trim() : undefined,
        note: refNote.trim(),
        fileName: refMode === "file" ? (refFile?.name ?? "Uploaded File") : undefined,
        fileType: refMode === "file" ? (refFile?.type ?? "file") : undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowAddRef(false); setRefMode(null);
      setRefTitle(""); setRefUrl(""); setRefNote(""); setRefFile(null);
      refetchRefs();
      queryClient.invalidateQueries({ queryKey: ["project-refs"] });
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to add reference");
    } finally { setAddingRef(false); }
  }

  async function handleDeleteRef(ref: ProjectReference) {
    Alert.alert("Delete Reference", `Remove "${ref.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await deleteReference(ref.id);
            refetchRefs();
            queryClient.invalidateQueries({ queryKey: ["project-refs"] });
          } catch { Alert.alert("Error", "Could not remove reference"); }
        },
      },
    ]);
  }

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: colors.card, paddingBottom: bottomPad + 16 }]}>
          <View style={styles.modalHandle} />

          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]} numberOfLines={1}>{project.projectName}</Text>
              <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>{project.clientName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Tab bar */}
          <View style={[styles.mTabBar, { borderColor: colors.border }]}>
            {(["upload", "references"] as ModalTab[]).map((t) => {
              const active = modalTab === t;
              return (
                <TouchableOpacity key={t} onPress={() => setModalTab(t)}
                  style={[styles.mTabBtn, active && { backgroundColor: theme.primary, borderRadius: 10 }]}>
                  <Feather
                    name={t === "upload" ? "upload" : "paperclip"}
                    size={13}
                    color={active ? "#fff" : colors.mutedForeground}
                  />
                  <Text style={[styles.mTabText, { color: active ? "#fff" : colors.mutedForeground }]}>
                    {t === "upload" ? specConfig.uploadLabel : `References (${references.length})`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Upload tab */}
          {modalTab === "upload" && (
            <View style={styles.modalFields}>
              {/* Pick file from device */}
              <TouchableOpacity
                onPress={async () => {
                  try {
                    const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
                    if (!res.canceled && res.assets[0]) {
                      const a = res.assets[0];
                      setFileName(a.name);
                      setFileSize(a.size ? `${(a.size / (1024 * 1024)).toFixed(1)} MB` : "Unknown");
                    }
                  } catch {}
                }}
                style={[styles.filePickBtn, { backgroundColor: fileName ? `${theme.primary}08` : colors.muted, borderColor: fileName ? theme.primary : colors.border }]}
              >
                <Feather name={specConfig.uploadIcon} size={18} color={fileName ? theme.primary : colors.mutedForeground} />
                <Text style={[styles.filePickText, { color: fileName ? colors.foreground : colors.mutedForeground }]} numberOfLines={1}>
                  {fileName || `Tap to pick a file (${specConfig.uploadLabel})`}
                </Text>
                {fileName ? <Feather name="check-circle" size={16} color={theme.primary} /> : <Feather name="chevron-right" size={16} color={colors.mutedForeground} />}
              </TouchableOpacity>

              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>File Name</Text>
                <TextInput style={[styles.modalInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
                  value={fileName} onChangeText={setFileName} placeholder={specConfig.uploadPlaceholder} placeholderTextColor={colors.mutedForeground} />
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
              <TouchableOpacity onPress={handleSubmitVideo} disabled={uploading}
                style={[styles.uploadBtn, { backgroundColor: uploading ? colors.muted : theme.primary }]}>
                {uploading ? <ActivityIndicator color="#fff" />
                  : <><Feather name={specConfig.uploadIcon} size={16} color="#fff" /><Text style={styles.uploadBtnText}>Submit to Admin</Text></>}
              </TouchableOpacity>
            </View>
          )}

          {/* References tab */}
          {modalTab === "references" && (
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {/* Add buttons row */}
              {!showAddRef && (
                <View style={styles.refBtnRow}>
                  <TouchableOpacity onPress={() => { setShowAddRef(true); setRefMode("file"); }}
                    style={[styles.addRefBtn, { backgroundColor: theme.primary }]}>
                    <Feather name="upload" size={13} color="#fff" />
                    <Text style={styles.addRefBtnText}>Upload File</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setShowAddRef(true); setRefMode("link"); }}
                    style={[styles.addRefBtn, { backgroundColor: colors.primary }]}>
                    <Feather name="link" size={13} color="#fff" />
                    <Text style={styles.addRefBtnText}>Add Link</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Add reference form */}
              {showAddRef && refMode && (
                <View style={[styles.addRefForm, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={[styles.refFormHeader, { color: colors.foreground }]}>
                      {refMode === "file" ? "📎 Upload File Reference" : "🔗 Add Link Reference"}
                    </Text>
                    <TouchableOpacity onPress={() => { setShowAddRef(false); setRefMode(null); setRefTitle(""); setRefUrl(""); setRefNote(""); setRefFile(null); }}>
                      <Feather name="x" size={16} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  </View>

                  {refMode === "file" && (
                    <TouchableOpacity onPress={handlePickRefFile}
                      style={[styles.filePickBtn, { backgroundColor: refFile ? `${theme.primary}08` : colors.muted, borderColor: refFile ? theme.primary : colors.border }]}>
                      <Feather name={refFile ? "check-circle" : "upload"} size={16} color={refFile ? theme.primary : colors.mutedForeground} />
                      <View style={{ flex: 1 }}>
                        {refFile
                          ? <><Text style={[styles.filePickName, { color: colors.foreground }]} numberOfLines={1}>{refFile.name}</Text><Text style={[styles.filePickSize, { color: colors.mutedForeground }]}>{refFile.size}</Text></>
                          : <Text style={[styles.filePickPlaceholder, { color: colors.mutedForeground }]}>Tap to pick a file</Text>}
                      </View>
                      {refFile && <TouchableOpacity onPress={() => setRefFile(null)}><Feather name="x" size={14} color={colors.mutedForeground} /></TouchableOpacity>}
                    </TouchableOpacity>
                  )}

                  {refMode === "link" && (
                    <TextInput style={[styles.refInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
                      value={refUrl} onChangeText={setRefUrl} placeholder="https://drive.google.com/..." placeholderTextColor={colors.mutedForeground}
                      autoCapitalize="none" autoCorrect={false} keyboardType="url" />
                  )}

                  <TextInput style={[styles.refInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
                    value={refTitle} onChangeText={setRefTitle} placeholder="Title *" placeholderTextColor={colors.mutedForeground} />
                  <TextInput style={[styles.refInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
                    value={refNote} onChangeText={setRefNote} placeholder="Note for admin (optional)" placeholderTextColor={colors.mutedForeground} multiline />
                  <TouchableOpacity onPress={handleAddRef} disabled={addingRef}
                    style={[styles.refSaveBtn, { backgroundColor: addingRef ? colors.muted : theme.primary }]}>
                    {addingRef ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.refSaveBtnText}>Save Reference</Text>}
                  </TouchableOpacity>
                </View>
              )}

              {/* Reference list */}
              {refsLoading ? (
                <ActivityIndicator color={theme.primary} style={{ marginTop: 20 }} />
              ) : references.length === 0 ? (
                <View style={[styles.emptyRefs, { borderColor: colors.border }]}>
                  <Feather name="link-2" size={24} color={colors.mutedForeground} />
                  <Text style={[styles.emptyRefsText, { color: colors.mutedForeground }]}>No references yet</Text>
                </View>
              ) : (
                references.map((item) => (
                  <View key={item.id} style={[styles.refCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <View style={[styles.refIcon, { backgroundColor: item.fileName ? `${theme.primary}18` : `${colors.primary}18` }]}>
                      <Feather name={item.fileName ? "file" : "link"} size={14} color={item.fileName ? theme.primary : colors.primary} />
                    </View>
                    <View style={styles.refContent}>
                      <Text style={[styles.refTitle, { color: colors.foreground }]}>{item.title}</Text>
                      {item.fileName && <Text style={[styles.refUrl, { color: theme.primary }]} numberOfLines={1}>📎 {item.fileName}</Text>}
                      {item.url && (
                        <TouchableOpacity onPress={() => Linking.openURL(item.url!).catch(() => {})}>
                          <Text style={[styles.refUrl, { color: colors.primary }]} numberOfLines={1}>{item.url}</Text>
                        </TouchableOpacity>
                      )}
                      {item.note && <Text style={[styles.refNote, { color: colors.mutedForeground }]}>{item.note}</Text>}
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteRef(item)} style={{ padding: 4 }}>
                      <Feather name="trash-2" size={15} color={colors.destructive} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
              <View style={{ height: 20 }} />
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBar: { flexDirection: "row", borderBottomWidth: 1 },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, gap: 4 },
  tabText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  tabBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  tabBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { padding: 16 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12, gap: 10 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  cardTitles: { flex: 1, gap: 2 },
  projectName: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  clientName: { fontSize: 13, fontFamily: "Inter_400Regular" },
  revisionBanner: { flexDirection: "row", alignItems: "center", gap: 6, padding: 8, borderRadius: 8, borderWidth: 1 },
  revisionBannerText: { flex: 1, fontSize: 12, fontFamily: "Inter_500Medium" },
  noteRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, padding: 10, borderRadius: 8 },
  noteText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular" },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  progressBar: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  progressCount: { fontSize: 12, fontFamily: "Inter_500Medium", minWidth: 32, textAlign: "right" },
  metaRow: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  metaText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  actions: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  actionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 10, borderRadius: 10, borderWidth: 1, gap: 6 },
  actionText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  rejBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: "flex-start" },
  rejBadgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  specBanner: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  specBannerIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  specBannerTitle: { fontSize: 13, fontFamily: "Inter_700Bold" },
  specBannerSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  specBannerCount: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  specBannerCountText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  empty: { alignItems: "center", padding: 40, borderRadius: 16, borderWidth: 1, gap: 8 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 14, maxHeight: "90%" },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#e2e8f0", alignSelf: "center", marginBottom: 4 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  modalTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  modalSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  modalFields: { gap: 12 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  modalInput: { padding: 12, borderRadius: 12, borderWidth: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  uploadBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 14, borderRadius: 14, gap: 8, marginTop: 4 },
  uploadBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  // Modal tabs
  mTabBar: { flexDirection: "row", borderWidth: 1, borderRadius: 12, padding: 4, gap: 4 },
  mTabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 4 },
  mTabText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  // References
  refBtnRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  addRefBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, gap: 6 },
  addRefBtnText: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  addRefForm: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10, marginBottom: 12 },
  refFormHeader: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  filePickBtn: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 12, padding: 12, gap: 10, marginBottom: 4 },
  filePickName: { fontSize: 13, fontFamily: "Inter_500Medium" },
  filePickSize: { fontSize: 11, fontFamily: "Inter_400Regular" },
  filePickPlaceholder: { fontSize: 13, fontFamily: "Inter_400Regular" },
  filePickText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  refInput: { padding: 12, borderRadius: 12, borderWidth: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  refSaveBtn: { alignItems: "center", padding: 12, borderRadius: 12 },
  refSaveBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  emptyRefs: { alignItems: "center", padding: 32, borderRadius: 12, borderWidth: 1, borderStyle: "dashed", gap: 8, marginTop: 8 },
  emptyRefsText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  refCard: { flexDirection: "row", alignItems: "flex-start", borderRadius: 12, borderWidth: 1, padding: 12, gap: 10, marginBottom: 8 },
  refIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  refContent: { flex: 1, gap: 2 },
  refTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  refUrl: { fontSize: 12, fontFamily: "Inter_400Regular" },
  refNote: { fontSize: 12, fontFamily: "Inter_400Regular", fontStyle: "italic" },
});
