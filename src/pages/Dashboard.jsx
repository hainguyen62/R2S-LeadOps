import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarRange, AlertCircle } from "lucide-react";
import StatCard from "../components/ui/StatCard.jsx";
import { DashboardSkeleton } from "../components/ui/Skeleton.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import LeadCharts from "../components/dashboard/LeadCharts.jsx";
import SourceFunnel from "../components/dashboard/SourceFunnel.jsx";
import HotLeadsPanel from "../components/dashboard/HotLeadsPanel.jsx";
import LeadDetailModal from "../components/dashboard/LeadDetailModal.jsx";
import LeadListModal from "../components/dashboard/LeadListModal.jsx";
import {
  fetchDashboardOverview,
  fetchDashboardByRange,
  fetchLeadsByDayRange,
  DASHBOARD_RANGE_OPTIONS,
  DASHBOARD_COURSE_OPTIONS,
  DASHBOARD_STATUS_OPTIONS,
} from "../services/dashboardService.js";
import { fetchLeadById } from "../services/leadService.js";

// Gắn nhãn "hôm nay" cho mốc 1 ngày, còn lại hiện "N ngày qua" — dùng cho
// 3 thẻ KPI phụ thuộc khoảng thời gian (Lead mới / Lead nóng / Đã đăng ký).
function rangeLabel(days) {
  if (days === "all") return "tất cả";
  return days === 1 ? "hôm nay" : `${days} ngày qua`;
}

