import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
  deleteMessage,
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

interface PendingFile {
  name: string;
  size: string;
  type: string;
  uri?: string;
}

interface PendingAudio {
  uri: string;
  durationSecs: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function fileIcon(type: string): React.ComponentProps<typeof Feather>["name"] {
  if (type.includes("video")) return "video";
  if (type.includes("audio")) return "headphones";
  if (type.includes("image")) return "image";
  if (type.includes("pdf")) return "file-text";
  if (type.includes("zip") || type.includes("rar")) return "archive";
  return "file";
}

// local store for audio URIs (keyed by message id or temp key)
const localAudioStore: Map<string, string> = new Map();

export function ChatModal({ visible, onClose, project, currentUserId, currentUserName, role }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const listRef = useRef<FlatList>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [togglingRevision, setTogglingRevision] = useState(false);
  const [localRevision, setLocalRevision] = useState(project.revisionRequested);

  // File attachment
  const [pendingFile, setPendingFile] = useState<PendingFile | null>(null);

  // Audio recording
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const [pendingAudio, setPendingAudio] = useState<PendingAudio | null>(null);

  // Audio playback
  const soundRef = useRef<Audio.Sound | null>(null);
  const [playingMsgId, setPlayingMsgId] = useState<string | null>(null);

  // Delete context
  const [selectedMsg, setSelectedMsg] = useState<Message | null>(null);

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

  // Cleanup on close
  useEffect(() => {
    if (!visible) {
      stopTimer();
      if (recording) { recording.stopAndUnloadAsync().catch(() => null); setRecording(null); }
      setIsRecording(false);
      setRecordSecs(0);
      setPendingAudio(null);
      setPendingFile(null);
      stopSound();
    }
  }, [visible]);

  function stopTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  async function stopSound() {
    if (soundRef.current) {
      await soundRef.current.stopAsync().catch(() => null);
      await soundRef.current.unloadAsync().catch(() => null);
      soundRef.current = null;
    }
    setPlayingMsgId(null);
  }

  // ─── File picker ─────────────────────────────────────────────────────────────
  async function handlePickFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      setPendingFile({
        name: asset.name,
        size: asset.size ? formatBytes(asset.size) : "Unknown size",
        type: asset.mimeType ?? "application/octet-stream",
        uri: asset.uri,
      });
      setPendingAudio(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      Alert.alert("Error", "Could not open file picker.");
    }
  }

  // ─── Audio recorder ───────────────────────────────────────────────────────────
  async function handleMicPress() {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  }

  async function startRecording() {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) { Alert.alert("Permission Denied", "Microphone access is needed to record audio."); return; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(rec);
      setIsRecording(true);
      setRecordSecs(0);
      setPendingFile(null);
      setPendingAudio(null);
      timerRef.current = setInterval(() => setRecordSecs((s) => s + 1), 1000);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {
      Alert.alert("Error", "Could not start recording.");
    }
  }

