/* ============================================================
   LEAD SERVICE — khớp danh sách endpoint "2. Leads / 3. Lead activities
   / 4. Lead Scoring" ở Mục X (THIẾT KẾ REST API) của kế hoạch triển khai.

   Mọi page (Leads.jsx, LeadDetail.jsx, Dashboard.jsx...) PHẢI gọi qua
   các hàm ở đây, KHÔNG import trực tiếp từ data/mockData.js nữa.
   Khi Back-end sẵn sàng: đặt VITE_USE_MOCK=false trong .env, các hàm
   dưới sẽ tự chuyển sang gọi apiFetch() thật — không cần sửa UI.
   ============================================================ */

import { apiFetch, USE_MOCK, mockDelay, ApiError, toBackendPaging, unwrapPage } from "./apiClient.js";
import { leads as mockLeads, careHistory as mockCareHistory } from "../data/mockData.js";
import { scoreLead, classify, getScoreBreakdown, getScoreHistory, scoringGroups, deductionGroup } from "../utils/leadScoring.js";
import { normalizePhone, normalizeEmail } from "../utils/validators.js";
import { formatVietnamDate, formatVietnamDateTime } from "../utils/datetime.js";

/* ---- localStorage để persist custom leads qua refresh (mock mode) ---- */
const CUSTOM_LEADS_KEY = "r2s_custom_leads";

