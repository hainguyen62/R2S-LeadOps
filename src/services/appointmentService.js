/* ============================================================
   APPOINTMENT SERVICE — backend có sẵn 6 endpoint (AppointmentData).
   Khi USE_MOCK=true, dữ liệu được giả lập cục bộ (localStorage,
   seed sẵn vài lịch hẹn gắn với lead mock có thật) để demo đúng
   hành vi mà không cần API thật — khớp với cách các service khác
   trong dự án đã mô phỏng REST API ở giai đoạn chưa có Back-end.
   ============================================================ */

import { apiFetch, USE_MOCK, mockDelay, ApiError, toBackendPaging } from "./apiClient.js";
import { leads as mockLeads } from "../data/mockData.js";

export const APPOINTMENT_CHANNEL_ENUM = ["PHONE", "MESSENGER", "ZALO", "EMAIL", "GOOGLE_MEET", "OFFLINE", "OTHER"];
export const APPOINTMENT_STATUS_ENUM = ["SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"];
export const APPOINTMENT_RESULT_ENUM = ["INTERESTED", "NOT_INTERESTED", "CALLBACK", "SUCCESS", "FAILED", "OTHER"];

const CHANNEL_LABEL = { PHONE: "Điện thoại", MESSENGER: "Messenger", ZALO: "Zalo", EMAIL: "Email", GOOGLE_MEET: "Google Meet", OFFLINE: "Gặp trực tiếp", OTHER: "Khác" };
const STATUS_LABEL = { SCHEDULED: "Đã đặt lịch", CONFIRMED: "Đã xác nhận", COMPLETED: "Đã hoàn thành", CANCELLED: "Đã hủy", NO_SHOW: "Lead không đến" };
const RESULT_LABEL = { INTERESTED: "Đang cân nhắc", NOT_INTERESTED: "Không phù hợp", CALLBACK: "Hẹn gọi lại", SUCCESS: "Thành công", FAILED: "Thất bại", OTHER: "Khác" };

