import { useAuth } from "@/hooks/use-auth";
import { useGetSalesPersonStats } from "@workspace/api-client-react";
import { User, Phone, Mail, Calendar, TrendingUp, Target } from "lucide-react";

const BRAND_BLUE  = "#0d3f7a";
const SALES_COLOR = "#059669";
const GOLD        = "#e8ab15";

function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
}

export default function SalesProfile() {
  const { user } = useAuth();
  const salesId = (user as any)?.salesId ?? user?.id ?? "";
  const { data, isLoading } = useGetSalesPersonStats(salesId);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: SALES_COLOR, borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!data) return null;
  const sp = data.salesperson;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold" style={{ color: BRAND_BLUE }}>My Profile</h1>

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-5 mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
            style={{ backgroundColor: SALES_COLOR }}>
            {sp.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: BRAND_BLUE }}>{sp.name}</h2>
            <p className="text-sm font-medium" style={{ color: SALES_COLOR }}>Sales Executive</p>
            <p className="text-xs text-slate-400 mt-0.5">@{sp.username}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
            <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400">Phone</p>
              <p className="text-sm font-medium text-slate-700">{sp.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
            <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400">Email</p>
              <p className="text-sm font-medium text-slate-700">{sp.email || "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
            <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400">Joined</p>
              <p className="text-sm font-medium text-slate-700">
                {new Date(sp.joinedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
            <Target className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400">Monthly Target</p>
              <p className="text-sm font-medium text-slate-700">{sp.target} clients</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance summary */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4" style={{ color: SALES_COLOR }} />
          <h3 className="font-semibold text-sm" style={{ color: BRAND_BLUE }}>Performance Summary</h3>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: BRAND_BLUE }}>{data.clientsClosed}</p>
            <p className="text-xs text-slate-500 mt-0.5">Clients</p>
          </div>
          <div className="text-center border-x border-slate-100">
            <p className="text-2xl font-bold" style={{ color: GOLD }}>{fmt(data.totalRevenue)}</p>
            <p className="text-xs text-slate-500 mt-0.5">Total Revenue</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: SALES_COLOR }}>{data.targetAchieved}%</p>
            <p className="text-xs text-slate-500 mt-0.5">Target</p>
          </div>
        </div>

        <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${data.targetAchieved}%`, backgroundColor: SALES_COLOR }} />
        </div>
      </div>

      <p className="text-xs text-slate-400 text-center">Contact the admin to update your profile information.</p>
    </div>
  );
}
