import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  Cell,
} from "recharts";
import { Download, AlertCircle, CalendarRange, Ticket } from "lucide-react";
import ChartCard from "../components/ui/ChartCard.jsx";
import FunnelBody from "../components/dashboard/FunnelBody.jsx";
import LeadListModal from "../components/dashboard/LeadListModal.jsx";
import { SkeletonBlock } from "../components/ui/Skeleton.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import {
  fetchDashboardByRange,
  fetchConversionTrend,
  DASHBOARD_RANGE_OPTIONS,
} from "../services/dashboardService.js";
import { fetchVoucherStats } from "../services/voucherService.js";
import { exportToCsv } from "../utils/exportCsv.js";
import { getCategoryColor } from "../utils/chartColors.js";

// Tên hiển thị "Nóng/Ấm/Lạnh" (dùng trong classification/donut) -> giá trị
// cls thật của lead trong mockData ("Lead nóng"...) — cần map lại vì 2 nơi
// dùng 2 dạng tên khác nhau cho cùng 1 khái niệm.
const CLASS_NAME_TO_CLS = {
  "Nóng": "Lead nóng",
  "Ấm": "Lead ấm",
  "Lạnh": "Lead lạnh",
};

const tooltipStyle = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  fontSize: 12,
  color: "#1e293b",
  boxShadow: "0 8px 24px rgba(15,23,42,0.14)",
};

const formatVnd = (n) => `${n.toLocaleString("vi-VN")}đ`;

