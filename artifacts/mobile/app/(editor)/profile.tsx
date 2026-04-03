import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
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
import { fetchEditorProfile, fetchEditors, fetchEditorAnalytics, Editor } from "@/hooks/useApi";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// ── Calendar helper ────────────────────────────────────────────────────────────
function buildCalendarGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function toDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// ── Project calendar for a specific editor ─────────────────────────────────────
function MemberCalendar({
  projectsByDate,
  colors,
}: {
  projectsByDate: { date: string; projects: any[]; dayRevenue: number }[];
  colors: ReturnType<typeof useColors>;
}) {
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const dateMap = useMemo(() => {
    const m: Record<string, { count: number; projects: any[]; dayRevenue: number }> = {};
    for (const entry of projectsByDate) {
      m[entry.date] = { count: entry.projects.length, projects: entry.projects, dayRevenue: entry.dayRevenue };
    }
    return m;
  }, [projectsByDate]);

  const grid = useMemo(() => buildCalendarGrid(calYear, calMonth), [calYear, calMonth]);

  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  function prevMonth() {
    setSelectedDay(null);
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  }
  function nextMonth() {
    setSelectedDay(null);
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  }

  const selectedEntry = selectedDay ? dateMap[selectedDay] : null;

  function dotColor(count: number) {
    if (count >= 4) return colors.destructive;
    if (count >= 2) return colors.primary;
    return colors.success;
  }

  return (
    <View style={[calStyles.wrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Month navigation */}
      <View style={calStyles.header}>
        <TouchableOpacity onPress={prevMonth} style={calStyles.navBtn} activeOpacity={0.7}>
          <Feather name="chevron-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[calStyles.monthLabel, { color: colors.foreground }]}>
          {MONTH_NAMES[calMonth]} {calYear}
        </Text>
        <TouchableOpacity onPress={nextMonth} style={calStyles.navBtn} activeOpacity={0.7}>
          <Feather name="chevron-right" size={20} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* Weekday header */}
      <View style={calStyles.weekRow}>
        {WEEKDAYS.map((d) => (
          <Text key={d} style={[calStyles.weekDay, { color: colors.mutedForeground }]}>{d}</Text>
        ))}
      </View>

      {/* Day cells */}
      <View style={calStyles.grid}>
        {grid.map((day, idx) => {
          if (day === null) return <View key={`e-${idx}`} style={calStyles.cell} />;
          const key = toDateKey(calYear, calMonth, day);
          const entry = dateMap[key];
          const count = entry?.count ?? 0;
          const isToday = key === todayKey;
          const isSelected = key === selectedDay;
          return (
            <TouchableOpacity
              key={key}
              style={[
                calStyles.cell,
                isSelected && { backgroundColor: colors.editorPrimary, borderRadius: 10 },
                isToday && !isSelected && { borderWidth: 1.5, borderColor: colors.editorPrimary, borderRadius: 10 },
              ]}
              onPress={() => {
                if (count > 0) {
                  setSelectedDay(isSelected ? null : key);
                  Haptics.selectionAsync();
                }
              }}
              activeOpacity={count > 0 ? 0.7 : 1}
            >
              <Text style={[
                calStyles.dayNum,
                { color: isSelected ? "#fff" : isToday ? colors.editorPrimary : colors.foreground },
              ]}>
                {day}
              </Text>
              {count > 0 && (
                <View style={[calStyles.dot, { backgroundColor: isSelected ? "#fff" : dotColor(count) }]}>
                  <Text style={[calStyles.dotCount, { color: isSelected ? colors.editorPrimary : "#fff" }]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Legend */}
      <View style={calStyles.legend}>
        <View style={calStyles.legendItem}>
          <View style={[calStyles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={[calStyles.legendText, { color: colors.mutedForeground }]}>1 project</Text>
        </View>
        <View style={calStyles.legendItem}>
          <View style={[calStyles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={[calStyles.legendText, { color: colors.mutedForeground }]}>2–3 projects</Text>
        </View>
        <View style={calStyles.legendItem}>
          <View style={[calStyles.legendDot, { backgroundColor: colors.destructive }]} />
          <Text style={[calStyles.legendText, { color: colors.mutedForeground }]}>4+ projects</Text>
        </View>
      </View>

      {/* Selected day detail */}
      {selectedEntry && selectedDay && (
        <View style={[calStyles.dayDetail, { borderTopColor: colors.border }]}>
          <View style={calStyles.dayDetailHeader}>
            <Text style={[calStyles.dayDetailDate, { color: colors.editorPrimary }]}>
              {new Date(selectedDay + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </Text>
            <View style={[calStyles.dayRevBadge, { backgroundColor: `${colors.success}18` }]}>
              <Text style={[calStyles.dayRevText, { color: colors.success }]}>₹{selectedEntry.dayRevenue.toLocaleString()}</Text>
            </View>
          </View>
          <Text style={[calStyles.dayProjectCount, { color: colors.mutedForeground }]}>
            {selectedEntry.count} project{selectedEntry.count > 1 ? "s" : ""} on this day
          </Text>
          {selectedEntry.projects.map((p: any) => (
            <View key={p.id} style={[calStyles.dayProject, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[calStyles.dayProjectName, { color: colors.foreground }]} numberOfLines={1}>{p.projectName}</Text>
                <Text style={[calStyles.dayProjectClient, { color: colors.mutedForeground }]} numberOfLines={1}>{p.clientName}</Text>
                <Text style={[calStyles.dayProjectValue, { color: colors.success }]}>₹{p.totalValue.toLocaleString()}</Text>
              </View>
              <StatusBadge status={p.status} />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────
export default function EditorProfileScreen() {
  const colors = useColors();
  const { currentUser, setCurrentUser } = useApp();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const editorId = currentUser?.editorId ?? currentUser?.id ?? "";
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<Editor | null>(null);
  const [memberModalVisible, setMemberModalVisible] = useState(false);

  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ["editor-profile", editorId],
    queryFn: () => fetchEditorProfile(editorId),
    enabled: !!editorId,
  });

  const { data: editors = [] } = useQuery({
    queryKey: ["editors"],
    queryFn: fetchEditors,
  });

  const { data: memberProfile, isLoading: memberProfileLoading } = useQuery({
    queryKey: ["editor-analytics", selectedMember?.id],
    queryFn: () => fetchEditorAnalytics(selectedMember!.id),
    enabled: !!selectedMember,
  });

  useEffect(() => {
    if (!editorId) return;
    AsyncStorage.getItem(`profile_image_${editorId}`).then((uri) => {
      if (uri) setProfileImage(uri);
    });
  }, [editorId]);

  const ADMIN_PHONE = "+91 98765 00001";

  function handleLogout() {
    setCurrentUser(null);
    router.replace("/login");
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
          const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
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
          const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
          if (!result.canceled && result.assets[0]) {
            const uri = result.assets[0].uri;
            setProfileImage(uri);
            await AsyncStorage.setItem(`profile_image_${editorId}`, uri);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        },
      },
      {
        text: "Remove Photo", style: "destructive",
        onPress: async () => { setProfileImage(null); await AsyncStorage.removeItem(`profile_image_${editorId}`); },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  function openMember(member: Editor) {
    setSelectedMember(member);
    setMemberModalVisible(true);
  }

  const initials = (profile?.name ?? currentUser?.name ?? "E")
    .split(" ").map((w: string) => w[0]).join("").toUpperCase();

  const teammates = editors.filter((e) => e.id !== editorId);

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 100 }]}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.editorPrimary} />}
      >
        {isLoading ? (
          <View style={styles.loader}><ActivityIndicator color={colors.editorPrimary} /></View>
        ) : profile ? (
          <>
            {/* ── Header ─────────────────────────────────────────────────── */}
            <View style={[styles.headerCard, { backgroundColor: colors.editorPrimary }]}>
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

            {/* ── Stats ──────────────────────────────────────────────────── */}
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>My Statistics</Text>
            <View style={styles.statsGrid}>
              <StatBox label="Total Projects"   value={String(profile.stats.totalProjects)}       color={colors.editorPrimary} colors={colors} />
              <StatBox label="Completed"         value={String(profile.stats.completedProjects)}   color={colors.success}       colors={colors} />
              <StatBox label="In Progress"       value={String(profile.stats.inProgressProjects)}  color={colors.primary}       colors={colors} />
              <StatBox label="Pending"           value={String(profile.stats.pendingProjects)}     color={colors.warning}       colors={colors} />
              <StatBox label="Videos Uploaded"   value={String(profile.stats.totalVideosUploaded)} color={colors.editorPrimary} colors={colors} />
              <StatBox label="Approved"          value={String(profile.stats.approvedVideos)}      color={colors.success}       colors={colors} />
              <StatBox label="Rejected"          value={String(profile.stats.rejectedVideos)}      color={colors.destructive}   colors={colors} />
              <StatBox label="In Review"         value={String(profile.stats.pendingReviewVideos)} color={colors.warning}       colors={colors} />
            </View>

            {/* ── Earnings ───────────────────────────────────────────────── */}
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

            {/* ── Recent Projects ────────────────────────────────────────── */}
            {profile.recentProjects.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Projects</Text>
                {profile.recentProjects.map((p: any) => (
                  <View key={p.id} style={[styles.projectRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.projectRowLeft}>
                      <Text style={[styles.projectRowName, { color: colors.foreground }]} numberOfLines={1}>{p.projectName}</Text>
                      <Text style={[styles.projectRowClient, { color: colors.mutedForeground }]} numberOfLines={1}>{p.clientName}</Text>
                      <View style={styles.projectRowMeta}>
                        <Text style={[styles.projectRowValue, { color: colors.success }]}>₹{p.totalValue.toLocaleString()}</Text>
                        <Text style={[styles.projectRowDeliverable, { color: colors.mutedForeground }]}>{p.completedDeliverables}/{p.totalDeliverables} deliverables</Text>
                      </View>
                    </View>
                    <StatusBadge status={p.status} />
                  </View>
                ))}
              </>
            )}
          </>
        ) : (
          <View style={styles.errorBox}>
            <Feather name="alert-circle" size={32} color={colors.mutedForeground} />
            <Text style={[styles.errorText, { color: colors.mutedForeground }]}>Could not load profile</Text>
            <TouchableOpacity onPress={() => refetch()} style={[styles.retryBtn, { borderColor: colors.editorPrimary }]}>
              <Text style={{ color: colors.editorPrimary, fontFamily: "Inter_600SemiBold" }}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Team Members ─────────────────────────────────────────────────── */}
        {teammates.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: profile ? 0 : 20 }]}>Team Members</Text>
            <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>Tap to view profile & project calendar</Text>
            {teammates.map((member) => {
              const memberInitials = member.name.split(" ").map((w: string) => w[0]).join("").toUpperCase();
              return (
                <TouchableOpacity
                  key={member.id}
                  onPress={() => openMember(member)}
                  activeOpacity={0.75}
                  style={[styles.memberCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={[styles.memberAvatar, { backgroundColor: `${colors.editorPrimary}22` }]}>
                    <Text style={[styles.memberInitials, { color: colors.editorPrimary }]}>{memberInitials}</Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={[styles.memberName, { color: colors.foreground }]}>{member.name}</Text>
                    <Text style={[styles.memberSpec, { color: colors.mutedForeground }]}>{member.specialization}</Text>
                    <View style={styles.memberMeta}>
                      <Feather name="mail" size={11} color={colors.mutedForeground} />
                      <Text style={[styles.memberMetaText, { color: colors.mutedForeground }]}>{member.email}</Text>
                    </View>
                  </View>
                  <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {/* ── Actions ──────────────────────────────────────────────────────── */}
        <TouchableOpacity
          onPress={handleCallAdmin}
          style={[styles.actionBtn, { backgroundColor: "#dcfce7", borderColor: "#86efac", borderWidth: 1, marginTop: 8 }]}
        >
          <Feather name="phone-call" size={16} color="#166534" />
          <Text style={[styles.actionBtnText, { color: "#166534" }]}>Call Admin (Divayshakati)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleLogout}
          style={[styles.actionBtn, { backgroundColor: "#fee2e2", borderColor: "#fecaca", borderWidth: 1 }]}
        >
          <Feather name="log-out" size={16} color={colors.destructive} />
          <Text style={[styles.actionBtnText, { color: colors.destructive }]}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Team Member Profile Modal ─────────────────────────────────────── */}
      <Modal
        visible={memberModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setMemberModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Team Member Profile</Text>
            <TouchableOpacity onPress={() => setMemberModalVisible(false)} style={styles.modalClose}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {memberProfileLoading ? (
              <ActivityIndicator color={colors.editorPrimary} style={{ marginTop: 60 }} />
            ) : memberProfile && selectedMember ? (
              <>
                {/* Hero */}
                <View style={[styles.memberHero, { backgroundColor: colors.editorPrimary }]}>
                  <View style={[styles.memberHeroAvatar, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                    <Text style={styles.memberHeroInitials}>
                      {selectedMember.name.split(" ").map((w: string) => w[0]).join("").toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.memberHeroName}>{selectedMember.name}</Text>
                  <Text style={styles.memberHeroSpec}>{selectedMember.specialization}</Text>
                  <View style={styles.heroMetaRow}>
                    <View style={styles.metaItem}>
                      <Feather name="mail" size={12} color="rgba(255,255,255,0.8)" />
                      <Text style={styles.metaItemText}>{selectedMember.email}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Feather name="phone" size={12} color="rgba(255,255,255,0.8)" />
                      <Text style={styles.metaItemText}>{selectedMember.phone}</Text>
                    </View>
                  </View>
                </View>

                {/* Stats */}
                <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 4 }]}>Statistics</Text>
                <View style={styles.statsGrid}>
                  <StatBox label="Total Projects"   value={String((memberProfile as any).stats?.totalProjects ?? 0)}       color={colors.editorPrimary} colors={colors} />
                  <StatBox label="Completed"         value={String((memberProfile as any).stats?.completedProjects ?? 0)}   color={colors.success}       colors={colors} />
                  <StatBox label="In Progress"       value={String((memberProfile as any).stats?.inProgressProjects ?? 0)}  color={colors.primary}       colors={colors} />
                  <StatBox label="Pending"           value={String((memberProfile as any).stats?.pendingProjects ?? 0)}     color={colors.warning}       colors={colors} />
                  <StatBox label="Videos Uploaded"   value={String((memberProfile as any).stats?.totalVideosUploaded ?? 0)} color={colors.editorPrimary} colors={colors} />
                  <StatBox label="Approved"          value={String((memberProfile as any).stats?.approvedVideos ?? 0)}      color={colors.success}       colors={colors} />
                  <StatBox label="Rejected"          value={String((memberProfile as any).stats?.rejectedVideos ?? 0)}      color={colors.destructive}   colors={colors} />
                  <StatBox label="In Review"         value={String((memberProfile as any).stats?.pendingReviewVideos ?? 0)} color={colors.warning}       colors={colors} />
                </View>

                {/* Earnings */}
                <View style={[styles.earningsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.earningsIcon, { backgroundColor: `${colors.success}18` }]}>
                    <Feather name="dollar-sign" size={24} color={colors.success} />
                  </View>
                  <View>
                    <Text style={[styles.earningsLabel, { color: colors.mutedForeground }]}>Total Earnings (Completed)</Text>
                    <Text style={[styles.earningsValue, { color: colors.foreground }]}>
                      ₹{((memberProfile as any).stats?.totalEarnings ?? 0).toLocaleString()}
                    </Text>
                  </View>
                </View>

                {/* Project Calendar */}
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Project Calendar</Text>
                <Text style={[styles.sectionSub, { color: colors.mutedForeground, marginTop: -8 }]}>
                  Tap a highlighted date to see projects
                </Text>
                <MemberCalendar
                  projectsByDate={(memberProfile as any).projectsByDate ?? []}
                  colors={colors}
                />

                {/* Recent Projects */}
                {(memberProfile as any).allProjects?.length > 0 && (
                  <>
                    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>All Projects</Text>
                    {((memberProfile as any).allProjects as any[]).slice(0, 8).map((p: any) => (
                      <View key={p.id} style={[styles.projectRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.projectRowLeft}>
                          <Text style={[styles.projectRowName, { color: colors.foreground }]} numberOfLines={1}>{p.projectName}</Text>
                          <Text style={[styles.projectRowClient, { color: colors.mutedForeground }]} numberOfLines={1}>{p.clientName}</Text>
                          <View style={styles.projectRowMeta}>
                            <Text style={[styles.projectRowValue, { color: colors.success }]}>₹{p.totalValue.toLocaleString()}</Text>
                            <Text style={[styles.projectRowDeliverable, { color: colors.mutedForeground }]}>{p.completedDeliverables}/{p.totalDeliverables} deliverables</Text>
                          </View>
                        </View>
                        <StatusBadge status={p.status} />
                      </View>
                    ))}
                  </>
                )}
              </>
            ) : (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={32} color={colors.mutedForeground} />
                <Text style={[styles.errorText, { color: colors.mutedForeground }]}>Could not load profile</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

// ── Stat box ───────────────────────────────────────────────────────────────────
function StatBox({ label, value, color, colors }: { label: string; value: string; color: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, gap: 16 },
  loader: { flex: 1, alignItems: "center", paddingTop: 60 },
  errorBox: { alignItems: "center", paddingTop: 40, gap: 12 },
  errorText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
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
  sectionSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
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
  memberCard: { flexDirection: "row", alignItems: "center", borderRadius: 16, borderWidth: 1, padding: 14, gap: 12 },
  memberAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  memberInitials: { fontSize: 18, fontFamily: "Inter_700Bold" },
  memberInfo: { flex: 1, gap: 2 },
  memberName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  memberSpec: { fontSize: 12, fontFamily: "Inter_400Regular" },
  memberMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  memberMetaText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, paddingTop: 20, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  modalClose: { padding: 4 },
  modalContent: { padding: 20, gap: 16, paddingBottom: 60 },
  memberHero: { borderRadius: 20, padding: 24, alignItems: "center", gap: 8 },
  memberHeroAvatar: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  memberHeroInitials: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#fff" },
  memberHeroName: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  memberHeroSpec: { fontSize: 13, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.85)" },
  heroMetaRow: { marginTop: 8, gap: 4, alignItems: "center" },
});

const calStyles = StyleSheet.create({
  wrapper: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 12 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  navBtn: { padding: 6 },
  monthLabel: { fontSize: 16, fontFamily: "Inter_700Bold" },
  weekRow: { flexDirection: "row" },
  weekDay: { flex: 1, textAlign: "center", fontSize: 11, fontFamily: "Inter_500Medium" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: "14.28%", aspectRatio: 1, alignItems: "center", justifyContent: "center", gap: 2 },
  dayNum: { fontSize: 13, fontFamily: "Inter_500Medium" },
  dot: { width: 18, height: 12, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  dotCount: { fontSize: 9, fontFamily: "Inter_700Bold" },
  legend: { flexDirection: "row", justifyContent: "center", gap: 14, marginTop: 4 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  dayDetail: { borderTopWidth: 1, paddingTop: 14, gap: 10, marginTop: 4 },
  dayDetailHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  dayDetailDate: { fontSize: 13, fontFamily: "Inter_600SemiBold", flex: 1 },
  dayRevBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  dayRevText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  dayProjectCount: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: -4 },
  dayProject: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 12, borderWidth: 1, padding: 12, gap: 8 },
  dayProjectName: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  dayProjectClient: { fontSize: 12, fontFamily: "Inter_400Regular" },
  dayProjectValue: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginTop: 2 },
});
