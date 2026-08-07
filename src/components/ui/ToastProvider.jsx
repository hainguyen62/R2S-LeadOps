import { createContext, useCallback, useContext, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const variantConfig = {
  success: { Icon: CheckCircle2, bar: "bg-emerald-500", iconClass: "text-emerald-600" },
  error: { Icon: XCircle, bar: "bg-red-500", iconClass: "text-red-600" },
  info: { Icon: Info, bar: "bg-blue-500", iconClass: "text-blue-600" },
};

/**
 * Toast Notification dùng chung toàn app — gọi qua hook useToast():
 *   const toast = useToast();
 *   toast.success("Tạo lead thành công.");
 *   toast.error("Xóa thất bại.");
 * Tự động biến mất sau vài giây, có thể bấm X để đóng sớm.
 */
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const counter = useRef(0);

  const dismiss = useCallback((id) => {
    setItems((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, variant = "info", duration = 3500) => {
      const id = ++counter.current;
      setItems((list) => [...list, { id, message, variant }]);
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  const api = {
    success: (msg, duration) => push(msg, "success", duration),
    error: (msg, duration) => push(msg, "error", duration),
    info: (msg, duration) => push(msg, "info", duration),
    dismiss,
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div className="fixed bottom-4 right-4 z-[10000] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
          {items.map((t) => {
            const cfg = variantConfig[t.variant] || variantConfig.info;
            const Icon = cfg.Icon;
            return (
              <div
                key={t.id}
                className="pointer-events-auto flex items-start gap-2.5 bg-white border border-slate-200 rounded-xl shadow-elevated px-4 py-3 overflow-hidden relative animate-toast-in"
              >
                <span className={`absolute left-0 top-0 bottom-0 w-1 ${cfg.bar}`} />
                <Icon size={18} className={`shrink-0 mt-0.5 ${cfg.iconClass}`} />
                <p className="text-sm text-slate-700 flex-1 leading-snug">{t.message}</p>
                <button
                  onClick={() => dismiss(t.id)}
                  className="text-slate-400 hover:text-slate-600 shrink-0"
                  aria-label="Đóng thông báo"
                >
                  <X size={15} />
                </button>
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback an toàn nếu component nào đó render ngoài Provider (không nên xảy ra)
    return { success: () => {}, error: () => {}, info: () => {}, dismiss: () => {} };
  }
  return ctx;
}