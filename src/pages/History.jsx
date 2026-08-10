import { useEffect, useState } from "react";
import { UserCheck, Phone, Mail, MessageCircle, GitBranch, Plus, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import Avatar from "../components/ui/Avatar.jsx";
import Pill from "../components/ui/Pill.jsx";
import { SkeletonBlock } from "../components/ui/Skeleton.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { statusStyle } from "../data/mockData.js";
import { fetchAllActivities } from "../services/leadService.js";

const pageSize = 10;

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
  const [page, setPage] = useState(1);

  // Gộp từ GET /api/leads/{id}/activities của toàn bộ lead — xem leadService.js
  useEffect(() => {
    let cancelled = false;
    fetchAllActivities()
      .then((data) => {
        if (!cancelled) {
          setAllHistory(data);
          setPage(1);
        }
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

  const totalPages = Math.max(1, Math.ceil(allHistory.length / pageSize));
  const pageRows = allHistory.slice((page - 1) * pageSize, page * pageSize);

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
          {pageRows.map((h, i) => {
            const Icon = iconMap[h.text.split(" ")[0]] || UserCheck;
            return (
              <div key={i} className="flex gap-4 py-3">
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Icon size={16} />
                  </div>
                  {i < pageRows.length - 1 && <div className="w-px flex-1 bg-slate-200 my-1" />}
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

      {/* Pagination */}
      {!loading && !error && allHistory.length > 0 && (
        <div className="flex items-center justify-between px-1 text-xs text-slate-500">
          <span>
            Hiển thị {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, allHistory.length)} của {allHistory.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-md border border-slate-300 hover:bg-slate-50 disabled:opacity-40"
              disabled={page === 1}
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-7 h-7 rounded-md text-xs ${
                  page === i + 1
                    ? "bg-brand-600 text-white"
                    : "border border-slate-300 hover:bg-slate-50 text-slate-500"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-md border border-slate-300 hover:bg-slate-50 disabled:opacity-40"
              disabled={page === totalPages}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

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