import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Facebook, Send, UserCheck, Flame, Droplet, Maximize2, ChevronDown, Check, Clock, CalendarClock, Loader2 } from "lucide-react";
import Pill from "../ui/Pill.jsx";
import Avatar from "../ui/Avatar.jsx";
import ContactButtons from "../ui/ContactButtons.jsx";
import { useToast } from "../ui/ToastProvider.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { statusStyle, classStyle, careHistory, leadStatusOrder } from "../../data/mockData.js";
import { priorityTier, getScoreBreakdown } from "../../utils/leadScoring.js";
import { addLeadActivity } from "../../services/leadService.js";
import useEscapeKey from "../../hooks/useEscapeKey.js";
import { formatVietnamDateTime, vietnamDateTimeToIso } from "../../utils/datetime.js";

// Cùng bộ 3 cấp độ ưu tiên với "Lead cần xử lý ngay" ở Dashboard, để icon
// lửa/giọt nước nhất quán xuyên suốt ứng dụng.
const priorityStyles = {
  hot: {
    Icon: Flame,
    fill: true,
    iconClass: "text-red-600",
    iconBg: "bg-red-100",
    panelClass: "bg-red-50 border-red-100",
    scoreClass: "text-red-600",
  },
  warm: {
    Icon: Flame,
    fill: true,
    iconClass: "text-orange-500",
    iconBg: "bg-orange-100",
    panelClass: "bg-orange-50 border-orange-100",
    scoreClass: "text-orange-600",
  },
  cool: {
    Icon: Droplet,
    fill: false,
    iconClass: "text-sky-500",
    iconBg: "bg-sky-100",
    panelClass: "bg-sky-50 border-sky-100",
    scoreClass: "text-sky-600",
  },
};

/**
 * Popup "Chi tiết lead" — hiện giữa màn hình dạng modal thay vì chiếm
 * không gian cố định bên phải như trước. Chỉ hiển thị khi có `lead`
 * được chọn; đóng bằng nút X, click ra ngoài, hoặc phím Esc.
 */