// Ánh xạ key của thẻ KPI -> bộ lọc lead tương ứng khi click vào thẻ (Mục
// "Click KPI để xem Lead tương ứng"). "Tổng lead"/"Lead mới" không có tiêu
// chí phân loại riêng nên mở ra toàn bộ danh sách lead.
const STAT_KEY_TO_FILTERS = {
  total: {},
  new: {},
  hot: { cls: "Lead nóng" },
  deposited: { status: "Đã đặt cọc" },
  registered: { status: "Đã đăng ký" },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [leadDrill, setLeadDrill] = useState(null); // { title, filters }

  // Thẻ "Tổng lead" — không phụ thuộc khoảng thời gian, chỉ tải 1 lần.
  const [totalLeadStat, setTotalLeadStat] = useState(null);
  const [loadingTotal, setLoadingTotal] = useState(true);
  const [totalError, setTotalError] = useState(null);

  // Dropdown khoảng thời gian dùng chung cho toàn bộ phần còn lại của
  // Dashboard (trừ "Tổng lead" và "Lead cần xử lý ngay").
  const [days, setDays] = useState(7);
  const [retryTick, setRetryTick] = useState(0);
  const [rangeData, setRangeData] = useState(null);
  const [loadingRange, setLoadingRange] = useState(true);
  const [rangeError, setRangeError] = useState(null);

  // Bộ lọc riêng cho biểu đồ "Lead theo ngày" — 2 dropdown Khóa học / Trạng thái.
  // Chỉ tải lại chuỗi theo ngày khi có lọc, không đụng tới donut/nguồn/phễu/KPI.
  const [courseFilter, setCourseFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [filteredByDay, setFilteredByDay] = useState([]);
  const [loadingChart, setLoadingChart] = useState(false);

  const hasChartFilter = Boolean(courseFilter || statusFilter);

  useEffect(() => {
    let cancelled = false;
    fetchDashboardOverview()
      .then((data) => {
        if (!cancelled) setTotalLeadStat(data.find((s) => s.label === "Tổng lead") || data[0]);
      })
      .catch((err) => {
        if (!cancelled) setTotalError(err.message || "Không thể tải dữ liệu Dashboard.");
      })
      .finally(() => {
        if (!cancelled) setLoadingTotal(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // GET /api/dashboard/overview?range={days} — tải lại mỗi khi đổi dropdown
  useEffect(() => {
    let cancelled = false;
    setLoadingRange(true);
    setRangeError(null);
    fetchDashboardByRange(days)
      .then((data) => {
        if (!cancelled) setRangeData(data);
      })
      .catch((err) => {
        if (!cancelled) setRangeError(err.message || "Không thể tải dữ liệu Dashboard.");
      })
      .finally(() => {
        if (!cancelled) setLoadingRange(false);
      });
    return () => {
      cancelled = true;
    };
  }, [days, retryTick]);

  // GET /api/dashboard/leads-by-day?range={days}&course=&status= — tải lại chuỗi
  // "Lead theo ngày" mỗi khi đổi khóa học / trạng thái. Không lọc thì dùng lại
  // dữ liệu sẵn có trong rangeData nên không cần gọi API.
  useEffect(() => {
    if (!hasChartFilter) {
      setFilteredByDay([]);
      return;
    }
    let cancelled = false;
    setLoadingChart(true);
    fetchLeadsByDayRange(days, { course: courseFilter, status: statusFilter })
      .then((data) => {
        if (!cancelled) setFilteredByDay(data);
      })
      .finally(() => {
        if (!cancelled) setLoadingChart(false);
      });
    return () => {
      cancelled = true;
    };
  }, [days, courseFilter, statusFilter, hasChartFilter]);

  // Khi chọn 1 hot lead, tải chi tiết lead qua leadService để hiện modal
  const refreshSelectedLead = () => {
    if (!selectedId) return;
    fetchLeadById(selectedId).then((l) => setSelectedLead(l));
  };

  useEffect(() => {
    if (!selectedId) {
      setSelectedLead(null);
      return;
    }
    let cancelled = false;
    fetchLeadById(selectedId).then((l) => {
      if (!cancelled) setSelectedLead(l);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  if (loadingTotal) return <DashboardSkeleton />;

  if (totalError) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Không thể tải Dashboard"
        description={totalError}
        action={{ label: "Thử lại", onClick: () => window.location.reload() }}
      />
    );
  }

  // 3 thẻ KPI theo khoảng thời gian (nhãn được gắn thêm "hôm nay"/"N ngày
  // qua" ngay tại đây, dữ liệu gốc từ service giữ nguyên không đổi nhãn).
  const rangeStats = (rangeData?.statsRange || []).map((s) => ({
    ...s,
    label: s.key === "new" && days === 1 ? "Lead mới hôm nay" : `${s.label} (${rangeLabel(days)})`,
  }));

  // Chuỗi "Lead theo ngày": đang lọc khóa học/trạng thái thì dùng dữ liệu đã
  // lọc (filteredByDay), ngược lại dùng dữ liệu theo khoảng thời gian.
  const leadsByDay = hasChartFilter ? filteredByDay : rangeData?.leadsByDay || [];

  return (
    <div className="space-y-6">
      {/* Dropdown khoảng thời gian dùng chung — áp dụng cho mọi mục bên
          dưới, TRỪ "Tổng lead" và "Lead cần xử lý ngay". */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Tổng quan</h2>
          <p className="text-sm text-slate-500">
            Số liệu cập nhật theo khoảng thời gian đã chọn (trừ Tổng lead &amp; Lead cần xử lý ngay).
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs text-gray-600 border border-gray-200 rounded-lg px-2.5 py-2 bg-white">
          <CalendarRange size={14} className="text-slate-400 shrink-0" />
          <select
            value={days}
            onChange={(e) => setDays(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="bg-transparent focus:outline-none cursor-pointer"
          >
            {DASHBOARD_RANGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {totalLeadStat && (
          <button
            type="button"
            onClick={() => setLeadDrill({ title: totalLeadStat.label, filters: STAT_KEY_TO_FILTERS.total })}
            className="text-left"
          >
            <StatCard {...totalLeadStat} />
          </button>
        )}
        {loadingRange
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white border border-slate-300 rounded-card p-6 h-[92px] animate-pulse" />
            ))
          : rangeError
          ? (
            <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4">
              <EmptyState
                compact
                icon={AlertCircle}
                title="Không thể tải số liệu theo khoảng thời gian"
                description={rangeError}
                action={{ label: "Thử lại", onClick: () => setRetryTick((n) => n + 1) }}
              />
            </div>
          )
          : rangeStats.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setLeadDrill({ title: s.label, filters: STAT_KEY_TO_FILTERS[s.key] || {} })}
                className="text-left"
              >
                <StatCard {...s} />
              </button>
            ))}
      </div>

      {/* Row: line chart + donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <LeadCharts
          leadsByDay={leadsByDay}
          classification={rangeData?.classification || []}
          loading={loadingRange}
          chartLoading={loadingChart}
          courseOptions={DASHBOARD_COURSE_OPTIONS}
          statusOptions={DASHBOARD_STATUS_OPTIONS}
          courseFilter={courseFilter}
          statusFilter={statusFilter}
          onCourseChange={setCourseFilter}
          onStatusChange={setStatusFilter}
        />
      </div>

      {/* Row: biểu đồ (Nguồn lead / Trạng thái lead — chọn qua popup trong
          card) + phễu + lead cần xử lý ngay */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SourceFunnel
          sources={rangeData?.sources || []}
          statusBreakdown={rangeData?.statusBreakdown || []}
          funnel={rangeData?.funnel || []}
          loading={loadingRange}
          onDrill={setLeadDrill}
        />
        <HotLeadsPanel
          selectedId={selectedId}
          onSelect={(id) => setSelectedId((cur) => (cur === id ? null : id))}
          onViewAll={() => navigate("/leads")}
        />
      </div>

      {/* Click 1 lead -> popup chi tiết (không chiếm không gian cố định) */}
      <LeadDetailModal lead={selectedLead} onClose={() => setSelectedId(null)} onRefresh={refreshSelectedLead} />

      {/* Click KPI / nguồn / trạng thái -> danh sách lead tương ứng */}
      {leadDrill && (
        <LeadListModal
          title={leadDrill.title}
          filters={leadDrill.filters}
          onClose={() => setLeadDrill(null)}
        />
      )}
    </div>
  );
}