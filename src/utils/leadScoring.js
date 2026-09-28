// ============================================================
// Chấm điểm lead tự động — theo đúng bảng điểm đề xuất trong
// "Kế hoạch triển khai dự án R2S LeadOps", Mục VII (THIẾT KẾ LEAD SCORING).
//
// Tổng điểm: 0–100, chia 4 nhóm cộng điểm (A–D, mỗi nhóm có mức trần
// riêng) + 1 nhóm điểm trừ (E). Đây là nguồn dữ liệu DUY NHẤT cho cả
// hàm tính điểm (scoreLead) lẫn bảng luật hiển thị trên UI
// (ScoreRulesCard), để không bao giờ lệch nhau.
//
// CẤU HÌNH ĐƯỢC (MỚI): điểm từng tiêu chí không còn cố định cứng — Admin/
// Leader Marketing có thể đổi qua trang "Cấu hình chấm điểm"
// (pages/ScoringRules.jsx). Thay đổi được lưu ở localStorage (chưa có
// Back-end thật để lưu dùng chung — xem services/scoringRuleService.js) và
// áp dụng NGAY cho các lần tính điểm tiếp theo trong cùng trình duyệt.
// ============================================================

const OVERRIDES_KEY = "r2s_leadops_scoring_overrides_v1";

function loadOverridesRaw() {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(OVERRIDES_KEY) : null;
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

const CUSTOM_KEY = "r2s_leadops_scoring_custom_v1";
const DELETED_KEY = "r2s_leadops_scoring_deleted_v1";

function loadJson(key, fallback) {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage không khả dụng — bỏ qua.
  }
}

function saveOverridesRaw(overrides) {
  try {
    window.localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
  } catch {
    // localStorage không khả dụng (SSR, chế độ ẩn danh chặn...) — bỏ qua, dùng điểm mặc định.
  }
}

// ---- Nhóm A: Mức độ phù hợp với khóa học (tối đa 25đ) ----
// Mỗi tiêu chí là một cờ boolean độc lập trong lead.signals.
export const groupA = {
  id: "A",
  name: "Mức độ phù hợp với khóa học",
  max: 25,
  criteria: [
    { id: "fitCourseDefined", label: "Xác định rõ khóa học quan tâm", points: 5 },
    { id: "fitTargetGroup", label: "Thuộc đúng nhóm đối tượng của khóa học", points: 5 },
    { id: "fitPriorKnowledge", label: "Đã có kiến thức nền liên quan", points: 5 },
    { id: "fitCareerGoal", label: "Có mục tiêu nghề nghiệp rõ ràng", points: 5 },
    { id: "fitScheduleMatch", label: "Có thể tham gia đúng lịch học", points: 5 },
  ],
};

// ---- Nhóm B: Ý định và thời gian đăng ký (tối đa 30đ) ----
// Chỉ chọn MỘT mức cao nhất phù hợp — lưu ở lead.signals.enrollmentIntent.
export const groupB = {
  id: "B",
  name: "Ý định và thời gian đăng ký",
  max: 30,
  singleSelect: true,
  field: "enrollmentIntent",
  options: [
    { value: "7d", label: "Muốn đăng ký trong 7 ngày", points: 30 },
    { value: "30d", label: "Muốn đăng ký trong 30 ngày", points: 20 },
    { value: "1-3m", label: "Muốn đăng ký trong 1–3 tháng", points: 10 },
    { value: "unknown", label: "Chưa xác định thời gian", points: 0 },
    { value: "6m+", label: "Chưa có nhu cầu trong 6 tháng", points: -10 },
  ],
};

// ---- Nhóm C: Mức độ tương tác (tối đa 25đ, có giới hạn trần) ----
export const groupC = {
  id: "C",
  name: "Mức độ tương tác",
  max: 25,
  criteria: [
    { id: "hasFullContact", label: "Điền đầy đủ số điện thoại và email", points: 5 },
    { id: "downloadedOneDoc", label: "Tải tài liệu", points: 3 },
    { id: "downloadedTwoPlusDocs", label: "Tải từ hai tài liệu trở lên", points: 5 },
    { id: "repliedMessengerZalo", label: "Phản hồi Messenger hoặc Zalo", points: 5 },
    { id: "openedRepliedEmail", label: "Mở hoặc phản hồi email", points: 3 },
    { id: "revisitedOrResubmitted", label: "Xem lại Landing Page hoặc gửi Form lần hai", points: 5 },
    { id: "attendedWorkshop", label: "Tham gia Workshop hoặc Webinar", points: 7 },
    { id: "activelyMessaged", label: "Chủ động nhắn tin hỏi thông tin", points: 8 },
  ],
};

