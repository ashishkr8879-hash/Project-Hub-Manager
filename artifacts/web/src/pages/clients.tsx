import { useState, useMemo } from "react";
import { useListClients, useCreateClient, useDeleteClient, useGetClientProjects } from "@workspace/api-client-react";
import type { Client } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Search, X, Plus, Trash2, Phone, Mail, MapPin, Building2, DollarSign, ChevronRight, AlertCircle, Minus } from "lucide-react";

const fmt = (n: number) => "₹" + n.toLocaleString("en-IN");

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  pending: { bg: "bg-yellow-500/10", text: "text-yellow-400", dot: "bg-yellow-400" },
  in_progress: { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-400" },
  completed: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
};

function ClientDetailModal({ client, onClose }: { client: Client; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: clientData } = useGetClientProjects(client.id);
  const clientProjects = (clientData as any)?.projects ?? [];
  const deleteMut = useDeleteClient();
  const [showDelete, setShowDelete] = useState(false);
  const [editingPayment, setEditingPayment] = useState<string | null>(null);
  const [payAmt, setPayAmt] = useState<number>(0);

  const totalValue = clientProjects.reduce((s, p) => s + p.totalValue, 0);
  const totalPaid = clientProjects.reduce((s, p) => s + p.paidAmount, 0);
  const totalPending = totalValue - totalPaid;
  const totalModelCost = clientProjects.reduce((s, p) => s + p.modelCost, 0);
  const payPct = totalValue > 0 ? Math.min((totalPaid / totalValue) * 100, 100) : 0;

  async function doDelete() {
    await deleteMut.mutateAsync({ clientId: client.id });
    qc.invalidateQueries({ queryKey: ["/api/clients"] });
    onClose();
  }

  const initials = client.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const hue = (client.id.charCodeAt(0) * 53) % 360;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col z-10 shadow-2xl">
        {/* Delete confirm */}
        {showDelete && (
          <div className="absolute inset-0 bg-zinc-950/95 rounded-2xl flex items-center justify-center z-20 p-8">
            <div className="text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
              <p className="text-white font-semibold">Delete "{client.name}"?</p>
              <p className="text-sm text-zinc-400">All linked projects will remain but client link will be removed.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setShowDelete(false)} className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700">Cancel</button>
                <button onClick={doDelete} disabled={deleteMut.isPending} className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-50">{deleteMut.isPending ? "..." : "Delete"}</button>
              </div>
            </div>
          </div>
        )}

        {/* Profile Hero */}
        <div className="p-6 flex items-center gap-4 border-b border-zinc-800/60">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0" style={{ backgroundColor: `hsl(${hue},55%,40%)`, color: 'white' }}>{initials}</div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white">{client.name}</h2>
            <p className="text-xs text-zinc-500">{client.businessType} · {client.city}</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={() => setShowDelete(true)} className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
            <button onClick={onClose} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"><X className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Contact */}
          <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-4 space-y-2">
            <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Contact</div>
            {client.phone && <a href={`tel:${client.phone}`} className="flex items-center gap-2.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"><Phone className="w-3.5 h-3.5 flex-shrink-0" />{client.phone}</a>}
            {client.email && <div className="flex items-center gap-2.5 text-sm text-zinc-300"><Mail className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />{client.email}</div>}
            {client.city && <div className="flex items-center gap-2.5 text-sm text-zinc-300"><MapPin className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />{client.city}</div>}
          </div>

          {/* Financial Summary */}
          <div className="bg-yellow-500/8 border border-yellow-500/25 rounded-xl p-4 space-y-2.5">
            <div className="text-xs font-bold text-yellow-400 uppercase tracking-wider mb-3">Financial Summary</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-zinc-900/50 rounded-xl p-3 text-center">
                <div className="text-[10px] text-zinc-500 mb-1">Total Value</div>
                <div className="text-sm font-bold text-white">{fmt(totalValue)}</div>
              </div>
              <div className="bg-emerald-500/10 rounded-xl p-3 text-center">
                <div className="text-[10px] text-emerald-500 mb-1">Received</div>
                <div className="text-sm font-bold text-emerald-400">{fmt(totalPaid)}</div>
              </div>
              <div className="bg-red-500/10 rounded-xl p-3 text-center">
                <div className="text-[10px] text-red-500 mb-1">Pending</div>
                <div className="text-sm font-bold text-red-400">{fmt(totalPending)}</div>
              </div>
              <div className="bg-orange-500/10 rounded-xl p-3 text-center">
                <div className="text-[10px] text-orange-500 mb-1">Model Cost</div>
                <div className="text-sm font-bold text-orange-400">{fmt(totalModelCost)}</div>
              </div>
            </div>
            {/* Payment bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-zinc-500">
                <span>Payment collected</span><span>{Math.round(payPct)}%</span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${payPct}%` }} />
              </div>
            </div>
          </div>

          {/* Projects list */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Projects ({clientProjects.length})</div>
            {clientProjects.length === 0 ? (
              <div className="text-center py-6 text-zinc-500 text-sm">No projects yet</div>
            ) : (
              <div className="space-y-2">
                {clientProjects.map((p) => {
                  const sc = STATUS_COLORS[p.status] || STATUS_COLORS.pending;
                  const isEditing = editingPayment === p.id;
                  return (
                    <div key={p.id} className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{p.projectName}</p>
                          <p className="text-xs text-zinc-500">{p.editorName}</p>
                        </div>
                        <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${sc.bg} ${sc.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {p.status.replace("_", " ")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-emerald-400 font-semibold">{fmt(p.totalValue)}</span>
                        <span className="text-zinc-500">Paid: <span className="text-emerald-400">{fmt(p.paidAmount)}</span></span>
                        <span className="text-red-400">Due: {fmt(p.totalValue - p.paidAmount)}</span>
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

function ClientCard({ client, onOpen }: { client: Client; onOpen: () => void }) {
  const initials = client.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const hue = (client.id.charCodeAt(0) * 53) % 360;
  return (
    <div onClick={onOpen} className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-4 cursor-pointer hover:border-zinc-700 hover:bg-zinc-800/40 transition-all duration-150 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ backgroundColor: `hsl(${hue},55%,40%)`, color: 'white' }}>{initials}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{client.name}</p>
          <p className="text-xs text-zinc-500 truncate">{client.businessType}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-zinc-600 flex-shrink-0" />
      </div>
      <div className="flex items-center gap-3 text-xs text-zinc-500">
        {client.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{client.phone}</span>}
        {client.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{client.city}</span>}
      </div>
      <div className="text-[10px] text-zinc-600">
        Joined {new Date(client.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
      </div>
    </div>
  );
}

function AddClientModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const createMut = useCreateClient();
  const [form, setForm] = useState({ name: "", phone: "", email: "", businessType: "", city: "" });
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.phone) { setError("Name and phone are required"); return; }
    try {
      await createMut.mutateAsync({ data: form });
      qc.invalidateQueries({ queryKey: ["/api/clients"] });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to create client");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md z-10 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/60">
          <h2 className="text-base font-bold text-white">Add New Client</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          {error && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</div>}
          {[
            { key: "name", label: "Name *", placeholder: "Client name" },
            { key: "phone", label: "Phone *", placeholder: "+91 9999..." },
            { key: "email", label: "Email", placeholder: "client@email.com" },
            { key: "businessType", label: "Business Type", placeholder: "e.g. Fashion Brand" },
            { key: "city", label: "City", placeholder: "Mumbai" },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-xs text-zinc-500 block mb-1">{label}</label>
              <input value={(form as any)[key]} onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600" />
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={createMut.isPending} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {createMut.isPending ? "Adding..." : "Add Client"}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700 transition-colors">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Clients() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Client | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const { data: clients = [], isLoading } = useListClients({ query: { refetchInterval: 30000 } });

  const filtered = useMemo(() =>
    search.trim() ? clients.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.businessType.toLowerCase().includes(search.toLowerCase())) : clients
  , [clients, search]);

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#0d3f7a' }}>Clients</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{clients.length} total clients</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
          <Plus className="w-4 h-4" />Add Client
        </button>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold" style={{ color: '#0d3f7a' }}>{clients.length}</div>
          <div className="text-xs text-zinc-500 mt-1">Total Clients</div>
        </div>
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 text-center col-span-2">
          <div className="text-xs text-emerald-400 mb-1">Client network active</div>
          <div className="text-sm text-zinc-400">Track payments, projects & history per client</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search clients..." className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800/60 rounded-xl text-sm text-white placeholder-zinc-600" />
        {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"><X className="w-3.5 h-3.5" /></button>}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="bg-zinc-900 border border-zinc-800/60 rounded-2xl h-28 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Building2 className="w-12 h-12 text-zinc-700 mx-auto" />
          <p className="text-zinc-400">{search ? "No clients match your search" : "No clients yet"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((c) => <ClientCard key={c.id} client={c} onOpen={() => setSelected(c)} />)}
        </div>
      )}

      {selected && <ClientDetailModal client={selected} onClose={() => setSelected(null)} />}
      {showAdd && <AddClientModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
