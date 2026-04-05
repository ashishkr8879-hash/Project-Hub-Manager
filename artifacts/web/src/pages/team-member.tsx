import { Link } from "wouter";
import { useGetEditorProfile, getGetEditorProfileQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, CheckCircle2, Clock, AlertCircle, Video } from "lucide-react";

const SPEC_COLORS: Record<string, string> = {
  "Video Editor": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "Graphic Designer": "bg-pink-500/10 text-pink-400 border-pink-500/20",
  "Social Media Manager": "bg-sky-500/10 text-sky-400 border-sky-500/20",
  "Website Development": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "Ads Setup": "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400",
  in_progress: "bg-blue-500/10 text-blue-400",
  completed: "bg-emerald-500/10 text-emerald-400",
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color || "text-white"}`}>{value}</p>
    </div>
  );
}

export default function TeamMember({ editorId }: { editorId: string }) {
  const { data: profile, isLoading } = useGetEditorProfile(editorId, { query: { enabled: !!editorId, queryKey: getGetEditorProfileQueryKey(editorId) } });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-zinc-800 rounded animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-20 bg-zinc-800 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!profile) {
    return <div className="text-zinc-500 py-12 text-center">Editor not found.</div>;
  }

  const specColor = SPEC_COLORS[profile.specialization] || "bg-zinc-500/10 text-zinc-400";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/team">
          <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white" data-testid="button-back-team">
            <ArrowLeft className="w-4 h-4 mr-1" />Back
          </Button>
        </Link>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex items-start gap-5">
        <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700 flex-shrink-0">
          <User className="w-8 h-8 text-zinc-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white" data-testid="text-editor-name">{profile.name}</h2>
              <Badge className={`mt-1 ${specColor}`}>{profile.specialization}</Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
            <div><span className="text-zinc-500">Phone:</span> <span className="text-zinc-300 ml-1">{profile.phone}</span></div>
            <div><span className="text-zinc-500">Email:</span> <span className="text-zinc-300 ml-1">{profile.email}</span></div>
            <div><span className="text-zinc-500">Joined:</span> <span className="text-zinc-300 ml-1">{new Date(profile.joinedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span></div>
            {profile.monthlySalary ? <div><span className="text-zinc-500">Salary:</span> <span className="text-zinc-300 ml-1">{formatCurrency(profile.monthlySalary)}/mo</span></div> : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Projects" value={profile.stats.totalProjects} />
        <StatCard label="Completed" value={profile.stats.completedProjects} color="text-emerald-400" />
        <StatCard label="In Progress" value={profile.stats.inProgressProjects} color="text-blue-400" />
        <StatCard label="Pending" value={profile.stats.pendingProjects} color="text-yellow-400" />
        <StatCard label="Videos Uploaded" value={profile.stats.totalVideosUploaded} color="text-violet-400" />
        <StatCard label="Approved Videos" value={profile.stats.approvedVideos} color="text-emerald-400" />
        <StatCard label="Rejected Videos" value={profile.stats.rejectedVideos} color="text-red-400" />
        <StatCard label="Customisation" value={profile.stats.customisationProjects} color="text-orange-400" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4">
          <p className="text-xs text-zinc-500 mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(profile.stats.totalRevenue)}</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
          <p className="text-xs text-zinc-500 mb-1">Company Profit</p>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(profile.stats.companyProfit)}</p>
        </div>
        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4">
          <p className="text-xs text-zinc-500 mb-1">Total Earnings</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(profile.stats.totalEarnings)}</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Projects</h3>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                {["Project", "Client", "Type", "Status", "Value", "Progress"].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {profile.allProjects.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-500">No projects assigned.</td></tr>
              ) : profile.allProjects.map(p => (
                <tr key={p.id} className="hover:bg-zinc-800/20 transition-colors" data-testid={`row-editor-project-${p.id}`}>
                  <td className="px-4 py-3 text-sm font-medium text-white">{p.projectName}</td>
                  <td className="px-4 py-3 text-sm text-zinc-300">{p.clientName}</td>
                  <td className="px-4 py-3 text-xs text-zinc-400">{p.projectType.replace("_", " ")}</td>
                  <td className="px-4 py-3">
                    <Badge className={`text-xs ${statusColors[p.status] || ""}`}>{p.status.replace("_", " ")}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-white">{formatCurrency(p.totalValue)}</td>
                  <td className="px-4 py-3 text-sm text-zinc-400">{p.completedDeliverables}/{p.totalDeliverables}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