// ---- Nhóm D: Tín hiệu mua hàng (tối đa 20đ, có giới hạn trần) ----
export const groupD = {
  id: "D",
  name: "Tín hiệu mua hàng",
  max: 20,
  criteria: [
    { id: "askedTuitionFee", label: "Hỏi học phí", points: 5 },
    { id: "askedSchedule", label: "Hỏi lịch khai giảng", points: 5 },
    { id: "askedPaymentPolicy", label: "Hỏi chính sách đóng học phí", points: 5 },
    { id: "requestedOneOnOne", label: "Yêu cầu tư vấn 1–1", points: 8 },
    { id: "bookedConsultation", label: "Đặt lịch tư vấn", points: 10 },
    { id: "sentCvOrRoadmap", label: "Gửi CV hoặc yêu cầu đánh giá lộ trình", points: 7 },
    { id: "confirmedReserveSpot", label: "Xác nhận muốn giữ chỗ", points: 15 },
  ],
};

// ---- Nhóm E: Điểm trừ (không giới hạn trần, cộng dồn) ----
export const groupE = {
  id: "E",
  name: "Điểm trừ — tín hiệu không phù hợp",
  criteria: [
    { id: "invalidContact", label: "Số điện thoại hoặc email không hợp lệ", points: -20 },
    { id: "noResponseAfter3Contacts", label: "Không phản hồi sau ba lần liên hệ", points: -10 },
    { id: "declaredNoNeed", label: "Thông báo không có nhu cầu", points: -30 },
    { id: "onlyWantsDocs", label: "Chỉ tìm tài liệu, không có nhu cầu học", points: -15 },
    { id: "scheduleMismatch", label: "Thời gian học không phù hợp", points: -10 },
    { id: "isSpamOrFake", label: "Lead giả hoặc spam", points: -100 },
  ],
};

export const scoringGroups = [groupA, groupB, groupC, groupD];
export const deductionGroup = groupE;
export const scoringMax = 100;

// ---- Áp override đã lưu (nếu có) lên toàn bộ định nghĩa nhóm ----
// Mutate TRỰC TIẾP vào object groupA..groupE (không tạo bản sao) để mọi nơi
// đang import { scoringGroups, deductionGroup, groupA... } đều tự thấy giá
// trị mới ngay khi render lại, không cần sửa các component đang hiển thị.
function applyOverridesToGroups() {
  const overrides = loadOverridesRaw();
  const customs = loadJson(CUSTOM_KEY, []);
  const deleted = loadJson(DELETED_KEY, []);
  const groupMap = { A: groupA, C: groupC, D: groupD, E: groupE };

  // Thêm tiêu chí tự tạo (chỉ nhóm A/C/D/E — nhóm B là danh sách mức chọn 1 nên không thêm/xóa).
  customs.forEach((cr) => {
    const g = groupMap[cr.groupId];
    if (g && !g.criteria.some((c) => c.id === cr.id)) {
      g.criteria.push({ id: cr.id, label: cr.label, points: cr.points, custom: true });
    }
  });

  // Ẩn tiêu chí gốc đã bị xóa (xóa mềm — "Khôi phục mặc định" sẽ đưa lại).
  [groupA, groupC, groupD, groupE].forEach((g) => {
    g.criteria = g.criteria.filter((c) => !deleted.includes(c.id));
  });

  [groupA, groupC, groupD, groupE].forEach((group) => {
    group.criteria.forEach((c) => {
      const o = overrides[c.id];
      if (!o) return;
      if (typeof o.points === "number") c.points = o.points;
      if (typeof o.active === "boolean") c.active = o.active;
    });
  });

  groupB.options.forEach((opt) => {
    const code = "B:" + opt.value;
    const o = overrides[code];
    if (!o) return;
    if (typeof o.points === "number") opt.points = o.points;
    if (typeof o.active === "boolean") opt.active = o.active;
  });
}

