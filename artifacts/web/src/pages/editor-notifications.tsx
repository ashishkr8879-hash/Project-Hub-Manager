import { useAuth } from "@/hooks/use-auth";
import { useListNotifications, useMarkNotificationsRead } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Bell, CheckCheck, Video, MessageSquare, AlertTriangle, ThumbsUp, ThumbsDown, ArrowRight } from "lucide-react";

const NOTIF_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string; hint: string }> = {
  video_approved:     { icon: ThumbsUp,      color: "#10b981", label: "Approved",  hint: "Tap to view project" },
  video_rejected:     { icon: ThumbsDown,    color: "#ef4444", label: "Rejected",  hint: "Tap to view feedback" },
  revision_requested: { icon: AlertTriangle, color: "#f59e0b", label: "Revision",  hint: "Tap to view project" },
  message_received:   { icon: MessageSquare, color: "#3b82f6", label: "Message",   hint: "Tap to open chat" },
  video_submitted:    { icon: Video,         color: "#8b5cf6", label: "Submitted", hint: "Tap to view" },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function EditorNotifications() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const editorId = (user as any)?.editorId ?? user?.id ?? "";
  const { data: notifications = [], refetch } = useListNotifications(editorId, { query: { refetchInterval: 15000 } });
  const markReadMut = useMarkNotificationsRead();

  const unread = notifications.filter((n) => !n.read);

  async function markAll() {
    await markReadMut.mutateAsync({ data: { userId: editorId } as any });
    refetch();
  }

  async function handleClick(n: any) {
    // Mark this notification as read
    if (!n.read) {
      await markReadMut.mutateAsync({ data: { userId: editorId, notifIds: [n.id] } as any });
      refetch();
    }
    // Navigate to relevant page
    navigate("/editor/projects");
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-violet-400" />Notifications
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">{unread.length} unread</p>
        </div>
        {unread.length > 0 && (
          <button
            onClick={markAll}
            disabled={markReadMut.isPending}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold rounded-xl transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />Mark All Read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const cfg = NOTIF_CONFIG[n.type] ?? { icon: Bell, color: "#6b7280", label: "Info", hint: "Tap to view" };
            const Icon = cfg.icon;
            return (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full flex gap-4 p-4 rounded-2xl border text-left transition-all group hover:scale-[1.005] active:scale-[0.998] ${
                  !n.read
                    ? "bg-zinc-900 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-800/60"
                    : "bg-zinc-900/40 border-zinc-800/40 hover:bg-zinc-900/70 hover:border-zinc-800"
                }`}
              >
                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: cfg.color + "20" }}
                >
                  <Icon className="w-4.5 h-4.5" style={{ color: cfg.color }} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${!n.read ? "text-white" : "text-zinc-400"}`}>{n.title}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] text-zinc-600">{timeAgo(n.createdAt)}</span>
                      {!n.read && <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />}
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1 leading-snug">{n.message}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: cfg.color + "20", color: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                    <span className="text-[10px] text-zinc-600 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {cfg.hint} <ArrowRight className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0">
                  <ArrowRight className="w-4 h-4 text-zinc-500" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
