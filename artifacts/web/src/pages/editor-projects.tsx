import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useListEditorProjects, useSubmitVideo, useListMessages, useSendMessage, useUpdateProjectStatus, useListProjectReferences } from "@workspace/api-client-react";
import {
  Clock, CheckCircle2, ChevronDown, ChevronUp, Upload, MessageSquare, Send, AlertCircle, X, FileImage, FileVideo, FileText, Globe, BarChart2, Link2, Paperclip, BookOpen, ExternalLink,
} from "lucide-react";

const STATUS_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  pending:     { label: "Pending",     bg: "bg-zinc-700/50",    text: "text-zinc-300" },
  in_progress: { label: "In Progress", bg: "bg-blue-500/15",    text: "text-blue-400" },
  completed:   { label: "Completed",   bg: "bg-emerald-500/15", text: "text-emerald-400" },
};

const TYPE_LABELS: Record<string, string> = {
  ugc: "UGC", ai_video: "AI Video", editing: "Editing", branded: "Branded",
  corporate: "Corporate", wedding: "Wedding", social_media: "Social Media",
  graphic_design: "Graphic Design", ads_setup: "Ads Setup", website: "Website", other: "Other",
};

// What each specialization submits
const SPEC_UPLOAD: Record<string, { label: string; hint: string; icon: React.ElementType; color: string }> = {
  "Video Editor":          { label: "Submit Video",   hint: "e.g. project_final_v2.mp4",    icon: FileVideo,  color: "#7c3aed" },
  "Graphic Designer":      { label: "Submit Design",  hint: "e.g. logo_final.jpg / flyer.pdf", icon: FileImage,  color: "#ec4899" },
  "Social Media Manager":  { label: "Submit Content", hint: "e.g. week1_posts.pdf / reel.mp4", icon: FileText,   color: "#0ea5e9" },
  "Website Development":   { label: "Submit Work",    hint: "e.g. website_build.zip / link",    icon: Globe,      color: "#10b981" },
  "Ads Setup":             { label: "Submit Report",  hint: "e.g. campaign_report.pdf",          icon: BarChart2,  color: "#f97316" },
};

function daysLeft(deadline: string) {
  const d = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  if (d < 0) return { text: `${Math.abs(d)}d overdue`, color: "#ef4444" };
  if (d === 0) return { text: "Due today!", color: "#f59e0b" };
  return { text: `${d} days left`, color: d <= 3 ? "#f59e0b" : "#6b7280" };
}

