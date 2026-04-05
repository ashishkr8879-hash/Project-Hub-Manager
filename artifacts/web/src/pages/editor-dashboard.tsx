import { useAuth } from "@/hooks/use-auth";
import { useGetEditorProfile, useListNotifications } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Briefcase, CheckCircle2, Activity, Edit2, Bell, Clock, ChevronRight, Video } from "lucide-react";

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  pending:     { label: "Pending",     className: "bg-zinc-700/50 text-zinc-300" },
  in_progress: { label: "In Progress", className: "bg-blue-500/15 text-blue-400" },
  completed:   { label: "Completed",   className: "bg-emerald-500/15 text-emerald-400" },
};

const NOTIF_COLORS: Record<string, string> = {
  video_approved:    "#10b981",
  video_rejected:    "#ef4444",
  revision_requested:"#f59e0b",
  message_received:  "#3b82f6",
  video_submitted:   "#8b5cf6",
};

function daysLeft(deadline: string) {
  const d = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  if (d < 0) return { text: `${Math.abs(d)}d overdue`, color: "#ef4444" };
  if (d === 0) return { text: "Due today", color: "#f59e0b" };
  return { text: `${d}d left`, color: d <= 3 ? "#f59e0b" : "#6b7280" };
}

export default function EditorDashboard() {
  const { user } = useAuth();
  const editorId = (user as any)?.editorId ?? user?.id ?? "";
  const spec = (user as any)?.specialization ?? "Team Member";

  const { data: profile, isLoading } = useGetEditorProfile(editorId, { query: { refetchInterval: 30000 } });
  const { data: notifications = [] } = useListNotifications(editorId, { query: { refetchInterval: 12000 } });

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const stats = profile?.stats;
  const activeProjects = (profile?.allProjects ?? []).filter((p: any) => p.status === "in_progress" || p.status === "pending");
  const recentNotifs = [...notifications].slice(0, 4);
  const unread = notifications.filter((n) => !n.read).length;

  const statCards = [
    { label: "Total Projects", value: stats?.totalProjects ?? 0, icon: Briefcase, color: "#3b82f6" },
    { label: "Active", value: stats?.inProgressProjects ?? 0, icon: Activity, color: "#10b981" },
    { label: "Completed", value: stats?.completedProjects ?? 0, icon: CheckCircle2, color: "#8b5cf6" },
    { label: "Customisation", value: stats?.customisationProjects ?? 0, icon: Edit2, color: "#f59e0b" },
    { label: "Videos Uploaded", value: stats?.totalVideosUploaded ?? 0, icon: Video, color: "#ec4899" },
    { label: "Approved", value: stats?.approvedVideos ?? 0, icon: CheckCircle2, color: "#10b981" },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Welcome */}
      <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-white">Namaste, {profile?.name ?? user?.name} 👋</h1>
        <p className="text-sm text-zinc-400 mt-1">{spec}{profile?.location ? ` · ${profile.location}` : ""}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-3 text-center">
              <Icon className="w-4 h-4 mx-auto mb-1.5" style={{ color: s.color }} />
              <div className="text-lg font-bold text-white">{s.value}</div>
              <div className="text-[10px] text-zinc-500 leading-tight">{s.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Active Projects */}
        <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2"><Activity className="w-4 h-4 text-blue-400" />Active Projects</h2>
            <Link href="/editor/projects" className="text-xs text-zinc-500 hover:text-white flex items-center gap-1">View all <ChevronRight className="w-3 h-3" /></Link>
          </div>
          <div className="space-y-2">
            {activeProjects.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-sm">No active projects</div>
            ) : activeProjects.slice(0, 4).map((p: any) => {
              const dl = daysLeft(p.deadline);
              const st = STATUS_STYLES[p.status] ?? STATUS_STYLES.pending;
              return (
                <Link key={p.id} href="/editor/projects" className="flex items-center gap-3 p-3 bg-zinc-800/40 rounded-xl hover:bg-zinc-800/70 transition-colors cursor-pointer">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{p.projectName}</p>
                    <p className="text-xs text-zinc-500 truncate">{p.clientName}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.className}`}>{st.label}</span>
                    <span className="text-[10px] flex items-center gap-0.5" style={{ color: dl.color }}>
                      <Clock className="w-2.5 h-2.5" />{dl.text}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-violet-400" />Notifications
              {unread > 0 && <span className="bg-violet-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">{unread}</span>}
            </h2>
            <Link href="/editor/notifications" className="text-xs text-zinc-500 hover:text-white flex items-center gap-1">View all <ChevronRight className="w-3 h-3" /></Link>
          </div>
          <div className="space-y-2">
            {recentNotifs.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-sm">No notifications</div>
            ) : recentNotifs.map((n) => {
              const color = NOTIF_COLORS[n.type] ?? "#6b7280";
              return (
                <div key={n.id} className={`flex gap-3 p-3 rounded-xl ${!n.read ? "bg-zinc-800/60" : "bg-zinc-800/20"}`}>
                  <div className="w-1 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white">{n.title}</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug truncate">{n.message}</p>
                  </div>
                  {!n.read && <div className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: color }} />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
