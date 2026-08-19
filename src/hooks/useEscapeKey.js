import { useEffect } from "react";

/**
 * Đóng popup/modal khi nhấn phím ESC — dùng chung cho MỌI popup trong app
 * (thay vì viết lại useEffect + addEventListener ở từng nơi).
 *
 * Dùng: useEscapeKey(open, () => setOpen(false));
 *   - active: chỉ lắng nghe phím khi popup đang mở (tránh đóng nhầm popup khác).
 *   - onClose: hàm đóng popup.
 */
export default function useEscapeKey(active, onClose) {
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, onClose]);
}