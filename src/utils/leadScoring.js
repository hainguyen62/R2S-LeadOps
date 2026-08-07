// Chấm điểm lead tự động (Module 8) & phân loại (Module 9)
// Điểm tối đa 100. Trên 70 = Nóng, 40–70 = Ấm, dưới 40 = Lạnh.

// Bảng luật chấm điểm — nguồn dữ liệu DUY NHẤT cho UI (bảng luật hiển thị
// ở trang Quản lý Lead) và cho hàm scoreLead() bên dưới, để tránh 2 nơi
// lệch nhau khi có thay đổi luật sau này.
export const scoringCriteria = [
  { label: "Có số điện thoại", points: 10, group: "Thông tin liên hệ" },
  { label: "Có email", points: 10, group: "Thông tin liên hệ" },
  { label: "Có khóa học quan tâm", points: 15, group: "Thông tin liên hệ" },
  { label: "Xác định được nguồn lead", points: 5, group: "Thông tin liên hệ" },
  { label: 'Ghi chú chứa "sẵn sàng" / "đăng ký"', points: 20, group: "Hành vi & ghi chú" },
  { label: 'Ghi chú chứa "quan tâm" / "tư vấn"', points: 10, group: "Hành vi & ghi chú" },
];

export const scoringMax = 100;

export const classificationRules = [
  { cls: "Lead nóng", range: "≥ 70 điểm", color: "#f97316", badgeClass: "bg-red-50 text-red-700 border border-red-200" },
  { cls: "Lead ấm", range: "40 – 69 điểm", color: "#eab308", badgeClass: "bg-amber-50 text-amber-700 border border-amber-200" },
  { cls: "Lead lạnh", range: "< 40 điểm", color: "#3b82f6", badgeClass: "bg-blue-50 text-blue-700 border border-blue-200" },
];

/**
 * Tính điểm chi tiết của lead — NGUỒN DUY NHẤT cho cả tổng điểm (scoreLead)
 * lẫn bảng "Điểm chi tiết" ở trang chi tiết lead. Dựa trên 5 trường cơ bản
 * (phone/email/course/source/note) + các tín hiệu hành vi trong `lead.signals`,
 * để đảm bảo dashboard, danh sách lead và trang chi tiết luôn khớp nhau.
 * @returns {Array<{label:string, value:number}>}
 */
export function getScoreBreakdown(lead) {
  if (!lead) return [];
  const items = [];
  const has = (p) => lead[p] && lead[p].length > 0;

  if (has("phone")) items.push({ label: "Có số điện thoại", value: 10 });
  if (has("email")) items.push({ label: "Có email", value: 10 });
  if (has("course")) items.push({ label: "Có khóa học quan tâm", value: 15 });
  if (has("source")) items.push({ label: "Xác định được nguồn lead", value: 5 });

  if (has("note")) {
    const note = lead.note.toLowerCase();
    if (note.includes("sẵn sàng") || note.includes("đăng ký"))
      items.push({ label: 'Ghi chú chứa "sẵn sàng"/"đăng ký"', value: 20 });
    if (note.includes("quan tâm") || note.includes("tư vấn"))
      items.push({ label: 'Ghi chú chứa "quan tâm"/"tư vấn"', value: 10 });
  }

  const s = lead.signals || {};
  // Nhóm A — mức độ phù hợp thông tin
  if (s.fitTargetGroup) items.push({ label: "Đúng đối tượng mục tiêu", value: 5 });
  if (s.fitCareerGoal) items.push({ label: "Mục tiêu nghề nghiệp phù hợp", value: 5 });
  if (s.fitPriorKnowledge) items.push({ label: "Có kiến thức nền tảng", value: 5 });
  if (s.fitScheduleMatch) items.push({ label: "Lịch học phù hợp", value: 5 });
  // Nhóm B — mức độ sẵn sàng đăng ký
  if (s.enrollmentIntent === "7d") items.push({ label: "Đăng ký trong 7 ngày", value: 20 });
  else if (s.enrollmentIntent === "30d") items.push({ label: "Đăng ký trong 30 ngày", value: 15 });
  else if (s.enrollmentIntent === "1-3m") items.push({ label: "Đăng ký trong 1-3 tháng", value: 10 });
  else if (s.fitCourseDefined) items.push({ label: "Đã xác định khóa học", value: 5 });
  // Nhóm C — mức độ tương tác
  if (s.hasFullContact) items.push({ label: "Đủ thông tin liên hệ", value: 5 });
  if (s.repliedMessengerZalo) items.push({ label: "Đã phản hồi Messenger/Zalo", value: 5 });
  if (s.activelyMessaged) items.push({ label: "Chủ động nhắn tin", value: 5 });
  if (s.downloadedOneDoc) items.push({ label: "Đã tải tài liệu", value: 3 });
  if (s.attendedWorkshop) items.push({ label: "Đã dự workshop", value: 3 });
  // Nhóm D — hành động chốt đơn
  if (s.askedSchedule) items.push({ label: "Hỏi lịch học", value: 3 });
  if (s.askedTuitionFee) items.push({ label: "Hỏi học phí", value: 5 });
  if (s.askedPaymentPolicy) items.push({ label: "Hỏi chính sách thanh toán", value: 5 });
  if (s.requestedOneOnOne) items.push({ label: "Yêu cầu tư vấn 1-1", value: 5 });
  if (s.bookedConsultation) items.push({ label: "Đặt lịch tư vấn", value: 5 });
  if (s.confirmedReserveSpot) items.push({ label: "Xác nhận giữ chỗ", value: 10 });
  // Nhóm E — điểm trừ
  if (s.invalidContact) items.push({ label: "Liên hệ không hợp lệ", value: -10 });

  return items;
}

export function scoreLead(lead) {
  return Math.min(getScoreBreakdown(lead).reduce((sum, it) => sum + it.value, 0), 100);
}

export function classify(score) {
  if (score >= 70) return "Lead nóng";
  if (score >= 40) return "Lead ấm";
  return "Lead lạnh";
}

export function classifyColor(cls) {
  if (cls === "Lead nóng") return "#f97316";
  if (cls === "Lead ấm") return "#eab308";
  return "#3b82f6";
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