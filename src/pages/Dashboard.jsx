import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { stats, leads } from "../data/mockData.js";
import StatCard from "../components/ui/StatCard.jsx";
import LeadCharts from "../components/dashboard/LeadCharts.jsx";
import SourceFunnel from "../components/dashboard/SourceFunnel.jsx";
import HotLeadsPanel from "../components/dashboard/HotLeadsPanel.jsx";
import LeadDetailModal from "../components/dashboard/LeadDetailModal.jsx";

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState(null);

  const selected = useMemo(
    () => leads.find((l) => l.id === selectedId) || null,
    [selectedId]
  );

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Row: line chart + donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <LeadCharts />
      </div>

      {/* Row: bar chart + funnel + lead cần xử lý ngay */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SourceFunnel />
        <HotLeadsPanel
          selectedId={selectedId}
          onSelect={(id) => setSelectedId((cur) => (cur === id ? null : id))}
          onViewAll={() => navigate("/leads")}
        />
      </div>

      {/* Click 1 lead -> popup chi tiết (không chiếm không gian cố định) */}
      <LeadDetailModal lead={selected} onClose={() => setSelectedId(null)} />
    </div>
  );
}