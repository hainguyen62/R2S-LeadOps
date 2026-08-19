import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Ticket, X, Trash2, AlertCircle, Loader2, Percent, Banknote, Power, Users } from "lucide-react";
import { fetchVouchers, createVoucher, updateVoucher, updateVoucherStatus, deleteVoucher, getVoucherDisplayStatus, getVoucherDeleteConstraint, fetchVoucherRedemptions } from "../services/voucherService.js";
import { courseOptions, leadStatusOrder } from "../data/mockData.js";
import { fetchCampaigns } from "../services/campaignService.js";
import { SkeletonBlock } from "../components/ui/Skeleton.jsx";
import ConfirmDialog from "../components/ui/ConfirmDialog.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { useToast } from "../components/ui/ToastProvider.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { can } from "../utils/permissions.js";
import useEscapeKey from "../hooks/useEscapeKey.js";
import { formatVietnamDateTime } from "../utils/datetime.js";

/**
 * Modal drill-down: click vào số "lượt dùng" của 1 voucher -> hiện danh sách
 * lead đã áp mã đó (tên lead, thời điểm áp, số tiền giảm, người áp) — click
 * 1 dòng thì sang thẳng trang chi tiết lead đó. Cùng pattern với
 * dashboard/LeadListModal.jsx.
 */
function VoucherRedemptionsModal({ voucher, onClose }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!voucher) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchVoucherRedemptions(voucher.id)
      .then((list) => {
        if (!cancelled) setRows(list);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Không thể tải danh sách lead đã áp mã.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [voucher]);

  useEscapeKey(!!voucher, onClose);

  if (!voucher) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-300 rounded-modal w-full max-w-lg max-h-[85vh] flex flex-col shadow-modal">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
              <Ticket size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-900 truncate font-mono">{voucher.code}</h3>
              <p className="text-xs text-slate-500">{loading ? "Đang tải..." : `${rows.length} lượt đã áp dụng`}</p>
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
              <EmptyState icon={AlertCircle} title="Không thể tải danh sách" description={error} compact />
            </div>
          ) : rows.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={Users} title="Chưa có lead nào áp dụng mã này" compact />
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-50">
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="py-2.5 px-6 font-medium">Lead</th>
                  <th className="py-2.5 px-2 font-medium">Giảm</th>
                  <th className="py-2.5 px-2 font-medium">Người áp</th>
                  <th className="py-2.5 px-6 font-medium">Thời điểm</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => navigate(`/leads/${r.leadId}`)}
                    className="border-b border-slate-50 last:border-0 hover:bg-brand-50/60 cursor-pointer"
                  >
                    <td className="py-2.5 px-6 font-medium text-slate-800 whitespace-nowrap">{r.leadName}</td>
                    <td className="py-2.5 px-2 text-emerald-600 whitespace-nowrap">− {r.discountAmount.toLocaleString("vi-VN")}đ</td>
                    <td className="py-2.5 px-2 text-slate-600 whitespace-nowrap">{r.redeemedBy}</td>
                    <td className="py-2.5 px-6 text-slate-500 whitespace-nowrap">{formatVietnamDateTime(r.redeemedAt)}</td>
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

const voucherStatusStyle = {
  "Đang áp dụng": "bg-emerald-50 text-emerald-700",
  "Sắp diễn ra": "bg-amber-50 text-amber-700",
  "Hết hạn": "bg-slate-100 text-slate-500",
  "Đã tắt": "bg-red-50 text-red-600",
};

const EMPTY_FORM = {
  code: "",
  name: "",
  description: "",
  discountType: "PERCENT",
  discountValue: "",
  courseId: "",
  campaignId: "",
  startDate: "",
  endDate: "",
  usageLimit: "",
  usageLimitPerLead: "1",
  minLeadStage: "Đang cân nhắc",
};

