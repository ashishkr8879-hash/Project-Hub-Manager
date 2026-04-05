import { useState } from "react";
import { useListPendingVideos, useReviewVideo, useListNotifications, useMarkNotificationsRead } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Film, Bell, Check, X, AlertCircle, CheckCircle2, XCircle, RefreshCw, MessageSquare, Briefcase } from "lucide-react";

type ReviewStatus = "approved" | "rejected";

const NOTIF_ICONS: Record<string, React.ComponentType<any>> = {
  video_submitted: Film,
  video_approved: CheckCircle2,
  video_rejected: XCircle,
  project_assigned: Briefcase,
  message_received: MessageSquare,
  revision_requested: RefreshCw,
};
const NOTIF_COLORS: Record<string, string> = {
  video_submitted: "text-blue-400",
  video_approved: "text-emerald-400",
  video_rejected: "text-red-400",
  project_assigned: "text-violet-400",
  message_received: "text-amber-400",
  revision_requested: "text-orange-400",
};

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function ReviewModal({ video, onClose }: { video: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const reviewMut = useReviewVideo();

  async function doReview(status: ReviewStatus) {
    await reviewMut.mutateAsync({ videoId: video.id, data: { status, note } });
    qc.invalidateQueries({ queryKey: ["/api/videos/pending"] });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md z-10 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/60">
          <h2 className="text-base font-bold text-white">Review Video</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          {/* Video info */}
          <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-4 space-y-1">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <p className="text-sm font-semibold text-white truncate">{video.fileName}</p>
            </div>
            <p className="text-xs text-zinc-500 ml-6">{video.projectName}</p>
            <p className="text-xs text-zinc-500 ml-6">Submitted by <span className="text-zinc-300">{video.editorName}</span> · {video.fileSize}</p>
            <p className="text-xs text-zinc-600 ml-6">{new Date(video.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
          </div>

          <div>
            <label className="text-xs text-zinc-500 block mb-2">Review Note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Write feedback for the editor..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => doReview("approved")}
              disabled={reviewMut.isPending}
              className="flex-1 py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />Approve
            </button>
            <button
              onClick={() => doReview("rejected")}
              disabled={reviewMut.isPending}
              className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Videos() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"notifications" | "reviews">("notifications");
  const [reviewVideo, setReviewVideo] = useState<any | null>(null);
  const [markingRead, setMarkingRead] = useState(false);

  const { data: pendingVideos = [], isLoading: videosLoading, refetch: refetchVideos } = useListPendingVideos({ query: { refetchInterval: 20000 } });
  const { data: notifications = [], isLoading: notifLoading, refetch: refetchNotifs } = useListNotifications("admin", { query: { refetchInterval: 15000 } });
  const markReadMut = useMarkNotificationsRead();

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function markAllRead() {
    setMarkingRead(true);
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length > 0) {
      await markReadMut.mutateAsync({ data: { ids: unreadIds } });
      refetchNotifs();
    }
    setMarkingRead(false);
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Notifications</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread · ` : ""}{pendingVideos.length} pending review{pendingVideos.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab("notifications")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${tab === "notifications" ? "bg-blue-500 text-white" : "bg-zinc-900 border border-zinc-800/60 text-zinc-400 hover:text-white"}`}
        >
          <Bell className="w-4 h-4" />
          Notifications
          {unreadCount > 0 && <span className="bg-white text-blue-600 text-[10px] font-bold rounded-full px-1.5 py-0.5">{unreadCount}</span>}
        </button>
        <button
          onClick={() => setTab("reviews")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${tab === "reviews" ? "bg-blue-500 text-white" : "bg-zinc-900 border border-zinc-800/60 text-zinc-400 hover:text-white"}`}
        >
          <Film className="w-4 h-4" />
          Pending Reviews
          {pendingVideos.length > 0 && <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">{pendingVideos.length}</span>}
        </button>
      </div>

      {/* NOTIFICATIONS TAB */}
      {tab === "notifications" && (
        <div className="space-y-3">
          {unreadCount > 0 && (
            <div className="flex justify-end">
              <button onClick={markAllRead} disabled={markingRead} className="text-xs text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50">
                {markingRead ? "Marking..." : "Mark all read"}
              </button>
            </div>
          )}
          {notifLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <div key={i} className="bg-zinc-900 border border-zinc-800/60 rounded-2xl h-16 animate-pulse" />)}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-20 space-y-3">
              <Bell className="w-12 h-12 text-zinc-700 mx-auto" />
              <p className="text-zinc-400">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notif) => {
                const Icon = NOTIF_ICONS[notif.type] ?? Bell;
                const colorClass = NOTIF_COLORS[notif.type] ?? "text-zinc-400";
                return (
                  <div key={notif.id} className={`flex items-start gap-4 p-4 bg-zinc-900 border rounded-2xl transition-colors ${notif.read ? "border-zinc-800/40 opacity-70" : "border-zinc-800/60"}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${notif.read ? "bg-zinc-800" : "bg-zinc-800"}`}>
                      <Icon className={`w-4.5 h-4.5 ${colorClass}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${notif.read ? "text-zinc-300" : "text-white"}`}>{notif.title}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{notif.message}</p>
                      <p className="text-[10px] text-zinc-600 mt-1">{timeAgo(notif.createdAt)}</p>
                    </div>
                    {!notif.read && <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* REVIEWS TAB */}
      {tab === "reviews" && (
        <div className="space-y-3">
          {videosLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => <div key={i} className="bg-zinc-900 border border-zinc-800/60 rounded-2xl h-24 animate-pulse" />)}
            </div>
          ) : pendingVideos.length === 0 ? (
            <div className="text-center py-20 space-y-3">
              <CheckCircle2 className="w-14 h-14 text-emerald-500/40 mx-auto" />
              <p className="text-lg font-semibold text-zinc-300">All caught up!</p>
              <p className="text-sm text-zinc-500">No videos pending review</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingVideos.map((video) => (
                <div key={video.id} className="bg-zinc-900 border border-amber-500/20 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <Film className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{video.fileName}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">{video.projectName} · {video.clientName}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        By <span className="text-zinc-300">{video.editorName}</span> · {video.fileSize} · Deliverable #{(video.deliverableIndex ?? 0) + 1}
                      </p>
                      <p className="text-[10px] text-zinc-600 mt-0.5">{timeAgo(video.submittedAt)}</p>
                    </div>
                    <button
                      onClick={() => setReviewVideo(video)}
                      className="flex-shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors"
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {reviewVideo && <ReviewModal video={reviewVideo} onClose={() => { setReviewVideo(null); refetchVideos(); }} />}
    </div>
  );
}
