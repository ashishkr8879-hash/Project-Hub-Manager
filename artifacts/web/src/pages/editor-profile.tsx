import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useGetEditorProfile, useUpdateEditor } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Mail, Phone, MapPin, CreditCard, Calendar, Briefcase, CheckCircle2, Activity, Video, Edit2, X, Save, User, Loader2, Camera } from "lucide-react";

const SPEC_COLORS: Record<string, string> = {
  "Video Editor": "#7c3aed", "Graphic Designer": "#ec4899",
  "Social Media Manager": "#0ea5e9", "Website Development": "#10b981", "Ads Setup": "#f97316",
};

function EditProfileModal({
  profile, editorId, specColor, onClose,
}: { profile: any; editorId: string; specColor: string; onClose: () => void }) {
  const qc = useQueryClient();
  const updateMut = useUpdateEditor();
  const [form, setForm] = useState({
    name: profile?.name ?? "",
    phone: profile?.phone ?? "",
    location: profile?.location ?? "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function f(key: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [key]: e.target.value }));
  }

  async function save() {
    setError("");
    if (!form.name.trim()) { setError("Name is required"); return; }
    try {
      await updateMut.mutateAsync({
        editorId,
        data: {
          name: form.name.trim(),
          phone: form.phone.trim() || undefined,
          location: form.location.trim() || undefined,
        },
      });
      qc.invalidateQueries({ queryKey: [`/api/editors/${editorId}/profile`] });
      setSuccess(true);
      setTimeout(onClose, 900);
    } catch {
      setError("Failed to save changes. Please try again.");
    }
  }

  const fields = [
    { key: "name",     label: "Full Name",     placeholder: "Your name",       icon: User },
    { key: "phone",    label: "Phone Number",  placeholder: "+91 9XXXXXXXXX",  icon: Phone },
    { key: "location", label: "City / Location", placeholder: "Mumbai",        icon: MapPin },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-sm z-10 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/60">
          <h2 className="text-base font-bold text-white">Edit Profile</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {/* Avatar preview */}
          <div className="flex justify-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold relative"
              style={{ backgroundColor: specColor + "25", color: specColor }}
            >
              {form.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?"}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                <Camera className="w-2.5 h-2.5 text-zinc-400" />
              </div>
            </div>
          </div>

          {/* Fields */}
          {fields.map(({ key, label, placeholder, icon: Icon }) => (
            <div key={key}>
              <label className="text-xs text-zinc-500 block mb-1.5">{label}</label>
              <div className="relative">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                <input
                  value={(form as any)[key]}
                  onChange={f(key)}
                  placeholder={placeholder}
                  className="w-full pl-9 pr-3 py-2.5 bg-zinc-900 border border-zinc-800/60 rounded-xl text-sm text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none transition-colors"
                />
              </div>
            </div>
          ))}

          {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>}
          {success && <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">Profile updated!</p>}

          <div className="flex gap-2 pt-1">
            <button
              onClick={save}
              disabled={updateMut.isPending || success}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-1.5 transition-colors"
              style={{ backgroundColor: specColor }}
            >
              {updateMut.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</>
                : <><Save className="w-4 h-4" />Save Changes</>}
            </button>
            <button onClick={onClose} className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditorProfile() {
  const { user } = useAuth();
  const editorId = (user as any)?.editorId ?? user?.id ?? "";
  const spec = (user as any)?.specialization ?? "Team Member";
  const specColor = SPEC_COLORS[spec] ?? "#7c3aed";
  const [editOpen, setEditOpen] = useState(false);

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
    { label: "Uploaded", value: stats?.totalVideosUploaded ?? 0, icon: Video, color: "#ec4899" },
    { label: "Approved", value: stats?.approvedVideos ?? 0, icon: CheckCircle2, color: "#10b981" },
  ];

  const infoRows = [
    { icon: Mail,       label: "Email",        value: profile?.email },
    { icon: Phone,      label: "Phone",        value: profile?.phone },
    { icon: MapPin,     label: "Location",     value: profile?.location },
    { icon: CreditCard, label: "Bank Account", value: profile?.bankAccount },
    { icon: Calendar,   label: "Joined",       value: profile?.joinedAt },
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
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white">{profile?.name ?? user?.name}</h1>
            <p className="text-sm font-semibold mt-0.5" style={{ color: specColor }}>{spec}</p>
            {profile?.location && <p className="text-xs text-zinc-500 mt-1">{profile.location}</p>}
          </div>
          {/* Edit button */}
          <button
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors"
            style={{ borderColor: specColor + "40", color: specColor, backgroundColor: specColor + "10" }}
          >
            <Edit2 className="w-3.5 h-3.5" />Edit Profile
          </button>
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

      {/* Video / work stats */}
      {(stats?.totalVideosUploaded ?? 0) > 0 && (
        <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-5">
          <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Work Performance</div>
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

      {editOpen && (
        <EditProfileModal
          profile={profile}
          editorId={editorId}
          specColor={specColor}
          onClose={() => setEditOpen(false)}
        />
      )}
    </div>
  );
}
