import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useListNotifications, useListPendingVideos } from "@workspace/api-client-react";
import {
  LayoutDashboard, Briefcase, Users, UsersRound, Bell, CalendarDays, Settings, LogOut, PlusCircle, Film
} from "lucide-react";

interface LayoutProps { children: React.ReactNode; }

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/create", label: "Create Project", icon: PlusCircle },
  { href: "/projects", label: "Projects", icon: Briefcase },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/team", label: "Team", icon: UsersRound },
  { href: "/videos", label: "Notifications", icon: Bell },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/settings", label: "Profile", icon: Settings },
];

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { logout, user } = useAuth();

  const { data: notifications = [] } = useListNotifications("admin", { query: { refetchInterval: 15000 } });
  const { data: pendingVideos = [] } = useListPendingVideos({ query: { refetchInterval: 20000 } });

  const unreadCount = notifications.filter((n) => !n.read).length;
  const totalBadge = unreadCount + pendingVideos.length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex">
      {/* Sidebar */}
      <aside className="w-60 border-r border-zinc-800/60 bg-zinc-950 flex flex-col fixed inset-y-0 left-0 z-20">
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-zinc-800/60 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white text-black flex items-center justify-center rounded-xl font-bold text-sm tracking-tighter flex-shrink-0">
              DV
            </div>
            <div>
              <div className="font-semibold text-sm tracking-tight text-white leading-none">Divayshakati</div>
              <div className="text-[10px] text-zinc-500 mt-0.5">Command Center</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            const showBadge = item.href === "/videos" && totalBadge > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 relative ${
                  isActive
                    ? "bg-blue-500/15 text-blue-400 font-semibold"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm flex-1">{item.label}</span>
                {showBadge && (
                  <span className="text-[10px] font-bold bg-blue-500 text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {totalBadge}
                  </span>
                )}
                {item.href === "/create" && (
                  <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-400 rounded px-1 py-0.5">NEW</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div className="p-3 border-t border-zinc-800/60 flex-shrink-0">
          <div className="flex items-center gap-2.5 px-3 py-2 mb-1 rounded-xl bg-zinc-900/60 border border-zinc-800/50">
            <div className="w-7 h-7 bg-blue-500/20 border border-blue-500/30 rounded-full flex items-center justify-center text-xs font-bold text-blue-400 flex-shrink-0">
              {user?.name?.charAt(0) || "A"}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{user?.name || "Admin"}</p>
              <p className="text-[10px] text-zinc-500 capitalize">{user?.role || "admin"}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-colors text-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-60 flex flex-col min-h-screen">
        <div className="p-6 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
