/* DASHBOARD SERVICE — khớp Mục X.5 (Dashboard) trong kế hoạch. */

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
import { fetchLeads } from "./leadService.js";
import { priorityTier, classify, parseVnDate, largestScoreSwing } from "../utils/leadScoring.js";
import { getVietnamDateKey, vietnamDateToDate } from "../utils/datetime.js";
import { withStagePct } from "../utils/funnel.js";

function clone(obj) {
  return typeof structuredClone === "function" ? structuredClone(obj) : JSON.parse(JSON.stringify(obj));
}

// Lead "Không hợp lệ" (spam/fake, tổng điểm 0) không được vào danh sách ưu
// tiên (Mục VII.4). fetchHotLeads tự loại trừ; 3 hàm còn lại cần lọc thêm.
const isValidLead = (l) => classify(l.score, l) !== "Không hợp lệ";

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

// Dropdown khoảng thời gian dùng chung ở Dashboard.jsx. Áp dụng cho "Lead
// theo ngày", "Nguồn lead", "Phễu chuyển đổi", "Phân loại lead" và 3 thẻ KPI
// (Lead mới/Lead nóng/Đã đăng ký). Không áp dụng cho "Tổng lead" và "Lead
// cần xử lý ngay" (không phụ thuộc thời gian).
export const DASHBOARD_RANGE_OPTIONS = [
  { value: 1, label: "1 ngày qua" },
  { value: 7, label: "7 ngày qua" },
  { value: 15, label: "15 ngày qua" },
  { value: 30, label: "30 ngày qua" },
  { value: "all", label: "Tất cả" },
];

// Bộ lọc khóa học/trạng thái cho biểu đồ "Lead theo ngày", rút từ dữ liệu
// lead hiện có để mỗi lựa chọn luôn có dữ liệu.
export const DASHBOARD_COURSE_OPTIONS = [...new Set(mockLeads.map((l) => l.course).filter(Boolean))].sort();
export const DASHBOARD_STATUS_OPTIONS = leadStatusOrder;

// Tỉ lệ lead khớp bộ lọc khóa học/trạng thái (0..1). Không lọc thì trả 1.
function filterShare({ course, status } = {}) {
  if (!course && !status) return 1;
  const total = mockLeads.length || 1;
  const matched = mockLeads.filter(
    (l) => (!course || l.course === course) && (!status || l.status === status)
  ).length;
  return matched / total;
}

/** GET /api/dashboard/leads-by-day?range={days}&course=&status= */
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
  return getVietnamDateKey(d);
}

function formatDayLabel(d) {
  const [, month, day] = dateKey(d).split("-");
  return `${day}/${month}`;
}

