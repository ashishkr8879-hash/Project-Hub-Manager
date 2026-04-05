import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { User, Lock, Eye, EyeOff, Loader2 } from "lucide-react";

const ROLES = ["Video Editor", "Graphic Designer", "Ads Setup", "Website Development", "Social Media Manager"];

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const loginMutation = useLogin();

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
      className="min-h-screen w-full flex flex-col items-center justify-start overflow-y-auto"
      style={{ background: "linear-gradient(170deg, #0d1528 0%, #0a0f1e 50%, #060c18 100%)" }}
    >
      {/* Top section — logo + branding */}
      <div className="flex flex-col items-center pt-12 pb-6 px-6 w-full max-w-sm">
        {/* Logo */}
        <div className="relative mb-5">
          <div
            className="absolute inset-0 rounded-full blur-2xl opacity-30"
            style={{ background: "radial-gradient(circle, #f59e0b 0%, transparent 70%)" }}
          />
          <img
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt="Divayshakati"
            className="relative w-28 h-28 object-contain drop-shadow-2xl"
            style={{ filter: "drop-shadow(0 0 24px rgba(245,158,11,0.4))" }}
          />
        </div>

        {/* Brand name */}
        <h1
          className="text-3xl font-extrabold tracking-wide mb-1"
          style={{ color: "#f59e0b", textShadow: "0 0 30px rgba(245,158,11,0.5), 0 2px 8px rgba(0,0,0,0.6)" }}
        >
          Divayshakati
        </h1>
        <p className="text-sm font-medium tracking-[0.2em] text-white/70 uppercase mb-5">
          Project Manager
        </p>

        {/* Role chips */}
        <div className="flex flex-wrap justify-center gap-1.5">
          {ROLES.map((role) => (
            <span
              key={role}
              className="px-2.5 py-1 rounded-full text-[10px] font-semibold border tracking-wide"
              style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                borderColor: "rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.65)",
              }}
            >
              {role}
            </span>
          ))}
        </div>
      </div>

      {/* Sign In card */}
      <div
        className="w-full max-w-sm mx-auto rounded-t-3xl flex-1 px-6 pt-8 pb-10"
        style={{
          background: "linear-gradient(180deg, #151e30 0%, #111827 100%)",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.5)",
          minHeight: "360px",
        }}
      >
        <h2 className="text-2xl font-bold text-white mb-6">Sign In</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="text-sm font-medium text-white/80 block mb-2">Username</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin, alice, bob..."
                autoComplete="username"
                className="w-full pl-10 pr-4 py-3.5 rounded-2xl text-sm text-white placeholder-white/25 outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
                onFocus={(e) => { e.target.style.borderColor = "rgba(245,158,11,0.6)"; e.target.style.background = "rgba(255,255,255,0.08)"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.background = "rgba(255,255,255,0.06)"; }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-medium text-white/80 block mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                autoComplete="current-password"
                className="w-full pl-10 pr-12 py-3.5 rounded-2xl text-sm text-white placeholder-white/25 outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
                onFocus={(e) => { e.target.style.borderColor = "rgba(245,158,11,0.6)"; e.target.style.background = "rgba(255,255,255,0.08)"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.background = "rgba(255,255,255,0.06)"; }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
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

          {/* Submit button */}
          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full py-4 rounded-2xl text-sm font-bold tracking-wide text-black transition-all disabled:opacity-70 flex items-center justify-center gap-2 mt-2"
            style={{
              background: loginMutation.isPending
                ? "#ca8a04"
                : "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              boxShadow: "0 4px 20px rgba(245,158,11,0.35)",
            }}
          >
            {loginMutation.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Signing in...</>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