function loadCustomLeads() {
  if (typeof localStorage === "undefined") return [];
  try {
    const stored = localStorage.getItem(CUSTOM_LEADS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCustomLeads(leads) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(CUSTOM_LEADS_KEY, JSON.stringify(leads));
  } catch (e) {
    console.warn("Không thể lưu leads vào localStorage:", e);
  }
}

// Runtime: kết hợp mock leads gốc + custom leads từ localStorage
const runtimeMockLeads = [...mockLeads, ...loadCustomLeads()];

function persistCustomLeads() {
  // Extract custom leads (những lead được tạo thêm, không nằm trong mockLeads gốc)
  const customLeads = runtimeMockLeads.filter(
    (l) => !mockLeads.find((orig) => matchId(orig.id, l.id))
  );
  saveCustomLeads(customLeads);
}
/* ---- Hết localStorage helpers ---- */

/* ------------------------------------------------------------
   Enum thật của backend (theo OpenAPI spec TTS2 gửi) — dùng khi
   USE_MOCK=false, thay cho chuỗi tiếng Việt tự do bên mock.
   ------------------------------------------------------------ */
export const LEAD_SOURCE_ENUM = ["FACEBOOK", "INSTAGRAM", "LANDING_PAGE", "GOOGLE_FORM", "ZALO", "WEBSITE", "REFERRAL", "OTHER"];
export const LEAD_STAGE_ENUM = ["NEW", "NURTURE", "WARM", "HOT", "SALE", "WON", "LOST"];
export const ACTIVITY_TYPE_ENUM = ["CALL", "MESSAGE", "EMAIL", "ZALO", "MEETING", "NOTE", "FOLLOW_UP", "CONSULTATION"];
export const ACTIVITY_RESULT_ENUM = ["CONNECTED", "NO_ANSWER", "INTERESTED", "NOT_INTERESTED", "CALLBACK", "SUCCESS", "FAILED", "OTHER"];

// Nguồn lead: UI hiện chọn theo nhãn tiếng Việt/tên nguồn tự do, backend chỉ
// nhận đúng 8 giá trị enum ở trên. "TikTok" chưa có enum tương ứng — tạm map
// sang OTHER, cần TTS2 xác nhận có bổ sung enum riêng hay không.
const SOURCE_LABEL_TO_ENUM = {
  Facebook: "FACEBOOK",
  TikTok: "OTHER",
  "Landing Page": "LANDING_PAGE",
  "Google Form": "GOOGLE_FORM",
};
function toLeadSourceEnum(label) {
  return SOURCE_LABEL_TO_ENUM[label] || (LEAD_SOURCE_ENUM.includes(label) ? label : "OTHER");
}

/**
 * payload dạng UI hiện tại (name, phone, email, source, studyGoal...)
 * -> đúng field của CreateLeadRequest bên backend. Các field UI có mà backend
 * không có (course, status, assignee, school, city) sẽ không được gửi lên,
 * vì spec hiện tại không có chỗ lưu — cần trao đổi thêm với TTS2 nếu bắt buộc.
 */
function toCreateLeadRequest(payload) {
  return {
    fullName: payload.name?.trim(),
    phone: payload.phone?.trim(),
    // Chuẩn hóa email về chữ thường trước khi gửi backend thật (Mục IX.2) —
    // trước đây chỉ .trim() nên nhánh USE_MOCK=false lưu sai hoa/thường.
    email: payload.email?.trim() ? normalizeEmail(payload.email) : undefined,
    leadSource: payload.source ? toLeadSourceEnum(payload.source) : undefined,
    currentLevel: payload.currentLevel || undefined,
    careerGoal: payload.studyGoal?.trim() || undefined,
    painPoint: payload.note?.trim() || undefined,
    startTimeline: payload.expectedEnrollment || undefined,
    preferredChannel: payload.preferredContactTime || undefined,
  };
}

/** payload UI -> đúng field của UpdateLeadRequest (chỉ các field backend cho sửa). */
function toUpdateLeadRequest(payload) {
  return {
    fullName: payload.name?.trim() || undefined,
    phone: payload.phone?.trim() || undefined,
    email: payload.email?.trim() ? normalizeEmail(payload.email) : undefined,
    currentLevel: payload.currentLevel || undefined,
    careerGoal: payload.studyGoal?.trim() || undefined,
    painPoint: payload.note?.trim() || undefined,
    startTimeline: payload.expectedEnrollment || undefined,
    preferredChannel: payload.preferredContactTime || undefined,
    doNotContact: typeof payload.doNotContact === "boolean" ? payload.doNotContact : undefined,
  };
}

/** Backend chưa có endpoint tương ứng trong spec hiện tại — báo lỗi rõ ràng thay vì gọi sai path. */
function notSupportedByBackend(featureName) {
  throw new ApiError(`Backend chưa có API cho "${featureName}" trong bản spec hiện tại. Cần trao đổi thêm với TTS2.`, {
    status: 501,
    code: "NOT_IMPLEMENTED_BY_BACKEND",
  });
}

const STAGE_TO_STATUS = {
  NEW: "Lead mới",
  NURTURE: "Đã liên hệ",
  WARM: "Đang tư vấn",
  HOT: "Đang cân nhắc",
  SALE: "Đã đặt cọc",
  WON: "Đã đăng ký",
  LOST: "Đã đăng ký", // LOST không có status tương ứng trong leadStatusOrder, tạm gộp — cần TTS2 xác nhận
};
const SOURCE_ENUM_TO_LABEL = {
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  LANDING_PAGE: "Landing Page",
  GOOGLE_FORM: "Google Form",
  ZALO: "Zalo",
  WEBSITE: "Website",
  REFERRAL: "Giới thiệu",
  OTHER: "Khác",
};

function toVnDateTime(iso) {
  if (!iso) return "";
  return formatVietnamDateTime(iso);
}

/** LeadResponse (backend) -> đúng field UI hiện đang dùng (name, status, score, cls...). */
export function mapLeadResponseToUi(lead) {
  if (!lead) return lead;
  const score = lead.totalScore ?? 0;
  return {
    id: lead.id,
    name: lead.fullName,
    course: lead.careerGoal || "",
    source: SOURCE_ENUM_TO_LABEL[lead.leadSource] || lead.leadSource,
    status: STAGE_TO_STATUS[lead.leadStage] || lead.leadStage,
    score,
    cls: classify(score, {}),
    date: toVnDateTime(lead.createdAt),
    phone: lead.phone,
    email: lead.email,
    assignee: lead.ownerName || undefined,
    ownerId: lead.ownerId ?? undefined,
    currentLevel: lead.currentLevel || undefined,
    studyGoal: lead.careerGoal || undefined,
    expectedEnrollment: lead.startTimeline || undefined,
    preferredContactTime: lead.preferredChannel || undefined,
    note: lead.painPoint || undefined,
    initials: toInitials(lead.fullName),
    archived: !!lead.doNotContact,
    nextFollowUpAt: lead.nextActionAt || null,
    scoreUpdatedAt: toVnDateTime(lead.updatedAt),
    signals: {}, // backend không expose breakdown điểm theo từng tiêu chí (nhóm A-E)
  };
}

const STATUS_TO_STAGE = {
  "Lead mới": "NEW",
  "Đã liên hệ": "NURTURE",
  "Đang tư vấn": "WARM",
  "Đang cân nhắc": "HOT",
  "Đã đặt cọc": "SALE",
  "Đã đăng ký": "WON",
};

/** ActivityResponse (backend) -> đúng field UI đang dùng ở History.jsx/LeadDetail.jsx (text, channel, date). */
function mapActivityResponseToUi(a) {
  if (!a) return a;
  return { text: a.content, channel: a.createdByName || "Hệ thống", date: toVnDateTime(a.createdAt) };
}

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

// Lần tương tác gần nhất — mốc hoạt động chăm sóc cuối cùng trong timeline
// (mockCareHistory đã được push theo thứ tự thời gian tăng dần).
function getLastInteractionAt(leadId) {
  const hist = mockCareHistory[leadId];
  if (!hist || hist.length === 0) return null;
  return hist[hist.length - 1].date;
}

/**
 * GET /leads/my — chỉ trả về lead được phân công cho người dùng hiện tại.
 * Dùng cho Sales/Admissions (Mục IV.3: "Xem lead được phân công" — KHÔNG
 * được xem lead ngoài phạm vi phân công). Nhận cùng params như fetchLeads
 * (query/status/sort/page...), ngoại trừ `assignee` — endpoint tự suy ra
 * từ token đăng nhập ở Back-end thật, nên tham số này bị bỏ qua nếu có.
 */
export async function fetchMyLeads(params = {}, currentUserName) {
  if (!USE_MOCK) {
    const { page, pageSize, query, scoreMin, scoreMax } = params;
    const res = await apiFetch("/leads/my", {
      params: {
        search: query || undefined,
        minScore: scoreMin,
        maxScore: scoreMax,
        ...toBackendPaging(page, pageSize),
      },
    });
    const { items, ...rest } = unwrapPage(res);
    return { items: items.map(mapLeadResponseToUi), ...rest };
  }
  return fetchLeads({ ...params, assignee: currentUserName || "__none__" });
}

/**
 * GET /api/leads — danh sách lead có tìm kiếm/lọc/sắp xếp/phân trang.
 * params: { query, status, cls, sortKey, sortDir, page, pageSize,
 *           dateFrom, dateTo, scoreMin, scoreMax, overdueOnly,
 *           course, source, assignee }
 * Trả về { items, total, page, pageSize } giống chuẩn phân trang REST phổ biến.
 * Lead đã lưu trữ (archived=true) không hiển thị trong danh sách (Mục IX.2:
 * không xóa cứng, dùng trạng thái lưu trữ thay cho xóa).
 */
export async function fetchLeads(params = {}) {
  if (!USE_MOCK) {
    const { query, status, page, pageSize, scoreMin, scoreMax, source, ownerId } = params;
    const res = await apiFetch("/leads", {
      params: {
        search: query || undefined,
        stage: status && status !== "Tất cả" ? STATUS_TO_STAGE[status] || status : undefined,
        source: source && source !== "Tất cả" ? toLeadSourceEnum(source) : undefined,
        ownerId: ownerId || undefined, // UI hiện lọc theo tên nhân viên (assignee); cần đổi sang chọn theo ownerId để lọc được ở backend thật
        minScore: scoreMin,
        maxScore: scoreMax,
        ...toBackendPaging(page, pageSize),
      },
    });
    const { items, ...rest } = unwrapPage(res);
    return { items: items.map(mapLeadResponseToUi), ...rest };
  }

  await mockDelay();
  const {
    query = "",
    status = "Tất cả",
    cls = "Tất cả",
    sortKey,
    sortDir,
    page = 1,
    pageSize = 6,
    dateFrom,
    dateTo,
    scoreMin,
    scoreMax,
    overdueOnly,
    course = "Tất cả",
    source = "Tất cả",
    assignee = "Tất cả",
    archivedOnly = false, // true = chỉ lấy lead ĐÃ lưu trữ (trang "Lead lưu trữ")
  } = params;

  const now = Date.now();
  let rows = runtimeMockLeads.filter((l) => {
    // Mặc định (archivedOnly=false): chỉ lấy lead đang hoạt động, ẩn lead đã
    // lưu trữ. Khi archivedOnly=true (trang Lead lưu trữ): đảo ngược lại,
    // chỉ lấy đúng những lead đã lưu trữ.
    if (archivedOnly ? !l.archived : l.archived) return false;

    const q = query.toLowerCase();
    const qDigits = query.replace(/\D/g, "");
    const matchQ =
      !q ||
      l.name.toLowerCase().includes(q) ||
      l.course.toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q) ||
      (qDigits && (l.phone || "").replace(/\D/g, "").includes(qDigits));

    const matchS = status === "Tất cả" || l.status === status;
    const matchC = cls === "Tất cả" || l.cls === cls;

    const leadTime = getSortValue(l, "date");
    const matchDateFrom = !dateFrom || leadTime >= new Date(dateFrom).getTime();
    const matchDateTo = !dateTo || leadTime <= new Date(dateTo).getTime() + 86399999; // hết ngày đến

    const matchScoreMin = scoreMin === undefined || scoreMin === "" || l.score >= Number(scoreMin);
    const matchScoreMax = scoreMax === undefined || scoreMax === "" || l.score <= Number(scoreMax);

    const matchOverdue = !overdueOnly || (l.nextFollowUpAt && new Date(l.nextFollowUpAt).getTime() <= now);

    const matchCourse = course === "Tất cả" || l.course === course;
    const matchSource = source === "Tất cả" || l.source === source;
    const matchAssignee =
      assignee === "Tất cả" || (assignee === "Chưa phân công" ? !l.assignee : l.assignee === assignee);

    return (
      matchQ && matchS && matchC && matchDateFrom && matchDateTo && matchScoreMin && matchScoreMax &&
      matchOverdue && matchCourse && matchSource && matchAssignee
    );
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
  const items = rows.slice(start, start + pageSize).map((l) => ({ ...l, lastInteractionAt: getLastInteractionAt(l.id) }));
  return { items: clone(items), total, page, pageSize };
}

function getSortValue(l, key) {
  if (key === "date") {
    const [datePart, timePart = "00:00"] = String(l.date || "").split(" ");
    const [d, m, y] = datePart.split("/").map(Number);
    const [hh, mm] = timePart.split(":").map(Number);
    return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0).getTime();
  }
  if (key === "nextFollowUpAt") {
    return l.nextFollowUpAt ? new Date(l.nextFollowUpAt).getTime() : null;
  }
  if (key === "lastInteractionAt") {
    const v = getLastInteractionAt(l.id);
    if (!v) return null;
    const [datePart, timePart = "00:00"] = String(v).split(" ");
    const [d, m, y] = datePart.split("/").map(Number);
    const [hh, mm] = timePart.split(":").map(Number);
    return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0).getTime();
  }
  return l[key];
}

