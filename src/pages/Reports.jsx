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
} from "recharts";
import { Download, AlertCircle, CalendarRange } from "lucide-react";
import ChartCard from "../components/ui/ChartCard.jsx";
import FunnelBody from "../components/dashboard/FunnelBody.jsx";
import { SkeletonBlock } from "../components/ui/Skeleton.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import {
  fetchDashboardByRange,
  fetchConversionTrend,
  DASHBOARD_RANGE_OPTIONS,
} from "../services/dashboardService.js";
import { exportToCsv } from "../utils/exportCsv.js";

const tooltipStyle = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  fontSize: 12,
  color: "#1e293b",
  boxShadow: "0 8px 24px rgba(15,23,42,0.14)",
};

export default function Reports() {
  const [leadsByDay, setLeadsByDay] = useState([]);
  const [sources, setSources] = useState([]);
  const [classification, setClassification] = useState([]);
  const [funnel, setFunnel] = useState([]);
  const [conversionTrend, setConversionTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
              <Bar dataKey="value" fill="#a855f7" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Phân loại lead" className="lg:col-span-1">
          <div className="space-y-3 mt-2">
            {classification.map((c) => (
              <div key={c.name} className="flex items-center gap-3">
                <div className="w-20 text-xs text-slate-500">{c.name}</div>
                <div className="flex-1 h-5 bg-slate-100 rounded-md overflow-hidden">
                  <div
                    className="h-full rounded-md"
                    style={{ width: `${(c.value / classificationTotal) * 100}%`, background: c.color }}
                  />
                </div>
                <div className="w-8 text-xs text-slate-500 text-right">{c.value}</div>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Phễu chuyển đổi" className="lg:col-span-2">
          <FunnelBody stages={funnel} />
        </ChartCard>
      </div>
    </div>
  );
}