/* ============================================================
   DASHBOARD SERVICE — khớp Mục X.5 (Dashboard) trong kế hoạch.
   ============================================================ */

import { apiFetch, USE_MOCK, mockDelay } from "./apiClient.js";
import {
  stats,
  leadsByDay,
  classification,
  sources,
  funnel,
  leads as mockLeads,
} from "../data/mockData.js";
import { priorityTier } from "../utils/leadScoring.js";

function clone(obj) {
  return typeof structuredClone === "function" ? structuredClone(obj) : JSON.parse(JSON.stringify(obj));
}

/** GET /api/dashboard/overview — thẻ KPI tổng quan */
export async function fetchDashboardOverview() {
  if (!USE_MOCK) return apiFetch("/dashboard/overview");
  await mockDelay(400);
  return clone(stats);
}

/** GET /api/dashboard/leads-by-course (+ theo ngày, dùng chung 1 endpoint mock) */
export async function fetchLeadsByDay() {
  if (!USE_MOCK) return apiFetch("/dashboard/leads-by-day");
  await mockDelay(300);
  return clone(leadsByDay);
}

export async function fetchLeadsByStatusClassification() {
  if (!USE_MOCK) return apiFetch("/dashboard/leads-by-status");
  await mockDelay(300);
  return clone(classification);
}

/** GET /api/dashboard/leads-by-source */
export async function fetchLeadsBySource() {
  if (!USE_MOCK) return apiFetch("/dashboard/leads-by-source");
  await mockDelay(300);
  return clone(sources);
}

/** GET /api/dashboard/conversion-funnel */
export async function fetchConversionFunnel() {
  if (!USE_MOCK) return apiFetch("/dashboard/conversion-funnel");
  await mockDelay(300);
  return clone(funnel);
}

/* ------------------------------------------------------------------------
 * DASHBOARD THEO KHOẢNG THỜI GIAN (dropdown dùng chung ở Dashboard.jsx)
 * ------------------------------------------------------------------------
 * Áp dụng cho: "Lead theo ngày", "Nguồn lead", "Phễu chuyển đổi", "Phân
 * loại lead", và 3 thẻ KPI "Lead mới / Lead nóng / Đã đăng ký". KHÔNG áp
 * dụng cho "Tổng lead" (luôn là tổng toàn thời gian) và "Lead cần xử lý
 * ngay" (luôn là top ưu tiên hiện tại, không phụ thuộc khoảng thời gian).
 *
 * Vì bộ dữ liệu mẫu (`leads`) chỉ có 16 lead trải trong 2 ngày — đủ cho
 * trang Quản lý Lead nhưng không đủ để minh họa các mốc 7/15/30 ngày — nên
 * số liệu theo ngày ở đây được tổng hợp riêng bằng một hàm "giả ngẫu nhiên
 * nhưng ổn định" (cùng 1 ngày luôn ra cùng 1 giá trị mỗi lần tải lại), rồi
 * phân bổ theo đúng TỈ LỆ hiện có trong mockData (classification/sources/
 * funnel) để các con số giữa các khối luôn khớp nhau. Khi có Back-end
 * thật, chỉ cần thay thân hàm bằng 1 lệnh gọi API duy nhất nhận tham số
 * `range` (số ngày) — chữ ký hàm (nhận `days`, trả về đúng hình dạng dữ
 * liệu này) đã được thiết kế sẵn để khớp thẳng với endpoint thật.
 * ------------------------------------------------------------------------ */

export const DASHBOARD_RANGE_OPTIONS = [
  { value: 1, label: "1 ngày qua" },
  { value: 7, label: "7 ngày qua" },
  { value: 15, label: "15 ngày qua" },
  { value: 30, label: "30 ngày qua" },
  { value: "all", label: "Tất cả" },
];

function hashKey(key) {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return h;
}

function dateKey(d) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function formatDayLabel(d) {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Số lead mới/ngày dao động quanh mốc ~8 (biên độ ±5), ổn định theo ngày.
function buildDailySeries(days, endDate = new Date()) {
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i);
    const wave = Math.sin(hashKey(dateKey(d)));
    const value = Math.max(1, Math.round(8 + wave * 5));
    out.push({ day: formatDayLabel(d), value });
  }
  return out;
}

const sum = (arr, field = "value") => arr.reduce((a, x) => a + x[field], 0);

function pctChange(curr, prev, compareLabel) {
  if (prev <= 0) return curr > 0 ? `+100% so với ${compareLabel}` : `0% so với ${compareLabel}`;
  const pct = Math.round(((curr - prev) / prev) * 100);
  return `${pct >= 0 ? "+" : ""}${pct}% so với ${compareLabel}`;
}

