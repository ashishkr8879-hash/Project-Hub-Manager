import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { StatusBadge } from "@/components/StatusBadge";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { fetchEditorProjects, updateProjectStatus, type Project } from "@/hooks/useApi";

export default function WorkScreen() {
  const colors = useColors();
  const { currentUser } = useApp();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const queryClient = useQueryClient();
  const editorId = currentUser?.editorId ?? currentUser?.id ?? "";
  const [updating, setUpdating] = useState<string | null>(null);

  const { data: projects = [], isLoading, refetch } = useQuery({
    queryKey: ["editor-projects", editorId],
    queryFn: () => fetchEditorProjects(editorId),
    enabled: !!editorId,
  });

  const activeProjects = projects.filter((p) => p.status !== "completed");
  const completedProjects = projects.filter((p) => p.status === "completed");

  async function handleMarkInProgress(project: Project) {
    setUpdating(project.id);
    try {
      await updateProjectStatus(project.id, "in_progress");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      queryClient.invalidateQueries({ queryKey: ["editor-projects"] });
    } catch {
      Alert.alert("Error", "Could not update project status");
    } finally {
      setUpdating(null);
    }
  }

  async function handleAddDeliverable(project: Project) {
    if (project.completedDeliverables >= project.totalDeliverables) return;
    const newCount = project.completedDeliverables + 1;
    const newStatus =
      newCount >= project.totalDeliverables ? "completed" : "in_progress";
    setUpdating(project.id);
    try {
      await updateProjectStatus(project.id, newStatus, newCount);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      queryClient.invalidateQueries({ queryKey: ["editor-projects"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    } catch {
      Alert.alert("Error", "Could not update deliverable count");
    } finally {
      setUpdating(null);
    }
  }

  function renderProject({ item }: { item: Project }) {
    const progress =
      item.totalDeliverables > 0
        ? item.completedDeliverables / item.totalDeliverables
        : 0;
    const isCompleted = item.status === "completed";
    const isUpdating = updating === item.id;

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: isCompleted ? "#dcfce7" : colors.border,
            opacity: isCompleted ? 0.75 : 1,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitles}>
            <Text style={[styles.projectName, { color: colors.foreground }]} numberOfLines={1}>
              {item.projectName}
            </Text>
            <Text style={[styles.clientName, { color: colors.mutedForeground }]} numberOfLines={1}>
              {item.clientName}
            </Text>
          </View>
          <StatusBadge status={item.status} />
        </View>

        <View style={styles.progressRow}>
          <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: isCompleted ? colors.success : colors.editorPrimary,
                  width: `${Math.round(progress * 100)}%` as `${number}%`,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressCount, { color: colors.mutedForeground }]}>
            {item.completedDeliverables}/{item.totalDeliverables}
          </Text>
        </View>

        <View style={styles.pendingRow}>
          <Text style={[styles.pendingText, { color: colors.mutedForeground }]}>
            <Feather name="clock" size={12} /> {item.totalDeliverables - item.completedDeliverables} remaining
          </Text>
          <Text style={[styles.valueText, { color: colors.success }]}>
            ${item.totalValue.toLocaleString()}
          </Text>
        </View>

        {!isCompleted && (
          <View style={styles.actions}>
            {item.status === "pending" && (
              <TouchableOpacity
                onPress={() => handleMarkInProgress(item)}
                disabled={isUpdating}
                style={[styles.actionBtn, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}30` }]}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <Feather name="play" size={14} color={colors.primary} />
                    <Text style={[styles.actionText, { color: colors.primary }]}>Start Work</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            {item.status === "in_progress" && (
              <TouchableOpacity
                onPress={() => handleAddDeliverable(item)}
                disabled={isUpdating || item.completedDeliverables >= item.totalDeliverables}
                style={[
                  styles.actionBtn,
                  {
                    backgroundColor: `${colors.editorPrimary}15`,
                    borderColor: `${colors.editorPrimary}30`,
                    flex: 1,
                  },
                ]}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color={colors.editorPrimary} />
                ) : (
                  <>
                    <Feather name="check" size={14} color={colors.editorPrimary} />
                    <Text style={[styles.actionText, { color: colors.editorPrimary }]}>
                      Mark Deliverable Done
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.editorPrimary} />
      </View>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      data={[...activeProjects, ...completedProjects]}
      keyExtractor={(p) => p.id}
      renderItem={renderProject}
      contentContainerStyle={[
        styles.listContent,
        { paddingBottom: bottomPad + 100 },
      ]}
      ListHeaderComponent={
        activeProjects.length > 0 ? (
          <View style={styles.listHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Active Work ({activeProjects.length})
            </Text>
          </View>
        ) : null
      }
      ListEmptyComponent={
        <View style={[styles.empty, { borderColor: colors.border }]}>
          <Feather name="inbox" size={32} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            No projects assigned yet
          </Text>
        </View>
      }
      refreshing={isLoading}
      onRefresh={refetch}
      scrollEnabled={!!projects.length}
    />
  );
}

const styles = StyleSheet.create({
  loaderContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { padding: 16, gap: 0 },
  listHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  cardTitles: { flex: 1, gap: 2 },
  projectName: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  clientName: { fontSize: 13, fontFamily: "Inter_400Regular" },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 3 },
  progressCount: { fontSize: 12, fontFamily: "Inter_500Medium", minWidth: 32, textAlign: "right" },
  pendingRow: { flexDirection: "row", justifyContent: "space-between" },
  pendingText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  valueText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  actions: { flexDirection: "row", gap: 8 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  actionText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  empty: {
    alignItems: "center",
    padding: 40,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
