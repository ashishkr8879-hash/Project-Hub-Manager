import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import type { Project } from "@/hooks/useApi";
import { StatusBadge } from "./StatusBadge";

interface Props {
  project: Project;
  onPress?: () => void;
  showEditor?: boolean;
}

export function ProjectCard({ project, onPress, showEditor = true }: Props) {
  const colors = useColors();
  const progress =
    project.totalDeliverables > 0
      ? project.completedDeliverables / project.totalDeliverables
      : 0;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={[styles.projectName, { color: colors.foreground }]} numberOfLines={1}>
            {project.projectName}
          </Text>
          <Text style={[styles.clientName, { color: colors.mutedForeground }]} numberOfLines={1}>
            {project.clientName}
          </Text>
        </View>
        <StatusBadge status={project.status} />
      </View>

      <View style={styles.progressRow}>
        <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.primary,
                width: `${Math.round(progress * 100)}%` as `${number}%`,
              },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: colors.mutedForeground }]}>
          {project.completedDeliverables}/{project.totalDeliverables}
        </Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Feather name="dollar-sign" size={14} color={colors.success} />
          <Text style={[styles.footerText, { color: colors.foreground }]}>
            ${project.totalValue.toLocaleString()}
          </Text>
        </View>
        {showEditor && (
          <View style={styles.footerItem}>
            <Feather name="user" size={14} color={colors.mutedForeground} />
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
              {project.editorName}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  projectName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  clientName: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    minWidth: 32,
    textAlign: "right",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footerText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});
