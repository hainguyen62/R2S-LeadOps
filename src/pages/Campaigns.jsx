import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, GitBranch, X, ChevronRight, Trash2, AlertCircle, Loader2 } from "lucide-react";
import { fetchCampaigns, createCampaign, deleteCampaign } from "../services/campaignService.js";
import { SkeletonBlock } from "../components/ui/Skeleton.jsx";
import ConfirmDialog from "../components/ui/ConfirmDialog.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { useToast } from "../components/ui/ToastProvider.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { can } from "../utils/permissions.js";

// "2026-05-01" -> "01/05"
const formatShortDate = (iso) => {
  if (!iso || iso === "—") return "—";
  const parts = iso.split("-");
  if (parts.length !== 3) return iso.slice(0, 5);
  const [y, m, d] = parts;
  return `${d}/${m}`;
};

/**
 * Suy ra trạng thái hiển thị của chiến dịch dựa trên ngày bắt đầu/kết thúc:
 *   - Chưa tới ngày bắt đầu           -> "Sắp diễn ra"
 *   - Đã qua ngày kết thúc            -> "Kết thúc"
 *   - Còn lại (đang trong khoảng)     -> "Đang chạy"
 * Nếu thiếu ngày bắt đầu/kết thúc hợp lệ thì fallback về c.status gốc.
 */
const getCampaignDisplayStatus = (c) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = c.start && c.start !== "—" ? new Date(c.start) : null;
  const end = c.end && c.end !== "—" ? new Date(c.end) : null;

  if (start && !isNaN(start) && today < start) return "Sắp diễn ra";
  if (end && !isNaN(end) && today > end) return "Kết thúc";
  if (start && !isNaN(start)) return "Đang chạy";
  return c.status || "—";
};

const campaignStatusStyle = {
  "Sắp diễn ra": "bg-amber-50 text-amber-700",
  "Đang chạy": "bg-emerald-50 text-emerald-700",
  "Kết thúc": "bg-slate-100 text-slate-500",
};

