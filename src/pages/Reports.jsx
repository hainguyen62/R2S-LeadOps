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
import { Download } from "lucide-react";
import ChartCard from "../components/ui/ChartCard.jsx";
import FunnelBody from "../components/dashboard/FunnelBody.jsx";
import { leadsByDay, sources, classification, funnel } from "../data/mockData.js";
import { exportToCsv } from "../utils/exportCsv.js";

const tooltipStyle = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  fontSize: 12,
  color: "#1e293b",
  boxShadow: "0 8px 24px rgba(15,23,42,0.14)",
};

const conversionTrend = [
  { period: "T1", lead: 120, converted: 8 },
  { period: "T2", lead: 150, converted: 12 },
  { period: "T3", lead: 180, converted: 16 },
  { period: "T4", lead: 210, converted: 20 },
  { period: "T5", lead: 248, converted: 28 },
];

export default function Reports() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Báo cáo</h2>
          <p className="text-sm text-slate-500">Đo lường hiệu quả Marketing và tỷ lệ chuyển đổi</p>
        </div>
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
                    style={{ width: `${(c.value / 248) * 100}%`, background: c.color }}
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