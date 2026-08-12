/* ============================================================
   PERMISSIONS — khớp Mục IV (ĐỐI TƯỢNG SỬ DỤNG VÀ PHÂN QUYỀN) trong
   "Kế hoạch triển khai dự án R2S LeadOps".

   Đây là nguồn dữ liệu DUY NHẤT cho toàn bộ logic phân quyền phía FE:
   route guard (App.jsx), menu điều hướng (Sidebar.jsx), lọc dữ liệu
   theo vai trò (Leads.jsx, History.jsx), và ẩn/khóa hành động trong
   từng trang (LeadDetail.jsx, Campaigns.jsx, Settings.jsx...).

   LƯU Ý QUAN TRỌNG (Mục XVII — Bảo mật):
   "Kiểm tra quyền ở Back-end, không chỉ ẩn nút trên giao diện."
   Toàn bộ phân quyền dưới đây chỉ là lớp UX ở Front-end (ẩn menu, chặn
   điều hướng, lọc dữ liệu hiển thị) — KHÔNG thay thế cho việc Back-end
   phải tự kiểm tra quyền trên từng API khi có Back-end thật. Đây vẫn là
   bước cần thiết và đúng đắn ở FE, nhưng không được xem là đủ để bảo mật
   dữ liệu một khi có Back-end.
   ============================================================ */

export const ROLES = {
  ADMIN: "Administrator",
  LEADER: "Leader Marketing",
  SALES: "Sales/Admissions",
  MARKETING: "Marketing Staff",
};

/**
 * Ma trận quyền theo vai trò — bám sát từng gạch đầu dòng ở Mục IV.
 * Mỗi khóa là 1 "capability" được dùng lại ở nhiều nơi trong UI.
 */
const MATRIX = {
  [ROLES.ADMIN]: {
    viewAllLeads: true, // "Xem toàn bộ lead."
    viewDashboard: true, // "Xem toàn bộ Dashboard."
    manageUsers: true, // "Quản lý tài khoản."
    manageCourses: true, // "Quản lý khóa học."
    manageSources: true, // "Quản lý nguồn lead."
    manageCampaigns: true, // "Quản lý chiến dịch." — full CRUD
    configureScoring: true, // "Cấu hình quy tắc Lead Scoring."
    exportData: true, // "Xuất dữ liệu."
    viewSystemLogs: true, // "Xem nhật ký hệ thống."
    assignLeads: true, // suy ra từ việc quản lý toàn bộ hệ thống
    viewAllCareHistory: true,
    accessSettings: true,
    accessCampaignsPage: true,
    accessReportsPage: true,
    accessDashboardPage: true,
    accessHistoryPage: true,
  },
  [ROLES.LEADER]: {
    viewAllLeads: true, // "Xem toàn bộ lead."
    viewDashboard: true, // "Xem Dashboard."
    manageUsers: false, // không được liệt kê — Module 1 (tạo/khóa TK) là việc của Admin
    manageCourses: false,
    manageSources: false,
    manageCampaigns: false, // "Theo dõi nguồn và chiến dịch." = xem/theo dõi, không phải tạo/sửa/xóa
    configureScoring: "partial", // "Điều chỉnh MỘT SỐ quy tắc chấm điểm."
    exportData: true, // "Xuất báo cáo."
    viewSystemLogs: false,
    assignLeads: true, // "Phân công lead."
    viewAllCareHistory: true, // "Xem lịch sử tương tác."
    accessSettings: false,
    accessCampaignsPage: true, // xem/theo dõi được, không tạo/xóa
    accessReportsPage: true,
    accessDashboardPage: true,
    accessHistoryPage: true,
  },
  [ROLES.MARKETING]: {
    viewAllLeads: true, // "Xem lead theo chiến dịch" — FE chưa tách lọc riêng, cho xem danh sách chung
    viewDashboard: true, // "Xem Dashboard Marketing."
    manageUsers: false,
    manageCourses: false,
    manageSources: true, // "Xem nguồn lead" + gắn với việc tạo chiến dịch/UTM
    manageCampaigns: true, // "Tạo chiến dịch và đường dẫn UTM."
    configureScoring: false,
    exportData: false, // không được liệt kê rõ cho Marketing Staff
    viewSystemLogs: false,
    assignLeads: false,
    viewAllCareHistory: false, // không được liệt kê; tránh xem nội dung tư vấn của Sales
    editLeadCare: false, // "Không được sửa nội dung tư vấn của Sales nếu không được phân quyền."
    accessSettings: false,
    accessCampaignsPage: true,
    accessReportsPage: true,
    accessDashboardPage: true,
    accessHistoryPage: false,
  },
  [ROLES.SALES]: {
    viewAllLeads: false, // "Xem lead được phân công." — CHỈ lead của mình
    viewDashboard: false, // không được liệt kê trong quyền Sales
    manageUsers: false,
    manageCourses: false,
    manageSources: false,
    manageCampaigns: false,
    configureScoring: false, // "Không có quyền: Thay đổi cấu hình Lead Scoring."
    exportData: false,
    viewSystemLogs: false,
    assignLeads: false, // "Không có quyền phân công/chuyển lead."
    viewAllCareHistory: false, // chỉ xem lịch sử của lead được phân công
    editLeadCare: true, // "Cập nhật trạng thái / Thêm ghi chú / Tạo lịch follow-up."
    deleteCareHistory: false, // không ai được xóa lịch sử, riêng Sales bị nhắc rõ trong doc
    accessSettings: false,
    accessCampaignsPage: false, // không được liệt kê quyền nào liên quan Campaign
    accessReportsPage: false, // không được liệt kê
    accessDashboardPage: false,
    accessHistoryPage: true, // "Xem lịch sử chăm sóc." (giới hạn theo lead được phân công)
  },
};

