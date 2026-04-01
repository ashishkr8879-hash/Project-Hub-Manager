import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { StatusBadge } from "@/components/StatusBadge";
import { useColors } from "@/hooks/useColors";
import { fetchClients, fetchClientProjects, type Client, type Project } from "@/hooks/useApi";

const TYPE_LABELS: Record<string, string> = {
  ugc: "UGC", branded: "Branded", corporate: "Corporate",
  wedding: "Wedding", social_media: "Social", other: "Other",
};

const TYPE_COLORS: Record<string, string> = {
  ugc: "#f59e0b", branded: "#3b82f6", corporate: "#6366f1",
  wedding: "#ec4899", social_media: "#10b981", other: "#8b5cf6",
};

export default function ClientsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const { data: clients = [], isLoading, refetch } = useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients,
    refetchInterval: 30000,
  });

  const { data: clientDetail, isLoading: detailLoading } = useQuery({
    queryKey: ["client-projects", selectedClient?.id],
    queryFn: () => fetchClientProjects(selectedClient!.id),
    enabled: !!selectedClient,
  });

  function renderClient({ item }: { item: Client }) {
    const initials = item.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    return (
      <TouchableOpacity
        style={[styles.clientCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        activeOpacity={0.75}
        onPress={() => setSelectedClient(item)}
      >
        <View style={[styles.clientAvatar, { backgroundColor: `${colors.adminPrimary}18` }]}>
          <Text style={[styles.clientInitials, { color: colors.adminPrimary }]}>{initials}</Text>
        </View>
        <View style={styles.clientInfo}>
          <Text style={[styles.clientName, { color: colors.foreground }]}>{item.name}</Text>
          <Text style={[styles.clientBiz, { color: colors.mutedForeground }]}>{item.businessType} • {item.city}</Text>
        </View>
        <View style={styles.clientRight}>
          <TouchableOpacity onPress={() => Linking.openURL(`tel:${item.phone}`)} style={[styles.contactBtn, { backgroundColor: `${colors.success}15` }]}>
            <Feather name="phone" size={14} color={colors.success} />
          </TouchableOpacity>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.summaryBar, { backgroundColor: `${colors.adminPrimary}10`, borderBottomColor: colors.border }]}>
        <Feather name="users" size={16} color={colors.adminPrimary} />
        <Text style={[styles.summaryText, { color: colors.foreground }]}>
          <Text style={{ fontFamily: "Inter_700Bold" }}>{clients.length}</Text> Clients Total
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loader}><ActivityIndicator color={colors.adminPrimary} /></View>
      ) : clients.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="users" size={36} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No clients yet</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Add clients from the Admin Profile tab</Text>
        </View>
      ) : (
        <FlatList
          data={clients}
          keyExtractor={(c) => c.id}
          renderItem={renderClient}
          contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 100 }]}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.adminPrimary} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Client Detail Modal */}
      <Modal
        visible={!!selectedClient}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedClient(null)}
      >
        <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border, paddingTop: insets.top + 12 }]}>
            <TouchableOpacity onPress={() => setSelectedClient(null)}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Client Details</Text>
            <View style={{ width: 30 }} />
          </View>

          {selectedClient && (
            <FlatList
              data={clientDetail?.projects ?? []}
              keyExtractor={(p) => p.id}
              ListHeaderComponent={() => (
                <View>
                  {/* Client card */}
                  <View style={[styles.clientDetailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.clientDetailTop}>
                      <View style={[styles.clientDetailAvatar, { backgroundColor: `${colors.adminPrimary}18` }]}>
                        <Text style={[styles.clientDetailInitials, { color: colors.adminPrimary }]}>
                          {selectedClient.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.clientDetailName, { color: colors.foreground }]}>{selectedClient.name}</Text>
                        <Text style={[styles.clientDetailBiz, { color: colors.mutedForeground }]}>{selectedClient.businessType} • {selectedClient.city}</Text>
                      </View>
                    </View>
                    <View style={styles.clientContactRow}>
                      <TouchableOpacity
                        style={[styles.clientContactBtn, { backgroundColor: `${colors.success}15`, borderColor: `${colors.success}30` }]}
                        onPress={() => Linking.openURL(`tel:${selectedClient.phone}`)}
                      >
                        <Feather name="phone" size={14} color={colors.success} />
                        <Text style={[styles.clientContactText, { color: colors.success }]}>{selectedClient.phone}</Text>
                      </TouchableOpacity>
                      {selectedClient.email ? (
                        <TouchableOpacity
                          style={[styles.clientContactBtn, { backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}25` }]}
                          onPress={() => Linking.openURL(`mailto:${selectedClient.email}`)}
                        >
                          <Feather name="mail" size={14} color={colors.primary} />
                          <Text style={[styles.clientContactText, { color: colors.primary }]} numberOfLines={1}>{selectedClient.email}</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                    {clientDetail && (
                      <View style={[styles.totalValueBox, { backgroundColor: `${colors.success}12`, borderColor: `${colors.success}25` }]}>
                        <Feather name="trending-up" size={14} color={colors.success} />
                        <Text style={[styles.totalValueText, { color: colors.success }]}>
                          Total project value: <Text style={{ fontFamily: "Inter_700Bold" }}>₹{clientDetail.totalValue.toLocaleString()}</Text>
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={[styles.projectsLabel, { color: colors.mutedForeground }]}>
                    PROJECTS ({detailLoading ? "..." : clientDetail?.projects.length ?? 0})
                  </Text>
                  {detailLoading && <ActivityIndicator color={colors.adminPrimary} style={{ marginVertical: 16 }} />}
                </View>
              )}
              ListEmptyComponent={
                !detailLoading ? (
                  <View style={[styles.noProjects, { backgroundColor: colors.muted }]}>
                    <Feather name="folder" size={24} color={colors.mutedForeground} />
                    <Text style={[styles.noProjectsText, { color: colors.mutedForeground }]}>No projects for this client yet</Text>
                  </View>
                ) : null
              }
              renderItem={({ item: p }: { item: Project }) => (
                <ProjectRow project={p} colors={colors} />
              )}
              contentContainerStyle={[styles.modalList, { paddingBottom: insets.bottom + 40 }]}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

function ProjectRow({ project: p, colors }: { project: Project; colors: ReturnType<typeof import("@/hooks/useColors").useColors> }) {
  const typeColor = TYPE_COLORS[p.projectType] ?? "#8b5cf6";
  const typeLabel = TYPE_LABELS[p.projectType] ?? p.projectType;
  const progress = p.totalDeliverables > 0 ? p.completedDeliverables / p.totalDeliverables : 0;

  return (
    <View style={[styles.projectRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.projectRowTop}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.projectRowName, { color: colors.foreground }]} numberOfLines={1}>{p.projectName}</Text>
          <View style={styles.projectRowMeta}>
            <View style={[styles.typeTag, { backgroundColor: `${typeColor}18` }]}>
              <Text style={[styles.typeTagText, { color: typeColor }]}>{typeLabel}</Text>
            </View>
            <StatusBadge status={p.status} />
          </View>
        </View>
        <View style={styles.projectRowRight}>
          <Text style={[styles.projectRowValue, { color: colors.success }]}>₹{p.totalValue.toLocaleString()}</Text>
          {p.projectType === "ugc" && p.modelCost > 0 && (
            <Text style={[styles.projectRowModel, { color: "#b91c1c" }]}>-₹{p.modelCost.toLocaleString()} model</Text>
          )}
        </View>
      </View>
      <View style={styles.projectRowDetails}>
        <View style={styles.editorRow}>
          <Feather name="user" size={12} color={colors.mutedForeground} />
          <Text style={[styles.editorText, { color: colors.mutedForeground }]}>{p.editorName}</Text>
        </View>
        <Text style={[styles.deliverableText, { color: colors.mutedForeground }]}>
          {p.completedDeliverables}/{p.totalDeliverables} deliverables
        </Text>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` as `${number}%`, backgroundColor: p.status === "completed" ? colors.success : colors.adminPrimary }]} />
      </View>
      {p.revisionRequested && (
        <View style={[styles.revisionTag, { backgroundColor: "#fef3c7", borderColor: "#fde047" }]}>
          <Feather name="edit-2" size={11} color="#b45309" />
          <Text style={[styles.revisionTagText, { color: "#b45309" }]}>Customisation Requested</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  summaryBar: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, paddingHorizontal: 16, borderBottomWidth: 1 },
  summaryText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  list: { padding: 16, gap: 12 },
  clientCard: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 16, borderWidth: 1, gap: 12 },
  clientAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  clientInitials: { fontSize: 15, fontFamily: "Inter_700Bold" },
  clientInfo: { flex: 1 },
  clientName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  clientBiz: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  clientRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  contactBtn: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  // Modal
  modalRoot: { flex: 1 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  modalTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  modalList: { padding: 16 },
  clientDetailCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16, gap: 12 },
  clientDetailTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  clientDetailAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  clientDetailInitials: { fontSize: 18, fontFamily: "Inter_700Bold" },
  clientDetailName: { fontSize: 18, fontFamily: "Inter_700Bold" },
  clientDetailBiz: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  clientContactRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  clientContactBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  clientContactText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  totalValueBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10, borderWidth: 1 },
  totalValueText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  projectsLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1.2, marginBottom: 10 },
  noProjects: { alignItems: "center", padding: 24, borderRadius: 14, gap: 8 },
  noProjectsText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  // Project row
  projectRow: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10, gap: 8 },
  projectRowTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  projectRowName: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  projectRowMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  typeTag: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  typeTagText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  projectRowRight: { alignItems: "flex-end" },
  projectRowValue: { fontSize: 14, fontFamily: "Inter_700Bold" },
  projectRowModel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  projectRowDetails: { flexDirection: "row", justifyContent: "space-between" },
  editorRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  editorText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  deliverableText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  progressTrack: { height: 4, borderRadius: 2 },
  progressFill: { height: 4, borderRadius: 2 },
  revisionTag: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, alignSelf: "flex-start" },
  revisionTagText: { fontSize: 11, fontFamily: "Inter_500Medium" },
});
