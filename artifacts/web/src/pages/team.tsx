import { useState, useMemo } from "react";
import { useListEditors, useCreateEditor, useDeleteEditor, useListEditorVideos, useReviewVideo, useListEditorProjects } from "@workspace/api-client-react";
import type { Editor } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Search, X, Plus, Trash2, Phone, Mail, MapPin, User, AlertCircle,
  DollarSign, Minus, Check, ChevronDown, ChevronUp, Film, BarChart2,
} from "lucide-react";

const fmt = (n: number) => "₹" + n.toLocaleString("en-IN");
const SPEC_COLORS: Record<string, string> = {
  "Video Editor": "#7c3aed",
  "Graphic Designer": "#ec4899",
  "Social Media Manager": "#0ea5e9",
  "Website Development": "#10b981",
  "Ads Setup": "#f97316",
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    pending: { cls: "bg-yellow-500/10 text-yellow-400", label: "Pending" },
    in_progress: { cls: "bg-blue-500/10 text-blue-400", label: "In Progress" },
    completed: { cls: "bg-emerald-500/10 text-emerald-400", label: "Completed" },
  };
  const { cls, label } = map[status] || map.pending;
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{label}</span>;
}

function EditorDetailModal({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const qc = useQueryClient();
  const [videoTab, setVideoTab] = useState<"stats" | "videos" | "projects">("stats");
  const [showDelete, setShowDelete] = useState(false);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [reviewModal, setReviewModal] = useState<any | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const deleteMut = useDeleteEditor();
  const reviewMut = useReviewVideo();
  const { data: videos = [], refetch: refetchVideos } = useListEditorVideos(editor.id, { query: { refetchInterval: videoTab === "videos" ? 15000 : false as any } });
  const { data: projects = [] } = useListEditorProjects(editor.id);

  const specColor = SPEC_COLORS[editor.specialization] ?? "#6b7280";
  const initials = editor.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const totalRevenue = projects.reduce((s, p) => s + p.totalValue, 0);
  const salary = editor.monthlySalary ?? 0;
  const activeProjects = projects.filter((p) => p.status === "in_progress").length;
  const completedProjects = projects.filter((p) => p.status === "completed").length;
  const pendingProjects = projects.filter((p) => p.status === "pending").length;
  const totalDeliverables = projects.reduce((s, p) => s + p.totalDeliverables, 0);
  const completedDeliverables = projects.reduce((s, p) => s + p.completedDeliverables, 0);
  const approvedVideos = videos.filter((v) => v.status === "approved").length;
  const pendingVideos = videos.filter((v) => v.status === "pending_review").length;

  // Group projects by date
  const projectsByDate = useMemo(() => {
    const groups: Record<string, typeof projects> = {};
    projects.forEach((p) => {
      const date = new Date(p.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
      if (!groups[date]) groups[date] = [];
      groups[date].push(p);
    });
    return Object.entries(groups).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
  }, [projects]);

  async function doDelete() {
    await deleteMut.mutateAsync({ editorId: editor.id });
    qc.invalidateQueries({ queryKey: ["/api/editors"] });
    onClose();
  }

  async function doReview(action: "approved" | "rejected") {
    if (!reviewModal) return;
    await reviewMut.mutateAsync({ videoId: reviewModal.id, data: { status: action, note: reviewNote } });
    refetchVideos();
    setReviewModal(null);
    setReviewNote("");
  }

  const statCards = [
    { label: "Total Projects", value: projects.length, color: "#3b82f6" },
    { label: "Active", value: activeProjects, color: "#10b981" },
    { label: "Completed", value: completedProjects, color: "#8b5cf6" },
    { label: "Pending", value: pendingProjects, color: "#f59e0b" },
    { label: "Deliverables", value: `${completedDeliverables}/${totalDeliverables}`, color: "#06b6d4" },
    { label: "Videos Approved", value: approvedVideos, color: "#10b981" },
    { label: "Pending Review", value: pendingVideos, color: "#ef4444" },
    { label: "Revenue", value: fmt(totalRevenue), color: "#f59e0b" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col z-10 shadow-2xl">
        {/* Delete confirm */}
        {showDelete && (
          <div className="absolute inset-0 bg-zinc-950/95 rounded-2xl flex items-center justify-center z-20 p-8">
            <div className="text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
              <p className="text-white font-semibold">Remove {editor.name}?</p>
              <p className="text-sm text-zinc-400">This will remove the editor from the team.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setShowDelete(false)} className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-sm">Cancel</button>
                <button onClick={doDelete} disabled={deleteMut.isPending} className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm disabled:opacity-50">{deleteMut.isPending ? "..." : "Remove"}</button>
              </div>
            </div>
          </div>
        )}

        {/* Review modal overlay */}
        {reviewModal && (
          <div className="absolute inset-0 bg-zinc-950/95 rounded-2xl flex items-center justify-center z-20 p-8">
            <div className="w-full max-w-sm space-y-4">
              <h3 className="text-white font-bold">Review Video</h3>
              <p className="text-sm text-zinc-400">{reviewModal.fileName} · {reviewModal.projectName}</p>
              <textarea value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} placeholder="Review note (optional)..." rows={3} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white resize-none placeholder-zinc-600" />
              <div className="flex gap-2">
                <button onClick={() => doReview("approved")} disabled={reviewMut.isPending} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-1.5">
                  <Check className="w-4 h-4" />Approve
                </button>
                <button onClick={() => doReview("rejected")} disabled={reviewMut.isPending} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-1.5">
                  <X className="w-4 h-4" />Reject
                </button>
                <button onClick={() => setReviewModal(null)} className="px-3 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-sm">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="p-5 border-b border-zinc-800/60 flex items-center gap-4 flex-shrink-0">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-base font-bold text-white flex-shrink-0" style={{ backgroundColor: specColor + "33", border: `2px solid ${specColor}60` }}>
            <span style={{ color: specColor }}>{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">{editor.name}</h2>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: specColor + "20", color: specColor }}>{editor.specialization}</span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">{editor.email}</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={() => setShowDelete(true)} className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
            <button onClick={onClose} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"><X className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800/60 px-5 flex-shrink-0">
          {(["stats", "videos", "projects"] as const).map((t) => (
            <button key={t} onClick={() => setVideoTab(t)} className={`px-3 py-3 text-sm capitalize border-b-2 transition-colors -mb-px ${videoTab === t ? "border-blue-500 text-blue-400 font-semibold" : "border-transparent text-zinc-500 hover:text-white"}`}>{t}</button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {videoTab === "stats" && (
            <>
              {/* Contact info */}
              <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-4 grid grid-cols-2 gap-2 text-sm">
                {editor.phone && <div className="flex items-center gap-2 text-zinc-300"><Phone className="w-3.5 h-3.5 text-zinc-500" />{editor.phone}</div>}
                {editor.location && <div className="flex items-center gap-2 text-zinc-300"><MapPin className="w-3.5 h-3.5 text-zinc-500" />{editor.location}</div>}
                {editor.bankAccount && <div className="flex items-center gap-2 text-zinc-300 col-span-2"><DollarSign className="w-3.5 h-3.5 text-zinc-500" />{editor.bankAccount}</div>}
              </div>

              {/* 8-stat grid */}
              <div className="grid grid-cols-4 gap-2">
                {statCards.map((s, i) => (
                  <div key={i} className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-3 text-center">
                    <div className="text-lg font-bold" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5 leading-tight">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Financial summary */}
              <div className="bg-yellow-500/8 border border-yellow-500/25 rounded-xl p-4 space-y-2.5">
                <div className="text-xs font-bold text-yellow-400 uppercase tracking-wider mb-3">Financial Summary</div>
                <div className="flex justify-between items-center"><span className="text-sm text-zinc-400">Total Revenue</span><span className="text-sm font-semibold text-white">{fmt(totalRevenue)}</span></div>
                <div className="flex justify-between items-center"><span className="text-sm text-zinc-400 flex items-center gap-1"><Minus className="w-3 h-3 text-red-400" />Monthly Salary</span><span className="text-sm font-semibold text-red-400">− {fmt(salary)}</span></div>
                <div className="h-px bg-yellow-500/30" />
                <div className="flex justify-between items-center"><span className="text-sm font-bold text-white">Net Profit</span><span className="text-base font-bold text-emerald-400">{fmt(totalRevenue - salary)}</span></div>
              </div>
            </>
          )}

          {videoTab === "videos" && (
            <div className="space-y-2">
              <div className="text-xs text-zinc-500">{videos.length} submitted file{videos.length !== 1 ? "s" : ""}</div>
              {videos.length === 0 ? (
                <div className="text-center py-10">
                  <Film className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                  <p className="text-sm text-zinc-500">No submitted files</p>
                </div>
              ) : (
                videos.map((v) => (
                  <div key={v.id} className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{v.fileName}</p>
                        <p className="text-xs text-zinc-500">{v.projectName} · {v.fileSize}</p>
                        <p className="text-[10px] text-zinc-600">{new Date(v.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                      {v.status === "pending_review" ? (
                        <button onClick={() => setReviewModal(v)} className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex-shrink-0">Review</button>
                      ) : (
                        <span className={`text-xs px-2 py-1 rounded-lg font-medium flex-shrink-0 ${v.status === "approved" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                          {v.status === "approved" ? "Approved" : "Rejected"}
                        </span>
                      )}
                    </div>
                    {v.reviewNote && <p className="text-xs text-zinc-500 bg-zinc-800/60 rounded-lg px-2 py-1">{v.reviewNote}</p>}
                  </div>
                ))
              )}
            </div>
          )}

          {videoTab === "projects" && (
            <div className="space-y-2">
              {projectsByDate.length === 0 ? (
                <div className="text-center py-10 text-zinc-500 text-sm">No projects assigned</div>
              ) : (
                projectsByDate.map(([date, dateProjects]) => (
                  <div key={date} className="bg-zinc-900 border border-zinc-800/60 rounded-xl overflow-hidden">
                    <button onClick={() => setExpandedDate(expandedDate === date ? null : date)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/50 transition-colors">
                      <span className="text-xs font-semibold text-zinc-400">{date}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-600">{dateProjects.length} project{dateProjects.length !== 1 ? "s" : ""}</span>
                        {expandedDate === date ? <ChevronUp className="w-3.5 h-3.5 text-zinc-500" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />}
                      </div>
                    </button>
                    {expandedDate === date && (
                      <div className="border-t border-zinc-800/60 divide-y divide-zinc-800/40">
                        {dateProjects.map((p) => (
                          <div key={p.id} className="px-4 py-3 flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">{p.projectName}</p>
                              <p className="text-xs text-zinc-500">{p.clientName} · {fmt(p.totalValue)}</p>
                            </div>
                            <StatusBadge status={p.status} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EditorCard({ editor, onOpen }: { editor: Editor; onOpen: () => void }) {
  const specColor = SPEC_COLORS[editor.specialization] ?? "#6b7280";
  const initials = editor.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div onClick={onOpen} className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-4 cursor-pointer hover:border-zinc-700 hover:bg-zinc-800/40 transition-all duration-150 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ backgroundColor: specColor + "22", border: `1.5px solid ${specColor}50` }}>
          <span style={{ color: specColor }}>{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{editor.name}</p>
          <p className="text-xs font-medium truncate" style={{ color: specColor }}>{editor.specialization}</p>
        </div>
        <BarChart2 className="w-4 h-4 text-zinc-600 flex-shrink-0" />
      </div>
      <div className="flex items-center gap-3 text-xs text-zinc-500 flex-wrap">
        {editor.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{editor.phone}</span>}
        {editor.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{editor.location}</span>}
      </div>
      {editor.monthlySalary && (
        <div className="text-xs text-zinc-500 flex items-center gap-1">
          <DollarSign className="w-3 h-3" />Salary: <span className="text-white font-medium">{fmt(editor.monthlySalary)}/mo</span>
        </div>
      )}
    </div>
  );
}

function AddEditorModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const createMut = useCreateEditor();
  const [form, setForm] = useState({
    name: "", email: "", username: "", password: "", phone: "",
    specialization: "Video Editor", location: "", bankAccount: "", monthlySalary: "",
  });
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.username || !form.password) { setError("Name, email, username and password are required"); return; }
    try {
      await createMut.mutateAsync({ data: { ...form, monthlySalary: form.monthlySalary ? +form.monthlySalary : 0 } });
      qc.invalidateQueries({ queryKey: ["/api/editors"] });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to add editor");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md z-10 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/60 sticky top-0 bg-zinc-950">
          <h2 className="text-base font-bold text-white">Add Team Member</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          {error && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</div>}
          {[
            { key: "name", label: "Full Name *", placeholder: "Alice Johnson" },
            { key: "email", label: "Email *", placeholder: "alice@example.com" },
            { key: "username", label: "Username *", placeholder: "alice" },
            { key: "password", label: "Password *", placeholder: "••••••••", type: "password" },
            { key: "phone", label: "Phone", placeholder: "+91 9999..." },
            { key: "location", label: "Location", placeholder: "Mumbai" },
            { key: "bankAccount", label: "Bank Account", placeholder: "HDFC XXXX XXXX" },
            { key: "monthlySalary", label: "Monthly Salary (₹)", placeholder: "25000", type: "number" },
          ].map(({ key, label, placeholder, type = "text" }) => (
            <div key={key}>
              <label className="text-xs text-zinc-500 block mb-1">{label}</label>
              <input type={type} value={(form as any)[key]} onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600" />
            </div>
          ))}
          <div>
            <label className="text-xs text-zinc-500 block mb-1">Specialization *</label>
            <select value={form.specialization} onChange={(e) => setForm(f => ({ ...f, specialization: e.target.value }))} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white">
              {Object.keys(SPEC_COLORS).map((s) => <option key={s} value={s}>{s}</option>)}
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={createMut.isPending} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {createMut.isPending ? "Adding..." : "Add Member"}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700 transition-colors">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Team() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Editor | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const { data: editors = [], isLoading } = useListEditors({ query: { refetchInterval: 30000 } });

  const filtered = useMemo(() =>
    search.trim() ? editors.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()) || e.specialization.toLowerCase().includes(search.toLowerCase())) : editors
  , [editors, search]);

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Team</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{editors.length} team members</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
          <Plus className="w-4 h-4" />Add Member
        </button>
      </div>

      {/* Specialization breakdown */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(SPEC_COLORS).map(([spec, color]) => {
          const count = editors.filter((e) => e.specialization === spec).length;
          if (count === 0) return null;
          return (
            <div key={spec} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium" style={{ backgroundColor: color + "20", color }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
              {spec} ({count})
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search team members..." className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800/60 rounded-xl text-sm text-white placeholder-zinc-600" />
        {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"><X className="w-3.5 h-3.5" /></button>}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="bg-zinc-900 border border-zinc-800/60 rounded-2xl h-28 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <User className="w-12 h-12 text-zinc-700 mx-auto" />
          <p className="text-zinc-400">{search ? "No team members match your search" : "No team members yet"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((e) => <EditorCard key={e.id} editor={e} onOpen={() => setSelected(e)} />)}
        </div>
      )}

      {selected && <EditorDetailModal editor={selected} onClose={() => setSelected(null)} />}
      {showAdd && <AddEditorModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