export default function LeadDetailModal({ lead, onClose, onRefresh }) {
  const navigate = useNavigate();
  const toast = useToast();
  const user = useAuth();
  const [statusOpen, setStatusOpen] = useState(false);
  const [, forceRefresh] = useState(0);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [followUpForm, setFollowUpForm] = useState({ datetime: "", note: "" });
  const [savingFollowUp, setSavingFollowUp] = useState(false);

  useEffect(() => {
    if (lead) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [lead]);

  useEscapeKey(followUpOpen, () => setFollowUpOpen(false));
  // ESC chỉ đóng popup CHI TIẾT khi không có popup con "Đặt lịch follow-up"
  // đang mở đè lên trên — tránh đóng nhầm cả 2 lớp popup cùng lúc.
  useEscapeKey(!!lead && !followUpOpen, onClose);

  if (!lead) return null;

  const handleChangeStatus = (newStatus) => {
    setStatusOpen(false);
    if (newStatus === lead.status) return;
    lead.status = newStatus;
    careHistory[lead.id] = [
      ...(careHistory[lead.id] || []),
      {
        text: `Chuyển trạng thái sang ${newStatus}`,
        channel: user?.name || "Hệ thống",
        date: formatVietnamDateTime(new Date()),
      },
    ];
    toast.success("Cập nhật trạng thái thành công.");
    forceRefresh((n) => n + 1);
  };

  // POST /api/leads/{id}/activities với nextActionAt (không dùng PUT /leads/{id} —
  // UpdateLeadRequest không có field này) — cùng cách làm với trang chi tiết đầy đủ.
  const handleSaveFollowUp = async (e) => {
    e.preventDefault();
    if (!followUpForm.datetime) return;
    setSavingFollowUp(true);
    try {
      const [date, time] = followUpForm.datetime.split("T");
      const nextActionAt = vietnamDateTimeToIso(date, time);
      const formatted = formatVietnamDateTime(nextActionAt);
      await addLeadActivity(lead.id, {
        text: `Đặt lịch follow-up lúc ${formatted}${followUpForm.note.trim() ? ` — Ghi chú: ${followUpForm.note.trim()}` : ""}`,
        channel: lead.assignee || "Hệ thống",
        activityType: "FOLLOW_UP",
        nextAction: followUpForm.note.trim() || undefined,
        nextActionAt,
      });
      toast.success("Đã lưu lịch follow-up.");
      setFollowUpOpen(false);
      setFollowUpForm({ datetime: "", note: "" });
      onRefresh?.();
    } catch (err) {
      toast.error(err.message || "Lưu lịch follow-up thất bại.");
    } finally {
      setSavingFollowUp(false);
    }
  };

  const history = careHistory[lead.id] || careHistory[1] || [];
  const breakdown = getScoreBreakdown(lead);
  const tier = priorityTier(lead.score);
  const style = priorityStyles[tier];
  const PriorityIcon = style.Icon;

  return (
    <>
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm max-h-[85vh] bg-white text-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 shrink-0">
          <p className="text-sm font-semibold text-slate-900">Chi tiết lead</p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { onClose(); navigate(`/leads/${lead.id}`); }}
              title="Xem đầy đủ"
              className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium px-2 py-1 rounded-md hover:bg-brand-50"
            >
              <Maximize2 size={13} /> Xem đầy đủ
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <div className="flex items-center gap-3">
            <Avatar name={lead.name} initials={lead.initials} size={44} />
            <div className="min-w-0">
              <p className="font-medium text-slate-900 truncate">{lead.name}</p>
              <p className="text-xs text-slate-500 truncate">{lead.course}</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between gap-3">
              <span className="text-slate-500 shrink-0">Khóa học quan tâm</span>
              <span className="text-slate-800 text-right">{lead.course}</span>
            </div>
            <div className="flex justify-between items-center gap-3">
              <span className="text-slate-500 shrink-0">Nguồn</span>
              <span className="flex items-center gap-1 text-slate-800">
                <Facebook size={12} />
                {lead.source}
              </span>
            </div>
            <div className="flex justify-between items-center gap-3">
              <span className="text-slate-500 shrink-0">Số điện thoại</span>
              <span className="text-slate-800">{lead.phone}</span>
            </div>
            <div className="flex justify-between items-center gap-3">
              <span className="text-slate-500 shrink-0">Email</span>
              <span className="text-right text-slate-800 truncate">{lead.email}</span>
            </div>
            <div className="flex justify-between items-center gap-3">
              <span className="text-slate-500 shrink-0">Trạng thái</span>
              <Pill text={lead.status} map={statusStyle} />
            </div>
            <div className="flex justify-between items-center gap-3">
              <span className="text-slate-500 shrink-0">Người phụ trách</span>
              <span className="text-slate-800">{lead.assignee}</span>
            </div>
          </div>

          {/* Liên hệ nhanh — bấm là mở Zalo/Facebook/TikTok/gọi điện ngay */}
          <div>
            <p className="text-xs font-medium text-slate-700 mb-2">Liên hệ nhanh</p>
            <ContactButtons lead={lead} />
          </div>

          {/* Lịch follow-up — trước đây chỉ có ở trang "Xem đầy đủ", giờ thêm ở
              đây để không phải rời popup mới đặt/xem được lịch follow-up. */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-medium text-slate-700">Lịch follow-up</p>
              <button
                onClick={() => {
                  setFollowUpForm({ datetime: lead.nextFollowUpAt ? lead.nextFollowUpAt.slice(0, 16) : "", note: "" });
                  setFollowUpOpen(true);
                }}
                className="flex items-center gap-1 text-[11px] text-brand-600 hover:underline font-medium"
              >
                <CalendarClock size={12} /> {lead.nextFollowUpAt ? "Đổi lịch" : "Đặt lịch"}
              </button>
            </div>
            {lead.nextFollowUpAt ? (
              <div
                className={`flex items-center gap-1.5 text-xs rounded-lg px-2.5 py-1.5 border ${
                  new Date(lead.nextFollowUpAt) <= new Date()
                    ? "bg-red-50 text-red-800 border-red-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                <Clock size={12} />
                {formatVietnamDateTime(lead.nextFollowUpAt)}
                {new Date(lead.nextFollowUpAt) <= new Date() ? " (quá hạn)" : ""}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Chưa có lịch follow-up.</p>
            )}
          </div>

          <div
            className={`rounded-xl p-4 border flex items-center justify-between gap-3 ${style.panelClass}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center ${style.iconBg}`}
              >
                <PriorityIcon
                  size={22}
                  className={style.iconClass}
                  fill={style.fill ? "currentColor" : "none"}
                  strokeWidth={style.fill ? 0 : 2}
                />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-slate-500">Tổng điểm</p>
                <p className={`text-3xl font-semibold ${style.scoreClass}`}>{lead.score}</p>
              </div>
            </div>
            <Pill text={lead.cls} map={classStyle} />
          </div>

          <div>
            <p className="text-xs font-medium text-slate-700 mb-2">Điểm chi tiết</p>
            <div className="space-y-1.5">
              {breakdown.map((b, i) => (
                <div key={i} className="flex justify-between text-xs gap-3">
                  <span className="text-slate-500">{b.label}</span>
                  <span
                    className={`font-medium shrink-0 ${
                      b.group === "E" || b.value.trim().startsWith("-") ? "text-red-600" : "text-emerald-600"
                    }`}
                  >
                    {b.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-700 mb-2">Lịch sử chăm sóc</p>
            <div className="space-y-3">
              {history.map((h, i) => (
                <div key={i} className="flex gap-2">
                  <div className="mt-0.5 w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <UserCheck size={10} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-700">{h.text}</p>
                    <p className="text-[10px] text-slate-500">
                      {h.date} · {h.channel}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 px-5 py-4 border-t border-slate-200 shrink-0 relative">
          {statusOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setStatusOpen(false)} />
              <div className="absolute z-20 bottom-full mb-2 left-5 right-5 bg-white border border-slate-200 rounded-lg shadow-elevated overflow-hidden">
                {leadStatusOrder.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleChangeStatus(s)}
                    className="w-full flex items-center justify-between gap-2 px-3.5 py-2 text-xs text-left text-slate-700 hover:bg-slate-50"
                  >
                    {s}
                    {s === lead.status && <Check size={13} className="text-brand-600" />}
                  </button>
                ))}
              </div>
            </>
          )}
          <button
            onClick={() => setStatusOpen((v) => !v)}
            className="flex-1 flex items-center justify-center gap-1.5 bg-brand-600 rounded-lg py-2 text-xs text-white hover:bg-brand-500"
          >
            <Send size={13} /> Cập nhật trạng thái
            <ChevronDown size={13} className={statusOpen ? "rotate-180 transition-transform" : "transition-transform"} />
          </button>
        </div>
      </div>
    </div>

    {/* ---- Modal: Đặt lịch follow-up (nằm trên popup chi tiết) ---- */}
    {followUpOpen && (
      <div className="fixed inset-0 z-[60] bg-slate-900/50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-elevated">
          <div className="flex items-center justify-between px-6 pt-6 pb-2">
            <h3 className="font-semibold text-slate-900">Đặt lịch follow-up</h3>
            <button onClick={() => setFollowUpOpen(false)} className="text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleSaveFollowUp} className="px-6 pb-6 space-y-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Thời gian cần liên hệ lại *</label>
              <input
                type="datetime-local"
                value={followUpForm.datetime}
                onChange={(e) => setFollowUpForm({ ...followUpForm, datetime: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Ghi chú (tùy chọn)</label>
              <input
                value={followUpForm.note}
                onChange={(e) => setFollowUpForm({ ...followUpForm, note: e.target.value })}
                placeholder="VD: Gọi lại hỏi về học phí..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFollowUpOpen(false)}
                className="flex-1 border border-slate-300 rounded-lg py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={savingFollowUp || !followUpForm.datetime}
                className="flex-1 bg-brand-600 hover:bg-brand-500 rounded-lg py-2 text-sm text-white disabled:opacity-60 inline-flex items-center justify-center gap-1.5"
              >
                {savingFollowUp && <Loader2 size={14} className="animate-spin" />}
                {savingFollowUp ? "Đang lưu..." : "Lưu lịch follow-up"}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    </>
  );
}
