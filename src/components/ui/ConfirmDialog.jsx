import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";

/**
 * Popup xác nhận hành động không thể hoàn tác (xóa Lead/Campaign/User...).
 * Dùng: <ConfirmDialog open={...} title="..." message="..." onCancel={...} onConfirm={...} />
 */
export default function ConfirmDialog({
  open,
  title = "Xác nhận xóa",
  message = "Bạn có chắc chắn muốn xóa mục này?",
  confirmLabel = "Xóa",
  cancelLabel = "Hủy",
  danger = true,
  irreversible = danger,
  loading = false,
  onCancel,
  onConfirm,
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onCancel?.();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onCancel]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9998] bg-slate-900/50 flex items-center justify-center p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onCancel?.()}
    >
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-6 shadow-elevated">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                danger ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
              }`}
            >
              <AlertTriangle size={20} />
            </div>
            <h3 className="font-semibold text-slate-900">{title}</h3>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 shrink-0">
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
        {irreversible && (
          <p className="text-xs text-red-500 mt-2 font-medium">Hành động này không thể hoàn tác.</p>
        )}

        <div className="flex gap-2 pt-5">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 border border-slate-300 rounded-lg py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 rounded-lg py-2 text-sm text-white font-medium disabled:opacity-60 ${
              danger ? "bg-red-600 hover:bg-red-500" : "bg-brand-600 hover:bg-brand-500"
            }`}
          >
            {loading ? "Đang xử lý..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}