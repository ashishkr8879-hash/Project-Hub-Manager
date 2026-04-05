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
  fetchEditors,
  fetchProjectReferences,
  addReference,
  deleteReference,
  updateProject,
  deleteProject,
  type Project,
  type Editor,
  type ProjectReference,
  type ProjectType,
} from "@/hooks/useApi";
import { ScrollView } from "react-native";

async function safeOpenUrl(url?: string | null) {
  if (!url || !/^https?:\/\//i.test(url)) {
    if (Platform.OS !== "web") Alert.alert("Cannot open", "This item does not have a valid web link.");
    return;
  }
  try { await Linking.openURL(url); } catch {
    if (Platform.OS !== "web") Alert.alert("Cannot open", "Unable to open this link on your device.");
  }
}

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
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [search, setSearch] = useState("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

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
          onEdit={() => { setEditingProject(selectedProject); setSelectedProject(null); }}
          onDelete={() => {
            Alert.alert("Delete Project", `Delete "${selectedProject.projectName}"? This cannot be undone.`, [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete", style: "destructive",
                onPress: async () => {
                  try {
                    await deleteProject(selectedProject.id);
                    setSelectedProject(null);
                    await queryClient.invalidateQueries({ queryKey: ["projects"] });
                    await queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
                  } catch { Alert.alert("Error", "Could not delete project"); }
                },
              },
            ]);
          }}
        />
      )}

      {editingProject && (
        <EditProjectModal
          project={editingProject}
          colors={colors}
          insets={insets}
          onClose={() => setEditingProject(null)}
          onSaved={(updated) => {
            setEditingProject(null);
            setSelectedProject(updated);
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
          }}
        />
      )}
    </View>
  );
}

