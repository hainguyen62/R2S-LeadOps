import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Flame, Droplet, Clock, TrendingUp, TrendingDown, UserX, X, ExternalLink } from "lucide-react";
import ChartCard from "../ui/ChartCard.jsx";
import Avatar from "../ui/Avatar.jsx";
import { SkeletonBlock } from "../ui/Skeleton.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import { fetchHotLeads, fetchUnassignedLeads, fetchFollowUpLeads, fetchChangedTodayLeads, fetchUrgentLeads } from "../../services/dashboardService.js";
import { priorityTier } from "../../utils/leadScoring.js";

// Số dòng tối đa lấy khi mở modal "Xem tất cả" — đủ lớn để coi là "toàn bộ"
// cho dữ liệu demo, nhưng vẫn có giới hạn để tránh gọi API kích thước bất
// thường khi nối Back-end thật sau này (BE cũng giới hạn top-leads tối đa
// 100 bản ghi/lần).
const VIEW_ALL_LIMIT = 100;

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

// 5 chế độ của dropdown "Cần xử lý":
//  - "urgent" (MẶC ĐỊNH khi vào Dashboard) gộp cả 4 mục dưới theo đúng thứ tự
//    ưu tiên trong "Danh sách hành động" (Mục XI.2 tài liệu BA).
//  - 4 mục còn lại xem riêng từng loại khi cần lọc sâu hơn.
const MODES = [
  { value: "urgent", label: "Lead cần xử lý ngay" },
  { value: "priority", label: "Lead nóng chưa liên hệ" },
  { value: "followup", label: "Follow-up quá hạn" },
  { value: "unassigned", label: "Lead mới chưa phân công" },
  { value: "changed", label: "Lead thay đổi điểm mạnh hôm nay" },
];

// Badge lý do hiển thị ở mode "urgent" (gộp) để phân biệt lead này thuộc
// nhóm nào trong 4 nhóm ưu tiên — badge riêng cho followup/hot dùng lại
// FollowUpBadge/ScoreBadge hiện có. Riêng "unassigned" có style cố định,
// còn "changed" phải tính style THEO DẤU của swing (xem ChangedStyle bên
// dưới) vì biến động lớn nhất có thể là tăng HOẶC giảm điểm.
const urgentReasonBadge = {
  unassigned: { Icon: UserX, label: "Chưa phân công", className: "bg-orange-50 text-orange-700 border border-orange-200" },
};

// Style + nhãn cho badge "changed" — PHẢI đọc đúng dấu của swing, vì biến
// động lớn nhất trong breakdown của lead có thể là một mục TRỪ điểm (ví dụ
// "Lead giả hoặc spam" -100, "Thông báo không có nhu cầu" -30...). Nếu luôn
// hiển thị dấu "+" và nhãn "tăng mạnh" bất kể dấu thật của swing, Sales sẽ
// hiểu nhầm một lead đang xấu đi thành đang tốt lên.
function changedStyle(swing) {
  if (swing < 0) {
    return { Icon: TrendingDown, label: "Điểm giảm mạnh", className: "bg-red-50 text-red-700 border border-red-200", text: `${swing}đ` };
  }
  return { Icon: TrendingUp, label: "Điểm tăng mạnh", className: "bg-amber-50 text-amber-700 border border-amber-200", text: `+${swing}đ` };
}

