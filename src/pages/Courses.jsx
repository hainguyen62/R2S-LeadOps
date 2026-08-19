import { useEffect, useState } from "react";
import { Plus, GraduationCap, X, Trash2, AlertCircle, Loader2, Power } from "lucide-react";
import {
  fetchCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  sumFees,
  totalWithFees,
} from "../services/courseService.js";
import { SkeletonBlock } from "../components/ui/Skeleton.jsx";
import ConfirmDialog from "../components/ui/ConfirmDialog.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { useToast } from "../components/ui/ToastProvider.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { can } from "../utils/permissions.js";
import useEscapeKey from "../hooks/useEscapeKey.js";

const EMPTY_FORM = {
  name: "",
  basePrice: "",
  fees: [], // { id, name, amount }
  status: "ACTIVE",
};

function money(n) {
  return `${(Number(n) || 0).toLocaleString("vi-VN")}đ`;
}

export default function Courses() {
  const toast = useToast();
  const user = useAuth();
  const canManage = can(user, "manageCourses");
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  useEscapeKey(formOpen, () => setFormOpen(false));
  const [editing, setEditing] = useState(null); // course đang sửa, null = tạo mới
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshTick, forceRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchCourses()
      .then((list) => {
        if (!cancelled) setCourses(list);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Không thể tải danh sách khóa học.");
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

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      name: c.name,
      basePrice: String(c.basePrice),
      fees: (c.fees || []).map((f) => ({ ...f })),
      status: c.status,
    });
    setFieldErrors({});
    setFormOpen(true);
  };

  const addFeeRow = () => {
    setForm((f) => ({ ...f, fees: [...f.fees, { id: Date.now(), name: "", amount: "" }] }));
  };

  const updateFeeRow = (idx, patch) => {
    setForm((f) => ({ ...f, fees: f.fees.map((row, i) => (i === idx ? { ...row, ...patch } : row)) }));
  };

  const removeFeeRow = (idx) => {
    setForm((f) => ({ ...f, fees: f.fees.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFieldErrors({});
    try {
      if (editing) {
        await updateCourse(editing.id, form);
        toast.success("Cập nhật khóa học thành công.");
      } else {
        await createCourse(form);
        toast.success("Thêm khóa học thành công.");
      }
      setFormOpen(false);
      forceRefresh((n) => n + 1);
    } catch (err) {
      if (err.fieldErrors) setFieldErrors(err.fieldErrors);
      toast.error(err.message || "Lưu khóa học thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (c) => {
    try {
      await updateCourse(c.id, { ...c, status: c.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" });
      toast.success(c.status === "ACTIVE" ? "Đã tạm ngừng khóa học." : "Đã kích hoạt lại khóa học.");
      forceRefresh((n) => n + 1);
    } catch (err) {
      toast.error(err.message || "Cập nhật thất bại.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCourse(deleteTarget.id);
      toast.success(`Đã xóa khóa học "${deleteTarget.name}".`);
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
          <h2 className="text-lg font-semibold text-slate-900">Quản lý khóa học</h2>
          <p className="text-sm text-slate-500">Cài đặt học phí và phí phụ thu — dùng để hiển thị giá tiền ở trang chi tiết lead</p>
        </div>
        <button
          onClick={openCreate}
          disabled={!canManage}
          title={canManage ? undefined : "Bạn không có quyền quản lý khóa học"}
          className="flex items-center gap-1.5 text-xs bg-brand-600 rounded-lg px-3 py-2 text-white hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus size={14} /> Thêm khóa học
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-[190px] rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <EmptyState icon={AlertCircle} title="Không thể tải khóa học" description={error} action={{ label: "Thử lại", onClick: () => forceRefresh((n) => n + 1) }} />
      ) : courses.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl shadow-card">
          <EmptyState
            icon={GraduationCap}
            title="Chưa có khóa học nào"
            description="Thêm khóa học đầu tiên để cài đặt học phí."
            action={canManage ? { label: "Thêm khóa học", onClick: openCreate } : undefined}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {courses.map((c) => (
            <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-card hover:border-brand-300 hover:shadow-elevated transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                  <GraduationCap size={18} />
                </div>
                <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${c.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {c.status === "ACTIVE" ? "Đang mở" : "Tạm ngừng"}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-900">{c.name}</p>
              <p className="text-lg font-semibold text-brand-600 mt-1 mb-2">{money(c.basePrice)}</p>

              {c.fees?.length > 0 ? (
                <div className="space-y-1 mb-3">
                  {c.fees.map((f) => (
                    <div key={f.id} className="flex items-center justify-between text-xs text-slate-500">
                      <span className="truncate">{f.name}</span>
                      <span className="shrink-0">+ {money(f.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 mb-3">Không có phí phụ thu.</p>
              )}

              <div className="bg-slate-50 rounded-lg py-2 text-center mb-3">
                <p className="text-sm font-semibold text-slate-900">{money(totalWithFees(c))}</p>
                <p className="text-[10px] text-slate-500">Tổng học phí (chưa áp mã)</p>
              </div>

              {canManage && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button onClick={() => openEdit(c)} className="flex-1 text-xs font-medium text-brand-600 hover:text-brand-700 py-1.5">Sửa</button>
                  <button onClick={() => handleToggleStatus(c)} className="flex-1 flex items-center justify-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700 py-1.5">
                    <Power size={12} /> {c.status === "ACTIVE" ? "Tạm ngừng" : "Kích hoạt"}
                  </button>
                  <button onClick={() => setDeleteTarget(c)} className="p-1.5 rounded-md text-slate-300 hover:bg-red-50 hover:text-red-600">
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
        title="Xóa khóa học"
        message={deleteTarget ? `Bạn có chắc chắn muốn xóa khóa học "${deleteTarget.name}"? Các lead đang chọn khóa học này sẽ không còn hiển thị học phí ở trang chi tiết.` : ""}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
      />

      {formOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-elevated max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 pt-6 pb-2 shrink-0">
              <h3 className="font-semibold text-slate-900">{editing ? "Sửa khóa học" : "Thêm khóa học mới"}</h3>
              <button onClick={() => setFormOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 pb-6 flex flex-col min-h-0 flex-1">
              <div className="overflow-y-auto pr-1 space-y-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Tên khóa học *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="VD: Java Backend"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  {fieldErrors.name && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.name}</p>}
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Học phí gốc (VNĐ) *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={form.basePrice}
                    onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
                    placeholder="VD: 15000000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  {fieldErrors.basePrice && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.basePrice}</p>}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-slate-500">Phí phụ thu (tùy chọn)</label>
                    <button type="button" onClick={addFeeRow} className="text-[11px] font-medium text-brand-600 hover:text-brand-700">
                      + Thêm dòng phí
                    </button>
                  </div>
                  {form.fees.length === 0 ? (
                    <p className="text-[11px] text-slate-400">Chưa có phí phụ thu nào — ví dụ: phí tài liệu, phí thi chứng chỉ.</p>
                  ) : (
                    <div className="space-y-2">
                      {form.fees.map((f, idx) => (
                        <div key={f.id ?? idx} className="flex items-center gap-2">
                          <input
                            value={f.name}
                            onChange={(e) => updateFeeRow(idx, { name: e.target.value })}
                            placeholder="Tên phí, VD: Phí tài liệu"
                            className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                          />
                          <input
                            type="number"
                            min="0"
                            value={f.amount}
                            onChange={(e) => updateFeeRow(idx, { amount: e.target.value })}
                            placeholder="VNĐ"
                            className="w-28 shrink-0 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                          />
                          <button type="button" onClick={() => removeFeeRow(idx)} className="p-1.5 rounded-md text-slate-300 hover:bg-red-50 hover:text-red-600 shrink-0">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 rounded-lg px-3 py-2 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Tổng học phí (chưa áp mã)</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {money((Number(form.basePrice) || 0) + sumFees({ fees: form.fees }))}
                  </span>
                </div>

                <div>
                  <label className="text-xs text-slate-500 block mb-1">Trạng thái</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="ACTIVE">Đang mở</option>
                    <option value="INACTIVE">Tạm ngừng</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-4 shrink-0">
                <button type="button" onClick={() => setFormOpen(false)} className="flex-1 border border-slate-300 rounded-lg py-2 text-sm text-slate-600 hover:bg-slate-50">Hủy</button>
                <button type="submit" disabled={submitting} className="flex-1 bg-brand-600 hover:bg-brand-500 rounded-lg py-2 text-sm text-white disabled:opacity-60 inline-flex items-center justify-center gap-1.5">
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  {submitting ? "Đang lưu..." : editing ? "Lưu thay đổi" : "Thêm khóa học"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
