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
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { StatusBadge } from "@/components/StatusBadge";
import { ProjectCard } from "@/components/ProjectCard";
import { useColors } from "@/hooks/useColors";
import { ChatModal } from "@/components/ChatModal";
import {
  fetchProjects,
  fetchProjectReferences,
  addReference,
  deleteReference,
  type Project,
  type ProjectReference,
} from "@/hooks/useApi";

const FILTERS = ["All", "Pending", "In Progress", "Completed"] as const;

const TYPE_ICONS: Record<string, string> = {
  ugc: "video", ai_video: "cpu", editing: "scissors",
  branded: "star", corporate: "briefcase", wedding: "heart",
  social_media: "instagram", graphic_design: "pen-tool",
  ads_setup: "radio", website: "globe", other: "more-horizontal",
};

export default function ProjectsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const { openProjectId } = useLocalSearchParams<{ openProjectId?: string }>();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [search, setSearch] = useState("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const { data: projects = [], isLoading, refetch } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });

  // Deep-link: auto-open project from notification tap
  useEffect(() => {
    if (openProjectId && projects.length > 0) {
      const found = projects.find((p) => p.id === openProjectId);
      if (found) setSelectedProject(found);
    }
  }, [openProjectId, projects]);

  const filtered = projects.filter((p) => {
    const matchFilter =
      filter === "All" ||
      (filter === "Pending" && p.status === "pending") ||
      (filter === "In Progress" && p.status === "in_progress") ||
      (filter === "Completed" && p.status === "completed");
    const matchSearch =
      !search ||
      p.projectName.toLowerCase().includes(search.toLowerCase()) ||
      p.clientName.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchBar, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Search projects or clients..."
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        horizontal showsHorizontalScrollIndicator={false}
        data={FILTERS} keyExtractor={(item) => item}
        style={styles.filterList} contentContainerStyle={styles.filterContent}
        renderItem={({ item }) => {
          const active = item === filter;
          return (
            <TouchableOpacity onPress={() => setFilter(item)}
              style={[styles.filterChip, { backgroundColor: active ? colors.primary : colors.muted, borderColor: active ? colors.primary : colors.border }]}>
              <Text style={[styles.filterText, { color: active ? "#fff" : colors.mutedForeground }]}>{item}</Text>
            </TouchableOpacity>
          );
        }}
      />

      {isLoading ? (
        <View style={styles.loader}><ActivityIndicator color={colors.primary} /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => (
            <ProjectCard project={item} onPress={() => setSelectedProject(item)} />
          )}
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomPad + 100 }]}
          ListEmptyComponent={
            <View style={[styles.empty, { borderColor: colors.border }]}>
              <Feather name="folder" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No projects found</Text>
            </View>
          }
          refreshing={isLoading}
          onRefresh={refetch}
          scrollEnabled
        />
      )}

      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          colors={colors}
          insets={insets}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </View>
  );
}

