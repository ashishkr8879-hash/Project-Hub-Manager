import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { StatusBadge } from "@/components/StatusBadge";
import { useColors } from "@/hooks/useColors";
import {
  fetchClients, fetchClientProjects,
  updateProjectPayment,
  type Client, type Project,
} from "@/hooks/useApi";

const TYPE_LABELS: Record<string, string> = {
  ugc: "UGC", branded: "Branded", corporate: "Corporate",
  wedding: "Wedding", social_media: "Social", other: "Other",
};
const TYPE_COLORS: Record<string, string> = {
  ugc: "#f59e0b", branded: "#3b82f6", corporate: "#6366f1",
  wedding: "#ec4899", social_media: "#10b981", other: "#8b5cf6",
};

// Payment status helper
function paymentStatus(paid: number, total: number) {
  if (paid === 0) return { label: "Unpaid", color: "#ef4444", bg: "#fee2e2" };
  if (paid >= total) return { label: "Paid", color: "#16a34a", bg: "#dcfce7" };
  return { label: "Partial", color: "#d97706", bg: "#fef3c7" };
}

export default function ClientsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const queryClient = useQueryClient();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [search, setSearch] = useState("");

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

  const filtered = search.trim()
    ? clients.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.businessType.toLowerCase().includes(search.toLowerCase()) ||
        c.city.toLowerCase().includes(search.toLowerCase())
      )
    : clients;

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
          {item.phone ? (
            <Text style={[styles.clientPhone, { color: colors.mutedForeground }]}>{item.phone}</Text>
          ) : null}
        </View>
        <View style={styles.clientRight}>
          <TouchableOpacity
            onPress={() => Linking.openURL(`tel:${item.phone}`)}
            style={[styles.callBtn, { backgroundColor: `${colors.success}15` }]}
          >
            <Feather name="phone" size={15} color={colors.success} />
          </TouchableOpacity>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Summary bar */}
      <View style={[styles.summaryBar, { backgroundColor: `${colors.adminPrimary}10`, borderBottomColor: colors.border }]}>
        <View style={styles.summaryItem}>
          <Feather name="users" size={14} color={colors.adminPrimary} />
          <Text style={[styles.summaryText, { color: colors.foreground }]}>
            <Text style={{ fontFamily: "Inter_700Bold" }}>{clients.length}</Text> Clients
          </Text>
        </View>
      </View>

      {/* Search */}
      <View style={[styles.searchRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          value={search}
          onChangeText={setSearch}
          placeholder="Search clients..."
          placeholderTextColor={colors.mutedForeground}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loader}><ActivityIndicator color={colors.adminPrimary} /></View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="users" size={36} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            {search ? "No results found" : "No clients yet"}
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            {search ? `No clients match "${search}"` : "Add clients from the Profile tab"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
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
          {/* Modal header bar */}
          <View style={[styles.modalHeaderBar, { borderBottomColor: colors.border, paddingTop: insets.top + 12 }]}>
            <TouchableOpacity onPress={() => setSelectedClient(null)} style={styles.backBtn}>
              <Feather name="arrow-left" size={20} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Client Profile</Text>
            {selectedClient && (
              <TouchableOpacity
                onPress={() => Linking.openURL(`tel:${selectedClient.phone}`)}
                style={[styles.headerCallBtn, { backgroundColor: `${colors.success}15` }]}
              >
                <Feather name="phone-call" size={16} color={colors.success} />
              </TouchableOpacity>
            )}
          </View>

          {selectedClient && (
            <ScrollView contentContainerStyle={[styles.modalScroll, { paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 40 }]} showsVerticalScrollIndicator={false}>
              {/* Profile hero */}
              <View style={[styles.heroCard, { backgroundColor: colors.adminPrimary }]}>
                <View style={styles.heroAvatarRing}>
                  <View style={[styles.heroAvatar, { backgroundColor: "#fff" }]}>
                    <Text style={[styles.heroInitials, { color: colors.adminPrimary }]}>
                      {selectedClient.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.heroName}>{selectedClient.name}</Text>
                <Text style={styles.heroBiz}>{selectedClient.businessType}</Text>
                {selectedClient.city ? (
                  <View style={styles.heroCity}>
                    <Feather name="map-pin" size={12} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.heroCityText}>{selectedClient.city}</Text>
                  </View>
                ) : null}
                {/* Quick action buttons */}
                <View style={styles.heroActions}>
                  <TouchableOpacity
                    style={styles.heroActionBtn}
                    onPress={() => Linking.openURL(`tel:${selectedClient.phone}`)}
                  >
                    <Feather name="phone" size={16} color="#fff" />
                    <Text style={styles.heroActionText}>Call</Text>
                  </TouchableOpacity>
                  {selectedClient.email ? (
                    <TouchableOpacity
                      style={styles.heroActionBtn}
                      onPress={() => Linking.openURL(`mailto:${selectedClient.email}`)}
                    >
                      <Feather name="mail" size={16} color="#fff" />
                      <Text style={styles.heroActionText}>Email</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>

              {/* Contact info row */}
              <View style={[styles.contactCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {selectedClient.phone ? (
                  <ContactRow icon="phone" label="Phone" value={selectedClient.phone} onPress={() => Linking.openURL(`tel:${selectedClient.phone}`)} colors={colors} />
                ) : null}
                {selectedClient.email ? (
                  <ContactRow icon="mail" label="Email" value={selectedClient.email} onPress={() => Linking.openURL(`mailto:${selectedClient.email}`)} colors={colors} />
                ) : null}
                <ContactRow icon="briefcase" label="Business Type" value={selectedClient.businessType} colors={colors} />
                {selectedClient.city ? <ContactRow icon="map-pin" label="City" value={selectedClient.city} colors={colors} /> : null}
                <ContactRow icon="calendar" label="Client Since" value={new Date(selectedClient.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} colors={colors} />
              </View>

              {/* Financial summary */}
              {detailLoading ? (
                <ActivityIndicator color={colors.adminPrimary} style={{ marginVertical: 20 }} />
              ) : clientDetail ? (
                <>
                  <FinancialSummary projects={clientDetail.projects} colors={colors} />

                  {/* Projects */}
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Projects</Text>
                    <View style={[styles.countBadge, { backgroundColor: `${colors.adminPrimary}15` }]}>
                      <Text style={[styles.countText, { color: colors.adminPrimary }]}>{clientDetail.projects.length}</Text>
                    </View>
                  </View>

                  {clientDetail.projects.length === 0 ? (
                    <View style={[styles.noProjects, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                      <Feather name="folder" size={28} color={colors.mutedForeground} />
                      <Text style={[styles.noProjectsText, { color: colors.mutedForeground }]}>No projects yet</Text>
                    </View>
                  ) : (
                    clientDetail.projects.map((p) => (
                      <ProjectCard
                        key={p.id}
                        project={p}
                        colors={colors}
                        onPaymentUpdate={(paid) => {
                          updateProjectPayment(p.id, paid).then(() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            queryClient.invalidateQueries({ queryKey: ["client-projects", selectedClient.id] });
                            queryClient.invalidateQueries({ queryKey: ["projects"] });
                          }).catch(() => Alert.alert("Error", "Could not update payment"));
                        }}
                      />
                    ))
                  )}
                </>
              ) : null}
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

// ─── Financial Summary ─────────────────────────────────────────────────────────
function FinancialSummary({ projects, colors }: { projects: Project[]; colors: ReturnType<typeof import("@/hooks/useColors").useColors> }) {
  const totalValue   = projects.reduce((s, p) => s + p.totalValue, 0);
  const totalPaid    = projects.reduce((s, p) => s + (p.paidAmount ?? 0), 0);
  const totalPending = totalValue - totalPaid;
  const totalModelCost = projects.filter(p => p.projectType === "ugc").reduce((s, p) => s + (p.modelCost ?? 0), 0);

  return (
    <View style={[styles.financialCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.financialTitle, { color: colors.foreground }]}>Financial Overview</Text>
      <View style={styles.financialGrid}>
        <FinBox label="Total Value" value={`₹${totalValue.toLocaleString()}`} color={colors.primary} bg={`${colors.primary}12`} />
        <FinBox label="Received" value={`₹${totalPaid.toLocaleString()}`} color="#16a34a" bg="#dcfce7" />
        <FinBox label="Pending" value={`₹${totalPending.toLocaleString()}`} color={totalPending > 0 ? "#ef4444" : "#16a34a"} bg={totalPending > 0 ? "#fee2e2" : "#dcfce7"} />
        {totalModelCost > 0 && (
          <FinBox label="Model Cost" value={`₹${totalModelCost.toLocaleString()}`} color="#92400e" bg="#fef3c7" />
        )}
      </View>
      {/* Total payment bar */}
      {totalValue > 0 && (
        <View style={{ marginTop: 10 }}>
          <View style={[styles.payBar, { backgroundColor: colors.muted }]}>
            <View style={[styles.payBarFill, { width: `${Math.min((totalPaid / totalValue) * 100, 100)}%`, backgroundColor: totalPaid >= totalValue ? "#16a34a" : colors.adminPrimary }]} />
          </View>
          <Text style={[styles.payBarLabel, { color: colors.mutedForeground }]}>
            {Math.round((totalPaid / totalValue) * 100)}% received
          </Text>
        </View>
      )}
    </View>
  );
}

function FinBox({ label, value, color, bg }: { label: string; value: string; color: string; bg: string }) {
  return (
    <View style={[styles.finBox, { backgroundColor: bg }]}>
      <Text style={[styles.finValue, { color }]}>{value}</Text>
      <Text style={[styles.finLabel, { color }]}>{label}</Text>
    </View>
  );
}

// ─── Project Card ──────────────────────────────────────────────────────────────
function ProjectCard({
  project: p, colors, onPaymentUpdate,
}: {
  project: Project;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
  onPaymentUpdate: (paid: number) => void;
}) {
  const [showPayEdit, setShowPayEdit] = useState(false);
  const [payInput, setPayInput] = useState(String(p.paidAmount ?? 0));
  const typeColor = TYPE_COLORS[p.projectType] ?? "#8b5cf6";
  const typeLabel = TYPE_LABELS[p.projectType] ?? p.projectType;
  const progress = p.totalDeliverables > 0 ? p.completedDeliverables / p.totalDeliverables : 0;
  const paidAmt = p.paidAmount ?? 0;
  const pendingAmt = p.totalValue - paidAmt;
  const ps = paymentStatus(paidAmt, p.totalValue);
  const isOverdue = p.deadline && new Date(p.deadline) < new Date() && p.status !== "completed";

  function handlePaySave() {
    const val = parseFloat(payInput);
    if (isNaN(val) || val < 0) { Alert.alert("Invalid", "Enter a valid amount"); return; }
    onPaymentUpdate(val);
    setShowPayEdit(false);
  }

  return (
    <View style={[styles.projectCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Header row */}
      <View style={styles.pcHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.pcName, { color: colors.foreground }]} numberOfLines={1}>{p.projectName}</Text>
          <View style={styles.pcTagRow}>
            <View style={[styles.typeTag, { backgroundColor: `${typeColor}18` }]}>
              <Text style={[styles.typeTagText, { color: typeColor }]}>{typeLabel}</Text>
            </View>
            <StatusBadge status={p.status} />
            {p.revisionRequested && (
              <View style={[styles.revTag, { backgroundColor: "#fef3c7" }]}>
                <Feather name="edit-2" size={10} color="#b45309" />
                <Text style={[styles.revTagText, { color: "#b45309" }]}>Revision</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Editor assigned */}
      <View style={[styles.editorRow, { backgroundColor: `${colors.editorPrimary}10`, borderColor: `${colors.editorPrimary}20` }]}>
        <View style={[styles.editorAvatar, { backgroundColor: `${colors.editorPrimary}20` }]}>
          <Text style={[styles.editorAvatarText, { color: colors.editorPrimary }]}>
            {p.editorName.split(" ").map((w) => w[0]).join("").slice(0, 2)}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.editorLabel, { color: colors.mutedForeground }]}>Assigned To</Text>
          <Text style={[styles.editorName, { color: colors.editorPrimary }]}>{p.editorName}</Text>
        </View>
        {p.editorPhone && (
          <TouchableOpacity onPress={() => Linking.openURL(`tel:${p.editorPhone}`)} style={[styles.editorCallBtn, { backgroundColor: `${colors.success}15` }]}>
            <Feather name="phone" size={13} color={colors.success} />
          </TouchableOpacity>
        )}
      </View>

      {/* Progress */}
      <View style={styles.progressSection}>
        <View style={styles.progressLabelRow}>
          <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
            Progress: {p.completedDeliverables}/{p.totalDeliverables} deliverables
          </Text>
          <Text style={[styles.progressPct, { color: progress === 1 ? colors.success : colors.primary }]}>
            {Math.round(progress * 100)}%
          </Text>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
          <View style={[styles.progressFill, {
            width: `${progress * 100}%` as `${number}%`,
            backgroundColor: p.status === "completed" ? colors.success : colors.adminPrimary,
          }]} />
        </View>
      </View>

      {/* Deadline */}
      {p.deadline && (
        <View style={[styles.deadlineRow, { backgroundColor: isOverdue ? "#fee2e2" : "#f0f9ff", borderColor: isOverdue ? "#fecaca" : "#bae6fd" }]}>
          <Feather name="calendar" size={13} color={isOverdue ? "#ef4444" : "#0284c7"} />
          <Text style={[styles.deadlineText, { color: isOverdue ? "#dc2626" : "#0369a1" }]}>
            {isOverdue ? "OVERDUE · " : "Deadline: "}
            {new Date(p.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </Text>
        </View>
      )}

      {/* Payment section */}
      <View style={[styles.paySection, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        <View style={styles.payHeader}>
          <View>
            <Text style={[styles.payLabel, { color: colors.mutedForeground }]}>Payment</Text>
            <View style={[styles.payStatusChip, { backgroundColor: ps.bg }]}>
              <Text style={[styles.payStatusText, { color: ps.color }]}>{ps.label}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => { setPayInput(String(paidAmt)); setShowPayEdit(!showPayEdit); }} style={[styles.editPayBtn, { borderColor: colors.border }]}>
            <Feather name="edit-2" size={13} color={colors.primary} />
            <Text style={[styles.editPayText, { color: colors.primary }]}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.payAmounts}>
          <PayAmount label="Total" value={p.totalValue} color={colors.foreground} />
          <PayAmount label="Received" value={paidAmt} color="#16a34a" />
          <PayAmount label="Pending" value={pendingAmt} color={pendingAmt > 0 ? "#ef4444" : "#16a34a"} />
          {p.projectType === "ugc" && p.modelCost > 0 && (
            <PayAmount label="Model Cost" value={p.modelCost} color="#92400e" />
          )}
        </View>

        {/* Payment bar */}
        {p.totalValue > 0 && (
          <View style={{ marginTop: 6 }}>
            <View style={[styles.payBar2, { backgroundColor: colors.border }]}>
              <View style={[styles.payBarFill2, {
                width: `${Math.min((paidAmt / p.totalValue) * 100, 100)}%` as `${number}%`,
                backgroundColor: paidAmt >= p.totalValue ? "#16a34a" : "#f59e0b",
              }]} />
            </View>
          </View>
        )}

        {/* Edit payment form */}
        {showPayEdit && (
          <View style={[styles.payEditForm, { borderTopColor: colors.border }]}>
            <Text style={[styles.payEditLabel, { color: colors.foreground }]}>Update received amount (₹)</Text>
            <View style={styles.payEditRow}>
              <TextInput
                style={[styles.payEditInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                value={payInput}
                onChangeText={setPayInput}
                keyboardType="numeric"
                placeholder="Enter amount"
                placeholderTextColor={colors.mutedForeground}
              />
              <TouchableOpacity onPress={handlePaySave} style={[styles.paySaveBtn, { backgroundColor: colors.primary }]}>
                <Text style={styles.paySaveBtnText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowPayEdit(false)} style={[styles.payCancelBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Feather name="x" size={14} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

function PayAmount({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.payAmountItem}>
      <Text style={[styles.payAmountLabel, { color }]}>{label}</Text>
      <Text style={[styles.payAmountValue, { color }]}>₹{value.toLocaleString()}</Text>
    </View>
  );
}

function ContactRow({ icon, label, value, onPress, colors }: {
  icon: string; label: string; value: string;
  onPress?: () => void;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
}) {
  const Row = onPress ? TouchableOpacity : View;
  return (
    <Row onPress={onPress} style={styles.contactInfoRow}>
      <View style={[styles.contactIconBox, { backgroundColor: `${colors.primary}10` }]}>
        <Feather name={icon as never} size={14} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.contactInfoLabel, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[styles.contactInfoValue, { color: onPress ? colors.primary : colors.foreground }]} numberOfLines={1}>{value}</Text>
      </View>
      {onPress && <Feather name="chevron-right" size={14} color={colors.mutedForeground} />}
    </Row>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  summaryBar: { flexDirection: "row", alignItems: "center", gap: 16, padding: 12, paddingHorizontal: 16, borderBottomWidth: 1 },
  summaryItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  summaryText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 8, margin: 12, padding: 10, borderRadius: 12, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, padding: 32 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  list: { padding: 14, gap: 10 },
  // Client list card
  clientCard: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 16, borderWidth: 1, gap: 12 },
  clientAvatar: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  clientInitials: { fontSize: 16, fontFamily: "Inter_700Bold" },
  clientInfo: { flex: 1, gap: 1 },
  clientName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  clientBiz: { fontSize: 12, fontFamily: "Inter_400Regular" },
  clientPhone: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  clientRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  callBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  // Modal
  modalRoot: { flex: 1 },
  modalHeaderBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  backBtn: { padding: 4 },
  headerCallBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  modalTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  modalScroll: { gap: 12, padding: 16 },
  // Hero card
  heroCard: { borderRadius: 20, padding: 24, alignItems: "center", gap: 6 },
  heroAvatarRing: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: "rgba(255,255,255,0.4)", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  heroAvatar: { width: 68, height: 68, borderRadius: 34, alignItems: "center", justifyContent: "center" },
  heroInitials: { fontSize: 24, fontFamily: "Inter_700Bold" },
  heroName: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  heroBiz: { fontSize: 13, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.8)" },
  heroCity: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  heroCityText: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.75)" },
  heroActions: { flexDirection: "row", gap: 10, marginTop: 12 },
  heroActionBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" },
  heroActionText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff" },
  // Contact card
  contactCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  contactInfoRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderBottomWidth: 0 },
  contactIconBox: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  contactInfoLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  contactInfoValue: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  // Financial summary
  financialCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
  financialTitle: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 12 },
  financialGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  finBox: { flex: 1, minWidth: "45%", borderRadius: 12, padding: 12, gap: 2 },
  finValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
  finLabel: { fontSize: 11, fontFamily: "Inter_400Regular", opacity: 0.8 },
  payBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  payBarFill: { height: 6, borderRadius: 3 },
  payBarLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 4, textAlign: "right" },
  // Section header
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  countBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  countText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  noProjects: { alignItems: "center", padding: 28, borderRadius: 14, gap: 8, borderWidth: 1 },
  noProjectsText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  // Project card
  projectCard: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  pcHeader: { gap: 6 },
  pcName: { fontSize: 15, fontFamily: "Inter_700Bold" },
  pcTagRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  typeTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeTagText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  revTag: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  revTagText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  // Editor row
  editorRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: 12, borderWidth: 1 },
  editorAvatar: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  editorAvatarText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  editorLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  editorName: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  editorCallBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  // Progress
  progressSection: { gap: 5 },
  progressLabelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progressLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  progressPct: { fontSize: 12, fontFamily: "Inter_700Bold" },
  progressTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 6, borderRadius: 3 },
  // Deadline
  deadlineRow: { flexDirection: "row", alignItems: "center", gap: 6, padding: 8, borderRadius: 10, borderWidth: 1 },
  deadlineText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  // Payment section
  paySection: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 8 },
  payHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  payLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 4 },
  payStatusChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: "flex-start" },
  payStatusText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  editPayBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  editPayText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  payAmounts: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  payAmountItem: { gap: 1 },
  payAmountLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  payAmountValue: { fontSize: 14, fontFamily: "Inter_700Bold" },
  payBar2: { height: 5, borderRadius: 3, overflow: "hidden" },
  payBarFill2: { height: 5, borderRadius: 3 },
  payEditForm: { borderTopWidth: 1, paddingTop: 10, gap: 8 },
  payEditLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  payEditRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  payEditInput: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  paySaveBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  paySaveBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  payCancelBtn: { padding: 10, borderRadius: 10, borderWidth: 1 },
});
