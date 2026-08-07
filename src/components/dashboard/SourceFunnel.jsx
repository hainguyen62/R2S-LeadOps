import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import ChartCard from "../ui/ChartCard.jsx";
import FunnelBody from "./FunnelBody.jsx";
import { sources, funnel } from "../../data/mockData.js";

const tooltipStyle = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  fontSize: 12,
  color: "#111827",
  boxShadow: "0 8px 24px rgba(15,23,42,0.14)",
  padding: "8px 12px",
};

function ConversionFunnelCard() {
  return (
    <div className="funnel-card">
      <div className="funnel-card__head">
        <p className="funnel-card__title">Phễu chuyển đổi</p>
        <button type="button" className="funnel-card__action">
          Xem tất cả
        </button>
      </div>

      <FunnelBody stages={funnel} />
    </div>
  );
}

export default function SourceFunnel() {
  return (
    <>
      <ChartCard title="Nguồn lead">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={sources} margin={{ left: -20, right: 10, bottom: 30 }}>
            <CartesianGrid stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="name"
              interval={0}
              tick={{ fill: "#6b7280", fontSize: 11 }}
              axisLine={{ stroke: "#e5e7eb" }}
              tickLine={false}
              tickMargin={10}
              angle={-20}
              textAnchor="end"
              height={40}
            />
            <YAxis
              tick={{ fill: "#6b7280", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#eef2f7" }} />
            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ConversionFunnelCard />
    </>
  );
}
