import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const DAYS_HEADER = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (dateStr: string) => void;
  selected?: string;
}

export function DatePickerModal({ visible, onClose, onSelect, selected }: DatePickerModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const selectedDate = selected ? new Date(selected) : null;

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  function handleDayPress(day: number) {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    onSelect(`${viewYear}-${mm}-${dd}`);
    onClose();
  }

  function isSelected(day: number) {
    if (!selectedDate) return false;
    return selectedDate.getFullYear() === viewYear && selectedDate.getMonth() === viewMonth && selectedDate.getDate() === day;
  }

  function isToday(day: number) {
    return today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;
  }

  function isPast(day: number) {
    const d = new Date(viewYear, viewMonth, day);
    d.setHours(0, 0, 0, 0);
    const t = new Date(); t.setHours(0, 0, 0, 0);
    return d < t;
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />

          <View style={styles.nav}>
            <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
              <Feather name="chevron-left" size={20} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.monthTitle, { color: colors.foreground }]}>{MONTHS[viewMonth]} {viewYear}</Text>
            <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
              <Feather name="chevron-right" size={20} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <View style={styles.daysHeader}>
            {DAYS_HEADER.map((d) => (
              <Text key={d} style={[styles.dayHeaderText, { color: colors.mutedForeground }]}>{d}</Text>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((day, i) => {
              if (!day) return <View key={`e-${i}`} style={styles.cell} />;
              const sel = isSelected(day);
              const tod = isToday(day);
              const past = isPast(day);
              return (
                <TouchableOpacity
                  key={day}
                  onPress={() => !past && handleDayPress(day)}
                  style={[
                    styles.cell,
                    sel && { backgroundColor: colors.primary, borderRadius: 10 },
                    tod && !sel && { borderRadius: 10, borderWidth: 1.5, borderColor: colors.primary },
                  ]}
                >
                  <Text style={[
                    styles.dayText,
                    { color: sel ? "#fff" : past ? colors.mutedForeground : colors.foreground },
                    sel && { fontFamily: "Inter_700Bold" },
                    past && { opacity: 0.35 },
                  ]}>{day}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity onPress={onClose} style={[styles.cancelBtn, { borderColor: colors.border }]}>
            <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 12 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#e2e8f0", alignSelf: "center", marginBottom: 4 },
  nav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  navBtn: { padding: 8 },
  monthTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  daysHeader: { flexDirection: "row" },
  dayHeaderText: { flex: 1, textAlign: "center", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: "center", justifyContent: "center" },
  dayText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  cancelBtn: { marginTop: 8, padding: 14, borderRadius: 14, borderWidth: 1, alignItems: "center" },
  cancelText: { fontSize: 15, fontFamily: "Inter_500Medium" },
});
