import { useState } from "react";
import {
  useListSalesTeam, useGetSalesPersonStats, useCreateSalesPerson,
  useDeleteSalesPerson, useListClients, useAssignClientSalesPerson,
  useCreateClient,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  TrendingUp, Plus, Trash2, Users, IndianRupee, Target,
  Phone, Mail, ChevronDown, ChevronUp, X, Eye,
  UserPlus, UserMinus, Briefcase, Calendar, Building2, MapPin,
  CheckCircle, Clock, AlertCircle,
} from "lucide-react";
import { SalesPerformanceCalendar } from "@/components/sales-performance-calendar";

const BRAND_BLUE  = "#0d3f7a";
const SALES_COLOR = "#059669";
const GOLD        = "#e8ab15";

function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
}

// ─── Project status config ─────────────────────────────────────────────────────
const projStatus: Record<string, { icon: any; bg: string; text: string; label: string }> = {
  pending:     { icon: AlertCircle, bg: "bg-amber-50",   text: "text-amber-600",  label: "Pending"     },
  in_progress: { icon: Clock,       bg: "bg-blue-50",    text: "text-blue-700",   label: "In Progress" },
  completed:   { icon: CheckCircle, bg: "bg-emerald-50", text: "text-emerald-600",label: "Completed"   },
};

