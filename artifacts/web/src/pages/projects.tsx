import { useState } from "react";
import {
  useListProjects, useListEditors, useUpdateProject, useDeleteProject,
  useUpdateProjectStatus, useSetProjectRevision, useUpdateProjectPayment,
  useCreateProject, useListProjectReferences, useListMessages, useSendMessage,
  useAddProjectReference, useDeleteReference,
  getListProjectsQueryKey, getListEditorsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, ChevronRight, Trash2, Edit, CheckCircle2, Clock, AlertCircle, IndianRupee, Link2, MessageSquare } from "lucide-react";
import type { Project, Editor } from "@workspace/api-client-react";

const PROJECT_TYPES = ["ugc", "ai_video", "editing", "branded", "corporate", "wedding", "social_media", "graphic_design", "ads_setup", "website", "other"];
const STATUSES = ["pending", "in_progress", "completed"];

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  in_progress: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const statusIcons: Record<string, React.ComponentType<any>> = {
  pending: Clock,
  in_progress: AlertCircle,
  completed: CheckCircle2,
};

const typeColors: Record<string, string> = {
  ugc: "bg-purple-500/10 text-purple-400",
  ai_video: "bg-violet-500/10 text-violet-400",
  editing: "bg-blue-500/10 text-blue-400",
  branded: "bg-cyan-500/10 text-cyan-400",
  corporate: "bg-slate-500/10 text-slate-400",
  wedding: "bg-pink-500/10 text-pink-400",
  social_media: "bg-orange-500/10 text-orange-400",
  graphic_design: "bg-rose-500/10 text-rose-400",
  ads_setup: "bg-amber-500/10 text-amber-400",
  website: "bg-teal-500/10 text-teal-400",
  other: "bg-zinc-500/10 text-zinc-400",
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-zinc-500 w-12 text-right">{value}/{max}</span>
    </div>
  );
}

