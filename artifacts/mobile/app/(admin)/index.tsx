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
import { NotificationBell } from "@/components/NotificationBell";
import { MonthCalendar } from "@/components/MonthCalendar";
import { useColors } from "@/hooks/useColors";
import { fetchDashboardStats, fetchProjects, fetchCalendar, fetchEditors, type Editor } from "@/hooks/useApi";

// ── Team stat card with editor avatar bubbles ─────────────────────────────────
function TeamStatCard({ editors, color, colors }: { editors: Editor[]; color: string; colors: ReturnType<typeof useColors> }) {
  const AVATAR_SIZE = 28;
  const OVERLAP = 10;
  const MAX_SHOWN = 5;
  const shown = editors.slice(0, MAX_SHOWN);
  const extra = editors.length - MAX_SHOWN;

  return (
    <View style={[tStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[tStyles.iconWrap, { backgroundColor: `${color}18` }]}>
        <Feather name="users" size={20} color={color} />
      </View>
      <Text style={[tStyles.value, { color: colors.foreground }]}>{editors.length}</Text>
      <Text style={[tStyles.label, { color: colors.mutedForeground }]}>Total Team</Text>

      {/* Avatar bubbles */}
      {editors.length > 0 && (
        <View style={[tStyles.avatarRow, { width: shown.length * (AVATAR_SIZE - OVERLAP) + OVERLAP + (extra > 0 ? AVATAR_SIZE : 0) }]}>
          {shown.map((e, idx) => {
            const initials = e.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
            const hue = (e.id.charCodeAt(1) * 47) % 360;
            return (
              <View key={e.id}
                style={[tStyles.avatar, {
                  width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2,
                  backgroundColor: `hsl(${hue},60%,55%)`,
                  left: idx * (AVATAR_SIZE - OVERLAP),
                  borderColor: colors.card,
                }]}>
                <Text style={[tStyles.avatarText, { fontSize: AVATAR_SIZE * 0.33 }]}>{initials}</Text>
              </View>
            );
          })}
          {extra > 0 && (
            <View style={[tStyles.avatar, {
              width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2,
              backgroundColor: `${color}30`,
              left: shown.length * (AVATAR_SIZE - OVERLAP),
              borderColor: colors.card,
            }]}>
              <Text style={[tStyles.avatarText, { fontSize: AVATAR_SIZE * 0.3, color }]}>+{extra}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const tStyles = StyleSheet.create({
  card: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 16, gap: 6, alignItems: "flex-start", minHeight: 120 },
  iconWrap: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  value: { fontSize: 22, fontFamily: "Inter_700Bold" },
  label: { fontSize: 12, fontFamily: "Inter_400Regular" },
  avatarRow: { position: "relative", height: 30, marginTop: 4 },
  avatar: { position: "absolute", alignItems: "center", justifyContent: "center", borderWidth: 2 },
  avatarText: { color: "#fff", fontFamily: "Inter_700Bold" },
});

// ── Main dashboard ─────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
    refetchInterval: 30000,
  });

  const { data: projects = [], isLoading: projectsLoading, refetch: refetchProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });

  const { data: calendarData = {}, isLoading: calLoading, refetch: refetchCal } = useQuery({
    queryKey: ["calendar-admin"],
    queryFn: () => fetchCalendar(currentMonth),
  });

  const { data: editors = [], refetch: refetchEditors } = useQuery({
    queryKey: ["editors"],
    queryFn: fetchEditors,
  });

  const isLoading = statsLoading || projectsLoading;

  async function handleRefresh() {
    await Promise.all([refetchStats(), refetchProjects(), refetchCal(), refetchEditors()]);
  }

  const recentProjects = (projects ?? []).slice(-4).reverse();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 100 }]}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor={colors.primary} />}
    >
      <View style={styles.topRow}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Good {getGreeting()}</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Admin Dashboard</Text>
        </View>
        <NotificationBell targetRoute="/(admin)/notifications" />
      </View>

      {isLoading ? (
        <View style={styles.loader}><ActivityIndicator color={colors.primary} /></View>
      ) : (
        <>
          {/* Stats */}
          <View style={styles.statsRow}>
            <StatCard label="Total Projects" value={String(stats?.totalProjects ?? 0)} icon="folder" color={colors.adminPrimary} />
            <TeamStatCard editors={editors} color={colors.editorPrimary} colors={colors} />
          </View>
          <View style={styles.statsRow}>
            <StatCard label="Active"          value={String(stats?.activeProjects ?? 0)} icon="activity"    color={colors.warning} />
            <StatCard label="Today's Revenue" value={`₹${(stats?.todayRevenue ?? 0).toLocaleString()}`} icon="trending-up" color={colors.success} />
          </View>
          <View style={styles.statsRow}>
            <StatCard label="Customisation"   value={String(stats?.customisationProjects ?? 0)} icon="edit-2"     color="#f59e0b" />
            <StatCard label="Pending Reviews" value={String(stats?.pendingReviews ?? 0)}         icon="film"       color={colors.destructive} />
          </View>

          {/* Alerts */}
          {(stats?.pendingReviews ?? 0) > 0 && (
            <TouchableOpacity
              onPress={() => router.push("/(admin)/notifications" as never)}
              style={[styles.alert, { backgroundColor: "#fef3c7", borderColor: colors.warning }]}
            >
              <Feather name="film" size={16} color={colors.warning} />
              <Text style={[styles.alertText, { color: "#92400e" }]}>
                {stats?.pendingReviews} video{(stats?.pendingReviews ?? 0) > 1 ? "s" : ""} waiting for your review
              </Text>
              <Feather name="chevron-right" size={16} color={colors.warning} />
            </TouchableOpacity>
          )}
          {(stats?.customisationProjects ?? 0) > 0 && (
            <TouchableOpacity
              onPress={() => router.push("/(admin)/projects" as never)}
              style={[styles.alert, { backgroundColor: "#fef9c3", borderColor: "#f59e0b" }]}
            >
              <Feather name="edit-2" size={16} color="#b45309" />
              <Text style={[styles.alertText, { color: "#92400e" }]}>
                {stats?.customisationProjects} project{(stats?.customisationProjects ?? 0) > 1 ? "s" : ""} need customisation
              </Text>
              <Feather name="chevron-right" size={16} color="#b45309" />
            </TouchableOpacity>
          )}

          {/* Month Calendar */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Project Calendar</Text>
          </View>
          {calLoading ? (
            <View style={[styles.calLoader, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ActivityIndicator color={colors.adminPrimary} />
            </View>
          ) : (
            <MonthCalendar calendarData={calendarData} accentColor={colors.adminPrimary} />
          )}

          {/* Recent Projects */}
          <View style={[styles.sectionHeader, { marginTop: 20 }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Projects</Text>
            <TouchableOpacity onPress={() => router.push("/(admin)/projects" as never)}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
            </TouchableOpacity>
          </View>
          {recentProjects.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="folder" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No projects yet. Create one!</Text>
            </View>
          ) : (
            recentProjects.map((p) => <ProjectCard key={p.id} project={p} />)
          )}
        </>
      )}
    </ScrollView>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 2 },
  title: { fontSize: 24, fontFamily: "Inter_700Bold" },
  loader: { flex: 1, alignItems: "center", paddingTop: 60 },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  alert: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  alertText: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  seeAll: { fontSize: 14, fontFamily: "Inter_500Medium" },
  calLoader: { height: 120, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", padding: 32, borderRadius: 16, borderWidth: 1, gap: 8 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
});
