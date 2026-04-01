import { Feather } from "@expo/vector-icons";
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

const PROJECT_TYPES: { value: ProjectType; label: string; icon: string; ugc?: boolean }[] = [
  { value: "ugc",          label: "UGC",         icon: "video",            ugc: true },
  { value: "branded",      label: "Branded",      icon: "star" },
  { value: "corporate",    label: "Corporate",    icon: "briefcase" },
  { value: "wedding",      label: "Wedding",      icon: "heart" },
  { value: "social_media", label: "Social Media", icon: "instagram" },
  { value: "other",        label: "Other",        icon: "more-horizontal" },
];

interface RefInput { title: string; url: string; note: string; }

export default function CreateProjectScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  // Project fields
  const [projectType, setProjectType]         = useState<ProjectType>("branded");
  const [selectedClient, setSelectedClient]   = useState<Client | null>(null);
  const [customClientName, setCustomClientName] = useState("");
  const [projectName, setProjectName]         = useState("");
  const [totalValue, setTotalValue]           = useState("");
  const [modelCost, setModelCost]             = useState("");
  const [totalDeliverables, setTotalDeliverables] = useState("");
  const [deadline, setDeadline]               = useState("");
  const [notes, setNotes]                     = useState("");
  const [selectedEditor, setSelectedEditor]   = useState<Editor | null>(null);
  const [submitting, setSubmitting]           = useState(false);
  const [createdProject, setCreatedProject]   = useState<Project | null>(null);

  // Reference upload state (after project creation)
  const [refs, setRefs]           = useState<RefInput[]>([]);
  const [addingRef, setAddingRef] = useState(false);
  const [refTitle, setRefTitle]   = useState("");
  const [refUrl, setRefUrl]       = useState("");
  const [refNote, setRefNote]     = useState("");
  const [savingRef, setSavingRef] = useState(false);

  const { data: editors = [], isLoading: editorsLoading } = useQuery({ queryKey: ["editors"], queryFn: fetchEditors });
  const { data: clients = [], isLoading: clientsLoading } = useQuery({ queryKey: ["clients"], queryFn: fetchClients });

  const isUGC    = projectType === "ugc";
  const tv       = parseFloat(totalValue) || 0;
  const mc       = parseFloat(modelCost) || 0;
  const netPayout = tv - mc;

  function resetForm() {
    setProjectType("branded"); setSelectedClient(null); setCustomClientName("");
    setProjectName(""); setTotalValue(""); setModelCost(""); setTotalDeliverables("");
    setDeadline(""); setNotes(""); setSelectedEditor(null);
    setRefs([]); setCreatedProject(null);
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
        clientPhone: selectedClient?.phone,
        clientEmail: selectedClient?.email,
        projectName: projectName.trim(),
        projectType,
        totalValue: tv,
        modelCost: isUGC ? mc : 0,
        totalDeliverables: parseInt(totalDeliverables, 10),
        editorId: selectedEditor.id,
        deadline: deadline.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
      await queryClient.invalidateQueries({ queryKey: ["editor-projects"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-profile"] });
      setCreatedProject(proj);
    } catch (e: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to create project");
    } finally { setSubmitting(false); }
  }

  async function handleAddRef() {
    if (!refTitle.trim() || !createdProject) return;
    setSavingRef(true);
    try {
      await addReference(createdProject.id, {
        title: refTitle.trim(),
        url: refUrl.trim() || undefined,
        note: refNote.trim(),
      });
      setRefs((prev) => [...prev, { title: refTitle.trim(), url: refUrl.trim(), note: refNote.trim() }]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setRefTitle(""); setRefUrl(""); setRefNote(""); setAddingRef(false);
      await queryClient.invalidateQueries({ queryKey: ["project-refs", createdProject.id] });
    } catch { Alert.alert("Error", "Could not save reference"); }
    finally { setSavingRef(false); }
  }

  // ── Success state: show reference upload panel ─────────────────────────────
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

        {/* Reference upload section */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 16 }]}>
          ADD REFERENCE FILES (OPTIONAL)
        </Text>
        <Text style={[styles.refHint, { color: colors.mutedForeground }]}>
          Upload reference links, briefs, or style guides for the editor.
        </Text>

        {/* Saved refs */}
        {refs.map((r, i) => (
          <View key={i} style={[styles.savedRef, { backgroundColor: `${colors.primary}08`, borderColor: `${colors.primary}25` }]}>
            <Feather name="paperclip" size={14} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.savedRefTitle, { color: colors.foreground }]}>{r.title}</Text>
              {r.url ? <Text style={[styles.savedRefUrl, { color: colors.primary }]} numberOfLines={1}>{r.url}</Text> : null}
              {r.note ? <Text style={[styles.savedRefNote, { color: colors.mutedForeground }]} numberOfLines={1}>{r.note}</Text> : null}
            </View>
          </View>
        ))}

        {/* Add ref form */}
        {addingRef ? (
          <View style={[styles.refForm, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.refFormTitle, { color: colors.foreground }]}>Add Reference</Text>
            <InputField label="Title *" value={refTitle} onChangeText={setRefTitle} placeholder="e.g. Brand Guidelines PDF" colors={colors} />
            <InputField label="Link (optional)" value={refUrl} onChangeText={setRefUrl} placeholder="https://drive.google.com/..." colors={colors} />
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Note (optional)</Text>
              <TextInput
                style={[styles.input, styles.textAreaSm, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                value={refNote} onChangeText={setRefNote}
                placeholder="Instructions or context for this reference"
                placeholderTextColor={colors.mutedForeground} multiline numberOfLines={3}
              />
            </View>
            <View style={styles.refFormBtns}>
              <TouchableOpacity onPress={() => { setAddingRef(false); setRefTitle(""); setRefUrl(""); setRefNote(""); }}
                style={[styles.refCancelBtn, { borderColor: colors.border }]}>
                <Text style={[styles.refCancelText, { color: colors.mutedForeground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddRef} disabled={savingRef || !refTitle.trim()}
                style={[styles.refSaveBtn, { backgroundColor: !refTitle.trim() ? colors.muted : colors.primary }]}>
                {savingRef ? <ActivityIndicator size="small" color="#fff" /> :
                  <><Feather name="upload" size={14} color="#fff" /><Text style={styles.refSaveText}>Save Reference</Text></>}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setAddingRef(true)}
            style={[styles.addRefBtn, { backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}30` }]}>
            <Feather name="plus" size={16} color={colors.primary} />
            <Text style={[styles.addRefText, { color: colors.primary }]}>Add Reference File / Link</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={resetForm}
          style={[styles.newProjectBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Feather name="plus-circle" size={16} color={colors.foreground} />
          <Text style={[styles.newProjectText, { color: colors.foreground }]}>Create Another Project</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ── Create form ────────────────────────────────────────────────────────────
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
              <Feather name={t.icon as never} size={16} color={active ? colors.primary : colors.mutedForeground} />
              <Text style={[styles.typeLabel, { color: active ? colors.primary : colors.foreground }]}>{t.label}</Text>
              {t.ugc && <View style={[styles.ugcTag, { backgroundColor: "#fef3c7" }]}><Text style={[styles.ugcTagText, { color: "#92400e" }]}>UGC</Text></View>}
            </TouchableOpacity>
          );
        })}
      </View>

      {isUGC && (
        <View style={[styles.ugcNotice, { backgroundColor: "#fef9c3", borderColor: "#fde047" }]}>
          <Feather name="info" size={14} color="#a16207" />
          <Text style={[styles.ugcNoticeText, { color: "#92400e" }]}>
            UGC project: model cost will be deducted from total value to show net editor payout.
          </Text>
        </View>
      )}

      {/* Client selection */}
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 8 }]}>SELECT CLIENT *</Text>
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
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>— or type a new client name —</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                value={customClientName} onChangeText={setCustomClientName}
                placeholder="New client name" placeholderTextColor={colors.mutedForeground} />
            </View>
          )}
        </>
      )}

      {/* Project details */}
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 8 }]}>PROJECT DETAILS</Text>
      <InputField label="Project Name *" value={projectName} onChangeText={setProjectName} placeholder="e.g. Brand Video Series" colors={colors} />

      <View style={styles.row}>
        <View style={styles.halfField}>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Total Value (₹) *</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            value={totalValue} onChangeText={setTotalValue} placeholder="5000" placeholderTextColor={colors.mutedForeground} keyboardType="numeric" />
        </View>
        <View style={styles.halfField}>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Deliverables *</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            value={totalDeliverables} onChangeText={setTotalDeliverables} placeholder="4" placeholderTextColor={colors.mutedForeground} keyboardType="numeric" />
        </View>
      </View>

      {isUGC && (
        <>
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: "#b45309" }]}>Model Cost (₹) * <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular" }}>(will be deducted)</Text></Text>
            <TextInput style={[styles.input, { backgroundColor: "#fef9c3", borderColor: "#fde047", color: colors.foreground }]}
              value={modelCost} onChangeText={setModelCost} placeholder="e.g. 2500" placeholderTextColor={colors.mutedForeground} keyboardType="numeric" />
          </View>
          {tv > 0 && mc > 0 && (
            <View style={[styles.payoutBox, { backgroundColor: "#dcfce7", borderColor: "#bbf7d0" }]}>
              <Feather name="trending-up" size={16} color="#166534" />
              <Text style={[styles.payoutText, { color: "#166534" }]}>
                Net Editor Payout: <Text style={styles.payoutValue}>₹{netPayout.toLocaleString()}</Text>
                <Text style={[styles.payoutSub, { color: "#15803d" }]}> (₹{tv.toLocaleString()} – ₹{mc.toLocaleString()} model)</Text>
              </Text>
            </View>
          )}
        </>
      )}

      <InputField label="Deadline (optional)" value={deadline} onChangeText={setDeadline} placeholder="YYYY-MM-DD" colors={colors} />

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 8 }]}>NOTES FOR EDITOR</Text>
      <View style={styles.field}>
        <TextInput style={[styles.input, styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          value={notes} onChangeText={setNotes}
          placeholder="Instructions, style guidelines, model details, references..."
          placeholderTextColor={colors.mutedForeground} multiline numberOfLines={4} />
      </View>

      {/* Assign editor */}
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
  refHint: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 4 },
  savedRef: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
  savedRefTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  savedRefUrl: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  savedRefNote: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#6b7280" },
  refForm: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  refFormTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  refFormBtns: { flexDirection: "row", gap: 8 },
  refCancelBtn: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  refCancelText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  refSaveBtn: { flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 12, borderRadius: 12, gap: 6 },
  refSaveText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  addRefBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, borderRadius: 14, borderWidth: 1, borderStyle: "dashed" },
  addRefText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  newProjectBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, borderRadius: 14, borderWidth: 1, marginTop: 4 },
  newProjectText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  // Form
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeChip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 6 },
  typeLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  ugcTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  ugcTagText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  ugcNotice: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 12, borderRadius: 12, borderWidth: 1 },
  ugcNoticeText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  clientScroll: { marginBottom: 8 },
  clientScrollContent: { gap: 8, paddingVertical: 4 },
  clientChip: { borderRadius: 14, padding: 12, alignItems: "center", gap: 4, minWidth: 90, maxWidth: 110 },
  clientChipAvatar: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  clientChipInitials: { fontSize: 14, fontFamily: "Inter_700Bold" },
  clientChipName: { fontSize: 11, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  clientChipBiz: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center" },
  row: { flexDirection: "row", gap: 10 },
  halfField: { flex: 1, gap: 6 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  input: { padding: 14, borderRadius: 12, borderWidth: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  textArea: { minHeight: 90, textAlignVertical: "top" },
  textAreaSm: { minHeight: 60, textAlignVertical: "top" },
  payoutBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 12, borderWidth: 1 },
  payoutText: { fontSize: 13, fontFamily: "Inter_500Medium", flex: 1 },
  payoutValue: { fontFamily: "Inter_700Bold" },
  payoutSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  editorList: { gap: 10 },
  editorChip: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 14, gap: 10 },
  editorAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  editorInitials: { fontSize: 13, fontFamily: "Inter_700Bold" },
  editorInfo: { flex: 1, gap: 1 },
  editorName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  editorSpec: { fontSize: 12, fontFamily: "Inter_400Regular" },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 16, borderRadius: 14, gap: 8, marginTop: 12 },
  submitText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
