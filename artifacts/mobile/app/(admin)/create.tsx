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
  const [selectedEditor, setSelectedEditor] = useState<Editor | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const { data: editors = [], isLoading: editorsLoading } = useQuery({
    queryKey: ["editors"],
    queryFn: fetchEditors,
  });

  async function handleSubmit() {
    if (!clientName.trim() || !projectName.trim() || !totalValue || !totalDeliverables || !selectedEditor) {
      Alert.alert("Missing Fields", "Please fill in all fields and select an editor.");
      return;
    }

    setSubmitting(true);
    try {
      await createProject({
        clientName: clientName.trim(),
        projectName: projectName.trim(),
        totalValue: parseFloat(totalValue),
        totalDeliverables: parseInt(totalDeliverables, 10),
        editorId: selectedEditor.id,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setSuccess(true);
      setClientName("");
      setProjectName("");
      setTotalValue("");
      setTotalDeliverables("");
      setSelectedEditor(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = e instanceof Error ? e.message : "Failed to create project";
      Alert.alert("Error", msg);
    } finally {
      setSubmitting(false);
    }
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
            Project created successfully!
          </Text>
        </View>
      )}

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
        CLIENT INFORMATION
      </Text>

      <InputField
        label="Client Name"
        value={clientName}
        onChangeText={setClientName}
        placeholder="e.g. TechCorp Inc"
        colors={colors}
      />
      <InputField
        label="Project Name"
        value={projectName}
        onChangeText={setProjectName}
        placeholder="e.g. Brand Video Series"
        colors={colors}
      />

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 12 }]}>
        PROJECT DETAILS
      </Text>

      <InputField
        label="Total Value ($)"
        value={totalValue}
        onChangeText={setTotalValue}
        placeholder="e.g. 5000"
        keyboardType="numeric"
        colors={colors}
      />
      <InputField
        label="Total Deliverables"
        value={totalDeliverables}
        onChangeText={setTotalDeliverables}
        placeholder="e.g. 4"
        keyboardType="numeric"
        colors={colors}
      />

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 12 }]}>
        ASSIGN EDITOR
      </Text>

      {editorsLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
      ) : (
        <View style={styles.editorList}>
          {editors.map((editor) => {
            const active = selectedEditor?.id === editor.id;
            const initials = editor.name
              .split(" ")
              .map((w) => w[0])
              .join("")
              .toUpperCase();
            return (
              <TouchableOpacity
                key={editor.id}
                activeOpacity={0.75}
                onPress={() => setSelectedEditor(editor)}
                style={[
                  styles.editorChip,
                  {
                    backgroundColor: active ? `${colors.primary}15` : colors.card,
                    borderColor: active ? colors.primary : colors.border,
                    borderWidth: active ? 2 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.editorAvatar,
                    { backgroundColor: active ? `${colors.primary}25` : colors.muted },
                  ]}
                >
                  <Text style={[styles.editorInitials, { color: active ? colors.primary : colors.mutedForeground }]}>
                    {initials}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.editorName,
                    { color: active ? colors.primary : colors.foreground },
                  ]}
                >
                  {editor.name}
                </Text>
                {active && <Feather name="check" size={16} color={colors.primary} />}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleSubmit}
        disabled={submitting}
        style={[
          styles.submitBtn,
          { backgroundColor: submitting ? colors.muted : colors.primary },
        ]}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Feather name="plus" size={18} color="#fff" />
            <Text style={styles.submitText}>Create Project</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  colors,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: "default" | "numeric";
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            color: colors.foreground,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType ?? "default"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, gap: 12 },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 4,
  },
  successText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
    marginTop: 4,
    marginBottom: 4,
  },
  field: { gap: 6 },
  fieldLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  input: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  editorList: { gap: 10 },
  editorChip: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    gap: 10,
  },
  editorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  editorInitials: { fontSize: 13, fontFamily: "Inter_700Bold" },
  editorName: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 14,
    gap: 8,
    marginTop: 16,
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
