import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

const BRAND_BLUE  = "#0d3f7a";
const SALES_COLOR = "#059669";
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["Su","Mo","Tu","We","Th","Fr","Sa"];

export function SalesPerformanceCalendar({ clients }: { clients: any[] }) {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const eventMap = useMemo(() => {
    const map: Record<number, { clients: number; projects: number; completed: number }> = {};
    clients.forEach((c) => {
      const d = new Date(c.createdAt);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map[day]) map[day] = { clients: 0, projects: 0, completed: 0 };
        map[day].clients++;
      }
      (c.projects || []).forEach((p: any) => {
        const pd = new Date(p.createdAt);
        if (pd.getFullYear() === year && pd.getMonth() === month) {
          const day = pd.getDate();
          if (!map[day]) map[day] = { clients: 0, projects: 0, completed: 0 };
          map[day].projects++;
        }
        if (p.status === "completed") {
          const dd = new Date(p.deadline || p.createdAt);
          if (dd.getFullYear() === year && dd.getMonth() === month) {
            const day = dd.getDate();
            if (!map[day]) map[day] = { clients: 0, projects: 0, completed: 0 };
            map[day].completed++;
          }
        }
      });
    });
    return map;
  }, [clients, year, month]);

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayDate   = now.getDate();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month;

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const totalClients  = Object.values(eventMap).reduce((s, e) => s + e.clients, 0);
  const totalProjects = Object.values(eventMap).reduce((s, e) => s + e.projects, 0);
  const totalDone     = Object.values(eventMap).reduce((s, e) => s + e.completed, 0);
  const activeDays    = Object.keys(eventMap).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: SALES_COLOR + "15" }}>
            <Calendar className="w-4 h-4" style={{ color: SALES_COLOR }} />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: BRAND_BLUE }}>Performance Calendar</p>
            <p className="text-[10px] text-slate-400">{activeDays} active days this month</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth}
            className="w-7 h-7 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors border border-slate-200">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-semibold w-32 text-center" style={{ color: BRAND_BLUE }}>
            {MONTHS[month]} {year}
          </span>
          <button onClick={nextMonth}
            className="w-7 h-7 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors border border-slate-200">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Monthly summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
          <p className="text-xl font-bold text-emerald-600">{totalClients}</p>
          <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Clients Added</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
          <p className="text-xl font-bold text-blue-600">{totalProjects}</p>
          <p className="text-[10px] text-blue-600 font-medium mt-0.5">Projects Started</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-3 text-center border border-purple-100">
          <p className="text-xl font-bold text-purple-600">{totalDone}</p>
          <p className="text-[10px] text-purple-600 font-medium mt-0.5">Completed</p>
        </div>
      </div>

      {/* Calendar grid */}
      <div>
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-[10px] font-bold text-slate-400 py-1">{d}</div>
          ))}
        </div>
        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={`e${i}`} className="aspect-square" />;
            const ev      = eventMap[day];
            const isToday = isCurrentMonth && day === todayDate;
            return (
              <div
                key={day}
                title={ev ? `${ev.clients} client(s) · ${ev.projects} project(s) started · ${ev.completed} completed` : ""}
                className={`aspect-square flex flex-col items-center justify-center rounded-xl transition-all duration-150 relative ${
                  isToday ? "ring-2 ring-offset-1" : ""
                } ${ev ? "bg-slate-50 shadow-sm" : "hover:bg-slate-50"}`}
                style={isToday ? { ringColor: SALES_COLOR } : {}}
              >
                <span className={`text-[11px] font-medium leading-none ${ev ? "mb-0.5" : ""}`}
                  style={isToday ? { color: SALES_COLOR, fontWeight: 700 } : { color: ev ? "#1e293b" : "#94a3b8" }}>
                  {day}
                </span>
                {ev && (
                  <div className="flex gap-0.5">
                    {ev.clients   > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                    {ev.projects  > 0 && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                    {ev.completed > 0 && <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />}
                  </div>
                )}
                {isToday && !ev && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{ backgroundColor: SALES_COLOR }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100">
        <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />Client added
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0" />Project started
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 flex-shrink-0" />Project completed
        </span>
      </div>
    </div>
  );
}