export default function Reports() {
  const navigate = useNavigate();
  const [leadsByDay, setLeadsByDay] = useState([]);
  const [sources, setSources] = useState([]);
  const [classification, setClassification] = useState([]);
  const [funnel, setFunnel] = useState([]);
  const [conversionTrend, setConversionTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ---- Báo cáo hiệu quả Voucher ----
  const [voucherStats, setVoucherStats] = useState([]);
  const [voucherStatsLoading, setVoucherStatsLoading] = useState(true);

  // Drill-down chung: click nguồn / trạng thái / phễu -> mở danh sách lead
  // tương ứng (LeadListModal) — "Drill-down từ báo cáo → Lead list".
  const [leadDrill, setLeadDrill] = useState(null); // { title, filters }

  // Dropdown khoảng thời gian dùng chung (giống Dashboard.jsx) — áp dụng cho
  // "Lead theo ngày", "Nguồn lead", "Phân loại lead", "Phễu chuyển đổi".
  // Riêng "Xu hướng chuyển đổi" là báo cáo theo tháng, không phụ thuộc mốc
  // ngày/tuần nên giữ nguyên không lọc.
  const [days, setDays] = useState(7);

  // Tải "Xu hướng chuyển đổi" (không phụ thuộc range) — chỉ 1 lần.
  useEffect(() => {
    let cancelled = false;
    fetchConversionTrend()
      .then((trend) => {
        if (!cancelled) setConversionTrend(trend);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Không thể tải báo cáo.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Tải thống kê hiệu quả voucher (số lượt dùng, tổng tiền giảm) — chỉ những
  // voucher đã được dùng ít nhất 1 lần mới hiển thị (xem voucherService.js).
  useEffect(() => {
    let cancelled = false;
    setVoucherStatsLoading(true);
    fetchVoucherStats()
      .then((stats) => {
        if (!cancelled) setVoucherStats(stats);
      })
      .finally(() => {
        if (!cancelled) setVoucherStatsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Tải phần còn lại theo khoảng thời gian đã chọn — dùng chung
  // fetchDashboardByRange(days) đã có sẵn (đúng dữ liệu, tỉ lệ khớp Dashboard).
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchDashboardByRange(days)
      .then((data) => {
        if (cancelled) return;
        setLeadsByDay(data.leadsByDay || []);
        setSources(data.sources || []);
        setClassification(data.classification || []);
        setFunnel(data.funnel || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Không thể tải báo cáo.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [days]);

  const classificationTotal = classification.reduce((a, c) => a + c.value, 0) || 1;

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonBlock className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SkeletonBlock className="h-[280px] rounded-xl" />
          <SkeletonBlock className="h-[280px] rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return <EmptyState icon={AlertCircle} title="Không thể tải báo cáo" description={error} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Báo cáo</h2>
          <p className="text-sm text-slate-500">Đo lường hiệu quả Marketing và tỷ lệ chuyển đổi</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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
          <button
            onClick={() =>
              exportToCsv(
                leadsByDay,
                ["day", "value"],
                "r2s-leads-by-day.csv"
              )
            }
            className="flex items-center gap-1.5 text-xs border border-slate-300 rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-50"
          >
            <Download size={14} /> Xuất báo cáo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Xu hướng chuyển đổi">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={conversionTrend} margin={{ left: -20, right: 10 }}>
              <CartesianGrid stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="period" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={{ stroke: "#cbd5e1" }} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="lead" name="Lead" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="converted" name="Đã đăng ký" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Hiệu quả nguồn lead">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={sources} margin={{ left: -20, right: 10 }}>
              <CartesianGrid stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={{ stroke: "#cbd5e1" }} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f1f5f9" }} />
              <Bar
                dataKey="value"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
                cursor="pointer"
                onClick={(entry) =>
                  setLeadDrill({ title: `Nguồn: ${entry.name}`, filters: { source: entry.name } })
                }
              >
                {sources.map((s) => (
                  <Cell key={s.name} fill={getCategoryColor(s.name)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Phân loại lead" className="lg:col-span-1">
          <div className="space-y-3 mt-2">
            {classification.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() =>
                  setLeadDrill({
                    title: `Lead ${c.name.toLowerCase()}`,
                    filters: { cls: CLASS_NAME_TO_CLS[c.name] || c.name },
                  })
                }
                className="flex items-center gap-3 w-full text-left hover:opacity-80"
              >
                <div className="w-20 text-xs text-slate-500">{c.name}</div>
                <div className="flex-1 h-5 bg-slate-100 rounded-md overflow-hidden">
                  <div
                    className="h-full rounded-md"
                    style={{ width: `${(c.value / classificationTotal) * 100}%`, background: c.color }}
                  />
                </div>
                <div className="w-8 text-xs text-slate-500 text-right">{c.value}</div>
              </button>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Phễu chuyển đổi" className="lg:col-span-2">
          <FunnelBody
            stages={funnel}
            onStageClick={(stage) => setLeadDrill({ title: `Trạng thái: ${stage.name}`, filters: { status: stage.name } })}
          />
        </ChartCard>
      </div>

      {/* ---- Hiệu quả Voucher ---- */}
      <ChartCard title="Hiệu quả voucher">
        {voucherStatsLoading ? (
          <SkeletonBlock className="h-[160px]" />
        ) : voucherStats.length === 0 ? (
          <EmptyState icon={Ticket} title="Chưa có voucher nào được sử dụng" description="Số liệu sẽ hiện khi Sales áp voucher cho lead trong luồng đặt cọc/đăng ký." compact />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                  <th className="py-2 pr-4 font-medium">Mã voucher</th>
                  <th className="py-2 pr-4 font-medium">Chương trình</th>
                  <th className="py-2 pr-4 font-medium">Số lượt dùng</th>
                  <th className="py-2 pr-4 font-medium">Tổng tiền đã giảm</th>
                </tr>
              </thead>
              <tbody>
                {voucherStats.map((s) => (
                  <tr key={s.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-2 pr-4 font-mono font-medium text-slate-800 whitespace-nowrap">{s.code}</td>
                    <td className="py-2 pr-4 text-slate-600">{s.name}</td>
                    <td className="py-2 pr-4 text-slate-600">{s.redemptions}</td>
                    <td className="py-2 pr-4 text-slate-600 whitespace-nowrap">{formatVnd(s.totalDiscount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ChartCard>

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