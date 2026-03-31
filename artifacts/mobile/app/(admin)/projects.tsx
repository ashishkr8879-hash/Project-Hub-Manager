import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { ProjectCard } from "@/components/ProjectCard";
import { useColors } from "@/hooks/useColors";
import { fetchProjects, type Project } from "@/hooks/useApi";

const FILTERS = ["All", "Pending", "In Progress", "Completed"] as const;

export default function ProjectsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [search, setSearch] = useState("");

  const { data: projects = [], isLoading, refetch } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });

  const filtered = projects.filter((p) => {
    const matchFilter =
      filter === "All" ||
      (filter === "Pending" && p.status === "pending") ||
      (filter === "In Progress" && p.status === "in_progress") ||
      (filter === "Completed" && p.status === "completed");
    const matchSearch =
      !search ||
      p.projectName.toLowerCase().includes(search.toLowerCase()) ||
      p.clientName.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchBar, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Search projects or clients..."
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={FILTERS}
        keyExtractor={(item) => item}
        style={styles.filterList}
        contentContainerStyle={styles.filterContent}
        renderItem={({ item }) => {
          const active = item === filter;
          return (
            <TouchableOpacity
              onPress={() => setFilter(item)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: active ? colors.primary : colors.muted,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: active ? "#fff" : colors.mutedForeground },
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => <ProjectCard project={item} />}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: bottomPad + 100 },
          ]}
          ListEmptyComponent={
            <View style={[styles.empty, { borderColor: colors.border }]}>
              <Feather name="folder" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No projects found
              </Text>
            </View>
          }
          refreshing={isLoading}
          onRefresh={refetch}
          scrollEnabled
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  filterList: { maxHeight: 44 },
  filterContent: { paddingHorizontal: 16, gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  loader: { flex: 1, alignItems: "center", paddingTop: 60 },
  listContent: { paddingHorizontal: 16, paddingTop: 12 },
  empty: {
    alignItems: "center",
    padding: 40,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    margin: 16,
  },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
