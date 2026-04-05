import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  color?: string;
  onPress?: () => void;
}

export function StatCard({ label, value, icon, color, onPress }: Props) {
  const colors = useColors();
  const tint = color ?? colors.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: onPress ? `${tint}40` : colors.border },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${tint}18` }]}>
        <Feather name={icon} size={20} color={tint} />
      </View>
      <Text style={[styles.value, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
      {onPress && (
        <View style={styles.chevronRow}>
          <Text style={[styles.tapHint, { color: tint }]}>Tap to view</Text>
          <Feather name="chevron-right" size={12} color={tint} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 6,
    alignItems: "flex-start",
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  chevronRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 2,
  },
  tapHint: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
});