// ─── Assigned client row with expandable work details ──────────────────────────
function AssignedClientRow({ client, onRemove, isPending }: { client: any; onRemove: () => void; isPending: boolean }) {
  const [open, setOpen] = useState(false);
  const projects: any[] = client.projects || [];
  const totalRev = projects.reduce((s: number, p: any) => s + (p.amount || 0), 0);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
          style={{ backgroundColor: BRAND_BLUE }}>
          {client.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate" style={{ color: BRAND_BLUE }}>{client.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {client.businessType && (
              <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                <Building2 className="w-2.5 h-2.5" />{client.businessType}
              </span>
            )}
            {client.city && (
              <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                <MapPin className="w-2.5 h-2.5" />{client.city}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {projects.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: BRAND_BLUE + "15", color: BRAND_BLUE }}>
              {projects.length} work
            </span>
          )}
          {totalRev > 0 && (
            <span className="text-[10px] font-bold" style={{ color: "#e8ab15" }}>{fmt(totalRev)}</span>
          )}
          <button
            onClick={() => setOpen((v) => !v)}
            className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
          >
            {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onRemove}
            disabled={isPending}
            className="flex items-center gap-0.5 text-[10px] font-medium text-red-400 hover:text-red-600 hover:bg-red-50 px-1.5 py-1 rounded-lg transition-colors disabled:opacity-50"
          >
            <UserMinus className="w-3 h-3" />
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-100 px-3 pb-3 pt-2 bg-slate-50 space-y-2">
          {/* Contact row */}
          <div className="flex flex-wrap gap-3">
            {client.phone && (
              <span className="flex items-center gap-1 text-[10px] text-slate-500">
                <Phone className="w-3 h-3 text-slate-400" />{client.phone}
              </span>
            )}
            {client.email && (
              <span className="flex items-center gap-1 text-[10px] text-slate-500">
                <Mail className="w-3 h-3 text-slate-400" />{client.email}
              </span>
            )}
            {client.createdAt && (
              <span className="flex items-center gap-1 text-[10px] text-slate-400">
                <Calendar className="w-3 h-3" />Since {new Date(client.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            )}
          </div>

          {/* Work / Projects */}
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <Briefcase className="w-3 h-3" />Work Details
            </p>
            {projects.length === 0 ? (
              <p className="text-[10px] text-slate-400 italic">No projects yet</p>
            ) : (
              <div className="space-y-1.5">
                {projects.map((p: any) => {
                  const st = projStatus[p.status] ?? projStatus.pending;
                  const Icon = st.icon;
                  return (
                    <div key={p.id} className="flex items-start gap-2 bg-white border border-slate-200 rounded-lg px-2.5 py-2">
                      <Icon className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${st.text}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold truncate" style={{ color: BRAND_BLUE }}>{p.projectName}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                          {p.serviceType && <span className="text-[9px] text-slate-400">{p.serviceType}</span>}
                          {p.deadline && (
                            <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                              <Calendar className="w-2.5 h-2.5" />
                              {new Date(p.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${st.bg} ${st.text}`}>{st.label}</span>
                        {p.amount > 0 && (
                          <span className="text-[10px] font-bold" style={{ color: "#e8ab15" }}>{fmt(p.amount)}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Client Management ────────────────────────────────────────────────────────
function ClientManager({ personId, stats, onRefresh }: { personId: string; stats: any; onRefresh: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [subTab, setSubTab] = useState<"assigned" | "add_new" | "assign_existing">("assigned");

  // For existing-client assign
  const { data: allClients = [] } = useListClients();
  const [search, setSearch] = useState("");

  // For new client form
  const emptyForm = { name: "", phone: "", email: "", businessType: "", city: "" };
  const [newClient, setNewClient] = useState(emptyForm);
  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setNewClient((f) => ({ ...f, [k]: e.target.value }));

  const assignMut = useAssignClientSalesPerson({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["/api/clients"] });
        qc.invalidateQueries({ queryKey: [`/api/sales-team/${personId}/stats`] });
        onRefresh();
      },
      onError: () => toast({ title: "Error", description: "Failed to update assignment", variant: "destructive" }),
    },
  });

  const createMut = useCreateClient({
    mutation: {
      onSuccess: async (created: any) => {
        qc.invalidateQueries({ queryKey: ["/api/clients"] });
        assignMut.mutate({ id: created.id, data: { salesPersonId: personId } });
        setNewClient(emptyForm);
        setSubTab("assigned");
        toast({ title: "Client added!", description: `${created.name} has been added and assigned.` });
      },
      onError: () => toast({ title: "Error", description: "Failed to create client", variant: "destructive" }),
    },
  });

  const myClients      = stats?.clients || [];
  const unassigned     = allClients.filter((c) => !c.salesPersonId);
  const assignedOther  = allClients.filter((c) => c.salesPersonId && c.salesPersonId !== personId);
  const available      = [...unassigned, ...assignedOther].filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.businessType.toLowerCase().includes(search.toLowerCase())
  );

  const handleAssign = (clientId: string) => assignMut.mutate({ id: clientId, data: { salesPersonId: personId } });
  const handleRemove = (clientId: string) => assignMut.mutate({ id: clientId, data: { salesPersonId: null as any } });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.name || !newClient.phone) {
      toast({ title: "Name and Phone are required", variant: "destructive" }); return;
    }
    createMut.mutate({ data: newClient });
  };

  const inputCls = "w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 placeholder-slate-400";

  const subTabs = [
    { key: "assigned",         label: `Clients (${myClients.length})` },
    { key: "add_new",          label: "Add New" },
    { key: "assign_existing",  label: "Assign Existing" },
  ] as const;

  return (
    <div className="space-y-3">
      {/* Sub-tab bar */}
      <div className="flex rounded-xl bg-slate-100 p-0.5 gap-0.5">
        {subTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setSubTab(t.key)}
            className="flex-1 text-[11px] font-semibold py-1.5 rounded-lg transition-colors"
            style={subTab === t.key
              ? { backgroundColor: "white", color: BRAND_BLUE, boxShadow: "0 1px 3px rgba(0,0,0,.08)" }
              : { color: "#94a3b8" }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Assigned Clients ── */}
      {subTab === "assigned" && (
        <div>
          {myClients.length === 0 ? (
            <div className="text-center py-6">
              <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-[11px] text-slate-400">No clients assigned yet</p>
              <p className="text-[10px] text-slate-300 mt-0.5">Use "Add New" or "Assign Existing" to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myClients.map((c: any) => (
                <AssignedClientRow
                  key={c.id}
                  client={c}
                  onRemove={() => handleRemove(c.id)}
                  isPending={assignMut.isPending}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Add New Client ── */}
      {subTab === "add_new" && (
        <form onSubmit={handleCreateSubmit} className="space-y-2.5">
          <p className="text-[10px] text-slate-500 mb-1">Create a new client and auto-assign them to this executive.</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-medium text-slate-600 mb-0.5 block">Name *</label>
              <input className={inputCls} placeholder="Client name" value={newClient.name} onChange={setF("name")} />
            </div>
            <div>
              <label className="text-[10px] font-medium text-slate-600 mb-0.5 block">Phone *</label>
              <input className={inputCls} placeholder="+91 98xxx" value={newClient.phone} onChange={setF("phone")} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-medium text-slate-600 mb-0.5 block">Email</label>
            <input type="email" className={inputCls} placeholder="client@email.com" value={newClient.email} onChange={setF("email")} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-medium text-slate-600 mb-0.5 block">Business Type</label>
              <input className={inputCls} placeholder="e.g. Restaurant" value={newClient.businessType} onChange={setF("businessType")} />
            </div>
            <div>
              <label className="text-[10px] font-medium text-slate-600 mb-0.5 block">City</label>
              <input className={inputCls} placeholder="Mumbai" value={newClient.city} onChange={setF("city")} />
            </div>
          </div>
          <button
            type="submit"
            disabled={createMut.isPending || assignMut.isPending}
            className="w-full py-2 text-xs font-semibold text-white rounded-xl transition-colors disabled:opacity-60"
            style={{ backgroundColor: SALES_COLOR }}
          >
            {createMut.isPending ? "Creating..." : "Create & Assign Client"}
          </button>
        </form>
      )}

      {/* ── Assign Existing Client ── */}
      {subTab === "assign_existing" && (
        <div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or business..."
            className={inputCls + " mb-2"}
          />
          {available.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic py-3 text-center">
              {search ? "No clients match your search" : "All clients are already assigned"}
            </p>
          ) : (
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {available.map((c) => (
                <div key={c.id} className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: c.salesPersonId ? "#94a3b8" : BRAND_BLUE }}>
                    {c.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate text-slate-700">{c.name}</p>
                    <p className="text-[10px] text-slate-400">
                      {c.businessType} · {c.city}
                      {c.salesPersonName && <span className="ml-1 text-amber-500"> · {c.salesPersonName}</span>}
                    </p>
                  </div>
                  <button
                    onClick={() => handleAssign(c.id)}
                    disabled={assignMut.isPending}
                    className="flex items-center gap-1 text-[10px] font-medium text-white px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                    style={{ backgroundColor: SALES_COLOR }}
                  >
                    <UserPlus className="w-3 h-3" />Assign
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sales Person Card ────────────────────────────────────────────────────────
function SalesPersonCard({ person, onDelete }: { person: any; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<"performance" | "clients">("performance");
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: stats, refetch } = useGetSalesPersonStats(person.id, {
    query: { enabled: expanded },
  });

  const handleRefresh = () => { setRefreshKey(k => k + 1); refetch(); };

  const clientCount = stats?.clientsClosed ?? 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5">
        {/* Header row */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
            style={{ backgroundColor: SALES_COLOR }}>
            {person.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm" style={{ color: BRAND_BLUE }}>{person.name}</h3>
            <p className="text-xs text-slate-400">@{person.username}</p>
            <div className="flex flex-wrap items-center gap-3 mt-1">
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors border"
              style={expanded
                ? { backgroundColor: SALES_COLOR + "15", color: SALES_COLOR, borderColor: SALES_COLOR + "30" }
                : { color: "#64748b", borderColor: "#e2e8f0" }}
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {expanded ? "Close" : "Details"}
            </button>
            <button
              onClick={() => onDelete(person.id)}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors border border-slate-200"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="text-center">
            <p className="text-xl font-bold" style={{ color: BRAND_BLUE }}>
              {stats ? clientCount : "—"}
            </p>
            <p className="text-[10px] text-slate-400">Clients</p>
          </div>
          <div className="text-center border-x border-slate-100">
            <p className="text-sm font-bold" style={{ color: GOLD }}>
              {fmt(person.monthlySalary)}<span className="text-[9px] text-slate-400">/mo</span>
            </p>
            <p className="text-[10px] text-slate-400">Salary</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold" style={{ color: SALES_COLOR }}>{person.target}</p>
            <p className="text-[10px] text-slate-400">Target</p>
          </div>
        </div>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 bg-white">
            {(["performance", "clients"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors border-b-2 ${
                  tab === t ? "border-current" : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
                style={tab === t ? { color: SALES_COLOR, borderColor: SALES_COLOR } : {}}
              >
                {t === "performance" ? <><TrendingUp className="w-3.5 h-3.5" />Performance</> : <><Users className="w-3.5 h-3.5" />Clients</>}
              </button>
            ))}
          </div>

          <div className="p-4">
            {!stats ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: SALES_COLOR, borderTopColor: "transparent" }} />
              </div>
            ) : tab === "performance" ? (
              <div className="space-y-4">
                {/* Stats grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
                    <p className="text-xl font-bold" style={{ color: BRAND_BLUE }}>{stats.clientsClosed}</p>
                    <p className="text-[10px] text-slate-500">Clients</p>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
                    <p className="text-base font-bold" style={{ color: GOLD }}>{fmt(stats.totalRevenue)}</p>
                    <p className="text-[10px] text-slate-500">Revenue</p>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
                    <p className="text-xl font-bold text-blue-600">{stats.activeProjects}</p>
                    <p className="text-[10px] text-slate-500">Active</p>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
                    <p className="text-xl font-bold" style={{ color: SALES_COLOR }}>{stats.completedProjects}</p>
                    <p className="text-[10px] text-slate-500">Done</p>
                  </div>
                </div>

                {/* Target progress */}
                <div className="bg-white rounded-xl border border-slate-200 p-3">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-500 font-medium">Monthly Target</span>
                    <span className="font-bold" style={{ color: stats.targetAchieved >= 100 ? SALES_COLOR : BRAND_BLUE }}>
                      {stats.clientsClosed}/{person.target} clients · {stats.targetAchieved}%
                    </span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(stats.targetAchieved, 100)}%`, backgroundColor: stats.targetAchieved >= 100 ? SALES_COLOR : BRAND_BLUE }} />
                  </div>
                </div>

                {/* Performance Calendar */}
                <SalesPerformanceCalendar clients={stats.clients} />
              </div>
            ) : (
              <ClientManager
                key={refreshKey}
                personId={person.id}
                stats={stats}
                onRefresh={handleRefresh}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Add Sales Person Modal ────────────────────────────────────────────────────
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

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function SalesTeamAdmin() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);

  const { data: team = [], isLoading } = useListSalesTeam();
  const { data: allClients = [] } = useListClients();

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

  const unassignedCount = allClients.filter((c) => !c.salesPersonId).length;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: BRAND_BLUE }}>Sales Team</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage executives, assign clients, track performance</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl shadow-sm transition-colors"
          style={{ backgroundColor: SALES_COLOR }}
        >
          <Plus className="w-4 h-4" />Add Member
        </button>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: BRAND_BLUE + "15" }}>
            <Users className="w-4 h-4" style={{ color: BRAND_BLUE }} />
          </div>
          <p className="text-2xl font-bold" style={{ color: BRAND_BLUE }}>{team.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Team Members</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: GOLD + "20" }}>
            <IndianRupee className="w-4 h-4" style={{ color: GOLD }} />
          </div>
          <p className="text-lg font-bold" style={{ color: GOLD }}>
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
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: "#f59e0b15" }}>
            <Briefcase className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-500">{unassignedCount}</p>
          <p className="text-xs text-slate-500 mt-0.5">Unassigned Clients</p>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Eye className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-blue-700">How to use</p>
          <p className="text-xs text-blue-600 mt-0.5">
            Click "Details" on any member to view their performance calendar, assign clients, or remove clients. Sales members log in with their username/password.
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
