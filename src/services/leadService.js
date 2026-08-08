/* ============================================================
   LEAD SERVICE — khớp danh sách endpoint "2. Leads / 3. Lead activities
   / 4. Lead Scoring" ở Mục X (THIẾT KẾ REST API) của kế hoạch triển khai.

   Mọi page (Leads.jsx, LeadDetail.jsx, Dashboard.jsx...) PHẢI gọi qua
   các hàm ở đây, KHÔNG import trực tiếp từ data/mockData.js nữa.
   Khi Back-end sẵn sàng: đặt VITE_USE_MOCK=false trong .env, các hàm
   dưới sẽ tự chuyển sang gọi apiFetch() thật — không cần sửa UI.
   ============================================================ */

import { apiFetch, USE_MOCK, mockDelay, ApiError } from "./apiClient.js";
import { leads as mockLeads, careHistory as mockCareHistory } from "../data/mockData.js";
import { scoreLead, classify, getScoreBreakdown, scoringGroups, deductionGroup } from "../utils/leadScoring.js";
import { normalizePhone, normalizeEmail } from "../utils/validators.js";

// So khớp id nới lỏng: id trong mockData là number, nhưng id lấy từ URL
// (useParams của React Router) luôn là string — "8" phải khớp với 8.
function matchId(a, b) {
  return String(a) === String(b);
}

// Ánh xạ lựa chọn "Thời gian dự kiến đăng ký" -> mã tín hiệu enrollmentIntent (Nhóm B)
export const enrollmentIntentMap = {
  "Trong 7 ngày": "7d",
  "Trong 30 ngày": "30d",
  "1–3 tháng": "1-3m",
  "Chưa có nhu cầu trong 6 tháng": "6m+",
};

function toInitials(name) {
  return String(name || "")
    .trim()
    .split(" ")
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

/**
 * GET /api/leads — danh sách lead có tìm kiếm/lọc/sắp xếp/phân trang.
 * params: { query, status, cls, sortKey, sortDir, page, pageSize }
 * Trả về { items, total, page, pageSize } giống chuẩn phân trang REST phổ biến.
 */
export async function fetchLeads(params = {}) {
  if (!USE_MOCK) {
    return apiFetch("/leads", { params });
  }

  await mockDelay();
  const { query = "", status = "Tất cả", cls = "Tất cả", sortKey, sortDir, page = 1, pageSize = 6 } = params;

  let rows = mockLeads.filter((l) => {
    const q = query.toLowerCase();
    const matchQ =
      !q ||
      l.name.toLowerCase().includes(q) ||
      l.course.toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q);
    const matchS = status === "Tất cả" || l.status === status;
    const matchC = cls === "Tất cả" || l.cls === cls;
    return matchQ && matchS && matchC;
  });

  if (sortKey && sortDir) {
    const dir = sortDir === "asc" ? 1 : -1;
    rows = [...rows].sort((a, b) => {
      const va = getSortValue(a, sortKey);
      const vb = getSortValue(b, sortKey);
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va ?? "").localeCompare(String(vb ?? ""), "vi", { sensitivity: "base" }) * dir;
    });
  }

  const total = rows.length;
  const start = (page - 1) * pageSize;
  const items = rows.slice(start, start + pageSize);
  return { items: clone(items), total, page, pageSize };
}

function getSortValue(l, key) {
  if (key === "date") {
    const [datePart, timePart = "00:00"] = String(l.date || "").split(" ");
    const [d, m, y] = datePart.split("/").map(Number);
    const [hh, mm] = timePart.split(":").map(Number);
    return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0).getTime();
  }
  return l[key];
}

/**
 * Nhập lead hàng loạt từ CSV (Module 2: Import CSV) — nhận mảng lead đã
 * được utils/importCsv.js parse & tính điểm sẵn, lưu vào "database" mock.
 * Khi có Back-end thật, đổi sang POST /api/leads/import (multipart hoặc JSON array).
 */
