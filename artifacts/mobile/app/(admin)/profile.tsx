import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import {
  fetchAdminProfile,
  fetchClients,
  createClient,
  deleteClient,
  type Client,
} from "@/hooks/useApi";

export default function AdminProfileScreen() {
  const colors = useColors();
  const { setCurrentUser } = useApp();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const queryClient = useQueryClient();
  const [showAddClient, setShowAddClient] = useState(false);

  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useQuery({
    queryKey: ["admin-profile"],
    queryFn: fetchAdminProfile,
  });

  const { data: clients = [], isLoading: clientsLoading, refetch: refetchClients } = useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients,
  });

  const isLoading = profileLoading || clientsLoading;

  function handleLogout() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out", style: "destructive",
        onPress: () => { setCurrentUser(null); router.replace("/login"); },
      },
    ]);
  }

  async function handleDeleteClient(client: Client) {
    Alert.alert("Remove Client", `Remove ${client.name} from your client list?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove", style: "destructive",
        onPress: async () => {
          try {
            await deleteClient(client.id);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            queryClient.invalidateQueries({ queryKey: ["clients"] });
            queryClient.invalidateQueries({ queryKey: ["admin-profile"] });
          } catch { Alert.alert("Error", "Could not remove client"); }
        },
      },
    ]);
  }

  const initials = (profile?.name ?? "A").split(" ").map((w) => w[0]).join("").toUpperCase();

  function renderClientItem({ item }: { item: Client }) {
    const ci = item.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    return (
      <View style={[styles.clientCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.clientAvatar, { backgroundColor: `${colors.primary}18` }]}>
          <Text style={[styles.clientInitials, { color: colors.primary }]}>{ci}</Text>
        </View>
        <View style={styles.clientInfo}>
          <Text style={[styles.clientName, { color: colors.foreground }]} numberOfLines={1}>{item.name}</Text>
          <Text style={[styles.clientBiz, { color: colors.primary }]} numberOfLines={1}>{item.businessType}</Text>
          <Text style={[styles.clientContact, { color: colors.mutedForeground }]} numberOfLines={1}>{item.phone}</Text>
          {item.city ? <Text style={[styles.clientContact, { color: colors.mutedForeground }]}>{item.city}</Text> : null}
        </View>
        <TouchableOpacity onPress={() => handleDeleteClient(item)} style={styles.deleteBtn}>
          <Feather name="trash-2" size={16} color={colors.destructive} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[{ flex: 1, backgroundColor: colors.background }]}>
      <FlatList
        data={clients}
        keyExtractor={(c) => c.id}
        renderItem={renderClientItem}
        refreshing={isLoading}
        onRefresh={() => { refetchProfile(); refetchClients(); }}
        contentContainerStyle={{ paddingBottom: bottomPad + 100 }}
        ListHeaderComponent={
          <>
            {isLoading && !profile ? (
              <View style={styles.loader}><ActivityIndicator color={colors.adminPrimary} /></View>
            ) : profile ? (
              <>
                {/* Profile header */}
                <View style={[styles.headerCard, { backgroundColor: colors.adminPrimary }]}>
                  <View style={styles.avatarRing}>
                    <View style={[styles.avatar, { backgroundColor: "#fff" }]}>
                      <Text style={[styles.avatarText, { color: colors.adminPrimary }]}>{initials}</Text>
                    </View>
                  </View>
                  <Text style={styles.profileName}>{profile.name}</Text>
                  <Text style={styles.profileBiz}>{profile.businessName}</Text>
                  <View style={styles.headerMeta}>
                    <View style={styles.metaItem}>
                      <Feather name="mail" size={13} color="rgba(255,255,255,0.8)" />
                      <Text style={styles.metaText}>{profile.email}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Feather name="phone" size={13} color="rgba(255,255,255,0.8)" />
                      <Text style={styles.metaText}>{profile.phone}</Text>
                    </View>
                  </View>
                </View>

                {/* Revenue overview */}
                <View style={[styles.revenueRow, { marginHorizontal: 16, marginTop: 16 }]}>
                  <View style={[styles.revCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.revLabel, { color: colors.mutedForeground }]}>Total Revenue</Text>
                    <Text style={[styles.revValue, { color: colors.success }]}>${profile.stats.totalRevenue.toLocaleString()}</Text>
                  </View>
                  <View style={[styles.revCard, { backgroundColor: "#fee2e2", borderColor: "#fecaca" }]}>
                    <Text style={[styles.revLabel, { color: "#92400e" }]}>Model Costs</Text>
                    <Text style={[styles.revValue, { color: colors.destructive }]}>-${profile.stats.totalModelCost.toLocaleString()}</Text>
                  </View>
                </View>
                <View style={[styles.netCard, { marginHorizontal: 16, marginTop: 10, backgroundColor: "#dcfce7", borderColor: "#bbf7d0" }]}>
                  <Feather name="trending-up" size={20} color="#166534" />
                  <View>
                    <Text style={[styles.netLabel, { color: "#166534" }]}>Net Revenue (After Model Cost)</Text>
                    <Text style={[styles.netValue, { color: "#15803d" }]}>${profile.stats.netRevenue.toLocaleString()}</Text>
                  </View>
                </View>

                {/* Stats grid */}
                <Text style={[styles.sectionTitle, { color: colors.foreground, marginHorizontal: 16, marginTop: 20, marginBottom: 12 }]}>
                  Overview
                </Text>
                <View style={[styles.statsGrid, { marginHorizontal: 16 }]}>
                  <StatBox label="Projects"       value={String(profile.stats.totalProjects)}     color={colors.adminPrimary} colors={colors} />
                  <StatBox label="Completed"       value={String(profile.stats.completedProjects)} color={colors.success}      colors={colors} />
                  <StatBox label="Active"          value={String(profile.stats.activeProjects)}    color={colors.warning}      colors={colors} />
                  <StatBox label="Total Clients"   value={String(profile.stats.totalClients)}      color={colors.primary}      colors={colors} />
                  <StatBox label="Editors"         value={String(profile.stats.totalEditors)}      color={colors.editorPrimary} colors={colors} />
                  <StatBox label="UGC Projects"    value={String(profile.stats.totalUgcProjects)}  color="#f59e0b"             colors={colors} />
                </View>

                {/* Clients section header */}
                <View style={[styles.sectionHeaderRow, { marginHorizontal: 16, marginTop: 24, marginBottom: 12 }]}>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Clients ({clients.length})</Text>
                  <TouchableOpacity onPress={() => setShowAddClient(true)}
                    style={[styles.addClientBtn, { backgroundColor: colors.primary }]}>
                    <Feather name="plus" size={14} color="#fff" />
                    <Text style={styles.addClientText}>Add Client</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </>
        }
        ListFooterComponent={
          <>
            {clients.length === 0 && !clientsLoading && (
              <View style={[styles.empty, { borderColor: colors.border, marginHorizontal: 16 }]}>
                <Feather name="users" size={32} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No clients yet. Add one!</Text>
              </View>
            )}
            <TouchableOpacity onPress={handleLogout}
              style={[styles.logoutBtn, { backgroundColor: "#fee2e2", borderColor: "#fecaca", margin: 16, marginTop: 24 }]}>
              <Feather name="log-out" size={16} color={colors.destructive} />
              <Text style={[styles.logoutText, { color: colors.destructive }]}>Sign Out</Text>
            </TouchableOpacity>
          </>
        }
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={{ paddingBottom: bottomPad + 100 }}
        style={{ paddingHorizontal: 16 }}
        scrollEnabled
      />

      {showAddClient && (
        <AddClientModal
          colors={colors}
          insets={insets}
          onClose={() => setShowAddClient(false)}
          onSuccess={() => {
            setShowAddClient(false);
            queryClient.invalidateQueries({ queryKey: ["clients"] });
            queryClient.invalidateQueries({ queryKey: ["admin-profile"] });
          }}
        />
      )}
    </View>
  );
}

function StatBox({ label, value, color, colors }: { label: string; value: string; color: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function AddClientModal({
  colors, insets, onClose, onSuccess,
}: {
  colors: ReturnType<typeof useColors>;
  insets: ReturnType<typeof import("react-native-safe-area-context").useSafeAreaInsets>;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  async function handleAdd() {
    if (!name.trim() || !phone.trim()) {
      Alert.alert("Required", "Name and phone are required"); return;
    }
    setLoading(true);
    try {
      await createClient({ name: name.trim(), phone: phone.trim(), email: email.trim(), businessType: businessType.trim() || "Other", city: city.trim() });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess();
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to add client");
    } finally { setLoading(false); }
  }

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: colors.card, paddingBottom: bottomPad + 16 }]}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Add New Client</Text>
            <TouchableOpacity onPress={onClose}><Feather name="x" size={20} color={colors.mutedForeground} /></TouchableOpacity>
          </View>

          <View style={styles.modalFields}>
            <MInput label="Client / Brand Name *" value={name} onChange={setName} placeholder="e.g. StyleBrand" colors={colors} />
            <MInput label="Phone *" value={phone} onChange={setPhone} placeholder="+91 98765 00000" colors={colors} kb="phone-pad" />
            <MInput label="Email" value={email} onChange={setEmail} placeholder="contact@brand.com" colors={colors} kb="email-address" />
            <MInput label="Business Type" value={businessType} onChange={setBusinessType} placeholder="Fashion / Tech / Events..." colors={colors} />
            <MInput label="City" value={city} onChange={setCity} placeholder="Mumbai" colors={colors} />
          </View>

          <TouchableOpacity onPress={handleAdd} disabled={loading}
            style={[styles.addBtn, { backgroundColor: loading ? colors.muted : colors.primary }]}>
            {loading ? <ActivityIndicator color="#fff" />
              : <><Feather name="user-plus" size={16} color="#fff" /><Text style={styles.addBtnText}>Save Client</Text></>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function MInput({ label, value, onChange, placeholder, colors, kb }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; colors: ReturnType<typeof useColors>;
  kb?: "default" | "phone-pad" | "email-address";
}) {
  return (
    <View style={styles.mField}>
      <Text style={[styles.mLabel, { color: colors.foreground }]}>{label}</Text>
      <TextInput
        style={[styles.mInput, { backgroundColor: colors.muted, borderColor: colors.border, color: colors.foreground }]}
        value={value} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground} keyboardType={kb ?? "default"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: "center", paddingTop: 60 },
  headerCard: { borderRadius: 20, padding: 24, alignItems: "center", gap: 6, margin: 16 },
  avatarRing: { width: 84, height: 84, borderRadius: 42, borderWidth: 3, borderColor: "rgba(255,255,255,0.4)", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 26, fontFamily: "Inter_700Bold" },
  profileName: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  profileBiz: { fontSize: 13, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.8)" },
  headerMeta: { marginTop: 6, gap: 4, alignItems: "center" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.85)" },
  revenueRow: { flexDirection: "row", gap: 10 },
  revCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 14, gap: 4 },
  revLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  revValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
  netCard: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, padding: 14, gap: 12 },
  netLabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 2 },
  netValue: { fontSize: 22, fontFamily: "Inter_700Bold" },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statBox: { width: "47%", borderRadius: 14, borderWidth: 1, padding: 12, gap: 3 },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  addClientBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, gap: 4 },
  addClientText: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  clientCard: { flexDirection: "row", alignItems: "flex-start", borderRadius: 14, borderWidth: 1, padding: 12, gap: 10 },
  clientAvatar: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  clientInitials: { fontSize: 14, fontFamily: "Inter_700Bold" },
  clientInfo: { flex: 1, gap: 2 },
  clientName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  clientBiz: { fontSize: 12, fontFamily: "Inter_500Medium" },
  clientContact: { fontSize: 12, fontFamily: "Inter_400Regular" },
  deleteBtn: { padding: 6 },
  empty: { alignItems: "center", padding: 32, borderRadius: 16, borderWidth: 1, gap: 8 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 14, borderRadius: 14, borderWidth: 1, gap: 8 },
  logoutText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 14 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#e2e8f0", alignSelf: "center", marginBottom: 6 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  modalFields: { gap: 10 },
  mField: { gap: 4 },
  mLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  mInput: { padding: 12, borderRadius: 12, borderWidth: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 14, borderRadius: 14, gap: 8, marginTop: 4 },
  addBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