/** AppointmentData (backend) -> field dễ hiển thị hơn ở UI (nhãn tiếng Việt cho channel/status/result). */
function mapAppointmentToUi(a) {
  if (!a) return a;
  return {
    id: a.id,
    leadId: a.leadId,
    leadName: a.leadName,
    ownerId: a.ownerId,
    ownerName: a.ownerName,
    title: a.title,
    appointmentAt: a.appointmentAt,
    durationMinutes: a.durationMinutes,
    channel: a.channel,
    channelLabel: CHANNEL_LABEL[a.channel] || a.channel,
    status: a.status,
    statusLabel: STATUS_LABEL[a.status] || a.status,
    result: a.result || undefined,
    resultLabel: a.result ? RESULT_LABEL[a.result] || a.result : undefined,
    note: a.note || undefined,
    cancelReason: a.cancelReason || undefined,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}

function unwrapEnvelopedPage(res) {
  const content = res?.data?.content || [];
  const meta = res?.data?.page || {};
  return { items: content.map(mapAppointmentToUi), total: meta.totalElements ?? content.length, page: (meta.page ?? 0) + 1, pageSize: meta.size ?? content.length };
}

/* ---------------- Kho dữ liệu mock (localStorage) ---------------- */

const STORAGE_KEY = "r2s_leadops_appointments_v1";

function hoursFromNow(h) {
  return new Date(Date.now() + h * 3600000).toISOString();
}

function seedAppointments() {
  const l1 = mockLeads.find((l) => l.id === 1);
  const l3 = mockLeads.find((l) => l.id === 3);
  const l5 = mockLeads.find((l) => l.id === 5);
  return [
    {
      id: 1001,
      leadId: l1?.id ?? 1,
      leadName: l1?.name ?? "Nguyễn Minh Anh",
      ownerId: 1,
      ownerName: "Tư vấn viên A",
      title: "Tư vấn lộ trình khóa Java Backend",
      appointmentAt: hoursFromNow(20),
      durationMinutes: 30,
      channel: "PHONE",
      status: "SCHEDULED",
      result: null,
      note: "Lead quan tâm học phí và lịch khai giảng.",
      cancelReason: null,
      createdAt: hoursFromNow(-6),
      updatedAt: hoursFromNow(-6),
    },
    {
      id: 1002,
      leadId: l5?.id ?? 5,
      leadName: l5?.name ?? "Võ Hoàng Nam",
      ownerId: 1,
      ownerName: "Tư vấn viên A",
      title: "Demo khóa Data Analyst qua Google Meet",
      appointmentAt: hoursFromNow(48),
      durationMinutes: 45,
      channel: "GOOGLE_MEET",
      status: "CONFIRMED",
      result: null,
      note: null,
      cancelReason: null,
      createdAt: hoursFromNow(-24),
      updatedAt: hoursFromNow(-2),
    },
    {
      id: 1003,
      leadId: l3?.id ?? 3,
      leadName: l3?.name ?? "Lê Thu Hà",
      ownerId: 2,
      ownerName: "Tư vấn viên B",
      title: "Tư vấn xác nhận đăng ký khóa Flutter",
      appointmentAt: hoursFromNow(-72),
      durationMinutes: 30,
      channel: "ZALO",
      status: "COMPLETED",
      result: "SUCCESS",
      note: "Lead đã đồng ý đăng ký sau buổi tư vấn.",
      cancelReason: null,
      createdAt: hoursFromNow(-96),
      updatedAt: hoursFromNow(-72),
    },
  ];
}

function getStorage() {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

function loadRaw() {
  const storage = getStorage();
  if (!storage) return seedAppointments();
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = seedAppointments();
    storage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return seedAppointments();
  }
}

function saveRaw(list) {
  getStorage()?.setItem(STORAGE_KEY, JSON.stringify(list));
}

function paginate(items, page, pageSize) {
  const start = (page - 1) * pageSize;
  return { items: items.slice(start, start + pageSize).map(mapAppointmentToUi), total: items.length, page, pageSize };
}

/* ---------------- API ---------------- */

/** POST /leads/{id}/appointments */
export async function createAppointment(leadId, { title, appointmentAt, durationMinutes, channel, note }) {
  if (!APPOINTMENT_CHANNEL_ENUM.includes(channel)) {
    throw new ApiError("Kênh lịch hẹn không hợp lệ.", { status: 400, fieldErrors: { channel: "Chọn 1 trong: " + APPOINTMENT_CHANNEL_ENUM.join(", ") } });
  }
  if (!USE_MOCK) {
    const res = await apiFetch(`/leads/${leadId}/appointments`, {
      method: "POST",
      body: { title, appointmentAt, durationMinutes, channel, note: note || undefined },
    });
    return mapAppointmentToUi(res.data);
  }
  await mockDelay();
  const lead = mockLeads.find((l) => String(l.id) === String(leadId));
  const raw = loadRaw();
  const newAppt = {
    id: Date.now(),
    leadId: Number(leadId),
    leadName: lead?.name || "",
    ownerId: null,
    ownerName: lead?.assignee || null,
    title,
    appointmentAt,
    durationMinutes: Number(durationMinutes) || 30,
    channel,
    status: "SCHEDULED",
    result: null,
    note: note || null,
    cancelReason: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  raw.unshift(newAppt);
  saveRaw(raw);
  return mapAppointmentToUi(newAppt);
}

/** GET /leads/{id}/appointments */
export async function fetchLeadAppointments(leadId, { page = 1, pageSize = 20, status } = {}) {
  if (!USE_MOCK) {
    const res = await apiFetch(`/leads/${leadId}/appointments`, { params: { status, ...toBackendPaging(page, pageSize) } });
    return unwrapEnvelopedPage(res);
  }
  await mockDelay(200);
  const raw = loadRaw()
    .filter((a) => String(a.leadId) === String(leadId))
    .filter((a) => !status || a.status === status)
    .sort((a, b) => new Date(b.appointmentAt) - new Date(a.appointmentAt));
  return paginate(raw, page, pageSize);
}

/** GET /appointments/my — mock lọc theo tên hiện tại (backend tự suy từ JWT) */
export async function fetchMyAppointments({ page = 1, pageSize = 20, from, to, status } = {}, currentUserName) {
  if (!USE_MOCK) {
    const res = await apiFetch("/appointments/my", { params: { from, to, status, ...toBackendPaging(page, pageSize) } });
    return unwrapEnvelopedPage(res);
  }
  await mockDelay(200);
  const raw = loadRaw()
    .filter((a) => !currentUserName || a.ownerName === currentUserName)
    .filter((a) => !status || a.status === status)
    .filter((a) => !from || new Date(a.appointmentAt) >= new Date(from))
    .filter((a) => !to || new Date(a.appointmentAt) <= new Date(to))
    .sort((a, b) => new Date(a.appointmentAt) - new Date(b.appointmentAt));
  return paginate(raw, page, pageSize);
}

/** GET /appointments/{id} */
export async function fetchAppointmentById(id) {
  if (!USE_MOCK) return mapAppointmentToUi((await apiFetch(`/appointments/${id}`)).data);
  await mockDelay();
  const found = loadRaw().find((a) => String(a.id) === String(id));
  if (!found) throw new ApiError("Không tìm thấy lịch hẹn.", { status: 404 });
  return mapAppointmentToUi(found);
}

/** PUT /appointments/{id} */
export async function updateAppointment(id, { title, appointmentAt, durationMinutes, channel, note }) {
  if (!USE_MOCK) {
    const res = await apiFetch(`/appointments/${id}`, { method: "PUT", body: { title, appointmentAt, durationMinutes, channel, note: note || undefined } });
    return mapAppointmentToUi(res.data);
  }
  await mockDelay();
  const raw = loadRaw();
  const idx = raw.findIndex((a) => String(a.id) === String(id));
  if (idx === -1) throw new ApiError("Không tìm thấy lịch hẹn.", { status: 404 });
  raw[idx] = { ...raw[idx], title, appointmentAt, durationMinutes, channel, note: note || null, updatedAt: new Date().toISOString() };
  saveRaw(raw);
  return mapAppointmentToUi(raw[idx]);
}

/** PATCH /appointments/{id}/cancel */
export async function cancelAppointment(id, reason) {
  if (!USE_MOCK) {
    const res = await apiFetch(`/appointments/${id}/cancel`, { method: "PATCH", body: { reason } });
    return mapAppointmentToUi(res.data);
  }
  await mockDelay();
  const raw = loadRaw();
  const idx = raw.findIndex((a) => String(a.id) === String(id));
  if (idx === -1) throw new ApiError("Không tìm thấy lịch hẹn.", { status: 404 });
  raw[idx] = { ...raw[idx], status: "CANCELLED", cancelReason: reason, updatedAt: new Date().toISOString() };
  saveRaw(raw);
  return mapAppointmentToUi(raw[idx]);
}

/** PATCH /appointments/{id}/complete */
export async function completeAppointment(id, { result, note }) {
  if (!APPOINTMENT_RESULT_ENUM.includes(result)) {
    throw new ApiError("Kết quả lịch hẹn không hợp lệ.", { status: 400 });
  }
  if (!USE_MOCK) {
    const res = await apiFetch(`/appointments/${id}/complete`, { method: "PATCH", body: { result, note: note || undefined } });
    return mapAppointmentToUi(res.data);
  }
  await mockDelay();
  const raw = loadRaw();
  const idx = raw.findIndex((a) => String(a.id) === String(id));
  if (idx === -1) throw new ApiError("Không tìm thấy lịch hẹn.", { status: 404 });
  raw[idx] = { ...raw[idx], status: "COMPLETED", result, note: note || raw[idx].note, updatedAt: new Date().toISOString() };
  saveRaw(raw);
  return mapAppointmentToUi(raw[idx]);
}