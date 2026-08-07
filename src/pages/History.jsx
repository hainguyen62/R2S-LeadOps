import { UserCheck, Phone, Mail, MessageCircle, GitBranch, Plus } from "lucide-react";
import Avatar from "../components/ui/Avatar.jsx";
import Pill from "../components/ui/Pill.jsx";
import { leads, statusStyle } from "../data/mockData.js";

const iconMap = {
  "Đã gọi điện": Phone,
  "Đã gửi email": Mail,
  "Đã gửi tài liệu": Mail,
  "Chuyển trạng thái": GitBranch,
  "Tạo lead": Plus,
};

const allHistory = [
  ...leads.flatMap((l) =>
    (l.history || []).map((h) => ({ ...h, leadName: l.name, initials: l.initials }))
  ),
  { text: "Đã gọi điện", channel: "Tư vấn viên A", date: "12/05/2026 10:30", leadName: "Nguyễn Minh Anh", initials: "NA" },
  { text: "Đã gửi email", channel: "Tư vấn viên B", date: "12/05/2026 09:45", leadName: "Lê Thu Hà", initials: "LH" },
  { text: "Chuyển trạng thái sang Đã đăng ký", channel: "Tư vấn viên A", date: "12/05/2026 09:15", leadName: "Ngô Bảo Châu", initials: "NC" },
  { text: "Đã nhắn tin", channel: "Tư vấn viên C", date: "12/05/2026 08:40", leadName: "Đặng Thảo Vy", initials: "DV" },
  { text: "Tạo lead", channel: "Facebook Ads", date: "11/05/2026 18:40", leadName: "Hoàng Mai Linh", initials: "ML" },
].sort((a, b) => (a.date < b.date ? 1 : -1));

export default function History() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Lịch sử chăm sóc</h2>
        <p className="text-sm text-slate-500">Theo dõi toàn bộ lịch sử tư vấn và chăm sóc lead</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card">
        <div className="space-y-1">
          {allHistory.map((h, i) => {
            const Icon = iconMap[h.text.split(" ")[0]] || UserCheck;
            return (
              <div key={i} className="flex gap-4 py-3">
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Icon size={16} />
                  </div>
                  {i < allHistory.length - 1 && <div className="w-px flex-1 bg-slate-200 my-1" />}
                </div>
                <div className="pb-3 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Avatar name={h.leadName} initials={h.initials} size={22} />
                    <p className="text-sm text-slate-700">
                      <span className="font-medium text-slate-900">{h.leadName}</span> — {h.text}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {h.date} · {h.channel}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick status legend */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card">
        <p className="text-sm font-medium text-slate-800 mb-3">Trạng thái lead hiện tại</p>
        <div className="flex flex-wrap gap-2">
          {["Lead mới", "Đã liên hệ", "Đang tư vấn", "Đang cân nhắc", "Đã đặt cọc", "Đã đăng ký"].map((s) => (
            <Pill key={s} text={s} map={statusStyle} />
          ))}
        </div>
      </div>
    </div>
  );
}