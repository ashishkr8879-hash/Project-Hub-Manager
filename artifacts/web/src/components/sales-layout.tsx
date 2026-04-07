import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { LayoutDashboard, User, LogOut, Menu, X, TrendingUp } from "lucide-react";

interface SalesLayoutProps { children: React.ReactNode; }

const navItems = [
  { href: "/sales",         label: "My Dashboard",  icon: LayoutDashboard },
  { href: "/sales/profile", label: "My Profile",    icon: User            },
];

const BRAND_BLUE = "#0d3f7a";
const GOLD       = "#e8ab15";
const SALES_COLOR = "#059669";

export default function SalesLayout({ children }: SalesLayoutProps) {
  const [location] = useLocation();
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const logoUrl = `${import.meta.env.BASE_URL}logo.png`;

  function NavLinks({ onNav }: { onNav?: () => void }) {
    return (
      <>
        {navItems.map((item) => {
          const Icon     = item.icon;
          const isActive = location === item.href || (item.href !== "/sales" && location.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNav}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${
                isActive ? "font-semibold" : "text-slate-500 hover:text-slate-800 hover:bg-emerald-50"
              }`}
              style={isActive ? { backgroundColor: SALES_COLOR + "15", color: SALES_COLOR } : {}}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm flex-1">{item.label}</span>
            </Link>
          );
        })}
      </>
    );
  }

  function SidebarContent({ onNav }: { onNav?: () => void }) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="h-20 flex items-center px-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3 w-full">
            <img src={logoUrl} alt="Divayshakati" className="w-12 h-12 object-contain flex-shrink-0 drop-shadow" />
            <div>
              <div className="font-bold text-sm tracking-tight leading-none" style={{ color: BRAND_BLUE }}>Divayshakati</div>
              <div className="text-[10px] mt-0.5 font-semibold tracking-widest uppercase" style={{ color: GOLD }}>Sales Panel</div>
            </div>
          </div>
        </div>

        <div className="mx-3 mt-3 mb-1 px-3 py-1.5 rounded-lg flex items-center gap-2 border"
          style={{ backgroundColor: SALES_COLOR + "10", borderColor: SALES_COLOR + "25" }}>
          <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" style={{ color: SALES_COLOR }} />
          <span className="text-xs font-semibold" style={{ color: SALES_COLOR }}>Sales Executive</span>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          <NavLinks onNav={onNav} />
        </nav>

        <div className="p-3 border-t border-slate-100 flex-shrink-0 bg-slate-50">
          <div className="flex items-center gap-2.5 px-3 py-2 mb-1 rounded-xl bg-white border border-slate-200">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border"
              style={{ backgroundColor: SALES_COLOR + "15", color: SALES_COLOR, borderColor: SALES_COLOR + "30" }}>
              {user?.name?.charAt(0) || "S"}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-semibold truncate" style={{ color: BRAND_BLUE }}>{user?.name || "Sales Executive"}</p>
              <p className="text-[10px] text-slate-400 truncate">Sales Team</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors text-sm"
          >
            <LogOut className="w-3.5 h-3.5" />Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      <aside className="hidden md:flex w-60 flex-col fixed inset-y-0 left-0 z-20 border-r border-slate-200 shadow-sm bg-white">
        <SidebarContent />
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 flex flex-col shadow-2xl bg-white">
            <button onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
              <X className="w-4 h-4" />
            </button>
            <SidebarContent onNav={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      <header className="md:hidden fixed top-0 inset-x-0 z-30 h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-3 shadow-sm">
        <button onClick={() => setSidebarOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors flex-shrink-0">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2.5 flex-1">
          <img src={logoUrl} alt="Logo" className="w-7 h-7 object-contain" />
          <span className="font-bold text-sm" style={{ color: BRAND_BLUE }}>Divayshakati</span>
        </div>
      </header>

      <main className="flex-1 md:ml-60 flex flex-col min-h-screen">
        <div className="p-3 sm:p-4 md:p-6 pt-16 md:pt-8 pb-20 md:pb-6 flex-1">
          {children}
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 flex items-stretch shadow-[0_-2px_12px_rgba(13,63,122,0.06)]">
        {navItems.map((item) => {
          const Icon     = item.icon;
          const isActive = location === item.href || (item.href !== "/sales" && location.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-center transition-colors relative ${
                isActive ? "" : "text-slate-400 hover:text-slate-600"
              }`}
              style={isActive ? { color: SALES_COLOR } : {}}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-medium leading-none">{item.label.replace("My ", "")}</span>
              {isActive && (
                <div className="absolute bottom-0 inset-x-2 h-0.5 rounded-t-full" style={{ backgroundColor: SALES_COLOR }} />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
