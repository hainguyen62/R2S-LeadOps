/* ============================================================
   FUNNEL PCT — tính % chuyển đổi giữa các bậc phễu (Lead mới → Đã
   liên hệ → Đang tư vấn → Đang cân nhắc → Đã đặt cọc → Đã đăng ký).

   Theo đúng công thức ở Mục XII.3 (KẾ HOẠCH TRIỂN KHAI): mỗi bậc thể
   hiện "giữ được bao nhiêu % lead so với bậc LIỀN TRƯỚC", ví dụ:
     Tỷ lệ tư vấn = Số lead "Đang tư vấn" / Số lead "Đã liên hệ" × 100%
   KHÔNG phải % so với tổng lead ban đầu (đó là 2 con số khác nhau).

   Bậc đầu tiên ("Lead mới") luôn là mốc gốc nên hiển thị 100%.
   ============================================================ */

/**
 * @param {Array<{name: string, value: number, fill?: string}>} stages
 * @returns {Array<{name: string, value: number, fill?: string, pct: string}>}
 *   Mảng mới, mỗi phần tử có thêm field `pct` = "<số>%" tính so với bậc
 *   liền trước (bậc đầu tiên = "100%"). Không sửa mảng gốc.
 */
export function withStagePct(stages) {
  return stages.map((stage, i) => {
    const prev = stages[i - 1];
    let pct;
    if (i === 0) {
      pct = "100%";
    } else if (!prev || prev.value <= 0) {
      pct = "0%";
    } else {
      pct = `${Math.round((stage.value / prev.value) * 100)}%`;
    }
    return { ...stage, pct };
  });
}
