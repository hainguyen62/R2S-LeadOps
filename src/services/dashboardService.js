/* ============================================================
   DASHBOARD SERVICE — khớp Mục X.5 (Dashboard) trong kế hoạch.
   ============================================================ */

import { apiFetch, USE_MOCK, mockDelay, ApiError } from "./apiClient.js";
import {
  stats,
  leadsByDay,
  classification,
  sources,
  funnel,
  leads as mockLeads,
  leadStatusOrder,
} from "../data/mockData.js";
import { priorityTier, classify } from "../utils/leadScoring.js";

function clone(obj) {
  return typeof structuredClone === "function" ? structuredClone(obj) : JSON.parse(JSON.stringify(obj));
}

/** GET /dashboard/counter-lead — không nhận tham số range */
export async function fetchDashboardOverview() {
  if (!USE_MOCK) return apiFetch("/dashboard/counter-lead");
  await mockDelay(400);
  return clone(stats);
}

/** Backend chưa có endpoint leads-by-day */
export async function fetchLeadsByDay() {
  if (!USE_MOCK) throw new ApiError('Backend chưa có API "leads-by-day".', { status: 501 });
  await mockDelay(300);
  return clone(leadsByDay);
}

/** GET /dashboard/lead-status — trả về [{ stage, count }], stage là enum LeadStage */
export async function fetchLeadsByStatus() {
  if (!USE_MOCK) return apiFetch("/dashboard/lead-status");
  await mockDelay(300);
  return leadStatusOrder.map((name) => ({
    name,
    value: mockLeads.filter((l) => l.status === name).length,
  }));
}

/** GET /dashboard/lead-resource — trả về [{ source, count }] */
export async function fetchLeadsBySource() {
  if (!USE_MOCK) return apiFetch("/dashboard/lead-resource");
  await mockDelay(300);
  return clone(sources);
}

/** Backend chưa có endpoint conversion-funnel */
export async function fetchConversionFunnel() {
  if (!USE_MOCK) throw new ApiError('Backend chưa có API "conversion-funnel".', { status: 501 });
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

/* ------------------------------------------------------------------------
 * LỌC "LEAD THEO NGÀY" THEO KHÓA HỌC / TRẠNG THÁI (2 dropdown trên biểu đồ)
 * ------------------------------------------------------------------------
 * - DASHBOARD_COURSE_OPTIONS: rút từ chính dữ liệu lead hiện có (giống cách
 *   fetchLeadFilterOptions của leadService) để mỗi lựa chọn luôn có dữ liệu.
 * - DASHBOARD_STATUS_OPTIONS: dùng đúng luồng trạng thái chính thức
 *   (leadStatusOrder) thay vì hardcode, tránh lệch với các màn hình khác.
 * - fetchLeadsByDayRange: mô phỏng GET /api/dashboard/leads-by-day?range=
 *   {days}&course=&status=. Khi có Back-end thật, chỉ cần thay thân hàm bằng
 *   lệnh gọi API với các tham số trên — chữ ký đã khớp sẵn.
 * ------------------------------------------------------------------------ */
export const DASHBOARD_COURSE_OPTIONS = [...new Set(mockLeads.map((l) => l.course).filter(Boolean))].sort();
export const DASHBOARD_STATUS_OPTIONS = leadStatusOrder;

// Tỉ lệ lead trong mock khớp với bộ lọc khóa học/trạng thái (0..1). Không lọc
// (null/"") thì trả 1 — biểu đồ giữ nguyên toàn bộ dữ liệu.
function filterShare({ course, status } = {}) {
  if (!course && !status) return 1;
  const total = mockLeads.length || 1;
  const matched = mockLeads.filter(
    (l) => (!course || l.course === course) && (!status || l.status === status)
  ).length;
  return matched / total;
}

/**
 * GET /api/dashboard/leads-by-day?range={days}&course=&status= — chuỗi dữ liệu
 * cho biểu đồ "Lead theo ngày", đã lọc theo khóa học / trạng thái từ 2 dropdown
 * trên biểu đồ. Không lọc thì trả về cùng chuỗi cơ sở với fetchDashboardByRange
 * (đã nhân tỉ lệ 1:1) để số liệu lọc/tất cả luôn khớp nhau.
 */
export async function fetchLeadsByDayRange(days, filters = {}) {
  if (!USE_MOCK) throw new ApiError('Backend chưa có API "leads-by-day" (kèm tham số range).', { status: 501 });
  await mockDelay(250);
  const share = filterShare(filters);
  const base = days === "all" ? buildDailySeries(30) : buildDailySeries(days);
  return base.map((d) => ({ day: d.day, value: Math.max(0, Math.round(d.value * share)) }));
}

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
  if (!USE_MOCK) throw new ApiError('Backend chưa hỗ trợ tham số "range" cho dashboard.', { status: 501 });
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
    const statusBreakdownAll = leadStatusOrder.map((name) => ({
      name,
      value: mockLeads.filter((l) => l.status === name).length,
    }));

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
      statusBreakdown: statusBreakdownAll,
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

  // Tỉ lệ trạng thái lấy từ baseline mockData (đếm theo l.status hiện có),
  // phân bổ lại theo tổng lead mới trong kỳ đã chọn — cùng cơ chế với
  // classification/sources phía trên.
  const statusBaseline = leadStatusOrder.map((name) => ({
    name,
    value: mockLeads.filter((l) => l.status === name).length,
  }));
  const statusTotal = sum(statusBaseline) || 1;
  const statusForRange = statusBaseline.map((s) => ({
    ...s,
    value: Math.round((currentTotal * s.value) / statusTotal),
  }));

  const compareLabel = days === 1 ? "hôm qua" : `${days} ngày trước`;

  return clone({
    leadsByDay: currentSeries,
    classification: classForRange,
    sources: sourcesForRange,
    statusBreakdown: statusForRange,
    funnel: funnelForRange,
    statsRange: [
      { key: "new", label: "Lead mới", value: currentTotal, sub: pctChange(currentTotal, prevTotal, compareLabel), icon: "UserPlus", tint: "bg-emerald-500" },
      { key: "hot", label: "Lead nóng", value: classForRange.find((c) => c.name === "Nóng").value, sub: pctChange(classForRange.find((c) => c.name === "Nóng").value, hotPrevTotal, compareLabel), icon: "Flame", tint: "bg-orange-500" },
      { key: "deposited", label: "Đã đặt cọc", value: depositedTotal, sub: pctChange(depositedTotal, depositedPrevTotal, compareLabel), icon: "Wallet", tint: "bg-sky-500" },
      { key: "registered", label: "Đã đăng ký", value: registeredTotal, sub: pctChange(registeredTotal, registeredPrevTotal, compareLabel), icon: "BadgeCheck", tint: "bg-violet-600" },
    ],
  });
}

