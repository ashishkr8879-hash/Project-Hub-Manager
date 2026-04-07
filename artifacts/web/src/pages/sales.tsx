import { useState } from "react";
import { useListSalesTeam, useGetSalesPersonStats, useCreateSalesPerson, useDeleteSalesPerson } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  TrendingUp, Plus, Trash2, Users, IndianRupee, Target, CheckCircle,
  Phone, Mail, ChevronDown, ChevronUp, X, Eye,
} from "lucide-react";

const BRAND_BLUE  = "#0d3f7a";
const SALES_COLOR = "#059669";
const GOLD        = "#e8ab15";

function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
}

function SalesPersonCard({ person, onDelete }: { person: any; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const { data: stats } = useGetSalesPersonStats(person.id, { query: { enabled: expanded } });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
            style={{ backgroundColor: SALES_COLOR }}>
            {person.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm" style={{ color: BRAND_BLUE }}>{person.name}</h3>
            <p className="text-xs text-slate-400">@{person.username}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Phone className="w-3 h-3" />{person.phone}
              </span>
              {person.email && (
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <Mail className="w-3 h-3" />{person.email}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={() => onDelete(person.id)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="text-center">
            <p className="text-lg font-bold" style={{ color: BRAND_BLUE }}>—</p>
            <p className="text-[10px] text-slate-400">Clients</p>
          </div>
          <div className="text-center border-x border-slate-100">
            <p className="text-sm font-bold" style={{ color: GOLD }}>
              {fmt(person.monthlySalary)}<span className="text-[9px] text-slate-400">/mo</span>
            </p>
            <p className="text-[10px] text-slate-400">Salary</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold" style={{ color: SALES_COLOR }}>{person.target}</p>
            <p className="text-[10px] text-slate-400">Target</p>
          </div>
        </div>
      </div>

      {/* Expanded stats */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50 p-5">
          {!stats ? (
            <div className="flex items-center justify-center py-4">
              <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: SALES_COLOR, borderTopColor: "transparent" }} />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
                  <p className="text-xl font-bold" style={{ color: BRAND_BLUE }}>{stats.clientsClosed}</p>
                  <p className="text-[10px] text-slate-500">Clients Closed</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
                  <p className="text-lg font-bold" style={{ color: GOLD }}>{fmt(stats.totalRevenue)}</p>
                  <p className="text-[10px] text-slate-500">Total Revenue</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
                  <p className="text-xl font-bold" style={{ color: "#2563eb" }}>{stats.activeProjects}</p>
                  <p className="text-[10px] text-slate-500">Active Projects</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
                  <p className="text-xl font-bold" style={{ color: SALES_COLOR }}>{stats.completedProjects}</p>
                  <p className="text-[10px] text-slate-500">Completed</p>
                </div>
              </div>

              {/* Target progress */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">Target Progress</span>
                  <span className="font-semibold" style={{ color: SALES_COLOR }}>{stats.targetAchieved}%</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${stats.targetAchieved}%`, backgroundColor: SALES_COLOR }} />
                </div>
              </div>

              {/* Client list */}
              {stats.clients.length > 0 && (
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: BRAND_BLUE }}>
                    Assigned Clients ({stats.clients.length})
                  </p>
                  <div className="space-y-1.5">
                    {stats.clients.map((c: any) => (
                      <div key={c.id} className="flex items-center gap-2 bg-white border border-slate-100 rounded-lg px-3 py-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                          style={{ backgroundColor: BRAND_BLUE }}>
                          {c.name.charAt(0)}
                        </div>
                        <span className="text-xs font-medium text-slate-700 flex-1">{c.name}</span>
                        <span className="text-[10px] text-slate-400">{c.businessType}</span>
                        <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full">
                          {c.projects.length} proj
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AddSalesPersonModal({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { mutate: create, isPending } = useCreateSalesPerson({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["/api/sales-team"] });
        toast({ title: "Sales person added!", description: "They can now log in with their credentials." });
        onClose();
      },
      onError: (e: any) => toast({ title: "Error", description: e?.message ?? "Failed to add", variant: "destructive" }),
    },
  });

  const [form, setForm] = useState({ name: "", username: "", password: "", email: "", phone: "", monthlySalary: "", target: "5" });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.username || !form.password || !form.phone) {
      toast({ title: "Required fields missing", variant: "destructive" }); return;
    }
    create({ data: {
      name: form.name, username: form.username, password: form.password,
      email: form.email, phone: form.phone,
      monthlySalary: form.monthlySalary ? Number(form.monthlySalary) : undefined,
      target: Number(form.target) || 5,
    }});
  };

  const inputCls = "w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 placeholder-slate-400";
  const focusRing = `focus:ring-[${SALES_COLOR}40]`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-bold text-sm" style={{ color: BRAND_BLUE }}>Add Sales Team Member</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Full Name *</label>
              <input className={inputCls} placeholder="Rahul Sharma" value={form.name} onChange={set("name")} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Username *</label>
              <input className={inputCls} placeholder="rahul" value={form.username} onChange={set("username")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Password *</label>
              <input type="password" className={inputCls} placeholder="••••••••" value={form.password} onChange={set("password")} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Phone *</label>
              <input className={inputCls} placeholder="+91 98200 11111" value={form.phone} onChange={set("phone")} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Email</label>
            <input type="email" className={inputCls} placeholder="rahul@company.com" value={form.email} onChange={set("email")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Monthly Salary (₹)</label>
              <input type="number" className={inputCls} placeholder="20000" value={form.monthlySalary} onChange={set("monthlySalary")} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Monthly Target (clients)</label>
              <input type="number" className={inputCls} placeholder="5" value={form.target} onChange={set("target")} />
            </div>
          </div>
          <div className="pt-2 flex gap-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isPending}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors disabled:opacity-60"
              style={{ backgroundColor: SALES_COLOR }}>
              {isPending ? "Adding..." : "Add Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SalesTeamAdmin() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);

  const { data: team = [], isLoading } = useListSalesTeam();
  const { mutate: del } = useDeleteSalesPerson({
    mutation: {
      onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/sales-team"] }); toast({ title: "Removed from sales team" }); },
      onError: () => toast({ title: "Error", description: "Failed to remove", variant: "destructive" }),
    },
  });

  const handleDelete = (id: string) => {
    if (!window.confirm("Remove this sales person?")) return;
    del({ id });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: BRAND_BLUE }}>Sales Team</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage your sales executives and track performance</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl shadow-sm transition-colors"
          style={{ backgroundColor: SALES_COLOR }}
        >
          <Plus className="w-4 h-4" />
          Add Member
        </button>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: BRAND_BLUE + "15" }}>
            <Users className="w-4 h-4" style={{ color: BRAND_BLUE }} />
          </div>
          <p className="text-2xl font-bold" style={{ color: BRAND_BLUE }}>{team.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Total Members</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: GOLD + "20" }}>
            <IndianRupee className="w-4 h-4" style={{ color: GOLD }} />
          </div>
          <p className="text-xl font-bold" style={{ color: GOLD }}>
            {fmt(team.reduce((s, m) => s + (m.monthlySalary || 0), 0))}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Total Salary/mo</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: SALES_COLOR + "15" }}>
            <Target className="w-4 h-4" style={{ color: SALES_COLOR }} />
          </div>
          <p className="text-2xl font-bold" style={{ color: SALES_COLOR }}>
            {team.reduce((s, m) => s + (m.target || 0), 0)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Total Target/mo</p>
        </div>
      </div>

      {/* Login credentials info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Eye className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-blue-700">Sales Panel Login</p>
          <p className="text-xs text-blue-600 mt-0.5">
            Sales team members log in with their username/password and get their own sales panel with client tracking.
          </p>
        </div>
      </div>

      {/* Team list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: SALES_COLOR, borderTopColor: "transparent" }} />
        </div>
      ) : team.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <TrendingUp className="w-12 h-12 mx-auto mb-3" style={{ color: SALES_COLOR + "60" }} />
          <p className="font-semibold" style={{ color: BRAND_BLUE }}>No sales team members yet</p>
          <p className="text-sm text-slate-400 mt-1">Add your first sales executive to get started</p>
          <button onClick={() => setShowAdd(true)}
            className="mt-4 px-5 py-2.5 text-sm font-semibold text-white rounded-xl"
            style={{ backgroundColor: SALES_COLOR }}>
            Add First Member
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {team.map((person) => (
            <SalesPersonCard key={person.id} person={person} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {showAdd && <AddSalesPersonModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
