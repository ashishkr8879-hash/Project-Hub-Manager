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
import { createProject, fetchEditors, type Editor } from "@/hooks/useApi";

export default function CreateProjectScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [clientName, setClientName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [totalValue, setTotalValue] = useState("");
  const [totalDeliverables, setTotalDeliverables] = useState("");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedEditor, setSelectedEditor] = useState<Editor | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const { data: editors = [], isLoading: editorsLoading } = useQuery({
    queryKey: ["editors"],
    queryFn: fetchEditors,
  });

  function resetForm() {
    setClientName(""); setProjectName(""); setTotalValue("");
    setTotalDeliverables(""); setDeadline(""); setNotes(""); setSelectedEditor(null);
  }

  async function handleSubmit() {
    if (!clientName.trim() || !projectName.trim() || !totalValue || !totalDeliverables || !selectedEditor) {
      Alert.alert("Missing Fields", "Please fill in all required fields and select an editor.");
      return;
    }
    setSubmitting(true);
    try {
      await createProject({
        clientName: clientName.trim(), projectName: projectName.trim(),
        totalValue: parseFloat(totalValue), totalDeliverables: parseInt(totalDeliverables, 10),
        editorId: selectedEditor.id,
        deadline: deadline.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
      await queryClient.invalidateQueries({ queryKey: ["editor-projects"] });
      setSuccess(true);
      resetForm();
      setTimeout(() => setSuccess(false), 3000);
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
          <Text style={[styles.successText, { color: "#166534" }]}>
            Project created! Editor has been notified.
          </Text>
        </View>
      )}

      <SectionLabel label="CLIENT INFORMATION" colors={colors} />
      <InputField label="Client Name *" value={clientName} onChangeText={setClientName} placeholder="e.g. TechCorp Inc" colors={colors} />
      <InputField label="Project Name *" value={projectName} onChangeText={setProjectName} placeholder="e.g. Brand Video Series" colors={colors} />

      <SectionLabel label="PROJECT DETAILS" colors={colors} top />
      <View style={styles.row}>
        <View style={styles.halfField}>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Total Value ($) *</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            value={totalValue} onChangeText={setTotalValue} placeholder="5000" placeholderTextColor={colors.mutedForeground} keyboardType="numeric" />
        </View>
        <View style={styles.halfField}>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Deliverables *</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            value={totalDeliverables} onChangeText={setTotalDeliverables} placeholder="4" placeholderTextColor={colors.mutedForeground} keyboardType="numeric" />
        </View>
      </View>
      <InputField label="Deadline (optional)" value={deadline} onChangeText={setDeadline} placeholder="e.g. 2026-04-30" colors={colors} />

      <SectionLabel label="NOTES FOR EDITOR" colors={colors} top />
      <View style={styles.field}>
        <TextInput
          style={[styles.input, styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          value={notes} onChangeText={setNotes}
          placeholder="Instructions, style guidelines, references..."
          placeholderTextColor={colors.mutedForeground}
          multiline numberOfLines={4}
        />
      </View>

      <SectionLabel label="ASSIGN EDITOR *" colors={colors} top />
      {editorsLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
      ) : (
        <View style={styles.editorList}>
          {editors.map((editor) => {
            const active = selectedEditor?.id === editor.id;
            const initials = editor.name.split(" ").map((w) => w[0]).join("").toUpperCase();
            return (
              <TouchableOpacity key={editor.id} activeOpacity={0.75} onPress={() => setSelectedEditor(editor)}
                style={[styles.editorChip, {
                  backgroundColor: active ? `${colors.primary}12` : colors.card,
                  borderColor: active ? colors.primary : colors.border,
                  borderWidth: active ? 2 : 1,
                }]}>
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

function SectionLabel({ label, colors, top }: { label: string; colors: ReturnType<typeof useColors>; top?: boolean }) {
  return (
    <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: top ? 8 : 0 }]}>{label}</Text>
  );
}

function InputField({ label, value, onChangeText, placeholder, keyboardType, colors }: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder: string; keyboardType?: "default" | "numeric"; colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{label}</Text>
      <TextInput style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
        value={value} onChangeText={onChangeText} placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground} keyboardType={keyboardType ?? "default"} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, gap: 10 },
  successBanner: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 12, gap: 8, marginBottom: 4 },
  successText: { fontSize: 14, fontFamily: "Inter_500Medium", flex: 1 },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1.2, marginBottom: 2 },
  row: { flexDirection: "row", gap: 10 },
  halfField: { flex: 1, gap: 6 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  input: { padding: 14, borderRadius: 12, borderWidth: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  textArea: { minHeight: 90, textAlignVertical: "top" },
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
