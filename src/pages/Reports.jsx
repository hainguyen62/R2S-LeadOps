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
import { Download, AlertCircle, CalendarRange, X, GitBranch } from "lucide-react";
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
import { fetchCampaigns } from "../services/campaignService.js";
import { exportToCsv } from "../utils/exportCsv.js";
import { useNavigate } from "react-router-dom";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { getCategoryColor } from "../utils/chartColors.js";
import { Cell } from "recharts";

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

// "10.000.000" (VNĐ, phân cách nghìn bằng dấu chấm) -> 10000000
function parseBudget(str) {
  if (!str) return 0;
  const n = Number(String(str).replace(/\./g, "").replace(/[^\d]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

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

  // ---- Báo cáo hiệu quả theo Campaign (Mục 8.2) ----
  const [campaignReport, setCampaignReport] = useState([]);
  const [campaignReportLoading, setCampaignReportLoading] = useState(true);
  const [campaignSortKey, setCampaignSortKey] = useState("leads");
  const [campaignSortDir, setCampaignSortDir] = useState("desc");
  // Chiến dịch đang được xem nhanh (drill-down) sau khi click vào biểu đồ — Mục 8.3.
  const [drillCampaign, setDrillCampaign] = useState(null);
  // Drill-down chung: click nguồn / trạng thái / phễu / KPI chiến dịch -> mở
  // danh sách lead tương ứng (LeadListModal) — "Drill-down từ báo cáo → Lead list".
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

  // Tải danh sách chiến dịch + tính tỷ lệ chuyển đổi / chi phí mỗi lead
  // (không phụ thuộc bộ lọc "days" ở trên vì mỗi chiến dịch có khoảng thời
  // gian chạy riêng — giữ nguyên toàn bộ chiến dịch để so sánh hiệu quả).
  useEffect(() => {
    let cancelled = false;
    setCampaignReportLoading(true);
    fetchCampaigns()
      .then((list) => {
        if (cancelled) return;
        const withMetrics = list.map((c) => {
          const budget = parseBudget(c.budget);
          const conversionRate = c.leads ? Math.round((c.registrations / c.leads) * 100) : 0;
          const costPerLead = c.leads ? Math.round(budget / c.leads) : 0;
          return { ...c, budgetNumber: budget, conversionRate, costPerLead };
        });
        setCampaignReport(withMetrics);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Không thể tải báo cáo chiến dịch.");
      })
      .finally(() => {
        if (!cancelled) setCampaignReportLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCampaignSort = (key) => {
    if (campaignSortKey === key) {
      setCampaignSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setCampaignSortKey(key);
      setCampaignSortDir("desc");
    }
  };

  const sortedCampaignReport = [...campaignReport].sort((a, b) => {
    const av = a[campaignSortKey];
    const bv = b[campaignSortKey];
    const cmp = typeof av === "string" ? av.localeCompare(bv) : av - bv;
    return campaignSortDir === "asc" ? cmp : -cmp;
  });

  const campaignSortIcon = (key) => {
    if (campaignSortKey !== key) return <ArrowUpDown size={12} className="text-slate-300" />;
    return campaignSortDir === "asc" ? <ArrowUp size={12} className="text-brand-600" /> : <ArrowDown size={12} className="text-brand-600" />;
  };

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

      {/* ---- Hiệu quả theo Chiến dịch (Mục 8.2) ---- */}
      <ChartCard title="Hiệu quả theo chiến dịch">
        {campaignReportLoading ? (
          <SkeletonBlock className="h-[280px] rounded-xl" />
        ) : campaignReport.length === 0 ? (
          <EmptyState icon={AlertCircle} title="Chưa có chiến dịch nào" compact />
        ) : (
          <div className="space-y-5">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={campaignReport} margin={{ left: -20, right: 10 }}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  axisLine={{ stroke: "#cbd5e1" }}
                  tickLine={false}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={50}
                />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f1f5f9" }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey="leads"
                  name="Lead"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                  cursor="pointer"
                  onClick={(data) => setDrillCampaign(data)}
                />
                <Bar
                  dataKey="registrations"
                  name="Đã đăng ký"
                  fill="#22c55e"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                  cursor="pointer"
                  onClick={(data) => setDrillCampaign(data)}
                />
              </BarChart>
            </ResponsiveContainer>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-100">
                    {[
                      { key: "name", label: "Chiến dịch" },
                      { key: "source", label: "Nguồn" },
                      { key: "leads", label: "Lead" },
                      { key: "hotLeads", label: "Lead nóng" },
                      { key: "deposits", label: "Đặt cọc" },
                      { key: "registrations", label: "Đăng ký" },
                      { key: "conversionRate", label: "Tỷ lệ chuyển đổi" },
                      { key: "costPerLead", label: "Chi phí/Lead" },
                      { key: "status", label: "Trạng thái" },
                    ].map((col) => (
                      <th key={col.key} className="py-2 pr-4 font-medium whitespace-nowrap">
                        <button
                          onClick={() => handleCampaignSort(col.key)}
                          className="flex items-center gap-1 hover:text-slate-700"
                        >
                          {col.label} {campaignSortIcon(col.key)}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedCampaignReport.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/campaigns/${c.id}`)}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50 cursor-pointer"
                    >
                      <td className="py-2 pr-4 font-medium text-slate-800 whitespace-nowrap">{c.name}</td>
                      <td className="py-2 pr-4 text-slate-600 whitespace-nowrap">{c.source}</td>
                      <td className="py-2 pr-4 text-slate-600">{c.leads}</td>
                      <td className="py-2 pr-4 text-slate-600">{c.hotLeads}</td>
                      <td className="py-2 pr-4 text-slate-600">{c.deposits}</td>
                      <td className="py-2 pr-4 text-slate-600">{c.registrations}</td>
                      <td className="py-2 pr-4 text-slate-600">{c.conversionRate}%</td>
                      <td className="py-2 pr-4 text-slate-600 whitespace-nowrap">{formatVnd(c.costPerLead)}</td>
                      <td className="py-2 pr-4 whitespace-nowrap">
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                            c.status === "Đang chạy" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </ChartCard>

      {/* ---- Modal xem nhanh chiến dịch (drill-down từ biểu đồ) — Mục 8.3 ---- */}
      {drillCampaign && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-elevated">
            <div className="flex items-center justify-between px-6 pt-6 pb-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                  <GitBranch size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate">{drillCampaign.name}</h3>
                  <p className="text-xs text-slate-500">{drillCampaign.source} · {drillCampaign.course}</p>
                </div>
              </div>
              <button onClick={() => setDrillCampaign(null)} className="text-slate-400 hover:text-slate-600 shrink-0">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 pb-6 space-y-4">
              <span
                className={`inline-block text-[11px] px-2.5 py-1 rounded-full font-medium ${
                  drillCampaign.status === "Đang chạy" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                }`}
              >
                {drillCampaign.status}
              </span>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setLeadDrill({ title: `Tổng lead · ${drillCampaign.name}`, filters: { campaign: drillCampaign.name } })
                  }
                  className="bg-slate-50 rounded-lg p-3 text-left hover:bg-slate-100"
                >
                  <p className="text-[11px] text-slate-500">Lead</p>
                  <p className="text-lg font-semibold text-slate-900">{drillCampaign.leads}</p>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setLeadDrill({
                      title: `Lead nóng · ${drillCampaign.name}`,
                      filters: { campaign: drillCampaign.name, cls: "Lead nóng" },
                    })
                  }
                  className="bg-slate-50 rounded-lg p-3 text-left hover:bg-slate-100"
                >
                  <p className="text-[11px] text-slate-500">Lead nóng</p>
                  <p className="text-lg font-semibold text-slate-900">{drillCampaign.hotLeads}</p>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setLeadDrill({
                      title: `Đã đặt cọc · ${drillCampaign.name}`,
                      filters: { campaign: drillCampaign.name, status: "Đã đặt cọc" },
                    })
                  }
                  className="bg-slate-50 rounded-lg p-3 text-left hover:bg-slate-100"
                >
                  <p className="text-[11px] text-slate-500">Đã đặt cọc</p>
                  <p className="text-lg font-semibold text-slate-900">{drillCampaign.deposits}</p>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setLeadDrill({
                      title: `Đã đăng ký · ${drillCampaign.name}`,
                      filters: { campaign: drillCampaign.name, status: "Đã đăng ký" },
                    })
                  }
                  className="bg-slate-50 rounded-lg p-3 text-left hover:bg-slate-100"
                >
                  <p className="text-[11px] text-slate-500">Đã đăng ký</p>
                  <p className="text-lg font-semibold text-slate-900">{drillCampaign.registrations}</p>
                </button>
              </div>

              <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tỷ lệ chuyển đổi</span>
                  <span className="text-slate-800 font-medium">{drillCampaign.conversionRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Chi phí / Lead</span>
                  <span className="text-slate-800 font-medium">{formatVnd(drillCampaign.costPerLead)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ngân sách</span>
                  <span className="text-slate-800 font-medium">{formatVnd(drillCampaign.budgetNumber)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Thời gian chạy</span>
                  <span className="text-slate-800 font-medium">{drillCampaign.start} → {drillCampaign.end}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setDrillCampaign(null)}
                  className="flex-1 border border-slate-300 rounded-lg py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Đóng
                </button>
                <button
                  onClick={() => navigate(`/campaigns/${drillCampaign.id}`)}
                  className="flex-1 bg-brand-600 hover:bg-brand-500 rounded-lg py-2 text-sm text-white"
                >
                  Xem đầy đủ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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