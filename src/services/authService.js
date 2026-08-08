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
