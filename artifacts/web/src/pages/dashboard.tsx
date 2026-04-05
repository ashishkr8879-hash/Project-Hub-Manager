import { useGetDashboardStats, useListPendingVideos, useListProjects, getGetDashboardStatsQueryKey, getListPendingVideosQueryKey, getListProjectsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, Activity, Video, IndianRupee, UsersRound, Users, Wrench, Clock, CheckCircle2, AlertCircle, User } from "lucide-react";
import { Link } from "wouter";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const h = Math.floor(diff / 3600000);
  if (h > 24) return `${Math.floor(h / 24)}d ago`;
  if (h > 0) return `${h}h ago`;
  return `${Math.floor((diff % 3600000) / 60000)}m ago`;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400",
  in_progress: "bg-blue-500/10 text-blue-400",
  completed: "bg-emerald-500/10 text-emerald-400",
};

const statusIcons: Record<string, React.ComponentType<any>> = {
  pending: Clock,
  in_progress: AlertCircle,
  completed: CheckCircle2,
};

export default function Dashboard() {
  const { data: stats, isLoading } = useGetDashboardStats({ query: { queryKey: getGetDashboardStatsQueryKey() } });
  const { data: pendingVideos } = useListPendingVideos({ query: { queryKey: getListPendingVideosQueryKey() } });
  const { data: projects } = useListProjects({ query: { queryKey: getListProjectsQueryKey() } });

  const recentProjects = [...(projects || [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8);

  const statCards = [
    { title: "Total Projects", value: stats?.totalProjects, icon: Briefcase, color: "text-blue-400", bg: "bg-blue-400/10" },
    { title: "Active Projects", value: stats?.activeProjects, icon: Activity, color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { title: "Pending Reviews", value: stats?.pendingReviews, icon: Video, color: "text-amber-400", bg: "bg-amber-400/10" },
    { title: "Today's Revenue", value: stats ? formatCurrency(stats.todayRevenue) : "—", icon: IndianRupee, color: "text-violet-400", bg: "bg-violet-400/10" },
    { title: "Total Editors", value: stats?.totalEditors, icon: UsersRound, color: "text-pink-400", bg: "bg-pink-400/10" },
    { title: "Total Clients", value: stats?.totalClients, icon: Users, color: "text-cyan-400", bg: "bg-cyan-400/10" },
    { title: "Pending Projects", value: stats?.pendingProjects, icon: Clock, color: "text-yellow-400", bg: "bg-yellow-400/10" },
    { title: "Customisation", value: stats?.customisationProjects, icon: Wrench, color: "text-orange-400", bg: "bg-orange-400/10" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-1">Overview</h2>
        <p className="text-zinc-400">Key metrics and status across all operations.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="bg-zinc-900 border-zinc-800/60 overflow-hidden relative group">
              <div className={`absolute top-0 right-0 p-4 opacity-40 ${stat.color}`}>
                <Icon className="w-16 h-16 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500" />
              </div>
              <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-zinc-400">{stat.title}</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                {isLoading ? (
                  <Skeleton className="h-8 w-16 bg-zinc-800" />
                ) : (
                  <div className="text-3xl font-bold tracking-tight text-white" data-testid={`stat-${stat.title.toLowerCase().replace(/\s+/g, "-")}`}>
                    {stat.value ?? "—"}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-zinc-900 border-zinc-800/60">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Recent Projects</CardTitle>
            <Link href="/projects" className="text-xs text-blue-400 hover:text-blue-300">View all</Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentProjects.length === 0 ? (
              <p className="text-sm text-zinc-500 px-6 pb-4">No projects yet.</p>
            ) : (
              <div className="divide-y divide-zinc-800/50">
                {recentProjects.map(p => {
                  const SIcon = statusIcons[p.status];
                  return (
                    <div key={p.id} className="px-6 py-3 flex items-center justify-between hover:bg-zinc-800/30 transition-colors" data-testid={`dashboard-project-${p.id}`}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{p.projectName}</p>
                        <p className="text-xs text-zinc-500 truncate">{p.clientName} · {p.editorName}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                        <Badge className={`text-xs ${statusColors[p.status] || ""} flex items-center gap-1`}>
                          <SIcon className="w-3 h-3" />
                          {p.status.replace("_", " ")}
                        </Badge>
                        <span className="text-xs text-zinc-500 w-20 text-right">{timeAgo(p.createdAt)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800/60">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Pending Video Reviews</CardTitle>
            <Link href="/videos" className="text-xs text-blue-400 hover:text-blue-300">View all</Link>
          </CardHeader>
          <CardContent className="p-0">
            {!pendingVideos?.length ? (
              <div className="px-6 py-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
                <p className="text-sm text-zinc-500">All clear — no pending reviews.</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/50">
                {pendingVideos.slice(0, 6).map(v => (
                  <div key={v.id} className="px-6 py-3 flex items-center gap-3 hover:bg-zinc-800/30 transition-colors">
                    <div className="w-8 h-8 bg-violet-500/10 border border-violet-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Video className="w-4 h-4 text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{v.fileName}</p>
                      <p className="text-xs text-zinc-500 flex items-center gap-1"><User className="w-3 h-3" />{v.editorName}</p>
                    </div>
                    <span className="text-xs text-zinc-600 flex-shrink-0">{timeAgo(v.submittedAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
