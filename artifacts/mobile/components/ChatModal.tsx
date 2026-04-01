import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import {
  fetchMessages,
  sendMessage,
  markMessagesRead,
  setRevision,
  type Message,
  type Project,
} from "@/hooks/useApi";

interface Props {
  visible: boolean;
  onClose: () => void;
  project: Project;
  currentUserId: string;
  currentUserName: string;
  role: "admin" | "editor";
}

export function ChatModal({ visible, onClose, project, currentUserId, currentUserName, role }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const listRef = useRef<FlatList>(null);

  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [showAttach, setShowAttach] = useState(false);
  const [sending, setSending] = useState(false);
  const [togglingRevision, setTogglingRevision] = useState(false);
  const [localRevision, setLocalRevision] = useState(project.revisionRequested);

  const qKey = ["messages", project.id];

  const { data: messages = [], isLoading } = useQuery({
    queryKey: qKey,
    queryFn: () => fetchMessages(project.id),
    enabled: visible,
    refetchInterval: visible ? 5000 : false,
  });

  useEffect(() => {
    if (visible && messages.length > 0) {
      markMessagesRead(project.id, currentUserId).catch(() => null);
    }
  }, [visible, messages.length]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  useEffect(() => {
    setLocalRevision(project.revisionRequested);
  }, [project.revisionRequested]);

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSending(true);
    try {
      await sendMessage(project.id, {
        senderId: currentUserId,
        senderName: currentUserName,
        senderRole: role,
        text: trimmed,
        fileName: fileName.trim() || undefined,
        fileSize: fileSize.trim() || undefined,
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setText(""); setFileName(""); setFileSize(""); setShowAttach(false);
      queryClient.invalidateQueries({ queryKey: qKey });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch { /* silent */ }
    finally { setSending(false); }
  }

  async function handleToggleRevision() {
    setTogglingRevision(true);
    try {
      const next = !localRevision;
      await setRevision(project.id, next);
      setLocalRevision(next);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["editor-projects"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    } catch { /* silent */ }
    finally { setTogglingRevision(false); }
  }

  function renderMessage({ item }: { item: Message }) {
    const isMe = item.senderId === currentUserId;
    const time = new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const date = new Date(item.createdAt).toLocaleDateString([], { day: "numeric", month: "short" });

    return (
      <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
        {!isMe && (
          <View style={[styles.avatar, { backgroundColor: role === "admin" ? `${colors.editorPrimary}22` : `${colors.adminPrimary}22` }]}>
            <Text style={[styles.avatarText, { color: role === "admin" ? colors.editorPrimary : colors.adminPrimary }]}>
              {item.senderName.split(" ").map((w) => w[0]).join("").slice(0, 2)}
            </Text>
          </View>
        )}
        <View style={[
          styles.bubble,
          isMe
            ? { backgroundColor: role === "editor" ? colors.editorPrimary : colors.adminPrimary, borderBottomRightRadius: 4 }
            : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderBottomLeftRadius: 4 },
          { maxWidth: "78%" },
        ]}>
          {!isMe && (
            <Text style={[styles.senderName, { color: colors.mutedForeground }]}>{item.senderName}</Text>
          )}
          <Text style={[styles.msgText, { color: isMe ? "#fff" : colors.foreground }]}>{item.text}</Text>
          {item.fileName && (
            <View style={[styles.attachBubble, { backgroundColor: isMe ? "rgba(255,255,255,0.15)" : colors.muted }]}>
              <Feather name="paperclip" size={12} color={isMe ? "#fff" : colors.mutedForeground} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.attachName, { color: isMe ? "#fff" : colors.foreground }]} numberOfLines={1}>{item.fileName}</Text>
                {item.fileSize && <Text style={[styles.attachSize, { color: isMe ? "rgba(255,255,255,0.7)" : colors.mutedForeground }]}>{item.fileSize}</Text>}
              </View>
            </View>
          )}
          <Text style={[styles.msgTime, { color: isMe ? "rgba(255,255,255,0.65)" : colors.mutedForeground }]}>{date} {time}</Text>
        </View>
      </View>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.root, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <View style={styles.headerMid}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>{project.projectName}</Text>
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>{project.clientName} • Customise Chat</Text>
          </View>
          {/* Revision toggle — admin only */}
          {role === "admin" && (
            <TouchableOpacity
              onPress={handleToggleRevision}
              disabled={togglingRevision}
              style={[
                styles.revisionBtn,
                { backgroundColor: localRevision ? "#fef3c7" : colors.muted, borderColor: localRevision ? "#f59e0b" : colors.border },
              ]}
            >
              {togglingRevision ? <ActivityIndicator size="small" color={localRevision ? "#f59e0b" : colors.mutedForeground} /> : (
                <>
                  <Feather name="edit-2" size={13} color={localRevision ? "#b45309" : colors.mutedForeground} />
                  <Text style={[styles.revisionBtnText, { color: localRevision ? "#b45309" : colors.mutedForeground }]}>
                    {localRevision ? "In Revision" : "Mark Revision"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
          {role === "editor" && localRevision && (
            <View style={[styles.revisionBadge, { backgroundColor: "#fef3c7", borderColor: "#f59e0b" }]}>
              <Feather name="edit-2" size={12} color="#b45309" />
              <Text style={[styles.revisionBadgeText, { color: "#b45309" }]}>Revision</Text>
            </View>
          )}
        </View>

        {/* Customise context banner */}
        <View style={[styles.contextBanner, { backgroundColor: `${role === "admin" ? colors.adminPrimary : colors.editorPrimary}10`, borderBottomColor: colors.border }]}>
          <Feather name="message-circle" size={14} color={role === "admin" ? colors.adminPrimary : colors.editorPrimary} />
          <Text style={[styles.contextText, { color: colors.mutedForeground }]}>
            Customise discussion for <Text style={{ fontFamily: "Inter_600SemiBold", color: colors.foreground }}>{project.projectName}</Text>
          </Text>
        </View>

        {/* Messages list */}
        {isLoading ? (
          <View style={styles.loader}><ActivityIndicator color={colors.primary} /></View>
        ) : messages.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="message-square" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No messages yet</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Start the customise conversation below</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.msgList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {/* File attachment inputs (expanded) */}
        {showAttach && (
          <View style={[styles.attachPanel, { backgroundColor: colors.muted, borderTopColor: colors.border }]}>
            <Text style={[styles.attachLabel, { color: colors.mutedForeground }]}>ATTACH FILE</Text>
            <TextInput
              style={[styles.attachInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              value={fileName}
              onChangeText={setFileName}
              placeholder="File name (e.g. final_edit_v2.mp4)"
              placeholderTextColor={colors.mutedForeground}
            />
            <TextInput
              style={[styles.attachInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              value={fileSize}
              onChangeText={setFileSize}
              placeholder="File size (e.g. 450 MB) — optional"
              placeholderTextColor={colors.mutedForeground}
            />
          </View>
        )}

        {/* Input bar */}
        <View style={[styles.inputBar, { borderTopColor: colors.border, backgroundColor: colors.background, paddingBottom: insets.bottom + 8 }]}>
          <TouchableOpacity
            onPress={() => { setShowAttach((v) => !v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            style={[styles.attachToggle, { backgroundColor: showAttach ? `${colors.primary}18` : colors.muted, borderColor: showAttach ? colors.primary : colors.border }]}
          >
            <Feather name="paperclip" size={18} color={showAttach ? colors.primary : colors.mutedForeground} />
          </TouchableOpacity>
          <TextInput
            style={[styles.textInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            value={text}
            onChangeText={setText}
            placeholder="Type customise details..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={sending || !text.trim()}
            style={[
              styles.sendBtn,
              { backgroundColor: text.trim() ? (role === "editor" ? colors.editorPrimary : colors.adminPrimary) : colors.muted },
            ]}
          >
            {sending ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="send" size={18} color="#fff" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, gap: 10 },
  closeBtn: { padding: 4 },
  headerMid: { flex: 1 },
  headerTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  revisionBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  revisionBtnText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  revisionBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 14, borderWidth: 1 },
  revisionBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  contextBanner: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1 },
  contextText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  msgList: { padding: 16, gap: 12 },
  msgRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  msgRowMe: { justifyContent: "flex-end" },
  avatar: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  bubble: { padding: 10, borderRadius: 16, gap: 4 },
  senderName: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  msgText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  msgTime: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "right" },
  attachBubble: { flexDirection: "row", alignItems: "center", gap: 6, padding: 8, borderRadius: 8, marginTop: 2 },
  attachName: { fontSize: 12, fontFamily: "Inter_500Medium" },
  attachSize: { fontSize: 10, fontFamily: "Inter_400Regular" },
  attachPanel: { borderTopWidth: 1, padding: 12, gap: 8 },
  attachLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  attachInput: { padding: 10, borderRadius: 10, borderWidth: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  inputBar: { flexDirection: "row", alignItems: "flex-end", gap: 8, padding: 12, paddingTop: 8, borderTopWidth: 1 },
  attachToggle: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  textInput: { flex: 1, padding: 10, paddingTop: 10, borderRadius: 20, borderWidth: 1, fontSize: 14, fontFamily: "Inter_400Regular", maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
});
