import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/use-theme";
import { User, Lock, Eye, EyeOff, Loader2, Sun, Moon } from "lucide-react";

const ROLES = ["Video Editor", "Graphic Designer", "Ads Setup", "Website Development", "Social Media Manager"];

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const loginMutation = useLogin();
  const { isDark, toggle } = useTheme();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password.trim()) {
      setError("Please enter username and password");
      return;
    }
    try {
      const response = await loginMutation.mutateAsync({ data: { username: username.trim(), password } });
      login(response);
      if (response.role === "admin") {
        toast({ title: "Welcome back, Admin", description: "Logged in to command center." });
        setLocation("/");
      } else {
        toast({ title: `Welcome, ${response.name}`, description: "Logged in to team panel." });
        setLocation("/editor");
      }
    } catch {
      setError("Invalid username or password");
    }
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "linear-gradient(170deg, #0d1528 0%, #0a0f1e 50%, #060c18 100%)" }}
    >
      {/* Ambient glow blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #f59e0b 0%, transparent 70%)" }} />
        <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full opacity-5"
          style={{ background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)" }} />
      </div>

      {/* Theme toggle — top right */}
      <button
        onClick={toggle}
        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        className="absolute top-4 right-4 z-10 w-9 h-9 rounded-xl flex items-center justify-center transition-all border"
        style={{
          backgroundColor: "rgba(255,255,255,0.06)",
          borderColor: "rgba(255,255,255,0.12)",
        }}
      >
        {isDark
          ? <Sun className="w-4 h-4 text-amber-400" />
          : <Moon className="w-4 h-4 text-blue-400" />}
      </button>

      {/* Center card box */}
      <div
        className="relative z-10 w-full max-w-sm rounded-3xl p-8"
        style={{
          background: "linear-gradient(160deg, #141d2e 0%, #0f1623 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
        }}
      >
        {/* Logo + branding inside box */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div
              className="absolute inset-0 rounded-full blur-2xl opacity-40"
              style={{ background: "radial-gradient(circle, #f59e0b 0%, transparent 70%)" }}
            />
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt="Divayshakati"
              className="relative w-20 h-20 object-contain drop-shadow-2xl"
              style={{ filter: "drop-shadow(0 0 20px rgba(245,158,11,0.45))" }}
            />
          </div>

          <h1
            className="text-2xl font-extrabold tracking-wide mb-0.5"
            style={{ color: "#f59e0b", textShadow: "0 0 24px rgba(245,158,11,0.45)" }}
          >
            Divayshakati
          </h1>
          <p className="text-[10px] font-semibold tracking-[0.25em] uppercase mb-4"
            style={{ color: "rgba(255,255,255,0.45)" }}>
            Project Manager
          </p>

          {/* Role chips */}
          <div className="flex flex-wrap justify-center gap-1">
            {ROLES.map((role) => (
              <span
                key={role}
                className="px-2 py-0.5 rounded-full text-[9px] font-semibold border tracking-wide"
                style={{
                  backgroundColor: "rgba(255,255,255,0.04)",
                  borderColor: "rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                {role}
              </span>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px mb-7" style={{ background: "rgba(255,255,255,0.07)" }} />

        {/* Form */}
        <h2 className="text-lg font-bold text-white mb-5">Sign In</h2>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Username */}
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.25)" }} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin, alice, bob..."
                autoComplete="username"
                className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm text-white placeholder-white/20 outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }}
                onFocus={(e) => { e.target.style.borderColor = "rgba(245,158,11,0.55)"; e.target.style.background = "rgba(255,255,255,0.09)"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.09)"; e.target.style.background = "rgba(255,255,255,0.06)"; }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.25)" }} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                autoComplete="current-password"
                className="w-full pl-10 pr-11 py-3 rounded-2xl text-sm text-white placeholder-white/20 outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }}
                onFocus={(e) => { e.target.style.borderColor = "rgba(245,158,11,0.55)"; e.target.style.background = "rgba(255,255,255,0.09)"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.09)"; e.target.style.background = "rgba(255,255,255,0.06)"; }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full py-3.5 rounded-2xl text-sm font-bold tracking-wide text-black transition-all disabled:opacity-70 flex items-center justify-center gap-2 mt-1"
            style={{
              background: loginMutation.isPending
                ? "#ca8a04"
                : "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              boxShadow: "0 4px 20px rgba(245,158,11,0.3)",
            }}
          >
            {loginMutation.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" />Signing in...</>
              : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
