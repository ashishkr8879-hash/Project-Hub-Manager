import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { DatePickerModal } from "@/components/DatePickerModal";
import { useColors } from "@/hooks/useColors";
import {
  createProject,
  addReference,
  fetchEditors,
  fetchClients,
  type Editor,
  type Client,
  type Project,
  type ProjectType,
} from "@/hooks/useApi";

const PROJECT_TYPES: { value: ProjectType; label: string; icon: string; tag?: string; tagColor?: string; tagText?: string }[] = [
  { value: "ugc",            label: "UGC Video",       icon: "video",          tag: "UGC",  tagColor: "#fef3c7", tagText: "#92400e" },
  { value: "ai_video",       label: "AI Video",        icon: "cpu",            tag: "AI",   tagColor: "#ede9fe", tagText: "#5b21b6" },
  { value: "editing",        label: "Editing",         icon: "scissors" },
  { value: "branded",        label: "Branded",         icon: "star" },
  { value: "corporate",      label: "Corporate",       icon: "briefcase" },
  { value: "wedding",        label: "Wedding",         icon: "heart" },
  { value: "social_media",   label: "Social Media",    icon: "instagram" },
  { value: "graphic_design", label: "Graphic Design",  icon: "pen-tool" },
  { value: "ads_setup",      label: "Ads Setup",       icon: "radio",          tag: "ADS",  tagColor: "#fce7f3", tagText: "#9d174d" },
  { value: "website",        label: "Website Dev",     icon: "globe",          tag: "WEB",  tagColor: "#d1fae5", tagText: "#065f46" },
  { value: "other",          label: "Other",           icon: "more-horizontal" },
];

const BUSINESS_TYPES = ["E-commerce", "Healthcare", "Fashion", "Food & Beverage", "Tech", "Entertainment", "Real Estate", "Education", "Fitness", "Other"];

interface RefInput { title: string; url: string; note: string; fileName?: string; fileType?: string; }

