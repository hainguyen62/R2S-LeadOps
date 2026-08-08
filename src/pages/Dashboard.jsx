import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StatCard from "../components/ui/StatCard.jsx";
import { DashboardSkeleton } from "../components/ui/Skeleton.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import LeadCharts from "../components/dashboard/LeadCharts.jsx";
import SourceFunnel from "../components/dashboard/SourceFunnel.jsx";
import HotLeadsPanel from "../components/dashboard/HotLeadsPanel.jsx";
import LeadDetailModal from "../components/dashboard/LeadDetailModal.jsx";
import { fetchDashboardOverview } from "../services/dashboardService.js";
import { fetchLeadById } from "../services/leadService.js";
import { AlertCircle } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // GET /api/dashboard/overview — tải KPI tổng quan qua dashboardService
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchDashboardOverview()
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Không thể tải dữ liệu Dashboard.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Khi chọn 1 hot lead, tải chi tiết lead qua leadService để hiện modal
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

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Không thể tải Dashboard"
        description={error}
        action={{ label: "Thử lại", onClick: () => window.location.reload() }}
      />
    );
  }

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
      <LeadDetailModal lead={selectedLead} onClose={() => setSelectedId(null)} />
    </div>
  );
}