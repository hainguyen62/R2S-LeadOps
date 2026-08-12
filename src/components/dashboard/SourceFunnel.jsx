import { useEffect, useRef, useState } from "react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { SlidersHorizontal, Check } from "lucide-react";
import ChartCard from "../ui/ChartCard.jsx";
import FunnelBody from "./FunnelBody.jsx";
import { SkeletonBlock } from "../ui/Skeleton.jsx";
import { buildColorMap } from "../../utils/chartColors.js";

const tooltipStyle = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  fontSize: 12,
  color: "#111827",
  boxShadow: "0 8px 24px rgba(15,23,42,0.14)",
  padding: "8px 12px",
};

function ConversionFunnelCard({ funnel, onStageClick }) {
  return (
    <div className="funnel-card">
      <div className="funnel-card__head">
        <p className="funnel-card__title">Phễu chuyển đổi</p>
        <button type="button" className="funnel-card__action">
          Xem tất cả
        </button>
      </div>

      <FunnelBody
        stages={funnel}
        onStageClick={
          onStageClick ? (stage) => onStageClick({ title: `Trạng thái: ${stage.name}`, filters: { status: stage.name } }) : undefined
        }
      />
    </div>
  );
}

const STATUS_COLORS = {
  "Lead mới": "#3b82f6",
  "Đã liên hệ": "#22c55e",
  "Đang tư vấn": "#eab308",
  "Đang cân nhắc": "#f97316",
  "Đã đặt cọc": "#8b5cf6",
  "Đã đăng ký": "#10b981",
};

function DistributionBarChart({ data, colorMap, onBarClick }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ left: -20, right: 10, bottom: 30 }}>
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
        <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#eef2f7" }} />
        <Bar
          dataKey="value"
          radius={[4, 4, 0, 0]}
          maxBarSize={40}
          fill="#3b82f6"
          cursor={onBarClick ? "pointer" : undefined}
          onClick={onBarClick ? (entry) => onBarClick(entry) : undefined}
        >
          {colorMap &&
            (data || []).map((entry) => <Cell key={entry.name} fill={colorMap[entry.name] || "#94a3b8"} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

const CHART_OPTIONS = [
  { value: "source", label: "Nguồn lead" },
  { value: "status", label: "Trạng thái lead" },
];

/**
 * Popup chọn 1 trong 2: "Nguồn lead" hoặc "Trạng thái lead". Đây là 1 popup
 * với 2 lựa chọn (radio, chọn 1) — chọn cái nào thì THAY biểu đồ ngay trong
 * cùng 1 khung đó, không thêm card mới bên cạnh, để tránh chiếm thêm không
 * gian trên Dashboard.
 */
function ChartSelectMenu({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target) &&
        panelRef.current && !panelRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-brand-600 border border-slate-200 rounded-lg px-2 py-1"
        title="Chọn biểu đồ hiển thị"
      >
        <SlidersHorizontal size={12} /> Đổi biểu đồ
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute z-20 top-full mt-2 right-0 w-48 bg-white border border-slate-200 rounded-lg shadow-elevated overflow-hidden"
        >
          {CHART_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
            >
              {opt.label}
              {value === opt.value && <Check size={13} className="text-brand-600 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Dữ liệu (sources, statusBreakdown, funnel) và trạng thái loading giờ được
// Dashboard.jsx tải theo dropdown khoảng thời gian dùng chung, truyền xuống
// qua props. Popup "Đổi biểu đồ" trên card này cho chọn 1 trong 2: "Nguồn
// lead" hoặc "Trạng thái lead" — chọn cái nào thì THAY biểu đồ ngay trong
// CÙNG 1 khung (không thêm card mới bên cạnh, tránh chiếm thêm không gian).
export default function SourceFunnel({ sources, statusBreakdown, funnel, loading, onDrill }) {
  const [chartMode, setChartMode] = useState("source");
  const activeOption = CHART_OPTIONS.find((o) => o.value === chartMode);
  const activeData = chartMode === "status" ? statusBreakdown : sources;
  const activeColorMap = chartMode === "status" ? STATUS_COLORS : buildColorMap((sources || []).map((s) => s.name));

  if (loading) {
    return (
      <>
        <ChartCard title="Nguồn lead">
          <SkeletonBlock className="w-full h-[240px]" />
        </ChartCard>
        <div className="funnel-card">
          <SkeletonBlock className="w-full h-[240px]" />
        </div>
      </>
    );
  }

  return (
    <>
      <ChartCard
        title={activeOption.label}
        action={<ChartSelectMenu value={chartMode} onChange={setChartMode} />}
      >
        <DistributionBarChart
          data={activeData}
          colorMap={activeColorMap}
          onBarClick={
            onDrill
              ? (entry) =>
                  onDrill(
                    chartMode === "status"
                      ? { title: `Trạng thái: ${entry.name}`, filters: { status: entry.name } }
                      : { title: `Nguồn: ${entry.name}`, filters: { source: entry.name } }
                  )
              : undefined
          }
        />
      </ChartCard>

      <ConversionFunnelCard funnel={funnel} onStageClick={onDrill} />
    </>
  );
}