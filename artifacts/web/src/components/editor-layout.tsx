import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useListNotifications } from "@workspace/api-client-react";
import { LayoutDashboard, Briefcase, Bell, User, LogOut } from "lucide-react";

interface EditorLayoutProps { children: React.ReactNode; }

const navItems = [
  { href: "/editor", label: "Dashboard", icon: LayoutDashboard },
  { href: "/editor/projects", label: "My Projects", icon: Briefcase },
  { href: "/editor/notifications", label: "Notifications", icon: Bell },
  { href: "/editor/profile", label: "My Profile", icon: User },
];

export default function EditorLayout({ children }: EditorLayoutProps) {
  const [location] = useLocation();
  const { logout, user } = useAuth();
  const editorId = (user as any)?.editorId ?? user?.id ?? "";
  const { data: notifications = [] } = useListNotifications(editorId, { query: { refetchInterval: 12000 } });
  const unread = notifications.filter((n) => !n.read).length;
  const logoUrl = `${import.meta.env.BASE_URL}logo.png`;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex">
      <aside className="w-60 border-r border-zinc-800/60 bg-zinc-950 flex flex-col fixed inset-y-0 left-0 z-20">
        <div className="h-20 flex items-center px-4 border-b border-zinc-800/60 flex-shrink-0">
          <div className="flex items-center gap-3 w-full">
            <img src={logoUrl} alt="Divayshakati" className="w-12 h-12 object-contain flex-shrink-0 drop-shadow-lg" />
            <div>
              <div className="font-bold text-sm tracking-tight text-white leading-none">Divayshakati</div>
              <div className="text-[10px] text-violet-400/80 mt-0.5 font-medium tracking-wide">Editor Panel</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href !== "/editor" && location.startsWith(item.href));
            const showBadge = item.href === "/editor/notifications" && unread > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${
                  isActive ? "bg-violet-600/15 text-violet-400 font-semibold" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm flex-1">{item.label}</span>
                {showBadge && (
                  <span className="text-[10px] font-bold bg-violet-500 text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {unread}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-zinc-800/60 flex-shrink-0">
          <div className="flex items-center gap-2.5 px-3 py-2 mb-1 rounded-xl bg-zinc-900/60 border border-zinc-800/50">
            <div className="w-7 h-7 bg-violet-500/20 border border-violet-500/30 rounded-full flex items-center justify-center text-xs font-bold text-violet-400 flex-shrink-0">
              {user?.name?.charAt(0) || "E"}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{user?.name || "Editor"}</p>
              <p className="text-[10px] text-zinc-500 truncate">{(user as any)?.specialization || "Editor"}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-colors text-sm"
          >
            <LogOut className="w-3.5 h-3.5" />Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-60 flex flex-col min-h-screen">
        <div className="p-6 flex-1">{children}</div>
      </main>
    </div>
  );
}
