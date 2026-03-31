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
import { fetchDashboardStats, fetchProjects } from "@/hooks/useApi";

export default function AdminDashboard() {
  const colors = useColors();
  const { setCurrentUser } = useApp();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
  });

  const {
    data: projects,
    isLoading: projectsLoading,
    refetch: refetchProjects,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });

  const isLoading = statsLoading || projectsLoading;

  async function handleRefresh() {
    await Promise.all([refetchStats(), refetchProjects()]);
  }

  function handleLogout() {
    setCurrentUser(null);
    router.replace("/login");
  }

  const recentProjects = (projects ?? []).slice(-5).reverse();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: bottomPad + 100 },
      ]}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor={colors.primary} />
      }
    >
      <View style={styles.topRow}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
            Good {getGreeting()}
          </Text>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Admin Dashboard
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
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <>
          <View style={styles.statsRow}>
            <StatCard
              label="Total Projects"
              value={String(stats?.totalProjects ?? 0)}
              icon="folder"
              color={colors.adminPrimary}
            />
            <StatCard
              label="Total Editors"
              value={String(stats?.totalEditors ?? 0)}
              icon="users"
              color={colors.editorPrimary}
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              label="Active"
              value={String(stats?.activeProjects ?? 0)}
              icon="activity"
              color={colors.warning}
            />
            <StatCard
              label="Today's Revenue"
              value={`$${(stats?.todayRevenue ?? 0).toLocaleString()}`}
              icon="trending-up"
              color={colors.success}
            />
          </View>

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Recent Projects
            </Text>
            <TouchableOpacity onPress={() => router.push("/(admin)/projects")}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
            </TouchableOpacity>
          </View>

          {recentProjects.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="folder" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No projects yet. Create one!
              </Text>
            </View>
          ) : (
            recentProjects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))
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
  content: { padding: 20, gap: 0 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 2 },
  title: { fontSize: 24, fontFamily: "Inter_700Bold" },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  loader: { flex: 1, alignItems: "center", paddingTop: 60 },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  seeAll: { fontSize: 14, fontFamily: "Inter_500Medium" },
  empty: {
    alignItems: "center",
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
});
