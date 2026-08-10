import { Flame, Droplet, Ban } from "lucide-react";
import { classBadgeStyle } from "../../data/mockData.js";

function iconFor(cls) {
  if (cls === "Lead nóng" || cls === "Lead ấm") return Flame;
  if (cls === "Lead lạnh") return Droplet;
  return Ban;
}

export default function ClassBadge({ cls }) {
  const style = classBadgeStyle[cls] || classBadgeStyle["Không hợp lệ"];
  const Icon = iconFor(cls);
  const filled = cls === "Lead nóng" || cls === "Lead ấm";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${style.badge}`}
    >
      <Icon size={11} className={style.icon} fill={filled ? "currentColor" : "none"} />
      {cls}
    </span>
  );
}