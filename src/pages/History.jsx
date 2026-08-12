import { useEffect, useMemo, useState } from "react";
import { UserCheck, Phone, Mail, MessageCircle, GitBranch, Plus, AlertCircle, ChevronLeft, ChevronRight, Search, SearchX } from "lucide-react";
import Avatar from "../components/ui/Avatar.jsx";
import Pill from "../components/ui/Pill.jsx";
import { SkeletonBlock } from "../components/ui/Skeleton.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { statusStyle } from "../data/mockData.js";
import { fetchAllActivities } from "../services/leadService.js";
import { useAuth } from "../context/AuthContext.jsx";
import { isSales } from "../utils/permissions.js";

const pageSize = 10;

const iconMap = {
  "Đã gọi điện": Phone,
  "Đã gửi email": Mail,
  "Đã gửi tài liệu": Mail,
  "Chuyển trạng thái": GitBranch,
  "Tạo lead": Plus,
};

// Nguồn (không phải nhân viên) — dùng để loại khỏi dropdown "Nhân viên"
const KNOWN_SOURCES = ["Facebook Ads", "Facebook", "TikTok Ads", "TikTok", "Landing Page", "Google Form", "Manual"];

// Suy ra "Loại hoạt động" từ nội dung text — gộp nhóm cho dropdown lọc
const ACTIVITY_TYPES = [
  { key: "call", label: "Gọi điện", match: (t) => t.startsWith("Đã gọi điện") },
  { key: "email", label: "Email / Tài liệu", match: (t) => t.startsWith("Đã gửi email") || t.startsWith("Đã gửi tài liệu") },
  { key: "status", label: "Chuyển trạng thái", match: (t) => t.startsWith("Chuyển trạng thái") },
  { key: "create", label: "Tạo lead", match: (t) => t.startsWith("Tạo lead") },
  { key: "deposit", label: "Đặt cọc", match: (t) => t.startsWith("Đã đặt cọc") },
  { key: "register", label: "Đăng ký khóa học", match: (t) => t.startsWith("Đã đăng ký") },
];
const getActivityType = (text) => ACTIVITY_TYPES.find((a) => a.match(text)) || { key: "other", label: "Khác" };

// Parse "12/05/2026 09:15" -> Date
const parseVNDateTime = (str) => {
  if (!str) return null;
  const [datePart, timePart = "00:00"] = String(str).split(" ");
  const [d, m, y] = datePart.split("/").map(Number);
  const [hh, mm] = timePart.split(":").map(Number);
  if (!d || !m || !y) return null;
  return new Date(y, m - 1, d, hh || 0, mm || 0);
};

const dateRangeOptions = [
  { key: "all", label: "Tất cả thời gian" },
  { key: "today", label: "Hôm nay" },
  { key: "7d", label: "7 ngày qua" },
  { key: "30d", label: "30 ngày qua" },
];

