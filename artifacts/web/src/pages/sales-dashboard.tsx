import { useAuth } from "@/hooks/use-auth";
import { useGetSalesPersonStats } from "@workspace/api-client-react";
import { TrendingUp, Users, Briefcase, CheckCircle, Clock, IndianRupee, Target } from "lucide-react";
import { SalesPerformanceCalendar } from "@/components/sales-performance-calendar";

const BRAND_BLUE  = "#0d3f7a";
const SALES_COLOR = "#059669";
const GOLD        = "#e8ab15";

function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
}

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  pending:     { bg: "bg-amber-50",   text: "text-amber-600",  label: "Pending"     },
  in_progress: { bg: "bg-blue-50",    text: "text-blue-700",   label: "In Progress" },
  completed:   { bg: "bg-emerald-50", text: "text-emerald-600",label: "Completed"   },
};

export default function SalesDashboard() {
  const { user } = useAuth();
  const salesId   = (user as any)?.salesId ?? user?.id ?? "";
  const { data, isLoading } = useGetSalesPersonStats(salesId);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: SALES_COLOR, borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!data) return null;

  const stats = [
    { label: "My Clients",       value: data.clientsClosed,      icon: Users,       color: BRAND_BLUE },
    { label: "Total Revenue",    value: fmt(data.totalRevenue),  icon: IndianRupee, color: GOLD       },
    { label: "Active Projects",  value: data.activeProjects,     icon: Clock,       color: "#2563eb"  },
    { label: "Completed",        value: data.completedProjects,  icon: CheckCircle, color: SALES_COLOR},
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: BRAND_BLUE }}>
          Welcome, {user?.name}!
        </h1>
        <p className="text-slate-500 text-sm mt-1">Your sales performance overview</p>
      </div>

      {/* Target progress */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: SALES_COLOR + "15" }}>
            <Target className="w-5 h-5" style={{ color: SALES_COLOR }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: BRAND_BLUE }}>Monthly Target</p>
            <p className="text-xs text-slate-500">{data.clientsClosed} / {data.salesperson.target} clients</p>
          </div>
          <div className="ml-auto text-2xl font-bold" style={{ color: SALES_COLOR }}>
            {data.targetAchieved}%
          </div>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${data.targetAchieved}%`, backgroundColor: SALES_COLOR }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-2">
          {data.targetAchieved >= 100
            ? "Target achieved! Great work!"
            : `${data.salesperson.target - data.clientsClosed} more clients to reach your target`}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                style={{ backgroundColor: s.color + "15" }}>
                <Icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Revenue breakdown */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs text-slate-500 mb-1">Active Revenue</p>
          <p className="text-2xl font-bold" style={{ color: "#2563eb" }}>{fmt(data.activeRevenue)}</p>
          <p className="text-xs text-slate-400 mt-1">from {data.activeProjects} active projects</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs text-slate-500 mb-1">Closed Revenue</p>
          <p className="text-2xl font-bold" style={{ color: SALES_COLOR }}>{fmt(data.closedRevenue)}</p>
          <p className="text-xs text-slate-400 mt-1">from {data.completedProjects} completed projects</p>
        </div>
      </div>

      {/* My Clients */}
      {data.clients.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" style={{ color: SALES_COLOR }} />
            <h2 className="font-semibold text-sm" style={{ color: BRAND_BLUE }}>My Clients</h2>
            <span className="ml-auto text-xs text-slate-400">{data.clients.length} total</span>
          </div>
          <div className="divide-y divide-slate-100">
            {data.clients.map((client) => (
              <div key={client.id} className="px-5 py-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: BRAND_BLUE }}>{client.name}</p>
                    <p className="text-xs text-slate-500">{client.businessType} · {client.city}</p>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">{client.projects.length} project{client.projects.length !== 1 ? "s" : ""}</span>
                </div>
                {client.projects.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {client.projects.map((p) => {
                      const st = statusStyles[p.status] ?? statusStyles.pending;
                      return (
                        <div key={p.id} className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>
                            {p.projectName}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${st.bg} ${st.text}`}>
                            {st.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.clients.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center shadow-sm">
          <Users className="w-10 h-10 mx-auto mb-3" style={{ color: SALES_COLOR + "60" }} />
          <p className="text-sm font-semibold" style={{ color: BRAND_BLUE }}>No clients assigned yet</p>
          <p className="text-xs text-slate-400 mt-1">Clients assigned to you by the admin will appear here</p>
        </div>
      )}

      {/* Performance Calendar */}
      <SalesPerformanceCalendar clients={data.clients} />
    </div>
  );
}
