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
