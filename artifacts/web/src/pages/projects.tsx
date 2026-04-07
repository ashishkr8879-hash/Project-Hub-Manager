import { useState, useMemo } from "react";
import {
  useListProjects, useListEditors, useUpdateProject, useDeleteProject,
  useUpdateProjectPayment, useListProjectReferences,
  useAddProjectReference, useDeleteReference, useListMessages, useSendMessage,
} from "@workspace/api-client-react";
import type { Project, UpdateProjectBody } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Search, X, Phone, Mail, User, Calendar, Link2,
  Trash2, Plus, Send, MessageCircle, Edit2, AlertCircle,
  DollarSign, Minus, ExternalLink,
} from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  ugc: "UGC", ai_video: "AI Video", editing: "Editing", branded: "Branded",
  corporate: "Corporate", wedding: "Wedding", social_media: "Social Media",
  graphic_design: "Graphic Design", ads_setup: "Ads Setup", website: "Website", other: "Other",
};
const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  ugc: { bg: "#fef3c7", text: "#92400e" }, branded: { bg: "#dbeafe", text: "#1e40af" },
  corporate: { bg: "#f3f4f6", text: "#374151" }, wedding: { bg: "#fce7f3", text: "#9d174d" },
  social_media: { bg: "#ede9fe", text: "#6d28d9" }, ai_video: { bg: "#d1fae5", text: "#065f46" },
  editing: { bg: "#ffedd5", text: "#9a3412" }, graphic_design: { bg: "#fdf4ff", text: "#7e22ce" },
  ads_setup: { bg: "#fff7ed", text: "#c2410c" }, website: { bg: "#ecfdf5", text: "#065f46" },
  other: { bg: "#f3f4f6", text: "#6b7280" },
};
const STATUS_OPTS = ["All", "Pending", "In Progress", "Completed"];
const statusKey = (s: string) => s === "In Progress" ? "in_progress" : s.toLowerCase();
const fmt = (n: number) => "₹" + n.toLocaleString("en-IN");

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string; dot: string }> = {
    pending: { cls: "bg-yellow-500/10 text-yellow-400", label: "Pending", dot: "bg-yellow-400" },
    in_progress: { cls: "bg-blue-500/10 text-blue-400", label: "In Progress", dot: "bg-blue-400" },
    completed: { cls: "bg-emerald-500/10 text-emerald-400", label: "Completed", dot: "bg-emerald-400" },
  };
  const { cls, label, dot } = map[status] || map.pending;
  return (
    <span className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />{label}
    </span>
  );
}

function ProgressBar({ completed, total, status }: { completed: number; total: number; status: string }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-zinc-500">
        <span>{completed}/{total} deliverables</span><span>{pct}%</span>
      </div>
      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: status === "completed" ? "#10b981" : "#3b82f6" }} />
      </div>
    </div>
  );
}