applyOverridesToGroups(); // áp override ngay khi module được load lần đầu

/**
 * Danh sách phẳng toàn bộ tiêu chí (dùng cho trang Cấu hình chấm điểm) —
 * mỗi phần tử: { ruleCode, groupCode, groupName, label, points, active }.
 */
export function getAllRuleDefs() {
  const rows = [];
  [groupA, groupC, groupD, groupE].forEach((group) => {
    group.criteria.forEach((c) => {
      rows.push({
        ruleCode: c.id,
        groupCode: group.id,
        groupName: group.id === "E" ? deductionGroup.name : group.name,
        label: c.label,
        points: c.points,
        active: c.active !== false,
        custom: !!c.custom,
        deletable: group.id !== "B",
      });
    });
  });
  groupB.options.forEach((opt) => {
    rows.push({
      ruleCode: "B:" + opt.value,
      groupCode: "B",
      groupName: groupB.name,
      label: opt.label,
      points: opt.points,
      active: opt.active !== false,
    });
  });
  return rows;
}

/** Đổi điểm/bật-tắt 1 tiêu chí — lưu vào localStorage và áp dụng ngay. */
export function updateRuleOverride(ruleCode, { points, active }) {
  const overrides = loadOverridesRaw();
  overrides[ruleCode] = {
    points: typeof points === "number" ? points : overrides[ruleCode]?.points,
    active: typeof active === "boolean" ? active : overrides[ruleCode]?.active,
  };
  saveOverridesRaw(overrides);
  applyOverridesToGroups();
  return getAllRuleDefs().find((r) => r.ruleCode === ruleCode);
}

/** Thêm 1 tiêu chí mới vào nhóm A/C/D/E. Tiêu chí sẽ tự hiện thành checkbox ở LeadDetail. */
export function addCustomRule({ groupId, label, points }) {
  if (!["A", "C", "D", "E"].includes(groupId)) throw new Error("Chỉ thêm được tiêu chí vào nhóm A, C, D hoặc E.");
  const text = (label || "").trim();
  if (!text) throw new Error("Vui lòng nhập tên tiêu chí.");
  if (typeof points !== "number" || Number.isNaN(points)) throw new Error("Điểm phải là số nguyên.");
  const exists = getAllRuleDefs().some((r) => r.label.toLowerCase() === text.toLowerCase());
  if (exists) throw new Error("Tên tiêu chí đã tồn tại.");

  const customs = loadJson(CUSTOM_KEY, []);
  const id = "custom_" + Date.now();
  customs.push({ id, groupId, label: text, points });
  saveJson(CUSTOM_KEY, customs);
  applyOverridesToGroups();
  return getAllRuleDefs().find((r) => r.ruleCode === id);
}

/** Xóa 1 tiêu chí: tiêu chí tự tạo bị xóa hẳn, tiêu chí gốc bị ẩn (khôi phục được bằng "Khôi phục mặc định"). */
export function deleteRule(ruleCode) {
  const customs = loadJson(CUSTOM_KEY, []);
  if (customs.some((c) => c.id === ruleCode)) {
    saveJson(CUSTOM_KEY, customs.filter((c) => c.id !== ruleCode));
    [groupA, groupC, groupD, groupE].forEach((g) => {
      g.criteria = g.criteria.filter((c) => c.id !== ruleCode);
    });
  } else {
    const deleted = loadJson(DELETED_KEY, []);
    if (!deleted.includes(ruleCode)) deleted.push(ruleCode);
    saveJson(DELETED_KEY, deleted);
    applyOverridesToGroups();
  }
}

/** Khôi phục toàn bộ bảng điểm về mặc định gốc (xóa hết override đã lưu). */
export function resetAllRuleOverrides() {
  saveJson(CUSTOM_KEY, []);
  saveJson(DELETED_KEY, []);
  saveOverridesRaw({});
  if (typeof window !== "undefined") window.location.reload(); // đơn giản nhất: nạp lại module với giá trị gốc
}