/** Lấy toàn bộ capability của 1 vai trò — fallback về quyền thấp nhất (Sales) nếu role lạ/chưa đăng nhập. */
function capsOf(role) {
  return MATRIX[role] || MATRIX[ROLES.SALES];
}

/** can(user, "manageUsers") -> true/false/"partial" */
export function can(user, capability) {
  if (!user) return false;
  return !!capsOf(user.role)[capability];
}

/** Có phải Sales/Admissions — dùng nhiều nơi để lọc dữ liệu theo lead được phân công. */
export function isSales(user) {
  return user?.role === ROLES.SALES;
}

export function isAdmin(user) {
  return user?.role === ROLES.ADMIN;
}

/** Trang chủ mặc định sau khi đăng nhập — Sales không có quyền Dashboard nên vào thẳng Leads. */
export function getHomePath(user) {
  return can(user, "accessDashboardPage") ? "/" : "/leads";
}

/**
 * Khai báo menu điều hướng gắn với 1 capability cần có để hiển thị.
 * Sidebar.jsx lọc navItems (mockData.js) qua danh sách path ở đây.
 */
export const PAGE_ACCESS = {
  "/": "accessDashboardPage",
  "/leads": true, // ai đăng nhập cũng xem được (dữ liệu tự lọc theo vai trò bên trong)
  "/campaigns": "accessCampaignsPage",
  "/history": "accessHistoryPage",
  "/reports": "accessReportsPage",
  "/settings": "accessSettings",
  "/profile": true,
};

/** Điều hướng vào path này có được phép với user hiện tại không (dùng cho cả Sidebar lẫn route guard). */
export function canAccessPath(user, path) {
  // Các route có tham số (/leads/:id, /campaigns/:id) — quy về path gốc để tra quyền.
  const base = "/" + (path.split("/")[1] || "");
  const rule = PAGE_ACCESS[base] ?? PAGE_ACCESS[path];
  if (rule === true || rule === undefined) return true;
  return can(user, rule);
}