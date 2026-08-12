import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Loader2, AlertCircle, Users } from "lucide-react";
import EmptyState from "../ui/EmptyState.jsx";
import Pill from "../ui/Pill.jsx";
import { statusStyle } from "../../data/mockData.js";
import { fetchLeads } from "../../services/leadService.js";

/**
 * Modal drill-down dùng chung: click 1 KPI / cột nguồn / cột trạng thái ở
 * Dashboard, Reports, hoặc Chi tiết chiến dịch -> hiện danh sách lead khớp
 * bộ lọc tương ứng, 5 cột: ID, Tên, SĐT, Score, Trạng thái (Mục 8.3 và các
 * mục "Click KPI/nguồn/trạng thái để xem Lead tương ứng").
 *
 * props:
 *   title    — tiêu đề modal, vd. "Lead nóng · Tuyển sinh khóa Java Backend"
 *   filters  — object truyền thẳng cho fetchLeads() (status/cls/source/campaign...)
 *   onClose  — đóng modal
 */
export default function LeadListModal({ title, filters, onClose }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!filters) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchLeads({ ...filters, page: 1, pageSize: 1000, sortKey: "score", sortDir: "desc" })
      .then((res) => {
        if (!cancelled) setRows(res.items || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Không thể tải danh sách lead.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters]);

  if (!filters) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-300 rounded-modal w-full max-w-2xl max-h-[85vh] flex flex-col shadow-modal">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
              <Users size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-900 truncate">{title}</h3>
              <p className="text-xs text-slate-500">{loading ? "Đang tải..." : `${rows.length} lead`}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <Loader2 size={22} className="animate-spin" />
            </div>
          ) : error ? (
            <div className="p-6">
              <EmptyState icon={AlertCircle} title="Không thể tải danh sách lead" description={error} compact />
            </div>
          ) : rows.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={Users} title="Không có lead nào khớp" compact />
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-50">
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="py-2.5 px-6 font-medium">ID</th>
                  <th className="py-2.5 px-2 font-medium">Tên</th>
                  <th className="py-2.5 px-2 font-medium">SĐT</th>
                  <th className="py-2.5 px-2 font-medium">Score</th>
                  <th className="py-2.5 px-6 font-medium">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((l) => (
                  <tr
                    key={l.id}
                    onClick={() => navigate(`/leads/${l.id}`)}
                    className="border-b border-slate-50 last:border-0 hover:bg-brand-50/60 cursor-pointer"
                  >
                    <td className="py-2.5 px-6 text-slate-500 whitespace-nowrap">#{l.id}</td>
                    <td className="py-2.5 px-2 font-medium text-slate-800 whitespace-nowrap">{l.name}</td>
                    <td className="py-2.5 px-2 text-slate-600 whitespace-nowrap">{l.phone || "—"}</td>
                    <td className="py-2.5 px-2 text-slate-600">{l.score}</td>
                    <td className="py-2.5 px-6 whitespace-nowrap">
                      <Pill text={l.status} map={statusStyle} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}