export async function importLeads(parsedLeads) {
  if (!USE_MOCK) return apiFetch("/leads/import", { method: "POST", body: { leads: parsedLeads } });
  await mockDelay(300);
  const toInsert = [...parsedLeads].reverse();
  toInsert.forEach((l) => mockLeads.unshift(l));
  return { imported: parsedLeads.length };
}

/** GET /api/leads/{id} */
export async function fetchLeadById(id) {
  if (!USE_MOCK) return apiFetch(`/leads/${id}`);
  await mockDelay();
  const lead = mockLeads.find((l) => matchId(l.id, id));
  if (!lead) throw new ApiError("Không tìm thấy lead.", { status: 404 });
  return clone(lead);
}

/**
 * Kiểm tra lead trùng theo số điện thoại (chuẩn hóa) hoặc email (chữ thường)
 * — khớp Module 3 (Kiểm tra và xử lý lead trùng), quy tắc phát hiện trùng
 * ưu tiên số điện thoại/email đã chuẩn hóa (Mục V.1, Mục IX.2).
 * Dùng ở Register.jsx (Landing Page form) trước khi tạo lead mới.
 */
export async function findDuplicateLead({ phone, email }) {
  if (!USE_MOCK) return apiFetch("/leads/check-duplicate", { params: { phone, email } });
  await mockDelay(200);
  const phoneNorm = normalizePhone(phone);
  const emailNorm = normalizeEmail(email);
  const found = mockLeads.find((l) => {
    const samePhone = phoneNorm && normalizePhone(l.phone) === phoneNorm;
    const sameEmail = emailNorm && normalizeEmail(l.email) === emailNorm;
    return samePhone || sameEmail;
  });
  if (!found) return null;
  return {
    lead: clone(found),
    samePhone: !!(phoneNorm && normalizePhone(found.phone) === phoneNorm),
    sameEmail: !!(emailNorm && normalizeEmail(found.email) === emailNorm),
  };
}

/**
 * POST /api/leads — tạo lead mới.
 * payload: { name, course, source, phone, email, school?, currentLevel?, studyGoal?,
 *            expectedEnrollment?, city?, preferredContactTime?, note? }
 * Validate tối thiểu phía UI trước khi gọi (xem utils/validators.js); ở đây service
 * vẫn tự kiểm tra lại field bắt buộc để phòng trường hợp gọi trực tiếp.
 */
export async function createLead(payload) {
  if (!USE_MOCK) return apiFetch("/leads", { method: "POST", body: payload });

  await mockDelay();
  if (!payload.name?.trim() || !payload.course?.trim() || !payload.source?.trim()) {
    throw new ApiError("Thiếu thông tin bắt buộc.", {
      status: 400,
      fieldErrors: {
        name: !payload.name?.trim() ? "Vui lòng nhập họ và tên." : undefined,
        course: !payload.course?.trim() ? "Vui lòng chọn khóa học quan tâm." : undefined,
        source: !payload.source?.trim() ? "Vui lòng chọn nguồn tiếp cận." : undefined,
      },
    });
  }
  if (!payload.phone?.trim() && !payload.email?.trim()) {
    throw new ApiError("Cần ít nhất một trong hai: Số điện thoại hoặc Email.", {
      status: 400,
      fieldErrors: { contact: "Cần ít nhất một trong hai: Số điện thoại hoặc Email." },
    });
  }

  const newLead = {
    id: Date.now(),
    name: payload.name.trim(),
    course: payload.course,
    source: payload.source,
    status: "Lead mới",
    date: new Date().toLocaleDateString("vi-VN"),
    phone: payload.phone?.trim() || "—",
    email: payload.email?.trim() || "—",
    assignee: payload.assignee || "Tư vấn viên A",
    school: payload.school?.trim() || undefined,
    currentLevel: payload.currentLevel || undefined,
    studyGoal: payload.studyGoal?.trim() || undefined,
    expectedEnrollment: payload.expectedEnrollment || undefined,
    city: payload.city?.trim() || undefined,
    preferredContactTime: payload.preferredContactTime || undefined,
    note: payload.note?.trim() || undefined,
    initials: toInitials(payload.name),
    signals: {
      fitCourseDefined: true,
      fitCareerGoal: !!payload.studyGoal?.trim(),
      hasFullContact: !!(payload.phone?.trim() && payload.email?.trim()),
      enrollmentIntent: enrollmentIntentMap[payload.expectedEnrollment] || "unknown",
    },
  };
  newLead.score = scoreLead(newLead);
  newLead.cls = classify(newLead.score, newLead);

  mockLeads.unshift(newLead);
  return clone(newLead);
}