export default function History() {
  const user = useAuth();
  const salesView = isSales(user);
  const [allHistory, setAllHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  // Bộ lọc: Tìm kiếm / Lead / Nhân viên / Loại hoạt động / Khoảng thời gian
  const [search, setSearch] = useState("");
  const [leadFilter, setLeadFilter] = useState("");
  const [staffFilter, setStaffFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [rangeFilter, setRangeFilter] = useState("all");

  // Gộp từ GET /api/leads/{id}/activities của toàn bộ lead — xem leadService.js
  // Sales/Admissions chỉ được xem lịch sử của lead do CHÍNH MÌNH phụ trách
  // (Mục IV.3: "Xem lịch sử chăm sóc — giới hạn theo lead được phân công");
  // các vai trò còn lại có quyền viewAllCareHistory nên xem toàn bộ.
  useEffect(() => {
    let cancelled = false;
    fetchAllActivities()
      .then((data) => {
        if (!cancelled) {
          const scoped = salesView ? data.filter((h) => h.assignee === user?.name) : data;
          setAllHistory(scoped);
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
  }, [salesView, user]);

  // Danh sách Lead xuất hiện trong lịch sử — cho dropdown "Lead"
  const leadOptions = useMemo(
    () => [...new Set(allHistory.map((h) => h.leadName).filter(Boolean))].sort((a, b) => a.localeCompare(b, "vi")),
    [allHistory]
  );

  // Danh sách nhân viên (loại trừ các giá trị là nguồn/kênh quảng cáo) — cho dropdown "Nhân viên"
  const staffOptions = useMemo(
    () =>
      [...new Set(allHistory.map((h) => h.channel).filter((c) => c && !KNOWN_SOURCES.includes(c)))].sort((a, b) =>
        a.localeCompare(b, "vi")
      ),
    [allHistory]
  );

  const filteredHistory = useMemo(() => {
    const now = new Date();
    return allHistory.filter((h) => {
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const hay = `${h.leadName || ""} ${h.text || ""} ${h.channel || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (leadFilter && h.leadName !== leadFilter) return false;
      if (staffFilter && h.channel !== staffFilter) return false;
      if (typeFilter && getActivityType(h.text).key !== typeFilter) return false;
      if (rangeFilter !== "all") {
        const d = parseVNDateTime(h.date);
        if (!d) return false;
        const diffDays = (now - d) / (1000 * 60 * 60 * 24);
        if (rangeFilter === "today" && diffDays > 1) return false;
        if (rangeFilter === "7d" && diffDays > 7) return false;
        if (rangeFilter === "30d" && diffDays > 30) return false;
      }
      return true;
    });
  }, [allHistory, search, leadFilter, staffFilter, typeFilter, rangeFilter]);

  // Reset về trang 1 mỗi khi bộ lọc thay đổi
  useEffect(() => {
    setPage(1);
  }, [search, leadFilter, staffFilter, typeFilter, rangeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / pageSize));
  const pageRows = filteredHistory.slice((page - 1) * pageSize, page * pageSize);
  const hasActiveFilters = search || leadFilter || staffFilter || typeFilter || rangeFilter !== "all";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Lịch sử chăm sóc</h2>
        <p className="text-sm text-slate-500">
          {salesView ? "Lịch sử tư vấn và chăm sóc của các lead do bạn phụ trách" : "Theo dõi toàn bộ lịch sử tư vấn và chăm sóc lead"}
        </p>
      </div>

      {/* Thanh bộ lọc: Tìm kiếm / Lead / Nhân viên / Loại hoạt động / Khoảng thời gian */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card space-y-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên lead, nội dung hoạt động, nhân viên..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={leadFilter}
            onChange={(e) => setLeadFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">Tất cả Lead</option>
            {leadOptions.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <select
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">Tất cả nhân viên</option>
            {staffOptions.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">Tất cả loại hoạt động</option>
            {ACTIVITY_TYPES.map((t) => (
              <option key={t.key} value={t.key}>{t.label}</option>
            ))}
          </select>
          <select
            value={rangeFilter}
            onChange={(e) => setRangeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            {dateRangeOptions.map((r) => (
              <option key={r.key} value={r.key}>{r.label}</option>
            ))}
          </select>
          {hasActiveFilters && (
            <button
              onClick={() => { setSearch(""); setLeadFilter(""); setStaffFilter(""); setTypeFilter(""); setRangeFilter("all"); }}
              className="text-xs text-slate-400 hover:text-slate-600 px-2"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
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
        ) : filteredHistory.length === 0 ? (
          <EmptyState icon={SearchX} title="Không tìm thấy hoạt động phù hợp" description="Thử thay đổi từ khóa hoặc bộ lọc." compact />
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
      {!loading && !error && filteredHistory.length > 0 && (
        <div className="flex items-center justify-between px-1 text-xs text-slate-500">
          <span>
            Hiển thị {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredHistory.length)} của {filteredHistory.length}
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