import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useListEditorProjects, useSubmitVideo, useListMessages, useSendMessage, useUpdateProjectStatus } from "@workspace/api-client-react";
import {
  Clock, CheckCircle2, ChevronDown, ChevronUp, Upload, MessageSquare, Send, Video, AlertCircle, X,
} from "lucide-react";

const STATUS_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  pending:     { label: "Pending",     bg: "bg-zinc-700/50",      text: "text-zinc-300" },
  in_progress: { label: "In Progress", bg: "bg-blue-500/15",      text: "text-blue-400" },
  completed:   { label: "Completed",   bg: "bg-emerald-500/15",   text: "text-emerald-400" },
};

const TYPE_LABELS: Record<string, string> = {
  ugc: "UGC", ai_video: "AI Video", editing: "Editing", branded: "Branded",
  corporate: "Corporate", wedding: "Wedding", social_media: "Social Media",
  graphic_design: "Graphic Design", ads_setup: "Ads Setup", website: "Website", other: "Other",
};

const fmt = (n: number) => "₹" + n.toLocaleString("en-IN");

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

function VideoSubmitModal({ projectId, editorId, onClose, onDone }: { projectId: string; editorId: string; onClose: () => void; onDone: () => void }) {
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [deliverableIndex, setDeliverableIndex] = useState("1");
  const submitMut = useSubmitVideo();

  async function submit() {
    if (!fileName.trim()) return;
    await submitMut.mutateAsync({ projectId, data: { editorId, fileName: fileName.trim(), fileSize: fileSize.trim() || "Unknown", deliverableIndex: +deliverableIndex || 1 } });
    onDone();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-sm z-10 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/60">
          <h2 className="text-base font-bold text-white flex items-center gap-2"><Upload className="w-4 h-4 text-violet-400" />Submit Video</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-xs text-zinc-500 block mb-1">File Name *</label>
            <input value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="e.g. brand_video_v2.mp4" className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800/60 rounded-xl text-sm text-white placeholder-zinc-600" />
          </div>
          <div>
            <label className="text-xs text-zinc-500 block mb-1">File Size</label>
            <input value={fileSize} onChange={(e) => setFileSize(e.target.value)} placeholder="e.g. 250 MB" className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800/60 rounded-xl text-sm text-white placeholder-zinc-600" />
          </div>
          <div>
            <label className="text-xs text-zinc-500 block mb-1">Deliverable #</label>
            <input type="number" min="1" value={deliverableIndex} onChange={(e) => setDeliverableIndex(e.target.value)} className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800/60 rounded-xl text-sm text-white" />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={submit} disabled={!fileName.trim() || submitMut.isPending} className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {submitMut.isPending ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Submitting...</> : <><Upload className="w-4 h-4" />Submit</>}
            </button>
            <button onClick={onClose} className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700">Cancel</button>
          </div>
        </div>
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

  const { data: projects = [], refetch, isLoading } = useListEditorProjects(editorId, { query: { refetchInterval: 30000 } });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [videoModal, setVideoModal] = useState<string | null>(null);
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

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">My Projects</h1>
        <div className="flex gap-1.5">
          {(["all", "active", "completed"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${tab === t ? "bg-violet-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white"}`}>{t}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <Video className="w-8 h-8 mx-auto mb-2 opacity-40" />
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
                    <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                {/* Expanded */}
                {isOpen && (
                  <div className="px-5 pb-5 border-t border-zinc-800/60 pt-4 space-y-3">
                    {/* Info grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-zinc-800/50 rounded-xl p-3">
                        <p className="text-zinc-500 mb-0.5">Your Earning</p>
                        <p className="text-white font-bold">{fmt(p.editorCost)}</p>
                      </div>
                      <div className="bg-zinc-800/50 rounded-xl p-3">
                        <p className="text-zinc-500 mb-0.5">Total Value</p>
                        <p className="text-white font-bold">{fmt(p.totalValue)}</p>
                      </div>
                    </div>

                    {/* Notes */}
                    {p.notes && (
                      <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-3">
                        <p className="text-[10px] font-bold text-amber-400 mb-1">Admin Notes</p>
                        <p className="text-xs text-zinc-300 leading-relaxed">{p.notes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setVideoModal(p.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-xl transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" />Submit Video
                      </button>
                      {p.status !== "completed" && (
                        <button
                          onClick={() => markComplete(p.id)}
                          disabled={updateStatusMut.isPending}
                          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-400 text-xs font-semibold rounded-xl transition-colors border border-emerald-600/20"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />Mark Done
                        </button>
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

      {videoModal && (
        <VideoSubmitModal
          projectId={videoModal}
          editorId={editorId}
          onClose={() => setVideoModal(null)}
          onDone={() => { setVideoModal(null); refetch(); }}
        />
      )}
    </div>
  );
}