function ProjectDetailModal({
  project, colors, insets, onClose, onEdit, onDelete,
}: {
  project: Project;
  colors: ReturnType<typeof useColors>;
  insets: ReturnType<typeof import("react-native-safe-area-context").useSafeAreaInsets>;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
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

  const netProfit = project.totalValue - (project.modelCost || 0) - (project.editorCost || 0);

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
              <View style={{ flexDirection: "row", gap: 6 }}>
                <TouchableOpacity
                  onPress={() => setChatOpen(true)}
                  style={[styles.closeBtn, { backgroundColor: project.revisionRequested ? "#fef3c7" : `${colors.adminPrimary}15` }]}
                >
                  <Feather name="message-circle" size={18} color={project.revisionRequested ? "#b45309" : colors.adminPrimary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={onEdit} style={[styles.closeBtn, { backgroundColor: `${colors.primary}15` }]}>
                  <Feather name="edit-2" size={16} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={onDelete} style={[styles.closeBtn, { backgroundColor: `${colors.destructive}15` }]}>
                  <Feather name="trash-2" size={16} color={colors.destructive} />
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

                {/* Financial Breakdown */}
                <View style={[styles.ugcPricingBox, { backgroundColor: "#fef9c3", borderColor: "#fde047" }]}>
                  <View style={styles.ugcPricingRow}>
                    <Text style={[styles.ugcPricingLabel, { color: "#92400e" }]}>Total Value</Text>
                    <Text style={[styles.ugcPricingValue, { color: colors.foreground }]}>₹{project.totalValue.toLocaleString()}</Text>
                  </View>
                  {(project.modelCost || 0) > 0 && (
                    <View style={styles.ugcPricingRow}>
                      <Text style={[styles.ugcPricingLabel, { color: "#b91c1c" }]}>– Model Cost</Text>
                      <Text style={[styles.ugcPricingValue, { color: "#b91c1c" }]}>–₹{project.modelCost.toLocaleString()}</Text>
                    </View>
                  )}
                  {(project.editorCost || 0) > 0 && (
                    <View style={styles.ugcPricingRow}>
                      <Text style={[styles.ugcPricingLabel, { color: "#7c3aed" }]}>– Editor Cost</Text>
                      <Text style={[styles.ugcPricingValue, { color: "#7c3aed" }]}>–₹{(project.editorCost || 0).toLocaleString()}</Text>
                    </View>
                  )}
                  <View style={[styles.ugcPricingDivider, { backgroundColor: "#fde047" }]} />
                  <View style={styles.ugcPricingRow}>
                    <Text style={[styles.ugcPricingLabel, { color: "#166534", fontFamily: "Inter_700Bold" }]}>Company Net Profit</Text>
                    <Text style={[styles.ugcNetValue, { color: netProfit >= 0 ? "#15803d" : "#b91c1c" }]}>₹{netProfit.toLocaleString()}</Text>
                  </View>
                </View>

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
                    <TouchableOpacity onPress={() => safeOpenUrl(item.url)}>
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

const PROJECT_TYPES: { value: ProjectType; label: string }[] = [
  { value: "ugc", label: "UGC" },
  { value: "ai_video", label: "AI Video" },
  { value: "editing", label: "Editing" },
  { value: "branded", label: "Branded" },
  { value: "corporate", label: "Corporate" },
  { value: "wedding", label: "Wedding" },
  { value: "social_media", label: "Social Media" },
  { value: "graphic_design", label: "Graphic Design" },
  { value: "ads_setup", label: "Ads Setup" },
  { value: "website", label: "Website" },
  { value: "other", label: "Other" },
];

function EditProjectModal({
  project, colors, insets, onClose, onSaved,
}: {
  project: Project;
  colors: ReturnType<typeof useColors>;
  insets: ReturnType<typeof import("react-native-safe-area-context").useSafeAreaInsets>;
  onClose: () => void;
  onSaved: (updated: Project) => void;
}) {
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [projectName, setProjectName] = useState(project.projectName);
  const [clientName, setClientName] = useState(project.clientName);
  const [clientPhone, setClientPhone] = useState(project.clientPhone || "");
  const [clientEmail, setClientEmail] = useState(project.clientEmail || "");
  const [totalValue, setTotalValue] = useState(String(project.totalValue));
  const [modelCost, setModelCost] = useState(String(project.modelCost || 0));
  const [editorCost, setEditorCost] = useState(String(project.editorCost || 0));
  const [totalDeliverables, setTotalDeliverables] = useState(String(project.totalDeliverables));
  const [deadline, setDeadline] = useState(
    project.deadline ? new Date(project.deadline).toISOString().split("T")[0] : ""
  );
  const [notes, setNotes] = useState(project.notes || "");
  const [script, setScript] = useState(project.script || "");
  const [selectedEditorId, setSelectedEditorId] = useState(project.editorId);
  const [projectType, setProjectType] = useState<ProjectType>(project.projectType);
  const [showEditorPicker, setShowEditorPicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: editors = [] } = useQuery({ queryKey: ["editors"], queryFn: fetchEditors });

  const selectedEditor = editors.find((e: Editor) => e.id === selectedEditorId);

  // Auto-suggest editorCost when editor changes
  function suggestEditorCost(editorId: string) {
    const editor = editors.find((e: Editor) => e.id === editorId);
    if (editor?.monthlySalary) {
      const activeCount = Math.max(1, editors.length);
      const suggested = Math.round(editor.monthlySalary / 30 / activeCount);
      setEditorCost(String(suggested));
    }
  }

  async function handleSave() {
    if (!projectName.trim()) { Alert.alert("Required", "Project name is required"); return; }
    if (!clientName.trim()) { Alert.alert("Required", "Client name is required"); return; }
    const tv = parseFloat(totalValue);
    if (isNaN(tv) || tv < 0) { Alert.alert("Invalid", "Enter a valid total value"); return; }
    setSaving(true);
    try {
      const updated = await updateProject(project.id, {
        projectName: projectName.trim(),
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim() || undefined,
        clientEmail: clientEmail.trim() || undefined,
        totalValue: tv,
        modelCost: parseFloat(modelCost) || 0,
        editorCost: parseFloat(editorCost) || 0,
        totalDeliverables: parseInt(totalDeliverables) || project.totalDeliverables,
        editorId: selectedEditorId,
        deadline: deadline.trim() || undefined,
        notes: notes.trim() || undefined,
        script: script.trim() || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSaved(updated);
    } catch (e: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to update project");
    } finally { setSaving(false); }
  }

  const selectedTypeLabel = PROJECT_TYPES.find(t => t.value === projectType)?.label ?? projectType;

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: colors.background, paddingBottom: bottomPad }]}>
          {/* Header */}
          <View style={[styles.modalTop, { backgroundColor: colors.card }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleBlock}>
                <Text style={[styles.modalProjectName, { color: colors.foreground }]}>Edit Project</Text>
                <Text style={[styles.modalClientName, { color: colors.mutedForeground }]}>{project.projectName}</Text>
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.muted }]}>
                  <Feather name="x" size={18} color={colors.foreground} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <ScrollView contentContainerStyle={[styles.detailContent, { paddingBottom: 24 }]} keyboardShouldPersistTaps="handled">
            {/* Project Name */}
            <View style={[styles.editSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.editLabel, { color: colors.mutedForeground }]}>Project Name *</Text>
              <TextInput
                style={[styles.editInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
                value={projectName} onChangeText={setProjectName} placeholder="Project name"
                placeholderTextColor={colors.mutedForeground}
              />
              <Text style={[styles.editLabel, { color: colors.mutedForeground, marginTop: 10 }]}>Client Name *</Text>
              <TextInput
                style={[styles.editInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
                value={clientName} onChangeText={setClientName} placeholder="Client name"
                placeholderTextColor={colors.mutedForeground}
              />
              <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.editLabel, { color: colors.mutedForeground }]}>Phone</Text>
                  <TextInput
                    style={[styles.editInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
                    value={clientPhone} onChangeText={setClientPhone} placeholder="+91 ..."
                    placeholderTextColor={colors.mutedForeground} keyboardType="phone-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.editLabel, { color: colors.mutedForeground }]}>Email</Text>
                  <TextInput
                    style={[styles.editInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
                    value={clientEmail} onChangeText={setClientEmail} placeholder="email@..."
                    placeholderTextColor={colors.mutedForeground} keyboardType="email-address" autoCapitalize="none"
                  />
                </View>
              </View>
            </View>

            {/* Project Type */}
            <View style={[styles.editSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.editLabel, { color: colors.mutedForeground }]}>Project Type</Text>
              <TouchableOpacity
                style={[styles.pickerBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
                onPress={() => setShowTypePicker((v) => !v)}
              >
                <Text style={[styles.pickerBtnText, { color: colors.foreground }]}>{selectedTypeLabel}</Text>
                <Feather name={showTypePicker ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
              {showTypePicker && (
                <View style={[styles.pickerList, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                  {PROJECT_TYPES.map((t) => (
                    <TouchableOpacity key={t.value} style={styles.pickerItem}
                      onPress={() => { setProjectType(t.value); setShowTypePicker(false); }}>
                      <Text style={[styles.pickerItemText, {
                        color: t.value === projectType ? colors.primary : colors.foreground,
                        fontFamily: t.value === projectType ? "Inter_700Bold" : "Inter_400Regular",
                      }]}>{t.label}</Text>
                      {t.value === projectType && <Feather name="check" size={14} color={colors.primary} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Financials */}
            <View style={[styles.editSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.editLabel, { color: colors.mutedForeground }]}>Financial Breakdown (₹)</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.editSubLabel, { color: colors.mutedForeground }]}>Total Value *</Text>
                  <TextInput
                    style={[styles.editInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
                    value={totalValue} onChangeText={setTotalValue} keyboardType="numeric"
                    placeholder="0" placeholderTextColor={colors.mutedForeground}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.editSubLabel, { color: colors.mutedForeground }]}>Model Cost</Text>
                  <TextInput
                    style={[styles.editInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
                    value={modelCost} onChangeText={setModelCost} keyboardType="numeric"
                    placeholder="0" placeholderTextColor={colors.mutedForeground}
                  />
                </View>
              </View>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.editSubLabel, { color: "#7c3aed" }]}>Editor Cost</Text>
                  <TextInput
                    style={[styles.editInput, { backgroundColor: colors.muted, borderColor: "#7c3aed", color: colors.foreground }]}
                    value={editorCost} onChangeText={setEditorCost} keyboardType="numeric"
                    placeholder="0" placeholderTextColor={colors.mutedForeground}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.editSubLabel, { color: colors.mutedForeground }]}>Deliverables</Text>
                  <TextInput
                    style={[styles.editInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
                    value={totalDeliverables} onChangeText={setTotalDeliverables} keyboardType="numeric"
                    placeholder="1" placeholderTextColor={colors.mutedForeground}
                  />
                </View>
              </View>
              {/* Live preview */}
              {(parseFloat(totalValue) > 0) && (
                <View style={{ marginTop: 10, padding: 10, borderRadius: 10, backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#bbf7d0" }}>
                  <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: "#166534" }}>
                    Net Profit = ₹{Math.max(0, (parseFloat(totalValue) || 0) - (parseFloat(modelCost) || 0) - (parseFloat(editorCost) || 0)).toLocaleString()}
                  </Text>
                </View>
              )}
            </View>

            {/* Editor picker */}
            <View style={[styles.editSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.editLabel, { color: colors.mutedForeground }]}>Assigned Editor</Text>
              <TouchableOpacity
                style={[styles.pickerBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
                onPress={() => setShowEditorPicker((v) => !v)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pickerBtnText, { color: colors.foreground }]}>
                    {selectedEditor ? selectedEditor.name : "Select editor"}
                  </Text>
                  {selectedEditor && (
                    <Text style={{ fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
                      {selectedEditor.specialization}{selectedEditor.monthlySalary ? ` · ₹${selectedEditor.monthlySalary.toLocaleString()}/mo` : ""}
                    </Text>
                  )}
                </View>
                <Feather name={showEditorPicker ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
              {showEditorPicker && (
                <View style={[styles.pickerList, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                  {editors.map((e: Editor) => (
                    <TouchableOpacity key={e.id} style={styles.pickerItem}
                      onPress={() => {
                        setSelectedEditorId(e.id);
                        setShowEditorPicker(false);
                        suggestEditorCost(e.id);
                      }}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.pickerItemText, {
                          color: e.id === selectedEditorId ? colors.primary : colors.foreground,
                          fontFamily: e.id === selectedEditorId ? "Inter_700Bold" : "Inter_400Regular",
                        }]}>{e.name}</Text>
                        <Text style={{ fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
                          {e.specialization}{e.monthlySalary ? ` · ₹${e.monthlySalary.toLocaleString()}/mo` : ""}
                        </Text>
                      </View>
                      {e.id === selectedEditorId && <Feather name="check" size={14} color={colors.primary} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Deadline + Notes + Script */}
            <View style={[styles.editSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.editLabel, { color: colors.mutedForeground }]}>Deadline (YYYY-MM-DD)</Text>
              <TextInput
                style={[styles.editInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
                value={deadline} onChangeText={setDeadline} placeholder="2025-06-30"
                placeholderTextColor={colors.mutedForeground} autoCapitalize="none"
              />
              <Text style={[styles.editLabel, { color: colors.mutedForeground, marginTop: 10 }]}>Brief / Notes</Text>
              <TextInput
                style={[styles.editInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground, minHeight: 80 }]}
                value={notes} onChangeText={setNotes} placeholder="Brief or notes for the editor..."
                placeholderTextColor={colors.mutedForeground} multiline
              />
              <Text style={[styles.editLabel, { color: colors.mutedForeground, marginTop: 10 }]}>Script</Text>
              <TextInput
                style={[styles.editInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground, minHeight: 60 }]}
                value={script} onChangeText={setScript} placeholder="Script content (optional)"
                placeholderTextColor={colors.mutedForeground} multiline
              />
            </View>

            {/* Save */}
            <TouchableOpacity
              style={[styles.refSaveBtn, { backgroundColor: saving ? colors.muted : colors.primary, marginTop: 4 }]}
              onPress={handleSave} disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.refSaveBtnText}>Save Changes</Text>
              }
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
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
  // EditProjectModal
  editSection: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
  editLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  editSubLabel: { fontSize: 11, fontFamily: "Inter_500Medium", marginBottom: 2 },
  editInput: { padding: 11, borderRadius: 10, borderWidth: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  pickerBtn: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12, borderRadius: 10, borderWidth: 1 },
  pickerBtnText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  pickerList: { borderRadius: 10, borderWidth: 1, marginTop: 4, overflow: "hidden" },
  pickerItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#e2e8f0" },
  pickerItemText: { fontSize: 14 },
});