/**
 * Danh sách giá trị duy nhất để đổ vào 3 bộ lọc nâng cao (Khóa học, Nguồn,
 * Nhân viên phụ trách) — lấy trên TOÀN BỘ dữ liệu, không chỉ trang hiện tại,
 * để bộ lọc luôn đầy đủ lựa chọn dù đang ở trang nào / đã lọc gì.
 */
export async function fetchLeadFilterOptions() {
  if (!USE_MOCK) return notSupportedByBackend("danh sách giá trị lọc (filter-options)");
  await mockDelay(100);
  const active = runtimeMockLeads.filter((l) => !l.archived);
  const courses = [...new Set(active.map((l) => l.course).filter(Boolean))].sort();
  const sources = [...new Set(active.map((l) => l.source).filter(Boolean))].sort();
  const assignees = [...new Set(active.map((l) => l.assignee).filter(Boolean))].sort();
  const hasUnassigned = active.some((l) => !l.assignee);
  return {
    courses,
    sources,
    assignees: hasUnassigned ? [...assignees, "Chưa phân công"] : assignees,
  };
}

/**
 * Nhập lead hàng loạt từ CSV (Module 2: Import CSV) — nhận mảng lead đã
 * được utils/importCsv.js parse & tính điểm sẵn, lưu vào "database" mock.
 * Khi có Back-end thật, đổi sang POST /api/leads/import (multipart hoặc JSON array).
 */
