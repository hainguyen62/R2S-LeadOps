import { Flame, TrendingUp, Users } from "lucide-react";
import { buildFunnelRows } from "../dashboard/FunnelBody.jsx";

const bars = [22, 35, 28, 41, 33, 47, 39];
const funnelStages = [
  { name: "Lead mới", value: 248, pct: "100%" },
  { name: "Đã liên hệ", value: 154, pct: "62%" },
  { name: "Đang tư vấn", value: 66, pct: "27%" },
  { name: "Đã đặt cọc", value: 28, pct: "11%" },
  { name: "Đã đăng ký", value: 18, pct: "7%" },
];
const funnel = buildFunnelRows(funnelStages);

export default function DashboardPreview() {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_64px_-12px_rgba(37,99,235,0.18)]"
      aria-hidden
    >
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <span className="ml-2 text-[11px] font-medium text-slate-400">r2s-leadops.app/dashboard</span>
      </div>

      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { label: "Tổng lead", value: "248", icon: Users, tint: "text-brand-600 bg-brand-50" },
            { label: "Lead mới", value: "12", icon: TrendingUp, tint: "text-emerald-600 bg-emerald-50" },
            { label: "Lead nóng", value: "36", icon: Flame, tint: "text-orange-600 bg-orange-50" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-xl border border-slate-100 bg-white p-2.5 sm:p-3"
              >
                <div className={`mb-1.5 inline-flex rounded-md p-1 ${stat.tint}`}>
                  <Icon size={12} strokeWidth={2.5} />
                </div>
                <p className="text-[9px] font-medium text-slate-500 sm:text-[10px]">{stat.label}</p>
                <p className="font-display text-base font-bold text-slate-900 sm:text-lg">{stat.value}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-5">
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 sm:col-span-3">
            <p className="text-[10px] font-semibold text-slate-600">Lead theo ngày</p>
            <div className="mt-3 flex h-16 items-end gap-1 sm:h-20 sm:gap-1.5">
              {bars.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-brand-500/80 transition-all"
                  style={{ height: `${(h / 47) * 100}%` }}
                />
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 sm:col-span-2">
            <p className="text-[10px] font-semibold text-slate-600">Phễu chuyển đổi</p>
            <div className="mt-2 flex flex-col items-center gap-[1px]">
              {funnel.map((row) => (
                <span
                  key={row.name}
                  className="block h-2.5"
                  style={{
                    width: `${row.topRatio * 100}%`,
                    clipPath: row.clipPath,
                    background: row.color,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}