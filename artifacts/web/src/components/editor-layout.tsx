import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { useListNotifications } from "@workspace/api-client-react";
import { LayoutDashboard, Briefcase, Bell, User, LogOut, Sun, Moon, Menu, X } from "lucide-react";

interface EditorLayoutProps { children: React.ReactNode; }

const navItems = [
  { href: "/editor",                label: "Dashboard",      icon: LayoutDashboard },
  { href: "/editor/projects",       label: "My Projects",    icon: Briefcase       },
  { href: "/editor/notifications",  label: "Notifications",  icon: Bell            },
  { href: "/editor/profile",        label: "My Profile",     icon: User            },
];

const SPEC_COLORS: Record<string, string> = {
  "Video Editor": "#7c3aed",
  "Graphic Designer": "#ec4899",
  "Social Media Manager": "#0ea5e9",
  "Website Development": "#10b981",
  "Ads Setup": "#f97316",
};

export default function EditorLayout({ children }: EditorLayoutProps) {
  const [location] = useLocation();
  const { logout, user } = useAuth();
  const { isDark, toggle } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const editorId  = (user as any)?.editorId ?? user?.id ?? "";
  const spec      = (user as any)?.specialization ?? "Team Member";
  const specColor = SPEC_COLORS[spec] ?? "#7c3aed";
  const logoUrl   = `${import.meta.env.BASE_URL}logo.png`;

  const { data: notifications = [] } = useListNotifications(editorId, { query: { refetchInterval: 12000 } });
  const unread = notifications.filter((n) => !n.read).length;

  function NavLinks({ onNav }: { onNav?: () => void }) {
    return (
      <>
        {navItems.map((item) => {
          const Icon      = item.icon;
          const isActive  = location === item.href || (item.href !== "/editor" && location.startsWith(item.href));
          const showBadge = item.href === "/editor/notifications" && unread > 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNav}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${
                isActive ? "font-semibold" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              }`}
              style={isActive ? { backgroundColor: specColor + "20", color: specColor } : {}}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm flex-1">{item.label}</span>
              {showBadge && (
                <span className="text-[10px] font-bold text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
                  style={{ backgroundColor: specColor }}>
                  {unread}
                </span>
              )}
            </Link>
          );
        })}
      </>
    );
  }

  function SidebarContent({ onNav }: { onNav?: () => void }) {
    return (
      <div className="flex flex-col h-full">
        {/* Brand */}
        <div className="h-20 flex items-center px-4 border-b border-zinc-800/60 flex-shrink-0">
          <div className="flex items-center gap-3 w-full">
            <img src={logoUrl} alt="Divayshakati" className="w-12 h-12 object-contain flex-shrink-0 drop-shadow-lg" />
            <div>
              <div className="font-bold text-sm tracking-tight text-white leading-none">Divayshakati</div>
              <div className="text-[10px] mt-0.5 font-medium tracking-wide" style={{ color: specColor + "cc" }}>Team Panel</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <NavLinks onNav={onNav} />
        </nav>

        {/* User + logout */}
        <div className="p-3 border-t border-zinc-800/60 flex-shrink-0">
          <div className="flex items-center gap-2.5 px-3 py-2 mb-1 rounded-xl bg-zinc-900/60 border border-zinc-800/50">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ backgroundColor: specColor + "30", color: specColor, borderColor: specColor + "50", borderWidth: 1 }}>
              {user?.name?.charAt(0) || "T"}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{user?.name || "Team Member"}</p>
              <p className="text-[10px] text-zinc-500 truncate">{spec}</p>
            </div>
            <button
              onClick={toggle}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-zinc-700/60 flex-shrink-0"
            >
              {isDark
                ? <Sun className="w-3.5 h-3.5 text-amber-400" />
                : <Moon className="w-3.5 h-3.5" style={{ color: specColor }} />}
            </button>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-colors text-sm"
          >
            <LogOut className="w-3.5 h-3.5" />Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex">

      {/* ── Desktop sidebar (md+) ─────────────────────────────────── */}
      <aside className="hidden md:flex w-60 border-r border-zinc-800/60 bg-zinc-950 flex-col fixed inset-y-0 left-0 z-20">
        <SidebarContent />
      </aside>

      {/* ── Mobile overlay sidebar ───────────────────────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-zinc-950 border-r border-zinc-800/60 flex flex-col shadow-2xl">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <SidebarContent onNav={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* ── Mobile top bar ───────────────────────────────────────── */}
      <header className="md:hidden fixed top-0 inset-x-0 z-30 h-14 bg-zinc-950 border-b border-zinc-800/60 flex items-center px-4 gap-3">
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex-shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2.5 flex-1">
          <img src={logoUrl} alt="Logo" className="w-7 h-7 object-contain" />
          <span className="font-bold text-sm text-white">Divayshakati</span>
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <Link href="/editor/notifications">
              <div className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-zinc-800 transition-colors">
                <Bell className="w-4.5 h-4.5 text-zinc-400" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-white text-[9px] font-bold rounded-full flex items-center justify-center"
                  style={{ backgroundColor: specColor }}>
                  {unread > 9 ? "9+" : unread}
                </span>
              </div>
            </Link>
          )}
          <button
            onClick={toggle}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" style={{ color: specColor }} />}
          </button>
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────────── */}
      <main className="flex-1 md:ml-60 flex flex-col min-h-screen">
        <div className="p-3 sm:p-4 md:p-6 pt-16 md:pt-8 pb-20 md:pb-6 flex-1">
          {children}
        </div>
      </main>

      {/* ── Mobile bottom nav ────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-zinc-950 border-t border-zinc-800/60 flex items-stretch">
        {navItems.map((item) => {
          const Icon      = item.icon;
          const isActive  = location === item.href || (item.href !== "/editor" && location.startsWith(item.href));
          const showBadge = item.href === "/editor/notifications" && unread > 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-center transition-colors relative ${
                isActive ? "" : "text-zinc-500 hover:text-zinc-300"
              }`}
              style={isActive ? { color: specColor } : {}}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {showBadge && (
                  <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 text-white text-[8px] font-bold rounded-full flex items-center justify-center"
                    style={{ backgroundColor: specColor }}>
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-medium leading-none">{item.label.replace("My ", "")}</span>
              {isActive && (
                <div className="absolute bottom-0 inset-x-2 h-0.5 rounded-t-full" style={{ backgroundColor: specColor }} />
              )}
            </Link>
          );
        })}
      </nav>

    </div>
  );
}