export async function importLeads(parsedLeads) {
  if (!USE_MOCK) {
    // Đúng endpoint POST /leads/bulk (BulkCreateLeadRequest), tối đa 500 lead/lần.
    const leads = parsedLeads.map(toCreateLeadRequest);
    return apiFetch("/leads/bulk", { method: "POST", body: { leads } });
  }
  await mockDelay(300);
  const toInsert = [...parsedLeads].reverse();
  toInsert.forEach((l) => runtimeMockLeads.unshift(l));
  return { imported: parsedLeads.length };
}

/** GET /api/leads/{id} */
export async function fetchLeadById(id) {
  if (!USE_MOCK) return mapLeadResponseToUi(await apiFetch(`/leads/${id}`));
  await mockDelay();
  const lead = runtimeMockLeads.find((l) => matchId(l.id, id));
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
  if (!USE_MOCK) {
    // Backend không có endpoint kiểm tra trước — trùng lặp chỉ phát hiện khi
    // POST /leads trả về 409 Conflict. Không throw ở đây để form vẫn cho submit,
    // xử lý trùng lặp thật sự nằm ở catch của createLead phía UI.
    return null;
  }
  await mockDelay(200);
  const phoneNorm = normalizePhone(phone);
  const emailNorm = normalizeEmail(email);
  const found = runtimeMockLeads.find((l) => {
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
  if (!USE_MOCK) return mapLeadResponseToUi(await apiFetch("/leads", { method: "POST", body: toCreateLeadRequest(payload) }));

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
  // Số điện thoại & Email: chỉ cần có ít nhất 1 trong 2 (OR) — khớp rule
  // OR mới ở utils/validators.js, tránh mock "backend" chặn ngược lại FE.
  if (!payload.phone?.trim() && !payload.email?.trim()) {
    throw new ApiError("Vui lòng nhập số điện thoại hoặc email.", {
      status: 400,
      fieldErrors: {
        phone: "Vui lòng nhập số điện thoại hoặc email.",
        email: "Vui lòng nhập số điện thoại hoặc email.",
      },
    });
  }

  const newLead = {
    id: Date.now(),
    name: payload.name.trim(),
    course: payload.course,
    source: payload.source,
    status: "Lead mới",
    date: formatVietnamDate(new Date()),
    // Chuẩn hóa số điện thoại & email trước khi lưu — khớp quy tắc dữ liệu
    // Mục IX.2: "Email được chuyển về chữ thường trước khi lưu" / "Số điện
    // thoại được chuẩn hóa". Trước đây chỉ .trim() nên "Test@EXAMPLE.COM"
    // bị lưu nguyên dạng hoa/thường, phá vỡ cơ chế kiểm tra lead trùng
    // (findDuplicateLead) vốn giả định email đã ở dạng chữ thường.
    phone: payload.phone?.trim() ? normalizePhone(payload.phone) : "—",
    email: payload.email?.trim() ? normalizeEmail(payload.email) : "—",
    assignee: payload.assignee || undefined, // rỗng/"Chưa phân công" -> chưa có người phụ trách
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
  newLead.scoreUpdatedAt = newLead.date;

  runtimeMockLeads.unshift(newLead);
  persistCustomLeads(); // lưu custom leads vào localStorage
  return clone(newLead);
}

/** PUT /api/leads/{id} — cập nhật thông tin lead */
export async function updateLead(id, payload) {
  if (!USE_MOCK) return mapLeadResponseToUi(await apiFetch(`/leads/${id}`, { method: "PUT", body: toUpdateLeadRequest(payload) }));
  await mockDelay();
  const idx = runtimeMockLeads.findIndex((l) => matchId(l.id, id));
  if (idx === -1) throw new ApiError("Không tìm thấy lead.", { status: 404 });
  const prevScore = runtimeMockLeads[idx].score;
  // Chuẩn hóa email/SĐT nếu payload có sửa 2 trường này — cùng lý do như
  // createLead ở trên, tránh lưu lẫn lộn hoa/thường khi sửa lead qua form.
  const normalizedPayload = { ...payload };
  if (payload.email !== undefined) normalizedPayload.email = payload.email?.trim() ? normalizeEmail(payload.email) : payload.email;
  if (payload.phone !== undefined) normalizedPayload.phone = payload.phone?.trim() ? normalizePhone(payload.phone) : payload.phone;
  runtimeMockLeads[idx] = { ...runtimeMockLeads[idx], ...normalizedPayload };
  runtimeMockLeads[idx].score = scoreLead(runtimeMockLeads[idx]);
  runtimeMockLeads[idx].cls = classify(runtimeMockLeads[idx].score, runtimeMockLeads[idx]);
  // BUG ĐÃ SỬA: trước đây hàm này tính lại điểm (score/cls) nhưng KHÔNG cập
  // nhật scoreUpdatedAt — nên mọi lần sửa tín hiệu chấm điểm qua form "Sửa
  // lead" đều không được dashboard "Lead thay đổi điểm mạnh trong ngày"
  // (fetchChangedTodayLeads) nhận diện là "vừa thay đổi hôm nay", vì mốc
  // thời gian dùng để lọc vẫn là ngày cũ (có thể là ngày mock cố định).
  // Chỉ cập nhật mốc thời gian khi điểm THỰC SỰ đổi, để tránh việc sửa các
  // trường không liên quan (SĐT, ghi chú...) cũng bị tính là "vừa đổi điểm".
  if (runtimeMockLeads[idx].score !== prevScore) {
    runtimeMockLeads[idx].scoreUpdatedAt = formatVietnamDateTime(new Date());
  }
  persistCustomLeads(); // lưu thay đổi vào localStorage
  return clone(runtimeMockLeads[idx]);
}

/** PATCH /api/leads/{id}/status — theo Mục V.4: cần lưu trạng thái cũ/mới + lý do
 *  actorName: tên người ĐANG đăng nhập thực hiện thao tác (lấy từ useAuth() ở UI) —
 *  dùng để ghi đúng "ai" đổi trạng thái vào lịch sử, thay vì hardcode "Hệ thống". */
export async function updateLeadStatus(id, { newStatus, reason, note, actorName } = {}) {
  if (!USE_MOCK) {
    // UpdateLeadRequest (PUT /leads/{id}) không có field leadStage, và spec không
    // có endpoint PATCH /leads/{id}/status riêng — cần hỏi TTS2 cách đổi giai đoạn lead.
    return notSupportedByBackend("đổi trạng thái/giai đoạn lead (leadStage)");
  }
  await mockDelay();
  const idx = runtimeMockLeads.findIndex((l) => matchId(l.id, id));
  if (idx === -1) throw new ApiError("Không tìm thấy lead.", { status: 404 });
  const oldStatus = runtimeMockLeads[idx].status;
  runtimeMockLeads[idx].status = newStatus;
  const noteText = note || reason;
  appendActivity(id, {
    text: `Chuyển trạng thái từ "${oldStatus}" sang "${newStatus}"${noteText ? ` — ${noteText}` : ""}`,
    channel: actorName || "Hệ thống",
    date: formatVietnamDateTime(new Date()),
  });
  persistCustomLeads(); // lưu thay đổi vào localStorage
  return clone(runtimeMockLeads[idx]);
}

/** PATCH /api/leads/{id}/assignment — phân công / chuyển người phụ trách
 *  actorName: tên người ĐANG thực hiện thao tác (lấy từ useAuth() ở phía UI) — dùng để
 *  ghi đúng "ai" phân công vào lịch sử hoạt động, thay vì hardcode "Leader Marketing". */
export async function assignLead(id, { assignee, ownerId, reason, actorName } = {}) {
  if (!USE_MOCK) {
    // AssignLeadRequest chỉ nhận { ownerId: number } — không có field "reason".
    // "assignee" ở mock đang là TÊN nhân viên; cần đổi UI sang chọn theo id
    // (ví dụ lấy từ settingsService.fetchUsers()) rồi truyền vào ownerId.
    const targetOwnerId = ownerId ?? assignee;
    if (targetOwnerId === undefined || Number.isNaN(Number(targetOwnerId))) {
      throw new ApiError("Cần truyền ownerId (số) để phân công lead, không dùng tên nhân viên.", { status: 400 });
    }
    return mapLeadResponseToUi(await apiFetch(`/leads/${id}/owner`, { method: "PATCH", body: { ownerId: Number(targetOwnerId) } }));
  }
  await mockDelay();
  const idx = runtimeMockLeads.findIndex((l) => matchId(l.id, id));
  if (idx === -1) throw new ApiError("Không tìm thấy lead.", { status: 404 });
  const oldAssignee = runtimeMockLeads[idx].assignee;
  runtimeMockLeads[idx].assignee = assignee;
  appendActivity(id, {
    text: `Chuyển phụ trách từ "${oldAssignee || "Chưa phân công"}" sang "${assignee}"${reason ? ` — Lý do: ${reason}` : ""}`,
    channel: actorName || "Hệ thống",
    date: formatVietnamDateTime(new Date()),
  });
  persistCustomLeads(); // lưu thay đổi vào localStorage
  return clone(runtimeMockLeads[idx]);
}

/** POST /api/leads/{id}/archive — lưu trữ lead (không xóa cứng, theo Mục IX.2) */
export async function archiveLead(id) {
  if (!USE_MOCK) {
    // Spec không có endpoint archive riêng. Field gần nghĩa nhất là
    // doNotContact (UpdateLeadRequest) — không hoàn toàn giống "lưu trữ"
    // (doNotContact nghĩa là "ngừng liên hệ", không phải "ẩn khỏi danh sách"),
    // dùng tạm cho đến khi TTS2 xác nhận cách xử lý đúng.
    return mapLeadResponseToUi(await apiFetch(`/leads/${id}`, { method: "PUT", body: { doNotContact: true } }));
  }
  await mockDelay();
  const idx = runtimeMockLeads.findIndex((l) => matchId(l.id, id));
  if (idx === -1) throw new ApiError("Không tìm thấy lead.", { status: 404 });
  runtimeMockLeads[idx].archived = true;
  persistCustomLeads(); // lưu thay đổi vào localStorage
  return clone(runtimeMockLeads[idx]);
}

/** POST /api/leads/{id}/unarchive — khôi phục lead đã lưu trữ về danh sách hoạt động */
export async function unarchiveLead(id) {
  if (!USE_MOCK) return mapLeadResponseToUi(await apiFetch(`/leads/${id}`, { method: "PUT", body: { doNotContact: false } }));
  await mockDelay();
  const idx = runtimeMockLeads.findIndex((l) => matchId(l.id, id));
  if (idx === -1) throw new ApiError("Không tìm thấy lead.", { status: 404 });
  runtimeMockLeads[idx].archived = false;
  persistCustomLeads(); // lưu thay đổi vào localStorage
  return clone(runtimeMockLeads[idx]);
}

/** Xóa lead — chỉ dùng cho demo/dữ liệu thử nghiệm nội bộ. MVP không cho phép xóa cứng thật. */
export async function deleteLead(id) {
  if (!USE_MOCK) return notSupportedByBackend("xóa lead");
  await mockDelay();
  const idx = runtimeMockLeads.findIndex((l) => matchId(l.id, id));
  if (idx === -1) throw new ApiError("Không tìm thấy lead.", { status: 404 });
  const [removed] = runtimeMockLeads.splice(idx, 1);
  persistCustomLeads(); // lưu thay đổi vào localStorage
  return clone(removed);
}

/**
 * Lấy toàn bộ lịch sử chăm sóc của tất cả lead (dùng cho trang History.jsx).
 * Kế hoạch không định nghĩa endpoint aggregate riêng, nhưng có thể suy ra
 * từ GET /api/leads/{id}/activities lặp qua danh sách lead — ở đây mock gộp
 * sẵn để tránh N lần gọi API không cần thiết phía Front-end.
 */
export async function fetchAllActivities() {
  if (!USE_MOCK) return notSupportedByBackend("lịch sử chăm sóc gộp tất cả lead (chỉ có API theo từng lead: GET /leads/{id}/activities)");
  await mockDelay(350);
  const rows = runtimeMockLeads.flatMap((l) =>
    (mockCareHistory[l.id] || []).map((h) => ({ ...h, leadId: l.id, leadName: l.name, initials: l.initials, assignee: l.assignee }))
  );
  rows.sort((a, b) => (a.date < b.date ? 1 : -1));
  return clone(rows);
}

/** GET /api/leads/{id}/activities + POST /api/leads/{id}/activities */
export async function fetchLeadActivities(id) {
  if (!USE_MOCK) {
    const res = await apiFetch(`/leads/${id}/activities`);
    return unwrapPage(res).items.map(mapActivityResponseToUi);
  }
  await mockDelay();
  return clone(mockCareHistory[id] || []);
}

export async function addLeadActivity(id, activity) {
  if (!USE_MOCK) {
    const res = await apiFetch(`/leads/${id}/activities`, {
      method: "POST",
      body: {
        activityType: ACTIVITY_TYPE_ENUM.includes(activity.activityType) ? activity.activityType : "NOTE",
        content: activity.text,
        result: ACTIVITY_RESULT_ENUM.includes(activity.result) ? activity.result : undefined,
        nextAction: activity.nextAction || undefined,
        nextActionAt: activity.nextActionAt || undefined,
      },
    });
    return mapActivityResponseToUi(res);
  }
  await mockDelay();
  return appendActivity(id, activity);
}

function appendActivity(id, activity) {
  if (!mockCareHistory[id]) mockCareHistory[id] = [];
  const entry = { ...activity, date: activity.date || formatVietnamDateTime(new Date()) };
  mockCareHistory[id].push(entry);

  // Mục VII.5: hệ thống tính lại điểm khi lead có hành động chăm sóc mới.
  const idx = runtimeMockLeads.findIndex((l) => matchId(l.id, id));
  if (idx !== -1) runtimeMockLeads[idx].scoreUpdatedAt = entry.date;

  return clone(entry);
}

/** GET /api/leads/{id}/score + POST /api/leads/{id}/recalculate-score */
export async function fetchLeadScore(id) {
  if (!USE_MOCK) {
    // Không có endpoint /score riêng — điểm (fitScore/engagementScore/intentScore/
    // totalScore) nằm sẵn trong LeadResponse, đọc trực tiếp từ fetchLeadById(id).
    const lead = await apiFetch(`/leads/${id}`);
    return { score: lead.totalScore, breakdown: null }; // backend không trả breakdown chi tiết từng tiêu chí như groupA-E
  }
  await mockDelay(150);
  const lead = runtimeMockLeads.find((l) => matchId(l.id, id));
  if (!lead) throw new ApiError("Không tìm thấy lead.", { status: 404 });
  return { score: lead.score, cls: lead.cls, breakdown: getScoreBreakdown(lead) };
}

export async function recalculateLeadScore(id) {
  if (!USE_MOCK) return notSupportedByBackend("tính lại điểm thủ công (backend tự tính điểm khi có hoạt động mới, không có endpoint kích hoạt lại)");
  await mockDelay();
  const idx = runtimeMockLeads.findIndex((l) => matchId(l.id, id));
  if (idx === -1) throw new ApiError("Không tìm thấy lead.", { status: 404 });
  runtimeMockLeads[idx].score = scoreLead(runtimeMockLeads[idx]);
  runtimeMockLeads[idx].cls = classify(runtimeMockLeads[idx].score, runtimeMockLeads[idx]);
  runtimeMockLeads[idx].scoreUpdatedAt = formatVietnamDateTime(new Date());
  return { score: runtimeMockLeads[idx].score, cls: runtimeMockLeads[idx].cls, breakdown: getScoreBreakdown(runtimeMockLeads[idx]) };
}

/**
 * GET /api/leads/{id}/score-events — "Lịch sử thay đổi điểm" (Mục VII.6 + IX:
 * bảng lead_score_events). Xem utils/leadScoring.js::getScoreHistory().
 */
export async function fetchLeadScoreEvents(id) {
  if (!USE_MOCK) return notSupportedByBackend("lịch sử thay đổi điểm (lead_score_events)");
  await mockDelay(150);
  const lead = runtimeMockLeads.find((l) => matchId(l.id, id));
  if (!lead) throw new ApiError("Không tìm thấy lead.", { status: 404 });
  return clone(getScoreHistory(lead));
}

/** GET /api/scoring-rules — dùng cho ScoreRulesCard */
export async function fetchScoringRules() {
  if (!USE_MOCK) return notSupportedByBackend("bảng luật chấm điểm (scoring-rules) — công thức tính điểm nằm phía backend, không expose qua API");
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
  if (!USE_MOCK) {
    // Spec không có endpoint xuất CSV — lấy toàn bộ lead qua GET /leads (size lớn)
    // rồi để utils/exportCsv.js tự chuyển thành CSV phía client như bên mock.
    const { items } = await fetchLeads({ ...params, page: 1, pageSize: 2000 });
    return items;
  }
  await mockDelay(200);
  const { items } = await fetchLeads({ ...params, page: 1, pageSize: 100000 });
  return items;
}

function clone(obj) {
  return typeof structuredClone === "function" ? structuredClone(obj) : JSON.parse(JSON.stringify(obj));
}
