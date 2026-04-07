import { Link } from "wouter";
import { useGetDashboardStats, useListProjects, useGetCalendar, useListEditors } from "@workspace/api-client-react";
import { MonthCalendar } from "@/components/MonthCalendar";
import { ChevronRight, Film, Edit2, Folder, Users, Activity, TrendingUp, Clock, CheckCircle2 } from "lucide-react";

const BRAND_BLUE = "#0d3f7a";
const GOLD       = "#e8ab15";

function fmt(n: number) { return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 }); }
function getGreeting() { const h = new Date().getHours(); if (h < 12) return "Good morning"; if (h < 17) return "Good afternoon"; return "Good evening"; }
function timeAgo(d: string) { const diff = Date.now() - new Date(d).getTime(); const m = Math.floor(diff / 60000); if (m < 1) return "just now"; if (m < 60) return `${m}m ago`; const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`; return `${Math.floor(h / 24)}d ago`; }

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  pending:     { bg: "bg-amber-50",   text: "text-amber-600",   dot: "bg-amber-500"  },
  in_progress: { bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500"   },
  completed:   { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-500" },
};

export default function Dashboard() {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const { data: stats, isLoading: statsLoading } = useGetDashboardStats({ query: { refetchInterval: 30000 } });
  const { data: projects = [], isLoading: projLoading } = useListProjects({ query: { refetchInterval: 30000 } });
  const { data: calendarData = {} } = useGetCalendar(currentMonth);
  const { data: editors = [] } = useListEditors();

  const isLoading = statsLoading || projLoading;
  const recentProjects = [...projects].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6);

  const statCards = [
    { label: "Total Projects",   value: stats?.totalProjects ?? 0,          icon: Folder,      color: BRAND_BLUE, bg: `${BRAND_BLUE}15` },
    { label: "Active Projects",  value: stats?.activeProjects ?? 0,          icon: Activity,    color: "#10b981",  bg: "rgba(16,185,129,0.12)" },
    { label: "Today's Revenue",  value: fmt(stats?.todayRevenue ?? 0),       icon: TrendingUp,  color: GOLD,       bg: `${GOLD}20` },
    { label: "Pending Reviews",  value: stats?.pendingReviews ?? 0,          icon: Film,        color: "#ef4444",  bg: "rgba(239,68,68,0.1)" },
    { label: "Customisation",    value: stats?.customisationProjects ?? 0,   icon: Edit2,       color: "#f97316",  bg: "rgba(249,115,22,0.1)" },
    { label: "Pending Projects", value: stats?.pendingProjects ?? 0,         icon: Clock,       color: "#f59e0b",  bg: "rgba(245,158,11,0.1)" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">{getGreeting()}</p>
          <h1 className="text-2xl font-bold mt-0.5" style={{ color: BRAND_BLUE }}>Admin Dashboard</h1>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />Live
        </div>
      </div>

      {/* Alert banners */}
      {(stats?.pendingReviews ?? 0) > 0 && (
        <Link href="/videos">
          <div className="flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors"
            style={{ borderColor: `${BRAND_BLUE}30`, backgroundColor: `${BRAND_BLUE}08` }}>
            <Film className="w-4 h-4 flex-shrink-0" style={{ color: BRAND_BLUE }} />
            <span className="text-sm font-semibold flex-1" style={{ color: BRAND_BLUE }}>
              {stats?.pendingReviews} video{(stats?.pendingReviews ?? 0) > 1 ? "s" : ""} waiting for your review
            </span>
            <ChevronRight className="w-4 h-4" style={{ color: BRAND_BLUE }} />
          </div>
        </Link>
      )}
      {(stats?.customisationProjects ?? 0) > 0 && (
        <Link href="/projects">
          <div className="flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors"
            style={{ borderColor: `${GOLD}40`, backgroundColor: `${GOLD}10` }}>
            <Edit2 className="w-4 h-4 flex-shrink-0" style={{ color: "#b8860b" }} />
            <span className="text-sm font-semibold flex-1" style={{ color: "#7a5c00" }}>
              {stats?.customisationProjects} project{(stats?.customisationProjects ?? 0) > 1 ? "s" : ""} need customisation
            </span>
            <ChevronRight className="w-4 h-4" style={{ color: "#b8860b" }} />
          </div>
        </Link>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-2 shadow-sm">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.bg }}>
                <Icon className="w-4.5 h-4.5" style={{ color: s.color }} />
              </div>
              <div className="text-2xl font-bold" style={{ color: BRAND_BLUE }}>{isLoading ? "—" : s.value}</div>
              <div className="text-xs text-slate-500 leading-tight">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Team + Completed row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${BRAND_BLUE}15` }}>
            <Users className="w-5 h-5" style={{ color: BRAND_BLUE }} />
          </div>
          <div className="flex-1">
            <div className="text-2xl font-bold" style={{ color: BRAND_BLUE }}>{editors.length}</div>
            <div className="text-xs text-slate-500">Total Team Members</div>
          </div>
          <div className="flex -space-x-2">
            {editors.slice(0, 5).map((e, idx) => {
              const initials = e.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
              const hue = (e.id.charCodeAt(1) * 47) % 360;
              return (
                <div key={e.id} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                  style={{ backgroundColor: `hsl(${hue},60%,45%)`, zIndex: 5 - idx, color: 'white' }}>
                  {initials}
                </div>
              );
            })}
            {editors.length > 5 && (
              <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                style={{ backgroundColor: `${BRAND_BLUE}20`, color: BRAND_BLUE }}>
                +{editors.length - 5}
              </div>
            )}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <div className="text-2xl font-bold" style={{ color: BRAND_BLUE }}>{stats?.completedProjects ?? 0}</div>
            <div className="text-xs text-slate-500">Completed Projects</div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-xl font-bold" style={{ color: GOLD }}>{stats?.totalClients ?? 0}</div>
            <div className="text-xs text-slate-500">Total Clients</div>
          </div>
        </div>
      </div>

      {/* Calendar + Recent Projects */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h2 className="text-base font-semibold" style={{ color: BRAND_BLUE }}>Project Calendar</h2>
          <MonthCalendar calendarData={calendarData as any} accentColor={BRAND_BLUE} />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold" style={{ color: BRAND_BLUE }}>Recent Projects</h2>
            <Link href="/projects" className="text-xs flex items-center gap-1 hover:underline" style={{ color: BRAND_BLUE }}>
              See all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            {recentProjects.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-slate-400">
                <Folder className="w-8 h-8 opacity-40" />
                <p className="text-sm">No projects yet</p>
                <Link href="/create" className="text-xs hover:underline" style={{ color: BRAND_BLUE }}>+ Create Project</Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentProjects.map((p) => {
                  const sc = STATUS_COLORS[p.status] || STATUS_COLORS.pending;
                  const progress = p.totalDeliverables > 0 ? p.completedDeliverables / p.totalDeliverables : 0;
                  return (
                    <div key={p.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{p.projectName}</p>
                          <p className="text-xs text-slate-400 truncate">{p.clientName} · {p.editorName}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                            {p.status.replace("_", " ")}
                          </span>
                          <span className="text-[10px] text-slate-400">{timeAgo(p.createdAt)}</span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${Math.round(progress * 100)}%`, backgroundColor: p.status === "completed" ? "#10b981" : BRAND_BLUE }} />
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-slate-400">{p.completedDeliverables}/{p.totalDeliverables} deliverables</span>
                        <span className="text-[10px] font-semibold" style={{ color: GOLD }}>{fmt(p.totalValue)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
