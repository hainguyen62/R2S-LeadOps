/* ============================================================
   NOTIFICATION SERVICE — backend đã có sẵn 4 endpoint, front-end
   trước đây chưa dùng (NotificationBell.jsx tự sinh toàn bộ từ
   mock + tính follow-up cục bộ). Giờ gọi thẳng API thật.
   Phần tính "follow-up đến hạn" vẫn giữ nguyên xử lý cục bộ trong
   NotificationBell.jsx vì backend không có loại thông báo tương
   ứng — chỉ có APPOINTMENT_REMINDER (nhắc lịch hẹn), khác khái
   niệm "follow-up lead" hiện tại.
   ============================================================ */

import { apiFetch, USE_MOCK, mockDelay, toBackendPaging } from "./apiClient.js";

const TYPE_TO_UI = {
  LEAD_HOT: "hot-lead",
  LEAD_ASSIGNED: "assign",
  LEAD_UPDATED: "system",
  APPOINTMENT_CREATED: "system",
  APPOINTMENT_UPDATED: "system",
  APPOINTMENT_CANCELLED: "system",
  APPOINTMENT_REMINDER: "followup",
  APPOINTMENT_COMPLETED: "system",
  SYSTEM: "system",
};

function toVnDateTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("vi-VN");
}

/** NotificationData (backend) -> đúng field UI đang dùng ở NotificationBell.jsx. */
function mapNotificationToUi(n) {
  return {
    id: n.id,
    type: TYPE_TO_UI[n.type] || "system",
    title: n.title,
    desc: n.message,
    time: toVnDateTime(n.createdAt),
    read: !!n.isRead,
    leadId: n.referenceType === "LEAD" ? n.referenceId : undefined,
  };
}

/** GET /notifications — response bọc trong {success, code, message, data: {content, page}} (khác kiểu PageXxxResponse của các module khác). */
export async function fetchNotifications({ page = 1, pageSize = 20, unreadOnly } = {}) {
  if (!USE_MOCK) {
    const res = await apiFetch("/notifications", { params: { unreadOnly, ...toBackendPaging(page, pageSize) } });
    return (res?.data?.content || []).map(mapNotificationToUi);
  }
  await mockDelay(150);
  return [];
}

export async function fetchUnreadCount() {
  if (!USE_MOCK) {
    const res = await apiFetch("/notifications/unread-count");
    return res?.data?.unreadCount ?? 0;
  }
  await mockDelay(100);
  return 0;
}

export async function markNotificationRead(id) {
  if (!USE_MOCK) {
    const res = await apiFetch(`/notifications/${id}/read`, { method: "PATCH" });
    return mapNotificationToUi(res.data);
  }
  await mockDelay(100);
  return null;
}

export async function markAllNotificationsRead() {
  if (!USE_MOCK) {
    const res = await apiFetch("/notifications/read-all", { method: "PATCH" });
    return res?.data?.updatedCount ?? 0;
  }
  await mockDelay(150);
  return 0;
}