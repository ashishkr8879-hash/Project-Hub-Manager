import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
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
import { NotificationBell } from "@/components/NotificationBell";
import { MonthCalendar } from "@/components/MonthCalendar";
import { StatusBadge } from "@/components/StatusBadge";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { useEditorTheme } from "@/hooks/useEditorTheme";
import { fetchEditorProjects, fetchCalendar, type Project } from "@/hooks/useApi";

type FilterKey = "assigned" | "pending_work" | "in_progress" | "completed" | "customise";

const FILTER_META: Record<FilterKey, { title: string; icon: React.ComponentProps<typeof Feather>["name"]; emptyMsg: string }> = {
  assigned:     { title: "All Assigned Projects",       icon: "folder",       emptyMsg: "No projects assigned yet." },
  pending_work: { title: "Projects with Pending Work",  icon: "clock",        emptyMsg: "No pending deliverables." },
  in_progress:  { title: "In Progress Projects",        icon: "activity",     emptyMsg: "No projects in progress." },
  completed:    { title: "Completed Projects",          icon: "check-circle", emptyMsg: "No completed projects yet." },
  customise:    { title: "Customisation Requested",     icon: "edit-2",       emptyMsg: "No customisation requests." },
};

export default function EditorDashboard() {
  const colors = useColors();
  const { currentUser } = useApp();
  const theme = useEditorTheme(currentUser?.specialization);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const editorId = currentUser?.editorId ?? currentUser?.id ?? "";

  const [filterModal, setFilterModal] = useState<FilterKey | null>(null);

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

  function getFilteredProjects(key: FilterKey): Project[] {
    switch (key) {
      case "assigned":     return projects;
      case "pending_work": return [...pending, ...inProgress].filter((p) => p.totalDeliverables > p.completedDeliverables);
      case "in_progress":  return inProgress;
      case "completed":    return completed;
      case "customise":    return customise;
    }
  }

  async function handleRefresh() {
    await Promise.all([refetch(), refetchCal()]);
  }

  function openWork(project: Project) {
    setFilterModal(null);
    router.push({ pathname: "/(editor)/work", params: { openProjectId: project.id } });
  }

  const meta = filterModal ? FILTER_META[filterModal] : null;
  const filteredList = filterModal ? getFilteredProjects(filterModal) : [];

  return (
    <>
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
            {/* Stats — all tappable */}
            <View style={styles.statsRow}>
              <StatCard
                label="Assigned" value={String(projects.length)}
                icon="folder" color={theme.primary}
                onPress={() => setFilterModal("assigned")}
              />
              <StatCard
                label="Pending Work" value={String(totalPendingDeliverables)}
                icon="clock" color={colors.warning}
                onPress={() => setFilterModal("pending_work")}
              />
            </View>
            <View style={styles.statsRow}>
              <StatCard
                label="In Progress" value={String(inProgress.length)}
                icon="activity" color={colors.primary}
                onPress={() => setFilterModal("in_progress")}
              />
              <StatCard
                label="Completed" value={String(completed.length)}
                icon="check-circle" color={colors.success}
                onPress={() => setFilterModal("completed")}
              />
            </View>
            {customise.length > 0 && (
              <View style={styles.statsRow}>
                <StatCard
                  label="Customisation Pending" value={String(customise.length)}
                  icon="edit-2" color="#f59e0b"
                  onPress={() => setFilterModal("customise")}
                />
                <View style={{ flex: 1 }} />
              </View>
            )}

            {/* Customisation alert */}
            {customise.length > 0 && (
              <TouchableOpacity
                onPress={() => setFilterModal("customise")}
                style={[styles.customiseAlert, { backgroundColor: "#fef9c3", borderColor: "#f59e0b" }]}
                activeOpacity={0.8}
              >
                <Feather name="edit-2" size={16} color="#b45309" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.customiseAlertTitle, { color: "#92400e" }]}>
                    {customise.length} project{customise.length > 1 ? "s" : ""} need customisation
                  </Text>
                  <Text style={[styles.customiseAlertSub, { color: "#b45309" }]}>
                    {customise.map((p) => p.projectName).join(", ")}
                  </Text>
                </View>
                <Feather name="chevron-right" size={16} color="#b45309" />
              </TouchableOpacity>
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

            {/* In Progress section */}
            {inProgress.length > 0 && (
              <>
                <View style={styles.sectionRow}>
                  <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 20, marginBottom: 0 }]}>In Progress</Text>
                  <TouchableOpacity onPress={() => setFilterModal("in_progress")} style={styles.seeAll}>
                    <Text style={[styles.seeAllText, { color: theme.primary }]}>See all</Text>
                    <Feather name="chevron-right" size={13} color={theme.primary} />
                  </TouchableOpacity>
                </View>
                {inProgress.slice(0, 3).map((p) => (
                  <MiniProjectCard key={p.id} project={p} colors={colors} theme={theme} onPress={() => openWork(p)} />
                ))}
              </>
            )}

            {/* Pending section */}
            {pending.length > 0 && (
              <>
                <View style={styles.sectionRow}>
                  <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 8, marginBottom: 0 }]}>Pending</Text>
                  <TouchableOpacity onPress={() => setFilterModal("pending_work")} style={styles.seeAll}>
                    <Text style={[styles.seeAllText, { color: colors.warning }]}>See all</Text>
                    <Feather name="chevron-right" size={13} color={colors.warning} />
                  </TouchableOpacity>
                </View>
                {pending.slice(0, 3).map((p) => (
                  <MiniProjectCard key={p.id} project={p} colors={colors} theme={theme} onPress={() => openWork(p)} />
                ))}
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

      {/* Filter Modal */}
      {filterModal && meta && (
        <Modal transparent animationType="slide" onRequestClose={() => setFilterModal(null)}>
          <View style={styles.overlay}>
            <TouchableOpacity style={styles.overlayBg} onPress={() => setFilterModal(null)} />
            <View style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: bottomPad + 16 }]}>
              <View style={styles.handle} />

              {/* Header */}
              <View style={styles.sheetHeader}>
                <View style={[styles.sheetIconWrap, {
                  backgroundColor: filterModal === "customise" ? "#fef3c7"
                    : filterModal === "completed" ? `${colors.success}18`
                    : filterModal === "in_progress" ? `${colors.primary}18`
                    : `${theme.primary}18`,
                }]}>
                  <Feather
                    name={meta.icon}
                    size={18}
                    color={
                      filterModal === "customise" ? "#b45309"
                      : filterModal === "completed" ? colors.success
                      : filterModal === "in_progress" ? colors.primary
                      : theme.primary
                    }
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sheetTitle, { color: colors.foreground }]}>{meta.title}</Text>
                  <Text style={[styles.sheetCount, { color: colors.mutedForeground }]}>
                    {filteredList.length} project{filteredList.length !== 1 ? "s" : ""}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setFilterModal(null)} style={{ padding: 4 }}>
                  <Feather name="x" size={20} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>

              <FlatList
                data={filteredList}
                keyExtractor={(p) => p.id}
                renderItem={({ item }) => (
                  <FilterProjectRow
                    project={item}
                    colors={colors}
                    theme={theme}
                    filterKey={filterModal}
                    onPress={() => openWork(item)}
                  />
                )}
                style={{ maxHeight: 480 }}
                contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 8 }}
                ListEmptyComponent={
                  <View style={styles.emptyFilter}>
                    <Feather name={meta.icon} size={28} color={colors.mutedForeground} />
                    <Text style={[styles.emptyFilterText, { color: colors.mutedForeground }]}>{meta.emptyMsg}</Text>
                  </View>
                }
                showsVerticalScrollIndicator={false}
              />

              <TouchableOpacity
                onPress={() => { setFilterModal(null); router.push("/(editor)/work"); }}
                style={[styles.goWorkBtn, { backgroundColor: theme.primary }]}
              >
                <Feather name="briefcase" size={15} color="#fff" />
                <Text style={styles.goWorkBtnText}>Open Work Screen</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

