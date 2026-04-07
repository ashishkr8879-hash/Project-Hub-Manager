import { useState, useMemo } from "react";
import { useGetCalendar, getGetCalendarQueryKey, useListProjects, useListEditors } from "@workspace/api-client-react";
import { ChevronLeft, ChevronRight, CalendarDays, Users, Briefcase, CheckCircle2, Clock } from "lucide-react";

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  pending:     { bg: "bg-yellow-500/15",  text: "text-yellow-400",  dot: "#eab308" },
  in_progress: { bg: "bg-blue-500/15",    text: "text-blue-400",    dot: "#3b82f6" },
  completed:   { bg: "bg-emerald-500/15", text: "text-emerald-400", dot: "#10b981" },
};

const SPEC_COLORS: Record<string, string> = {
  "Video Editor":          "#7c3aed",
  "Graphic Designer":      "#ec4899",
  "Social Media Manager":  "#0ea5e9",
  "Website Development":   "#10b981",
  "Ads Setup":             "#f97316",
};

const DAYS   = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function getMonthString(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

interface DayProject { id: string; projectName: string; clientName: string; status: string; projectType: string; editorId?: string; editorName?: string }

// ─── Standard Calendar View ───────────────────────────────────────────────────
function StandardCalendar({ calendarData, isLoading, year, mon }: {
  calendarData: any; isLoading: boolean; year: number; mon: number;
}) {
  const [selectedDay, setSelectedDay] = useState<{ date: string; projects: DayProject[] } | null>(null);
  const today = new Date();
  const firstDay = new Date(year, mon, 1).getDay();
  const daysInMonth = new Date(year, mon + 1, 0).getDate();
  const cells = Array.from({ length: firstDay }, () => null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="grid grid-cols-7 border-b border-zinc-800">
          {DAYS.map(d => (
            <div key={d} className="py-3 text-center text-xs font-medium text-zinc-500 uppercase tracking-wider">{d}</div>
          ))}
        </div>
        {isLoading ? (
          <div className="p-10 text-center text-zinc-500 text-sm">Loading...</div>
        ) : (
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              if (!day) return <div key={i} className="h-28 border-b border-r border-zinc-800/50 bg-zinc-950/30" />;
              const dateStr = `${year}-${String(mon + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayData = calendarData?.[dateStr];
              const isToday = day === today.getDate() && mon === today.getMonth() && year === today.getFullYear();
              const hasProjects = dayData && dayData.count > 0;
              return (
                <div
                  key={i}
                  className={`h-28 border-b border-r border-zinc-800/50 p-2 cursor-pointer hover:bg-zinc-800/30 transition-colors ${isToday ? "bg-zinc-800/20" : ""}`}
                  onClick={() => hasProjects && setSelectedDay({ date: dateStr, projects: dayData!.projects })}
                >
                  <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-1.5 ${isToday ? "bg-white text-black" : "text-zinc-400"}`}>
                    {day}
                  </div>
                  {hasProjects && (
                    <div className="space-y-0.5">
                      {dayData!.projects.slice(0, 2).map((p: DayProject) => {
                        const sc = STATUS_COLORS[p.status] || { bg: "bg-zinc-700/50", text: "text-zinc-300" };
                        return (
                          <div key={p.id} className={`text-xs px-1.5 py-0.5 rounded truncate ${sc.bg} ${sc.text}`}>
                            {p.projectName}
                          </div>
                        );
                      })}
                      {dayData!.count > 2 && <div className="text-xs text-zinc-500 px-1">+{dayData!.count - 2} more</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Day detail modal */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedDay(null)} />
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md z-10 shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800/60">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-zinc-400" />
                {new Date(selectedDay.date + "T12:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
              </h3>
              <button onClick={() => setSelectedDay(null)} className="text-zinc-500 hover:text-white text-lg leading-none">×</button>
            </div>
            <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
              {selectedDay.projects.map(p => {
                const sc = STATUS_COLORS[p.status] || { bg: "bg-zinc-700/50", text: "text-zinc-300", dot: "#6b7280" };
                return (
                  <div key={p.id} className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3">
                    <p className="font-semibold text-white text-sm">{p.projectName}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{p.clientName}</p>
                    {p.editorName && <p className="text-xs text-zinc-500 mt-0.5">Assigned to: {p.editorName}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>
                        {p.status.replace("_", " ")}
                      </span>
                      <span className="text-[10px] text-zinc-600">{p.projectType.replace("_", " ")}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Team Workload View ────────────────────────────────────────────────────────
function TeamWorkload({ year, mon }: { year: number; mon: number }) {
  const { data: projects = [] } = useListProjects();
  const { data: editors = [] } = useListEditors();
  const [selectedCell, setSelectedCell] = useState<{ editor: any; day: number; projects: any[] } | null>(null);

  const daysInMonth = new Date(year, mon + 1, 0).getDate();
  const today = new Date();

  // For each editor, compute how many projects are active on each day of the month.
  // "Active on day X" = project whose deadline falls in this month AND status != completed
  //                     OR status is completed and completedAt is in this month
  const workloadMap = useMemo(() => {
    const map: Record<string, Record<number, any[]>> = {};
    editors.forEach((e: any) => {
      map[e.id] = {};
      for (let d = 1; d <= daysInMonth; d++) map[e.id][d] = [];
    });

    projects.forEach((p: any) => {
      if (!p.deadline) return;
      const deadline = new Date(p.deadline);
      const deadlineMonth = deadline.getMonth();
      const deadlineYear = deadline.getFullYear();
      const deadlineDay = deadline.getDate();

      if (deadlineYear === year && deadlineMonth === mon) {
        if (map[p.editorId]) {
          map[p.editorId][deadlineDay]?.push(p);
        }
      }

      // Also show active projects that span this month (started before, deadline after)
      const created = new Date(p.createdAt);
      if (p.status !== "completed" && p.status !== undefined) {
        const monthStart = new Date(year, mon, 1);
        const monthEnd = new Date(year, mon + 1, 0);
        if (deadline >= monthStart && created <= monthEnd) {
          // project is active in this month — mark each day from max(1, created) to min(daysInMonth, deadline)
          const startDay = Math.max(1, created.getFullYear() === year && created.getMonth() === mon ? created.getDate() : 1);
          const endDay = Math.min(daysInMonth, deadlineYear === year && deadlineMonth === mon ? deadlineDay : daysInMonth);
          if (map[p.editorId]) {
            for (let d = startDay; d <= endDay; d++) {
              if (!map[p.editorId][d]) map[p.editorId][d] = [];
              if (!map[p.editorId][d].find((x: any) => x.id === p.id)) {
                map[p.editorId][d].push(p);
              }
            }
          }
        }
      }
    });
    return map;
  }, [projects, editors, year, mon, daysInMonth]);

  const maxLoad = useMemo(() => {
    let max = 0;
    Object.values(workloadMap).forEach(days => {
      Object.values(days).forEach(ps => { if (ps.length > max) max = ps.length; });
    });
    return Math.max(max, 1);
  }, [workloadMap]);

  function cellColor(count: number, specColor: string) {
    if (count === 0) return "transparent";
    const opacity = Math.min(0.9, 0.2 + (count / maxLoad) * 0.7);
    return specColor + Math.round(opacity * 255).toString(16).padStart(2, "0");
  }

  const dayNums = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {editors.map((e: any) => (
          <div key={e.id} className="flex items-center gap-1.5 text-xs text-zinc-400">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: SPEC_COLORS[e.specialization] ?? "#6b7280" }} />
            <span>{e.name}</span>
            <span className="text-zinc-600">({e.specialization})</span>
          </div>
        ))}
      </div>

      {/* Workload heat grid */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left text-xs font-bold text-zinc-500 uppercase tracking-wider px-4 py-3 w-36 min-w-[140px]">Team Member</th>
              {dayNums.map(d => {
                const isToday = d === today.getDate() && mon === today.getMonth() && year === today.getFullYear();
                const isSun = new Date(year, mon, d).getDay() === 0;
                const isSat = new Date(year, mon, d).getDay() === 6;
                return (
                  <th key={d} className={`text-center text-[10px] font-bold py-2 px-0 ${isToday ? "text-white" : isSun || isSat ? "text-zinc-600" : "text-zinc-500"}`} style={{ minWidth: "28px" }}>
                    <div className={`mx-auto w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-white text-black" : ""}`}>{d}</div>
                  </th>
                );
              })}
              <th className="text-center text-xs font-bold text-zinc-500 uppercase tracking-wider px-3 py-3 w-20">Total</th>
            </tr>
          </thead>
          <tbody>
            {editors.map((editor: any) => {
              const specColor = SPEC_COLORS[editor.specialization] ?? "#6b7280";
              const initials = editor.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
              const editorTotal = Object.values(workloadMap[editor.id] ?? {}).reduce((s, ps) => s + (ps as any[]).length, 0);
              const uniqueProjects = new Set(
                Object.values(workloadMap[editor.id] ?? {}).flat().map((p: any) => p.id)
              ).size;

              return (
                <tr key={editor.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                  {/* Editor name */}
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                        style={{ backgroundColor: specColor + "25", color: specColor }}>
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{editor.name}</p>
                        <p className="text-[9px] text-zinc-500 truncate">{editor.specialization}</p>
                      </div>
                    </div>
                  </td>

                  {/* Day cells */}
                  {dayNums.map(d => {
                    const ps = workloadMap[editor.id]?.[d] ?? [];
                    const count = ps.length;
                    return (
                      <td key={d} className="px-0 py-1 text-center">
                        <button
                          onClick={() => count > 0 && setSelectedCell({ editor, day: d, projects: ps })}
                          title={count > 0 ? `${count} project${count > 1 ? "s" : ""}` : ""}
                          className="mx-auto w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold transition-all hover:scale-110 disabled:cursor-default"
                          disabled={count === 0}
                          style={{
                            backgroundColor: count > 0 ? cellColor(count, specColor) : "rgba(255,255,255,0.03)",
                            color: count > 0 ? "#fff" : "transparent",
                          }}
                        >
                          {count > 0 ? count : ""}
                        </button>
                      </td>
                    );
                  })}

                  {/* Total */}
                  <td className="px-3 py-2.5 text-center">
                    <div className="text-xs font-bold" style={{ color: specColor }}>{uniqueProjects}</div>
                    <div className="text-[9px] text-zinc-600">projects</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {editors.length === 0 && (
          <div className="p-10 text-center text-zinc-500 text-sm">No team members found</div>
        )}
      </div>

      {/* Cell detail modal */}
      {selectedCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedCell(null)} />
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md z-10 shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800/60">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-zinc-400" />
                {selectedCell.editor.name} — {MONTHS[mon]} {selectedCell.day}
              </h3>
              <button onClick={() => setSelectedCell(null)} className="text-zinc-500 hover:text-white text-lg leading-none">×</button>
            </div>
            <div className="p-4 space-y-2 max-h-[55vh] overflow-y-auto">
              {selectedCell.projects.map((p: any) => {
                const sc = STATUS_COLORS[p.status] || { bg: "bg-zinc-700/50", text: "text-zinc-300" };
                const dl = new Date(p.deadline);
                const overdue = dl < new Date() && p.status !== "completed";
                return (
                  <div key={p.id} className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-white text-sm">{p.projectName}</p>
                      {overdue && <span className="text-[9px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-full flex-shrink-0">OVERDUE</span>}
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">{p.clientName}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>
                        {p.status.replace("_", " ")}
                      </span>
                      <span className="text-[10px] text-zinc-500 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        Deadline: {dl.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {editors.map((editor: any) => {
          const specColor = SPEC_COLORS[editor.specialization] ?? "#6b7280";
          const editorProjects = (projects as any[]).filter((p: any) => p.editorId === editor.id);
          const active = editorProjects.filter((p: any) => p.status !== "completed").length;
          const completed = editorProjects.filter((p: any) => p.status === "completed").length;
          const overdue = editorProjects.filter((p: any) => {
            return p.status !== "completed" && new Date(p.deadline) < new Date();
          }).length;

          return (
            <div key={editor.id} className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold"
                  style={{ backgroundColor: specColor + "25", color: specColor }}>
                  {editor.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{editor.name}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500 flex items-center gap-1"><Briefcase className="w-3 h-3" />Active</span>
                  <span className="font-bold" style={{ color: specColor }}>{active}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Done</span>
                  <span className="font-bold text-emerald-400">{completed}</span>
                </div>
                {overdue > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500 flex items-center gap-1"><Clock className="w-3 h-3" />Overdue</span>
                    <span className="font-bold text-red-400">{overdue}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Calendar Page ────────────────────────────────────────────────────────
export default function Calendar() {
  const [current, setCurrent] = useState(new Date());
  const [view, setView] = useState<"calendar" | "workload">("calendar");

  const month = getMonthString(current);
  const { data: calendarData, isLoading } = useGetCalendar({ month }, { query: { queryKey: getGetCalendarQueryKey({ month }) } });

  const year = current.getFullYear();
  const mon  = current.getMonth();

  const prevMonth = () => setCurrent(new Date(year, mon - 1, 1));
  const nextMonth = () => setCurrent(new Date(year, mon + 1, 1));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold" style={{ color: '#0d3f7a' }}>Calendar</h2>
          <p className="text-zinc-400 text-xs mt-0.5">
            {view === "calendar" ? "Projects by deadline date" : "Team workload heatmap"}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* View toggle */}
          <div className="flex bg-zinc-900 border border-zinc-800/60 rounded-xl p-1 gap-1">
            <button
              onClick={() => setView("calendar")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${view === "calendar" ? "bg-blue-600 text-white" : "text-zinc-400 hover:text-white"}`}
            >
              <CalendarDays className="w-3.5 h-3.5" />Calendar
            </button>
            <button
              onClick={() => setView("workload")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${view === "workload" ? "bg-blue-600 text-white" : "text-zinc-400 hover:text-white"}`}
            >
              <Users className="w-3.5 h-3.5" />Team Workload
            </button>
          </div>

          {/* Month nav */}
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800/60 text-zinc-400 hover:text-white transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-white w-36 text-center">{MONTHS[mon]} {year}</span>
            <button onClick={nextMonth} className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800/60 text-zinc-400 hover:text-white transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {view === "calendar"
        ? <StandardCalendar calendarData={calendarData} isLoading={isLoading} year={year} mon={mon} />
        : <TeamWorkload year={year} mon={mon} />
      }
    </div>
  );
}
