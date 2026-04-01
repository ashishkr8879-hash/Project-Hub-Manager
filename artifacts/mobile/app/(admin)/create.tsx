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
  fetchEditors,
  fetchClients,
  type Editor,
  type Client,
  type ProjectType,
} from "@/hooks/useApi";

const PROJECT_TYPES: { value: ProjectType; label: string; icon: string; ugc?: boolean }[] = [
  { value: "ugc",         label: "UGC",          icon: "video",       ugc: true },
  { value: "branded",     label: "Branded",       icon: "star" },
  { value: "corporate",   label: "Corporate",     icon: "briefcase" },
  { value: "wedding",     label: "Wedding",       icon: "heart" },
  { value: "social_media",label: "Social Media",  icon: "instagram" },
  { value: "other",       label: "Other",         icon: "more-horizontal" },
];

export default function CreateProjectScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  // Project fields
  const [projectType, setProjectType] = useState<ProjectType>("branded");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [customClientName, setCustomClientName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [totalValue, setTotalValue] = useState("");
  const [modelCost, setModelCost] = useState("");
  const [totalDeliverables, setTotalDeliverables] = useState("");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedEditor, setSelectedEditor] = useState<Editor | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const { data: editors = [], isLoading: editorsLoading } = useQuery({
    queryKey: ["editors"], queryFn: fetchEditors,
  });

  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ["clients"], queryFn: fetchClients,
  });

  const isUGC = projectType === "ugc";
  const tv = parseFloat(totalValue) || 0;
  const mc = parseFloat(modelCost) || 0;
  const netPayout = tv - mc;

  function resetForm() {
    setProjectType("branded"); setSelectedClient(null); setCustomClientName("");
    setProjectName(""); setTotalValue(""); setModelCost(""); setTotalDeliverables("");
    setDeadline(""); setNotes(""); setSelectedEditor(null);
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
      await createProject({
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
      setSuccess(true); resetForm();
      setTimeout(() => setSuccess(false), 4000);
    } catch (e: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to create project");
    } finally { setSubmitting(false); }
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 100 }]}
      keyboardShouldPersistTaps="handled"
    >
      {success && (
        <View style={[styles.successBanner, { backgroundColor: "#dcfce7" }]}>
          <Feather name="check-circle" size={16} color="#166534" />
          <Text style={[styles.successText, { color: "#166534" }]}>Project created! Editor has been notified.</Text>
        </View>
      )}

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

      {/* UGC pricing notice */}
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
              <Feather name="dollar-sign" size={16} color="#166534" />
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
  successBanner: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 12, gap: 8 },
  successText: { fontSize: 14, fontFamily: "Inter_500Medium", flex: 1 },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1.2, marginBottom: 2 },
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