  async function stopRecording() {
    stopTimer();
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const status = await recording.getStatusAsync();
      const durationSecs = Math.round((status.durationMillis ?? recordSecs * 1000) / 1000);
      setRecording(null);
      setIsRecording(false);
      if (uri) { setPendingAudio({ uri, durationSecs }); }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      setRecording(null); setIsRecording(false);
    }
  }

  async function handlePlayAudio(uri: string, msgId: string) {
    if (playingMsgId === msgId) {
      await stopSound();
      return;
    }
    await stopSound();
    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      soundRef.current = sound;
      setPlayingMsgId(msgId);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) { setPlayingMsgId(null); sound.unloadAsync().catch(() => null); }
      });
    } catch { Alert.alert("Error", "Could not play audio."); }
  }

  // ─── Delete message ──────────────────────────────────────────────────────────
  function handleDeleteForEveryone(msg: Message) {
    setSelectedMsg(msg);
    Alert.alert(
      "Delete Message",
      "Delete this message for everyone?",
      [
        { text: "Cancel", style: "cancel", onPress: () => setSelectedMsg(null) },
        {
          text: "Delete for Everyone",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMessage(project.id, msg.id, currentUserId);
              localAudioStore.delete(msg.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              queryClient.invalidateQueries({ queryKey: qKey });
            } catch {
              Alert.alert("Error", "Could not delete the message.");
            } finally {
              setSelectedMsg(null);
            }
          },
        },
      ]
    );
  }

  // ─── Send ─────────────────────────────────────────────────────────────────────
  async function handleSend() {
    const trimmed = text.trim();
    const hasFile = !!pendingFile;
    const hasAudio = !!pendingAudio;
    if (!trimmed && !hasFile && !hasAudio) return;

    setSending(true);
    try {
      let msgText = trimmed;
      let fileName: string | undefined;
      let fileSize: string | undefined;
      let fileType: string | undefined;
      let isAudio = false;

      if (hasAudio) {
        msgText = trimmed || "🎤 Voice Message";
        fileName = `voice_${Date.now()}.m4a`;
        fileSize = formatBytes(pendingAudio!.durationSecs * 16000);
        fileType = "audio/m4a";
        isAudio = true;
      } else if (hasFile) {
        msgText = trimmed || `📎 ${pendingFile!.name}`;
        fileName = pendingFile!.name;
        fileSize = pendingFile!.size;
        fileType = pendingFile!.type;
      }

      if (!msgText) msgText = "📎 File attached";

      const sent = await sendMessage(project.id, {
        senderId: currentUserId, senderName: currentUserName, senderRole: role,
        text: msgText, fileName, fileSize, fileType, isAudio,
      });

      // store audio uri locally for playback
      if (hasAudio && pendingAudio) {
        localAudioStore.set(sent.id, pendingAudio.uri);
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setText(""); setPendingFile(null); setPendingAudio(null);
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
    const accentColor = role === "editor" ? colors.editorPrimary : colors.adminPrimary;
    const bubbleBg = isMe
      ? (role === "editor" ? colors.editorPrimary : colors.adminPrimary)
      : colors.card;
    const textColor = isMe ? "#fff" : colors.foreground;
    const isSelected = selectedMsg?.id === item.id;

    const audioUri = localAudioStore.get(item.id);
    const isPlaying = playingMsgId === item.id;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onLongPress={() => {
          if (isMe) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            handleDeleteForEveryone(item);
          }
        }}
        delayLongPress={400}
        style={[
          styles.msgRow,
          isMe && styles.msgRowMe,
          isSelected && { opacity: 0.6 },
        ]}
      >
        {!isMe && (
          <View style={[styles.avatar, { backgroundColor: `${role === "admin" ? colors.editorPrimary : colors.adminPrimary}22` }]}>
            <Text style={[styles.avatarText, { color: role === "admin" ? colors.editorPrimary : colors.adminPrimary }]}>
              {item.senderName.split(" ").map((w) => w[0]).join("").slice(0, 2)}
            </Text>
          </View>
        )}
        <View style={[styles.bubble, { backgroundColor: bubbleBg, borderColor: colors.border, borderWidth: isMe ? 0 : 1, maxWidth: "78%" }, isMe ? styles.bubbleRight : styles.bubbleLeft]}>
          {!isMe && <Text style={[styles.senderName, { color: colors.mutedForeground }]}>{item.senderName}</Text>}

          {/* Voice message bubble */}
          {item.isAudio ? (
            <TouchableOpacity
              style={[styles.audioBubble, { backgroundColor: isMe ? "rgba(255,255,255,0.18)" : `${accentColor}14` }]}
              onPress={() => audioUri ? handlePlayAudio(audioUri, item.id) : Alert.alert("Audio unavailable", "Audio is only available on the device that recorded it.")}
              activeOpacity={0.8}
            >
              <View style={[styles.audioPlayBtn, { backgroundColor: isMe ? "rgba(255,255,255,0.28)" : accentColor }]}>
                <Feather name={isPlaying ? "pause" : "play"} size={16} color={isMe ? accentColor : "#fff"} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.audioLabel, { color: textColor }]}>
                  {isPlaying ? "Playing..." : "Voice Message"}
                </Text>
                {item.fileName && (
                  <Text style={[styles.audioSub, { color: isMe ? "rgba(255,255,255,0.65)" : colors.mutedForeground }]}>
                    🎤 {item.fileName}
                  </Text>
                )}
              </View>
              <Feather name="mic" size={14} color={isMe ? "rgba(255,255,255,0.6)" : accentColor} />
            </TouchableOpacity>
          ) : item.fileName ? (
            <>
              {item.text !== `📎 ${item.fileName}` && (
                <Text style={[styles.msgText, { color: textColor }]}>{item.text}</Text>
              )}
              <View style={[styles.attachBubble, { backgroundColor: isMe ? "rgba(255,255,255,0.15)" : colors.muted }]}>
                <Feather name={fileIcon(item.fileType ?? "")} size={18} color={isMe ? "#fff" : accentColor} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.attachName, { color: isMe ? "#fff" : colors.foreground }]} numberOfLines={1}>{item.fileName}</Text>
                  {item.fileSize && <Text style={[styles.attachSize, { color: isMe ? "rgba(255,255,255,0.65)" : colors.mutedForeground }]}>{item.fileSize}</Text>}
                </View>
              </View>
            </>
          ) : (
            <Text style={[styles.msgText, { color: textColor }]}>{item.text}</Text>
          )}

          <View style={styles.msgFooter}>
            <Text style={[styles.msgTime, { color: isMe ? "rgba(255,255,255,0.6)" : colors.mutedForeground }]}>{date} {time}</Text>
            {isMe && (
              <Feather name="check-circle" size={11} color="rgba(255,255,255,0.5)" />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  const canSend = !sending && (text.trim().length > 0 || !!pendingFile || !!pendingAudio);
  const accentColor = role === "editor" ? colors.editorPrimary : colors.adminPrimary;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.root, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
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
          {role === "admin" && (
            <TouchableOpacity
              onPress={handleToggleRevision}
              disabled={togglingRevision}
              style={[styles.revisionBtn, { backgroundColor: localRevision ? "#fef3c7" : colors.muted, borderColor: localRevision ? "#f59e0b" : colors.border }]}
            >
              {togglingRevision
                ? <ActivityIndicator size="small" color={localRevision ? "#f59e0b" : colors.mutedForeground} />
                : <>
                  <Feather name="edit-2" size={13} color={localRevision ? "#b45309" : colors.mutedForeground} />
                  <Text style={[styles.revisionBtnText, { color: localRevision ? "#b45309" : colors.mutedForeground }]}>
                    {localRevision ? "In Revision" : "Mark Revision"}
                  </Text>
                </>
              }
            </TouchableOpacity>
          )}
          {role === "editor" && localRevision && (
            <View style={[styles.revisionBadge, { backgroundColor: "#fef3c7", borderColor: "#f59e0b" }]}>
              <Feather name="edit-2" size={12} color="#b45309" />
              <Text style={[styles.revisionBadgeText, { color: "#b45309" }]}>Revision</Text>
            </View>
          )}
        </View>

        {/* Context banner */}
        <View style={[styles.contextBanner, { backgroundColor: `${accentColor}10`, borderBottomColor: colors.border }]}>
          <Feather name="message-circle" size={14} color={accentColor} />
          <Text style={[styles.contextText, { color: colors.mutedForeground }]}>
            Customise discussion for{" "}
            <Text style={{ fontFamily: "Inter_600SemiBold", color: colors.foreground }}>{project.projectName}</Text>
          </Text>
        </View>

        {/* Messages */}
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

        {/* Pending file preview */}
        {pendingFile && (
          <View style={[styles.pendingPanel, { backgroundColor: `${accentColor}10`, borderTopColor: colors.border }]}>
            <Feather name={fileIcon(pendingFile.type)} size={20} color={accentColor} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.pendingName, { color: colors.foreground }]} numberOfLines={1}>{pendingFile.name}</Text>
              <Text style={[styles.pendingSize, { color: colors.mutedForeground }]}>{pendingFile.size} • {pendingFile.type.split("/")[1] ?? "file"}</Text>
            </View>
            <TouchableOpacity onPress={() => setPendingFile(null)} style={styles.pendingClose}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        )}

        {/* Pending audio preview */}
        {pendingAudio && (
          <View style={[styles.pendingPanel, { backgroundColor: "#fee2e220", borderTopColor: colors.border }]}>
            <View style={[styles.audioPlayBtn, { backgroundColor: accentColor }]}>
              <TouchableOpacity onPress={() => handlePlayAudio(pendingAudio.uri, "preview")}>
                <Feather name={playingMsgId === "preview" ? "pause" : "play"} size={14} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.pendingName, { color: colors.foreground }]}>Voice Message recorded</Text>
              <Text style={[styles.pendingSize, { color: colors.mutedForeground }]}>{formatDuration(pendingAudio.durationSecs)}</Text>
            </View>
            <TouchableOpacity onPress={() => { setPendingAudio(null); stopSound(); }} style={styles.pendingClose}>
              <Feather name="trash-2" size={16} color={colors.destructive} />
            </TouchableOpacity>
          </View>
        )}

        {/* Recording indicator */}
        {isRecording && (
          <View style={[styles.recordingBar, { backgroundColor: "#fee2e2", borderTopColor: "#fecaca" }]}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>Recording... {formatDuration(recordSecs)}</Text>
            <Text style={styles.recordingHint}>Tap mic to stop</Text>
          </View>
        )}

        {/* Input bar */}
        <View style={[styles.inputBar, { borderTopColor: colors.border, backgroundColor: colors.background, paddingBottom: insets.bottom + 8 }]}>
          {/* File picker */}
          <TouchableOpacity
            onPress={handlePickFile}
            disabled={isRecording}
            style={[styles.iconBtn, { backgroundColor: pendingFile ? `${accentColor}18` : colors.muted, borderColor: pendingFile ? accentColor : colors.border }]}
          >
            <Feather name="paperclip" size={18} color={pendingFile ? accentColor : colors.mutedForeground} />
          </TouchableOpacity>

          {/* Text input */}
          <TextInput
            style={[styles.textInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            value={text}
            onChangeText={setText}
            placeholder={isRecording ? "Recording audio..." : pendingAudio ? "Add a message (optional)..." : "Type customise details..."}
            placeholderTextColor={colors.mutedForeground}
            multiline
            maxLength={500}
            editable={!isRecording}
          />

          {/* Mic button */}
          <TouchableOpacity
            onPress={handleMicPress}
            style={[
              styles.iconBtn,
              {
                backgroundColor: isRecording ? "#fee2e2" : pendingAudio ? `${accentColor}18` : colors.muted,
                borderColor: isRecording ? "#ef4444" : pendingAudio ? accentColor : colors.border,
              },
            ]}
          >
            <Feather name={isRecording ? "mic-off" : "mic"} size={18} color={isRecording ? "#ef4444" : pendingAudio ? accentColor : colors.mutedForeground} />
          </TouchableOpacity>

          {/* Send */}
          <TouchableOpacity
            onPress={handleSend}
            disabled={!canSend || isRecording}
            style={[styles.sendBtn, { backgroundColor: canSend && !isRecording ? accentColor : colors.muted }]}
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
  bubbleLeft: { borderBottomLeftRadius: 4 },
  bubbleRight: { borderBottomRightRadius: 4 },
  senderName: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  msgText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  msgFooter: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 4 },
  msgTime: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "right" },
  attachBubble: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10, marginTop: 2 },
  attachName: { fontSize: 12, fontFamily: "Inter_500Medium" },
  attachSize: { fontSize: 10, fontFamily: "Inter_400Regular" },
  audioBubble: { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: 12, marginVertical: 2 },
  audioPlayBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  audioLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  audioSub: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 2 },
  pendingPanel: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1 },
  pendingName: { fontSize: 13, fontFamily: "Inter_500Medium" },
  pendingSize: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  pendingClose: { padding: 4 },
  recordingBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 8, borderTopWidth: 1 },
  recordingDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#ef4444" },
  recordingText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#ef4444", flex: 1 },
  recordingHint: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#b91c1c" },
  inputBar: { flexDirection: "row", alignItems: "flex-end", gap: 8, padding: 12, paddingTop: 8, borderTopWidth: 1 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  textInput: { flex: 1, padding: 10, paddingTop: 10, borderRadius: 20, borderWidth: 1, fontSize: 14, fontFamily: "Inter_400Regular", maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
});
