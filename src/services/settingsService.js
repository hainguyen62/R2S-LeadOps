/* ============================================================
   SETTINGS SERVICE — quản lý tài khoản người dùng + nhật ký hoạt
   động cơ bản (Module 1 + audit_logs ở Mục IX).
   ============================================================ */

import { apiFetch, USE_MOCK, mockDelay, ApiError, unwrapPage, toBackendPaging } from "./apiClient.js";
import { users as mockUsers, activityLogs as mockActivityLogs, leads as mockLeads } from "../data/mockData.js";
import { mapLeadResponseToUi } from "./leadService.js";
import { mapRoleEnumToLabel, mapStatusEnumToLabel } from "../utils/roleMapping.js";
import { normalizeEmail } from "../utils/validators.js";

function clone(obj) {
  return typeof structuredClone === "function" ? structuredClone(obj) : JSON.parse(JSON.stringify(obj));
}

const ROLE_LABEL_TO_ENUM = { Administrator: "ADMIN", "Leader Marketing": "MANAGER" };

/** UserResponse (backend) -> đúng field UI đang dùng (name, role, status tiếng Việt). Cách map role chỉ là suy đoán tạm (STAFF -> Sales/Admissions), cần TTS2 xác nhận — xem utils/roleMapping.js. */
function mapUserResponseToUi(u) {
  if (!u) return u;
  return {
    id: u.id,
    name: u.fullName,
    email: u.email,
    role: mapRoleEnumToLabel(u.role),
    status: mapStatusEnumToLabel(u.status),
  };
}

/** GET /admin/users — Filter theo role/status (đúng theo APIs_check_list.xlsx) */
export async function fetchUsers() {
  if (!USE_MOCK) {
    const res = await apiFetch("/admin/users", { params: { size: 200 } });
    return unwrapPage(res).items.map(mapUserResponseToUi);
  }
  await mockDelay(300);
  return clone(mockUsers);
}

/** GET /admin/users/{userId} — xem chi tiết 1 user */
export async function fetchUserById(id) {
  if (!USE_MOCK) return mapUserResponseToUi(await apiFetch(`/admin/users/${id}`));
  await mockDelay(200);
  const found = mockUsers.find((u) => u.id === Number(id));
  if (!found) throw new ApiError("Không tìm thấy người dùng.", { status: 404 });
  return clone(found);
}

/** GET /admin/users/{userId}/leads — chỉ ADMIN/MANAGER được gọi (Mục IV) */
export async function fetchUserLeads(userId, { page = 1, pageSize = 20 } = {}) {
  if (!USE_MOCK) {
    const res = await apiFetch(`/admin/users/${userId}/leads`, { params: toBackendPaging(page, pageSize) });
    const { items, ...rest } = unwrapPage(res);
    return { items: items.map(mapLeadResponseToUi), ...rest };
  }
  await mockDelay(250);
  const user = mockUsers.find((u) => u.id === Number(userId));
  const items = mockLeads.filter((l) => l.assignee === user?.name);
  return { items: clone(items), total: items.length, page: 1, pageSize };
}

/** PUT /admin/users/{userId}/lock — đổi status thành LOCKED, user không login được */
export async function lockUser(id) {
  if (!USE_MOCK) return mapUserResponseToUi(await apiFetch(`/admin/users/${id}/lock`, { method: "PUT" }));
  await mockDelay();
  const idx = mockUsers.findIndex((u) => u.id === id);
  if (idx === -1) throw new ApiError("Không tìm thấy người dùng.", { status: 404 });
  mockUsers[idx].status = "Đã khóa";
  return clone(mockUsers[idx]);
}

/** PUT /admin/users/{userId}/unlock — trả lại ACTIVE */
export async function unlockUser(id) {
  if (!USE_MOCK) return mapUserResponseToUi(await apiFetch(`/admin/users/${id}/unlock`, { method: "PUT" }));
  await mockDelay();
  const idx = mockUsers.findIndex((u) => u.id === id);
  if (idx === -1) throw new ApiError("Không tìm thấy người dùng.", { status: 404 });
  mockUsers[idx].status = "Hoạt động";
  return clone(mockUsers[idx]);
}

/** PUT /admin/users/{userId}/reset-password — Admin đặt mật khẩu mới cho user */
export async function resetUserPassword(id, newPassword) {
  if (!USE_MOCK) {
    await apiFetch(`/admin/users/${id}/reset-password`, { method: "PUT", body: { newPassword } });
    return { success: true };
  }
  await mockDelay();
  const idx = mockUsers.findIndex((u) => u.id === id);
  if (idx === -1) throw new ApiError("Không tìm thấy người dùng.", { status: 404 });
  if (!newPassword || String(newPassword).length < 8) {
    throw new ApiError("Mật khẩu mới cần tối thiểu 8 ký tự.", { status: 400, fieldErrors: { newPassword: "Mật khẩu mới cần tối thiểu 8 ký tự." } });
  }
  return { success: true };
}