function CreateProjectModal({ editors, onClose }: { editors: Editor[]; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const create = useCreateProject();
  const [form, setForm] = useState({
    clientName: "", clientPhone: "", clientEmail: "", projectName: "",
    projectType: "branded", totalValue: "", modelCost: "0", editorCost: "0",
    totalDeliverables: "1", editorId: "", deadline: "", notes: "",
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.clientName || !form.projectName || !form.totalValue || !form.editorId) {
      toast({ title: "Missing fields", description: "Client name, project name, value and editor are required.", variant: "destructive" });
      return;
    }
    create.mutate({
      data: {
        clientName: form.clientName, clientPhone: form.clientPhone || undefined,
        clientEmail: form.clientEmail || undefined,
        projectName: form.projectName, projectType: form.projectType as any,
        totalValue: Number(form.totalValue), modelCost: Number(form.modelCost) || 0,
        editorCost: Number(form.editorCost) || 0,
        totalDeliverables: Number(form.totalDeliverables) || 1,
        editorId: form.editorId, deadline: form.deadline || undefined,
        notes: form.notes || undefined,
      }
    }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        toast({ title: "Project created" });
        onClose();
      },
      onError: () => toast({ title: "Failed to create project", variant: "destructive" }),
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="col-span-2 space-y-1"><Label>Client Name *</Label><Input data-testid="input-client-name" className="bg-zinc-800 border-zinc-700" value={form.clientName} onChange={e => set("clientName", e.target.value)} /></div>
          <div className="space-y-1"><Label>Client Phone</Label><Input data-testid="input-client-phone" className="bg-zinc-800 border-zinc-700" value={form.clientPhone} onChange={e => set("clientPhone", e.target.value)} /></div>
          <div className="space-y-1"><Label>Client Email</Label><Input data-testid="input-client-email" className="bg-zinc-800 border-zinc-700" value={form.clientEmail} onChange={e => set("clientEmail", e.target.value)} /></div>
          <div className="col-span-2 space-y-1"><Label>Project Name *</Label><Input data-testid="input-project-name" className="bg-zinc-800 border-zinc-700" value={form.projectName} onChange={e => set("projectName", e.target.value)} /></div>
          <div className="space-y-1"><Label>Project Type</Label>
            <Select value={form.projectType} onValueChange={v => set("projectType", v)}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">{PROJECT_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label>Editor *</Label>
            <Select value={form.editorId} onValueChange={v => set("editorId", v)}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue placeholder="Select editor" /></SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">{editors.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label>Total Value (₹) *</Label><Input data-testid="input-total-value" type="number" className="bg-zinc-800 border-zinc-700" value={form.totalValue} onChange={e => set("totalValue", e.target.value)} /></div>
          <div className="space-y-1"><Label>Model Cost (₹)</Label><Input type="number" className="bg-zinc-800 border-zinc-700" value={form.modelCost} onChange={e => set("modelCost", e.target.value)} /></div>
          <div className="space-y-1"><Label>Editor Cost (₹)</Label><Input type="number" className="bg-zinc-800 border-zinc-700" value={form.editorCost} onChange={e => set("editorCost", e.target.value)} /></div>
          <div className="space-y-1"><Label>Deliverables</Label><Input type="number" className="bg-zinc-800 border-zinc-700" value={form.totalDeliverables} onChange={e => set("totalDeliverables", e.target.value)} /></div>
          <div className="space-y-1"><Label>Deadline</Label><Input type="date" className="bg-zinc-800 border-zinc-700" value={form.deadline} onChange={e => set("deadline", e.target.value)} /></div>
          <div className="col-span-2 space-y-1"><Label>Notes</Label><Textarea className="bg-zinc-800 border-zinc-700" value={form.notes} onChange={e => set("notes", e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="border-zinc-700" onClick={onClose}>Cancel</Button>
          <Button data-testid="button-create-project" onClick={handleSubmit} disabled={create.isPending}>{create.isPending ? "Creating..." : "Create Project"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProjectDetailModal({ project, editors, onClose }: { project: Project; editors: Editor[]; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [tab, setTab] = useState<"overview" | "messages" | "references">("overview");
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ projectName: project.projectName, editorId: project.editorId, totalValue: String(project.totalValue), modelCost: String(project.modelCost), editorCost: String(project.editorCost), totalDeliverables: String(project.totalDeliverables), deadline: project.deadline?.split("T")[0] || "", notes: project.notes || "", status: project.status });
  const [paidAmount, setPaidAmount] = useState(String(project.paidAmount));
  const [msgText, setMsgText] = useState("");
  const [refTitle, setRefTitle] = useState(""); const [refUrl, setRefUrl] = useState("");

  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const updateStatus = useUpdateProjectStatus();
  const setRevision = useSetProjectRevision();
  const updatePayment = useUpdateProjectPayment();
  const sendMsg = useSendMessage();
  const addRef = useAddProjectReference();
  const deleteRef = useDeleteReference();

  const { data: messages } = useListMessages(project.id, { query: { enabled: true, queryKey: ["messages", project.id] as any } });
  const { data: references } = useListProjectReferences(project.id, { query: { enabled: true, queryKey: ["references", project.id] as any } });

  const invalidate = () => qc.invalidateQueries({ queryKey: getListProjectsQueryKey() });

  const netProfit = project.totalValue - project.modelCost - project.editorCost;
  const remaining = project.totalValue - project.paidAmount;

  const handleSaveEdit = () => {
    updateProject.mutate({ projectId: project.id, data: { projectName: editForm.projectName, editorId: editForm.editorId, totalValue: Number(editForm.totalValue), modelCost: Number(editForm.modelCost), editorCost: Number(editForm.editorCost), totalDeliverables: Number(editForm.totalDeliverables), deadline: editForm.deadline || undefined, notes: editForm.notes || undefined, status: editForm.status } }, { onSuccess: () => { invalidate(); setEditing(false); toast({ title: "Project updated" }); }, onError: () => toast({ title: "Update failed", variant: "destructive" }) });
  };

  const handleDelete = () => {
    if (!confirm("Delete this project?")) return;
    deleteProject.mutate({ projectId: project.id }, { onSuccess: () => { invalidate(); onClose(); toast({ title: "Project deleted" }); } });
  };

  const handleSendMsg = () => {
    if (!msgText.trim() || !user) return;
    sendMsg.mutate({ projectId: project.id, data: { senderId: user.id!, senderName: user.name!, senderRole: "admin", text: msgText.trim() } }, { onSuccess: () => { qc.invalidateQueries({ queryKey: ["messages", project.id] as any }); setMsgText(""); } });
  };

  const handleAddRef = () => {
    if (!refTitle.trim()) return;
    addRef.mutate({ projectId: project.id, data: { title: refTitle.trim(), url: refUrl || undefined } }, { onSuccess: () => { qc.invalidateQueries({ queryKey: ["references", project.id] as any }); setRefTitle(""); setRefUrl(""); } });
  };

  const handleUpdatePayment = () => {
    updatePayment.mutate({ projectId: project.id, data: { paidAmount: Number(paidAmount) } }, { onSuccess: () => { invalidate(); toast({ title: "Payment updated" }); } });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl">{project.projectName}</DialogTitle>
              <p className="text-sm text-zinc-400 mt-1">{project.clientName} · {project.editorName}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="border-zinc-700" onClick={() => setEditing(!editing)} data-testid="button-edit-project"><Edit className="w-3.5 h-3.5" /></Button>
              <Button size="sm" variant="outline" className="border-red-900 text-red-400 hover:bg-red-950" onClick={handleDelete} data-testid="button-delete-project"><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex gap-2 border-b border-zinc-800 pb-2">
          {(["overview", "messages", "references"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 text-sm rounded-md transition-colors ${tab === t ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"}`}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="space-y-4">
            {editing ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1"><Label>Project Name</Label><Input className="bg-zinc-800 border-zinc-700" value={editForm.projectName} onChange={e => setEditForm(f => ({ ...f, projectName: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Editor</Label>
                  <Select value={editForm.editorId} onValueChange={v => setEditForm(f => ({ ...f, editorId: v }))}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">{editors.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Status</Label>
                  <Select value={editForm.status} onValueChange={v => setEditForm(f => ({ ...f, status: v as any }))}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">{STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Total Value (₹)</Label><Input type="number" className="bg-zinc-800 border-zinc-700" value={editForm.totalValue} onChange={e => setEditForm(f => ({ ...f, totalValue: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Model Cost (₹)</Label><Input type="number" className="bg-zinc-800 border-zinc-700" value={editForm.modelCost} onChange={e => setEditForm(f => ({ ...f, modelCost: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Editor Cost (₹)</Label><Input type="number" className="bg-zinc-800 border-zinc-700" value={editForm.editorCost} onChange={e => setEditForm(f => ({ ...f, editorCost: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Deliverables</Label><Input type="number" className="bg-zinc-800 border-zinc-700" value={editForm.totalDeliverables} onChange={e => setEditForm(f => ({ ...f, totalDeliverables: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Deadline</Label><Input type="date" className="bg-zinc-800 border-zinc-700" value={editForm.deadline} onChange={e => setEditForm(f => ({ ...f, deadline: e.target.value }))} /></div>
                <div className="col-span-2 space-y-1"><Label>Notes</Label><Textarea className="bg-zinc-800 border-zinc-700" value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} /></div>
                <div className="col-span-2 flex gap-2">
                  <Button size="sm" onClick={handleSaveEdit} disabled={updateProject.isPending}>Save Changes</Button>
                  <Button size="sm" variant="outline" className="border-zinc-700" onClick={() => setEditing(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
                    <p className="text-xs text-zinc-500 mb-1">Total Value</p>
                    <p className="text-lg font-bold text-white">{formatCurrency(project.totalValue)}</p>
                  </div>
                  <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
                    <p className="text-xs text-zinc-500 mb-1">Model Cost</p>
                    <p className="text-lg font-bold text-orange-400">{formatCurrency(project.modelCost)}</p>
                  </div>
                  <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
                    <p className="text-xs text-zinc-500 mb-1">Editor Cost</p>
                    <p className="text-lg font-bold text-yellow-400">{formatCurrency(project.editorCost)}</p>
                  </div>
                  <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20 col-span-3">
                    <p className="text-xs text-zinc-500 mb-1">Net Profit</p>
                    <p className="text-2xl font-bold text-emerald-400">{formatCurrency(netProfit)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">Deliverables</span>
                    <span className="text-zinc-300">{project.completedDeliverables}/{project.totalDeliverables}</span>
                  </div>
                  <ProgressBar value={project.completedDeliverables} max={project.totalDeliverables} />
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-zinc-500">Status:</span> <Badge className={`ml-1 ${statusColors[project.status]}`}>{project.status.replace("_", " ")}</Badge></div>
                  <div><span className="text-zinc-500">Type:</span> <span className="text-zinc-300 ml-1">{project.projectType.replace("_", " ")}</span></div>
                  <div><span className="text-zinc-500">Deadline:</span> <span className="text-zinc-300 ml-1">{formatDate(project.deadline)}</span></div>
                  <div><span className="text-zinc-500">Created:</span> <span className="text-zinc-300 ml-1">{formatDate(project.createdAt)}</span></div>
                  <div><span className="text-zinc-500">Paid:</span> <span className="text-emerald-400 ml-1">{formatCurrency(project.paidAmount)}</span></div>
                  <div><span className="text-zinc-500">Remaining:</span> <span className="text-red-400 ml-1">{formatCurrency(remaining)}</span></div>
                </div>

                {project.notes && <div className="bg-zinc-800/30 rounded-lg p-3 text-sm text-zinc-300 border border-zinc-700/50"><p className="text-xs text-zinc-500 mb-1">Notes</p>{project.notes}</div>}

                <div className="flex items-center gap-2 flex-wrap">
                  {project.revisionRequested && <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20">Customisation Requested</Badge>}
                  <Button size="sm" variant="outline" className="border-zinc-700 text-xs" onClick={() => setRevision.mutate({ projectId: project.id, data: { revisionRequested: !project.revisionRequested } }, { onSuccess: invalidate })}>
                    {project.revisionRequested ? "Clear Customisation" : "Flag Customisation"}
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Input type="number" className="bg-zinc-800 border-zinc-700 w-36" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} placeholder="Paid amount" />
                  <Button size="sm" data-testid="button-update-payment" onClick={handleUpdatePayment} disabled={updatePayment.isPending}><IndianRupee className="w-3.5 h-3.5 mr-1" />Update Payment</Button>
                </div>
              </>
            )}
          </div>
        )}

        {tab === "messages" && (
          <div className="space-y-3">
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {!messages?.length ? <p className="text-zinc-500 text-sm">No messages yet.</p> : messages.map(m => (
                <div key={m.id} className={`flex gap-2 ${m.senderRole === "admin" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-xs rounded-lg px-3 py-2 text-sm ${m.senderRole === "admin" ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-200"}`}>
                    <p className="font-medium text-xs mb-1 opacity-70">{m.senderName}</p>
                    <p>{m.text}</p>
                    <p className="text-xs opacity-50 mt-1">{new Date(m.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input className="bg-zinc-800 border-zinc-700 flex-1" placeholder="Type a message..." value={msgText} onChange={e => setMsgText(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSendMsg()} data-testid="input-message" />
              <Button size="sm" onClick={handleSendMsg} disabled={sendMsg.isPending || !msgText.trim()} data-testid="button-send-message"><MessageSquare className="w-4 h-4" /></Button>
            </div>
          </div>
        )}

        {tab === "references" && (
          <div className="space-y-3">
            <div className="space-y-2">
              {!references?.length ? <p className="text-zinc-500 text-sm">No references yet.</p> : references.map(r => (
                <div key={r.id} className="flex items-start justify-between bg-zinc-800/40 rounded-lg p-3 border border-zinc-700/50">
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{r.title}</p>
                    {r.url && <a href={r.url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 flex items-center gap-1 mt-0.5 hover:underline"><Link2 className="w-3 h-3" />{r.url}</a>}
                  </div>
                  <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 p-1" onClick={() => deleteRef.mutate({ referenceId: r.id }, { onSuccess: () => qc.invalidateQueries({ queryKey: ["references", project.id] as any }) })}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              ))}
            </div>
            <div className="space-y-2 border-t border-zinc-800 pt-3">
              <Input className="bg-zinc-800 border-zinc-700" placeholder="Reference title" value={refTitle} onChange={e => setRefTitle(e.target.value)} data-testid="input-ref-title" />
              <Input className="bg-zinc-800 border-zinc-700" placeholder="URL (optional)" value={refUrl} onChange={e => setRefUrl(e.target.value)} />
              <Button size="sm" onClick={handleAddRef} disabled={!refTitle.trim() || addRef.isPending} data-testid="button-add-reference">Add Reference</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function Projects() {
  const { data: projects, isLoading } = useListProjects({ query: { queryKey: getListProjectsQueryKey() } });
  const { data: editors } = useListEditors({ query: { queryKey: getListEditorsQueryKey() } });
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [selected, setSelected] = useState<Project | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = (projects || []).filter(p => {
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    if (filterType !== "all" && p.projectType !== filterType) return false;
    const q = search.toLowerCase();
    return !q || p.projectName.toLowerCase().includes(q) || p.clientName.toLowerCase().includes(q) || p.editorName.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Projects</h2>
          <p className="text-zinc-400 text-sm mt-0.5">{projects?.length ?? 0} total projects</p>
        </div>
        <Button data-testid="button-new-project" onClick={() => setCreating(true)}><Plus className="w-4 h-4 mr-2" />New Project</Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input data-testid="input-search-projects" className="bg-zinc-900 border-zinc-800 pl-9" placeholder="Search projects, clients, editors..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="bg-zinc-900 border-zinc-800 w-40" data-testid="select-filter-status"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800">
            <SelectItem value="all">All Status</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="bg-zinc-900 border-zinc-800 w-44"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800">
            <SelectItem value="all">All Types</SelectItem>
            {PROJECT_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800">
              {["Project", "Client", "Type", "Status", "Editor", "Value", "Progress", "Deadline"].map(h => (
                <th key={h} className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">{h}</th>
              ))}
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {Array.from({ length: 9 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-zinc-800 rounded" /></td>)}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-12 text-center text-zinc-500">No projects found.</td></tr>
            ) : filtered.map(p => {
              const StatusIcon = statusIcons[p.status];
              return (
                <tr key={p.id} className="hover:bg-zinc-800/30 cursor-pointer transition-colors" onClick={() => setSelected(p)} data-testid={`row-project-${p.id}`}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-sm text-white">{p.projectName}</div>
                    {p.revisionRequested && <span className="text-xs text-orange-400">Customisation</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-300">{p.clientName}</td>
                  <td className="px-4 py-3"><Badge className={`text-xs ${typeColors[p.projectType] || typeColors.other}`}>{p.projectType.replace("_", " ")}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <StatusIcon className={`w-3.5 h-3.5 ${p.status === "completed" ? "text-emerald-400" : p.status === "in_progress" ? "text-blue-400" : "text-yellow-400"}`} />
                      <span className={`text-xs font-medium ${p.status === "completed" ? "text-emerald-400" : p.status === "in_progress" ? "text-blue-400" : "text-yellow-400"}`}>{p.status.replace("_", " ")}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-300">{p.editorName}</td>
                  <td className="px-4 py-3 text-sm font-medium text-white">{formatCurrency(p.totalValue)}</td>
                  <td className="px-4 py-3 w-32"><ProgressBar value={p.completedDeliverables} max={p.totalDeliverables} /></td>
                  <td className="px-4 py-3 text-sm text-zinc-400">{formatDate(p.deadline)}</td>
                  <td className="px-4 py-3"><ChevronRight className="w-4 h-4 text-zinc-600" /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selected && <ProjectDetailModal project={selected} editors={editors || []} onClose={() => setSelected(null)} />}
      {creating && <CreateProjectModal editors={editors || []} onClose={() => setCreating(false)} />}
    </div>
  );
}
