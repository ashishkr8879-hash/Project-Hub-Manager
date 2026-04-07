import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  useGetSalesPersonStats, useCreateClient, useAssignClientSalesPerson,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Users, Plus, X, Phone, Mail, Building2, MapPin,
  Calendar, Briefcase, ChevronDown, ChevronUp,
  CheckCircle, Clock, AlertCircle, Trash2,
} from "lucide-react";

const BRAND_BLUE  = "#0d3f7a";
const SALES_COLOR = "#059669";
const GOLD        = "#e8ab15";

function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
}

const projStatus: Record<string, { icon: any; bg: string; text: string; label: string }> = {
  pending:     { icon: AlertCircle, bg: "bg-amber-50",   text: "text-amber-600",  label: "Pending"     },
  in_progress: { icon: Clock,       bg: "bg-blue-50",    text: "text-blue-700",   label: "In Progress" },
  completed:   { icon: CheckCircle, bg: "bg-emerald-50", text: "text-emerald-600",label: "Completed"   },
};

// ─── Add Client Modal ──────────────────────────────────────────────────────────
function AddClientModal({ salesId, onClose, onDone }: { salesId: string; onClose: () => void; onDone: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", phone: "", email: "", businessType: "", city: "" });
  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const assignMut = useAssignClientSalesPerson({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: [`/api/sales-team/${salesId}/stats`] });
        onDone();
        onClose();
      },
    },
  });

  const createMut = useCreateClient({
    mutation: {
      onSuccess: (created: any) => {
        assignMut.mutate({ id: created.id, data: { salesPersonId: salesId } });
        toast({ title: "Client added!", description: `${created.name} has been added to your client list.` });
      },
      onError: () => toast({ title: "Error", description: "Failed to add client", variant: "destructive" }),
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      toast({ title: "Name and Phone are required", variant: "destructive" }); return;
    }
    createMut.mutate({ data: form });
  };

  const inputCls = "w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 placeholder-slate-400";
  const isPending = createMut.isPending || assignMut.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: SALES_COLOR + "15" }}>
              <Users className="w-3.5 h-3.5" style={{ color: SALES_COLOR }} />
            </div>
            <h2 className="font-bold text-sm" style={{ color: BRAND_BLUE }}>Add New Client</h2>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Client Name *</label>
              <input className={inputCls} placeholder="e.g. Raj Enterprises" value={form.name} onChange={setF("name")} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Phone *</label>
              <input className={inputCls} placeholder="+91 98xxx xxxxx" value={form.phone} onChange={setF("phone")} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Email</label>
            <input type="email" className={inputCls} placeholder="client@email.com" value={form.email} onChange={setF("email")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Business Type</label>
              <input className={inputCls} placeholder="e.g. Restaurant" value={form.businessType} onChange={setF("businessType")} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">City</label>
              <input className={inputCls} placeholder="Mumbai" value={form.city} onChange={setF("city")} />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 text-sm text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isPending}
              className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors disabled:opacity-60"
              style={{ backgroundColor: SALES_COLOR }}>
              {isPending ? "Adding..." : "Add Client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Client Card ────────────────────────────────────────────────────────────────
function ClientCard({ client, salesId, onRemove, removing }: {
  client: any; salesId: string; onRemove: () => void; removing: boolean;
}) {
  const [open, setOpen] = useState(false);
  const projects: any[] = client.projects || [];
  const totalRev = projects.reduce((s: number, p: any) => s + (p.amount || 0), 0);
  const completed = projects.filter((p) => p.status === "completed").length;
  const active    = projects.filter((p) => p.status === "in_progress").length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold text-white flex-shrink-0"
          style={{ backgroundColor: BRAND_BLUE }}>
          {client.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate" style={{ color: BRAND_BLUE }}>{client.name}</p>
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
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => setOpen((v) => !v)}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 transition-colors"
          >
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={onRemove}
            disabled={removing}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
            title="Remove client"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick metrics */}
      <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100">
        <div className="py-2 text-center">
          <p className="text-sm font-bold" style={{ color: BRAND_BLUE }}>{projects.length}</p>
          <p className="text-[10px] text-slate-400">Projects</p>
        </div>
        <div className="py-2 text-center">
          <p className="text-sm font-bold text-blue-600">{active}</p>
          <p className="text-[10px] text-slate-400">Active</p>
        </div>
        <div className="py-2 text-center">
          <p className="text-sm font-bold" style={{ color: totalRev > 0 ? GOLD : "#94a3b8" }}>
            {totalRev > 0 ? fmt(totalRev) : "—"}
          </p>
          <p className="text-[10px] text-slate-400">Revenue</p>
        </div>
      </div>

      {/* Expanded details */}
      {open && (
        <div className="border-t border-slate-100 bg-slate-50 px-4 pb-4 pt-3 space-y-3">
          {/* Contact info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {client.phone && (
              <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-100 px-3 py-2">
                <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <div>
                  <p className="text-[9px] text-slate-400 uppercase tracking-wide">Phone</p>
                  <p className="text-xs font-medium text-slate-700">{client.phone}</p>
                </div>
              </div>
            )}
            {client.email && (
              <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-100 px-3 py-2">
                <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <div>
                  <p className="text-[9px] text-slate-400 uppercase tracking-wide">Email</p>
                  <p className="text-xs font-medium text-slate-700 truncate">{client.email}</p>
                </div>
              </div>
            )}
            {client.createdAt && (
              <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-100 px-3 py-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <div>
                  <p className="text-[9px] text-slate-400 uppercase tracking-wide">Added On</p>
                  <p className="text-xs font-medium text-slate-700">
                    {new Date(client.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Projects / Work */}
          {projects.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Briefcase className="w-3 h-3" />Work Details
              </p>
              <div className="space-y-2">
                {projects.map((p: any) => {
                  const st = projStatus[p.status] ?? projStatus.pending;
                  const Icon = st.icon;
                  return (
                    <div key={p.id} className="flex items-start gap-2.5 bg-white border border-slate-200 rounded-xl px-3 py-2.5">
                      <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${st.text}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: BRAND_BLUE }}>{p.projectName}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {p.serviceType && <span className="text-[10px] text-slate-400">{p.serviceType}</span>}
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
          )}

          {projects.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-2 italic">No projects assigned yet</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function SalesClients() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const salesId = (user as any)?.salesId ?? user?.id ?? "";

  const { data, isLoading, refetch } = useGetSalesPersonStats(salesId);
  const [showAdd, setShowAdd] = useState(false);

  const removeMut = useAssignClientSalesPerson({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: [`/api/sales-team/${salesId}/stats`] });
        refetch();
        toast({ title: "Client removed" });
      },
      onError: () => toast({ title: "Error", description: "Failed to remove client", variant: "destructive" }),
    },
  });

  const handleRemove = (clientId: string) => {
    if (!window.confirm("Remove this client from your list?")) return;
    removeMut.mutate({ id: clientId, data: { salesPersonId: null as any } });
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: SALES_COLOR, borderTopColor: "transparent" }} />
      </div>
    );
  }

  const clients = data?.clients ?? [];
  const totalRevenue = clients.reduce((s, c) =>
    s + (c.projects || []).reduce((ps: number, p: any) => ps + (p.amount || 0), 0), 0);

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: BRAND_BLUE }}>My Clients</h1>
          <p className="text-slate-500 text-sm mt-0.5">Clients you have closed and their work status</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl shadow-sm transition-colors flex-shrink-0"
          style={{ backgroundColor: SALES_COLOR }}
        >
          <Plus className="w-4 h-4" />Add Client
        </button>
      </div>

      {/* Summary pills */}
      {clients.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ backgroundColor: BRAND_BLUE + "12", color: BRAND_BLUE }}>
            <Users className="w-3.5 h-3.5" />{clients.length} Clients
          </div>
          {totalRevenue > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={{ backgroundColor: GOLD + "20", color: "#92680a" }}>
              {fmt(totalRevenue)} Revenue
            </div>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ backgroundColor: SALES_COLOR + "15", color: SALES_COLOR }}>
            <Briefcase className="w-3.5 h-3.5" />
            {clients.reduce((s, c) => s + (c.projects?.length ?? 0), 0)} Projects
          </div>
        </div>
      )}

      {/* Client list */}
      {clients.length > 0 ? (
        <div className="space-y-3">
          {clients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              salesId={salesId}
              onRemove={() => handleRemove(client.id)}
              removing={removeMut.isPending}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 py-16 px-6 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: SALES_COLOR + "12" }}>
            <Users className="w-8 h-8" style={{ color: SALES_COLOR }} />
          </div>
          <p className="font-bold text-base" style={{ color: BRAND_BLUE }}>No clients yet</p>
          <p className="text-sm text-slate-400 mt-1 mb-5">Add your first closed client to track their work and revenue</p>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl"
            style={{ backgroundColor: SALES_COLOR }}
          >
            <Plus className="w-4 h-4" />Add First Client
          </button>
        </div>
      )}

      {/* Add Client Modal */}
      {showAdd && (
        <AddClientModal
          salesId={salesId}
          onClose={() => setShowAdd(false)}
          onDone={() => refetch()}
        />
      )}
    </div>
  );
}
