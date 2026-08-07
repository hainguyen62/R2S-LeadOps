// Phần "thân" của Phễu chuyển đổi — dùng chung cho Dashboard (SourceFunnel)
// và trang Báo cáo (Reports), để 2 nơi hiển thị giống hệt nhau và cùng
// hưởng lợi từ cơ chế đồng bộ hàng + responsive theo container query.

// Màu theo đặc tả cho từng giai đoạn (UI-only, không ảnh hưởng dữ liệu)
const funnelColors = {
  "Lead mới": "#2563EB",
  "Đã liên hệ": "#2EC7C9",
  "Đang tư vấn": "#F6B333",
  "Đang cân nhắc": "#F97316",
  "Đã đặt cọc": "#7E57C2",
  "Đã đăng ký": "#66BB6A",
};

/**
 * Tính toán tỉ lệ (%) chiều rộng đỉnh/đáy cho từng bậc phễu dựa trên "value".
 * Toàn bộ giá trị đều là % (không phải px cố định) nên hình luôn co giãn
 * đúng theo chiều rộng thực tế của ô lưới (grid cell) chứa nó, ở bất kỳ
 * kích thước màn hình / mức zoom nào.
 *
 * clipPath được tính theo hệ toạ độ phần trăm của CHÍNH nó (0-100%), nên
 * đáy của bậc i luôn khớp tuyệt đối với đỉnh của bậc i+1.
 */
export function buildFunnelRows(stages) {
  const maxValue = Math.max(...stages.map((s) => s.value)) || 1;

  return stages.map((stage, i) => {
    const topRatio = stage.value / maxValue;
    const next = stages[i + 1];
    const nextValue = next ? next.value : Math.max(stage.value * 0.55, 1);
    const bottomRatio = Math.min(topRatio, nextValue / maxValue);
    const bottomWidthPct =
      topRatio > 0 ? Math.min(100, (bottomRatio / topRatio) * 100) : 100;

    const clipPath = `polygon(0% 0%, 100% 0%, ${50 + bottomWidthPct / 2}% 100%, ${
      50 - bottomWidthPct / 2
    }% 100%)`;

    return {
      ...stage,
      color: funnelColors[stage.name] || stage.fill,
      topRatio,
      clipPath,
    };
  });
}

/** Một hàng trong bảng lưới (grid) 3 cột: [hình phễu | tên giai đoạn | số lượng].
 *  Trả về Fragment (không bọc div) để 3 ô này thực sự là con trực tiếp
 *  của .funnel-grid — điều kiện bắt buộc để CSS Grid tự đồng bộ chiều cao
 *  hàng giữa cột hình phễu và cột dữ liệu. */
function FunnelGridRow({ row, isLast }) {
  return (
    <>
      <div className="funnel-grid__cell funnel-grid__cell--shape" role="cell">
        <span
          className="funnel-grid__shape"
          style={{
            width: `${row.topRatio * 100}%`,
            background: row.color,
            clipPath: row.clipPath,
          }}
        />
      </div>
      <div
        className={`funnel-grid__cell funnel-grid__cell--stage${
          isLast ? " funnel-grid__cell--last" : ""
        }`}
        role="cell"
      >
        <span className="funnel-grid__stage-text">{row.name}</span>
      </div>
      <div
        className={`funnel-grid__cell funnel-grid__cell--value${
          isLast ? " funnel-grid__cell--last" : ""
        }`}
        role="cell"
      >
        <span className="funnel-grid__value-text">
          {row.value} <span className="funnel-grid__pct">({row.pct})</span>
        </span>
      </div>
    </>
  );
}

/** Giao diện tối giản dùng khi không đủ chiều rộng cho bảng 3 cột. */
function FunnelCompactList({ rows }) {
  return (
    <div className="funnel-compact" role="table" aria-label="Phễu chuyển đổi theo giai đoạn">
      {rows.map((row) => (
        <div className="funnel-compact__row" key={row.name} role="row">
          <span className="funnel-compact__name" role="cell">
            {row.name}
          </span>
          <span className="funnel-compact__dots" aria-hidden="true" />
          <span className="funnel-compact__value" role="cell">
            {row.value} <span className="funnel-compact__pct">({row.pct})</span>
          </span>
        </div>
      ))}
    </div>
  );
}

/** Thân phễu chuyển đổi hoàn chỉnh: bảng lưới (desktop/tablet) + danh sách
 *  tối giản (khi không đủ chỗ), tự chuyển đổi bằng CSS container query.
 *  Component này KHÔNG có khung/border/tiêu đề riêng — nó được đặt bên
 *  trong một "card" khác (ChartCard ở Reports, hoặc .funnel-card ở
 *  Dashboard) để 2 nơi tái sử dụng chung một chuẩn hiển thị. */
export default function FunnelBody({ stages }) {
  const rows = buildFunnelRows(stages);

  return (
    <div className="funnel-card__body">
      <div className="funnel-grid" role="table" aria-label="Phễu chuyển đổi theo giai đoạn">
        {rows.map((row, i) => (
          <FunnelGridRow key={row.name} row={row} isLast={i === rows.length - 1} />
        ))}
      </div>

      <FunnelCompactList rows={rows} />
    </div>
  );
}