export default function Vouchers() {
  const toast = useToast();
  const user = useAuth();
  const canManage = can(user, "manageVouchers");
  const [vouchers, setVouchers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  useEscapeKey(formOpen, () => setFormOpen(false));
  const [editing, setEditing] = useState(null); // voucher đang sửa, null = tạo mới
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [redemptionsTarget, setRedemptionsTarget] = useState(null); // voucher đang xem danh sách lead đã áp mã
  const [refreshTick, forceRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([fetchVouchers(), fetchCampaigns()])
      .then(([vs, cs]) => {
        if (cancelled) return;
        setVouchers(vs);
        setCampaigns(cs);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Không thể tải danh sách voucher.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setFormOpen(true);
  };

  const openEdit = (v) => {
    setEditing(v);
    setForm({
      code: v.code,
      name: v.name,
      description: v.description || "",
      discountType: v.discountType,
      discountValue: String(v.discountValue),
      courseId: v.courseId || "",
      campaignId: v.campaignId ? String(v.campaignId) : "",
      startDate: v.startDate || "",
      endDate: v.endDate || "",
      usageLimit: v.usageLimit ? String(v.usageLimit) : "",
      usageLimitPerLead: String(v.usageLimitPerLead || 1),
      minLeadStage: v.minLeadStage || "Đang cân nhắc",
    });
    setFieldErrors({});
    setFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFieldErrors({});
    try {
      if (editing) {
        await updateVoucher(editing.id, form);
        toast.success("Cập nhật voucher thành công.");
      } else {
        await createVoucher(form);
        toast.success("Tạo voucher thành công.");
      }
      setFormOpen(false);
      forceRefresh((n) => n + 1);
    } catch (err) {
      if (err.fieldErrors) setFieldErrors(err.fieldErrors);
      toast.error(err.message || "Lưu voucher thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (v) => {
    try {
      await updateVoucherStatus(v.id, v.status === "DISABLED" ? "ACTIVE" : "DISABLED");
      toast.success(v.status === "DISABLED" ? "Đã bật lại voucher." : "Đã tắt voucher.");
      forceRefresh((n) => n + 1);
    } catch (err) {
      toast.error(err.message || "Cập nhật thất bại.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteVoucher(deleteTarget.id);
      toast.success(`Đã xóa voucher "${deleteTarget.code}".`);
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
          <h2 className="text-lg font-semibold text-slate-900">Chương trình giảm giá</h2>
          <p className="text-sm text-slate-500">Quản lý voucher áp dụng cho lead khi đặt cọc/đăng ký</p>
        </div>
        <button
          onClick={openCreate}
          disabled={!canManage}
          title={canManage ? undefined : "Bạn không có quyền tạo voucher"}
          className="flex items-center gap-1.5 text-xs bg-brand-600 rounded-lg px-3 py-2 text-white hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus size={14} /> Tạo voucher
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-[190px] rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <EmptyState icon={AlertCircle} title="Không thể tải voucher" description={error} action={{ label: "Thử lại", onClick: () => forceRefresh((n) => n + 1) }} />
      ) : vouchers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl shadow-card">
          <EmptyState
            icon={Ticket}
            title="Chưa có voucher nào"
            description="Tạo voucher đầu tiên để áp dụng ưu đãi khi lead đặt cọc/đăng ký."
            action={canManage ? { label: "Tạo voucher", onClick: openCreate } : undefined}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {vouchers.map((v) => (
            <div key={v.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-card hover:border-brand-300 hover:shadow-elevated transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
                  {v.discountType === "PERCENT" ? <Percent size={18} /> : <Banknote size={18} />}
                </div>
                <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${voucherStatusStyle[v.displayStatus] || "bg-slate-100 text-slate-500"}`}>
                  {v.displayStatus}
                </span>
              </div>
              <p className="font-mono text-sm font-semibold text-slate-900">{v.code}</p>
              <p className="text-xs text-slate-500 mb-3">{v.name}</p>
              <p className="text-lg font-semibold text-brand-600 mb-3">
                {v.discountType === "PERCENT" ? `Giảm ${v.discountValue}%` : `Giảm ${v.discountValue.toLocaleString("vi-VN")}đ`}
              </p>
              <div className="grid grid-cols-2 gap-2 text-center mb-3">
                <div className="bg-slate-50 rounded-lg py-2">
                  <button
                    type="button"
                    onClick={() => setRedemptionsTarget(v)}
                    disabled={v.usedCount === 0}
                    title={v.usedCount === 0 ? undefined : "Xem danh sách lead đã áp mã này"}
                    className={`w-full text-sm font-semibold ${v.usedCount > 0 ? "text-brand-600 hover:underline cursor-pointer" : "text-slate-900 cursor-default"}`}
                  >
                    {v.usedCount}{v.usageLimit ? `/${v.usageLimit}` : ""}
                  </button>
                  <p className="text-[10px] text-slate-500">Lượt dùng</p>
                </div>
                <div className="bg-slate-50 rounded-lg py-2">
                  <p className="text-sm font-semibold text-slate-900">{v.courseId || "Mọi khóa"}</p>
                  <p className="text-[10px] text-slate-500">Áp dụng</p>
                </div>
              </div>
              {canManage && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button onClick={() => openEdit(v)} className="flex-1 text-xs font-medium text-brand-600 hover:text-brand-700 py-1.5">Sửa</button>
                  <button onClick={() => handleToggleStatus(v)} className="flex-1 flex items-center justify-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700 py-1.5">
                    <Power size={12} /> {v.status === "DISABLED" ? "Bật lại" : "Tắt"}
                  </button>
                  <button
                    onClick={() => setDeleteTarget(v)}
                    disabled={!getVoucherDeleteConstraint(v).allowed}
                    title={getVoucherDeleteConstraint(v).allowed ? "Xóa voucher" : getVoucherDeleteConstraint(v).reason}
                    className="p-1.5 rounded-md text-slate-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-300 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa voucher"
        message={deleteTarget ? `Bạn có chắc chắn muốn xóa voucher "${deleteTarget.code}"? Hành động này không thể hoàn tác.` : ""}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
      />

      <VoucherRedemptionsModal voucher={redemptionsTarget} onClose={() => setRedemptionsTarget(null)} />

      {formOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-elevated max-h-[90vh] flex flex-col">
            {/* Header CỐ ĐỊNH (shrink-0) — nút X luôn hiện, không bị cuộn mất khi
                form dài hơn màn hình (trước đây overlay ngoài tự cuộn khiến
                phần đầu card, gồm cả nút X, bị đẩy lên trên khỏi khung nhìn). */}
            <div className="flex items-center justify-between px-6 pt-6 pb-2 shrink-0">
              <h3 className="font-semibold text-slate-900">{editing ? "Sửa voucher" : "Tạo voucher mới"}</h3>
              <button onClick={() => setFormOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 pb-6 flex flex-col min-h-0 flex-1">
              <div className="overflow-y-auto pr-1 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Mã voucher *</label>
                  <input
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="JAVA30"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  {fieldErrors.code && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.code}</p>}
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Loại giảm giá</label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="PERCENT">Theo % học phí</option>
                    <option value="FIXED_AMOUNT">Số tiền cố định</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Tên chương trình *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ưu đãi khai giảng..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                {fieldErrors.name && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.name}</p>}
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">
                  Giá trị giảm * {form.discountType === "PERCENT" ? "(%)" : "(VNĐ)"}
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  max={form.discountType === "PERCENT" ? 100 : undefined}
                  value={form.discountValue}
                  onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                  placeholder={form.discountType === "PERCENT" ? "30" : "500000"}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                {fieldErrors.discountValue && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.discountValue}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Áp dụng khóa học</label>
                  <select
                    value={form.courseId}
                    onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="">Mọi khóa học</option>
                    {courseOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Gắn chiến dịch</label>
                  <select
                    value={form.campaignId}
                    onChange={(e) => setForm({ ...form, campaignId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="">Không gắn</option>
                    {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Ngày bắt đầu</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Ngày kết thúc</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} min={form.startDate || undefined} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Tổng lượt dùng tối đa</label>
                  <input type="number" min="0" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} placeholder="Không giới hạn" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Lượt dùng / 1 lead</label>
                  <input type="number" min="1" value={form.usageLimitPerLead} onChange={(e) => setForm({ ...form, usageLimitPerLead: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Chỉ áp dụng từ giai đoạn</label>
                <select
                  value={form.minLeadStage}
                  onChange={(e) => setForm({ ...form, minLeadStage: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  {leadStatusOrder.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Mô tả</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              </div>
              <div className="flex gap-2 pt-4 shrink-0">
                <button type="button" onClick={() => setFormOpen(false)} className="flex-1 border border-slate-300 rounded-lg py-2 text-sm text-slate-600 hover:bg-slate-50">Hủy</button>
                <button type="submit" disabled={submitting} className="flex-1 bg-brand-600 hover:bg-brand-500 rounded-lg py-2 text-sm text-white disabled:opacity-60 inline-flex items-center justify-center gap-1.5">
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  {submitting ? "Đang lưu..." : editing ? "Lưu thay đổi" : "Tạo voucher"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
