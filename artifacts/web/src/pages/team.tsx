import { useState } from "react";
import { Link } from "wouter";
import { useListEditors, useCreateEditor, useDeleteEditor, getListEditorsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Trash2, ChevronRight, User } from "lucide-react";

const SPEC_COLORS: Record<string, string> = {
  "Video Editor": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "Graphic Designer": "bg-pink-500/10 text-pink-400 border-pink-500/20",
  "Social Media Manager": "bg-sky-500/10 text-sky-400 border-sky-500/20",
  "Website Development": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "Ads Setup": "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function CreateEditorModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const create = useCreateEditor();
  const [form, setForm] = useState({ name: "", username: "", password: "", email: "", phone: "", specialization: "", location: "", bankAccount: "", monthlySalary: "" });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.name || !form.username || !form.password || !form.phone || !form.specialization) {
      toast({ title: "Required fields missing", description: "Name, username, password, phone and specialization are required.", variant: "destructive" });
      return;
    }
    create.mutate({ data: { name: form.name, username: form.username, password: form.password, email: form.email || undefined, phone: form.phone, specialization: form.specialization, location: form.location || undefined, bankAccount: form.bankAccount || undefined, monthlySalary: form.monthlySalary ? Number(form.monthlySalary) : undefined } }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListEditorsQueryKey() }); toast({ title: "Editor added" }); onClose(); },
      onError: (err: any) => toast({ title: err?.message || "Failed to add editor", variant: "destructive" }),
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg">
        <DialogHeader><DialogTitle>Add Team Member</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="col-span-2 space-y-1"><Label>Name *</Label><Input data-testid="input-editor-name" className="bg-zinc-800 border-zinc-700" value={form.name} onChange={e => set("name", e.target.value)} /></div>
          <div className="space-y-1"><Label>Username *</Label><Input data-testid="input-editor-username" className="bg-zinc-800 border-zinc-700" value={form.username} onChange={e => set("username", e.target.value)} /></div>
          <div className="space-y-1"><Label>Password *</Label><Input type="password" className="bg-zinc-800 border-zinc-700" value={form.password} onChange={e => set("password", e.target.value)} /></div>
          <div className="space-y-1"><Label>Phone *</Label><Input className="bg-zinc-800 border-zinc-700" value={form.phone} onChange={e => set("phone", e.target.value)} /></div>
          <div className="space-y-1"><Label>Email</Label><Input className="bg-zinc-800 border-zinc-700" value={form.email} onChange={e => set("email", e.target.value)} /></div>
          <div className="col-span-2 space-y-1"><Label>Specialization *</Label><Input data-testid="input-editor-spec" className="bg-zinc-800 border-zinc-700" value={form.specialization} onChange={e => set("specialization", e.target.value)} placeholder="e.g. Video Editor" /></div>
          <div className="space-y-1"><Label>Location</Label><Input className="bg-zinc-800 border-zinc-700" value={form.location} onChange={e => set("location", e.target.value)} /></div>
          <div className="space-y-1"><Label>Monthly Salary (₹)</Label><Input type="number" className="bg-zinc-800 border-zinc-700" value={form.monthlySalary} onChange={e => set("monthlySalary", e.target.value)} /></div>
          <div className="col-span-2 space-y-1"><Label>Bank Account</Label><Input className="bg-zinc-800 border-zinc-700" value={form.bankAccount} onChange={e => set("bankAccount", e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="border-zinc-700" onClick={onClose}>Cancel</Button>
          <Button data-testid="button-add-editor" onClick={handleSubmit} disabled={create.isPending}>{create.isPending ? "Adding..." : "Add Member"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Team() {
  const { data: editors, isLoading } = useListEditors({ query: { queryKey: getListEditorsQueryKey() } });
  const deleteEditor = useDeleteEditor();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);

  const filtered = (editors || []).filter(e => {
    const q = search.toLowerCase();
    return !q || e.name.toLowerCase().includes(q) || e.specialization.toLowerCase().includes(q);
  });

  const handleDelete = (e: React.MouseEvent, editorId: string, name: string) => {
    e.preventDefault(); e.stopPropagation();
    if (!confirm(`Remove ${name} from the team?`)) return;
    deleteEditor.mutate({ editorId }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListEditorsQueryKey() }); toast({ title: "Editor removed" }); },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Team</h2>
          <p className="text-zinc-400 text-sm mt-0.5">{editors?.length ?? 0} team members</p>
        </div>
        <Button data-testid="button-new-editor" onClick={() => setCreating(true)}><Plus className="w-4 h-4 mr-2" />Add Member</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <Input data-testid="input-search-team" className="bg-zinc-900 border-zinc-800 pl-9" placeholder="Search team members..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 h-44 animate-pulse" />)
        ) : filtered.length === 0 ? (
          <div className="col-span-3 py-12 text-center text-zinc-500">No team members found.</div>
        ) : filtered.map(editor => {
          const specColor = SPEC_COLORS[editor.specialization] || "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
          return (
            <Link key={editor.id} href={`/team/${editor.id}`}>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 hover:bg-zinc-800/40 transition-all cursor-pointer group" data-testid={`card-editor-${editor.id}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700">
                      <User className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{editor.name}</p>
                      <p className="text-xs text-zinc-500">{editor.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 p-1 h-auto" onClick={e => handleDelete(e, editor.id, editor.name)} data-testid={`button-delete-editor-${editor.id}`}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
                <Badge className={`text-xs ${specColor} mb-3`}>{editor.specialization}</Badge>
                <div className="grid grid-cols-2 gap-2 text-xs text-zinc-500 mt-2">
                  {editor.location && <span>{editor.location}</span>}
                  {editor.monthlySalary ? <span className="text-zinc-300 font-medium">{formatCurrency(editor.monthlySalary)}/mo</span> : null}
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800">
                  <span className="text-xs text-zinc-500">Joined {new Date(editor.joinedAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</span>
                  <ChevronRight className="w-4 h-4 text-zinc-600" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {creating && <CreateEditorModal onClose={() => setCreating(false)} />}
    </div>
  );
}
