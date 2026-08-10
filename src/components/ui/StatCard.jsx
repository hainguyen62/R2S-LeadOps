import { Users, UserPlus, Flame, BadgeCheck, TrendingUp, TrendingDown } from "lucide-react";

const iconMap = {
  Users,
  UserPlus,
  Flame,
  BadgeCheck,
};

export default function StatCard({ label, value, sub, icon, tint }) {
  const Icon = iconMap[icon] || Users;
  const trimmed = typeof sub === "string" ? sub.trim() : "";
  const isPositive = trimmed.startsWith("+");
  const isNegative = trimmed.startsWith("-");
  const subText = isPositive || isNegative ? trimmed.slice(1) : sub;

  return (
    <div className="bg-white border border-slate-300 rounded-card p-6 flex items-start gap-3 shadow-card transition-all duration-200 ease-out hover:shadow-elevated hover:-translate-y-0.5">
      <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white shrink-0 ${tint}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-500 truncate">{label}</p>
        <p className="text-2xl font-bold leading-tight mt-0.5 text-gray-900">{value}</p>
        {isPositive ? (
          <p className="flex items-center gap-1 text-[11px] text-emerald-600 mt-0.5">
            <TrendingUp size={11} />
            {subText}
          </p>
        ) : isNegative ? (
          <p className="flex items-center gap-1 text-[11px] text-red-500 mt-0.5">
            <TrendingDown size={11} />
            {subText}
          </p>
        ) : (
          <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>
        )}
      </div>
    </div>
  );
}