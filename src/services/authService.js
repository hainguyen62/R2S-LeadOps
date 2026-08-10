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

/** POST /api/auth/login */
export async function login({ email, password }) {
  if (!USE_MOCK) {
    const data = await apiFetch("/auth/login", { method: "POST", body: { email, password } });
    setToken(data.token);
    return data.user;
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
export async function registerStaff({ name, email, password, role }) {
  if (!USE_MOCK) {
    return apiFetch("/auth/register", { method: "POST", body: { name, email, password, role } });
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

/** POST /api/auth/logout */
export async function logout() {
  if (!USE_MOCK) {
    await apiFetch("/auth/logout", { method: "POST" });
  } else {
    await mockDelay(150);
  }
  setToken(null);
}

/** GET /api/auth/me — khôi phục phiên khi reload trang */
export async function fetchCurrentUser() {
  if (!USE_MOCK) return apiFetch("/auth/me");
  await mockDelay(150);
  return null; // Demo: không tự khôi phục phiên, luôn yêu cầu đăng nhập lại khi reload
}

/** PUT /api/auth/change-password */
export async function changePassword({ oldPassword, newPassword }) {
  if (!USE_MOCK) return apiFetch("/auth/change-password", { method: "PUT", body: { oldPassword, newPassword } });
  await mockDelay();
  if (oldPassword !== DEMO_PASSWORD) {
    throw new ApiError("Mật khẩu hiện tại không đúng.", {
      status: 400,
      fieldErrors: { oldPassword: "Mật khẩu hiện tại không đúng." },
    });
  }
  return { success: true };
}