const emptyCopy = {
  urgent: { title: "Không có lead cần xử lý ngay", description: "Danh sách sẽ hiện khi có lead nóng chưa liên hệ, follow-up quá hạn, lead mới chưa phân công, hoặc lead tăng điểm mạnh hôm nay." },
  priority: { title: "Chưa có lead cần xử lý ngay", description: "Danh sách sẽ hiện khi có Lead nóng (70–100đ) chưa liên hệ." },
  unassigned: { title: "Đã phân công hết", description: "Không có lead nào đang chờ phân công." },
  followup: { title: "Không có follow-up đến hạn", description: "Danh sách sẽ hiện khi có lịch follow-up đến hạn hoặc quá hạn." },
  changed: { title: "Chưa có biến động điểm đáng chú ý", description: "Danh sách sẽ hiện khi có lead thay đổi điểm mạnh trong ngày." },
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

function ReasonBadge({ reason, swing }) {
  if (reason === "changed") {
    const s = changedStyle(swing);
    const { Icon } = s;
    return (
      <span className={`flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded-md ${s.className}`}>
        <Icon size={11} /> {s.text}
      </span>
    );
  }
  const cfg = urgentReasonBadge[reason];
  const { Icon } = cfg;
  return (
    <span className={`flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded-md ${cfg.className}`}>
      <Icon size={11} /> {cfg.label}
    </span>
  );
}

function UrgentBadge({ mode, lead }) {
  if (mode === "followup") return <FollowUpBadge nextFollowUpAt={lead.nextFollowUpAt} />;
  if (mode === "changed") return <ReasonBadge reason="changed" swing={lead.swing} />;
  if (mode === "unassigned") return <ReasonBadge reason="unassigned" />;
  if (mode === "urgent") {
    if (lead.urgentReason === "followup") return <FollowUpBadge nextFollowUpAt={lead.nextFollowUpAt} />;
    if (lead.urgentReason === "unassigned") return <ReasonBadge reason="unassigned" />;
    if (lead.urgentReason === "changed") return <ReasonBadge reason="changed" swing={lead.swing} />;
    return <ScoreBadge score={lead.score} />; // urgentReason === "hot"
  }
  return <ScoreBadge score={lead.score} />; // mode === "priority"
}

// Chọn đúng hàm service theo mode — dùng chung cho danh sách rút gọn (5
// dòng) trong panel VÀ modal "Xem tất cả" (đầy đủ), để 2 nơi luôn khớp dữ
// liệu 100%, không lệch tiêu chí lọc.
function fetcherForMode(mode) {
  if (mode === "urgent") return fetchUrgentLeads;
  if (mode === "unassigned") return fetchUnassignedLeads;
  if (mode === "followup") return fetchFollowUpLeads;
  if (mode === "changed") return fetchChangedTodayLeads;
  return fetchHotLeads;
}

// 1 dòng lead — dùng chung cho panel rút gọn và modal "Xem tất cả", tránh
// lặp JSX và đảm bảo giao diện đồng nhất giữa 2 nơi.
function LeadRow({ lead: l, mode, selectedId, onSelect }) {
  return (
    <button
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
          {(mode === "unassigned" || (mode === "urgent" && l.urgentReason === "unassigned")) && (
            <span className="text-slate-400"> · Chưa phân công</span>
          )}
        </p>
      </div>
      <UrgentBadge mode={mode} lead={l} />
    </button>
  );
}

// Modal "Xem tất cả" — hiển thị TOÀN BỘ danh sách của đúng mục đang chọn
// (không dừng lại ở `limit` dòng như panel), thay vì điều hướng sang trang
// Quản lý Lead chung chung (mất hết ngữ cảnh đang xem lead loại gì). Vẫn có
// link phụ để mở trang Quản lý Lead cho ai cần công cụ lọc/sắp xếp đầy đủ.
function ViewAllModal({ mode, onClose, onSelect, selectedId, onOpenLeadsPage }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const modeLabel = MODES.find((m) => m.value === mode)?.label || "";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetcherForMode(mode)(VIEW_ALL_LIMIT)
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setRows([]);
          setError(err?.message || "Không tải được danh sách.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[9998] bg-slate-900/50 flex items-center justify-center p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-elevated flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900 truncate">{modeLabel}</h3>
            {!loading && !error && (
              <p className="text-xs text-slate-500 mt-0.5">
                {rows.length}{rows.length >= VIEW_ALL_LIMIT ? "+" : ""} lead
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto px-3 py-2 flex-1">
          {loading ? (
            <div className="space-y-2.5 px-2 py-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2.5 px-2 py-1">
                  <SkeletonBlock className="w-[30px] h-[30px] rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <SkeletonBlock className="w-2/3 h-3" />
                    <SkeletonBlock className="w-1/3 h-2.5" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <EmptyState compact title="Chưa hỗ trợ" description={error} />
          ) : rows.length === 0 ? (
            <EmptyState compact title={emptyCopy[mode].title} description={emptyCopy[mode].description} />
          ) : (
            <div className="space-y-1">
              {rows.map((l) => (
                <LeadRow
                  key={l.id}
                  lead={l}
                  mode={mode}
                  selectedId={selectedId}
                  onSelect={(id) => {
                    onSelect(id);
                    onClose();
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-slate-100 shrink-0">
          <button
            onClick={onOpenLeadsPage}
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-medium"
          >
            <ExternalLink size={12} /> Mở trang Quản lý Lead để lọc/sắp xếp sâu hơn
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function HotLeadsPanel({ selectedId, onSelect, onViewAll, limit = 5 }) {
  const [mode, setMode] = useState("urgent");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllModal, setShowAllModal] = useState(false);

  // GET /api/dashboard/hot-leads | /unassigned-leads | /followup-leads | ...
  // xem services/dashboardService.js — mỗi mode gọi 1 endpoint/hàm riêng.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetcherForMode(mode)(limit)
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setRows([]);
          setError(err?.message || "Không tải được danh sách.");
        }
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
          className="w-full max-w-full truncate text-[15px] font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer -ml-1"
        >
          {MODES.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      }
      action={
        // "Xem tất cả" mở modal hiển thị TOÀN BỘ danh sách của đúng mục đang
        // chọn (mode hiện tại), thay vì điều hướng sang trang Quản lý Lead
        // chung — nếu đi thẳng /leads sẽ mất hết ngữ cảnh "đang xem lead
        // loại gì" và người dùng phải tự dò lại filter. Modal luôn dùng
        // ĐÚNG hàm fetch của mode hiện tại nên số liệu khớp 100% với panel.
        <button
          onClick={() => setShowAllModal(true)}
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
      ) : error ? (
        <EmptyState compact title="Chưa hỗ trợ" description={error} />
      ) : rows.length === 0 ? (
        <EmptyState compact title={emptyCopy[mode].title} description={emptyCopy[mode].description} />
      ) : (
      <div className="space-y-1 mt-1">
        {rows.map((l) => (
          <LeadRow key={l.id} lead={l} mode={mode} selectedId={selectedId} onSelect={onSelect} />
        ))}
      </div>
      )}

      {showAllModal && (
        <ViewAllModal
          mode={mode}
          selectedId={selectedId}
          onSelect={onSelect}
          onClose={() => setShowAllModal(false)}
          onOpenLeadsPage={() => {
            setShowAllModal(false);
            onViewAll?.();
          }}
        />
      )}
    </ChartCard>
  );
}