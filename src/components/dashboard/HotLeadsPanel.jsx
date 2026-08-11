import { useEffect, useState } from "react";
import { Flame, Droplet, Clock } from "lucide-react";
import ChartCard from "../ui/ChartCard.jsx";
import Avatar from "../ui/Avatar.jsx";
import { SkeletonBlock } from "../ui/Skeleton.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import { fetchHotLeads, fetchUnassignedLeads, fetchFollowUpLeads } from "../../services/dashboardService.js";
import { priorityTier } from "../../utils/leadScoring.js";

// 3 cấp độ ưu tiên (theo điểm) — dùng cho mode "priority" và "unassigned",
// vì cả 2 đều hiển thị điểm/mức độ nóng-lạnh ở cột phải.
//   hot  -> lửa đỏ, tô đặc (fill)   : cần gọi ngay
//   warm -> lửa cam, tô đặc (fill)  : cần chăm sóc sớm
//   cool -> giọt nước xanh, viền rỗng: chưa gấp, không dùng icon lửa
const priorityStyles = {
  hot: { Icon: Flame, iconClass: "text-red-600", fill: true, badgeClass: "bg-red-50 text-red-800 border border-red-200" },
  warm: { Icon: Flame, iconClass: "text-orange-500", fill: true, badgeClass: "bg-orange-50 text-orange-700 border border-orange-200" },
  cool: { Icon: Droplet, iconClass: "text-sky-400", fill: false, badgeClass: "bg-sky-50 text-sky-700 border border-sky-200" },
};

// 3 chế độ của dropdown "Cần xử lý". Mỗi mode gọi 1 hàm service riêng và
// hiển thị đúng thông tin phù hợp ở cột phải của mỗi dòng, nhưng giữ NGUYÊN
// bố cục dòng (avatar - tên/khóa học - badge) để không phá layout hiện tại.
const MODES = [
  { value: "priority", label: "Lead cần xử lý ngay" },
  { value: "unassigned", label: "Lead chưa phân công" },
  { value: "followup", label: "Lead cần follow-up" },
];

const emptyCopy = {
  priority: { title: "Chưa có lead cần ưu tiên", description: "Danh sách sẽ hiện khi có lead nóng hoặc ấm." },
  unassigned: { title: "Đã phân công hết", description: "Không có lead nào đang chờ phân công." },
  followup: { title: "Không có follow-up đến hạn", description: "Danh sách sẽ hiện khi có lịch follow-up đến hạn hoặc quá hạn." },
};

function daysOverdue(nextFollowUpAt) {
  const diffMs = new Date() - new Date(nextFollowUpAt);
  return Math.floor(diffMs / 86400000);
}

function FollowUpBadge({ nextFollowUpAt }) {
  const d = daysOverdue(nextFollowUpAt);
  if (d <= 0) {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
        <Clock size={11} /> Hôm nay
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded-md bg-red-50 text-red-800 border border-red-200">
      <Clock size={11} /> Quá hạn {d} ngày
    </span>
  );
}

function ScoreBadge({ score }) {
  const tier = priorityTier(score);
  const style = priorityStyles[tier];
  const { Icon } = style;
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <Icon size={14} className={style.iconClass} fill={style.fill ? "currentColor" : "none"} strokeWidth={style.fill ? 0 : 2} />
      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-md ${style.badgeClass}`}>{score}</span>
    </div>
  );
}

export default function HotLeadsPanel({ selectedId, onSelect, onViewAll, limit = 5 }) {
  const [mode, setMode] = useState("priority");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // GET /api/dashboard/hot-leads | /unassigned-leads | /followup-leads
  // xem services/dashboardService.js — mỗi mode gọi 1 endpoint riêng.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const fetcher = mode === "unassigned" ? fetchUnassignedLeads : mode === "followup" ? fetchFollowUpLeads : fetchHotLeads;
    fetcher(limit)
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, limit]);

  return (
    <ChartCard
      title={
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className="text-[15px] font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer -ml-1"
        >
          {MODES.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      }
      action={
        <button
          onClick={onViewAll}
          className="text-[11px] text-blue-600 hover:underline font-medium shrink-0"
        >
          Xem tất cả
        </button>
      }
    >
      {loading ? (
        <div className="space-y-2.5 mt-1">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="flex items-center gap-2.5 px-2 py-1">
              <SkeletonBlock className="w-[30px] h-[30px] rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <SkeletonBlock className="w-2/3 h-3" />
                <SkeletonBlock className="w-1/3 h-2.5" />
              </div>
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState compact title={emptyCopy[mode].title} description={emptyCopy[mode].description} />
      ) : (
      <div className="space-y-1 mt-1">
        {rows.map((l) => (
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
              <p className="text-[11px] text-slate-500 truncate">
                {l.course}
                {mode === "unassigned" && <span className="text-slate-400"> · Chưa phân công</span>}
              </p>
            </div>
            {mode === "followup" ? <FollowUpBadge nextFollowUpAt={l.nextFollowUpAt} /> : <ScoreBadge score={l.score} />}
          </button>
        ))}
      </div>
      )}
    </ChartCard>
  );
}