export default function Campaigns() {
  const navigate = useNavigate();
  const toast = useToast();
  const user = useAuth();
  // Leader Marketing chỉ được "theo dõi" chiến dịch (xem), không được
  // tạo/sửa/xóa — chỉ Admin và Marketing Staff có manageCampaigns (Mục IV).
  const canManage = can(user, "manageCampaigns");
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", source: "", budget: "", start: "", end: "" });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshTick, forceRefresh] = useState(0);

  // GET /api/campaigns — xem services/campaignService.js
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchCampaigns()
      .then((data) => {
        if (!cancelled) setCampaigns(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Không thể tải danh sách chiến dịch.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      await createCampaign({
        name: form.name,
        source: form.source || "Manual",
        course: "",
        budget: form.budget || "0",
        start: form.start || "—",
        end: form.end || "—",
        utmSource: "",
        utmMedium: "",
        utmCampaign: "",
        utmContent: "",
        utmTerm: "",
      });
      setShowAdd(false);
      setForm({ name: "", source: "", budget: "", start: "", end: "" });
      toast.success("Tạo chiến dịch thành công.");
      forceRefresh((n) => n + 1);
    } catch (err) {
      toast.error(err.message || "Tạo chiến dịch thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCampaign = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCampaign(deleteTarget.id);
      toast.success(`Đã xóa chiến dịch "${deleteTarget.name}" thành công.`);
      setDeleteTarget(null);
      forceRefresh((n) => n + 1);
    } catch (err) {
      toast.error(err.message || "Xóa thất bại.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Chiến dịch & Nguồn lead</h2>
          <p className="text-sm text-slate-500">Quản lý nguồn lead và chiến dịch Marketing</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          disabled={!canManage}
          title={canManage ? undefined : "Bạn không có quyền tạo chiến dịch"}
          className="flex items-center gap-1.5 text-xs bg-brand-600 rounded-lg px-3 py-2 text-white hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-brand-600"
        >
          <Plus size={14} /> Tạo chiến dịch
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-[180px] rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={AlertCircle}
          title="Không thể tải chiến dịch"
          description={error}
          action={{ label: "Thử lại", onClick: () => forceRefresh((n) => n + 1) }}
        />
      ) : campaigns.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl shadow-card">
          <EmptyState
            icon={GitBranch}
            title="Chưa có chiến dịch nào"
            description="Tạo chiến dịch đầu tiên để bắt đầu theo dõi hiệu quả nguồn lead và ngân sách."
            action={canManage ? { label: "Tạo chiến dịch", onClick: () => setShowAdd(true) } : undefined}
          />
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {campaigns.map((c) => (
          <div
            key={c.id}
            className="relative bg-white border border-slate-200 rounded-xl p-5 shadow-card hover:border-brand-300 hover:shadow-elevated transition-all group"
          >
            {canManage && (
              <button
                onClick={(e) => { e.stopPropagation(); setDeleteTarget(c); }}
                className="absolute top-4 right-4 p-1.5 rounded-md text-slate-300 hover:bg-red-50 hover:text-red-600 z-10"
                title="Xóa chiến dịch"
              >
                <Trash2 size={14} />
              </button>
            )}
            <button
              onClick={() => navigate(`/campaigns/${c.id}`)}
              className="text-left w-full"
            >
              <div className="flex items-start justify-between mb-3 pr-8">
                <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                  <GitBranch size={20} />
                </div>
                <span
                  className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${
                    campaignStatusStyle[getCampaignDisplayStatus(c)] || "bg-slate-100 text-slate-500"
                  }`}
                >
                  {getCampaignDisplayStatus(c)}
                </span>
              </div>
              <h3 className="font-medium text-sm mb-1 text-slate-900 flex items-center gap-1">
                {c.name}
                <ChevronRight size={14} className="text-slate-300 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all" />
              </h3>
              <p className="text-xs text-slate-500 mb-4">Nguồn: {c.source}</p>
              <div className="grid grid-cols-2 gap-2 text-center mb-2">
                <div className="bg-slate-50 rounded-lg py-2">
                  <p className="text-lg font-semibold text-slate-900">{c.leads}</p>
                  <p className="text-[10px] text-slate-500">Leads</p>
                </div>
                <div className="bg-slate-50 rounded-lg py-2">
                  <p className="text-lg font-semibold text-slate-900">{c.budget}</p>
                  <p className="text-[10px] text-slate-500">Ngân sách</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-slate-50 rounded-lg py-2">
                  <p className="text-sm font-semibold text-slate-900">{formatShortDate(c.start)}</p>
                  <p className="text-[10px] text-slate-500">Bắt đầu</p>
                </div>
                <div className="bg-slate-50 rounded-lg py-2">
                  <p className="text-sm font-semibold text-slate-900">{formatShortDate(c.end)}</p>
                  <p className="text-[10px] text-slate-500">Kết thúc</p>
                </div>
              </div>
            </button>
          </div>
        ))}
      </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa chiến dịch"
        message={deleteTarget ? `Bạn có chắc chắn muốn xóa chiến dịch "${deleteTarget.name}"? Số liệu lead/ngân sách liên quan sẽ không còn được theo dõi.` : ""}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteCampaign}
        loading={deleting}
      />

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-elevated">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Tạo chiến dịch mới</h3>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Tên chiến dịch *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Tuyển sinh khóa..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Nguồn</label>
                <select
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="">Chọn nguồn</option>
                  <option>Facebook Ads</option>
                  <option>Google Ads</option>
                  <option>TikTok Ads</option>
                  <option>Landing Page</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Ngân sách (VNĐ)</label>
                  <input
                    value={form.budget}
                    onChange={(e) => setForm({ ...form, budget: e.target.value })}
                    placeholder="10.000.000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Ngày bắt đầu</label>
                  <input
                    type="date"
                    value={form.start}
                    onChange={(e) => setForm({ ...form, start: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Ngày kết thúc</label>
                <input
                  type="date"
                  value={form.end}
                  onChange={(e) => setForm({ ...form, end: e.target.value })}
                  min={form.start || undefined}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="flex-1 border border-slate-300 rounded-lg py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button type="submit" disabled={submitting} className="flex-1 bg-brand-600 hover:bg-brand-500 rounded-lg py-2 text-sm text-white disabled:opacity-60 inline-flex items-center justify-center gap-1.5">
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  {submitting ? "Đang lưu..." : "Tạo chiến dịch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}