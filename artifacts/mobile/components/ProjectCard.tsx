import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import type { Project } from "@/hooks/useApi";
import { StatusBadge } from "./StatusBadge";

const TYPE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  ugc:          { bg: "#fef3c7", text: "#92400e", label: "UGC" },
  branded:      { bg: "#e8edf8", text: "#3b5bdb", label: "Branded" },
  corporate:    { bg: "#f3f4f6", text: "#374151", label: "Corporate" },
  wedding:      { bg: "#fce7f3", text: "#9d174d", label: "Wedding" },
  social_media: { bg: "#ede9fe", text: "#6d28d9", label: "Social" },
  other:        { bg: "#f3f4f6", text: "#6b7280", label: "Other" },
};

interface Props {
  project: Project;
  onPress?: () => void;
  showEditor?: boolean;
}

export function ProjectCard({ project, onPress, showEditor = true }: Props) {
  const colors = useColors();
  const progress = project.totalDeliverables > 0
    ? project.completedDeliverables / project.totalDeliverables : 0;
  const isUGC    = project.projectType === "ugc" && project.modelCost > 0;
  const netValue = project.totalValue - (project.modelCost || 0);
  const typeInfo = TYPE_COLORS[project.projectType] ?? TYPE_COLORS.other;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <View style={styles.titleRow}>
            <Text style={[styles.projectName, { color: colors.foreground }]} numberOfLines={1}>
              {project.projectName}
            </Text>
            <View style={[styles.typeTag, { backgroundColor: typeInfo.bg }]}>
              <Text style={[styles.typeTagText, { color: typeInfo.text }]}>{typeInfo.label}</Text>
            </View>
          </View>
          <Text style={[styles.clientName, { color: colors.mutedForeground }]} numberOfLines={1}>
            {project.clientName}
          </Text>
        </View>
        <StatusBadge status={project.status} />
      </View>

      {/* Progress */}
      <View style={styles.progressRow}>
        <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
          <View style={[
            styles.progressFill,
            { backgroundColor: project.status === "completed" ? colors.success : colors.primary, width: `${Math.round(progress * 100)}%` as `${number}%` },
          ]} />
        </View>
        <Text style={[styles.progressText, { color: colors.mutedForeground }]}>
          {project.completedDeliverables}/{project.totalDeliverables}
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        {isUGC ? (
          <View style={styles.ugcPricing}>
            <View style={styles.footerItem}>
              <Feather name="dollar-sign" size={13} color={colors.success} />
              <Text style={[styles.footerText, { color: colors.foreground }]}>${netValue.toLocaleString()}</Text>
              <Text style={[styles.ugcSub, { color: colors.mutedForeground }]}>net</Text>
            </View>
            <View style={[styles.modelCostTag, { backgroundColor: "#fee2e2" }]}>
              <Feather name="minus" size={11} color="#b91c1c" />
              <Text style={[styles.modelCostText, { color: "#b91c1c" }]}>${project.modelCost.toLocaleString()} model</Text>
            </View>
          </View>
        ) : (
          <View style={styles.footerItem}>
            <Feather name="dollar-sign" size={14} color={colors.success} />
            <Text style={[styles.footerText, { color: colors.foreground }]}>
              ${project.totalValue.toLocaleString()}
            </Text>
          </View>
        )}
        {showEditor && (
          <View style={styles.footerItem}>
            <Feather name="user" size={14} color={colors.mutedForeground} />
            <Text style={[styles.footerText, { color: colors.mutedForeground }]} numberOfLines={1}>
              {project.editorName}
            </Text>
          </View>
        )}
      </View>

      {/* Deadline */}
      {project.deadline && (
        <View style={styles.footerItem}>
          <Feather name="calendar" size={12} color={colors.warning} />
          <Text style={[styles.deadlineText, { color: colors.warning }]}>
            Due {new Date(project.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12, gap: 12 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  titleBlock: { flex: 1, gap: 2 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  projectName: { fontSize: 16, fontFamily: "Inter_600SemiBold", flexShrink: 1 },
  typeTag: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  typeTagText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  clientName: { fontSize: 13, fontFamily: "Inter_400Regular" },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  progressBar: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  progressText: { fontSize: 12, fontFamily: "Inter_500Medium", minWidth: 32, textAlign: "right" },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  ugcPricing: { flexDirection: "row", alignItems: "center", gap: 8 },
  footerItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  footerText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  ugcSub: { fontSize: 11, fontFamily: "Inter_400Regular" },
  modelCostTag: { flexDirection: "row", alignItems: "center", paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8, gap: 2 },
  modelCostText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  deadlineText: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