// ─── Mini project card for dashboard list ────────────────────────────────────
function MiniProjectCard({
  project, colors, theme, onPress,
}: {
  project: Project;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
  theme: { primary: string };
  onPress: () => void;
}) {
  const progress = project.totalDeliverables > 0
    ? project.completedDeliverables / project.totalDeliverables : 0;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.miniCard, { backgroundColor: colors.card, borderColor: project.revisionRequested ? "#f59e0b" : colors.border }]}
    >
      <View style={styles.miniCardTop}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.miniName, { color: colors.foreground }]} numberOfLines={1}>{project.projectName}</Text>
          <Text style={[styles.miniClient, { color: colors.mutedForeground }]} numberOfLines={1}>{project.clientName}</Text>
        </View>
        <StatusBadge status={project.status} />
      </View>
      <View style={[styles.miniProgress, { backgroundColor: colors.muted }]}>
        <View style={[styles.miniProgressFill, {
          backgroundColor: progress >= 1 ? colors.success : theme.primary,
          width: `${Math.round(progress * 100)}%` as `${number}%`,
        }]} />
      </View>
      <View style={styles.miniMeta}>
        <Text style={[styles.miniMetaText, { color: colors.mutedForeground }]}>
          {project.completedDeliverables}/{project.totalDeliverables} deliverables
        </Text>
        {project.deadline && (
          <Text style={[styles.miniMetaText, { color: colors.warning }]}>
            <Feather name="calendar" size={10} /> {new Date(project.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </Text>
        )}
        <Feather name="chevron-right" size={13} color={colors.mutedForeground} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Row inside the filter modal ─────────────────────────────────────────────
function FilterProjectRow({
  project, colors, theme, filterKey, onPress,
}: {
  project: Project;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
  theme: { primary: string };
  filterKey: FilterKey;
  onPress: () => void;
}) {
  const progress = project.totalDeliverables > 0
    ? project.completedDeliverables / project.totalDeliverables : 0;
  const pendingDels = project.totalDeliverables - project.completedDeliverables;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.filterRow, {
        backgroundColor: colors.background,
        borderColor: project.revisionRequested ? "#fde047" : colors.border,
        borderLeftColor: filterKey === "customise" ? "#f59e0b"
          : project.status === "completed" ? colors.success
          : project.status === "in_progress" ? colors.primary
          : colors.warning,
      }]}
    >
      <View style={styles.filterRowTop}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.filterName, { color: colors.foreground }]} numberOfLines={1}>{project.projectName}</Text>
          <Text style={[styles.filterClient, { color: colors.mutedForeground }]}>{project.clientName}</Text>
        </View>
        <StatusBadge status={project.status} />
      </View>

      {/* Progress bar */}
      <View style={[styles.filterProgressBar, { backgroundColor: colors.muted }]}>
        <View style={[styles.filterProgressFill, {
          backgroundColor: progress >= 1 ? colors.success : theme.primary,
          width: `${Math.round(progress * 100)}%` as `${number}%`,
        }]} />
      </View>

      {/* Meta row */}
      <View style={styles.filterMeta}>
        <View style={styles.filterMetaItem}>
          <Feather name="layers" size={11} color={colors.mutedForeground} />
          <Text style={[styles.filterMetaText, { color: colors.mutedForeground }]}>
            {project.completedDeliverables}/{project.totalDeliverables} done
          </Text>
        </View>
        {pendingDels > 0 && (
          <View style={styles.filterMetaItem}>
            <Feather name="clock" size={11} color={colors.warning} />
            <Text style={[styles.filterMetaText, { color: colors.warning }]}>{pendingDels} pending</Text>
          </View>
        )}
        {project.deadline && (
          <View style={styles.filterMetaItem}>
            <Feather name="calendar" size={11} color={colors.mutedForeground} />
            <Text style={[styles.filterMetaText, { color: colors.mutedForeground }]}>
              {new Date(project.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </Text>
          </View>
        )}
        {project.revisionRequested && (
          <View style={[styles.filterMetaItem, { backgroundColor: "#fef3c7", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }]}>
            <Feather name="edit-2" size={10} color="#b45309" />
            <Text style={[styles.filterMetaText, { color: "#b45309" }]}>Revision</Text>
          </View>
        )}
        <Feather name="arrow-right" size={13} color={theme.primary} style={{ marginLeft: "auto" }} />
      </View>
    </TouchableOpacity>
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
  customiseAlert: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  customiseAlertTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  customiseAlertSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 20, marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", marginBottom: 12 },
  seeAll: { flexDirection: "row", alignItems: "center", gap: 2 },
  seeAllText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  calLoader: { height: 120, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", padding: 32, borderRadius: 16, borderWidth: 1, gap: 8, marginTop: 20 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  // Mini project card
  miniCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8, marginBottom: 8 },
  miniCardTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  miniName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  miniClient: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  miniProgress: { height: 5, borderRadius: 3, overflow: "hidden" },
  miniProgressFill: { height: 5, borderRadius: 3 },
  miniMeta: { flexDirection: "row", alignItems: "center", gap: 10 },
  miniMetaText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  // Modal / sheet
  overlay: { flex: 1, justifyContent: "flex-end" },
  overlayBg: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 12, gap: 0 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#d1d5db", alignSelf: "center", marginBottom: 12 },
  sheetHeader: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.08)" },
  sheetIconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  sheetTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  sheetCount: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  emptyFilter: { alignItems: "center", gap: 8, paddingVertical: 32 },
  emptyFilterText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  goWorkBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 16, paddingVertical: 14, borderRadius: 14, marginTop: 8 },
  goWorkBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  // Filter rows
  filterRow: { borderRadius: 12, borderWidth: 1, borderLeftWidth: 4, padding: 12, gap: 8 },
  filterRowTop: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  filterName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  filterClient: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  filterProgressBar: { height: 5, borderRadius: 3, overflow: "hidden" },
  filterProgressFill: { height: 5, borderRadius: 3 },
  filterMeta: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
  filterMetaItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  filterMetaText: { fontSize: 11, fontFamily: "Inter_400Regular" },
});
