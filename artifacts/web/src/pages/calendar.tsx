import { useState } from "react";
import { useGetCalendar, getGetCalendarQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  in_progress: "bg-blue-500/20 text-blue-400",
  completed: "bg-emerald-500/20 text-emerald-400",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function getMonthString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

interface DayProject { id: string; projectName: string; clientName: string; status: string; projectType: string }

export default function Calendar() {
  const [current, setCurrent] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<{ date: string; projects: DayProject[] } | null>(null);

  const month = getMonthString(current);
  const { data: calendarData, isLoading } = useGetCalendar({ month }, { query: { queryKey: getGetCalendarQueryKey({ month }) } });

  const year = current.getFullYear();
  const mon = current.getMonth();
  const firstDay = new Date(year, mon, 1).getDay();
  const daysInMonth = new Date(year, mon + 1, 0).getDate();
  const today = new Date();

  const prevMonth = () => setCurrent(new Date(year, mon - 1, 1));
  const nextMonth = () => setCurrent(new Date(year, mon + 1, 1));

  const cells = Array.from({ length: firstDay }, () => null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  );

  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Calendar</h2>
          <p className="text-zinc-400 text-sm mt-0.5">Projects by deadline date</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="border-zinc-700" onClick={prevMonth} data-testid="button-prev-month"><ChevronLeft className="w-4 h-4" /></Button>
          <span className="text-sm font-medium w-36 text-center">{MONTHS[mon]} {year}</span>
          <Button size="sm" variant="outline" className="border-zinc-700" onClick={nextMonth} data-testid="button-next-month"><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="grid grid-cols-7 border-b border-zinc-800">
          {DAYS.map(d => (
            <div key={d} className="py-3 text-center text-xs font-medium text-zinc-500 uppercase tracking-wider">{d}</div>
          ))}
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-zinc-500">Loading...</div>
        ) : (
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              if (!day) {
                return <div key={i} className="h-28 border-b border-r border-zinc-800/50 bg-zinc-950/30" />;
              }
              const dateStr = `${year}-${String(mon + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayData = calendarData?.[dateStr];
              const isToday = day === today.getDate() && mon === today.getMonth() && year === today.getFullYear();
              const hasProjects = dayData && dayData.count > 0;

              return (
                <div
                  key={i}
                  className={`h-28 border-b border-r border-zinc-800/50 p-2 cursor-pointer hover:bg-zinc-800/30 transition-colors ${isToday ? "bg-zinc-800/20" : ""}`}
                  onClick={() => hasProjects && setSelectedDay({ date: dateStr, projects: dayData!.projects })}
                  data-testid={`day-${dateStr}`}
                >
                  <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-1.5 ${isToday ? "bg-white text-black" : "text-zinc-400"}`}>
                    {day}
                  </div>
                  {hasProjects && (
                    <div className="space-y-0.5">
                      {dayData!.projects.slice(0, 2).map(p => (
                        <div key={p.id} className={`text-xs px-1.5 py-0.5 rounded truncate ${statusColors[p.status] || "bg-zinc-700/50 text-zinc-300"}`}>
                          {p.projectName}
                        </div>
                      ))}
                      {dayData!.count > 2 && (
                        <div className="text-xs text-zinc-500 px-1">+{dayData!.count - 2} more</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedDay && (
        <Dialog open onOpenChange={() => setSelectedDay(null)}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-zinc-400" />
                {new Date(selectedDay.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {selectedDay.projects.map(p => (
                <div key={p.id} className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
                  <p className="font-medium text-white text-sm">{p.projectName}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{p.clientName}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={`text-xs ${statusColors[p.status] || ""}`}>{p.status.replace("_", " ")}</Badge>
                    <span className="text-xs text-zinc-600">{p.projectType.replace("_", " ")}</span>
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