function ProjectDetailModal({
  project, colors, insets, onClose,
}: {
  project: Project;
  colors: ReturnType<typeof useColors>;
  insets: ReturnType<typeof import("react-native-safe-area-context").useSafeAreaInsets>;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [chatOpen, setChatOpen] = useState(false);
  const [showAddRef, setShowAddRef] = useState(false);
  const [refMode, setRefMode] = useState<"link" | "file" | null>(null);
  const [refTitle, setRefTitle] = useState("");
  const [refUrl, setRefUrl] = useState("");
  const [refNote, setRefNote] = useState("");
  const [refFile, setRefFile] = useState<{ name: string; size: string; type: string } | null>(null);
  const [addingRef, setAddingRef] = useState(false);

  const isUGC = project.projectType === "ugc" && project.modelCost > 0;
  const netValue = project.totalValue - (project.modelCost || 0);

  const { data: references = [], isLoading: refsLoading, refetch: refetchRefs } = useQuery({
    queryKey: ["project-refs", project.id],
    queryFn: () => fetchProjectReferences(project.id),
  });

  async function handlePickRefFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "*/*", copyToCacheDirectory: false, multiple: false });
      if (result.canceled) return;
      const asset = result.assets[0];
      const sizeStr = asset.size
        ? asset.size < 1024 * 1024 ? `${(asset.size / 1024).toFixed(1)} KB` : `${(asset.size / (1024 * 1024)).toFixed(1)} MB`
        : "";
      setRefFile({ name: asset.name, size: sizeStr, type: asset.mimeType ?? "application/octet-stream" });
      if (!refTitle.trim()) setRefTitle(asset.name.replace(/\.[^.]+$/, ""));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch { Alert.alert("Error", "Could not open file picker"); }
  }

  async function handleAddRef() {
    if (!refTitle.trim()) { Alert.alert("Required", "Title is required"); return; }
    if (refMode === "link" && !refUrl.trim()) { Alert.alert("Required", "Please enter a URL"); return; }
    if (refMode === "file" && !refFile) { Alert.alert("Required", "Please pick a file"); return; }
    setAddingRef(true);
    try {
      await addReference(project.id, {
        title: refTitle.trim(),
        url: refMode === "link" ? refUrl.trim() : undefined,
        note: refNote.trim(),
        fileName: refMode === "file" ? refFile?.name : undefined,
        fileType: refMode === "file" ? refFile?.type : undefined,
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setRefTitle(""); setRefUrl(""); setRefNote(""); setRefFile(null); setShowAddRef(false); setRefMode(null);
      refetchRefs();
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to add reference");
    } finally { setAddingRef(false); }
  }

  async function handleDeleteRef(ref: ProjectReference) {
    Alert.alert("Remove Reference", `Remove "${ref.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove", style: "destructive",
        onPress: async () => {
          try {
            await deleteReference(ref.id);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            refetchRefs();
            queryClient.invalidateQueries({ queryKey: ["project-refs"] });
          } catch { Alert.alert("Error", "Could not remove reference"); }
        },
      },
    ]);
  }

  const progress = project.totalDeliverables > 0
    ? project.completedDeliverables / project.totalDeliverables : 0;

  const typeIcon = (TYPE_ICONS[project.projectType] ?? "folder") as never;

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: colors.background, paddingBottom: bottomPad }]}>
          {/* Header */}
          <View style={[styles.modalTop, { backgroundColor: colors.card }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleBlock}>
                <View style={styles.modalTitleRow}>
                  <Feather name={typeIcon} size={14} color={colors.primary} />
                  <Text style={[styles.modalProjectName, { color: colors.foreground }]} numberOfLines={1}>{project.projectName}</Text>
                </View>
                <Text style={[styles.modalClientName, { color: colors.mutedForeground }]}>{project.clientName}</Text>
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  onPress={() => setChatOpen(true)}
                  style={[styles.closeBtn, { backgroundColor: project.revisionRequested ? "#fef3c7" : `${colors.adminPrimary}15` }]}
                >
                  <Feather name="message-circle" size={18} color={project.revisionRequested ? "#b45309" : colors.adminPrimary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.muted }]}>
                  <Feather name="x" size={18} color={colors.foreground} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <FlatList
            data={references}
            keyExtractor={(r) => r.id}
            contentContainerStyle={[styles.detailContent, { paddingBottom: 20 }]}
            ListHeaderComponent={
              <>
                {/* Status + progress */}
                <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.sectionRow}>
                    <StatusBadge status={project.status} />
                    <Text style={[styles.sectionSubText, { color: colors.mutedForeground }]}>
                      {project.completedDeliverables}/{project.totalDeliverables} deliverables done
                    </Text>
                  </View>
                  <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
                    <View style={[styles.progressFill, {
                      backgroundColor: project.status === "completed" ? colors.success : colors.primary,
                      width: `${Math.round(progress * 100)}%` as `${number}%`,
                    }]} />
                  </View>
                </View>

                {/* Pricing */}
                {isUGC ? (
                  <View style={[styles.ugcPricingBox, { backgroundColor: "#fef9c3", borderColor: "#fde047" }]}>
                    <View style={styles.ugcPricingRow}>
                      <Text style={[styles.ugcPricingLabel, { color: "#92400e" }]}>Total Value</Text>
                      <Text style={[styles.ugcPricingValue, { color: colors.foreground }]}>₹{project.totalValue.toLocaleString()}</Text>
                    </View>
                    <View style={styles.ugcPricingRow}>
                      <Text style={[styles.ugcPricingLabel, { color: "#b91c1c" }]}>– Model Cost</Text>
                      <Text style={[styles.ugcPricingValue, { color: "#b91c1c" }]}>–₹{project.modelCost.toLocaleString()}</Text>
                    </View>
                    <View style={[styles.ugcPricingDivider, { backgroundColor: "#fde047" }]} />
                    <View style={styles.ugcPricingRow}>
                      <Text style={[styles.ugcPricingLabel, { color: "#166534", fontFamily: "Inter_700Bold" }]}>Net Editor Payout</Text>
                      <Text style={[styles.ugcNetValue, { color: "#15803d" }]}>₹{netValue.toLocaleString()}</Text>
                    </View>
                  </View>
                ) : (
                  <View style={[styles.simpleValueBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Feather name="dollar-sign" size={16} color={colors.success} />
                    <Text style={[styles.simpleValueText, { color: colors.foreground }]}>
                      Project Value: <Text style={{ color: colors.success, fontFamily: "Inter_700Bold" }}>₹{project.totalValue.toLocaleString()}</Text>
                    </Text>
                  </View>
                )}

                {/* Client contact */}
                {(project.clientPhone || project.clientEmail) && (
                  <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Client Contact</Text>
                    {project.clientPhone && (
                      <TouchableOpacity onPress={() => Linking.openURL(`tel:${project.clientPhone}`)} style={styles.contactRow}>
                        <Feather name="phone" size={14} color={colors.primary} />
                        <Text style={[styles.contactText, { color: colors.primary }]}>{project.clientPhone}</Text>
                      </TouchableOpacity>
                    )}
                    {project.clientEmail && (
                      <TouchableOpacity onPress={() => Linking.openURL(`mailto:${project.clientEmail}`)} style={styles.contactRow}>
                        <Feather name="mail" size={14} color={colors.primary} />
                        <Text style={[styles.contactText, { color: colors.primary }]}>{project.clientEmail}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Editor + deadline + notes */}
                <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.metaRow, { justifyContent: "space-between" }]}>
                    <View style={styles.metaRow}>
                      <Feather name="user" size={14} color={colors.mutedForeground} />
                      <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{project.editorName}</Text>
                    </View>
                    {project.editorPhone && (
                      <TouchableOpacity
                        onPress={() => Linking.openURL(`tel:${project.editorPhone}`)}
                        style={[styles.callEditorBtn, { backgroundColor: `${colors.success}15`, borderColor: `${colors.success}30` }]}
                      >
                        <Feather name="phone-call" size={13} color={colors.success} />
                        <Text style={[styles.callEditorText, { color: colors.success }]}>Call Editor</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {project.deadline && (
                    <View style={styles.metaRow}>
                      <Feather name="calendar" size={14} color={colors.warning} />
                      <Text style={[styles.metaText, { color: colors.warning }]}>
                        Due {new Date(project.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                      </Text>
                    </View>
                  )}
                  {project.notes && (
                    <View style={[styles.notesBox, { backgroundColor: colors.secondary }]}>
                      <Feather name="message-circle" size={13} color={colors.primary} />
                      <Text style={[styles.notesText, { color: colors.foreground }]}>{project.notes}</Text>
                    </View>
                  )}
                  {project.script && (
                    <View style={[styles.notesBox, { backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#bbf7d0" }]}>
                      <Feather name="file-text" size={13} color="#166534" />
                      <Text style={[styles.notesText, { color: "#166534", fontFamily: "Inter_600SemiBold" }]}>Script: <Text style={{ fontFamily: "Inter_400Regular" }}>{project.script}</Text></Text>
                    </View>
                  )}
                </View>

                {/* References header */}
                <View style={styles.refsHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>References ({references.length})</Text>
                  {!showAddRef && (
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      <TouchableOpacity onPress={() => { setShowAddRef(true); setRefMode("file"); }}
                        style={[styles.addRefBtn, { backgroundColor: colors.adminPrimary ?? colors.primary }]}>
                        <Feather name="upload" size={13} color="#fff" />
                        <Text style={styles.addRefBtnText}>File</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => { setShowAddRef(true); setRefMode("link"); }}
                        style={[styles.addRefBtn, { backgroundColor: colors.primary }]}>
                        <Feather name="link" size={13} color="#fff" />
                        <Text style={styles.addRefBtnText}>Link</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {showAddRef && (
                    <TouchableOpacity onPress={() => { setShowAddRef(false); setRefMode(null); setRefTitle(""); setRefUrl(""); setRefNote(""); setRefFile(null); }}
                      style={[styles.addRefBtn, { backgroundColor: colors.muted, borderColor: colors.border, borderWidth: 1 }]}>
                      <Feather name="x" size={13} color={colors.mutedForeground} />
                      <Text style={[styles.addRefBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Add reference form */}
                {showAddRef && refMode && (
                  <View style={[styles.addRefForm, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.refFormHeader, { color: colors.foreground }]}>
                      {refMode === "file" ? "📎 Upload File Reference" : "🔗 Add Link Reference"}
                    </Text>

                    {/* File picker */}
                    {refMode === "file" && (
                      <TouchableOpacity onPress={handlePickRefFile}
                        style={[styles.filePickBtn, { backgroundColor: refFile ? `${colors.primary}08` : colors.muted, borderColor: refFile ? colors.primary : colors.border }]}>
                        <Feather name={refFile ? "check-circle" : "upload"} size={16} color={refFile ? colors.primary : colors.mutedForeground} />
                        <View style={{ flex: 1 }}>
                          {refFile ? (
                            <>
                              <Text style={[styles.filePickName, { color: colors.foreground }]} numberOfLines={1}>{refFile.name}</Text>
                              <Text style={[styles.filePickSize, { color: colors.mutedForeground }]}>{refFile.size}</Text>
                            </>
                          ) : (
                            <Text style={[styles.filePickPlaceholder, { color: colors.mutedForeground }]}>Tap to pick a file</Text>
                          )}
                        </View>
                        {refFile && (
                          <TouchableOpacity onPress={() => setRefFile(null)}>
                            <Feather name="x" size={14} color={colors.mutedForeground} />
                          </TouchableOpacity>
                        )}
                      </TouchableOpacity>
                    )}

                    {/* Link URL */}
                    {refMode === "link" && (
                      <TextInput style={[styles.refInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
                        value={refUrl} onChangeText={setRefUrl} placeholder="https://drive.google.com/..." placeholderTextColor={colors.mutedForeground}
                        autoCapitalize="none" autoCorrect={false} keyboardType="url" />
                    )}

                    <TextInput style={[styles.refInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
                      value={refTitle} onChangeText={setRefTitle} placeholder="Title *" placeholderTextColor={colors.mutedForeground} />
                    <TextInput style={[styles.refInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
                      value={refNote} onChangeText={setRefNote} placeholder="Note for editor (optional)" placeholderTextColor={colors.mutedForeground} multiline />
                    <TouchableOpacity onPress={handleAddRef} disabled={addingRef}
                      style={[styles.refSaveBtn, { backgroundColor: addingRef ? colors.muted : colors.primary }]}>
                      {addingRef ? <ActivityIndicator color="#fff" size="small" />
                        : <Text style={styles.refSaveBtnText}>Save Reference</Text>}
                    </TouchableOpacity>
                  </View>
                )}
              </>
            }
            renderItem={({ item }) => (
              <View style={[styles.refCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.refIcon, { backgroundColor: item.fileName ? `${colors.adminPrimary ?? colors.primary}15` : `${colors.primary}15` }]}>
                  <Feather name={item.fileName ? "file" : "link"} size={14} color={item.fileName ? (colors.adminPrimary ?? colors.primary) : colors.primary} />
                </View>
                <View style={styles.refContent}>
                  <Text style={[styles.refTitle, { color: colors.foreground }]}>{item.title}</Text>
                  {item.fileName && (
                    <Text style={[styles.refUrl, { color: colors.adminPrimary ?? colors.primary }]} numberOfLines={1}>📎 {item.fileName}</Text>
                  )}
                  {item.url && (
                    <TouchableOpacity onPress={() => Linking.openURL(item.url!).catch(() => {})}>
                      <Text style={[styles.refUrl, { color: colors.primary }]} numberOfLines={1}>{item.url}</Text>
                    </TouchableOpacity>
                  )}
                  {item.note && <Text style={[styles.refNote, { color: colors.mutedForeground }]}>{item.note}</Text>}
                </View>
                <TouchableOpacity onPress={() => handleDeleteRef(item)} style={styles.refDelete}>
                  <Feather name="trash-2" size={15} color={colors.destructive} />
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={
              refsLoading ? (
                <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />
              ) : (
                <View style={[styles.emptyRefs, { borderColor: colors.border }]}>
                  <Feather name="link-2" size={24} color={colors.mutedForeground} />
                  <Text style={[styles.emptyRefsText, { color: colors.mutedForeground }]}>No references added yet</Text>
                </View>
              )
            }
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          />
        </View>
      </View>
      <ChatModal
        visible={chatOpen}
        onClose={() => setChatOpen(false)}
        project={project}
        currentUserId="admin"
        currentUserName="Divyashakti Admin"
        role="admin"
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: { flexDirection: "row", alignItems: "center", margin: 16, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, gap: 8 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  filterList: { maxHeight: 44 },
  filterContent: { paddingHorizontal: 16, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  loader: { flex: 1, alignItems: "center", paddingTop: 60 },
  listContent: { paddingHorizontal: 16, paddingTop: 12 },
  empty: { alignItems: "center", padding: 40, borderRadius: 16, borderWidth: 1, gap: 8, margin: 16 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  // Modal
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
  modalSheet: { maxHeight: "92%", borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: "hidden" },
  modalTop: { paddingBottom: 16, paddingHorizontal: 16 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#e2e8f0", alignSelf: "center", marginVertical: 12 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  modalTitleBlock: { flex: 1, gap: 3 },
  modalTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  modalProjectName: { fontSize: 16, fontFamily: "Inter_700Bold", flex: 1 },
  modalClientName: { fontSize: 13, fontFamily: "Inter_400Regular" },
  closeBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  detailContent: { padding: 16, gap: 12 },
  section: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionSubText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  progressBar: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  ugcPricingBox: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  ugcPricingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  ugcPricingLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  ugcPricingValue: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  ugcPricingDivider: { height: 1, marginVertical: 2 },
  ugcNetValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
  simpleValueBox: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  simpleValueText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  contactText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  callEditorBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  callEditorText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  metaText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  notesBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 10, borderRadius: 10 },
  notesText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  refsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  addRefBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, gap: 4 },
  addRefBtnText: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  addRefForm: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  refInput: { padding: 12, borderRadius: 10, borderWidth: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  refSaveBtn: { padding: 12, borderRadius: 12, alignItems: "center" },
  refSaveBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  refCard: { flexDirection: "row", alignItems: "flex-start", borderRadius: 14, borderWidth: 1, padding: 12, gap: 10 },
  refIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  refContent: { flex: 1, gap: 3 },
  refTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  refUrl: { fontSize: 12, fontFamily: "Inter_400Regular", textDecorationLine: "underline" },
  refNote: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  refDelete: { padding: 4 },
  emptyRefs: { alignItems: "center", padding: 24, borderRadius: 14, borderWidth: 1, gap: 6 },
  emptyRefsText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  refFormHeader: { fontSize: 14, fontFamily: "Inter_700Bold" },
  filePickBtn: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
  filePickName: { fontSize: 13, fontFamily: "Inter_500Medium" },
  filePickSize: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  filePickPlaceholder: { fontSize: 13, fontFamily: "Inter_400Regular" },
});
