import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useGetSalesPersonStats } from "@workspace/api-client-react";
import {
  User, Phone, Mail, Calendar, TrendingUp, Target,
  Briefcase, ChevronDown, ChevronUp, MapPin, Building2, Users,
} from "lucide-react";

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

function ClientCard({ client }: { client: any }) {
  const [open, setOpen] = useState(false);
  const totalRevenue = (client.projects || []).reduce((s: number, p: any) => s + (p.amount || 0), 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Client header row */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-4 p-4 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg text-white flex-shrink-0"
          style={{ backgroundColor: BRAND_BLUE }}>
          {client.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate" style={{ color: BRAND_BLUE }}>{client.name}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
            {client.businessType && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Building2 className="w-3 h-3" />{client.businessType}
              </span>
            )}
            {client.city && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="w-3 h-3" />{client.city}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: SALES_COLOR + "15", color: SALES_COLOR }}>
              {client.projects?.length ?? 0} project{(client.projects?.length ?? 0) !== 1 ? "s" : ""}
            </span>
            {totalRevenue > 0 && (
              <span className="text-[11px] font-semibold" style={{ color: GOLD }}>
                {fmt(totalRevenue)}
              </span>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 mt-1 text-slate-400">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded details */}
      {open && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-4">
          {/* Contact info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {client.phone && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50">
                <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <div>
                  <p className="text-[9px] text-slate-400 uppercase tracking-wide">Phone</p>
                  <p className="text-xs font-medium text-slate-700">{client.phone}</p>
                </div>
              </div>
            )}
            {client.email && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50">
                <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <div>
                  <p className="text-[9px] text-slate-400 uppercase tracking-wide">Email</p>
                  <p className="text-xs font-medium text-slate-700 truncate">{client.email}</p>
                </div>
              </div>
            )}
            {client.gstNumber && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50">
                <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <div>
                  <p className="text-[9px] text-slate-400 uppercase tracking-wide">GST</p>
                  <p className="text-xs font-medium text-slate-700">{client.gstNumber}</p>
                </div>
              </div>
            )}
            {client.createdAt && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50">
                <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <div>
                  <p className="text-[9px] text-slate-400 uppercase tracking-wide">Client Since</p>
                  <p className="text-xs font-medium text-slate-700">
                    {new Date(client.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Projects list */}
          {(client.projects || []).length > 0 ? (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Briefcase className="w-3.5 h-3.5" style={{ color: BRAND_BLUE }} />
                <p className="text-xs font-semibold" style={{ color: BRAND_BLUE }}>Projects</p>
              </div>
              <div className="space-y-2">
                {client.projects.map((p: any) => {
                  const st = statusStyles[p.status] ?? statusStyles.pending;
                  return (
                    <div key={p.id} className="flex items-start justify-between gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: BRAND_BLUE }}>{p.projectName}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {p.serviceType && (
                            <span className="text-[10px] text-slate-500">{p.serviceType}</span>
                          )}
                          {p.deadline && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                              <Calendar className="w-2.5 h-2.5" />
                              {new Date(p.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>
                          {st.label}
                        </span>
                        {p.amount > 0 && (
                          <span className="text-[11px] font-bold" style={{ color: GOLD }}>{fmt(p.amount)}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-2">No projects yet</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function SalesProfile() {
  const { user } = useAuth();
  const salesId = (user as any)?.salesId ?? user?.id ?? "";
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
  const sp = data.salesperson;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold" style={{ color: BRAND_BLUE }}>My Profile</h1>

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-5 mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
            style={{ backgroundColor: SALES_COLOR }}>
            {sp.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: BRAND_BLUE }}>{sp.name}</h2>
            <p className="text-sm font-medium" style={{ color: SALES_COLOR }}>Sales Executive</p>
            <p className="text-xs text-slate-400 mt-0.5">@{sp.username}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
            <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400">Phone</p>
              <p className="text-sm font-medium text-slate-700">{sp.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
            <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400">Email</p>
              <p className="text-sm font-medium text-slate-700">{sp.email || "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
            <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400">Joined</p>
              <p className="text-sm font-medium text-slate-700">
                {new Date(sp.joinedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
            <Target className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400">Monthly Target</p>
              <p className="text-sm font-medium text-slate-700">{sp.target} clients</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance summary */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4" style={{ color: SALES_COLOR }} />
          <h3 className="font-semibold text-sm" style={{ color: BRAND_BLUE }}>Performance Summary</h3>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: BRAND_BLUE }}>{data.clientsClosed}</p>
            <p className="text-xs text-slate-500 mt-0.5">Clients</p>
          </div>
          <div className="text-center border-x border-slate-100">
            <p className="text-2xl font-bold" style={{ color: GOLD }}>{fmt(data.totalRevenue)}</p>
            <p className="text-xs text-slate-500 mt-0.5">Total Revenue</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: SALES_COLOR }}>{data.targetAchieved}%</p>
            <p className="text-xs text-slate-500 mt-0.5">Target</p>
          </div>
        </div>

        <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${data.targetAchieved}%`, backgroundColor: SALES_COLOR }} />
        </div>
      </div>

      {/* My Clients section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4" style={{ color: BRAND_BLUE }} />
          <h3 className="font-semibold text-sm" style={{ color: BRAND_BLUE }}>
            My Clients
          </h3>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: BRAND_BLUE + "12", color: BRAND_BLUE }}>
            {data.clients.length} closed
          </span>
        </div>

        {data.clients.length > 0 ? (
          <div className="space-y-3">
            {data.clients.map((client) => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-sm">
            <Users className="w-8 h-8 mx-auto mb-2" style={{ color: SALES_COLOR + "60" }} />
            <p className="text-sm font-semibold" style={{ color: BRAND_BLUE }}>No clients closed yet</p>
            <p className="text-xs text-slate-400 mt-1">Clients you close will appear here with full details</p>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400 text-center">Contact the admin to update your profile information.</p>
    </div>
  );
}
