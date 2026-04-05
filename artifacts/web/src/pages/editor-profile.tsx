import { useAuth } from "@/hooks/use-auth";
import { useGetEditorProfile } from "@workspace/api-client-react";
import { Mail, Phone, MapPin, CreditCard, Calendar, Briefcase, CheckCircle2, Activity, Video, Edit2 } from "lucide-react";

const SPEC_COLORS: Record<string, string> = {
  "Video Editor": "#7c3aed", "Graphic Designer": "#ec4899",
  "Social Media Manager": "#0ea5e9", "Website Development": "#10b981", "Ads Setup": "#f97316",
};

export default function EditorProfile() {
  const { user } = useAuth();
  const editorId = (user as any)?.editorId ?? user?.id ?? "";
  const spec = (user as any)?.specialization ?? "Team Member";
  const specColor = SPEC_COLORS[spec] ?? "#7c3aed";

  const { data: profile, isLoading } = useGetEditorProfile(editorId);

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: specColor + "80", borderTopColor: "transparent" }} />
    </div>
  );

  const stats = profile?.stats;
  const initials = profile?.name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() ?? "TM";

  const statItems = [
    { label: "Total Projects", value: stats?.totalProjects ?? 0, icon: Briefcase, color: "#3b82f6" },
    { label: "Completed", value: stats?.completedProjects ?? 0, icon: CheckCircle2, color: "#10b981" },
    { label: "Active", value: stats?.inProgressProjects ?? 0, icon: Activity, color: "#8b5cf6" },
    { label: "Customisation", value: stats?.customisationProjects ?? 0, icon: Edit2, color: "#f59e0b" },
    { label: "Videos Uploaded", value: stats?.totalVideosUploaded ?? 0, icon: Video, color: "#ec4899" },
    { label: "Approved", value: stats?.approvedVideos ?? 0, icon: CheckCircle2, color: "#10b981" },
  ];

  const infoRows = [
    { icon: Mail, label: "Email", value: profile?.email },
    { icon: Phone, label: "Phone", value: profile?.phone },
    { icon: MapPin, label: "Location", value: profile?.location },
    { icon: CreditCard, label: "Bank Account", value: profile?.bankAccount },
    { icon: Calendar, label: "Joined", value: profile?.joinedAt },
  ];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Profile card */}
      <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0"
            style={{ backgroundColor: specColor + "25", color: specColor }}>
            {initials}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{profile?.name ?? user?.name}</h1>
            <p className="text-sm font-semibold mt-0.5" style={{ color: specColor }}>{spec}</p>
            {profile?.location && <p className="text-xs text-zinc-500 mt-1">{profile.location}</p>}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {statItems.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-3 text-center">
              <Icon className="w-4 h-4 mx-auto mb-1.5" style={{ color: s.color }} />
              <div className="text-lg font-bold text-white">{s.value}</div>
              <div className="text-[10px] text-zinc-500 leading-tight">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Info */}
      <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-5 space-y-3">
        <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Contact Info</div>
        {infoRows.map(({ icon: Icon, label, value }) => (
          value ? (
            <div key={label} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                <Icon className="w-3.5 h-3.5 text-zinc-400" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-500">{label}</p>
                <p className="text-sm text-white font-medium">{value}</p>
              </div>
            </div>
          ) : null
        ))}
      </div>

      {/* Video stats */}
      {(stats?.totalVideosUploaded ?? 0) > 0 && (
        <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-5">
          <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Video Performance</div>
          <div className="space-y-2">
            {[
              { label: "Uploaded", value: stats?.totalVideosUploaded ?? 0, color: "#3b82f6" },
              { label: "Approved", value: stats?.approvedVideos ?? 0, color: "#10b981" },
              { label: "Rejected", value: stats?.rejectedVideos ?? 0, color: "#ef4444" },
              { label: "Pending Review", value: stats?.pendingReviewVideos ?? 0, color: "#f59e0b" },
            ].map(({ label, value, color }) => {
              const pct = stats?.totalVideosUploaded ? Math.round((value / stats.totalVideosUploaded) * 100) : 0;
              return (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-400">{label}</span>
                    <span className="text-white font-semibold">{value}</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
