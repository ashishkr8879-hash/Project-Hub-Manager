import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import type { Project } from "@/hooks/useApi";

interface Props {
  status: Project["status"];
}

export function StatusBadge({ status }: Props) {
  const colors = useColors();

  const config = {
    pending: { label: "Pending", bg: "#fef3c7", text: "#92400e" },
    in_progress: { label: "In Progress", bg: "#dbeafe", text: "#1e40af" },
    completed: { label: "Completed", bg: "#dcfce7", text: "#166534" },
  };

  const cfg = config[status];

  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.label, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
});
