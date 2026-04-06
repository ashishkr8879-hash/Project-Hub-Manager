import { useState } from "react";
import { useGetAdminProfile, useListClients, useListEditors, useCreateClient, useCreateEditor, useDeleteClient, useDeleteEditor } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Mail, Phone, User, Minus, X, Plus, Trash2,
  Users, Briefcase, Activity, CheckCircle2, Edit2, BarChart2, Lock, Building2, Save, AtSign,
} from "lucide-react";

const fmt = (n: number) => "₹" + n.toLocaleString("en-IN");
const SPEC_COLORS: Record<string, string> = {
  "Video Editor": "#7c3aed", "Graphic Designer": "#ec4899",
  "Social Media Manager": "#0ea5e9", "Website Development": "#10b981", "Ads Setup": "#f97316",
};

function EditProfileModal({ profile, onClose, onSaved }: { profile: any; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: profile?.name ?? "",
    businessName: profile?.businessName ?? "",
    email: profile?.email ?? "",
    phone: profile?.phone ?? "",
    username: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSave() {
    setError("");
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match"); return;
    }
    if (form.newPassword && form.newPassword.length < 4) {
      setError("Password must be at least 4 characters"); return;
    }
    setSaving(true);
    try {
      const body: any = {};
      if (form.name) body.name = form.name;
      if (form.businessName) body.businessName = form.businessName;
      if (form.email) body.email = form.email;
      if (form.phone) body.phone = form.phone;
      if (form.username) body.username = form.username;
      if (form.newPassword) body.password = form.newPassword;

      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Failed to update"); return; }
      setSuccess(true);
      setTimeout(() => { onSaved(); onClose(); }, 800);
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md z-10 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/60 sticky top-0 bg-zinc-950">
          <h2 className="text-base font-bold text-white">Edit Profile</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          {success && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
              <CheckCircle2 className="w-4 h-4" />Profile updated successfully!
            </div>
          )}
          {error && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</div>}

          <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">Basic Info</p>
          {[
            { key: "name", label: "Full Name", icon: User, placeholder: "Your name" },
            { key: "businessName", label: "Business Name", icon: Building2, placeholder: "Business name" },
            { key: "email", label: "Email Address", icon: Mail, placeholder: "email@example.com", type: "email" },
            { key: "phone", label: "Phone Number", icon: Phone, placeholder: "+91 98765 XXXXX" },
          ].map(({ key, label, icon: Icon, placeholder, type = "text" }) => (
            <div key={key}>
              <label className="text-xs text-zinc-500 block mb-1">{label}</label>
              <div className="relative">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
                <input
                  type={type}
                  value={(form as any)[key]}
                  onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full pl-9 pr-3 py-2.5 bg-zinc-900 border border-zinc-800/60 rounded-xl text-sm text-white placeholder-zinc-600"
                />
              </div>
            </div>
          ))}

          <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold pt-1">Login Credentials</p>
          <div>
            <label className="text-xs text-zinc-500 block mb-1">New Username</label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="Leave blank to keep current"
                className="w-full pl-9 pr-3 py-2.5 bg-zinc-900 border border-zinc-800/60 rounded-xl text-sm text-white placeholder-zinc-600"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-500 block mb-1">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
              <input
                type="password"
                value={form.newPassword}
                onChange={(e) => setForm(f => ({ ...f, newPassword: e.target.value }))}
                placeholder="Leave blank to keep current"
                className="w-full pl-9 pr-3 py-2.5 bg-zinc-900 border border-zinc-800/60 rounded-xl text-sm text-white placeholder-zinc-600"
              />
            </div>
          </div>
          {form.newPassword && (
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  placeholder="Repeat new password"
                  className="w-full pl-9 pr-3 py-2.5 bg-zinc-900 border border-zinc-800/60 rounded-xl text-sm text-white placeholder-zinc-600"
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={saving || success}
              className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</> : <><Save className="w-4 h-4" />Save Changes</>}
            </button>
            <button onClick={onClose} className="px-4 py-3 rounded-xl bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700 transition-colors">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  const qc = useQueryClient();
  const [section, setSection] = useState<"clients" | "team">("clients");
  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddEditor, setShowAddEditor] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  const { data: profile, isLoading, refetch: refetchProfile } = useGetAdminProfile({ query: { refetchInterval: 60000 } });
  const { data: clients = [], refetch: refetchClients } = useListClients();
  const { data: editors = [], refetch: refetchEditors } = useListEditors();
  const deleteClientMut = useDeleteClient();
  const deleteEditorMut = useDeleteEditor();
  const createClientMut = useCreateClient();
  const createEditorMut = useCreateEditor();

  const [clientForm, setClientForm] = useState({ name: "", phone: "", email: "", businessType: "", city: "" });
  const [editorForm, setEditorForm] = useState({ name: "", email: "", username: "", password: "", phone: "", specialization: "Video Editor", location: "", bankAccount: "", monthlySalary: "" });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = profile?.stats;
  const totalRevenue = stats?.totalRevenue ?? 0;
  const totalModelCosts = stats?.totalModelCost ?? 0;
  const netRevenue = stats?.netRevenue ?? (totalRevenue - totalModelCosts);

  const logoUrl = `${import.meta.env.BASE_URL}logo.png`;

  const statCards = [
    { label: "Total Projects", value: stats?.totalProjects ?? 0, icon: Briefcase, color: "#3b82f6" },
    { label: "Active", value: stats?.activeProjects ?? 0, icon: Activity, color: "#10b981" },
    { label: "Completed", value: stats?.completedProjects ?? 0, icon: CheckCircle2, color: "#8b5cf6" },
    { label: "Customisation", value: stats?.customisationProjects ?? 0, icon: Edit2, color: "#f59e0b" },
    { label: "Clients", value: stats?.totalClients ?? 0, icon: Users, color: "#ec4899" },
    { label: "Team", value: stats?.totalEditors ?? 0, icon: BarChart2, color: "#06b6d4" },
  ];

  async function addClient() {
    if (!clientForm.name || !clientForm.phone) return;
    await createClientMut.mutateAsync({ data: clientForm });
    refetchClients();
    setShowAddClient(false);
    setClientForm({ name: "", phone: "", email: "", businessType: "", city: "" });
  }

  async function addEditor() {
    if (!editorForm.name || !editorForm.email || !editorForm.username || !editorForm.password) return;
    await createEditorMut.mutateAsync({ data: { ...editorForm, monthlySalary: editorForm.monthlySalary ? +editorForm.monthlySalary : 0 } });
    refetchEditors();
    setShowAddEditor(false);
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Profile header */}
      <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-4">
          <img src={logoUrl} alt="Divayshakati" className="w-14 h-14 sm:w-16 sm:h-16 object-contain flex-shrink-0 drop-shadow-lg" />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-white">{profile?.name ?? "Admin"}</h1>
            <p className="text-sm text-amber-400 font-semibold">{profile?.businessName ?? "Divayshakati"}</p>
            <div className="flex items-center flex-wrap gap-3 mt-1.5">
              {profile?.email && <span className="text-xs text-zinc-500 flex items-center gap-1"><Mail className="w-3 h-3" />{profile.email}</span>}
              {profile?.phone && <span className="text-xs text-zinc-500 flex items-center gap-1"><Phone className="w-3 h-3" />{profile.phone}</span>}
            </div>
          </div>
          <button
            onClick={() => setShowEditProfile(true)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors flex-shrink-0"
          >
            <Edit2 className="w-3.5 h-3.5" /><span className="hidden sm:inline">Edit Profile</span><span className="sm:hidden">Edit</span>
          </button>
        </div>
      </div>

      {/* Revenue overview */}
      <div className="bg-yellow-500/8 border border-yellow-500/25 rounded-2xl p-5 space-y-3">
        <div className="text-xs font-bold text-yellow-400 uppercase tracking-wider">Revenue Overview</div>
        <div className="flex justify-between items-center"><span className="text-sm text-zinc-400">Total Revenue</span><span className="text-base font-bold text-white">{fmt(totalRevenue)}</span></div>
        <div className="flex justify-between items-center"><span className="text-sm text-zinc-400 flex items-center gap-1"><Minus className="w-3 h-3 text-red-400" />Model Costs</span><span className="text-sm font-semibold text-red-400">− {fmt(totalModelCosts)}</span></div>
        <div className="h-px bg-yellow-500/30" />
        <div className="flex justify-between items-center"><span className="text-sm font-bold text-white">Net Revenue</span><span className="text-xl font-bold text-emerald-400">{fmt(netRevenue)}</span></div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((s, i) => {
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

      {/* Section switcher */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <button onClick={() => setSection("clients")} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${section === "clients" ? "bg-blue-500 text-white" : "bg-zinc-900 border border-zinc-800/60 text-zinc-400 hover:text-white"}`}>
            <Users className="w-4 h-4" />Clients ({clients.length})
          </button>
          <button onClick={() => setSection("team")} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${section === "team" ? "bg-blue-500 text-white" : "bg-zinc-900 border border-zinc-800/60 text-zinc-400 hover:text-white"}`}>
            <BarChart2 className="w-4 h-4" />Team ({editors.length})
          </button>
          {section === "clients" ? (
            <button onClick={() => setShowAddClient(true)} className="ml-auto flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors">
              <Plus className="w-3.5 h-3.5" />Add Client
            </button>
          ) : (
            <button onClick={() => setShowAddEditor(true)} className="ml-auto flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors">
              <Plus className="w-3.5 h-3.5" />Add Member
            </button>
          )}
        </div>

        {section === "clients" && (
          <>
            {showAddClient && (
              <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-4 space-y-3">
                <div className="text-sm font-semibold text-white">New Client</div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "name", placeholder: "Name *" }, { key: "phone", placeholder: "Phone *" },
                    { key: "email", placeholder: "Email" }, { key: "businessType", placeholder: "Business Type" },
                    { key: "city", placeholder: "City" },
                  ].map(({ key, placeholder }) => (
                    <input key={key} value={(clientForm as any)[key]} onChange={(e) => setClientForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600" />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={addClient} disabled={createClientMut.isPending} className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50">{createClientMut.isPending ? "..." : "Add"}</button>
                  <button onClick={() => setShowAddClient(false)} className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-sm">Cancel</button>
                </div>
              </div>
            )}
            <div className="space-y-2">
              {clients.length === 0 ? (
                <div className="text-center py-10 text-zinc-500 text-sm">No clients yet</div>
              ) : (
                clients.map((c) => {
                  const initials = c.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                  const hue = (c.id.charCodeAt(0) * 53) % 360;
                  return (
                    <div key={c.id} className="flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800/60 rounded-xl">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: `hsl(${hue},55%,40%)` }}>{initials}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{c.name}</p>
                        <p className="text-xs text-zinc-500">{c.businessType} · {c.phone}</p>
                      </div>
                      <button onClick={async () => { await deleteClientMut.mutateAsync({ clientId: c.id }); refetchClients(); }} className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {section === "team" && (
          <>
            {showAddEditor && (
              <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-4 space-y-3">
                <div className="text-sm font-semibold text-white">New Team Member</div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "name", placeholder: "Name *" }, { key: "email", placeholder: "Email *" },
                    { key: "username", placeholder: "Username *" }, { key: "password", placeholder: "Password *", type: "password" },
                    { key: "phone", placeholder: "Phone" }, { key: "location", placeholder: "Location" },
                    { key: "bankAccount", placeholder: "Bank Account" }, { key: "monthlySalary", placeholder: "Monthly Salary (₹)", type: "number" },
                  ].map(({ key, placeholder, type = "text" }) => (
                    <input key={key} type={type} value={(editorForm as any)[key]} onChange={(e) => setEditorForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600" />
                  ))}
                  <select value={editorForm.specialization} onChange={(e) => setEditorForm(f => ({ ...f, specialization: e.target.value }))} className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white col-span-2">
                    {[...Object.keys(SPEC_COLORS), "Other"].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={addEditor} disabled={createEditorMut.isPending} className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50">{createEditorMut.isPending ? "..." : "Add"}</button>
                  <button onClick={() => setShowAddEditor(false)} className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-sm">Cancel</button>
                </div>
              </div>
            )}
            <div className="space-y-2">
              {editors.length === 0 ? (
                <div className="text-center py-10 text-zinc-500 text-sm">No team members yet</div>
              ) : (
                editors.map((e) => {
                  const specColor = SPEC_COLORS[e.specialization] ?? "#6b7280";
                  const initials = e.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                  return (
                    <div key={e.id} className="flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800/60 rounded-xl">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ backgroundColor: specColor + "25" }}>
                        <span style={{ color: specColor }}>{initials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{e.name}</p>
                        <p className="text-xs font-medium" style={{ color: specColor }}>{e.specialization}</p>
                        <p className="text-[10px] text-zinc-600">@{e.username} · {e.email}</p>
                      </div>
                      {e.monthlySalary && <span className="text-xs text-zinc-400 flex-shrink-0">{fmt(e.monthlySalary)}/mo</span>}
                      <button onClick={async () => { await deleteEditorMut.mutateAsync({ editorId: e.id }); refetchEditors(); }} className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      {showEditProfile && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEditProfile(false)}
          onSaved={() => { qc.invalidateQueries({ queryKey: ["/api/admin/profile"] }); refetchProfile(); }}
        />
      )}
    </div>
  );
}
