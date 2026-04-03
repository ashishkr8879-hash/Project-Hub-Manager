import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Modal,
  Platform,
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
  fetchEditors,
  createClient,
  deleteClient,
  createEditor,
  deleteEditor,
  type Client,
  type Editor,
} from "@/hooks/useApi";

const LOGO = require("../../assets/images/divay-logo.png");
const SPECIALIZATIONS = ["Video Editor", "Graphic Designer", "Ads Setup", "Website Development", "Social Media Manager"];

export default function AdminProfileScreen() {
  const colors = useColors();
  const { setCurrentUser } = useApp();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const queryClient = useQueryClient();
  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddEditor, setShowAddEditor] = useState(false);
  const [selectedEditor, setSelectedEditor] = useState<Editor | null>(null);
  const [section, setSection] = useState<"clients" | "editors">("clients");

  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useQuery({
    queryKey: ["admin-profile"],
    queryFn: fetchAdminProfile,
  });

  const { data: clients = [], isLoading: clientsLoading, refetch: refetchClients } = useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients,
  });

  const { data: editors = [], isLoading: editorsLoading, refetch: refetchEditors } = useQuery({
    queryKey: ["editors"],
    queryFn: fetchEditors,
  });

  const isLoading = profileLoading || clientsLoading || editorsLoading;

  function handleLogout() {
    setCurrentUser(null);
    router.replace("/login");
  }

  async function handleDeleteClient(client: Client) {
    Alert.alert("Remove Client", `Remove ${client.name}?`, [
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

  async function handleDeleteEditor(editor: Editor) {
    Alert.alert("Remove Team Member", `Remove ${editor.name}? Their projects will still exist.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove", style: "destructive",
        onPress: async () => {
          try {
            await deleteEditor(editor.id);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            queryClient.invalidateQueries({ queryKey: ["editors"] });
            queryClient.invalidateQueries({ queryKey: ["admin-profile"] });
            if (selectedEditor?.id === editor.id) setSelectedEditor(null);
          } catch { Alert.alert("Error", "Could not remove team member"); }
        },
      },
    ]);
  }

  const initials = (profile?.name ?? "A").split(" ").map((w) => w[0]).join("").toUpperCase();

  function renderClientItem({ item }: { item: Client }) {
    const ci = item.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.cardAvatar, { backgroundColor: `${colors.primary}18` }]}>
          <Text style={[styles.cardInitials, { color: colors.primary }]}>{ci}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={1}>{item.name}</Text>
          <Text style={[styles.cardSub, { color: colors.primary }]} numberOfLines={1}>{item.businessType}</Text>
          {item.phone ? (
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${item.phone}`)} style={styles.callRow}>
              <Feather name="phone" size={12} color={colors.success} />
              <Text style={[styles.callText, { color: colors.success }]}>{item.phone}</Text>
            </TouchableOpacity>
          ) : null}
          {item.city ? <Text style={[styles.cardMeta, { color: colors.mutedForeground }]}>{item.city}</Text> : null}
        </View>
        <TouchableOpacity onPress={() => handleDeleteClient(item)} style={styles.deleteBtn}>
          <Feather name="trash-2" size={16} color={colors.destructive} />
        </TouchableOpacity>
      </View>
    );
  }

  function renderEditorItem({ item }: { item: Editor }) {
    const ei = item.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    return (
      <TouchableOpacity
        onPress={() => setSelectedEditor(item)}
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={[styles.cardAvatar, { backgroundColor: `${colors.editorPrimary}18` }]}>
          <Text style={[styles.cardInitials, { color: colors.editorPrimary }]}>{ei}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={1}>{item.name}</Text>
          <Text style={[styles.cardSub, { color: colors.editorPrimary }]} numberOfLines={1}>{item.specialization}</Text>
          {item.phone ? (
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${item.phone}`)} style={styles.callRow}>
              <Feather name="phone" size={12} color={colors.success} />
              <Text style={[styles.callText, { color: colors.success }]}>{item.phone}</Text>
            </TouchableOpacity>
          ) : null}
          {item.location ? <Text style={[styles.cardMeta, { color: colors.mutedForeground }]}><Feather name="map-pin" size={11} /> {item.location}</Text> : null}
        </View>
        <TouchableOpacity onPress={() => handleDeleteEditor(item)} style={styles.deleteBtn}>
          <Feather name="trash-2" size={16} color={colors.destructive} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        refreshControl={undefined}
        contentContainerStyle={{ paddingBottom: bottomPad + 100 }}
      >
        {isLoading && !profile ? (
          <View style={styles.loader}><ActivityIndicator color={colors.adminPrimary} /></View>
        ) : profile ? (
          <>
            {/* Profile header */}
            <View style={[styles.headerCard, { backgroundColor: colors.adminPrimary }]}>
              {/* Logo image */}
              <View style={styles.logoRing}>
                <Image source={LOGO} style={styles.logoImg} resizeMode="contain" />
              </View>
              <Text style={styles.profileName}>{profile.name}</Text>
              <Text style={styles.profileBiz}>{profile.businessName}</Text>
              <View style={styles.headerMeta}>
                <View style={styles.metaItem}>
                  <Feather name="mail" size={13} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.metaText}>{profile.email}</Text>
                </View>
                <TouchableOpacity style={styles.metaItem} onPress={() => Linking.openURL(`tel:${profile.phone}`)}>
                  <Feather name="phone" size={13} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.metaText}>{profile.phone}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Revenue overview */}
            <View style={[styles.revenueRow, { marginHorizontal: 16, marginTop: 16 }]}>
              <View style={[styles.revCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.revLabel, { color: colors.mutedForeground }]}>Total Revenue</Text>
                <Text style={[styles.revValue, { color: colors.success }]}>₹{profile.stats.totalRevenue.toLocaleString()}</Text>
              </View>
              <View style={[styles.revCard, { backgroundColor: "#fee2e2", borderColor: "#fecaca" }]}>
                <Text style={[styles.revLabel, { color: "#92400e" }]}>Model Costs</Text>
                <Text style={[styles.revValue, { color: colors.destructive }]}>-₹{profile.stats.totalModelCost.toLocaleString()}</Text>
              </View>
            </View>
            <View style={[styles.netCard, { marginHorizontal: 16, marginTop: 10, backgroundColor: "#dcfce7", borderColor: "#bbf7d0" }]}>
              <Feather name="trending-up" size={20} color="#166534" />
              <View>
                <Text style={[styles.netLabel, { color: "#166534" }]}>Net Revenue (After Model Cost)</Text>
                <Text style={[styles.netValue, { color: "#15803d" }]}>₹{profile.stats.netRevenue.toLocaleString()}</Text>
              </View>
            </View>

            {/* Stats grid */}
            <Text style={[styles.sectionTitle, { color: colors.foreground, marginHorizontal: 16, marginTop: 20, marginBottom: 12 }]}>Overview</Text>
            <View style={[styles.statsGrid, { marginHorizontal: 16 }]}>
              <StatBox label="Projects"       value={String(profile.stats.totalProjects)}     color={colors.adminPrimary} colors={colors} />
              <StatBox label="Completed"       value={String(profile.stats.completedProjects)} color={colors.success}      colors={colors} />
              <StatBox label="Active"          value={String(profile.stats.activeProjects)}    color={colors.warning}      colors={colors} />
              <StatBox label="Total Clients"   value={String(profile.stats.totalClients)}      color={colors.primary}      colors={colors} />
              <StatBox label="Team Members"    value={String(profile.stats.totalEditors)}      color={colors.editorPrimary} colors={colors} />
              <StatBox label="UGC Projects"    value={String(profile.stats.totalUgcProjects)}  color="#f59e0b"             colors={colors} />
            </View>

            {/* Section switcher */}
            <View style={[styles.switchRow, { marginHorizontal: 16, marginTop: 24 }]}>
              {(["clients", "editors"] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setSection(s)}
                  style={[styles.switchBtn, { backgroundColor: section === s ? colors.adminPrimary : colors.card, borderColor: section === s ? colors.adminPrimary : colors.border }]}
                >
                  <Feather name={s === "clients" ? "users" : "user-check"} size={14} color={section === s ? "#fff" : colors.mutedForeground} />
                  <Text style={[styles.switchText, { color: section === s ? "#fff" : colors.mutedForeground }]}>
                    {s === "clients" ? `Clients (${clients.length})` : `Team (${editors.length})`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Section header with add button */}
            <View style={[styles.sectionHeaderRow, { marginHorizontal: 16, marginTop: 16, marginBottom: 12 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                {section === "clients" ? "Clients" : "Team Members"}
              </Text>
              <TouchableOpacity
                onPress={() => section === "clients" ? setShowAddClient(true) : setShowAddEditor(true)}
                style={[styles.addBtn, { backgroundColor: colors.adminPrimary }]}
              >
                <Feather name="plus" size={14} color="#fff" />
                <Text style={styles.addBtnText}>Add {section === "clients" ? "Client" : "Member"}</Text>
              </TouchableOpacity>
            </View>

            {/* List */}
            <View style={{ paddingHorizontal: 16, gap: 10 }}>
              {section === "clients" ? (
                clientsLoading ? <ActivityIndicator color={colors.primary} /> :
                clients.length === 0 ? (
                  <View style={[styles.empty, { borderColor: colors.border }]}>
                    <Feather name="users" size={32} color={colors.mutedForeground} />
                    <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No clients yet</Text>
                  </View>
                ) : clients.map((c) => <View key={c.id}>{renderClientItem({ item: c })}</View>)
              ) : (
                editorsLoading ? <ActivityIndicator color={colors.editorPrimary} /> :
                editors.length === 0 ? (
                  <View style={[styles.empty, { borderColor: colors.border }]}>
                    <Feather name="user-x" size={32} color={colors.mutedForeground} />
                    <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No team members yet</Text>
                  </View>
                ) : editors.map((e) => <View key={e.id}>{renderEditorItem({ item: e })}</View>)
              )}
            </View>

            {/* Logout */}
            <TouchableOpacity onPress={handleLogout}
              style={[styles.logoutBtn, { backgroundColor: "#fee2e2", borderColor: "#fecaca", margin: 16, marginTop: 28 }]}>
              <Feather name="log-out" size={16} color={colors.destructive} />
              <Text style={[styles.logoutText, { color: colors.destructive }]}>Sign Out</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </ScrollView>

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

      {showAddEditor && (
        <AddEditorModal
          colors={colors}
          insets={insets}
          onClose={() => setShowAddEditor(false)}
          onSuccess={() => {
            setShowAddEditor(false);
            queryClient.invalidateQueries({ queryKey: ["editors"] });
            queryClient.invalidateQueries({ queryKey: ["admin-profile"] });
          }}
        />
      )}

      {selectedEditor && (
        <EditorDetailModal
          editor={selectedEditor}
          colors={colors}
          insets={insets}
          onClose={() => setSelectedEditor(null)}
          onDelete={() => { handleDeleteEditor(selectedEditor); }}
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

function EditorDetailModal({
  editor, colors, insets, onClose, onDelete,
}: {
  editor: Editor;
  colors: ReturnType<typeof useColors>;
  insets: ReturnType<typeof import("react-native-safe-area-context").useSafeAreaInsets>;
  onClose: () => void;
  onDelete: () => void;
}) {
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const initials = editor.name.split(" ").map((w) => w[0]).join("").toUpperCase();
  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: colors.background, paddingBottom: bottomPad + 16 }]}>
          <View style={styles.modalHandle} />

          {/* Header */}
          <View style={[styles.editorDetailHeader, { backgroundColor: colors.editorPrimary }]}>
            <View style={[styles.editorDetailAvatar, { backgroundColor: "rgba(255,255,255,0.25)" }]}>
              <Text style={styles.editorDetailInitials}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.editorDetailName}>{editor.name}</Text>
              <Text style={styles.editorDetailSpec}>{editor.specialization}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
              <Feather name="x" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
            {/* Info rows */}
            <DetailRow icon="user" label="Username" value={editor.username ?? "—"} colors={colors} />
            <DetailRow icon="lock" label="Password" value="••••••••" secret colors={colors} />
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${editor.phone}`)}>
              <DetailRow icon="phone" label="Phone" value={editor.phone} colors={colors} tappable />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL(`mailto:${editor.email}`)}>
              <DetailRow icon="mail" label="Email" value={editor.email || "—"} colors={colors} tappable />
            </TouchableOpacity>
            {editor.location && <DetailRow icon="map-pin" label="Location" value={editor.location} colors={colors} />}
            {editor.bankAccount && <DetailRow icon="credit-card" label="Bank Account" value={editor.bankAccount} colors={colors} />}
            <DetailRow icon="calendar" label="Joined" value={new Date(editor.joinedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} colors={colors} />

            {/* Call button */}
            <TouchableOpacity
              onPress={() => Linking.openURL(`tel:${editor.phone}`)}
              style={[styles.callBtn, { backgroundColor: colors.success }]}
            >
              <Feather name="phone-call" size={18} color="#fff" />
              <Text style={styles.callBtnText}>Call {editor.name.split(" ")[0]}</Text>
            </TouchableOpacity>

            {/* Delete */}
            <TouchableOpacity
              onPress={() => { onClose(); setTimeout(() => onDelete(), 300); }}
              style={[styles.callBtn, { backgroundColor: "#fee2e2", borderWidth: 1, borderColor: "#fecaca" }]}
            >
              <Feather name="trash-2" size={16} color={colors.destructive} />
              <Text style={[styles.callBtnText, { color: colors.destructive }]}>Remove from Team</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function DetailRow({ icon, label, value, colors, secret, tappable }: {
  icon: string; label: string; value: string; colors: ReturnType<typeof useColors>;
  secret?: boolean; tappable?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <View style={[styles.detailRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.detailIcon, { backgroundColor: `${colors.primary}12` }]}>
        <Feather name={icon as never} size={15} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[styles.detailValue, { color: tappable ? colors.primary : colors.foreground }]}>
          {secret && !show ? "••••••••" : value}
        </Text>
      </View>
      {secret && (
        <TouchableOpacity onPress={() => setShow(!show)}>
          <Feather name={show ? "eye-off" : "eye"} size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      )}
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
            style={[styles.saveBtn, { backgroundColor: loading ? colors.muted : colors.primary }]}>
            {loading ? <ActivityIndicator color="#fff" />
              : <><Feather name="user-plus" size={16} color="#fff" /><Text style={styles.saveBtnText}>Save Client</Text></>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function AddEditorModal({
  colors, insets, onClose, onSuccess,
}: {
  colors: ReturnType<typeof useColors>;
  insets: ReturnType<typeof import("react-native-safe-area-context").useSafeAreaInsets>;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [specialization, setSpecialization] = useState(SPECIALIZATIONS[0]);
  const [location, setLocation] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  async function handleAdd() {
    if (!name.trim() || !username.trim() || !password.trim() || !phone.trim()) {
      Alert.alert("Required", "Name, username, password, and phone are required"); return;
    }
    setLoading(true);
    try {
      await createEditor({ name: name.trim(), username: username.trim(), password: password.trim(), phone: phone.trim(), email: email.trim(), specialization, location: location.trim(), bankAccount: bankAccount.trim() });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess();
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to add team member");
    } finally { setLoading(false); }
  }

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <ScrollView style={[styles.modalSheet, { backgroundColor: colors.card }]} contentContainerStyle={{ padding: 24, paddingBottom: bottomPad + 24 }}>
          <View style={styles.modalHandle} />
          <View style={[styles.modalHeader, { marginBottom: 16 }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Add Team Member</Text>
            <TouchableOpacity onPress={onClose}><Feather name="x" size={20} color={colors.mutedForeground} /></TouchableOpacity>
          </View>

          <Text style={[styles.sectionTag, { color: colors.mutedForeground }]}>PERSONAL INFO</Text>
          <View style={{ gap: 10, marginBottom: 16 }}>
            <MInput label="Full Name *" value={name} onChange={setName} placeholder="Alice Johnson" colors={colors} />
            <MInput label="Phone *" value={phone} onChange={setPhone} placeholder="+91 98100 00000" colors={colors} kb="phone-pad" />
            <MInput label="Email" value={email} onChange={setEmail} placeholder="alice@divayshakati.com" colors={colors} kb="email-address" />
            <MInput label="Location" value={location} onChange={setLocation} placeholder="Mumbai" colors={colors} />
          </View>

          <Text style={[styles.sectionTag, { color: colors.mutedForeground }]}>LOGIN CREDENTIALS</Text>
          <View style={{ gap: 10, marginBottom: 16 }}>
            <MInput label="Username *" value={username} onChange={setUsername} placeholder="alice" colors={colors} />
            <View style={{ gap: 4 }}>
              <Text style={[styles.mLabel, { color: colors.foreground }]}>Password *</Text>
              <View style={[styles.passRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.passInput, { color: colors.foreground }]}
                  value={password} onChangeText={setPassword}
                  placeholder="Set a password" placeholderTextColor={colors.mutedForeground}
                  secureTextEntry={!showPass} autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                  <Feather name={showPass ? "eye-off" : "eye"} size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <Text style={[styles.sectionTag, { color: colors.mutedForeground }]}>ROLE & BANK</Text>
          <View style={{ gap: 10, marginBottom: 20 }}>
            <Text style={[styles.mLabel, { color: colors.foreground }]}>Specialization *</Text>
            <View style={styles.specGrid}>
              {SPECIALIZATIONS.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setSpecialization(s)}
                  style={[styles.specChip, { backgroundColor: specialization === s ? `${colors.editorPrimary}18` : colors.muted, borderColor: specialization === s ? colors.editorPrimary : colors.border, borderWidth: specialization === s ? 2 : 1 }]}
                >
                  <Text style={[styles.specChipText, { color: specialization === s ? colors.editorPrimary : colors.mutedForeground }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <MInput label="Bank Account" value={bankAccount} onChange={setBankAccount} placeholder="SBI 1234567890" colors={colors} />
          </View>

          <TouchableOpacity onPress={handleAdd} disabled={loading}
            style={[styles.saveBtn, { backgroundColor: loading ? colors.muted : colors.editorPrimary }]}>
            {loading ? <ActivityIndicator color="#fff" />
              : <><Feather name="user-plus" size={16} color="#fff" /><Text style={styles.saveBtnText}>Add Team Member</Text></>}
          </TouchableOpacity>
        </ScrollView>
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
  logoRing: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: "rgba(255,255,255,0.35)", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.12)", marginBottom: 4, overflow: "hidden" },
  logoImg: { width: 100, height: 100 },
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
  switchRow: { flexDirection: "row", gap: 8 },
  switchBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: 12, borderWidth: 1, gap: 6 },
  switchText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statBox: { width: "47%", borderRadius: 14, borderWidth: 1, padding: 12, gap: 3 },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  addBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, gap: 4 },
  addBtnText: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  card: { flexDirection: "row", alignItems: "flex-start", borderRadius: 14, borderWidth: 1, padding: 12, gap: 10 },
  cardAvatar: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  cardInitials: { fontSize: 14, fontFamily: "Inter_700Bold" },
  cardInfo: { flex: 1, gap: 2 },
  cardName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  cardSub: { fontSize: 12, fontFamily: "Inter_500Medium" },
  cardMeta: { fontSize: 11, fontFamily: "Inter_400Regular" },
  callRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  callText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  deleteBtn: { padding: 6 },
  empty: { alignItems: "center", padding: 32, borderRadius: 16, borderWidth: 1, gap: 8 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 14, borderRadius: 14, borderWidth: 1, gap: 8 },
  logoutText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  // Editor detail modal
  editorDetailHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 16, margin: 4, marginBottom: 0 },
  editorDetailAvatar: { width: 50, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  editorDetailInitials: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff" },
  editorDetailName: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
  editorDetailSpec: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)" },
  closeBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  detailRow: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, padding: 12, gap: 10 },
  detailIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  detailLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  detailValue: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  callBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 14, borderRadius: 14, gap: 8 },
  callBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  // Modal
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
  modalSheet: { maxHeight: "92%", borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: "hidden" },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#e2e8f0", alignSelf: "center", marginVertical: 12 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  modalFields: { gap: 10 },
  sectionTag: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1.2, marginBottom: 8 },
  mField: { gap: 4 },
  mLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  mInput: { padding: 12, borderRadius: 12, borderWidth: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  passRow: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, paddingRight: 14 },
  passInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  specGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  specChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  specChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 14, borderRadius: 14, gap: 8 },
  saveBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