/**
 * GET /api/dashboard/overview?range={days} — toàn bộ số liệu Dashboard
 * phụ thuộc khoảng thời gian (xem ghi chú phía trên). `days` có thể là số
 * (1/7/15/30) hoặc chuỗi "all" (Tất cả — không lọc theo thời gian).
 */
export async function fetchDashboardByRange(days) {
  if (!USE_MOCK) return apiFetch("/dashboard/overview", { params: { range: days } });
  await mockDelay(350);

  // "Tất cả": dùng thẳng số liệu toàn thời gian có sẵn trong mockData
  // (khớp với thẻ "Tổng lead"), không có "kỳ trước" nào để so sánh % nên
  // không hiển thị mũi tên tăng/giảm — chỉ hiện dòng chú thích trung tính.
  if (days === "all") {
    const currentTotal = funnel[0].value;
    const funnelAll = funnel.map((f) => ({ name: f.name, fill: f.fill, value: f.value, pct: f.pct }));
    const registeredTotal = funnelAll[funnelAll.length - 1].value;
    const depositedTotal = funnelAll[funnelAll.length - 2].value; // "Đã đặt cọc" — áp chót trong phễu
    const hotTotal = classification.find((c) => c.name === "Nóng").value;

    // Biểu đồ "Lead theo ngày" chưa có lịch sử đầy đủ trong mock — hiển thị
    // xu hướng 30 ngày gần nhất nhưng CO GIÃN lại để tổng khớp đúng với
    // Tổng lead toàn thời gian (currentTotal), tránh lệch số với các khối khác.
    const rawSeries = buildDailySeries(30);
    const rawTotal = sum(rawSeries) || 1;
    const scale = currentTotal / rawTotal;
    const leadsByDayAll = rawSeries.map((d) => ({ day: d.day, value: Math.max(0, Math.round(d.value * scale)) }));

    return clone({
      leadsByDay: leadsByDayAll,
      classification: classification.map((c) => ({ ...c })),
      sources: sources.map((s) => ({ ...s })),
      funnel: funnelAll,
      statsRange: [
        { key: "new", label: "Lead mới", value: currentTotal, sub: "Tất cả thời gian", icon: "UserPlus", tint: "bg-emerald-500" },
        { key: "hot", label: "Lead nóng", value: hotTotal, sub: "Tất cả thời gian", icon: "Flame", tint: "bg-orange-500" },
        { key: "deposited", label: "Đã đặt cọc", value: depositedTotal, sub: "Tất cả thời gian", icon: "Wallet", tint: "bg-sky-500" },
        { key: "registered", label: "Đã đăng ký", value: registeredTotal, sub: "Tất cả thời gian", icon: "BadgeCheck", tint: "bg-violet-600" },
      ],
    });
  }

  const currentSeries = buildDailySeries(days);
  const currentTotal = sum(currentSeries);

  const prevEnd = new Date();
  prevEnd.setDate(prevEnd.getDate() - days);
  const prevTotal = sum(buildDailySeries(days, prevEnd));

  // Tỉ lệ Nóng/Ấm/Lạnh lấy từ baseline mockData (36:128:84) để phân bổ lại
  // theo tổng lead mới trong kỳ đã chọn.
  const classTotal = sum(classification);
  const classForRange = classification.map((c) => ({
    ...c,
    value: Math.round((currentTotal * c.value) / classTotal),
  }));
  const hotRatio = classification.find((c) => c.name === "Nóng").value / classTotal;
  const hotPrevTotal = Math.round(prevTotal * hotRatio);

  // Tỉ lệ nguồn lấy từ baseline mockData (Facebook/TikTok/Landing Page/Google Form).
  const sourceTotal = sum(sources);
  const sourcesForRange = sources.map((s) => ({
    ...s,
    value: Math.round((currentTotal * s.value) / sourceTotal),
  }));

  // Phễu: giữ nguyên tỉ lệ chuyển đổi giữa các bậc so với bậc đầu ("Lead
  // mới" = tổng lead trong kỳ, luôn khớp với thẻ KPI "Lead mới" + tổng
  // "Lead theo ngày").
  const funnelForRange = funnel.map((f) => {
    const ratio = f.value / funnel[0].value;
    return { name: f.name, fill: f.fill, value: Math.round(currentTotal * ratio), pct: `${Math.round(ratio * 100)}%` };
  });
  const registeredTotal = funnelForRange[funnelForRange.length - 1].value;
  const registeredRatio = funnel[funnel.length - 1].value / funnel[0].value;
  const registeredPrevTotal = Math.round(prevTotal * registeredRatio);

  // "Đã đặt cọc" — bậc áp chót trong phễu, cùng cơ chế tính với "Đã đăng ký".
  const depositedTotal = funnelForRange[funnelForRange.length - 2].value;
  const depositedRatio = funnel[funnel.length - 2].value / funnel[0].value;
  const depositedPrevTotal = Math.round(prevTotal * depositedRatio);

  const compareLabel = days === 1 ? "hôm qua" : `${days} ngày trước`;

  return clone({
    leadsByDay: currentSeries,
    classification: classForRange,
    sources: sourcesForRange,
    funnel: funnelForRange,
    statsRange: [
      { key: "new", label: "Lead mới", value: currentTotal, sub: pctChange(currentTotal, prevTotal, compareLabel), icon: "UserPlus", tint: "bg-emerald-500" },
      { key: "hot", label: "Lead nóng", value: classForRange.find((c) => c.name === "Nóng").value, sub: pctChange(classForRange.find((c) => c.name === "Nóng").value, hotPrevTotal, compareLabel), icon: "Flame", tint: "bg-orange-500" },
      { key: "deposited", label: "Đã đặt cọc", value: depositedTotal, sub: pctChange(depositedTotal, depositedPrevTotal, compareLabel), icon: "Wallet", tint: "bg-sky-500" },
      { key: "registered", label: "Đã đăng ký", value: registeredTotal, sub: pctChange(registeredTotal, registeredPrevTotal, compareLabel), icon: "BadgeCheck", tint: "bg-violet-600" },
    ],
  });
}

