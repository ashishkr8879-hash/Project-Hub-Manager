import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { useListNotifications, useListPendingVideos } from "@workspace/api-client-react";
import {
  LayoutDashboard, Briefcase, Users, UsersRound, Bell, CalendarDays,
  Settings, LogOut, PlusCircle, Sun, Moon, Menu, X,
} from "lucide-react";

interface LayoutProps { children: React.ReactNode; }

const SIDEBAR_BG   = "#0d3f7a";
const SIDEBAR_DARK = "#092e5c";
const GOLD         = "#e8ab15";

const navItems = [
  { href: "/",          label: "Dashboard",      icon: LayoutDashboard },
  { href: "/create",    label: "Create Project",  icon: PlusCircle      },
  { href: "/projects",  label: "Projects",        icon: Briefcase       },
  { href: "/clients",   label: "Clients",         icon: Users           },
  { href: "/team",      label: "Team",            icon: UsersRound      },
  { href: "/videos",    label: "Notifications",   icon: Bell            },
  { href: "/calendar",  label: "Calendar",        icon: CalendarDays    },
  { href: "/settings",  label: "Profile",         icon: Settings        },
];

const bottomNavItems = [
  { href: "/",          label: "Home",    icon: LayoutDashboard },
  { href: "/projects",  label: "Projects",icon: Briefcase       },
  { href: "/videos",    label: "Alerts",  icon: Bell            },
  { href: "/calendar",  label: "Calendar",icon: CalendarDays    },
  { href: "/settings",  label: "Profile", icon: Settings        },
];

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { logout, user } = useAuth();
  const { isDark, toggle } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: notifications = [] } = useListNotifications("admin", { query: { refetchInterval: 15000 } });
  const { data: pendingVideos = [] }  = useListPendingVideos({ query: { refetchInterval: 20000 } });

  const unreadCount = notifications.filter((n) => !n.read).length;
  const totalBadge  = unreadCount + pendingVideos.length;
  const logoUrl     = `${import.meta.env.BASE_URL}logo.png`;

  function NavLinks({ onNav }: { onNav?: () => void }) {
    return (
      <>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive   = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          const showBadge  = item.href === "/videos" && totalBadge > 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNav}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 relative ${
                isActive
                  ? "font-semibold text-white"
                  : "text-white/65 hover:text-white hover:bg-white/10"
              }`}
              style={isActive ? { backgroundColor: "rgba(255,255,255,0.15)" } : {}}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm flex-1">{item.label}</span>
              {showBadge && (
                <span className="text-[10px] font-bold text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
                  style={{ backgroundColor: GOLD }}>
                  {totalBadge}
                </span>
              )}
              {item.href === "/create" && (
                <span className="text-[9px] font-bold rounded px-1 py-0.5"
                  style={{ backgroundColor: "rgba(232,171,21,0.25)", color: GOLD }}>NEW</span>
              )}
            </Link>
          );
        })}
      </>
    );
  }

  function SidebarContent({ onNav }: { onNav?: () => void }) {
    return (
      <div className="flex flex-col h-full" style={{ backgroundColor: SIDEBAR_BG }}>
        {/* Brand */}
        <div className="h-20 flex items-center px-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3 w-full">
            <img src={logoUrl} alt="Divayshakati" className="w-12 h-12 object-contain flex-shrink-0 drop-shadow-lg" />
            <div>
              <div className="font-bold text-sm tracking-tight text-white leading-none">Divayshakati</div>
              <div className="text-[10px] mt-0.5 font-medium tracking-wide" style={{ color: GOLD + "cc" }}>Command Center</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <NavLinks onNav={onNav} />
        </nav>

        {/* User + logout */}
        <div className="p-3 border-t border-white/10 flex-shrink-0" style={{ backgroundColor: SIDEBAR_DARK }}>
          <div className="flex items-center gap-2.5 px-3 py-2 mb-1 rounded-xl border border-white/10"
            style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ backgroundColor: GOLD + "30", color: GOLD, border: `1px solid ${GOLD}50` }}>
              {user?.name?.charAt(0) || "A"}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{user?.name || "Admin"}</p>
              <p className="text-[10px] text-white/45 capitalize">{user?.role || "admin"}</p>
            </div>
            <button
              onClick={toggle}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10 flex-shrink-0"
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-white/70" />}
            </button>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-colors text-sm text-white/40 hover:text-red-300 hover:bg-red-500/10"
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
      <aside className="hidden md:flex w-60 flex-col fixed inset-y-0 left-0 z-20 shadow-xl"
        style={{ backgroundColor: SIDEBAR_BG }}>
        <SidebarContent />
      </aside>

      {/* ── Mobile overlay sidebar ───────────────────────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 flex flex-col shadow-2xl" style={{ backgroundColor: SIDEBAR_BG }}>
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <SidebarContent onNav={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* ── Mobile top bar (light) ───────────────────────────────── */}
      <header className="md:hidden fixed top-0 inset-x-0 z-30 h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-3 shadow-sm">
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors flex-shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2.5 flex-1">
          <img src={logoUrl} alt="Logo" className="w-7 h-7 object-contain" />
          <span className="font-bold text-sm" style={{ color: SIDEBAR_BG }}>Divayshakati</span>
        </div>
        <div className="flex items-center gap-2">
          {totalBadge > 0 && (
            <Link href="/videos">
              <div className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors">
                <Bell className="w-4.5 h-4.5 text-slate-500" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-white text-[9px] font-bold rounded-full flex items-center justify-center"
                  style={{ backgroundColor: GOLD }}>
                  {totalBadge > 9 ? "9+" : totalBadge}
                </span>
              </div>
            </Link>
          )}
          <button
            onClick={toggle}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" style={{ color: SIDEBAR_BG }} />}
          </button>
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────────── */}
      <main className="flex-1 md:ml-60 flex flex-col min-h-screen">
        <div className="p-3 sm:p-4 md:p-6 pt-16 md:pt-8 pb-20 md:pb-6 flex-1">
          {children}
        </div>
      </main>

      {/* ── Mobile bottom nav (light) ─────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 flex items-stretch shadow-[0_-2px_12px_rgba(13,63,122,0.08)]">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive  = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          const showBadge = item.href === "/videos" && totalBadge > 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-center transition-colors relative ${
                isActive ? "" : "text-slate-400 hover:text-slate-600"
              }`}
              style={isActive ? { color: SIDEBAR_BG } : {}}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {showBadge && (
                  <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 text-white text-[8px] font-bold rounded-full flex items-center justify-center"
                    style={{ backgroundColor: GOLD }}>
                    {totalBadge > 9 ? "9+" : totalBadge}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-medium leading-none">{item.label}</span>
              {isActive && (
                <div className="absolute bottom-0 inset-x-2 h-0.5 rounded-t-full" style={{ backgroundColor: SIDEBAR_BG }} />
              )}
            </Link>
          );
        })}
      </nav>

    </div>
  );
}