function ProjectCard({ project, onOpen }: { project: Project; onOpen: () => void }) {
  const typeInfo = TYPE_COLORS[project.projectType] ?? TYPE_COLORS.other;
  const typeLabel = TYPE_LABELS[project.projectType] ?? "Other";
  return (
    <div onClick={onOpen} className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-4 cursor-pointer hover:border-zinc-700 hover:bg-zinc-800/40 transition-all duration-150 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-white truncate">{project.projectName}</span>
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold flex-shrink-0" style={{ backgroundColor: typeInfo.bg, color: typeInfo.text }}>{typeLabel}</span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">{project.clientName}</p>
        </div>
        <StatusBadge status={project.status} />
      </div>
      <ProgressBar completed={project.completedDeliverables} total={project.totalDeliverables} status={project.status} />
      <div className="flex items-center justify-between text-xs flex-wrap gap-2">
        <div className="flex items-center gap-1 text-emerald-400">
          <DollarSign className="w-3 h-3" /><span className="font-semibold">{fmt(project.totalValue)}</span>
        </div>
        {project.editorName && <div className="flex items-center gap-1 text-zinc-500"><User className="w-3 h-3" /><span>{project.editorName}</span></div>}
        {project.deadline && <div className="flex items-center gap-1 text-amber-400"><Calendar className="w-3 h-3" /><span>Due {new Date(project.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span></div>}
      </div>
    </div>
  );
}

function ProjectDetailModal({ project, onClose, editors }: { project: Project; onClose: () => void; editors: any[] }) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"overview" | "references" | "chat">("overview");
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UpdateProjectBody>>({
    projectName: project.projectName, totalValue: project.totalValue,
    modelCost: project.modelCost, editorCost: project.editorCost,
    totalDeliverables: project.totalDeliverables, completedDeliverables: project.completedDeliverables,
    deadline: project.deadline, notes: project.notes, script: project.script,
    status: project.status, editorId: project.editorId,
  });
  const [paidAmt, setPaidAmt] = useState(project.paidAmount);
  const [editingPayment, setEditingPayment] = useState(false);
  const [newRefTitle, setNewRefTitle] = useState("");
  const [newRefUrl, setNewRefUrl] = useState("");
  const [newRefNote, setNewRefNote] = useState("");
  const [addingRef, setAddingRef] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const updateMut = useUpdateProject();
  const deleteMut = useDeleteProject();
  const paymentMut = useUpdateProjectPayment();
  const { data: refs = [], refetch: refetchRefs } = useListProjectReferences(project.id);
  const addRefMut = useAddProjectReference();
  const deleteRefMut = useDeleteReference();
  const { data: messages = [], refetch: refetchMsgs } = useListMessages(project.id, { query: { refetchInterval: tab === "chat" ? 10000 : false as any } });
  const sendMsgMut = useSendMessage();

  const pending = project.totalValue - paidAmt;

  async function saveEdit() {
    await updateMut.mutateAsync({ projectId: project.id, data: editForm as UpdateProjectBody });
    qc.invalidateQueries({ queryKey: ["/api/projects"] });
    setEditing(false);
  }
  async function savePayment() {
    await paymentMut.mutateAsync({ projectId: project.id, data: { paidAmount: paidAmt } });
    qc.invalidateQueries({ queryKey: ["/api/projects"] });
    setEditingPayment(false);
  }
  async function doDelete() {
    await deleteMut.mutateAsync({ projectId: project.id });
    qc.invalidateQueries({ queryKey: ["/api/projects"] });
    onClose();
  }
  async function addRef() {
    if (!newRefTitle || !newRefUrl) return;
    await addRefMut.mutateAsync({ projectId: project.id, data: { title: newRefTitle, url: newRefUrl, note: newRefNote, fileName: undefined, fileType: undefined } });
    refetchRefs();
    setNewRefTitle(""); setNewRefUrl(""); setNewRefNote(""); setAddingRef(false);
  }
  async function sendMsg() {
    if (!msgText.trim()) return;
    const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
    await sendMsgMut.mutateAsync({ projectId: project.id, data: { text: msgText, senderId: user.id || "admin", senderName: user.name || "Admin", senderRole: "admin" } });
    refetchMsgs();
    setMsgText("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col z-10 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-zinc-800/60 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-white">{project.projectName}</h2>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold flex-shrink-0" style={{ backgroundColor: TYPE_COLORS[project.projectType]?.bg ?? "#f3f4f6", color: TYPE_COLORS[project.projectType]?.text ?? "#6b7280" }}>{TYPE_LABELS[project.projectType] ?? "Other"}</span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">{project.clientName}</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
            {!editing && <button onClick={() => setEditing(true)} className="p-2 rounded-lg text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"><Edit2 className="w-4 h-4" /></button>}
            <button onClick={() => setShowDeleteConfirm(true)} className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
            <button onClick={onClose} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"><X className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Delete confirm overlay */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-zinc-950/95 rounded-2xl flex items-center justify-center z-20 p-8">
            <div className="text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
              <p className="text-white font-semibold">Delete "{project.projectName}"?</p>
              <p className="text-sm text-zinc-400">This action cannot be undone.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700 transition-colors">Cancel</button>
                <button onClick={doDelete} disabled={deleteMut.isPending} className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-50 transition-colors">
                  {deleteMut.isPending ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-zinc-800/60 px-5 flex-shrink-0">
          {(["overview", "references", "chat"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-3 py-3 text-sm capitalize border-b-2 transition-colors -mb-px ${tab === t ? "border-blue-500 text-blue-400 font-semibold" : "border-transparent text-zinc-500 hover:text-white"}`}>{t}</button>
          ))}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {tab === "overview" && (
            <>
              {/* Status row */}
              <div className="flex items-center justify-between gap-3">
                <StatusBadge status={editing ? (editForm.status ?? "pending") : project.status} />
                {editing && (
                  <select value={editForm.status} onChange={(e) => setEditForm(f => ({ ...f, status: e.target.value as any }))} className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white">
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                )}
              </div>

              {!editing && <ProgressBar completed={project.completedDeliverables} total={project.totalDeliverables} status={project.status} />}
              {editing && (
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-xs text-zinc-500 block mb-1">Completed Deliverables</label><input type="number" value={editForm.completedDeliverables} onChange={(e) => setEditForm(f => ({ ...f, completedDeliverables: +e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" /></div>
                  <div><label className="text-xs text-zinc-500 block mb-1">Total Deliverables</label><input type="number" value={editForm.totalDeliverables} onChange={(e) => setEditForm(f => ({ ...f, totalDeliverables: +e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" /></div>
                </div>
              )}

              {/* Financial Breakdown (same as mobile yellow box) */}
              <div className="bg-yellow-500/8 border border-yellow-500/25 rounded-xl p-4 space-y-2.5">
                <div className="text-xs font-bold text-yellow-400 uppercase tracking-wider mb-3">Financial Breakdown</div>
                {editing ? (
                  <div className="space-y-2">
                    <div><label className="text-xs text-zinc-400 block mb-1">Project Name</label><input value={editForm.projectName} onChange={(e) => setEditForm(f => ({ ...f, projectName: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" /></div>
                    <div className="grid grid-cols-3 gap-2">
                      <div><label className="text-xs text-zinc-400 block mb-1">Total Value (₹)</label><input type="number" value={editForm.totalValue} onChange={(e) => setEditForm(f => ({ ...f, totalValue: +e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" /></div>
                      <div><label className="text-xs text-zinc-400 block mb-1">Model Cost (₹)</label><input type="number" value={editForm.modelCost} onChange={(e) => setEditForm(f => ({ ...f, modelCost: +e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" /></div>
                      <div><label className="text-xs text-zinc-400 block mb-1">Editor Cost (₹)</label><input type="number" value={editForm.editorCost} onChange={(e) => setEditForm(f => ({ ...f, editorCost: +e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" /></div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center"><span className="text-sm text-zinc-400">Total Value</span><span className="text-sm font-semibold text-white">{fmt(project.totalValue)}</span></div>
                    <div className="flex justify-between items-center"><span className="text-sm text-zinc-400 flex items-center gap-1"><Minus className="w-3 h-3 text-red-400" />Model Cost</span><span className="text-sm font-semibold text-red-400">− {fmt(project.modelCost)}</span></div>
                    <div className="flex justify-between items-center"><span className="text-sm text-zinc-400 flex items-center gap-1"><Minus className="w-3 h-3 text-orange-400" />Editor Cost</span><span className="text-sm font-semibold text-orange-400">− {fmt(project.editorCost)}</span></div>
                    <div className="h-px bg-yellow-500/30" />
                    <div className="flex justify-between items-center"><span className="text-sm font-bold" style={{ color: '#1e293b' }}>Net Profit</span><span className="text-base font-bold text-emerald-400">{fmt(project.totalValue - project.modelCost - project.editorCost)}</span></div>
                  </>
                )}
              </div>

              {/* Payment Tracking */}
              {!editing && (
                <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Payment Tracking</div>
                    <button onClick={() => setEditingPayment(!editingPayment)} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">{editingPayment ? "Cancel" : "Edit"}</button>
                  </div>
                  {editingPayment ? (
                    <div className="flex gap-2">
                      <input type="number" value={paidAmt} onChange={(e) => setPaidAmt(+e.target.value)} className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" placeholder="Paid amount ₹" />
                      <button onClick={savePayment} disabled={paymentMut.isPending} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors">
                        {paymentMut.isPending ? "..." : "Save"}
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-emerald-500/10 rounded-xl p-2.5"><div className="text-[10px] text-emerald-400 mb-1">Received</div><div className="text-sm font-bold text-emerald-400">{fmt(project.paidAmount)}</div></div>
                        <div className="bg-red-500/10 rounded-xl p-2.5"><div className="text-[10px] text-red-400 mb-1">Pending</div><div className="text-sm font-bold text-red-400">{fmt(pending)}</div></div>
                        <div className="bg-zinc-800 rounded-xl p-2.5"><div className="text-[10px] text-zinc-400 mb-1">Total</div><div className="text-sm font-bold text-white">{fmt(project.totalValue)}</div></div>
                      </div>
                      <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${project.totalValue > 0 ? Math.min((project.paidAmount / project.totalValue) * 100, 100) : 0}%` }} />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Client & Editor */}
              {!editing && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-3 space-y-2">
                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Client</div>
                    <div className="text-sm font-semibold text-white">{project.clientName}</div>
                    {project.clientPhone && <a href={`tel:${project.clientPhone}`} className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"><Phone className="w-3 h-3" />{project.clientPhone}</a>}
                    {project.clientEmail && <div className="flex items-center gap-1.5 text-xs text-zinc-500"><Mail className="w-3 h-3" />{project.clientEmail}</div>}
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-3 space-y-2">
                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Editor</div>
                    <div className="text-sm font-semibold text-white">{project.editorName || "Unassigned"}</div>
                    {project.editorPhone && <div className="flex items-center gap-1.5 text-xs text-zinc-500"><Phone className="w-3 h-3" />{project.editorPhone}</div>}
                    {project.deadline && <div className="flex items-center gap-1.5 text-xs text-amber-400"><Calendar className="w-3 h-3" />Due {new Date(project.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>}
                  </div>
                </div>
              )}

              {/* Notes / Script */}
              {!editing && (project.notes || project.script) && (
                <div className="space-y-3">
                  {project.notes && (<div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-3"><div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Notes</div><p className="text-sm text-zinc-300 whitespace-pre-wrap">{project.notes}</p></div>)}
                  {project.script && (<div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-3"><div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Script</div><p className="text-sm text-zinc-300 whitespace-pre-wrap">{project.script}</p></div>)}
                </div>
              )}

              {/* Edit fields */}
              {editing && (
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">Assign Editor</label>
                    <select value={editForm.editorId} onChange={(e) => setEditForm(f => ({ ...f, editorId: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white">
                      <option value="">-- Select Editor --</option>
                      {editors.map((ed) => <option key={ed.id} value={ed.id}>{ed.name}</option>)}
                    </select>
                  </div>
                  <div><label className="text-xs text-zinc-500 block mb-1">Deadline</label><input type="date" value={editForm.deadline?.split("T")[0] ?? ""} onChange={(e) => setEditForm(f => ({ ...f, deadline: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" /></div>
                  <div><label className="text-xs text-zinc-500 block mb-1">Notes</label><textarea rows={3} value={editForm.notes ?? ""} onChange={(e) => setEditForm(f => ({ ...f, notes: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white resize-none" /></div>
                  <div><label className="text-xs text-zinc-500 block mb-1">Script</label><textarea rows={3} value={editForm.script ?? ""} onChange={(e) => setEditForm(f => ({ ...f, script: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white resize-none" /></div>
                </div>
              )}

              {editing && (
                <div className="flex gap-2 pt-2">
                  <button onClick={saveEdit} disabled={updateMut.isPending} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
                    {updateMut.isPending ? "Saving..." : "Save Changes"}
                  </button>
                  <button onClick={() => setEditing(false)} className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700 transition-colors">Cancel</button>
                </div>
              )}
            </>
          )}

          {tab === "references" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">References</h3>
                <button onClick={() => setAddingRef(!addingRef)} className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  <Plus className="w-3.5 h-3.5" />Add Reference
                </button>
              </div>
              {addingRef && (
                <div className="bg-zinc-800/60 border border-zinc-700/60 rounded-xl p-4 space-y-2">
                  <input value={newRefTitle} onChange={(e) => setNewRefTitle(e.target.value)} placeholder="Title" className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600" />
                  <input value={newRefUrl} onChange={(e) => setNewRefUrl(e.target.value)} placeholder="URL (https://...)" className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600" />
                  <input value={newRefNote} onChange={(e) => setNewRefNote(e.target.value)} placeholder="Note (optional)" className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600" />
                  <div className="flex gap-2">
                    <button onClick={addRef} disabled={addRefMut.isPending || !newRefTitle || !newRefUrl} className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors">Add</button>
                    <button onClick={() => setAddingRef(false)} className="px-4 py-2 rounded-xl bg-zinc-700 text-zinc-300 text-sm hover:bg-zinc-600 transition-colors">Cancel</button>
                  </div>
                </div>
              )}
              {refs.length === 0 ? (
                <div className="text-center py-10 text-zinc-500">
                  <Link2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No references yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {refs.map((ref) => (
                    <div key={ref.id} className="flex items-start gap-3 p-3 bg-zinc-800/60 border border-zinc-700/60 rounded-xl">
                      <Link2 className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{ref.title}</p>
                        {ref.url && <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-0.5"><ExternalLink className="w-3 h-3 flex-shrink-0" /><span className="truncate">{ref.url}</span></a>}
                        {ref.note && <p className="text-xs text-zinc-500 mt-0.5">{ref.note}</p>}
                      </div>
                      <button onClick={async () => { await deleteRefMut.mutateAsync({ refId: ref.id }); refetchRefs(); }} className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "chat" && (
            <div className="flex flex-col space-y-3" style={{ minHeight: "320px" }}>
              <div className="flex-1 overflow-y-auto space-y-2 max-h-56">
                {messages.length === 0 ? (
                  <div className="text-center py-10 text-zinc-500">
                    <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isAdmin = msg.senderRole === "admin";
                    return (
                      <div key={msg.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${isAdmin ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-100"}`}>
                          {!isAdmin && <p className="text-[10px] font-semibold text-zinc-400 mb-0.5">{msg.senderName}</p>}
                          <p className="text-sm">{msg.text}</p>
                          <p className={`text-[10px] mt-0.5 ${isAdmin ? "text-blue-200" : "text-zinc-500"}`}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <input value={msgText} onChange={(e) => setMsgText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMsg()} placeholder="Type a message..." className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600" />
                <button onClick={sendMsg} disabled={sendMsgMut.isPending || !msgText.trim()} className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Projects() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Project | null>(null);
  const { data: projects = [], isLoading } = useListProjects({ query: { refetchInterval: 30000 } });
  const { data: editors = [] } = useListEditors();

  const filtered = useMemo(() => {
    let list = projects;
    if (filter !== "All") list = list.filter((p) => p.status === statusKey(filter));
    if (search.trim()) list = list.filter((p) =>
      p.projectName.toLowerCase().includes(search.toLowerCase()) ||
      p.clientName.toLowerCase().includes(search.toLowerCase())
    );
    return list;
  }, [projects, filter, search]);

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#0d3f7a' }}>Projects</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{projects.length} total projects</p>
        </div>
        <Link href="/create" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
          + New Project
        </Link>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects..." className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800/60 rounded-xl text-sm text-white placeholder-zinc-600" />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"><X className="w-3.5 h-3.5" /></button>}
        </div>
        <div className="flex gap-2">
          {STATUS_OPTS.map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${filter === s ? "bg-blue-500 text-white" : "bg-zinc-900 border border-zinc-800/60 text-zinc-400 hover:text-white hover:border-zinc-700"}`}>{s}</button>
          ))}
        </div>
      </div>

      <div className="text-xs text-zinc-500">{filtered.length} project{filtered.length !== 1 ? "s" : ""}</div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="bg-zinc-900 border border-zinc-800/60 rounded-2xl h-40 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <AlertCircle className="w-12 h-12 text-zinc-700 mx-auto" />
          <p className="text-zinc-400">{search ? "No projects match your search" : "No projects yet. Create one!"}</p>
          {!search && <Link href="/create" className="text-sm text-blue-400 hover:text-blue-300 block">+ Create Project</Link>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p) => <ProjectCard key={p.id} project={p} onOpen={() => setSelected(p)} />)}
        </div>
      )}

      {selected && <ProjectDetailModal project={selected} onClose={() => setSelected(null)} editors={editors} />}
    </div>
  );
}
