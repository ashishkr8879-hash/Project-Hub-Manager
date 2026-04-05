import { useAuth } from "@/hooks/use-auth";
import { useListNotifications, useMarkNotificationsRead } from "@workspace/api-client-react";
import { Bell, CheckCheck, Video, MessageSquare, AlertTriangle, ThumbsUp, ThumbsDown } from "lucide-react";

const NOTIF_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  video_approved:     { icon: ThumbsUp,       color: "#10b981", label: "Approved" },
  video_rejected:     { icon: ThumbsDown,     color: "#ef4444", label: "Rejected" },
  revision_requested: { icon: AlertTriangle,  color: "#f59e0b", label: "Revision" },
  message_received:   { icon: MessageSquare,  color: "#3b82f6", label: "Message" },
  video_submitted:    { icon: Video,          color: "#8b5cf6", label: "Submitted" },
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
  const editorId = (user as any)?.editorId ?? user?.id ?? "";
  const { data: notifications = [], refetch } = useListNotifications(editorId, { query: { refetchInterval: 15000 } });
  const markReadMut = useMarkNotificationsRead();

  const unread = notifications.filter((n) => !n.read);

  async function markAll() {
    await markReadMut.mutateAsync({ data: { userId: editorId } });
    refetch();
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
            const cfg = NOTIF_CONFIG[n.type] ?? { icon: Bell, color: "#6b7280", label: "Info" };
            const Icon = cfg.icon;
            return (
              <div
                key={n.id}
                className={`flex gap-4 p-4 rounded-2xl border transition-all ${
                  !n.read ? "bg-zinc-900 border-zinc-800/80" : "bg-zinc-900/40 border-zinc-800/40"
                }`}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cfg.color + "20" }}>
                  <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${!n.read ? "text-white" : "text-zinc-400"}`}>{n.title}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] text-zinc-600">{timeAgo(n.createdAt)}</span>
                      {!n.read && <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />}
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1 leading-snug">{n.message}</p>
                  <span className="inline-block mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: cfg.color + "20", color: cfg.color }}>{cfg.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
