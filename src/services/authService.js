/* ============================================================
   AUTH SERVICE — khớp Mục X.1 (Authentication) và Module 1
   (Authentication và tài khoản) trong kế hoạch triển khai.
   ============================================================ */

import { apiFetch, USE_MOCK, mockDelay, setToken, ApiError } from "./apiClient.js";
import { users as mockUsers } from "../data/mockData.js";

// Tài khoản test cho môi trường Development/Demo — xem Login.jsx.
// Mật khẩu demo dùng chung: "123456" (KHÔNG phải cách lưu mật khẩu thật;
// Back-end thật phải mã hóa một chiều theo Mục XVII).
const DEMO_PASSWORD = "123456";

/** POST /auth/login */
export async function login({ email, password }) {
  if (!USE_MOCK) {
    // LoginResponse thật: { success, code, message, data: { token, tokenType } }
    // — KHÔNG trả kèm thông tin user như bản mock, nên phải gọi thêm /auth/me.
    const res = await apiFetch("/auth/login", { method: "POST", body: { email, password } });
    setToken(res?.data?.token);
    return fetchCurrentUser();
  }

  await mockDelay();
  const account = mockUsers.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
  if (!account) {
    throw new ApiError("Email hoặc mật khẩu không đúng.", {
      status: 401,
      fieldErrors: { email: "Không tìm thấy tài khoản với email này." },
    });
  }
  if (password !== DEMO_PASSWORD) {
    throw new ApiError("Email hoặc mật khẩu không đúng.", {
      status: 401,
      fieldErrors: { password: "Mật khẩu không đúng." },
    });
  }
  setToken(`mock-token-${account.id}`);
  return { id: account.id, name: account.name, role: account.role, email: account.email };
}

/**
 * POST /api/auth/register — Đăng ký tài khoản nhân viên (Module 1: "Tạo tài khoản").
 * Lưu ý: đây là form tự đăng ký cho nhân viên nội bộ (Sales/Marketing), KHÔNG phải
 * form "Đăng ký nhận tư vấn" cho khách hàng (đó là luồng ở Register.jsx/leadService.js).
 * Trong hệ thống thật, nên yêu cầu duyệt bởi Administrator trước khi tài khoản active
 * (Mục XVII bảo mật) — bản mock này cho active ngay để tiện demo.
 */
/**
 * POST /auth/create-account — Đúng spec: chỉ ADMIN mới gọi được API này (Bearer
 * token của Admin), dùng để tạo tài khoản cho Staff/Manager — KHÔNG phải form
 * tự đăng ký công khai như tên hàm/comment cũ mô tả.
 * role phải là 1 trong 3 giá trị enum UserRole: ADMIN, MANAGER, STAFF — khác
 * hoàn toàn các nhãn tiếng Việt tự do đang dùng ở mock ("Sales/Admissions",
 * "Leader Marketing"...). roleToUserRoleEnum() bên dưới chỉ là suy đoán tạm,
 * cần TTS2 xác nhận lại cách map đúng.
 */
function roleToUserRoleEnum(role) {
  if (["ADMIN", "MANAGER", "STAFF"].includes(role)) return role;
  if (role === "Administrator") return "ADMIN";
  if (role === "Leader Marketing") return "MANAGER";
  return "STAFF";
}

export async function registerStaff({ name, email, password, role }) {
  if (!USE_MOCK) {
    return apiFetch("/auth/create-account", {
      method: "POST",
      body: { fullName: name, email, password, role: roleToUserRoleEnum(role) },
    });
  }

  await mockDelay();
  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = mockUsers.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (existing) {
    throw new ApiError("Email này đã được đăng ký tài khoản trong hệ thống.", {
      status: 409,
      fieldErrors: { email: "Email đã tồn tại." },
    });
  }

  const newUser = {
    id: mockUsers.length ? Math.max(...mockUsers.map((u) => u.id)) + 1 : 1,
    name,
    role: role || "Sales/Admissions",
    email: normalizedEmail,
    status: "Hoạt động",
  };
  mockUsers.push(newUser);
  return { id: newUser.id, name: newUser.name, role: newUser.role, email: newUser.email };
}

/** POST /auth/logout */
export async function logout() {
  if (!USE_MOCK) {
    await apiFetch("/auth/logout", { method: "POST" });
  } else {
    await mockDelay(150);
  }
  setToken(null);
}

/** GET /auth/me — khôi phục phiên khi reload trang */
export async function fetchCurrentUser() {
  if (!USE_MOCK) return apiFetch("/auth/me");
  await mockDelay(150);
  return null; // Demo: không tự khôi phục phiên, luôn yêu cầu đăng nhập lại khi reload
}

/** POST /auth/forgot-password — trả 202, không tiết lộ email có tồn tại hay không */
export async function forgotPassword({ email }) {
  if (!USE_MOCK) {
    await apiFetch("/auth/forgot-password", { method: "POST", body: { email } });
    return { success: true };
  }
  await mockDelay(300);
  return { success: true };
}
export async function changePassword({ oldPassword, newPassword }) {
  if (!USE_MOCK) return apiFetch("/auth/change-password", { method: "POST", body: { oldPassword, newPassword } });
  await mockDelay();
  if (oldPassword !== DEMO_PASSWORD) {
    throw new ApiError("Mật khẩu hiện tại không đúng.", {
      status: 400,
      fieldErrors: { oldPassword: "Mật khẩu hiện tại không đúng." },
    });
  }
  return { success: true };
}