/** PUT /api/leads/{id} — cập nhật thông tin lead */
export async function updateLead(id, payload) {
  if (!USE_MOCK) return apiFetch(`/leads/${id}`, { method: "PUT", body: payload });
  await mockDelay();
  const idx = mockLeads.findIndex((l) => matchId(l.id, id));
  if (idx === -1) throw new ApiError("Không tìm thấy lead.", { status: 404 });
  mockLeads[idx] = { ...mockLeads[idx], ...payload };
  mockLeads[idx].score = scoreLead(mockLeads[idx]);
  mockLeads[idx].cls = classify(mockLeads[idx].score, mockLeads[idx]);
  return clone(mockLeads[idx]);
}

/** PATCH /api/leads/{id}/status — theo Mục V.4: cần lưu trạng thái cũ/mới + lý do */
export async function updateLeadStatus(id, { newStatus, reason, note } = {}) {
  if (!USE_MOCK) return apiFetch(`/leads/${id}/status`, { method: "PATCH", body: { newStatus, reason, note } });
  await mockDelay();
  const idx = mockLeads.findIndex((l) => matchId(l.id, id));
  if (idx === -1) throw new ApiError("Không tìm thấy lead.", { status: 404 });
  const oldStatus = mockLeads[idx].status;
  mockLeads[idx].status = newStatus;
  appendActivity(id, {
    text: `Chuyển trạng thái từ "${oldStatus}" sang "${newStatus}"`,
    channel: note || reason || "Hệ thống",
    date: new Date().toLocaleString("vi-VN"),
  });
  return clone(mockLeads[idx]);
}

/** PATCH /api/leads/{id}/assignment — phân công / chuyển người phụ trách */
export async function assignLead(id, { assignee, reason } = {}) {
  if (!USE_MOCK) return apiFetch(`/leads/${id}/assignment`, { method: "PATCH", body: { assignee, reason } });
  await mockDelay();
  const idx = mockLeads.findIndex((l) => matchId(l.id, id));
  if (idx === -1) throw new ApiError("Không tìm thấy lead.", { status: 404 });
  const oldAssignee = mockLeads[idx].assignee;
  mockLeads[idx].assignee = assignee;
  appendActivity(id, {
    text: `Chuyển phụ trách từ "${oldAssignee || "Chưa phân công"}" sang "${assignee}"`,
    channel: reason || "Leader Marketing",
    date: new Date().toLocaleString("vi-VN"),
  });
  return clone(mockLeads[idx]);
}

/** POST /api/leads/{id}/archive — lưu trữ lead (không xóa cứng, theo Mục IX.2) */
export async function archiveLead(id) {
  if (!USE_MOCK) return apiFetch(`/leads/${id}/archive`, { method: "POST" });
  await mockDelay();
  const idx = mockLeads.findIndex((l) => matchId(l.id, id));
  if (idx === -1) throw new ApiError("Không tìm thấy lead.", { status: 404 });
  mockLeads[idx].archived = true;
  return clone(mockLeads[idx]);
}

/** Xóa lead — chỉ dùng cho demo/dữ liệu thử nghiệm nội bộ. MVP không cho phép xóa cứng thật. */
export async function deleteLead(id) {
  if (!USE_MOCK) return apiFetch(`/leads/${id}`, { method: "DELETE" });
  await mockDelay();
  const idx = mockLeads.findIndex((l) => matchId(l.id, id));
  if (idx === -1) throw new ApiError("Không tìm thấy lead.", { status: 404 });
  const [removed] = mockLeads.splice(idx, 1);
  return clone(removed);
}

