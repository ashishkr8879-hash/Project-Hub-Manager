import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { StatCard } from "@/components/StatCard";
import { ProjectCard } from "@/components/ProjectCard";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { fetchEditorProjects } from "@/hooks/useApi";

export default function EditorDashboard() {
  const colors = useColors();
  const { currentUser, setCurrentUser } = useApp();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const editorId = currentUser?.editorId ?? currentUser?.id ?? "";

  const { data: projects = [], isLoading, refetch } = useQuery({
    queryKey: ["editor-projects", editorId],
    queryFn: () => fetchEditorProjects(editorId),
    enabled: !!editorId,
  });

  function handleLogout() {
    setCurrentUser(null);
    router.replace("/login");
  }

  const pending = projects.filter((p) => p.status === "pending");
  const inProgress = projects.filter((p) => p.status === "in_progress");
  const completed = projects.filter((p) => p.status === "completed");

  const totalPendingDeliverables = [...pending, ...inProgress].reduce(
    (sum, p) => sum + (p.totalDeliverables - p.completedDeliverables),
    0
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 100 }]}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.editorPrimary} />
      }
    >
      <View style={styles.topRow}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
            Welcome back
          </Text>
          <Text style={[styles.name, { color: colors.foreground }]}>
            {currentUser?.name}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleLogout}
          style={[styles.logoutBtn, { backgroundColor: colors.muted }]}
        >
          <Feather name="log-out" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.editorPrimary} />
        </View>
      ) : (
        <>
          <View style={styles.statsRow}>
            <StatCard
              label="Assigned"
              value={String(projects.length)}
              icon="folder"
              color={colors.editorPrimary}
            />
            <StatCard
              label="Pending Work"
              value={String(totalPendingDeliverables)}
              icon="clock"
              color={colors.warning}
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              label="In Progress"
              value={String(inProgress.length)}
              icon="activity"
              color={colors.primary}
            />
            <StatCard
              label="Completed"
              value={String(completed.length)}
              icon="check-circle"
              color={colors.success}
            />
          </View>

          {inProgress.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                In Progress
              </Text>
              {inProgress.map((p) => (
                <ProjectCard key={p.id} project={p} showEditor={false} />
              ))}
            </>
          )}

          {pending.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Pending
              </Text>
              {pending.map((p) => (
                <ProjectCard key={p.id} project={p} showEditor={false} />
              ))}
            </>
          )}

          {projects.length === 0 && (
            <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="inbox" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                No projects assigned
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Your admin will assign projects to you soon.
              </Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, gap: 0 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 2 },
  name: { fontSize: 24, fontFamily: "Inter_700Bold" },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  loader: { flex: 1, alignItems: "center", paddingTop: 60 },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    marginTop: 20,
    marginBottom: 12,
  },
  empty: {
    alignItems: "center",
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    marginTop: 20,
  },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
});
