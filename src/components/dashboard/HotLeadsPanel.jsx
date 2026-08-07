import { useMemo } from "react";
import { Flame, Droplet } from "lucide-react";
import ChartCard from "../ui/ChartCard.jsx";
import Avatar from "../ui/Avatar.jsx";
import { leads } from "../../data/mockData.js";
import { priorityTier } from "../../utils/leadScoring.js";

// 3 cấp độ ưu tiên — icon & màu khác nhau đủ rõ để nhận biết ngay từ xa,
// không chỉ dựa vào con số:
//   hot  -> lửa đỏ, tô đặc (fill)   : cần gọi ngay
//   warm -> lửa cam, tô đặc (fill)  : cần chăm sóc sớm
//   cool -> giọt nước xanh, viền rỗng: chưa gấp, không dùng icon lửa
const priorityStyles = {
  hot: {
    Icon: Flame,
    iconClass: "text-red-600",
    fill: true,
    badgeClass: "bg-red-50 text-red-800 border border-red-200",
  },
  warm: {
    Icon: Flame,
    iconClass: "text-orange-500",
    fill: true,
    badgeClass: "bg-orange-50 text-orange-700 border border-orange-200",
  },
  cool: {
    Icon: Droplet,
    iconClass: "text-sky-400",
    fill: false,
    badgeClass: "bg-sky-50 text-sky-700 border border-sky-200",
  },
};

export default function HotLeadsPanel({ selectedId, onSelect, onViewAll, limit = 5 }) {
  const topLeads = useMemo(
    () => [...leads].sort((a, b) => b.score - a.score).slice(0, limit),
    [limit]
  );

  return (
    <ChartCard
      title="Lead cần xử lý ngay"
      action={
        <button
          onClick={onViewAll}
          className="text-[11px] text-blue-600 hover:underline font-medium"
        >
          Xem tất cả
        </button>
      }
    >
      <div className="space-y-1 mt-1">
        {topLeads.map((l) => {
          const tier = priorityTier(l.score);
          const style = priorityStyles[tier];
          const { Icon } = style;
          return (
            <button
              key={l.id}
              onClick={() => onSelect(l.id)}
              className={`w-full flex items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors duration-200 hover:bg-brand-50/50 ${
                selectedId === l.id ? "bg-brand-50/70" : ""
              }`}
            >
              <Avatar name={l.name} initials={l.initials} size={30} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-800 truncate">{l.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{l.course}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Icon
                  size={14}
                  className={style.iconClass}
                  fill={style.fill ? "currentColor" : "none"}
                  strokeWidth={style.fill ? 0 : 2}
                />
                <span
                  className={`text-xs font-semibold px-1.5 py-0.5 rounded-md ${style.badgeClass}`}
                >
                  {l.score}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </ChartCard>
  );
}