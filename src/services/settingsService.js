/* ============================================================
   SETTINGS SERVICE — quản lý tài khoản người dùng + nhật ký hoạt
   động cơ bản (Module 1 + audit_logs ở Mục IX).
   ============================================================ */

import { apiFetch, USE_MOCK, mockDelay, ApiError } from "./apiClient.js";
import { users as mockUsers, activityLogs as mockActivityLogs, currentUserProfile } from "../data/mockData.js";

function clone(obj) {
  return typeof structuredClone === "function" ? structuredClone(obj) : JSON.parse(JSON.stringify(obj));
}

/** GET /api/users (tương ứng nhóm "Quản lý tài khoản người dùng" ở Module 1) */
export async function fetchUsers() {
  if (!USE_MOCK) return apiFetch("/users");
  await mockDelay(300);
  return clone(mockUsers);
}

/** PATCH /api/users/{id}/status — khóa/mở tài khoản */
export async function toggleUserStatus(id) {
  if (!USE_MOCK) return apiFetch(`/users/${id}/status`, { method: "PATCH" });
  await mockDelay();
  const idx = mockUsers.findIndex((u) => u.id === id);
  if (idx === -1) throw new ApiError("Không tìm thấy người dùng.", { status: 404 });
  mockUsers[idx].status = mockUsers[idx].status === "Hoạt động" ? "Đã khóa" : "Hoạt động";
  return clone(mockUsers[idx]);
}

/** Cập nhật thông tin tài khoản (họ tên/email/vai trò) — nhóm "Tạo tài khoản/Phân vai trò" ở Module 1. */
export async function updateUser(id, payload) {
  if (!USE_MOCK) return apiFetch(`/users/${id}`, { method: "PUT", body: payload });
  await mockDelay();
  const idx = mockUsers.findIndex((u) => u.id === id);
  if (idx === -1) throw new ApiError("Không tìm thấy người dùng.", { status: 404 });
  mockUsers[idx] = { ...mockUsers[idx], ...payload };
  return clone(mockUsers[idx]);
}

/** Xóa tài khoản — không cho phép xóa tài khoản Admin (ràng buộc nghiệp vụ). */
export async function deleteUser(id) {
  if (!USE_MOCK) return apiFetch(`/users/${id}`, { method: "DELETE" });
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
  if (!USE_MOCK) return apiFetch("/audit-logs");
  await mockDelay(300);
  return clone(mockActivityLogs);
}

/** GET /api/auth/me chi tiết hồ sơ — dùng cho trang Profile */
export async function fetchProfile() {
  if (!USE_MOCK) return apiFetch("/auth/me");
  await mockDelay(300);
  return clone(currentUserProfile);
}

/** PUT /api/users/me — cập nhật hồ sơ cá nhân */
export async function updateProfile(payload) {
  if (!USE_MOCK) return apiFetch("/users/me", { method: "PUT", body: payload });
  await mockDelay();
  Object.assign(currentUserProfile, payload);
  return clone(currentUserProfile);
}