import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
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

const LOGO = require("../assets/images/logo.png");

const SPECIALIZATIONS = ["Video Editor", "Graphic Designer", "Ads Setup", "Website Development", "Social Media Manager"];

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
      style={[styles.container, { backgroundColor: "#050d1a" }]}
      contentContainerStyle={[styles.content, { paddingTop: topInset + 20, paddingBottom: bottomInset + 40 }]}
      keyboardShouldPersistTaps="handled"
    >
      {/* Brand Hero */}
      <View style={styles.hero}>
        <Image source={LOGO} style={styles.logoImg} resizeMode="contain" />
        <Text style={styles.brand}>Divayshakati</Text>
        <Text style={styles.tagline}>Project Manager</Text>
        <View style={styles.specRow}>
          {SPECIALIZATIONS.map((s) => (
            <View key={s} style={styles.specChip}>
              <Text style={styles.specText}>{s}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Login Card */}
      <View style={[styles.card, { backgroundColor: "rgba(255,255,255,0.07)", borderColor: "rgba(255,255,255,0.12)" }]}>
        <Text style={styles.cardTitle}>Sign In</Text>

        {error !== "" && (
          <View style={[styles.errorBanner, { backgroundColor: "#fee2e2" }]}>
            <Feather name="alert-circle" size={14} color="#b91c1c" />
            <Text style={[styles.errorText, { color: "#b91c1c" }]}>{error}</Text>
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>Username</Text>
          <View style={styles.inputRow}>
            <Feather name="user" size={16} color="rgba(255,255,255,0.5)" />
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={(v) => { setUsername(v); setError(""); }}
              placeholder="admin, alice, bob..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => passRef.current?.focus()}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputRow}>
            <Feather name="lock" size={16} color="rgba(255,255,255,0.5)" />
            <TextInput
              ref={passRef}
              style={styles.input}
              value={password}
              onChangeText={(v) => { setPassword(v); setError(""); }}
              placeholder="Your password"
              placeholderTextColor="rgba(255,255,255,0.3)"
              secureTextEntry={!showPass}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="go"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)}>
              <Feather name={showPass ? "eye-off" : "eye"} size={16} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleLogin}
          disabled={loading}
          style={[styles.loginBtn, { opacity: loading ? 0.7 : 1 }]}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.loginBtnText}>Sign In</Text>}
        </TouchableOpacity>
      </View>

      {/* Hint */}
      <View style={styles.hintBox}>
        <Feather name="info" size={14} color="#f0c040" />
        <View style={styles.hintContent}>
          <Text style={styles.hintTitle}>Demo Credentials</Text>
          <Text style={styles.hintLine}>Admin  :  admin / admin123</Text>
          <Text style={styles.hintLine}>Editors:  alice / alice123  •  bob / bob123</Text>
          <Text style={styles.hintLine}>           clara / clara123  •  david / david123</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 24, gap: 24 },
  hero: { alignItems: "center", gap: 8 },
  logoImg: { width: 160, height: 160 },
  brand: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#f0c040", letterSpacing: 1 },
  tagline: { fontSize: 14, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.7)", letterSpacing: 2 },
  specRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "center", marginTop: 8 },
  specChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: "rgba(96,165,250,0.15)", borderWidth: 1, borderColor: "rgba(96,165,250,0.3)" },
  specText: { fontSize: 10, fontFamily: "Inter_500Medium", color: "#93c5fd" },
  card: { borderRadius: 20, borderWidth: 1, padding: 24, gap: 16 },
  cardTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff", marginBottom: 4 },
  errorBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10 },
  errorText: { fontSize: 13, fontFamily: "Inter_500Medium", flex: 1 },
  field: { gap: 6 },
  label: { fontSize: 14, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.8)" },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1, backgroundColor: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.15)" },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", color: "#fff" },
  loginBtn: { paddingVertical: 15, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 4, backgroundColor: "#d4a017" },
  loginBtnText: { color: "#0a0a0a", fontSize: 16, fontFamily: "Inter_700Bold" },
  hintBox: { flexDirection: "row", gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, alignItems: "flex-start", backgroundColor: "rgba(240,192,64,0.08)", borderColor: "rgba(240,192,64,0.2)" },
  hintContent: { flex: 1, gap: 2 },
  hintTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#f0c040", marginBottom: 2 },
  hintLine: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.6)" },
});
