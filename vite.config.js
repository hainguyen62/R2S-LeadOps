import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
  test: {
    // happy-dom cung cấp window/localStorage — cần thiết cho webhookService.js
    // (đọc/ghi cấu hình + log webhook qua window.localStorage). Dùng happy-dom
    // thay vì jsdom vì nhẹ hơn và không bị lỗi xung đột ESM/CommonJS mà một số
    // bản jsdom mới gặp phải (dependency html-encoding-sniffer). Các service
    // khác dùng "localStorage" global (không qua window) vẫn chạy bình
    // thường dưới happy-dom nên đổi environment không ảnh hưởng test cũ.
    environment: "happy-dom",
  },
});
