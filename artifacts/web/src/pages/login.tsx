import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { User, Lock, Eye, EyeOff, Loader2 } from "lucide-react";

const ROLES = ["Video Editor", "Graphic Designer", "Ads Setup", "Website Development", "Social Media Manager"];
const SIDEBAR_BG = "#0d3f7a";
const GOLD = "#e8ab15";

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
      className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "linear-gradient(145deg, #e8f0fb 0%, #f0f4f8 40%, #ddeaf7 100%)" }}
    >
      {/* Ambient blobs — logo blue + gold */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: `radial-gradient(circle, ${SIDEBAR_BG} 0%, transparent 70%)` }} />
        <div className="absolute bottom-[-80px] right-[-80px] w-[400px] h-[400px] rounded-full opacity-15"
          style={{ background: `radial-gradient(circle, ${GOLD} 0%, transparent 70%)` }} />
        <div className="absolute top-[30%] left-[-60px] w-[300px] h-[300px] rounded-full opacity-10"
          style={{ background: `radial-gradient(circle, #3b9ff5 0%, transparent 70%)` }} />
      </div>

      {/* Center card */}
      <div
        className="relative z-10 w-full max-w-sm rounded-3xl p-8"
        style={{
          background: "#ffffff",
          border: `1px solid rgba(13,63,122,0.10)`,
          boxShadow: "0 24px 80px rgba(13,63,122,0.14), 0 4px 16px rgba(13,63,122,0.08)",
        }}
      >
        {/* Logo + branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div
              className="absolute inset-0 rounded-full blur-2xl opacity-30"
              style={{ background: `radial-gradient(circle, ${GOLD} 0%, transparent 70%)` }}
            />
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt="Divayshakati"
              className="relative w-20 h-20 object-contain drop-shadow-xl"
            />
          </div>

          <h1
            className="text-2xl font-extrabold tracking-wide mb-0.5"
            style={{ color: SIDEBAR_BG }}
          >
            Divayshakati
          </h1>
          <p className="text-[10px] font-semibold tracking-[0.25em] uppercase mb-4"
            style={{ color: GOLD }}>
            Project Manager
          </p>

          {/* Role chips */}
          <div className="flex flex-wrap justify-center gap-1">
            {ROLES.map((role) => (
              <span
                key={role}
                className="px-2 py-0.5 rounded-full text-[9px] font-semibold border tracking-wide"
                style={{
                  backgroundColor: `rgba(13,63,122,0.06)`,
                  borderColor: `rgba(13,63,122,0.14)`,
                  color: SIDEBAR_BG,
                }}
              >
                {role}
              </span>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px mb-7" style={{ background: `rgba(13,63,122,0.08)` }} />

        {/* Form */}
        <h2 className="text-lg font-bold mb-5" style={{ color: SIDEBAR_BG }}>Sign In</h2>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Username */}
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "rgba(13,63,122,0.65)" }}>
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "rgba(13,63,122,0.35)" }} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin, alice, bob..."
                autoComplete="username"
                className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm outline-none transition-all"
                style={{
                  background: "rgba(13,63,122,0.04)",
                  border: "1px solid rgba(13,63,122,0.12)",
                  color: SIDEBAR_BG,
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = GOLD;
                  e.target.style.background = "rgba(13,63,122,0.06)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(13,63,122,0.12)";
                  e.target.style.background = "rgba(13,63,122,0.04)";
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "rgba(13,63,122,0.65)" }}>
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "rgba(13,63,122,0.35)" }} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                autoComplete="current-password"
                className="w-full pl-10 pr-11 py-3 rounded-2xl text-sm outline-none transition-all"
                style={{
                  background: "rgba(13,63,122,0.04)",
                  border: "1px solid rgba(13,63,122,0.12)",
                  color: SIDEBAR_BG,
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = GOLD;
                  e.target.style.background = "rgba(13,63,122,0.06)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(13,63,122,0.12)";
                  e.target.style.background = "rgba(13,63,122,0.04)";
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: "rgba(13,63,122,0.4)" }}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full py-3.5 rounded-2xl text-sm font-bold tracking-wide text-white transition-all disabled:opacity-70 flex items-center justify-center gap-2 mt-1"
            style={{
              background: loginMutation.isPending
                ? SIDEBAR_BG
                : `linear-gradient(135deg, ${SIDEBAR_BG} 0%, #1a5fa8 100%)`,
              boxShadow: `0 4px 20px rgba(13,63,122,0.30)`,
            }}
          >
            {loginMutation.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" />Signing in...</>
              : "Sign In"}
          </button>

          <p className="text-center text-[10px] mt-2" style={{ color: "rgba(13,63,122,0.40)" }}>
            admin · alice · bob · clara · david · rahul · priya
          </p>
        </form>
      </div>
    </div>
  );
}
