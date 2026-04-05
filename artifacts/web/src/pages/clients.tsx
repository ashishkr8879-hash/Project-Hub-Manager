import { useState } from "react";
import { useListClients, useCreateClient, useDeleteClient, useGetClientProjects, getListClientsQueryKey, getGetClientProjectsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Trash2, ChevronRight, Building2, Phone, Mail, MapPin } from "lucide-react";
import type { Client } from "@workspace/api-client-react";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400",
  in_progress: "bg-blue-500/10 text-blue-400",
  completed: "bg-emerald-500/10 text-emerald-400",
};

function ClientDetailPanel({ client, onClose }: { client: Client; onClose: () => void }) {
  const { data } = useGetClientProjects(client.id, { query: { enabled: true, queryKey: getGetClientProjectsQueryKey(client.id) } });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{client.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-zinc-300"><Phone className="w-3.5 h-3.5 text-zinc-500" />{client.phone}</div>
            <div className="flex items-center gap-2 text-zinc-300"><Mail className="w-3.5 h-3.5 text-zinc-500" />{client.email}</div>
            <div className="flex items-center gap-2 text-zinc-300"><Building2 className="w-3.5 h-3.5 text-zinc-500" />{client.businessType}</div>
            <div className="flex items-center gap-2 text-zinc-300"><MapPin className="w-3.5 h-3.5 text-zinc-500" />{client.city}</div>
          </div>

          {data && (
            <>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                <p className="text-xs text-zinc-500 mb-1">Total Value</p>
                <p className="text-2xl font-bold text-emerald-400">{formatCurrency(data.totalValue)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-zinc-300 mb-2">Projects ({data.projects.length})</h4>
                <div className="space-y-2">
                  {data.projects.length === 0 ? <p className="text-zinc-500 text-sm">No projects yet.</p> : data.projects.map(p => (
                    <div key={p.id} className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{p.projectName}</p>
                        <p className="text-xs text-zinc-400">{p.editorName} · {formatCurrency(p.totalValue)}</p>
                      </div>
                      <Badge className={`text-xs ${statusColors[p.status] || ""}`}>{p.status.replace("_", " ")}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateClientModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const create = useCreateClient();
  const [form, setForm] = useState({ name: "", phone: "", email: "", businessType: "", city: "" });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.name || !form.phone) {
      toast({ title: "Name and phone required", variant: "destructive" });
      return;
    }
    create.mutate({ data: { name: form.name, phone: form.phone, email: form.email, businessType: form.businessType || "Other", city: form.city } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListClientsQueryKey() });
        toast({ title: "Client added" });
        onClose();
      },
      onError: () => toast({ title: "Failed to add client", variant: "destructive" }),
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
        <DialogHeader><DialogTitle>Add Client</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1"><Label>Name *</Label><Input data-testid="input-client-name" className="bg-zinc-800 border-zinc-700" value={form.name} onChange={e => set("name", e.target.value)} /></div>
          <div className="space-y-1"><Label>Phone *</Label><Input data-testid="input-client-phone" className="bg-zinc-800 border-zinc-700" value={form.phone} onChange={e => set("phone", e.target.value)} /></div>
          <div className="space-y-1"><Label>Email</Label><Input className="bg-zinc-800 border-zinc-700" value={form.email} onChange={e => set("email", e.target.value)} /></div>
          <div className="space-y-1"><Label>Business Type</Label><Input className="bg-zinc-800 border-zinc-700" value={form.businessType} onChange={e => set("businessType", e.target.value)} /></div>
          <div className="space-y-1"><Label>City</Label><Input className="bg-zinc-800 border-zinc-700" value={form.city} onChange={e => set("city", e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="border-zinc-700" onClick={onClose}>Cancel</Button>
          <Button data-testid="button-add-client" onClick={handleSubmit} disabled={create.isPending}>{create.isPending ? "Adding..." : "Add Client"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Clients() {
  const { data: clients, isLoading } = useListClients({ query: { queryKey: getListClientsQueryKey() } });
  const deleteClient = useDeleteClient();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Client | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = (clients || []).filter(c => {
    const q = search.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q) || c.businessType.toLowerCase().includes(q);
  });

  const handleDelete = (e: React.MouseEvent, clientId: string) => {
    e.stopPropagation();
    if (!confirm("Delete this client?")) return;
    deleteClient.mutate({ clientId }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListClientsQueryKey() }); toast({ title: "Client deleted" }); },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Clients</h2>
          <p className="text-zinc-400 text-sm mt-0.5">{clients?.length ?? 0} total clients</p>
        </div>
        <Button data-testid="button-new-client" onClick={() => setCreating(true)}><Plus className="w-4 h-4 mr-2" />Add Client</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <Input data-testid="input-search-clients" className="bg-zinc-900 border-zinc-800 pl-9" placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800">
              {["Name", "Phone", "Email", "Business Type", "City", "Joined"].map(h => (
                <th key={h} className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">{h}</th>
              ))}
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {Array.from({ length: 7 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-zinc-800 rounded" /></td>)}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-zinc-500">No clients found.</td></tr>
            ) : filtered.map(c => (
              <tr key={c.id} className="hover:bg-zinc-800/30 cursor-pointer transition-colors" onClick={() => setSelected(c)} data-testid={`row-client-${c.id}`}>
                <td className="px-4 py-3 font-medium text-sm text-white">{c.name}</td>
                <td className="px-4 py-3 text-sm text-zinc-300">{c.phone}</td>
                <td className="px-4 py-3 text-sm text-zinc-400">{c.email}</td>
                <td className="px-4 py-3 text-sm text-zinc-300">{c.businessType}</td>
                <td className="px-4 py-3 text-sm text-zinc-400">{c.city}</td>
                <td className="px-4 py-3 text-sm text-zinc-500">{new Date(c.createdAt).toLocaleDateString("en-IN")}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 p-1 h-auto" onClick={e => handleDelete(e, c.id)} data-testid={`button-delete-client-${c.id}`}><Trash2 className="w-3.5 h-3.5" /></Button>
                    <ChevronRight className="w-4 h-4 text-zinc-600" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && <ClientDetailPanel client={selected} onClose={() => setSelected(null)} />}
      {creating && <CreateClientModal onClose={() => setCreating(false)} />}
    </div>
  );
}
