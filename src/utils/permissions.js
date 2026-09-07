/* ============================================================
   PERMISSIONS — khớp Mục IV (ĐỐI TƯỢNG SỬ DỤNG VÀ PHÂN QUYỀN) trong
   "Kế hoạch triển khai dự án R2S LeadOps".

   Nguồn dữ liệu duy nhất cho phân quyền phía FE: route guard (App.jsx),
   menu điều hướng (Sidebar.jsx), lọc dữ liệu theo vai trò (Leads.jsx,
   History.jsx), và ẩn/khóa hành động trong từng trang.

   LƯU Ý (Mục XVII — Bảo mật): đây chỉ là lớp UX ở Front-end, không thay
   thế việc Back-end phải tự kiểm tra quyền trên từng API.
   ============================================================ */

export const ROLES = {
  ADMIN: "Administrator",
  LEADER: "Leader Marketing",
  SALES: "Sales/Admissions",
  MARKETING: "Marketing Staff",
};

/** Ma trận quyền theo vai trò — mỗi khóa là 1 capability dùng lại trong UI. */
const MATRIX = {
  [ROLES.ADMIN]: {
    viewAllLeads: true,
    viewDashboard: true,
    manageUsers: true,
    manageCourses: true,
    manageSources: true,
    configureScoring: true,
    exportData: true,
    viewSystemLogs: true,
    assignLeads: true,
    viewAllCareHistory: true,
    accessSettings: true,
    accessReportsPage: true,
    accessDashboardPage: true,
    accessHistoryPage: true,
    // Cấu hình webhook (secret token) mang tính bảo mật/kỹ thuật — chỉ Admin.
    accessIntegrationsPage: true,
    manageVouchers: true,
    accessVouchersPage: true,
  },
  [ROLES.LEADER]: {
    viewAllLeads: true,
    viewDashboard: true,
    manageUsers: false,
    manageCourses: false,
    manageSources: false,
    configureScoring: "partial",
    exportData: true,
    viewSystemLogs: false,
    assignLeads: true,
    viewAllCareHistory: true,
    accessSettings: false,
    accessReportsPage: true,
    accessDashboardPage: true,
    accessHistoryPage: true,
    manageVouchers: true,
    accessVouchersPage: true,
  },
  [ROLES.MARKETING]: {
    viewAllLeads: true,
    viewDashboard: true,
    manageUsers: false,
    manageCourses: false,
    manageSources: true,
    configureScoring: false,
    exportData: false,
    viewSystemLogs: false,
    assignLeads: false,
    viewAllCareHistory: false,
    editLeadCare: false, // "Không được sửa nội dung tư vấn của Sales nếu không được phân quyền."
    accessSettings: false,
    accessReportsPage: true,
    accessDashboardPage: true,
    accessHistoryPage: false,
  },
  [ROLES.SALES]: {
    viewAllLeads: false, // chỉ lead được phân công
    viewDashboard: false,
    manageUsers: false,
    manageCourses: false,
    manageSources: false,
    configureScoring: false,
    exportData: false,
    viewSystemLogs: false,
    assignLeads: false,
    viewAllCareHistory: false,
    editLeadCare: true,
    deleteCareHistory: false,
    accessSettings: false,
    accessReportsPage: false,
    accessDashboardPage: false,
    accessHistoryPage: true,
  },
};

/** Toàn bộ capability của 1 vai trò — fallback về quyền thấp nhất (Sales) nếu role lạ. */
function capsOf(role) {
  return MATRIX[role] || MATRIX[ROLES.SALES];
}

/** can(user, "manageUsers") -> true/false/"partial" */
export function can(user, capability) {
  if (!user) return false;
  return !!capsOf(user.role)[capability];
}

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

/** Khai báo menu điều hướng gắn với 1 capability cần có để hiển thị. */
export const PAGE_ACCESS = {
  "/": "accessDashboardPage",
  "/leads": true,
  "/appointments": true,
  "/history": "accessHistoryPage",
  "/reports": "accessReportsPage",
  "/settings": "accessSettings",
  "/integrations": "accessIntegrationsPage",
  "/vouchers": "accessVouchersPage",
  "/courses": "manageCourses",
  "/profile": true,
};

/** Điều hướng vào path này có được phép với user hiện tại không (dùng cho cả Sidebar lẫn route guard). */
export function canAccessPath(user, path) {
  // Route có tham số (/leads/:id) — quy về path gốc để tra quyền.
  const base = "/" + (path.split("/")[1] || "");
  const rule = PAGE_ACCESS[base] ?? PAGE_ACCESS[path];
  if (rule === true || rule === undefined) return true;
  return can(user, rule);
}