/** GET /api/dashboard/hot-leads — danh sách lead cần ưu tiên xử lý ngay */
export async function fetchHotLeads(limit = 5) {
  if (!USE_MOCK) return apiFetch("/dashboard/hot-leads", { params: { limit } });
  await mockDelay(300);
  const rows = [...mockLeads]
    .filter((l) => priorityTier(l.score) !== "cool")
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  return clone(rows);
}

/** Lead chưa có Sales phụ trách (assignee null/undefined/rỗng) — điểm cao nhất trước. */
export async function fetchUnassignedLeads(limit = 5) {
  if (!USE_MOCK) return apiFetch("/dashboard/unassigned-leads", { params: { limit } });
  await mockDelay(300);
  const rows = [...mockLeads]
    .filter((l) => !l.assignee)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  return clone(rows);
}

/**
 * Lead đến hạn/quá hạn follow-up (Mục V.2 + IX: `next_follow_up_at`).
 * "Đến hạn" = nextFollowUpAt đã được đặt VÀ <= thời điểm hiện tại — lead có
 * lịch hẹn trong tương lai (chưa tới hạn) KHÔNG hiển thị ở đây. Quá hạn lâu
 * nhất lên đầu (khớp KPI "Số follow-up quá hạn" ở Mục XII.2 kế hoạch).
 */
export async function fetchFollowUpLeads(limit = 5) {
  if (!USE_MOCK) return apiFetch("/dashboard/followup-leads", { params: { limit } });
  await mockDelay(300);
  const now = new Date();
  const rows = [...mockLeads]
    .filter((l) => l.nextFollowUpAt && new Date(l.nextFollowUpAt) <= now)
    .sort((a, b) => new Date(a.nextFollowUpAt) - new Date(b.nextFollowUpAt))
    .slice(0, limit);
  return clone(rows);
}

/** Xu hướng chuyển đổi theo tháng (Lead vs Đã đăng ký) — dùng cho trang Reports. */
export async function fetchConversionTrend() {
  if (!USE_MOCK) return apiFetch("/dashboard/conversion-trend");
  await mockDelay(300);
  return [
    { period: "T1", lead: 120, converted: 8 },
    { period: "T2", lead: 150, converted: 12 },
    { period: "T3", lead: 180, converted: 16 },
    { period: "T4", lead: 210, converted: 20 },
    { period: "T5", lead: 248, converted: 28 },
  ];
}

/** GET /api/dashboard/follow-ups — follow-up quá hạn / sắp đến hạn */
export async function fetchFollowUps() {
  if (!USE_MOCK) return apiFetch("/dashboard/follow-ups");
  await mockDelay(300);
  return []; // Chưa có dữ liệu next_follow_up_at trong mock — Back-end bổ sung khi có bảng leads thật
}