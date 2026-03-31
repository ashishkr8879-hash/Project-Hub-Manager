import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { login } from "@/hooks/useApi";

export default function LoginScreen() {
  const colors = useColors();
  const { setCurrentUser } = useApp();
  const insets = useSafeAreaInsets();
  const topInset   = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass]  = useState(false);
  const [loading, setLoading]    = useState(false);
  const [error, setError]        = useState("");
  const passRef = useRef<TextInput>(null);

  async function handleLogin() {
    if (!username.trim() || !password.trim()) {
      setError("Please enter your username and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const user = await login({ username: username.trim(), password });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCurrentUser({ id: user.id, name: user.name, role: user.role, editorId: user.editorId });
      router.replace(user.role === "admin" ? "/(admin)" : "/(editor)");
    } catch (e: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(e instanceof Error ? e.message : "Login failed. Try again.");
    } finally { setLoading(false); }
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topInset + 40, paddingBottom: bottomInset + 40 }]}
      keyboardShouldPersistTaps="handled"
    >
      {/* Brand Hero */}
      <View style={styles.hero}>
        <View style={[styles.logo, { backgroundColor: colors.primary }]}>
          <Feather name="play-circle" size={38} color="#fff" />
        </View>
        <Text style={[styles.brand, { color: colors.foreground }]}>Divyashakti</Text>
        <Text style={[styles.tagline, { color: colors.mutedForeground }]}>Video Production Management</Text>
      </View>

      {/* Login Card */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>Sign In</Text>

        {error !== "" && (
          <View style={[styles.errorBanner, { backgroundColor: "#fee2e2" }]}>
            <Feather name="alert-circle" size={14} color="#b91c1c" />
            <Text style={[styles.errorText, { color: "#b91c1c" }]}>{error}</Text>
          </View>
        )}

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.foreground }]}>Username</Text>
          <View style={[styles.inputRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Feather name="user" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              value={username}
              onChangeText={(v) => { setUsername(v); setError(""); }}
              placeholder="admin, alice, bob..."
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => passRef.current?.focus()}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.foreground }]}>Password</Text>
          <View style={[styles.inputRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Feather name="lock" size={16} color={colors.mutedForeground} />
            <TextInput
              ref={passRef}
              style={[styles.input, { color: colors.foreground }]}
              value={password}
              onChangeText={(v) => { setPassword(v); setError(""); }}
              placeholder="Your password"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry={!showPass}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="go"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)}>
              <Feather name={showPass ? "eye-off" : "eye"} size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleLogin}
          disabled={loading}
          style={[styles.loginBtn, { backgroundColor: loading ? colors.muted : colors.primary }]}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.loginBtnText}>Sign In</Text>}
        </TouchableOpacity>
      </View>

      {/* Hint */}
      <View style={[styles.hintBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <Feather name="info" size={14} color={colors.primary} />
        <View style={styles.hintContent}>
          <Text style={[styles.hintTitle, { color: colors.foreground }]}>Demo Credentials</Text>
          <Text style={[styles.hintLine, { color: colors.mutedForeground }]}>Admin  :  admin / admin123</Text>
          <Text style={[styles.hintLine, { color: colors.mutedForeground }]}>Editors:  alice / alice123  •  bob / bob123</Text>
          <Text style={[styles.hintLine, { color: colors.mutedForeground }]}>           clara / clara123  •  david / david123</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 24, gap: 24 },
  hero: { alignItems: "center", gap: 10 },
  logo: { width: 84, height: 84, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  brand: { fontSize: 30, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  tagline: { fontSize: 13, fontFamily: "Inter_400Regular" },
  card: { borderRadius: 20, borderWidth: 1, padding: 24, gap: 16 },
  cardTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 4 },
  errorBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10 },
  errorText: { fontSize: 13, fontFamily: "Inter_500Medium", flex: 1 },
  field: { gap: 6 },
  label: { fontSize: 14, fontFamily: "Inter_500Medium" },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  loginBtn: { paddingVertical: 15, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 4 },
  loginBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  hintBox: { flexDirection: "row", gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, alignItems: "flex-start" },
  hintContent: { flex: 1, gap: 2 },
  hintTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  hintLine: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
