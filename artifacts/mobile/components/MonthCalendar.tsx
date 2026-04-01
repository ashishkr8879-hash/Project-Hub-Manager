import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import type { CalendarDay } from "@/hooks/useApi";

interface Props {
  calendarData: Record<string, CalendarDay>;
  accentColor: string;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export function MonthCalendar({ calendarData, accentColor }: Props) {
  const colors = useColors();
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  function dateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function prevMonth() {
    setViewDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
  }

  function nextMonth() {
    setViewDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
  }

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedDayData = selectedDate ? calendarData[selectedDate] : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.calHeader}>
        <TouchableOpacity onPress={prevMonth} style={[styles.navBtn, { backgroundColor: colors.muted }]}>
          <Feather name="chevron-left" size={16} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.calHeaderMid}>
          <Text style={[styles.monthLabel, { color: colors.foreground }]}>{MONTHS[month]} {year}</Text>
          <Text style={[styles.monthSub, { color: colors.mutedForeground }]}>Project Assignments</Text>
        </View>
        <TouchableOpacity onPress={nextMonth} style={[styles.navBtn, { backgroundColor: colors.muted }]}>
          <Feather name="chevron-right" size={16} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* Day headers */}
      <View style={styles.dayHeaders}>
        {DAYS.map((d) => (
          <Text key={d} style={[styles.dayHeader, { color: colors.mutedForeground }]}>{d}</Text>
        ))}
      </View>

      {/* Day grid */}
      <View style={styles.grid}>
        {cells.map((day, idx) => {
          if (!day) return <View key={`empty-${idx}`} style={styles.cell} />;
          const ds = dateStr(day);
          const dayData = calendarData[ds];
          const count = dayData?.count ?? 0;
          const isToday = ds === todayStr;
          const isSelected = ds === selectedDate;

          return (
            <TouchableOpacity
              key={ds}
              style={[
                styles.cell,
                isSelected && { backgroundColor: `${accentColor}20`, borderRadius: 10 },
              ]}
              onPress={() => setSelectedDate(isSelected ? null : ds)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.dayNumber,
                isToday && { backgroundColor: accentColor, borderRadius: 14 },
              ]}>
                <Text style={[
                  styles.dayText,
                  { color: isToday ? "#fff" : colors.foreground },
                  isSelected && !isToday && { color: accentColor, fontFamily: "Inter_700Bold" },
                ]}>
                  {day}
                </Text>
              </View>
              {count > 0 && (
                <View style={[styles.dot, { backgroundColor: accentColor }]}>
                  <Text style={styles.dotText}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected day projects */}
      {selectedDate && (
        <View style={[styles.dayDetail, { borderTopColor: colors.border }]}>
          <Text style={[styles.dayDetailDate, { color: colors.foreground }]}>
            {new Date(selectedDate + "T12:00:00").toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" })}
          </Text>
          {!selectedDayData || selectedDayData.count === 0 ? (
            <Text style={[styles.noProject, { color: colors.mutedForeground }]}>No projects assigned on this day</Text>
          ) : (
            selectedDayData.projects.map((p) => (
              <View key={p.id} style={[styles.dayProject, { backgroundColor: `${accentColor}10`, borderColor: `${accentColor}25` }]}>
                <View style={[styles.dayProjectDot, { backgroundColor: accentColor }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.dayProjectName, { color: colors.foreground }]} numberOfLines={1}>{p.projectName}</Text>
                  <Text style={[styles.dayProjectClient, { color: colors.mutedForeground }]} numberOfLines={1}>{p.clientName}</Text>
                </View>
                <Text style={[styles.dayProjectStatus, { color: accentColor }]}>
                  {p.status === "in_progress" ? "Active" : p.status === "completed" ? "Done" : "Pending"}
                </Text>
              </View>
            ))
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  calHeader: { flexDirection: "row", alignItems: "center", padding: 14, gap: 8 },
  calHeaderMid: { flex: 1, alignItems: "center" },
  navBtn: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  monthLabel: { fontSize: 15, fontFamily: "Inter_700Bold" },
  monthSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  dayHeaders: { flexDirection: "row", paddingHorizontal: 4 },
  dayHeader: { flex: 1, textAlign: "center", fontSize: 10, fontFamily: "Inter_600SemiBold", paddingBottom: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 4, paddingBottom: 8 },
  cell: { width: `${100 / 7}%` as `${number}%`, alignItems: "center", paddingVertical: 4, gap: 2 },
  dayNumber: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  dayText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  dot: { width: 16, height: 10, borderRadius: 5, alignItems: "center", justifyContent: "center" },
  dotText: { fontSize: 8, fontFamily: "Inter_700Bold", color: "#fff" },
  dayDetail: { borderTopWidth: 1, padding: 14, gap: 8 },
  dayDetailDate: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  noProject: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", paddingVertical: 4 },
  dayProject: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10, borderWidth: 1 },
  dayProjectDot: { width: 8, height: 8, borderRadius: 4 },
  dayProjectName: { fontSize: 13, fontFamily: "Inter_500Medium" },
  dayProjectClient: { fontSize: 11, fontFamily: "Inter_400Regular" },
  dayProjectStatus: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
});