function toInitials(name) {
  return String(name || "")
    .trim()
    .split(" ")
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

/** TopLeadResponse (backend) -> đúng field UI đang dùng ở HotLeadsPanel (name, initials, score...). */
function mapTopLeadToUi(l) {
  return { id: l.leadId, name: l.fullName, initials: toInitials(l.fullName), score: l.totalScore, assignee: l.ownerName || undefined, course: "" };
}

/** GET /dashboard/top-leads — top lead điểm cao nhất, không lọc theo trạng thái "chưa liên hệ" như bản mock */
export async function fetchHotLeads(limit = 5) {
  if (!USE_MOCK) {
    const rows = await apiFetch("/dashboard/top-leads", { params: { limit } });
    return rows.map(mapTopLeadToUi);
  }
  await mockDelay(300);
  const rows = [...mockLeads]
    .filter((l) => classify(l.score, l) === "Lead nóng" && l.status === "Lead mới")
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  return clone(rows);
}

/** Backend chưa có endpoint unassigned-leads */
export async function fetchUnassignedLeads(limit = 5) {
  if (!USE_MOCK) throw new ApiError('Backend chưa có API "unassigned-leads".', { status: 501 });
  await mockDelay(300);
  const rows = [...mockLeads]
    .filter((l) => !l.assignee)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  return clone(rows);
}

/** Backend chưa có endpoint followup-leads */
export async function fetchFollowUpLeads(limit = 5) {
  if (!USE_MOCK) throw new ApiError('Backend chưa có API "followup-leads".', { status: 501 });
  await mockDelay(300);
  const now = new Date();
  const rows = [...mockLeads]
    .filter((l) => l.nextFollowUpAt && new Date(l.nextFollowUpAt) <= now)
    .sort((a, b) => new Date(a.nextFollowUpAt) - new Date(b.nextFollowUpAt))
    .slice(0, limit);
  return clone(rows);
}

/** Backend chưa có endpoint conversion-trend */
export async function fetchConversionTrend() {
  if (!USE_MOCK) throw new ApiError('Backend chưa có API "conversion-trend".', { status: 501 });
  await mockDelay(300);
  return [
    { period: "T1", lead: 120, converted: 8 },
    { period: "T2", lead: 150, converted: 12 },
    { period: "T3", lead: 180, converted: 16 },
    { period: "T4", lead: 210, converted: 20 },
    { period: "T5", lead: 248, converted: 28 },
  ];
}

/** Backend chưa có endpoint follow-ups */
export async function fetchFollowUps() {
  if (!USE_MOCK) throw new ApiError('Backend chưa có API "follow-ups".', { status: 501 });
  await mockDelay(300);
  return []; // Chưa có dữ liệu next_follow_up_at trong mock — Back-end bổ sung khi có bảng leads thật
}