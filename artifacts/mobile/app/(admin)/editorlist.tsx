import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { StatusBadge } from "@/components/StatusBadge";
import { useColors } from "@/hooks/useColors";
import {
  fetchEditors,
  fetchEditorAnalytics,
  type Editor,
  type EditorAnalytics,
  type ProjectWithRevenue,
} from "@/hooks/useApi";

const INR = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

function StatCard({ label, value, color, icon }: { label: string; value: string | number; color?: string; icon: string }) {
  const colors = useColors();
  return (
    <View style={[statStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Feather name={icon as never} size={14} color={color ?? colors.primary} />
      <Text style={[statStyles.value, { color: color ?? colors.foreground }]}>{value}</Text>
      <Text style={[statStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: { flex: 1, minWidth: 72, alignItems: "center", gap: 3, paddingVertical: 10, paddingHorizontal: 6, borderRadius: 12, borderWidth: 1 },
  value: { fontSize: 15, fontFamily: "Inter_700Bold" },
  label: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center" },
});

// ─── Editor Detail Modal ───────────────────────────────────────────────────────

function EditorDetailModal({ editorId, onClose }: { editorId: string; onClose: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["editor-analytics", editorId],
    queryFn: () => fetchEditorAnalytics(editorId),
    enabled: !!editorId,
  });

  const avatarColor = AVATAR_COLORS[editorId.charCodeAt(editorId.length - 1) % AVATAR_COLORS.length];
  const profit = profile?.stats.companyProfit ?? 0;
  const profitColor = profit >= 0 ? colors.success : "#ef4444";

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[detailStyles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[detailStyles.header, { borderBottomColor: colors.border, paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={onClose} style={detailStyles.closeBtn}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[detailStyles.headerTitle, { color: colors.foreground }]}>Editor Analytics</Text>
          <View style={{ width: 36 }} />
        </View>

        {isLoading || !profile ? (
          <View style={detailStyles.loading}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[detailStyles.loadingText, { color: colors.mutedForeground }]}>Loading analytics...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={[detailStyles.body, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>

            {/* Profile hero */}
            <View style={[detailStyles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[detailStyles.avatar, { backgroundColor: avatarColor }]}>
                <Text style={detailStyles.avatarText}>{initials(profile.name)}</Text>
              </View>
              <View style={detailStyles.heroInfo}>
                <Text style={[detailStyles.heroName, { color: colors.foreground }]}>{profile.name}</Text>
                <Text style={[detailStyles.heroRole, { color: colors.primary }]}>{profile.specialization}</Text>
                <View style={detailStyles.heroMeta}>
                  {profile.location && (
                    <View style={detailStyles.metaChip}>
                      <Feather name="map-pin" size={11} color={colors.mutedForeground} />
                      <Text style={[detailStyles.metaChipText, { color: colors.mutedForeground }]}>{profile.location}</Text>
                    </View>
                  )}
                  <View style={detailStyles.metaChip}>
                    <Feather name="calendar" size={11} color={colors.mutedForeground} />
                    <Text style={[detailStyles.metaChipText, { color: colors.mutedForeground }]}>
                      Since {new Date(profile.joinedAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={[detailStyles.salaryBadge, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}30` }]}>
                <Text style={[detailStyles.salaryAmount, { color: colors.primary }]}>{INR(profile.monthlySalary)}</Text>
                <Text style={[detailStyles.salaryLabel, { color: colors.primary }]}>/ month</Text>
              </View>
            </View>

            {/* Contact row */}
            <View style={[detailStyles.contactRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={detailStyles.contactItem}>
                <Feather name="phone" size={13} color={colors.mutedForeground} />
                <Text style={[detailStyles.contactText, { color: colors.foreground }]}>{profile.phone}</Text>
              </View>
              <View style={[detailStyles.contactDivider, { backgroundColor: colors.border }]} />
              <View style={detailStyles.contactItem}>
                <Feather name="mail" size={13} color={colors.mutedForeground} />
                <Text style={[detailStyles.contactText, { color: colors.foreground }]} numberOfLines={1}>{profile.email}</Text>
              </View>
            </View>
            {profile.bankAccount && (
              <View style={[detailStyles.bankRow, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                <Feather name="credit-card" size={13} color={colors.mutedForeground} />
                <Text style={[detailStyles.bankText, { color: colors.mutedForeground }]}>Bank: </Text>
                <Text style={[detailStyles.bankText, { color: colors.foreground }]}>{profile.bankAccount}</Text>
              </View>
            )}

            {/* Project stats grid */}
            <Text style={[detailStyles.sectionTitle, { color: colors.foreground }]}>Project Overview</Text>
            <View style={detailStyles.statsGrid}>
              <StatCard label="Total" value={profile.stats.totalProjects} icon="folder" />
              <StatCard label="Pending" value={profile.stats.pendingProjects} color={colors.warning} icon="clock" />
              <StatCard label="In Progress" value={profile.stats.inProgressProjects} color={colors.primary} icon="play-circle" />
              <StatCard label="Completed" value={profile.stats.completedProjects} color={colors.success} icon="check-circle" />
            </View>
            <View style={[detailStyles.statsGrid, { marginTop: 8 }]}>
              <StatCard label="Customisation" value={profile.stats.customisationProjects} color="#f59e0b" icon="edit-2" />
              <StatCard label="Approved" value={profile.stats.approvedVideos} color={colors.success} icon="thumbs-up" />
              <StatCard label="Rejected" value={profile.stats.rejectedVideos} color="#ef4444" icon="thumbs-down" />
              <StatCard label="In Review" value={profile.stats.pendingReviewVideos} color={colors.primary} icon="eye" />
            </View>

            {/* Financial summary */}
            <Text style={[detailStyles.sectionTitle, { color: colors.foreground }]}>Financial Summary</Text>
            <View style={[detailStyles.financeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={detailStyles.financeRow}>
                <View style={detailStyles.financeLeft}>
                  <Feather name="trending-up" size={16} color={colors.success} />
                  <Text style={[detailStyles.financeLabel, { color: colors.mutedForeground }]}>Total Company Revenue</Text>
                </View>
                <Text style={[detailStyles.financeValue, { color: colors.success }]}>{INR(profile.stats.totalRevenue)}</Text>
              </View>
              <View style={[detailStyles.financeDivider, { backgroundColor: colors.border }]} />
              <View style={detailStyles.financeRow}>
                <View style={detailStyles.financeLeft}>
                  <Feather name="user" size={16} color={colors.mutedForeground} />
                  <Text style={[detailStyles.financeLabel, { color: colors.mutedForeground }]}>Fixed Monthly Salary</Text>
                </View>
                <Text style={[detailStyles.financeValue, { color: colors.foreground }]}>−{INR(profile.monthlySalary)}</Text>
              </View>
              <View style={[detailStyles.financeDivider, { backgroundColor: colors.border }]} />
              <View style={[detailStyles.financeRow, detailStyles.profitRow, { backgroundColor: `${profitColor}10`, borderRadius: 10 }]}>
                <View style={detailStyles.financeLeft}>
                  <Feather name={profit >= 0 ? "arrow-up-circle" : "arrow-down-circle"} size={16} color={profitColor} />
                  <Text style={[detailStyles.financeLabel, { color: profitColor, fontFamily: "Inter_600SemiBold" }]}>
                    Net {profit >= 0 ? "Profit" : "Loss"}
                  </Text>
                </View>
                <Text style={[detailStyles.financeValue, { color: profitColor, fontSize: 18 }]}>{INR(Math.abs(profit))}</Text>
              </View>
            </View>

            {/* Projects by Date */}
            <Text style={[detailStyles.sectionTitle, { color: colors.foreground }]}>Projects by Date</Text>
            {profile.projectsByDate.length === 0 ? (
              <View style={[detailStyles.emptyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="inbox" size={28} color={colors.mutedForeground} />
                <Text style={[detailStyles.emptyText, { color: colors.mutedForeground }]}>No projects yet</Text>
              </View>
            ) : (
              profile.projectsByDate.map((group) => {
                const isExpanded = expandedDate === group.date;
                return (
                  <View key={group.date} style={[detailStyles.dateGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setExpandedDate(isExpanded ? null : group.date);
                      }}
                      style={detailStyles.dateHeader}
                      activeOpacity={0.7}
                    >
                      <View style={detailStyles.dateLeft}>
                        <View style={[detailStyles.dateDot, { backgroundColor: colors.primary }]} />
                        <Text style={[detailStyles.dateLabel, { color: colors.foreground }]}>{formatDate(group.date + "T00:00:00")}</Text>
                        <View style={[detailStyles.dateBadge, { backgroundColor: `${colors.primary}15` }]}>
                          <Text style={[detailStyles.dateBadgeText, { color: colors.primary }]}>{group.projects.length} project{group.projects.length !== 1 ? "s" : ""}</Text>
                        </View>
                      </View>
                      <View style={detailStyles.dateRight}>
                        <Text style={[detailStyles.dayRevenue, { color: colors.success }]}>{INR(group.dayRevenue)}</Text>
                        <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
                      </View>
                    </TouchableOpacity>

                    {isExpanded && group.projects.map((proj) => (
                      <ProjectRow key={proj.id} project={proj} colors={colors} />
                    ))}
                  </View>
                );
              })
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

function ProjectRow({ project, colors }: { project: ProjectWithRevenue; colors: ReturnType<typeof useColors> }) {
  const TYPE_ICONS: Record<string, string> = {
    ugc: "video", branded: "star", corporate: "briefcase", ai_video: "cpu",
    editing: "scissors", wedding: "heart", social_media: "instagram", other: "more-horizontal",
  };

  return (
    <View style={[projectRowStyles.row, { borderTopColor: colors.border }]}>
      <View style={[projectRowStyles.typeIcon, { backgroundColor: `${colors.primary}12` }]}>
        <Feather name={TYPE_ICONS[project.projectType] as never ?? "folder"} size={13} color={colors.primary} />
      </View>
      <View style={projectRowStyles.info}>
        <Text style={[projectRowStyles.name, { color: colors.foreground }]} numberOfLines={1}>{project.projectName}</Text>
        <Text style={[projectRowStyles.client, { color: colors.mutedForeground }]} numberOfLines={1}>{project.clientName}</Text>
      </View>
      <View style={projectRowStyles.right}>
        <StatusBadge status={project.status} />
        <Text style={[projectRowStyles.revenue, { color: colors.success }]}>{INR(project.companyRevenue)}</Text>
        {project.revisionRequested && (
          <View style={[projectRowStyles.revTag, { backgroundColor: "#fef9c3" }]}>
            <Text style={projectRowStyles.revTagText}>Revision</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const projectRowStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, paddingHorizontal: 14, borderTopWidth: 1 },
  typeIcon: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  client: { fontSize: 11, fontFamily: "Inter_400Regular" },
  right: { alignItems: "flex-end", gap: 4 },
  revenue: { fontSize: 13, fontFamily: "Inter_700Bold" },
  revTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  revTagText: { fontSize: 9, fontFamily: "Inter_600SemiBold", color: "#92400e" },
});

const detailStyles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 14, paddingHorizontal: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  closeBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  body: { padding: 16, gap: 12 },

  heroCard: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  avatar: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  avatarText: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff" },
  heroInfo: { flex: 1, gap: 4 },
  heroName: { fontSize: 17, fontFamily: "Inter_700Bold" },
  heroRole: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  heroMeta: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 2 },
  metaChip: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaChipText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  salaryBadge: { alignItems: "center", padding: 8, borderRadius: 12, borderWidth: 1, flexShrink: 0 },
  salaryAmount: { fontSize: 15, fontFamily: "Inter_700Bold" },
  salaryLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },

  contactRow: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 12, borderWidth: 1 },
  contactItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  contactText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
  contactDivider: { width: 1, height: 20, marginHorizontal: 8 },

  bankRow: { flexDirection: "row", alignItems: "center", gap: 6, padding: 10, borderRadius: 10, borderWidth: 1 },
  bankText: { fontSize: 12, fontFamily: "Inter_400Regular" },

  sectionTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginTop: 4 },
  statsGrid: { flexDirection: "row", gap: 6 },

  financeCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  financeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14 },
  profitRow: { margin: 8 },
  financeLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  financeLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  financeValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  financeDivider: { height: 1, marginHorizontal: 14 },

  dateGroup: { borderRadius: 14, borderWidth: 1, overflow: "hidden", marginBottom: 0 },
  dateHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 12 },
  dateLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  dateDot: { width: 8, height: 8, borderRadius: 4 },
  dateLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  dateBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  dateBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  dateRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  dayRevenue: { fontSize: 14, fontFamily: "Inter_700Bold" },

  emptyBox: { alignItems: "center", padding: 32, borderRadius: 14, borderWidth: 1, gap: 8 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});

// ─── Editor List Screen ────────────────────────────────────────────────────────

export default function EditorListScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [selectedEditorId, setSelectedEditorId] = useState<string | null>(null);

  const { data: editors = [], isLoading, refetch } = useQuery({
    queryKey: ["editors"],
    queryFn: fetchEditors,
  });

  function renderEditor({ item, index }: { item: Editor; index: number }) {
    const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setSelectedEditorId(item.id);
        }}
        style={[listStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={[listStyles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={listStyles.avatarText}>{initials(item.name)}</Text>
        </View>
        <View style={listStyles.info}>
          <Text style={[listStyles.name, { color: colors.foreground }]}>{item.name}</Text>
          <Text style={[listStyles.role, { color: colors.primary }]}>{item.specialization}</Text>
          <View style={listStyles.metaRow}>
            {item.location && (
              <View style={listStyles.metaItem}>
                <Feather name="map-pin" size={11} color={colors.mutedForeground} />
                <Text style={[listStyles.metaText, { color: colors.mutedForeground }]}>{item.location}</Text>
              </View>
            )}
            <View style={listStyles.metaItem}>
              <Feather name="calendar" size={11} color={colors.mutedForeground} />
              <Text style={[listStyles.metaText, { color: colors.mutedForeground }]}>
                {new Date(item.joinedAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
              </Text>
            </View>
          </View>
        </View>
        <View style={listStyles.chevronWrap}>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[listStyles.container, { backgroundColor: colors.background }]}>
      {isLoading ? (
        <View style={listStyles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={editors}
          keyExtractor={(e) => e.id}
          renderItem={renderEditor}
          contentContainerStyle={[listStyles.list, { paddingBottom: bottomPad + 20 }]}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isLoading}
          ListHeaderComponent={
            <View style={listStyles.listHeader}>
              <Text style={[listStyles.listHeaderTitle, { color: colors.foreground }]}>
                {editors.length} team member{editors.length !== 1 ? "s" : ""}
              </Text>
              <Text style={[listStyles.listHeaderSub, { color: colors.mutedForeground }]}>
                Tap any member to view full analytics
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={[listStyles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="users" size={32} color={colors.mutedForeground} />
              <Text style={[listStyles.emptyText, { color: colors.mutedForeground }]}>No editors found</Text>
            </View>
          }
        />
      )}

      {selectedEditorId && (
        <EditorDetailModal
          editorId={selectedEditorId}
          onClose={() => setSelectedEditorId(null)}
        />
      )}
    </View>
  );
}

const listStyles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: 16, gap: 10 },
  listHeader: { marginBottom: 4 },
  listHeaderTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  listHeaderSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  card: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 16, borderWidth: 1,
  },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  avatarText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
  info: { flex: 1, gap: 3 },
  name: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  role: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  metaRow: { flexDirection: "row", gap: 10, flexWrap: "wrap", marginTop: 2 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  chevronWrap: { flexShrink: 0 },
  empty: { alignItems: "center", padding: 40, borderRadius: 16, borderWidth: 1, gap: 8, marginTop: 20 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