// Số lead mới/ngày dao động quanh mốc ~8 (biên độ ±5), ổn định theo ngày.
function buildDailySeries(days, endDate = new Date()) {
  const out = [];
  const vietnamEndDate = vietnamDateToDate(getVietnamDateKey(endDate));
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(vietnamEndDate);
    d.setUTCDate(d.getUTCDate() - i);
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

/** GET /api/dashboard/overview?range={days} — days là số (1/7/15/30) hoặc "all" */
export async function fetchDashboardByRange(days) {
  if (!USE_MOCK) throw new ApiError('Backend chưa hỗ trợ tham số "range" cho dashboard.', { status: 501 });
  await mockDelay(350);

  // "Tất cả": dùng số liệu toàn thời gian có sẵn, không có kỳ trước để so
  // sánh % nên không hiện mũi tên tăng/giảm.
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

    // Biểu đồ 30 ngày gần nhất, co giãn để tổng khớp currentTotal.
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

  // Tỉ lệ Nóng/Ấm/Lạnh và nguồn lấy từ baseline mockData, phân bổ lại theo
  // tổng lead mới trong kỳ đã chọn.
  const classTotal = sum(classification);
  const classForRange = classification.map((c) => ({
    ...c,
    value: Math.round((currentTotal * c.value) / classTotal),
  }));
  const hotRatio = classification.find((c) => c.name === "Nóng").value / classTotal;
  const hotPrevTotal = Math.round(prevTotal * hotRatio);

  const sourceTotal = sum(sources);
  const sourcesForRange = sources.map((s) => ({
    ...s,
    value: Math.round((currentTotal * s.value) / sourceTotal),
  }));

  // Phễu: value mỗi bậc scale theo tỉ lệ so với bậc đầu; pct tính lại theo
  // bậc liền trước (Mục XII.3, xem utils/funnel.js), không theo tổng ban đầu.
  const funnelForRange = withStagePct(
    funnel.map((f) => {
      const ratio = f.value / funnel[0].value;
      return { name: f.name, fill: f.fill, value: Math.round(currentTotal * ratio) };
    })
  );
  const registeredTotal = funnelForRange[funnelForRange.length - 1].value;
  const registeredRatio = funnel[funnel.length - 1].value / funnel[0].value;
  const registeredPrevTotal = Math.round(prevTotal * registeredRatio);

  const depositedTotal = funnelForRange[funnelForRange.length - 2].value;
  const depositedRatio = funnel[funnel.length - 2].value / funnel[0].value;
  const depositedPrevTotal = Math.round(prevTotal * depositedRatio);

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

/** TopLeadResponse (backend) -> field UI đang dùng ở HotLeadsPanel */
function mapTopLeadToUi(l) {
  return { id: l.leadId, name: l.fullName, initials: toInitials(l.fullName), score: l.totalScore, assignee: l.ownerName || undefined, course: "" };
}

/**
 * GET /dashboard/top-leads — "Lead nóng chưa liên hệ" (Mục XI.2). Backend
 * chỉ trả top N theo điểm, không lọc "chưa liên hệ", nên lấy dư (100) rồi
 * tự lọc leadStage="NEW" ở Front-end trước khi cắt còn đúng `limit`.
 */
export async function fetchHotLeads(limit = 5) {
  if (!USE_MOCK) {
    const rows = await apiFetch("/dashboard/top-leads", { params: { limit: 100 } });
    return rows
      .filter((l) => l.leadStage === "NEW")
      .slice(0, limit)
      .map(mapTopLeadToUi);
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
  // fetchLeads() trả về object phân trang { items, total,... }, không phải
  // mảng — phải lấy đúng `items` rồi mới .filter(), nếu không sẽ lỗi
  // "allLeads.filter is not a function".
  const { items: allLeads } = await fetchLeads({ pageSize: 1000, page: 1 });
  const rows = allLeads
    .filter((l) => !l.assignee && isValidLead(l))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  return clone(rows);
}

/** Backend chưa có endpoint followup-leads */
export async function fetchFollowUpLeads(limit = 5) {
  if (!USE_MOCK) throw new ApiError('Backend chưa có API "followup-leads".', { status: 501 });
  const { items: allLeads } = await fetchLeads({ pageSize: 1000, page: 1 });
  const now = new Date();
  const rows = allLeads
    .filter((l) => l.nextFollowUpAt && new Date(l.nextFollowUpAt) <= now && isValidLead(l))
    .sort((a, b) => new Date(a.nextFollowUpAt) - new Date(b.nextFollowUpAt))
    .slice(0, limit);
  return clone(rows);
}

/**
 * "Lead thay đổi điểm mạnh trong ngày" (Mục XI.2, mục thứ 4). Backend chưa
 * có endpoint lead_score_events nên không thể xác định chính xác lead nào
 * thay đổi điểm hôm nay — báo lỗi rõ thay vì hiển thị số liệu suy diễn sai.
 */
export async function fetchChangedTodayLeads(limit = 5) {
  if (!USE_MOCK) {
    throw new ApiError(
      'Backend chưa có API lịch sử thay đổi điểm ("lead_score_events" theo Mục IX kế hoạch gốc) nên chưa thể xác định lead nào thay đổi điểm mạnh trong ngày. Cần trao đổi với TTS2.',
      { status: 501, code: "NOT_IMPLEMENTED_BY_BACKEND" }
    );
  }
  await mockDelay(300);

  // Dữ liệu demo có ngày cố định, nên lấy ngày gần nhất có lead được tính
  // điểm làm mốc "hôm nay", rồi xếp theo biến động điểm lớn nhất.
  const withDate = mockLeads
    .map((l) => ({ lead: l, refDate: parseVnDate(l.scoreUpdatedAt || l.date) }))
    .filter((x) => x.refDate);
  if (withDate.length === 0) return [];

  const latestDayKey = withDate
    .reduce((max, x) => (x.refDate > max ? x.refDate : max), withDate[0].refDate)
    .toDateString();

  const rows = withDate
    .filter((x) => x.refDate.toDateString() === latestDayKey && isValidLead(x.lead))
    .map((x) => ({ ...x.lead, swing: largestScoreSwing(x.lead) }))
    .filter((l) => l.swing !== 0)
    .sort((a, b) => Math.abs(b.swing) - Math.abs(a.swing))
    .slice(0, limit);
  return clone(rows);
}

/**
 * "Lead cần xử lý ngay" — gộp 4 mục trong Danh sách hành động (Mục XI.2)
 * theo thứ tự ưu tiên: Lead nóng chưa liên hệ → Follow-up quá hạn → Lead
 * mới chưa phân công → Lead thay đổi điểm mạnh. Một lead có thể thuộc
 * nhiều nhóm — chỉ giữ 1 dòng, gắn lý do ưu tiên cao nhất (urgentReason).
 */
export async function fetchUrgentLeads(limit = 5) {
  if (!USE_MOCK) {
    throw new ApiError(
      'Backend chưa có đủ API cần thiết (unassigned-leads, followup-leads, lead-score-events) để gộp "Lead cần xử lý ngay". Cần trao đổi với TTS2.',
      { status: 501, code: "NOT_IMPLEMENTED_BY_BACKEND" }
    );
  }
  await mockDelay(300);

  // Lấy dư từ mỗi nguồn để sau khi khử trùng lặp vẫn đủ lấp đầy `limit`.
  const POOL = Math.max(limit * 4, 20);
  const buckets = [
    { rows: await fetchHotLeads(POOL), reason: "hot" },
    { rows: await fetchFollowUpLeads(POOL), reason: "followup" },
    { rows: await fetchUnassignedLeads(POOL), reason: "unassigned" },
    { rows: await fetchChangedTodayLeads(POOL), reason: "changed" },
  ];

  const seen = new Set();
  const merged = [];
  for (const { rows, reason } of buckets) {
    if (merged.length >= limit) break;
    for (const l of rows) {
      if (merged.length >= limit) break;
      if (seen.has(l.id)) continue;
      seen.add(l.id);
      merged.push({ ...l, urgentReason: reason });
    }
  }
  return merged;
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
  return []; // Chưa có dữ liệu next_follow_up_at trong mock
}