// Phân loại theo tổng điểm — bao gồm cả mức "Không hợp lệ" theo đúng
// bảng phân loại trong tài liệu (Mục VII.4).
export const classificationRules = [
  { cls: "Lead nóng", range: "70 – 100 điểm", action: "Liên hệ ưu tiên ngay", color: "#ef4444", badgeClass: "bg-red-50 text-red-700 border border-red-200" },
  { cls: "Lead ấm", range: "40 – 69 điểm", action: "Tư vấn và tiếp tục nurturing", color: "#eab308", badgeClass: "bg-amber-50 text-amber-700 border border-amber-200" },
  { cls: "Lead lạnh", range: "1 – 39 điểm", action: "Nuôi dưỡng bằng tài liệu, nội dung", color: "#3b82f6", badgeClass: "bg-blue-50 text-blue-700 border border-blue-200" },
  { cls: "Không hợp lệ", range: "0 điểm hoặc bị đánh dấu spam", action: "Không đưa vào danh sách ưu tiên", color: "#94a3b8", badgeClass: "bg-slate-100 text-slate-500 border border-slate-200" },
];

/**
 * Tính tổng điểm lead từ các tín hiệu (lead.signals), theo đúng công thức:
 * điểm A + điểm B (chọn 1 mức) + điểm C (trần 25) + điểm D (trần 20) + điểm E (điểm trừ),
 * sau đó giới hạn kết quả trong khoảng [0, 100].
 */
export function scoreLead(lead) {
  const s = (lead && lead.signals) || {};

  const scoreA = groupA.criteria.reduce((sum, c) => sum + (s[c.id] && c.active !== false ? c.points : 0), 0);

  const bOption = groupB.options.find((o) => o.value === s.enrollmentIntent);
  const scoreB = bOption && bOption.active !== false ? bOption.points : 0;

  const rawC = groupC.criteria.reduce((sum, c) => sum + (s[c.id] && c.active !== false ? c.points : 0), 0);
  const scoreC = Math.min(rawC, groupC.max);

  const rawD = groupD.criteria.reduce((sum, c) => sum + (s[c.id] && c.active !== false ? c.points : 0), 0);
  const scoreD = Math.min(rawD, groupD.max);

  const scoreE = groupE.criteria.reduce((sum, c) => sum + (s[c.id] && c.active !== false ? c.points : 0), 0);

  const total = scoreA + scoreB + scoreC + scoreD + scoreE;
  return Math.max(0, Math.min(100, total));
}

/**
 * Sinh danh sách chi tiết lý do cộng/trừ điểm cho một lead — dùng để hiển
 * thị ở khu vực "Lead Scoring" trong trang/modal chi tiết lead, đúng yêu
 * cầu "Chi tiết lý do cộng điểm / trừ điểm" (Mục VII.6).
 */
export function getScoreBreakdown(lead) {
  const s = (lead && lead.signals) || {};
  const items = [];

  groupA.criteria.forEach((c) => {
    if (s[c.id] && c.active !== false) items.push({ label: c.label, value: `+${c.points}`, group: "A" });
  });

  const bOption = groupB.options.find((o) => o.value === s.enrollmentIntent);
  if (bOption && bOption.active !== false && bOption.points !== 0) {
    items.push({ label: bOption.label, value: `${bOption.points > 0 ? "+" : ""}${bOption.points}`, group: "B" });
  }

  groupC.criteria.forEach((c) => {
    if (s[c.id] && c.active !== false) items.push({ label: c.label, value: `+${c.points}`, group: "C" });
  });

  groupD.criteria.forEach((c) => {
    if (s[c.id] && c.active !== false) items.push({ label: c.label, value: `+${c.points}`, group: "D" });
  });

  groupE.criteria.forEach((c) => {
    if (s[c.id] && c.active !== false) items.push({ label: c.label, value: `${c.points}`, group: "E" });
  });

  return items;
}

/**
 * Phân loại lead theo tổng điểm — trả về "Không hợp lệ" khi bị đánh dấu
 * spam hoặc tổng điểm về 0, đúng bảng phân loại trong tài liệu.
 */
export function classify(score, lead) {
  const isSpam = lead && lead.signals && lead.signals.isSpamOrFake;
  if (isSpam || score <= 0) return "Không hợp lệ";
  if (score >= 70) return "Lead nóng";
  if (score >= 40) return "Lead ấm";
  return "Lead lạnh";
}