function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function SubmitWorkModal({
  projectId, editorId, specialization, onClose, onDone,
}: { projectId: string; editorId: string; specialization: string; onClose: () => void; onDone: () => void }) {
  const [mode, setMode] = useState<"upload" | "link">("upload");

  // Upload mode state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);

  // Link mode state
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");

  const [deliverableIndex, setDeliverableIndex] = useState("1");
  const [done, setDone] = useState(false);
  const submitMut = useSubmitVideo();

  const cfg = SPEC_UPLOAD[specialization] ?? SPEC_UPLOAD["Video Editor"];
  const Icon = cfg.icon;

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false);
    if (e.dataTransfer.files?.[0]) setSelectedFile(e.dataTransfer.files[0]);
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  async function submit() {
    const canSubmitUpload = mode === "upload" && selectedFile;
    const canSubmitLink   = mode === "link" && linkUrl.trim();
    if (!canSubmitUpload && !canSubmitLink) return;

    let hostFallback = linkUrl.trim();
    try { hostFallback = new URL(linkUrl.trim()).hostname; } catch { /* keep raw */ }
    const fileName = mode === "upload"
      ? selectedFile!.name
      : (linkTitle.trim() || hostFallback);
    const fileSize = mode === "upload"
      ? formatBytes(selectedFile!.size)
      : "—";
    const submissionLink = mode === "link" ? linkUrl.trim() : undefined;

    await submitMut.mutateAsync({
      projectId,
      data: {
        editorId,
        fileName,
        fileSize,
        deliverableIndex: +deliverableIndex || 1,
        submissionLink,
        submissionType: mode,
      } as any,
    });
    setDone(true);
    setTimeout(onDone, 900);
  }

  const canSubmit = mode === "upload" ? !!selectedFile : !!linkUrl.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-sm z-10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/60">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Icon className="w-4 h-4" style={{ color: cfg.color }} />{cfg.label}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Mode toggle */}
          <div className="flex bg-zinc-900 border border-zinc-800/60 rounded-xl p-1 gap-1">
            <button
              onClick={() => setMode("upload")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${mode === "upload" ? "text-white" : "text-zinc-400 hover:text-zinc-200"}`}
              style={mode === "upload" ? { backgroundColor: cfg.color } : {}}
            >
              <Upload className="w-3.5 h-3.5" />Upload File
            </button>
            <button
              onClick={() => setMode("link")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${mode === "link" ? "text-white" : "text-zinc-400 hover:text-zinc-200"}`}
              style={mode === "link" ? { backgroundColor: cfg.color } : {}}
            >
              <Link2 className="w-3.5 h-3.5" />Submit Link
            </button>
          </div>

          {/* Upload mode */}
          {mode === "upload" && (
            <div>
              <input
                type="file"
                id="file-upload-input"
                className="hidden"
                onChange={handleFilePick}
              />
              <label
                htmlFor="file-upload-input"
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center w-full min-h-[140px] rounded-2xl border-2 border-dashed cursor-pointer transition-all ${dragging ? "scale-[1.01]" : ""}`}
                style={{
                  borderColor: dragging ? cfg.color : (selectedFile ? cfg.color + "80" : "rgba(255,255,255,0.1)"),
                  backgroundColor: selectedFile
                    ? cfg.color + "10"
                    : dragging ? cfg.color + "08" : "rgba(255,255,255,0.02)",
                }}
              >
                {selectedFile ? (
                  <div className="text-center px-4">
                    <Icon className="w-8 h-8 mx-auto mb-2" style={{ color: cfg.color }} />
                    <p className="text-sm font-semibold text-white truncate max-w-[240px]">{selectedFile.name}</p>
                    <p className="text-xs text-zinc-400 mt-1">{formatBytes(selectedFile.size)}</p>
                    <p className="text-[10px] mt-2 font-medium" style={{ color: cfg.color }}>Click to change file</p>
                  </div>
                ) : (
                  <div className="text-center px-4">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
                    <p className="text-sm font-semibold text-white">Click to upload or drag & drop</p>
                    <p className="text-xs text-zinc-500 mt-1">{cfg.hint}</p>
                  </div>
                )}
              </label>
            </div>
          )}

          {/* Link mode */}
          {mode === "link" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-500 block mb-1.5">Drive / Dropbox / YouTube Link *</label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                  <input
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full pl-9 pr-3 py-2.5 bg-zinc-900 border border-zinc-800/60 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-500 block mb-1.5">Title / Description</label>
                <input
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  placeholder={cfg.hint}
                  className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800/60 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
                />
              </div>
            </div>
          )}

          {/* Deliverable # */}
          <div>
            <label className="text-xs text-zinc-500 block mb-1.5">Deliverable #</label>
            <input
              type="number" min="1"
              value={deliverableIndex}
              onChange={(e) => setDeliverableIndex(e.target.value)}
              className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800/60 rounded-xl text-sm text-white focus:outline-none focus:border-zinc-600"
            />
          </div>

          {done && (
            <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2 text-center">
              ✓ Submitted successfully!
            </p>
          )}

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={submit}
              disabled={!canSubmit || submitMut.isPending || done}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              style={{ backgroundColor: cfg.color }}
            >
              {submitMut.isPending
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Submitting...</>
                : mode === "upload"
                  ? <><Upload className="w-4 h-4" />{cfg.label}</>
                  : <><Link2 className="w-4 h-4" />Submit Link</>}
            </button>
            <button onClick={onClose} className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectReferences({ projectId, color }: { projectId: string; color: string }) {
  const { data: refs = [] } = useListProjectReferences(projectId, { query: { staleTime: 60000 } });
  if (refs.length === 0) return null;
  return (
    <div className="border border-zinc-800/60 rounded-xl overflow-hidden">
      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-3 py-2 border-b border-zinc-800/60 bg-zinc-900/40 flex items-center gap-1.5">
        <BookOpen className="w-3 h-3" />Briefs & References from Admin
      </div>
      <div className="p-2 space-y-1.5">
        {refs.map((r: any) => (
          <div key={r.id} className="flex items-center gap-2 px-2.5 py-2 bg-zinc-800/40 rounded-lg">
            {r.url ? <Link2 className="w-3 h-3 flex-shrink-0" style={{ color }} /> : <Paperclip className="w-3 h-3 flex-shrink-0" style={{ color }} />}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{r.title}</p>
              {r.note && r.note !== "attachment" && r.note !== "reference" && (
                <p className="text-[10px] text-zinc-500">{r.note}</p>
              )}
            </div>
            {r.url && (
              <a href={r.url} target="_blank" rel="noopener noreferrer" className="p-1 rounded text-zinc-500 hover:text-white transition-colors flex-shrink-0">
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectChat({ projectId, editorId, editorName }: { projectId: string; editorId: string; editorName: string }) {
  const [msg, setMsg] = useState("");
  const { data: messages = [], refetch } = useListMessages(projectId, { query: { refetchInterval: 8000 } });
  const sendMut = useSendMessage();

  async function send() {
    if (!msg.trim()) return;
    await sendMut.mutateAsync({ projectId, data: { senderId: editorId, senderName: editorName, senderRole: "editor", text: msg.trim() } });
    setMsg("");
    refetch();
  }

  return (
    <div className="mt-3 border border-zinc-800/60 rounded-xl overflow-hidden">
      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-3 py-2 border-b border-zinc-800/60 bg-zinc-900/40 flex items-center gap-1.5">
        <MessageSquare className="w-3 h-3" />Chat with Admin
      </div>
      <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-xs text-zinc-600 text-center py-3">No messages yet. Start the conversation!</p>
        ) : messages.map((m: any) => {
          const isMe = m.senderId === editorId;
          return (
            <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs ${isMe ? "bg-violet-600 text-white" : "bg-zinc-800 text-zinc-200"}`}>
                {!isMe && <p className="font-semibold text-[10px] text-zinc-400 mb-0.5">{m.senderName}</p>}
                <p className="leading-snug">{m.text}</p>
                <p className={`text-[9px] mt-0.5 ${isMe ? "text-violet-300" : "text-zinc-500"}`}>{timeAgo(m.createdAt)}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 p-2 border-t border-zinc-800/60 bg-zinc-900/40">
        <input
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700/60 rounded-xl text-xs text-white placeholder-zinc-600"
        />
        <button onClick={send} disabled={!msg.trim() || sendMut.isPending} className="p-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white rounded-xl transition-colors">
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function EditorProjects() {
  const { user } = useAuth();
  const editorId = (user as any)?.editorId ?? user?.id ?? "";
  const editorName = user?.name ?? "Team Member";
  const specialization = (user as any)?.specialization ?? "Video Editor";

  const { data: projects = [], refetch, isLoading } = useListEditorProjects(editorId, { query: { refetchInterval: 30000 } });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [submitModal, setSubmitModal] = useState<string | null>(null);
  const [tab, setTab] = useState<"all" | "active" | "completed">("all");
  const updateStatusMut = useUpdateProjectStatus();

  const filtered = projects.filter((p: any) => {
    if (tab === "active") return p.status !== "completed";
    if (tab === "completed") return p.status === "completed";
    return true;
  });

  async function markComplete(projectId: string) {
    await updateStatusMut.mutateAsync({ projectId, data: { status: "completed" } });
    refetch();
  }

  const cfg = SPEC_UPLOAD[specialization] ?? SPEC_UPLOAD["Video Editor"];

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: cfg.color + "80", borderTopColor: "transparent" }} />
    </div>
  );

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">My Projects</h1>
        <div className="flex gap-1.5">
          {(["all", "active", "completed"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${tab === t ? "text-white" : "bg-zinc-800 text-zinc-400 hover:text-white"}`}
              style={tab === t ? { backgroundColor: cfg.color } : {}}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <cfg.icon className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No {tab !== "all" ? tab : ""} projects found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p: any) => {
            const st = STATUS_STYLES[p.status] ?? STATUS_STYLES.pending;
            const dl = daysLeft(p.deadline);
            const isOpen = expanded === p.id;
            const progress = p.totalDeliverables > 0 ? (p.completedDeliverables / p.totalDeliverables) * 100 : 0;

            return (
              <div key={p.id} className="bg-zinc-900 border border-zinc-800/60 rounded-2xl overflow-hidden">
                {/* Header */}
                <button
                  onClick={() => setExpanded(isOpen ? null : p.id)}
                  className="w-full flex items-center gap-4 p-5 text-left hover:bg-zinc-800/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-white">{p.projectName}</h3>
                      {p.revisionRequested && (
                        <span className="text-[9px] font-bold bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <AlertCircle className="w-2.5 h-2.5" />REVISION
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">{p.clientName} · {TYPE_LABELS[p.projectType] ?? p.projectType}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>{st.label}</span>
                    <span className="text-[10px] flex items-center gap-0.5" style={{ color: dl.color }}>
                      <Clock className="w-2.5 h-2.5" />{dl.text}
                    </span>
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-zinc-500 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-zinc-500 flex-shrink-0" />}
                </button>

                {/* Progress bar */}
                <div className="px-5 pb-4">
                  <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                    <span>Deliverables: {p.completedDeliverables}/{p.totalDeliverables}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: cfg.color }} />
                  </div>
                </div>

                {/* Expanded */}
                {isOpen && (
                  <div className="px-5 pb-5 border-t border-zinc-800/60 pt-4 space-y-3">
                    {/* Notes */}
                    {p.notes && (
                      <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-3">
                        <p className="text-[10px] font-bold text-amber-400 mb-1">Admin Notes / Brief</p>
                        <p className="text-xs text-zinc-300 leading-relaxed">{p.notes}</p>
                      </div>
                    )}

                    {/* References from admin */}
                    <ProjectReferences projectId={p.id} color={cfg.color} />

                    {/* Actions */}
                    <div className="flex gap-2">
                      {p.status !== "completed" && (
                        <button
                          onClick={() => setSubmitModal(p.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-white text-xs font-semibold rounded-xl transition-colors"
                          style={{ backgroundColor: cfg.color }}
                        >
                          <Upload className="w-3.5 h-3.5" />{cfg.label}
                        </button>
                      )}
                      {p.status !== "completed" && (
                        <button
                          onClick={() => markComplete(p.id)}
                          disabled={updateStatusMut.isPending}
                          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-400 text-xs font-semibold rounded-xl transition-colors border border-emerald-600/20"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />Mark Done
                        </button>
                      )}
                      {p.status === "completed" && (
                        <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-4 h-4" />Project Completed
                        </div>
                      )}
                    </div>

                    {/* Chat */}
                    <ProjectChat projectId={p.id} editorId={editorId} editorName={editorName} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {submitModal && (
        <SubmitWorkModal
          projectId={submitModal}
          editorId={editorId}
          specialization={specialization}
          onClose={() => setSubmitModal(null)}
          onDone={() => { setSubmitModal(null); refetch(); }}
        />
      )}
    </div>
  );
}
