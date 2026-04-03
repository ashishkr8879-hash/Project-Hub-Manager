import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { StatCard } from "@/components/StatCard";
import { ProjectCard } from "@/components/ProjectCard";
import { NotificationBell } from "@/components/NotificationBell";
import { MonthCalendar } from "@/components/MonthCalendar";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { useEditorTheme } from "@/hooks/useEditorTheme";
import { fetchEditorProjects, fetchCalendar } from "@/hooks/useApi";

export default function EditorDashboard() {
  const colors = useColors();
  const { currentUser } = useApp();
  const theme = useEditorTheme(currentUser?.specialization);
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const editorId = currentUser?.editorId ?? currentUser?.id ?? "";

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const { data: projects = [], isLoading, refetch } = useQuery({
    queryKey: ["editor-projects", editorId],
    queryFn: () => fetchEditorProjects(editorId),
    enabled: !!editorId,
    refetchInterval: 30000,
  });

  const { data: calendarData = {}, isLoading: calLoading, refetch: refetchCal } = useQuery({
    queryKey: ["calendar-editor", editorId],
    queryFn: () => fetchCalendar(currentMonth, editorId),
    enabled: !!editorId,
  });

  const pending    = projects.filter((p) => p.status === "pending");
  const inProgress = projects.filter((p) => p.status === "in_progress");
  const completed  = projects.filter((p) => p.status === "completed");
  const customise  = projects.filter((p) => p.revisionRequested);

  const totalPendingDeliverables = [...pending, ...inProgress].reduce(
    (sum, p) => sum + (p.totalDeliverables - p.completedDeliverables), 0
  );

  async function handleRefresh() {
    await Promise.all([refetch(), refetchCal()]);
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 100 }]}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor={theme.primary} />
      }
    >
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Welcome back</Text>
          <Text style={[styles.name, { color: colors.foreground }]}>{currentUser?.name}</Text>
          {currentUser?.specialization && (
            <View style={[styles.specBadge, { backgroundColor: theme.badgeBg }]}>
              <Feather name={theme.icon as never} size={11} color={theme.badgeText} />
              <Text style={[styles.specBadgeText, { color: theme.badgeText }]}>{theme.label}</Text>
            </View>
          )}
        </View>
        <NotificationBell targetRoute="/(editor)/notifications" />
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : (
        <>
          {/* Stats */}
          <View style={styles.statsRow}>
            <StatCard label="Assigned"     value={String(projects.length)}          icon="folder"      color={theme.primary} />
            <StatCard label="Pending Work" value={String(totalPendingDeliverables)} icon="clock"       color={colors.warning} />
          </View>
          <View style={styles.statsRow}>
            <StatCard label="In Progress"  value={String(inProgress.length)}        icon="activity"    color={colors.primary} />
            <StatCard label="Completed"    value={String(completed.length)}          icon="check-circle" color={colors.success} />
          </View>
          {customise.length > 0 && (
            <View style={styles.statsRow}>
              <StatCard label="Customisation Pending" value={String(customise.length)} icon="edit-2" color="#f59e0b" />
              <View style={{ flex: 1 }} />
            </View>
          )}

          {/* Customisation alert */}
          {customise.length > 0 && (
            <View style={[styles.customiseAlert, { backgroundColor: "#fef9c3", borderColor: "#f59e0b" }]}>
              <Feather name="edit-2" size={16} color="#b45309" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.customiseAlertTitle, { color: "#92400e" }]}>
                  {customise.length} project{customise.length > 1 ? "s" : ""} need customisation
                </Text>
                <Text style={[styles.customiseAlertSub, { color: "#b45309" }]}>
                  {customise.map((p) => p.projectName).join(", ")}
                </Text>
              </View>
            </View>
          )}

          {/* Month Calendar */}
          <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 8 }]}>My Project Calendar</Text>
          {calLoading ? (
            <View style={[styles.calLoader, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ActivityIndicator color={theme.primary} />
            </View>
          ) : (
            <MonthCalendar calendarData={calendarData} accentColor={theme.primary} />
          )}

          {/* In Progress */}
          {inProgress.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 20 }]}>In Progress</Text>
              {inProgress.map((p) => <ProjectCard key={p.id} project={p} showEditor={false} />)}
            </>
          )}

          {/* Pending */}
          {pending.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 8 }]}>Pending</Text>
              {pending.map((p) => <ProjectCard key={p.id} project={p} showEditor={false} />)}
            </>
          )}

          {projects.length === 0 && (
            <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="inbox" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No projects assigned</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Your admin will assign projects soon.</Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 2 },
  name: { fontSize: 24, fontFamily: "Inter_700Bold" },
  specBadge: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 5 },
  specBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  loader: { flex: 1, alignItems: "center", paddingTop: 60 },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  customiseAlert: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  customiseAlertTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  customiseAlertSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", marginBottom: 12 },
  calLoader: { height: 120, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", padding: 32, borderRadius: 16, borderWidth: 1, gap: 8, marginTop: 20 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
});
