import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Flame, Droplet, UserCheck } from "lucide-react";
import Pill from "../components/ui/Pill.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import ContactButtons from "../components/ui/ContactButtons.jsx";
import { leads, statusStyle, classStyle, careHistory } from "../data/mockData.js";
import { priorityTier, getScoreBreakdown } from "../utils/leadScoring.js";

// Cùng bộ 3 cấp độ ưu tiên với popup Chi tiết lead ở Dashboard, để icon
// lửa/giọt nước và badge nhất quán xuyên suốt ứng dụng.
const priorityStyles = {
  hot: { Icon: Flame, fill: true, iconClass: "text-red-600", badgeClass: "bg-red-50 text-red-700 border border-red-200" },
  warm: { Icon: Flame, fill: true, iconClass: "text-orange-500", badgeClass: "bg-orange-50 text-orange-600 border border-orange-200" },
  cool: { Icon: Droplet, fill: false, iconClass: "text-sky-500", badgeClass: "bg-sky-50 text-sky-600 border border-sky-200" },
};

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const lead = leads.find((l) => String(l.id) === id);

  if (!lead) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate("/leads")}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft size={16} /> Quay lại danh sách lead
        </button>
        <div className="bg-white border border-slate-200 rounded-card p-10 text-center text-sm text-slate-500 shadow-card">
          Không tìm thấy lead này.
        </div>
      </div>
    );
  }

  const history = careHistory[lead.id] || [];
  const breakdown = getScoreBreakdown(lead);
  const tier = priorityTier(lead.score);
  const style = priorityStyles[tier];
  const PriorityIcon = style.Icon;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/leads")}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft size={16} /> Quay lại danh sách lead
      </button>

      <h2 className="text-lg font-bold text-slate-900">Chi tiết Lead</h2>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ---- Cột trái ---- */}
        <div className="lg:col-span-2 space-y-6">
          {/* Thông tin liên hệ */}
          <div className="bg-white border border-slate-300 rounded-card p-5 shadow-card space-y-4 transition-all duration-200 ease-out hover:shadow-elevated">
            <div className="flex items-center gap-3">
              <Avatar name={lead.name} initials={lead.initials} size={48} />
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 truncate">{lead.name}</p>
                <div className="mt-1"><Pill text={lead.status} map={statusStyle} /></div>
                <p className="text-xs text-slate-500 mt-1 truncate">{lead.course} · {lead.source}</p>
              </div>
            </div>

            <div className="border-t border-slate-200/70 pt-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Thông tin liên hệ</p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">SĐT</span>
                  <span className="text-slate-800">{lead.phone}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Email</span>
                  <span className="text-slate-800 text-right truncate">{lead.email}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Người phụ trách</span>
                  <span className="text-slate-800">{lead.assignee}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Ngày tạo</span>
                  <span className="text-slate-800">{lead.date}</span>
                </div>
              </div>
              {/* Liên hệ nhanh — bấm là mở kênh tương ứng ngay, không cần copy số/email */}
              <div className="mt-3 border-t border-slate-200/70 pt-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Liên hệ nhanh</p>
                <ContactButtons lead={lead} />
              </div>
            </div>
          </div>

          {/* Khối điểm số — nền trắng, viền, không dùng nền tối */}
          <div className="bg-white border border-slate-300 rounded-card p-5 shadow-card space-y-4 transition-all duration-200 ease-out hover:shadow-elevated">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center bg-slate-50 border border-slate-200`}>
                  <PriorityIcon
                    size={22}
                    className={style.iconClass}
                    fill={style.fill ? "currentColor" : "none"}
                    strokeWidth={style.fill ? 0 : 2}
                  />
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">Tổng điểm</p>
                  <p className="text-3xl font-bold text-slate-900">{lead.score}</p>
                </div>
              </div>
              <Pill text={lead.cls} map={classStyle} />
            </div>

            {breakdown.length > 0 && (
              <div className="border-t border-slate-200/70 pt-3 space-y-1.5">
                {breakdown.map((b, i) => (
                  <div key={i} className="flex justify-between text-xs gap-3">
                    <span className="text-slate-500">{b.label}</span>
                    <span className="text-emerald-600 font-medium shrink-0">{b.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hành động */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button className="border border-slate-300 rounded-card py-2 text-sm text-slate-600 hover:bg-slate-100 shadow-sm hover:shadow-md transition-all duration-200 ease-out">
                + Hoạt động
              </button>
              <button className="border border-slate-300 rounded-card py-2 text-sm text-slate-600 hover:bg-slate-100 shadow-sm hover:shadow-md transition-all duration-200 ease-out">
                Follow-up
              </button>
            </div>
            <button className="w-full bg-brand-600 hover:bg-brand-500 rounded-card py-2.5 text-sm text-white font-medium shadow-sm hover:shadow-md transition-all duration-200 ease-out">
              Cập nhật trạng thái
            </button>
          </div>
        </div>

        {/* ---- Cột phải: Lịch sử chăm sóc ---- */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-slate-300 rounded-card p-5 shadow-card transition-all duration-200 ease-out hover:shadow-elevated">
            <p className="text-sm font-bold text-slate-900 mb-4">Lịch sử chăm sóc</p>
            {history.length === 0 ? (
              <p className="text-sm text-slate-400">Chưa có hoạt động chăm sóc nào.</p>
            ) : (
              <div className="space-y-4">
                {history.map((h, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <UserCheck size={11} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-slate-700">{h.text}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{h.channel} · {h.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