export default function CreateProjectScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  // Project fields
  const [projectType, setProjectType]             = useState<ProjectType>("ugc");
  const [selectedClient, setSelectedClient]       = useState<Client | null>(null);
  const [customClientName, setCustomClientName]   = useState("");
  const [customClientPhone, setCustomClientPhone] = useState("");
  const [customClientEmail, setCustomClientEmail] = useState("");
  const [customClientBiz, setCustomClientBiz]     = useState("Other");
  const [customClientCity, setCustomClientCity]   = useState("");
  const [showBizPicker, setShowBizPicker]         = useState(false);
  const [projectName, setProjectName]             = useState("");
  const [totalValue, setTotalValue]               = useState("");
  const [modelCost, setModelCost]                 = useState("");
  const [totalDeliverables, setTotalDeliverables] = useState("");
  const [deadline, setDeadline]                   = useState("");
  const [notes, setNotes]                         = useState("");
  const [script, setScript]                       = useState("");
  const [showDatePicker, setShowDatePicker]       = useState(false);
  const [selectedEditor, setSelectedEditor]       = useState<Editor | null>(null);
  const [submitting, setSubmitting]               = useState(false);
  const [createdProject, setCreatedProject]       = useState<Project | null>(null);

  // Reference state (after project creation)
  const [refs, setRefs]         = useState<RefInput[]>([]);
  const [addingRef, setAddingRef] = useState(false);
  const [refMode, setRefMode]   = useState<"link" | "file" | null>(null);
  const [refTitle, setRefTitle] = useState("");
  const [refUrl, setRefUrl]     = useState("");
  const [refNote, setRefNote]   = useState("");
  const [refFile, setRefFile]   = useState<{ name: string; size: string; type: string } | null>(null);
  const [savingRef, setSavingRef] = useState(false);

  const { data: editors = [], isLoading: editorsLoading } = useQuery({ queryKey: ["editors"], queryFn: fetchEditors });
  const { data: clients = [], isLoading: clientsLoading } = useQuery({ queryKey: ["clients"], queryFn: fetchClients });

  const isUGC    = projectType === "ugc";
  const isAI     = projectType === "ai_video";
  const tv       = parseFloat(totalValue) || 0;
  const mc       = parseFloat(modelCost) || 0;
  const netPayout = tv - mc;

  function resetForm() {
    setProjectType("ugc"); setSelectedClient(null);
    setCustomClientName(""); setCustomClientPhone(""); setCustomClientEmail(""); setCustomClientBiz("Other"); setCustomClientCity("");
    setProjectName(""); setTotalValue(""); setModelCost(""); setTotalDeliverables("");
    setDeadline(""); setNotes(""); setScript(""); setSelectedEditor(null);
    setRefs([]); setCreatedProject(null); setAddingRef(false); setRefMode(null);
    setRefTitle(""); setRefUrl(""); setRefNote(""); setRefFile(null);
  }

  async function handleSubmit() {
    const clientName = selectedClient?.name ?? customClientName.trim();
    if (!clientName || !projectName.trim() || !totalValue || !totalDeliverables || !selectedEditor) {
      Alert.alert("Missing Fields", "Please fill in all required fields and select an editor.");
      return;
    }
    if (isUGC && !modelCost) {
      Alert.alert("Missing Fields", "Please enter the model cost for UGC projects.");
      return;
    }
    setSubmitting(true);
    try {
      const proj = await createProject({
        clientId: selectedClient?.id,
        clientName,
        clientPhone: (selectedClient?.phone ?? customClientPhone.trim()) || undefined,
        clientEmail: (selectedClient?.email ?? customClientEmail.trim()) || undefined,
        clientBusinessType: selectedClient ? undefined : customClientBiz,
        clientCity: selectedClient ? undefined : customClientCity.trim() || undefined,
        projectName: projectName.trim(),
        projectType,
        totalValue: tv,
        modelCost: (isUGC || isAI) ? mc : 0,
        totalDeliverables: parseInt(totalDeliverables, 10),
        editorId: selectedEditor.id,
        deadline: deadline.trim() || undefined,
        notes: notes.trim() || undefined,
        script: script.trim() || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
      await queryClient.invalidateQueries({ queryKey: ["editor-projects"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-profile"] });
      await queryClient.invalidateQueries({ queryKey: ["clients"] });
      setCreatedProject(proj);
    } catch (e: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to create project");
    } finally { setSubmitting(false); }
  }

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
    if (!refTitle.trim() || !createdProject) return;
    if (refMode === "link" && !refUrl.trim()) { Alert.alert("Required", "Please enter a link URL"); return; }
    if (refMode === "file" && !refFile) { Alert.alert("Required", "Please pick a file first"); return; }
    setSavingRef(true);
    try {
      await addReference(createdProject.id, {
        title: refTitle.trim(),
        url: refMode === "link" ? refUrl.trim() : undefined,
        note: refNote.trim(),
        fileName: refMode === "file" ? refFile?.name : undefined,
        fileType: refMode === "file" ? refFile?.type : undefined,
      });
      setRefs((prev) => [...prev, { title: refTitle.trim(), url: refMode === "link" ? refUrl.trim() : "", note: refNote.trim(), fileName: refFile?.name, fileType: refFile?.type }]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setRefTitle(""); setRefUrl(""); setRefNote(""); setRefFile(null); setAddingRef(false); setRefMode(null);
      await queryClient.invalidateQueries({ queryKey: ["project-refs", createdProject.id] });
    } catch { Alert.alert("Error", "Could not save reference"); }
    finally { setSavingRef(false); }
  }

  // ── Success / Reference Upload state ──────────────────────────────────────────
  if (createdProject) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 100 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.successCard, { backgroundColor: "#dcfce7", borderColor: "#86efac" }]}>
          <Feather name="check-circle" size={28} color="#166534" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.successTitle, { color: "#166534" }]}>Project Created!</Text>
            <Text style={[styles.successSub, { color: "#166534" }]}>
              "{createdProject.projectName}" assigned to {createdProject.editorName}. Editor has been notified.
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 16 }]}>
          ADD REFERENCE FILES (OPTIONAL)
        </Text>
        <Text style={[styles.refHint, { color: colors.mutedForeground }]}>
          Upload files or add links for the editor — briefs, style guides, scripts, etc.
        </Text>

        {/* Saved refs */}
        {refs.map((r, i) => (
          <View key={i} style={[styles.savedRef, { backgroundColor: `${colors.primary}08`, borderColor: `${colors.primary}25` }]}>
            <Feather name={r.fileName ? "file" : "link"} size={14} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.savedRefTitle, { color: colors.foreground }]}>{r.title}</Text>
              {r.fileName && <Text style={[styles.savedRefUrl, { color: colors.primary }]} numberOfLines={1}>📎 {r.fileName}</Text>}
              {r.url ? <Text style={[styles.savedRefUrl, { color: colors.primary }]} numberOfLines={1}>{r.url}</Text> : null}
              {r.note ? <Text style={[styles.savedRefNote, { color: colors.mutedForeground }]} numberOfLines={1}>{r.note}</Text> : null}
            </View>
          </View>
        ))}

        {/* Mode picker (if not in add mode) */}
        {!addingRef && (
          <View style={styles.refModeRow}>
            <TouchableOpacity
              onPress={() => { setAddingRef(true); setRefMode("file"); }}
              style={[styles.refModeBtn, { backgroundColor: `${colors.adminPrimary}10`, borderColor: `${colors.adminPrimary}30` }]}
            >
              <Feather name="upload" size={16} color={colors.adminPrimary} />
              <Text style={[styles.refModeBtnText, { color: colors.adminPrimary }]}>Upload File</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setAddingRef(true); setRefMode("link"); }}
              style={[styles.refModeBtn, { backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}30` }]}
            >
              <Feather name="link" size={16} color={colors.primary} />
              <Text style={[styles.refModeBtnText, { color: colors.primary }]}>Add Link</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Add ref form */}
        {addingRef && refMode && (
          <View style={[styles.refForm, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.refFormTitle, { color: colors.foreground }]}>
              {refMode === "file" ? "📎 Upload Reference File" : "🔗 Add Reference Link"}
            </Text>

            {/* File picker */}
            {refMode === "file" && (
              <TouchableOpacity
                onPress={handlePickRefFile}
                style={[styles.filePickBtn, { backgroundColor: refFile ? `${colors.adminPrimary}10` : colors.muted, borderColor: refFile ? colors.adminPrimary : colors.border }]}
              >
                <Feather name={refFile ? "check-circle" : "upload"} size={18} color={refFile ? colors.adminPrimary : colors.mutedForeground} />
                <View style={{ flex: 1 }}>
                  {refFile ? (
                    <>
                      <Text style={[styles.filePickName, { color: colors.foreground }]} numberOfLines={1}>{refFile.name}</Text>
                      <Text style={[styles.filePickSize, { color: colors.mutedForeground }]}>{refFile.size}</Text>
                    </>
                  ) : (
                    <Text style={[styles.filePickPlaceholder, { color: colors.mutedForeground }]}>Tap to pick a file from device</Text>
                  )}
                </View>
                {refFile && (
                  <TouchableOpacity onPress={() => setRefFile(null)}>
                    <Feather name="x" size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            )}

            {/* Link URL */}
            {refMode === "link" && (
              <InputField label="URL *" value={refUrl} onChangeText={setRefUrl} placeholder="https://drive.google.com/..." colors={colors} />
            )}

            <InputField label="Title *" value={refTitle} onChangeText={setRefTitle} placeholder="e.g. Brand Guidelines" colors={colors} />
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Note (optional)</Text>
              <TextInput
                style={[styles.input, styles.textAreaSm, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                value={refNote} onChangeText={setRefNote}
                placeholder="Instructions or context for editor"
                placeholderTextColor={colors.mutedForeground} multiline numberOfLines={3}
              />
            </View>

            <View style={styles.refFormBtns}>
              <TouchableOpacity onPress={() => { setAddingRef(false); setRefMode(null); setRefTitle(""); setRefUrl(""); setRefNote(""); setRefFile(null); }}
                style={[styles.refCancelBtn, { borderColor: colors.border }]}>
                <Text style={[styles.refCancelText, { color: colors.mutedForeground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddRef} disabled={savingRef || !refTitle.trim()}
                style={[styles.refSaveBtn, { backgroundColor: !refTitle.trim() ? colors.muted : colors.adminPrimary }]}>
                {savingRef ? <ActivityIndicator size="small" color="#fff" /> :
                  <><Feather name="save" size={14} color="#fff" /><Text style={styles.refSaveText}>Save</Text></>}
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TouchableOpacity onPress={resetForm}
          style={[styles.newProjectBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Feather name="plus-circle" size={16} color={colors.foreground} />
          <Text style={[styles.newProjectText, { color: colors.foreground }]}>Create Another Project</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ── Create Form ────────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 100 }]}
      keyboardShouldPersistTaps="handled"
    >
      {/* Project Type */}
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>PROJECT TYPE *</Text>
      <View style={styles.typeGrid}>
        {PROJECT_TYPES.map((t) => {
          const active = projectType === t.value;
          return (
            <TouchableOpacity key={t.value} onPress={() => setProjectType(t.value)}
              style={[styles.typeChip,
                { backgroundColor: active ? `${colors.primary}15` : colors.card, borderColor: active ? colors.primary : colors.border, borderWidth: active ? 2 : 1 }]}>
              <Feather name={t.icon as never} size={15} color={active ? colors.primary : colors.mutedForeground} />
              <Text style={[styles.typeLabel, { color: active ? colors.primary : colors.foreground }]}>{t.label}</Text>
              {t.tag && (
                <View style={[styles.typeTag, { backgroundColor: t.tagColor }]}>
                  <Text style={[styles.typeTagText, { color: t.tagText }]}>{t.tag}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {isUGC && (
        <View style={[styles.notice, { backgroundColor: "#fef9c3", borderColor: "#fde047" }]}>
          <Feather name="info" size={14} color="#a16207" />
          <Text style={[styles.noticeText, { color: "#92400e" }]}>UGC project — model cost will be deducted to show net editor payout.</Text>
        </View>
      )}
      {isAI && (
        <View style={[styles.notice, { backgroundColor: "#ede9fe", borderColor: "#c4b5fd" }]}>
          <Feather name="cpu" size={14} color="#5b21b6" />
          <Text style={[styles.noticeText, { color: "#5b21b6" }]}>AI Video project — include model/tool cost if applicable.</Text>
        </View>
      )}

      {/* ── Client Selection ─────────────────────────────────────────────────── */}
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 8 }]}>CLIENT *</Text>
      {clientsLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.clientScroll} contentContainerStyle={styles.clientScrollContent}>
            {clients.map((c) => {
              const active = selectedClient?.id === c.id;
              const ci = c.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
              return (
                <TouchableOpacity key={c.id} onPress={() => { setSelectedClient(active ? null : c); setCustomClientName(""); }}
                  style={[styles.clientChip, { backgroundColor: active ? `${colors.primary}12` : colors.card, borderColor: active ? colors.primary : colors.border, borderWidth: active ? 2 : 1 }]}>
                  <View style={[styles.clientChipAvatar, { backgroundColor: active ? `${colors.primary}22` : colors.muted }]}>
                    <Text style={[styles.clientChipInitials, { color: active ? colors.primary : colors.mutedForeground }]}>{ci}</Text>
                  </View>
                  <Text style={[styles.clientChipName, { color: active ? colors.primary : colors.foreground }]} numberOfLines={1}>{c.name}</Text>
                  <Text style={[styles.clientChipBiz, { color: colors.mutedForeground }]} numberOfLines={1}>{c.businessType}</Text>
                  {active && <Feather name="check-circle" size={14} color={colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {!selectedClient && (
            <View style={[styles.newClientBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.newClientTitle, { color: colors.foreground }]}>+ New Client Details</Text>
              <InputField label="Client Name *" value={customClientName} onChangeText={setCustomClientName} placeholder="e.g. StyleBrand Co." colors={colors} />
              <View style={styles.row}>
                <View style={styles.halfField}>
                  <InputField label="Phone" value={customClientPhone} onChangeText={setCustomClientPhone} placeholder="+91 98765 00000" colors={colors} />
                </View>
                <View style={styles.halfField}>
                  <InputField label="City" value={customClientCity} onChangeText={setCustomClientCity} placeholder="Mumbai" colors={colors} />
                </View>
              </View>
              <InputField label="Email" value={customClientEmail} onChangeText={setCustomClientEmail} placeholder="client@brand.com" colors={colors} />

              {/* Business Type picker */}
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Business Type</Text>
                <TouchableOpacity
                  onPress={() => setShowBizPicker(!showBizPicker)}
                  style={[styles.input, styles.pickerRow, { backgroundColor: colors.background, borderColor: colors.border }]}
                >
                  <Text style={{ color: colors.foreground, fontFamily: "Inter_400Regular", fontSize: 14, flex: 1 }}>{customClientBiz}</Text>
                  <Feather name={showBizPicker ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
                {showBizPicker && (
                  <View style={[styles.bizDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    {BUSINESS_TYPES.map((b) => (
                      <TouchableOpacity key={b} onPress={() => { setCustomClientBiz(b); setShowBizPicker(false); }}
                        style={[styles.bizOption, { backgroundColor: customClientBiz === b ? `${colors.primary}12` : "transparent" }]}>
                        <Text style={[styles.bizOptionText, { color: customClientBiz === b ? colors.primary : colors.foreground }]}>{b}</Text>
                        {customClientBiz === b && <Feather name="check" size={14} color={colors.primary} />}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}
        </>
      )}

      {/* ── Project Details ──────────────────────────────────────────────────── */}
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 8 }]}>PROJECT DETAILS</Text>
      <InputField label="Project Name *" value={projectName} onChangeText={setProjectName} placeholder="e.g. Brand Video Series" colors={colors} />

      <View style={styles.row}>
        <View style={styles.halfField}>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Total Value (₹) *</Text>
          <View style={[styles.inputWithPrefix, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.inputPrefix, { color: colors.mutedForeground }]}>₹</Text>
            <TextInput style={[styles.inputInner, { color: colors.foreground }]}
              value={totalValue} onChangeText={setTotalValue} placeholder="5000" placeholderTextColor={colors.mutedForeground} keyboardType="numeric" />
          </View>
        </View>
        <View style={styles.halfField}>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>No. of Videos *</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            value={totalDeliverables} onChangeText={setTotalDeliverables} placeholder="4" placeholderTextColor={colors.mutedForeground} keyboardType="numeric" />
        </View>
      </View>

      {(isUGC || isAI) && (
        <>
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: isUGC ? "#b45309" : "#5b21b6" }]}>
              {isUGC ? "Model Cost (₹) *" : "AI Tool Cost (₹)"}{" "}
              <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular" }}>(will be deducted)</Text>
            </Text>
            <View style={[styles.inputWithPrefix, { backgroundColor: isUGC ? "#fef9c3" : "#ede9fe", borderColor: isUGC ? "#fde047" : "#c4b5fd" }]}>
              <Text style={[styles.inputPrefix, { color: isUGC ? "#a16207" : "#5b21b6" }]}>₹</Text>
              <TextInput style={[styles.inputInner, { color: colors.foreground }]}
                value={modelCost} onChangeText={setModelCost} placeholder="e.g. 2500" placeholderTextColor={colors.mutedForeground} keyboardType="numeric" />
            </View>
          </View>
          {tv > 0 && mc > 0 && (
            <View style={[styles.payoutBox, { backgroundColor: "#dcfce7", borderColor: "#bbf7d0" }]}>
              <Feather name="trending-up" size={16} color="#166534" />
              <Text style={[styles.payoutText, { color: "#166534" }]}>
                Net Payout: <Text style={styles.payoutValue}>₹{netPayout.toLocaleString("en-IN")}</Text>
                <Text style={{ fontSize: 12 }}> (₹{tv.toLocaleString("en-IN")} – ₹{mc.toLocaleString("en-IN")} cost)</Text>
              </Text>
            </View>
          )}
        </>
      )}

      {/* ── Deadline ─────────────────────────────────────────────────────────── */}
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 8 }]}>DEADLINE *</Text>
      <TouchableOpacity
        onPress={() => setShowDatePicker(true)}
        style={[styles.datePickerBtn, { backgroundColor: colors.card, borderColor: deadline ? colors.primary : colors.border, borderWidth: deadline ? 2 : 1 }]}
      >
        <Feather name="calendar" size={16} color={deadline ? colors.primary : colors.mutedForeground} />
        <Text style={[styles.datePickerText, { color: deadline ? colors.foreground : colors.mutedForeground }]}>
          {deadline ? new Date(deadline).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "Tap to pick a deadline date"}
        </Text>
        {deadline && (
          <TouchableOpacity onPress={() => setDeadline("")}>
            <Feather name="x" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* ── Script ───────────────────────────────────────────────────────────── */}
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 8 }]}>SCRIPT (OPTIONAL)</Text>
      <View style={styles.field}>
        <TextInput style={[styles.input, styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          value={script} onChangeText={setScript}
          placeholder="Paste or type the video script here..."
          placeholderTextColor={colors.mutedForeground} multiline numberOfLines={5} />
      </View>

      {/* ── Notes ────────────────────────────────────────────────────────────── */}
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 8 }]}>NOTES FOR EDITOR</Text>
      <View style={styles.field}>
        <TextInput style={[styles.input, styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          value={notes} onChangeText={setNotes}
          placeholder="Instructions, style guidelines, model details..."
          placeholderTextColor={colors.mutedForeground} multiline numberOfLines={4} />
      </View>

      {/* ── Assign Editor ────────────────────────────────────────────────────── */}
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 8 }]}>ASSIGN EDITOR *</Text>
      {editorsLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
      ) : (
        <View style={styles.editorList}>
          {editors.map((editor) => {
            const active = selectedEditor?.id === editor.id;
            const initials = editor.name.split(" ").map((w) => w[0]).join("").toUpperCase();
            return (
              <TouchableOpacity key={editor.id} activeOpacity={0.75} onPress={() => setSelectedEditor(editor)}
                style={[styles.editorChip, { backgroundColor: active ? `${colors.primary}12` : colors.card, borderColor: active ? colors.primary : colors.border, borderWidth: active ? 2 : 1 }]}>
                <View style={[styles.editorAvatar, { backgroundColor: active ? `${colors.primary}22` : colors.muted }]}>
                  <Text style={[styles.editorInitials, { color: active ? colors.primary : colors.mutedForeground }]}>{initials}</Text>
                </View>
                <View style={styles.editorInfo}>
                  <Text style={[styles.editorName, { color: active ? colors.primary : colors.foreground }]}>{editor.name}</Text>
                  <Text style={[styles.editorSpec, { color: colors.mutedForeground }]}>{editor.specialization}</Text>
                </View>
                {active && <Feather name="check-circle" size={18} color={colors.primary} />}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <TouchableOpacity activeOpacity={0.8} onPress={handleSubmit} disabled={submitting}
        style={[styles.submitBtn, { backgroundColor: submitting ? colors.muted : colors.primary }]}>
        {submitting ? <ActivityIndicator color="#fff" />
          : <><Feather name="plus" size={18} color="#fff" /><Text style={styles.submitText}>Create Project & Notify Editor</Text></>}
      </TouchableOpacity>

      <DatePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        selected={deadline}
        onSelect={(d) => setDeadline(d)}
      />
    </ScrollView>
  );
}

function InputField({ label, value, onChangeText, placeholder, colors }: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder: string; colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{label}</Text>
      <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
        value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.mutedForeground} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, gap: 10 },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1.2, marginBottom: 2 },
  // Success
  successCard: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 16, borderRadius: 16, borderWidth: 1 },
  successTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  successSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2, lineHeight: 18 },
  refHint: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 6 },
  savedRef: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
  savedRefTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  savedRefUrl: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  savedRefNote: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#6b7280" },
  refModeRow: { flexDirection: "row", gap: 10 },
  refModeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderStyle: "dashed" },
  refModeBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  refForm: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  refFormTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  filePickBtn: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 12, borderWidth: 1 },
  filePickName: { fontSize: 13, fontFamily: "Inter_500Medium" },
  filePickSize: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  filePickPlaceholder: { fontSize: 13, fontFamily: "Inter_400Regular" },
  refFormBtns: { flexDirection: "row", gap: 8 },
  refCancelBtn: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  refCancelText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  refSaveBtn: { flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 12, borderRadius: 12, gap: 6 },
  refSaveText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  newProjectBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, borderRadius: 14, borderWidth: 1, marginTop: 4 },
  newProjectText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  // New Client box
  newClientBox: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 6 },
  newClientTitle: { fontSize: 14, fontFamily: "Inter_700Bold", marginBottom: 4 },
  // Form
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeChip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 6 },
  typeLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  typeTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  typeTagText: { fontSize: 9, fontFamily: "Inter_700Bold" },
  notice: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 10, borderRadius: 12, borderWidth: 1 },
  noticeText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 17 },
  clientScroll: { marginBottom: 8 },
  clientScrollContent: { gap: 8, paddingBottom: 4 },
  clientChip: { alignItems: "center", width: 110, padding: 10, borderRadius: 14, gap: 4 },
  clientChipAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  clientChipInitials: { fontSize: 13, fontFamily: "Inter_700Bold" },
  clientChipName: { fontSize: 12, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  clientChipBiz: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center" },
  field: { gap: 4 },
  fieldLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  row: { flexDirection: "row", gap: 10 },
  halfField: { flex: 1 },
  input: { padding: 12, borderRadius: 12, borderWidth: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  inputWithPrefix: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 12 },
  inputPrefix: { fontSize: 16, fontFamily: "Inter_600SemiBold", marginRight: 4 },
  inputInner: { flex: 1, padding: 12, paddingLeft: 0, fontSize: 14, fontFamily: "Inter_400Regular" },
  pickerRow: { flexDirection: "row", alignItems: "center" },
  bizDropdown: { borderRadius: 12, borderWidth: 1, marginTop: 4, overflow: "hidden" },
  bizOption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 10 },
  bizOptionText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  textArea: { height: 100, textAlignVertical: "top" },
  textAreaSm: { height: 72, textAlignVertical: "top" },
  payoutBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 12, borderWidth: 1 },
  payoutText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  payoutValue: { fontFamily: "Inter_700Bold" },
  datePickerBtn: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 14 },
  datePickerText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  editorList: { gap: 8 },
  editorChip: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 14, gap: 10 },
  editorAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  editorInitials: { fontSize: 14, fontFamily: "Inter_700Bold" },
  editorInfo: { flex: 1 },
  editorName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  editorSpec: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 16, borderRadius: 16, marginTop: 8 },
  submitText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
});