/**
 * Lấy toàn bộ lịch sử chăm sóc của tất cả lead (dùng cho trang History.jsx).
 * Kế hoạch không định nghĩa endpoint aggregate riêng, nhưng có thể suy ra
 * từ GET /api/leads/{id}/activities lặp qua danh sách lead — ở đây mock gộp
 * sẵn để tránh N lần gọi API không cần thiết phía Front-end.
 */
export async function fetchAllActivities() {
  if (!USE_MOCK) return apiFetch("/lead-activities");
  await mockDelay(350);
  const rows = mockLeads.flatMap((l) =>
    (mockCareHistory[l.id] || []).map((h) => ({ ...h, leadName: l.name, initials: l.initials }))
  );
  rows.sort((a, b) => (a.date < b.date ? 1 : -1));
  return clone(rows);
}

/** GET /api/leads/{id}/activities + POST /api/leads/{id}/activities */
export async function fetchLeadActivities(id) {
  if (!USE_MOCK) return apiFetch(`/leads/${id}/activities`);
  await mockDelay();
  return clone(mockCareHistory[id] || []);
}

export async function addLeadActivity(id, activity) {
  if (!USE_MOCK) return apiFetch(`/leads/${id}/activities`, { method: "POST", body: activity });
  await mockDelay();
  return appendActivity(id, activity);
}

function appendActivity(id, activity) {
  if (!mockCareHistory[id]) mockCareHistory[id] = [];
  const entry = { ...activity, date: activity.date || new Date().toLocaleString("vi-VN") };
  mockCareHistory[id].push(entry);
  return clone(entry);
}

/** GET /api/leads/{id}/score + POST /api/leads/{id}/recalculate-score */
export async function fetchLeadScore(id) {
  if (!USE_MOCK) return apiFetch(`/leads/${id}/score`);
  await mockDelay(150);
  const lead = mockLeads.find((l) => matchId(l.id, id));
  if (!lead) throw new ApiError("Không tìm thấy lead.", { status: 404 });
  return { score: lead.score, cls: lead.cls, breakdown: getScoreBreakdown(lead) };
}

export async function recalculateLeadScore(id) {
  if (!USE_MOCK) return apiFetch(`/leads/${id}/recalculate-score`, { method: "POST" });
  await mockDelay();
  const idx = mockLeads.findIndex((l) => matchId(l.id, id));
  if (idx === -1) throw new ApiError("Không tìm thấy lead.", { status: 404 });
  mockLeads[idx].score = scoreLead(mockLeads[idx]);
  mockLeads[idx].cls = classify(mockLeads[idx].score, mockLeads[idx]);
  return { score: mockLeads[idx].score, cls: mockLeads[idx].cls, breakdown: getScoreBreakdown(mockLeads[idx]) };
}

/** GET /api/scoring-rules — dùng cho ScoreRulesCard */
export async function fetchScoringRules() {
  if (!USE_MOCK) return apiFetch("/scoring-rules");
  await mockDelay(150);
  return clone({ groups: scoringGroups, deductionGroup });
}

/**
 * GET /api/export/leads.csv — trả về danh sách lead (đầy đủ, không phân trang)
 * để utils/exportCsv.js chuyển thành file CSV phía client.
 * Khi có Back-end thật, có thể đổi sang tải file trực tiếp từ endpoint này
 * (response Content-Type: text/csv) nếu TTS2 làm export phía server.
 */
export async function exportLeadsCsv(params = {}) {
  if (!USE_MOCK) return apiFetch("/export/leads.csv", { params });
  await mockDelay(200);
  const { items } = await fetchLeads({ ...params, page: 1, pageSize: 100000 });
  return items;
}

function clone(obj) {
  return typeof structuredClone === "function" ? structuredClone(obj) : JSON.parse(JSON.stringify(obj));
}