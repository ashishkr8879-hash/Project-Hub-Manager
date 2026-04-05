import { useAuth } from "@/hooks/use-auth";
import { useListNotifications, useMarkNotificationsRead } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Bell, CheckCheck, Video, MessageSquare, AlertTriangle, ThumbsUp, ThumbsDown, ArrowRight } from "lucide-react";

const NOTIF_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string; hint: string }> = {
  video_approved:     { icon: ThumbsUp,      color: "#16a34a", bg: "#dcfce7", label: "Approved",  hint: "View project" },
  video_rejected:     { icon: ThumbsDown,    color: "#dc2626", bg: "#fee2e2", label: "Rejected",  hint: "View feedback" },
  revision_requested: { icon: AlertTriangle, color: "#d97706", bg: "#fef3c7", label: "Revision",  hint: "View project" },
  message_received:   { icon: MessageSquare, color: "#2563eb", bg: "#dbeafe", label: "Message",   hint: "Open chat" },
  video_submitted:    { icon: Video,         color: "#7c3aed", bg: "#ede9fe", label: "Submitted", hint: "View" },
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
    if (!n.read) {
      await markReadMut.mutateAsync({ data: { userId: editorId, notifIds: [n.id] } as any });
      refetch();
    }
    navigate("/editor/projects");
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header */}
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

      {/* Empty state */}
      {notifications.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const cfg = NOTIF_CONFIG[n.type] ?? { icon: Bell, color: "#6b7280", bg: "#f3f4f6", label: "Info", hint: "View" };
            const Icon = cfg.icon;
            return (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full flex gap-4 p-4 rounded-2xl border text-left transition-all duration-150 group
                  hover:shadow-lg active:shadow-none active:opacity-80
                  ${!n.read
                    ? "bg-zinc-900 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-800/80"
                    : "bg-zinc-900/40 border-zinc-800/40 hover:bg-zinc-900/70 hover:border-zinc-800"
                  }`}
              >
                {/* Icon — data-no-invert keeps colors correct in light mode */}
                <div
                  data-no-invert
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-150 group-hover:scale-110 group-active:scale-95"
                  style={{ backgroundColor: cfg.bg }}
                >
                  <Icon className="w-4.5 h-4.5" style={{ color: cfg.color }} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${!n.read ? "text-white" : "text-zinc-400"}`}>{n.title}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] text-zinc-600">{timeAgo(n.createdAt)}</span>
                      {!n.read && (
                        <div
                          data-no-invert
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: cfg.color }}
                        />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1 leading-snug">{n.message}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      data-no-invert
                      className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: cfg.bg, color: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                    <span className="text-[10px] text-zinc-600 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {cfg.hint} <ArrowRight className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex-shrink-0 self-center opacity-0 group-hover:opacity-60 transition-opacity">
                  <ArrowRight className="w-4 h-4 text-zinc-400" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
