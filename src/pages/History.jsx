import { useEffect, useState } from "react";
import { UserCheck, Phone, Mail, MessageCircle, GitBranch, Plus, AlertCircle } from "lucide-react";
import Avatar from "../components/ui/Avatar.jsx";
import Pill from "../components/ui/Pill.jsx";
import { SkeletonBlock } from "../components/ui/Skeleton.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { statusStyle } from "../data/mockData.js";
import { fetchAllActivities } from "../services/leadService.js";

const iconMap = {
  "Đã gọi điện": Phone,
  "Đã gửi email": Mail,
  "Đã gửi tài liệu": Mail,
  "Chuyển trạng thái": GitBranch,
  "Tạo lead": Plus,
};

export default function History() {
  const [allHistory, setAllHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Gộp từ GET /api/leads/{id}/activities của toàn bộ lead — xem leadService.js
  useEffect(() => {
    let cancelled = false;
    fetchAllActivities()
      .then((data) => {
        if (!cancelled) setAllHistory(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Không thể tải lịch sử chăm sóc.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Lịch sử chăm sóc</h2>
        <p className="text-sm text-slate-500">Theo dõi toàn bộ lịch sử tư vấn và chăm sóc lead</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-12" />
            ))}
          </div>
        ) : error ? (
          <EmptyState icon={AlertCircle} title="Không thể tải lịch sử" description={error} compact />
        ) : allHistory.length === 0 ? (
          <EmptyState icon={UserCheck} title="Chưa có hoạt động chăm sóc nào" compact />
        ) : (
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
        )}
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