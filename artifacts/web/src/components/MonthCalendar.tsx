import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarDay {
  count: number;
  projects: { id: string; projectName: string; clientName: string; status: string; projectType: string }[];
}

interface Props {
  calendarData: Record<string, CalendarDay>;
  accentColor?: string;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export function MonthCalendar({ calendarData, accentColor = "#3b82f6" }: Props) {
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

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedDayData = selectedDate ? calendarData[selectedDate] : null;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center px-4 py-3 gap-3">
        <button
          onClick={() => { setViewDate(new Date(year, month - 1, 1)); setSelectedDate(null); }}
          className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-zinc-300" />
        </button>
        <div className="flex-1 text-center">
          <div className="text-sm font-bold text-white">{MONTHS[month]} {year}</div>
          <div className="text-xs text-zinc-500">Project Assignments</div>
        </div>
        <button
          onClick={() => { setViewDate(new Date(year, month + 1, 1)); setSelectedDate(null); }}
          className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-zinc-300" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 px-2">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-zinc-500 pb-1">{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 px-2 pb-2">
        {cells.map((day, idx) => {
          if (!day) return <div key={`e-${idx}`} className="aspect-square" />;
          const ds = dateStr(day);
          const dayData = calendarData[ds];
          const count = dayData?.count ?? 0;
          const isToday = ds === todayStr;
          const isSelected = ds === selectedDate;

          return (
            <button
              key={ds}
              onClick={() => setSelectedDate(isSelected ? null : ds)}
              className={`flex flex-col items-center py-1 gap-0.5 rounded-xl transition-colors ${isSelected ? "bg-opacity-20" : "hover:bg-zinc-800/50"}`}
              style={isSelected ? { backgroundColor: `${accentColor}18` } : {}}
            >
              <div
                className="w-7 h-7 flex items-center justify-center rounded-full text-xs font-medium transition-colors"
                style={isToday ? { backgroundColor: accentColor, color: "#fff" } : {
                  color: isSelected ? accentColor : "#475569",
                  fontWeight: isSelected ? "700" : "400",
                }}
              >
                {day}
              </div>
              {count > 0 && (
                <div
                  className="w-4 h-2.5 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  {count}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day detail */}
      {selectedDate && (
        <div className="border-t border-zinc-800 p-4 space-y-2">
          <div className="text-sm font-semibold text-white">
            {new Date(selectedDate + "T12:00:00").toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" })}
          </div>
          {!selectedDayData || selectedDayData.count === 0 ? (
            <div className="text-xs text-zinc-500 text-center py-2">No projects assigned on this day</div>
          ) : (
            <div className="space-y-1.5">
              {selectedDayData.projects.map((p) => (
                <div key={p.id} className="flex items-center gap-2 p-2.5 rounded-xl border" style={{ backgroundColor: `${accentColor}10`, borderColor: `${accentColor}25` }}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: accentColor }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white truncate">{p.projectName}</div>
                    <div className="text-[11px] text-zinc-500 truncate">{p.clientName}</div>
                  </div>
                  <div className="text-[11px] font-semibold flex-shrink-0" style={{ color: accentColor }}>
                    {p.status === "in_progress" ? "Active" : p.status === "completed" ? "Done" : "Pending"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
