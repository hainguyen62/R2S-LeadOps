/* ============================================================
   MOCK DATA – R2S LeadOps
   Tất cả dữ liệu demo cho frontend (chưa có backend)
   ============================================================ */

import { scoreLead, classify } from "../utils/leadScoring.js";

// Danh sách khóa học dùng chung cho toàn app (form Lead, form Campaign...).
// 4 khóa đầu khớp dữ liệu ban đầu ở Mục IX (courses); 2 khóa sau đã được
// dùng sẵn trong UI trước đó nên giữ lại để không phá dữ liệu demo cũ.
export const courseOptions = [
  "Java Backend",
  "ReactJS",
  "Flutter",
  "Business Analyst",
  "Data Analyst",
  "UI/UX Design",
];


// Sinh mốc thời gian follow-up TƯƠNG ĐỐI so với "hôm nay" thật (new Date()),
// thay vì hardcode ngày cố định — tránh lặp lại lỗi lệch "đồng hồ" giữa các
// khối mock data (đã gặp ở phần biểu đồ Dashboard). offsetDays âm = quá khứ
// (quá hạn), 0 = hôm nay, dương = tương lai (chưa đến hạn).
function daysFromNow(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

export const stats = [
  { label: "Tổng lead", value: 248, sub: "Tất cả thời gian", icon: "Users", tint: "bg-blue-600" },
  { label: "Lead mới hôm nay", value: 12, sub: "+20% so với hôm qua", icon: "UserPlus", tint: "bg-emerald-500" },
  { label: "Lead nóng", value: 36, sub: "+12% so với hôm qua", icon: "Flame", tint: "bg-orange-500" },
  { label: "Đã đăng ký", value: 18, sub: "+28% so với hôm qua", icon: "BadgeCheck", tint: "bg-violet-600" },
];

export const leadsByDay = [
  { day: "06/05", value: 22 }, { day: "07/05", value: 35 }, { day: "08/05", value: 28 },
  { day: "09/05", value: 41 }, { day: "10/05", value: 33 }, { day: "11/05", value: 47 },
  { day: "12/05", value: 39 },
];

export const classification = [
  { name: "Nóng", value: 36, color: "#ef4444" },
  { name: "Ấm", value: 128, color: "#eab308" },
  { name: "Lạnh", value: 84, color: "#3b82f6" },
];

export const sources = [
  { name: "Facebook", value: 92 },
  { name: "TikTok", value: 58 },
  { name: "Landing Page", value: 42 },
  { name: "Google Form", value: 24 },
];

// Luồng trạng thái lead chính thức (đúng Mục V.3 tài liệu Kế hoạch triển khai):
// Lead mới → Đã liên hệ → Đang tư vấn → Đang cân nhắc → Đã đặt cọc → Đã đăng ký
// Dùng mảng này ở mọi nơi cần hiển thị/lựa chọn trạng thái theo đúng thứ tự luồng
// (dropdown lọc, dropdown cập nhật trạng thái...) thay vì suy ra từ dữ liệu hiện có.
export const leadStatusOrder = [
  "Lead mới",
  "Đã liên hệ",
  "Đang tư vấn",
  "Đang cân nhắc",
  "Đã đặt cọc",
  "Đã đăng ký",
];

export const funnel = [
  { name: "Lead mới", value: 248, pct: "100%", fill: "#3b82f6" },
  { name: "Đã liên hệ", value: 154, pct: "62%", fill: "#22c55e" },
  { name: "Đang tư vấn", value: 66, pct: "27%", fill: "#eab308" },
  { name: "Đang cân nhắc", value: 40, pct: "16%", fill: "#f97316" },
  { name: "Đã đặt cọc", value: 28, pct: "11%", fill: "#7e57c2" },
  { name: "Đã đăng ký", value: 18, pct: "7%", fill: "#a855f7" },
];

export const statusStyle = {
  "Lead mới": "bg-green-50 text-green-700",
  "Đã liên hệ": "bg-cyan-50 text-cyan-700",
  "Đang tư vấn": "bg-blue-50 text-blue-700",
  "Đang cân nhắc": "bg-amber-50 text-amber-700",
  "Đã đặt cọc": "bg-orange-50 text-orange-700",
  "Đã đăng ký": "bg-emerald-50 text-emerald-700",
};

export const classStyle = {
  "Lead nóng": "bg-red-50 text-red-700",
  "Lead ấm": "bg-amber-50 text-amber-700",
  "Lead lạnh": "bg-blue-50 text-blue-700",
  "Không hợp lệ": "bg-slate-100 text-slate-500",
};

// Badge phân loại lead dạng "nền đặc/pastel + icon lửa/giọt nước", theo đúng
// mẫu thiết kế Hi-Fi: Lead nóng nổi bật nền đỏ đặc chữ trắng; Lead ấm/lạnh/
// không hợp lệ dùng nền pastel nhẹ hơn để không cạnh tranh với Lead nóng.
export const classBadgeStyle = {
  "Lead nóng": { badge: "bg-red-500 text-white", icon: "text-white" },
  "Lead ấm": { badge: "bg-amber-100 text-amber-700 border border-amber-200", icon: "text-amber-600" },
  "Lead lạnh": { badge: "bg-blue-50 text-blue-700 border border-blue-100", icon: "text-blue-500" },
  "Không hợp lệ": { badge: "bg-slate-100 text-slate-500 border border-slate-200", icon: "text-slate-400" },
};

// Icon + màu thương hiệu hiển thị trước tên nguồn lead ở cột "Nguồn".
export const sourceMeta = {
  "Facebook": { icon: "Facebook", className: "text-[#1877F2]" },
  "Facebook Ads": { icon: "Facebook", className: "text-[#1877F2]" },
  "TikTok": { icon: "TikTok", className: "text-slate-900" },
  "TikTok Ads": { icon: "TikTok", className: "text-slate-900" },
  "Google Ads": { icon: "Megaphone", className: "text-[#EA4335]" },
  "Google Form": { icon: "FileText", className: "text-[#7C3AED]" },
  "Landing Page": { icon: "Globe", className: "text-blue-500" },
  "Messenger": { icon: "MessageCircle", className: "text-[#0084FF]" },
  "Zalo": { icon: "Zalo", className: "text-[#0068FF]" },
  "Referral": { icon: "Share2", className: "text-sky-500" },
  "Organic": { icon: "Sprout", className: "text-green-600" },
  "Other": { icon: "MoreHorizontal", className: "text-slate-400" },
};

// Mỗi lead có `signals` — tập hợp các tín hiệu hành vi/thông tin thực tế
// (đúng theo 4 nhóm A–D + nhóm điểm trừ E trong tài liệu Lead Scoring).
// `score` và `cls` KHÔNG hardcode nữa mà được tính tự động từ `signals`
// bằng scoreLead()/classify(), để đảm bảo luôn khớp 100% với bảng luật
// hiển thị ở trang Quản lý Lead — tránh 2 nơi lệch số liệu như trước.
export const leads = [
  {
    id: 1, name: "Nguyễn Minh Anh", course: "Java Backend", source: "Facebook", status: "Đang tư vấn",
    date: "12/05/2026 09:15", phone: "0901 234 567", email: "minhanh@gmail.com", assignee: "Tư vấn viên A",
    campaign: "Tuyển sinh khóa Java Backend",
    nextFollowUpAt: daysFromNow(-2), // quá hạn 2 ngày
    facebook: "https://facebook.com/minhanh.nguyen",
    signals: {
      fitCourseDefined: true, fitTargetGroup: true, fitCareerGoal: true, fitScheduleMatch: true,
      enrollmentIntent: "30d",
      hasFullContact: true, repliedMessengerZalo: true, activelyMessaged: true,
      askedTuitionFee: true, bookedConsultation: true,
    },
  },
  {
    id: 2, name: "Trần Quốc Huy", course: "ReactJS", source: "TikTok", status: "Lead mới",
    date: "12/05/2026 09:05", phone: "0902 345 678", email: "quochuy@gmail.com", assignee: "Tư vấn viên A",
    campaign: "TikTok Viral – ReactJS",
    nextFollowUpAt: null,
    tiktok: "https://tiktok.com/@quochuy.tran",
    signals: {
      fitCourseDefined: true, fitTargetGroup: true, fitCareerGoal: true,
      enrollmentIntent: "1-3m",
      hasFullContact: true, downloadedOneDoc: true, repliedMessengerZalo: true,
      askedTuitionFee: true,
    },
  },
  {
    id: 3, name: "Lê Thu Hà", course: "Flutter", source: "Landing Page", status: "Đã đăng ký",
    date: "12/05/2026 08:50", phone: "0903 456 789", email: "thuha@gmail.com", assignee: "Tư vấn viên B",
    campaign: "Landing Page mùa hè",
    nextFollowUpAt: null, // đã đăng ký, không cần follow-up nữa
    signals: {
      fitCourseDefined: true, fitTargetGroup: true, fitPriorKnowledge: true, fitCareerGoal: true, fitScheduleMatch: true,
      enrollmentIntent: "7d",
      hasFullContact: true, activelyMessaged: true,
      bookedConsultation: true, confirmedReserveSpot: true,
    },
  },
  {
    id: 4, name: "Phạm Gia Bảo", course: "BA", source: "Google Form", status: "Đang tư vấn",
    date: "12/05/2026 08:30", phone: "0904 567 890", email: "giabao@gmail.com", assignee: null, // chưa phân công
    nextFollowUpAt: null,
    signals: {
      fitCourseDefined: true, fitTargetGroup: true,
      enrollmentIntent: "unknown",
      hasFullContact: true, downloadedOneDoc: true,
      askedSchedule: true,
    },
  },
  {
    id: 5, name: "Võ Hoàng Nam", course: "Data Analyst", source: "Facebook", status: "Đang cân nhắc",
    date: "12/05/2026 08:12", phone: "0905 678 901", email: "hoangnam@gmail.com", assignee: "Tư vấn viên A",
    campaign: "SEM Google – Data Analyst",
    nextFollowUpAt: daysFromNow(0), // đến hạn hôm nay
    facebook: "https://facebook.com/hoangnam.vo",
    signals: {
      fitCourseDefined: true, fitCareerGoal: true,
      enrollmentIntent: "30d",
      hasFullContact: true, downloadedOneDoc: true,
      askedTuitionFee: true,
    },
  },
  {
    id: 6, name: "Đặng Thảo Vy", course: "UI/UX Design", source: "TikTok", status: "Đang tư vấn",
    date: "12/05/2026 07:58", phone: "0906 789 012", email: "thaovy@gmail.com", assignee: null, // chưa phân công
    nextFollowUpAt: null,
    tiktok: "https://tiktok.com/@thaovy.dang",
    signals: {
      fitCourseDefined: true, fitTargetGroup: true,
      enrollmentIntent: "1-3m",
      hasFullContact: true, repliedMessengerZalo: true,
      askedSchedule: true, askedTuitionFee: true,
    },
  },
  {
    id: 7, name: "Bùi Anh Tuấn", course: "Java Backend", source: "Landing Page", status: "Lead mới",
    date: "12/05/2026 07:40", phone: "0907 890 123", email: "anhtuan@gmail.com", assignee: "Tư vấn viên C",
    campaign: "Tuyển sinh khóa Java Backend",
    nextFollowUpAt: null,
    signals: {
      fitCourseDefined: true,
      enrollmentIntent: "unknown",
      hasFullContact: true,
      invalidContact: true, // Số điện thoại xác minh không liên lạc được — dữ liệu không hợp lệ
    },
  },
  {
    id: 8, name: "Ngô Bảo Châu", course: "ReactJS", source: "Google Form", status: "Đã đăng ký",
    date: "12/05/2026 07:22", phone: "0908 901 234", email: "baochau@gmail.com", assignee: "Tư vấn viên A",
    nextFollowUpAt: daysFromNow(-5), // quá hạn 5 ngày
    signals: {
      fitCourseDefined: true, fitTargetGroup: true, fitPriorKnowledge: true, fitCareerGoal: true, fitScheduleMatch: true,
      enrollmentIntent: "7d",
      hasFullContact: true, activelyMessaged: true, attendedWorkshop: true,
      confirmedReserveSpot: true, askedPaymentPolicy: true,
    },
  },
  {
    id: 9, name: "Hoàng Mai Linh", course: "Java Backend", source: "Facebook", status: "Đã liên hệ",
    date: "11/05/2026 18:40", phone: "0909 012 345", email: "mailinh@gmail.com", assignee: "Tư vấn viên A",
    campaign: "Tuyển sinh khóa Java Backend",
    nextFollowUpAt: null,
    facebook: "https://facebook.com/mailinh.hoang",
    signals: {
      fitCourseDefined: true, fitTargetGroup: true, fitCareerGoal: true, fitScheduleMatch: true,
      enrollmentIntent: "7d",
      hasFullContact: true, repliedMessengerZalo: true,
      askedTuitionFee: true, requestedOneOnOne: true,
    },
  },
  {
    id: 10, name: "Phan Quốc An", course: "Data Analyst", source: "TikTok", status: "Đang cân nhắc",
    date: "11/05/2026 16:12", phone: "0910 123 456", email: "quocan@gmail.com", assignee: null, // chưa phân công
    campaign: "SEM Google – Data Analyst",
    nextFollowUpAt: null,
    tiktok: "https://tiktok.com/@quocan.phan",
    signals: {
      fitCourseDefined: true,
      enrollmentIntent: "unknown",
      hasFullContact: true, downloadedOneDoc: true,
      askedSchedule: true,
    },
  },
  {
    id: 11, name: "Trịnh Hồng Nhung", course: "UI/UX Design", source: "Landing Page", status: "Đang tư vấn",
    date: "11/05/2026 14:30", phone: "0911 234 567", email: "hongnhung@gmail.com", assignee: "Tư vấn viên C",
    campaign: "Landing Page mùa hè",
    nextFollowUpAt: daysFromNow(3), // chưa đến hạn
    signals: {
      fitCourseDefined: true, fitTargetGroup: true, fitCareerGoal: true,
      enrollmentIntent: "1-3m",
      hasFullContact: true, repliedMessengerZalo: true, downloadedOneDoc: true,
      askedTuitionFee: true, askedSchedule: true,
    },
  },
  {
    id: 12, name: "Đỗ Minh Khoa", course: "Flutter", source: "Google Form", status: "Đã đặt cọc",
    date: "11/05/2026 11:05", phone: "0912 345 678", email: "minhkhoa@gmail.com", assignee: "Tư vấn viên A",
    nextFollowUpAt: null, // đã đặt cọc, không cần follow-up nữa
    signals: {
      fitCourseDefined: true, fitTargetGroup: true, fitPriorKnowledge: true, fitCareerGoal: true, fitScheduleMatch: true,
      enrollmentIntent: "7d",
      hasFullContact: true, activelyMessaged: true,
      confirmedReserveSpot: true, bookedConsultation: true,
    },
  },
].map((l) => {
  const score = scoreLead(l);
  return {
    ...l,
    score,
    cls: classify(score, l),
    initials: l.name.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase(),
    scoreUpdatedAt: l.scoreUpdatedAt || l.date,
  };
});

export const careHistory = {
  1: [
    { text: "Tạo lead", channel: "Facebook Ads", date: "12/05/2026 09:15" },
    { text: "Đã gọi điện", channel: "Tư vấn viên A", date: "12/05/2026 09:20" },
    { text: "Đã gửi tài liệu", channel: "Tư vấn viên A", date: "12/05/2026 10:10" },
    { text: "Chuyển trạng thái sang Đang tư vấn", channel: "Tư vấn viên A", date: "12/05/2026 10:30" },
  ],
  3: [
    { text: "Tạo lead", channel: "Landing Page", date: "12/05/2026 08:50" },
    { text: "Đã gọi điện", channel: "Tư vấn viên B", date: "12/05/2026 09:05" },
    { text: "Chuyển trạng thái sang Đang tư vấn", channel: "Tư vấn viên B", date: "12/05/2026 09:30" },
    { text: "Đã đăng ký khóa học", channel: "Tư vấn viên B", date: "12/05/2026 10:45" },
  ],
  8: [
    { text: "Tạo lead", channel: "Google Form", date: "12/05/2026 07:22" },
    { text: "Đã gửi email khảo sát", channel: "Tư vấn viên A", date: "12/05/2026 08:00" },
    { text: "Đã đặt cọc", channel: "Tư vấn viên A", date: "12/05/2026 09:15" },
    { text: "Đã đăng ký", channel: "Tư vấn viên A", date: "12/05/2026 10:00" },
  ],
};

// Lưu ý: bảng "lý do cộng/trừ điểm" của từng lead giờ được TÍNH ĐỘNG bằng
// getScoreBreakdown(lead) trong utils/leadScoring.js (dựa trên lead.signals),
// không còn hardcode theo id ở đây — đảm bảo luôn khớp với điểm số hiển thị.


export const campaigns = [
  {
    id: 1,
    name: "Tuyển sinh khóa Java Backend",
    source: "Facebook Ads",
    course: "Java Backend",
    leads: 46,
    hotLeads: 14,
    deposits: 9,
    registrations: 6,
    status: "Đang chạy",
    budget: "10.000.000",
    start: "2026-05-01",
    end: "2026-05-31",
    utmSource: "facebook",
    utmMedium: "cpc",
    utmCampaign: "java-backend-t5",
    utmContent: "video-ad-01",
    utmTerm: "hoc-java-backend",
  },
  {
    id: 2,
    name: "SEM Google – Data Analyst",
    source: "Google Ads",
    course: "Data Analyst",
    leads: 28,
    hotLeads: 8,
    deposits: 5,
    registrations: 3,
    status: "Đang chạy",
    budget: "8.000.000",
    start: "2026-05-05",
    end: "2026-05-30",
    utmSource: "google",
    utmMedium: "cpc",
    utmCampaign: "data-analyst-t5",
    utmContent: "search-ad-a",
    utmTerm: "khoa-hoc-data-analyst",
  },
  {
    id: 3,
    name: "TikTok Viral – ReactJS",
    source: "TikTok Ads",
    course: "ReactJS",
    leads: 35,
    hotLeads: 11,
    deposits: 6,
    registrations: 4,
    status: "Đang chạy",
    budget: "6.000.000",
    start: "2026-05-10",
    end: "2026-05-25",
    utmSource: "tiktok",
    utmMedium: "social",
    utmCampaign: "reactjs-t5",
    utmContent: "reel-01",
    utmTerm: "",
  },
  {
    id: 4,
    name: "Landing Page mùa hè",
    source: "Landing Page",
    course: "UI/UX Design",
    leads: 22,
    hotLeads: 5,
    deposits: 3,
    registrations: 2,
    status: "Kết thúc",
    budget: "3.000.000",
    start: "2026-04-01",
    end: "2026-04-30",
    utmSource: "landing-page",
    utmMedium: "organic",
    utmCampaign: "summer-2026",
    utmContent: "",
    utmTerm: "",
  },
];

// Xu hướng lead theo ngày cho từng chiến dịch — dùng cho biểu đồ ở trang Campaign Details
export const campaignTrends = {
  1: [
    { day: "01/05", value: 3 }, { day: "08/05", value: 6 }, { day: "15/05", value: 9 },
    { day: "22/05", value: 14 }, { day: "29/05", value: 14 },
  ],
  2: [
    { day: "05/05", value: 2 }, { day: "12/05", value: 5 }, { day: "19/05", value: 9 },
    { day: "26/05", value: 12 },
  ],
  3: [
    { day: "10/05", value: 4 }, { day: "15/05", value: 10 }, { day: "20/05", value: 18 },
    { day: "25/05", value: 3 },
  ],
  4: [
    { day: "01/04", value: 5 }, { day: "10/04", value: 8 }, { day: "20/04", value: 6 },
    { day: "30/04", value: 3 },
  ],
};

export const activityLogs = [
  { id: 1, user: "Tư vấn viên A", action: "Cập nhật trạng thái lead #1", time: "12/05/2026 10:30" },
  { id: 2, user: "Tư vấn viên B", action: "Thêm lead mới #9", time: "12/05/2026 09:45" },
  { id: 3, user: "Tư vấn viên A", action: "Gửi email cho lead #3", time: "12/05/2026 09:15" },
  { id: 4, user: "Admin", action: "Tạo chiến dịch mới", time: "12/05/2026 08:50" },
  { id: 5, user: "Tư vấn viên C", action: "Gọi điện cho lead #6", time: "12/05/2026 08:20" },
];

export const users = [
  { id: 1, name: "Tư vấn viên A", role: "Sales/Admissions", email: "tva@r2s.edu.vn", status: "Hoạt động" },
  { id: 2, name: "Tư vấn viên B", role: "Sales/Admissions", email: "tvb@r2s.edu.vn", status: "Hoạt động" },
  { id: 3, name: "Tư vấn viên C", role: "Sales/Admissions", email: "tvc@r2s.edu.vn", status: "Hoạt động" },
  { id: 4, name: "Leader Marketing", role: "Leader Marketing", email: "marketing@r2s.edu.vn", status: "Hoạt động" },
  { id: 5, name: "Admin", role: "Administrator", email: "admin@r2s.edu.vn", status: "Hoạt động" },
  { id: 6, name: "Marketing Staff", role: "Marketing Staff", email: "staff.marketing@r2s.edu.vn", status: "Hoạt động" },
];

// Người dùng hiện đang đăng nhập (demo) — dùng cho trang Profile
export const currentUserProfile = {
  name: "Tư vấn viên A",
  role: "Sales/Admissions",
  email: "tva@r2s.edu.vn",
  phone: "0901 111 222",
  department: "Phòng Tuyển sinh",
  joinedAt: "01/03/2026",
};

// Thông báo (demo) — dùng cho Notification Center
export const notifications = [
  {
    id: 1,
    type: "hot-lead",
    title: "Lead nóng mới: Nguyễn Minh Anh",
    desc: "Điểm 78 — quan tâm Java Backend, cần liên hệ trong 10 phút.",
    time: "5 phút trước",
    read: false,
    leadId: 1,
  },
  {
    id: 2,
    type: "followup",
    title: "Follow-up quá hạn: Võ Hoàng Nam",
    desc: "Lịch hẹn gọi lại đã quá hạn 2 giờ.",
    time: "2 giờ trước",
    read: false,
    leadId: 5,
  },
  {
    id: 3,
    type: "hot-lead",
    title: "Lead nóng mới: Ngô Bảo Châu",
    desc: "Điểm 91 — đã đặt lịch tư vấn 1-1.",
    time: "3 giờ trước",
    read: false,
    leadId: 8,
  },
  {
    id: 4,
    type: "system",
    title: "Chiến dịch \"TikTok Viral – ReactJS\" sắp kết thúc",
    desc: "Còn 3 ngày trước khi chiến dịch kết thúc.",
    time: "Hôm qua",
    read: true,
    leadId: null,
  },
  {
    id: 5,
    type: "assign",
    title: "Bạn được phân công lead mới",
    desc: "Trần Quốc Huy vừa được Leader phân công cho bạn.",
    time: "Hôm qua",
    read: true,
    leadId: 2,
  },
];

export const navItems = [
  { label: "Dashboard", path: "/", icon: "LayoutDashboard" },
  { label: "Leads", path: "/leads", icon: "Users" },
  { label: "Chiến dịch", path: "/campaigns", icon: "GitBranch" },
  { label: "Lịch hẹn của tôi", path: "/appointments", icon: "CalendarClock" },
  { label: "Lịch sử chăm sóc", path: "/history", icon: "History" },
  { label: "Báo cáo", path: "/reports", icon: "BarChart3" },
  { label: "Cài đặt", path: "/settings", icon: "Settings" },
];