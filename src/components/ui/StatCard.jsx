import { Users, UserCheck, Flame, GitBranch } from "lucide-react";

const iconMap = {
  Users,
  UserCheck,
  Flame,
  GitBranch,
};

export default function StatCard({ label, value, sub, icon, tint }) {
  const Icon = iconMap[icon] || Users;
  return (
    <div className="bg-white border border-slate-300 rounded-card p-6 flex items-start gap-3 shadow-card transition-all duration-200 ease-out hover:shadow-elevated hover:-translate-y-0.5">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center ring-1 ring-black/5 ${tint}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500">{label}</p>
        <p className="text-2xl font-bold leading-tight mt-0.5 text-gray-900">{value}</p>
        <p className="text-[11px] text-emerald-600 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}
