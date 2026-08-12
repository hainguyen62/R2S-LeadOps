/* ============================================================
   CHART COLORS — bảng màu dùng chung cho các biểu đồ dạng cột
   (Nguồn lead ở Dashboard, "Hiệu quả nguồn lead" và "Hiệu quả theo
   chiến dịch" ở Reports) để mỗi cột có 1 màu đặc trưng riêng, dễ
   phân biệt, thay vì tất cả cùng 1 màu.

   - getCategoryColor(key): trả về màu ổn định cho 1 tên (nguồn/chiến
     dịch...) — cùng tên luôn ra cùng màu ở mọi biểu đồ trong app nhờ
     hash trên chuỗi, không phụ thuộc thứ tự trong mảng dữ liệu.
   - tint(hex, amount): tạo ra 1 biến thể sáng hơn của cùng 1 màu gốc
     — dùng cho trường hợp 2 cột thuộc cùng 1 nhóm (vd. "Lead" và
     "Đã đăng ký" của cùng 1 chiến dịch) cần "cùng chất màu" (cùng
     tông/hue) nhưng vẫn phải phân biệt được với nhau.
   ============================================================ */

// Bảng màu categorical (đủ tương phản với nền trắng + với nhau),
// tách biệt khỏi màu thương hiệu (sourceMeta) vì nhiều nguồn dùng
// tông xanh dương gần giống nhau, khó phân biệt trên biểu đồ cột.
const PALETTE = [
  "#2563eb", // blue
  "#f97316", // orange
  "#10b981", // emerald
  "#a855f7", // purple
  "#ec4899", // pink
  "#eab308", // yellow
  "#06b6d4", // cyan
  "#ef4444", // red
  "#7c3aed", // violet
  "#14b8a6", // teal
  "#f59e0b", // amber
  "#3b82f6", // sky blue
];

function hashString(str) {
  let hash = 0;
  const s = String(str || "");
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0; // 32-bit
  }
  return Math.abs(hash);
}

/** Màu ổn định cho 1 tên (nguồn, chiến dịch...) — cùng tên luôn cùng màu. */
export function getCategoryColor(key) {
  return PALETTE[hashString(key) % PALETTE.length];
}

/** Bảng {tên: màu} cho 1 danh sách tên — tiện dùng làm colorMap cho <Cell>. */
export function buildColorMap(names) {
  const map = {};
  (names || []).forEach((name) => {
    map[name] = getCategoryColor(name);
  });
  return map;
}

// Làm sáng 1 màu hex theo tỉ lệ (0-1) — dùng để tạo biến thể "cùng chất
// màu" (cùng hue) nhưng nhạt hơn cho cột thứ 2 của cùng 1 nhóm.
export function tint(hex, amount = 0.45) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return hex;
  const [r, g, b] = [m[1], m[2], m[3]].map((h) => parseInt(h, 16));
  const mix = (c) => Math.round(c + (255 - c) * amount);
  const toHex = (c) => c.toString(16).padStart(2, "0");
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}