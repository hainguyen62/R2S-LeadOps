/* ============================================================
   ROLE / STATUS MAPPING — nguồn DUY NHẤT để quy đổi UserRole/UserStatus
   enum của Backend thật (ADMIN/MANAGER/STAFF, ACTIVE/LOCKED — xem
   components.schemas.UserRole / UserStatus trong OpenAPI spec) sang các
   nhãn tiếng Việt mà toàn bộ UI/permissions.js đang dùng.

   LƯU Ý QUAN TRỌNG: mọi nơi gọi API trả về field "role"/"status" của user
   (authService.fetchCurrentUser, settingsService.fetchProfile/fetchUsers/...)
   ĐỀU PHẢI dùng hàm ở đây, không tự viết map riêng — trước đây từng có 2 bản
   map khác nhau ở authService.js và settingsService.js (authService.js quên
   map hẳn), khiến /auth/me trả "ADMIN" nhưng permissions.js chỉ nhận diện
   "Administrator" -> mọi user (kể cả Admin) bị rơi về quyền Sales thấp nhất.

   HẠN CHẾ CẦN TTS2/BA XÁC NHẬN: Backend hiện chỉ có 3 role (ADMIN/MANAGER/
   STAFF) trong khi FE có 4 role (permissions.js: Administrator/Leader
   Marketing/Sales-Admissions/Marketing Staff) để tách quyền Sales và
   Marketing Staff. Do STAFF không phân biệt được là Sales hay Marketing,
   map dưới đây tạm quy STAFF -> "Sales/Admissions" (giữ đúng theo cách
   settingsService.js làm trước đây). Nghĩa là MỌI tài khoản STAFF thật từ
   Backend sẽ tạm bị coi là Sales/Admissions, kể cả nếu thực tế đó là nhân
   viên Marketing — cần chốt hướng giải quyết (Backend thêm role riêng cho
   Marketing, hoặc FE bỏ hẳn tier "Marketing Staff") trước khi go-live.
   ============================================================ */

export const ROLE_ENUM_TO_LABEL = {
  ADMIN: "Administrator",
  MANAGER: "Leader Marketing",
  STAFF: "Sales/Admissions", // xem HẠN CHẾ ở trên — chưa phân biệt được Marketing Staff
};

export const STATUS_ENUM_TO_LABEL = {
  ACTIVE: "Hoạt động",
  LOCKED: "Đã khóa",
};

/** Map field "role" (UserRole enum) từ response Backend sang nhãn FE. Trả nguyên giá trị nếu không nhận diện được. */
export function mapRoleEnumToLabel(role) {
  return ROLE_ENUM_TO_LABEL[role] || role;
}

/** Map field "status" (UserStatus enum) từ response Backend sang nhãn FE. */
export function mapStatusEnumToLabel(status) {
  return STATUS_ENUM_TO_LABEL[status] || status;
}