export function classifyColor(cls) {
  const rule = classificationRules.find((r) => r.cls === cls);
  return rule ? rule.color : "#94a3b8";
}

// Mức độ ưu tiên hiển thị (icon/màu) cho lead — tách riêng khỏi classify()
// để có thể phân biệt RÕ RÀNG 3 cấp độ bằng biểu tượng khác nhau:
//   - "hot"  (>=80đ): lửa đỏ, đậm — cần xử lý ngay lập tức
//   - "warm" (50-79đ): lửa cam — cần chăm sóc sớm
//   - "cool" (<50đ)  : giọt nước xanh (không phải lửa) — chưa gấp
export function priorityTier(score) {
  if (score >= 80) return "hot";
  if (score >= 50) return "warm";
  return "cool";
}

// Suy ra ngày/giờ từ chuỗi "dd/mm/yyyy hh:mm" (định dạng dùng trong `date`,
// lịch sử chăm sóc...) hoặc ISO string. Trả về null nếu không parse được.
// Export để dashboardService.js dùng chung khi xác định lead "thay đổi điểm
// mạnh trong ngày" (xem fetchChangedTodayLeads).
export function parseVnDate(str) {
  if (!str) return null;
  if (str instanceof Date) return str;
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return new Date(str);
  const [datePart, timePart = "00:00"] = String(str).split(" ");
  const [d, m, y] = datePart.split("/").map(Number);
  const [hh, mm] = timePart.split(":").map(Number);
  if (!d || !m || !y) return null;
  return new Date(y, m - 1, d, hh || 0, mm || 0);
}

/**
 * Biến động điểm LỚN NHẤT (theo trị tuyệt đối) trong lần tính điểm gần nhất
 * của lead — dùng để xếp hạng "Lead thay đổi điểm mạnh trong ngày" (Mục
 * XI.2 danh sách hành động) khi backend CHƯA có API lịch sử điểm
 * (lead_score_events, Mục IX) để biết chính xác mức tăng/giảm thật giữa 2
 * lần chấm điểm liên tiếp. Đây là giá trị SUY RA từ breakdown hiện tại (tín
 * hiệu cộng/trừ điểm lớn nhất đang áp dụng cho lead), không phải delta thật
 * giữa 2 thời điểm — chỉ dùng cho mục đích demo/tham khảo cho tới khi có
 * API thật.
 *
 * QUAN TRỌNG: trả về giá trị CÓ DẤU (dương = biến động lớn nhất là cộng
 * điểm, âm = biến động lớn nhất là trừ điểm) — KHÔNG lấy trị tuyệt đối —
 * để nơi gọi phân biệt được "tăng mạnh" và "giảm mạnh", tránh hiển thị sai
 * chiều (ví dụ: một lead bị trừ -100đ vì spam không được gắn nhãn "tăng
 * mạnh +100đ").
 */
export function largestScoreSwing(lead) {
  const breakdown = getScoreBreakdown(lead);
  if (breakdown.length === 0) return 0;
  return breakdown.reduce((best, b) => {
    const v = Number(b.value);
    return Math.abs(v) > Math.abs(best) ? v : best;
  }, 0);
}

/**
 * "Lịch sử thay đổi điểm" (bảng lead_score_events, Mục IX + ví dụ Mục VII.6 kế
 * hoạch: +20/+10/+8/+5/+5...). Vì dữ liệu mock không ghi log thời điểm phát sinh
 * từng tín hiệu riêng lẻ, các mốc được suy ra từ breakdown hiện tại của lead,
 * giãn cách lùi dần trước thời điểm tính điểm gần nhất (scoreUpdatedAt/date),
 * cộng dồn (scoreAfter) theo đúng thứ tự thời gian tăng dần.
 */
export function getScoreHistory(lead) {
  const breakdown = getScoreBreakdown(lead);
  if (breakdown.length === 0) return [];

  const anchor = parseVnDate(lead.scoreUpdatedAt || lead.date) || new Date();
  const stepMinutes = 20;

  let running = 0;
  return breakdown.map((b, i) => {
    running += Number(b.value);
    return {
      ...b,
      scoreAfter: running,
      date: new Date(anchor.getTime() - (breakdown.length - 1 - i) * stepMinutes * 60000),
    };
  });
}