/** Trạng thái tài khoản đang hoạt động hay đã bị khóa — chuẩn hóa vì Backend có thể trả "ACTIVE"/"LOCKED". */
export function isUserActive(status) {
  const s = String(status || "").trim().toLowerCase();
  return s === "hoạt động" || s === "active";
}

/** Cập nhật thông tin tài khoản (họ tên/email/vai trò) — nhóm "Tạo tài khoản/Phân vai trò" ở Module 1. */
export async function updateUser(id, payload) {
  if (!USE_MOCK) throw new ApiError('Backend chưa có API sửa thông tin user (chỉ có lock/unlock/reset-password riêng lẻ).', { status: 501 });
  await mockDelay();
  const idx = mockUsers.findIndex((u) => u.id === id);
  if (idx === -1) throw new ApiError("Không tìm thấy người dùng.", { status: 404 });
  // Chuẩn hóa email về chữ thường trước khi lưu (Mục IX.2) — trước đây
  // spread thẳng payload nên "Sửa thông tin" tài khoản lưu nguyên hoa/thường.
  const normalizedPayload = { ...payload };
  if (payload.email !== undefined) normalizedPayload.email = payload.email?.trim() ? normalizeEmail(payload.email) : payload.email;
  mockUsers[idx] = { ...mockUsers[idx], ...normalizedPayload };
  return clone(mockUsers[idx]);
}

/** Xóa tài khoản — không cho phép xóa tài khoản Admin (ràng buộc nghiệp vụ). */
export async function deleteUser(id) {
  if (!USE_MOCK) throw new ApiError('Backend chưa có API xóa user — dùng lockUser() để khóa tài khoản thay thế.', { status: 501 });
  await mockDelay();
  const idx = mockUsers.findIndex((u) => u.id === id);
  if (idx === -1) throw new ApiError("Không tìm thấy người dùng.", { status: 404 });
  if (mockUsers[idx].role === "Administrator") {
    throw new ApiError("Không thể xóa tài khoản Admin.", { status: 403 });
  }
  const [removed] = mockUsers.splice(idx, 1);
  return clone(removed);
}

/** GET /api/audit-logs — nhật ký hoạt động cơ bản */
export async function fetchActivityLogs() {
  if (!USE_MOCK) throw new ApiError('Backend chưa có API "audit-logs" trong bản spec hiện tại.', { status: 501 });
  await mockDelay(300);
  return clone(mockActivityLogs);
}

/**
 * GET /api/auth/me chi tiết hồ sơ — dùng cho trang Profile.
 * userId: id của tài khoản ĐANG đăng nhập (lấy từ useAuth() ở UI) — chỉ dùng
 * cho nhánh mock để tra đúng người dùng hiện tại trong mockUsers; nhánh
 * Backend thật không cần vì "/auth/me" đã tự xác định qua Bearer token.
 * BUG ĐÃ SỬA: trước đây hàm này luôn trả về 1 object tĩnh "currentUserProfile"
 * (hard-code "Tư vấn viên A") nên dù đăng nhập tài khoản nào, trang Profile
 * cũng chỉ hiện đúng 1 hồ sơ đó.
 */
export async function fetchProfile(userId) {
  if (!USE_MOCK) return mapUserResponseToUi(await apiFetch("/auth/me"));
  await mockDelay(300);
  const found = mockUsers.find((u) => u.id === Number(userId));
  if (!found) throw new ApiError("Không tìm thấy người dùng.", { status: 404 });
  return clone(found);
}

/**
 * PUT /api/users/me — cập nhật hồ sơ cá nhân.
 * userId: xem ghi chú ở fetchProfile() — chỉ cần cho nhánh mock để biết
 * sửa đúng bản ghi nào trong mockUsers.
 */
export async function updateProfile(payload, userId) {
  if (!USE_MOCK) throw new ApiError('Backend chưa có API tự sửa hồ sơ cá nhân ("/users/me").', { status: 501 });
  await mockDelay();
  const idx = mockUsers.findIndex((u) => u.id === Number(userId));
  if (idx === -1) throw new ApiError("Không tìm thấy người dùng.", { status: 404 });
  // Chuẩn hóa email về chữ thường trước khi lưu, cùng quy tắc với createLead/updateUser.
  const normalizedPayload = { ...payload };
  if (payload.email !== undefined) normalizedPayload.email = payload.email?.trim() ? normalizeEmail(payload.email) : payload.email;
  mockUsers[idx] = { ...mockUsers[idx], ...normalizedPayload };
  return clone(mockUsers[idx]);
}