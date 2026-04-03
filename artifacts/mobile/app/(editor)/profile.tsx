import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { StatusBadge } from "@/components/StatusBadge";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { fetchEditorProfile } from "@/hooks/useApi";

export default function EditorProfileScreen() {
  const colors = useColors();
  const { currentUser, setCurrentUser } = useApp();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const editorId = currentUser?.editorId ?? currentUser?.id ?? "";
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ["editor-profile", editorId],
    queryFn: () => fetchEditorProfile(editorId),
    enabled: !!editorId,
  });

  // Load saved profile image
  useEffect(() => {
    if (!editorId) return;
    AsyncStorage.getItem(`profile_image_${editorId}`).then((uri) => {
      if (uri) setProfileImage(uri);
    });
  }, [editorId]);

  const ADMIN_PHONE = "+91 98765 00001";

  function handleLogout() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out", style: "destructive",
        onPress: () => {
          setCurrentUser(null);
          router.replace("/login");
        },
      },
    ]);
  }

  function handleCallAdmin() {
    Alert.alert("Call Admin", `Call Divayshakati Admin at ${ADMIN_PHONE}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Call", onPress: () => Linking.openURL(`tel:${ADMIN_PHONE}`) },
    ]);
  }

  async function handlePickImage() {
    Alert.alert("Change Profile Photo", "Choose an option", [
      {
        text: "Camera",
        onPress: async () => {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) { Alert.alert("Permission denied", "Camera access is needed."); return; }
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
          });
          if (!result.canceled && result.assets[0]) {
            const uri = result.assets[0].uri;
            setProfileImage(uri);
            await AsyncStorage.setItem(`profile_image_${editorId}`, uri);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        },
      },
      {
        text: "Photo Library",
        onPress: async () => {
          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!perm.granted) { Alert.alert("Permission denied", "Photo library access is needed."); return; }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
          });
          if (!result.canceled && result.assets[0]) {
            const uri = result.assets[0].uri;
            setProfileImage(uri);
            await AsyncStorage.setItem(`profile_image_${editorId}`, uri);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        },
      },
      {
        text: "Remove Photo",
        style: "destructive",
        onPress: async () => {
          setProfileImage(null);
          await AsyncStorage.removeItem(`profile_image_${editorId}`);
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  const initials = (profile?.name ?? currentUser?.name ?? "E")
    .split(" ").map((w) => w[0]).join("").toUpperCase();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 100 }]}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.editorPrimary} />}
    >
      {isLoading ? (
        <View style={styles.loader}><ActivityIndicator color={colors.editorPrimary} /></View>
      ) : profile ? (
        <>
          {/* Header */}
          <View style={[styles.headerCard, { backgroundColor: colors.editorPrimary }]}>
            {/* Profile image with edit button */}
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarRing}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.avatarImg} />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: "#fff" }]}>
                    <Text style={[styles.avatarText, { color: colors.editorPrimary }]}>{initials}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                onPress={handlePickImage}
                style={[styles.editPhotoBtn, { backgroundColor: "#fff", borderColor: colors.editorPrimary }]}
                activeOpacity={0.8}
              >
                <Feather name="camera" size={13} color={colors.editorPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.profileName}>{profile.name}</Text>
            <Text style={styles.profileSpec}>{profile.specialization}</Text>
            <View style={styles.headerMeta}>
              <View style={styles.metaItem}>
                <Feather name="mail" size={13} color="rgba(255,255,255,0.8)" />
                <Text style={styles.metaItemText}>{profile.email}</Text>
              </View>
              <View style={styles.metaItem}>
                <Feather name="phone" size={13} color="rgba(255,255,255,0.8)" />
                <Text style={styles.metaItemText}>{profile.phone}</Text>
              </View>
              <View style={styles.metaItem}>
                <Feather name="calendar" size={13} color="rgba(255,255,255,0.8)" />
                <Text style={styles.metaItemText}>Joined {new Date(profile.joinedAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</Text>
              </View>
            </View>
          </View>

          {/* Stats grid */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Statistics</Text>
          <View style={styles.statsGrid}>
            <StatBox label="Total Projects"   value={String(profile.stats.totalProjects)}      color={colors.editorPrimary} colors={colors} />
            <StatBox label="Completed"         value={String(profile.stats.completedProjects)}   color={colors.success}       colors={colors} />
            <StatBox label="In Progress"       value={String(profile.stats.inProgressProjects)}  color={colors.primary}       colors={colors} />
            <StatBox label="Pending"           value={String(profile.stats.pendingProjects)}     color={colors.warning}       colors={colors} />
            <StatBox label="Videos Uploaded"   value={String(profile.stats.totalVideosUploaded)} color={colors.editorPrimary} colors={colors} />
            <StatBox label="Approved"          value={String(profile.stats.approvedVideos)}     color={colors.success}       colors={colors} />
            <StatBox label="Rejected"          value={String(profile.stats.rejectedVideos)}     color={colors.destructive}   colors={colors} />
            <StatBox label="In Review"         value={String(profile.stats.pendingReviewVideos)} color={colors.warning}      colors={colors} />
          </View>

          {/* Earnings */}
          <View style={[styles.earningsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.earningsIcon, { backgroundColor: `${colors.success}18` }]}>
              <Feather name="dollar-sign" size={24} color={colors.success} />
            </View>
            <View>
              <Text style={[styles.earningsLabel, { color: colors.mutedForeground }]}>Total Earnings (Completed)</Text>
              <Text style={[styles.earningsValue, { color: colors.foreground }]}>
                ₹{profile.stats.totalEarnings.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Recent Projects */}
          {profile.recentProjects.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Projects</Text>
              {profile.recentProjects.map((p) => (
                <View key={p.id} style={[styles.projectRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.projectRowLeft}>
                    <Text style={[styles.projectRowName, { color: colors.foreground }]} numberOfLines={1}>{p.projectName}</Text>
                    <Text style={[styles.projectRowClient, { color: colors.mutedForeground }]} numberOfLines={1}>{p.clientName}</Text>
                    <View style={styles.projectRowMeta}>
                      <Text style={[styles.projectRowValue, { color: colors.success }]}>₹{p.totalValue.toLocaleString()}</Text>
                      <Text style={[styles.projectRowDeliverable, { color: colors.mutedForeground }]}>
                        {p.completedDeliverables}/{p.totalDeliverables} deliverables
                      </Text>
                    </View>
                  </View>
                  <StatusBadge status={p.status} />
                </View>
              ))}
            </>
          )}

          {/* Call Admin */}
          <TouchableOpacity
            onPress={handleCallAdmin}
            style={[styles.actionBtn, { backgroundColor: "#dcfce7", borderColor: "#86efac", borderWidth: 1 }]}
          >
            <Feather name="phone-call" size={16} color="#166534" />
            <Text style={[styles.actionBtnText, { color: "#166534" }]}>Call Admin (Divayshakati)</Text>
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity
            onPress={handleLogout}
            style={[styles.actionBtn, { backgroundColor: "#fee2e2", borderColor: "#fecaca", borderWidth: 1 }]}
          >
            <Feather name="log-out" size={16} color={colors.destructive} />
            <Text style={[styles.actionBtnText, { color: colors.destructive }]}>Sign Out</Text>
          </TouchableOpacity>
        </>
      ) : null}
    </ScrollView>
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, gap: 16 },
  loader: { flex: 1, alignItems: "center", paddingTop: 60 },
  headerCard: { borderRadius: 20, padding: 24, alignItems: "center", gap: 8 },
  avatarWrapper: { position: "relative", marginBottom: 4 },
  avatarRing: { width: 92, height: 92, borderRadius: 46, borderWidth: 3, borderColor: "rgba(255,255,255,0.4)", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  avatarImg: { width: 86, height: 86, borderRadius: 43 },
  avatar: { width: 86, height: 86, borderRadius: 43, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 28, fontFamily: "Inter_700Bold" },
  editPhotoBtn: { position: "absolute", bottom: 0, right: -4, width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 2 },
  profileName: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff" },
  profileSpec: { fontSize: 14, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.8)" },
  headerMeta: { marginTop: 8, gap: 4, width: "100%", alignItems: "center" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaItemText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.85)" },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statBox: { width: "47%", borderRadius: 14, borderWidth: 1, padding: 14, gap: 4, alignItems: "flex-start" },
  statValue: { fontSize: 24, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  earningsCard: { flexDirection: "row", alignItems: "center", borderRadius: 16, borderWidth: 1, padding: 16, gap: 14 },
  earningsIcon: { width: 50, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  earningsLabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 2 },
  earningsValue: { fontSize: 24, fontFamily: "Inter_700Bold" },
  projectRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  projectRowLeft: { flex: 1, gap: 3 },
  projectRowName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  projectRowClient: { fontSize: 12, fontFamily: "Inter_400Regular" },
  projectRowMeta: { flexDirection: "row", gap: 8, marginTop: 2 },
  projectRowValue: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  projectRowDeliverable: { fontSize: 12, fontFamily: "Inter_400Regular" },
  actionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 14, borderRadius: 14, gap: 8 },
  actionBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
