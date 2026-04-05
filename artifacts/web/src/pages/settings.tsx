import { useGetAdminProfile, getGetAdminProfileQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Building2, Mail, Phone, User, Briefcase, Users, CheckCircle2, Activity } from "lucide-react";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<any>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-zinc-800/50 last:border-0">
      <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-zinc-400" />
      </div>
      <div>
        <p className="text-xs text-zinc-500 mb-0.5">{label}</p>
        <p className="text-sm text-zinc-200" data-testid={`text-${label.toLowerCase().replace(/\s+/g, "-")}`}>{value}</p>
      </div>
    </div>
  );
}

export default function Settings() {
  const { data: profile, isLoading } = useGetAdminProfile({ query: { queryKey: getGetAdminProfileQueryKey() } });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-zinc-800 rounded animate-pulse" />
        <div className="h-64 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-zinc-400 text-sm mt-0.5">Admin profile & business information</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="bg-zinc-800/40 px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white text-black font-bold text-xl flex items-center justify-center rounded-xl">
              DV
            </div>
            <div>
              <h3 className="text-lg font-bold text-white" data-testid="text-admin-name">{profile.name}</h3>
              <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs">Admin</Badge>
            </div>
          </div>
        </div>
        <div className="px-6 py-2">
          <InfoRow icon={Building2} label="Business Name" value={profile.businessName} />
          <InfoRow icon={Mail} label="Email" value={profile.email} />
          <InfoRow icon={Phone} label="Phone" value={profile.phone} />
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800">
          <h3 className="font-semibold text-zinc-200">Business Overview</h3>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-4 h-4 text-zinc-500" />
              <span className="text-xs text-zinc-500">Total Projects</span>
            </div>
            <p className="text-2xl font-bold text-white" data-testid="stat-total-projects">{profile.stats.totalProjects}</p>
          </div>
          <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-zinc-500">Completed</span>
            </div>
            <p className="text-2xl font-bold text-emerald-400">{profile.stats.completedProjects}</p>
          </div>
          <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-zinc-500">Active</span>
            </div>
            <p className="text-2xl font-bold text-blue-400">{profile.stats.activeProjects}</p>
          </div>
          <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-zinc-500" />
              <span className="text-xs text-zinc-500">Editors</span>
            </div>
            <p className="text-2xl font-bold text-white">{profile.stats.totalEditors}</p>
          </div>
          <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20 col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-zinc-500">Total Revenue</span>
            </div>
            <p className="text-3xl font-bold text-emerald-400">{formatCurrency(profile.stats.totalRevenue)}</p>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800">
          <h3 className="font-semibold text-zinc-200">Recent Clients</h3>
        </div>
        <div className="divide-y divide-zinc-800/50">
          {profile.recentClients.map(c => (
            <div key={c.id} className="px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700">
                  <User className="w-4 h-4 text-zinc-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{c.name}</p>
                  <p className="text-xs text-zinc-500">{c.businessType} · {c.city}</p>
                </div>
              </div>
              <span className="text-xs text-zinc-600">{new Date(c.createdAt).toLocaleDateString("en-IN")}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
