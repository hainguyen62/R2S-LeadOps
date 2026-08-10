import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import ChartCard from "../ui/ChartCard.jsx";
import { SkeletonBlock } from "../ui/Skeleton.jsx";

const tooltipStyle = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  fontSize: 12,
  color: "#111827",
  boxShadow: "0 8px 24px rgba(15,23,42,0.14)",
  padding: "8px 12px",
};

// Dữ liệu (leadsByDay, classification) và trạng thái loading giờ được
// Dashboard.jsx tải theo dropdown khoảng thời gian dùng chung, truyền
// xuống qua props — component này chỉ còn lo phần hiển thị biểu đồ.
export default function LeadCharts({ leadsByDay, classification, loading }) {
  const totalClass = classification.reduce((a, c) => a + c.value, 0);

  if (loading) {
    return (
      <>
        <ChartCard title="Lead theo ngày" className="lg:col-span-2">
          <SkeletonBlock className="w-full h-[240px]" />
        </ChartCard>
        <ChartCard title="Phân loại lead">
          <SkeletonBlock className="w-full h-[220px] rounded-full mx-auto" />
        </ChartCard>
      </>
    );
  }

  return (
    <>
      <ChartCard title="Lead theo ngày" className="lg:col-span-2">
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={leadsByDay} margin={{ left: -20, right: 10, top: 10 }}>
            <defs>
              <linearGradient id="leadArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fill: "#6b7280", fontSize: 11 }}
              axisLine={{ stroke: "#e5e7eb" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#6b7280", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Area
              type="linear"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="url(#leadArea)"
              dot={{ r: 3, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
              activeDot={{ r: 6, fill: "#2563eb", stroke: "#fff", strokeWidth: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Phân loại lead">
        <div className="relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={classification}
                dataKey="value"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={2}
              >
                {classification.map((c, i) => (
                  <Cell key={i} fill={c.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute text-center pointer-events-none">
            <p className="text-xl font-semibold text-gray-900">{totalClass}</p>
            <p className="text-[11px] text-gray-500">Tổng</p>
          </div>
        </div>
        <div className="flex justify-center gap-4 mt-1">
          {classification.map((c) => (
            <div key={c.name} className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
              {c.name} {c.value}
            </div>
          ))}
        </div>
      </ChartCard>
    </>
  );
}