/* ============================================================
   WEBHOOK SERVICE — tiếp nhận lead từ nguồn BÊN THỨ 3 (Mục XIII tài
   liệu BA: "Landing Page/Google Form/ManyChat... -> Webhook R2S LeadOps").

   Backend thật (api-1.json) CHƯA có endpoint /webhooks/* nào, nên toàn bộ
   phần này chạy dưới dạng "webhook nội bộ" ở FE: lưu cấu hình + log vào
   localStorage (giống cách campaignService.js đang xử lý resource Campaign
   khi chưa có Back-end), và tái sử dụng leadService (createLead/
   findDuplicateLead/addLeadActivity) để lead tạo ra đi đúng luồng chấm điểm/
   chống trùng như lead nhập tay — không tạo 1 luồng dữ liệu riêng lẻ.

   Khi Back-end có endpoint POST /api/webhooks/google-form thật:
     - Google Apps Script sẽ gọi thẳng lên Back-end (không qua FE nữa).
     - Hàm receiveGoogleFormWebhook() dưới đây có thể xóa hoàn toàn.
     - fetchWebhookEvents()/fetchWebhookConfig() đổi sang gọi API thật.
   ============================================================ */

import { ApiError } from "./apiClient.js";
import { createLead, findDuplicateLead, addLeadActivity } from "./leadService.js";

const EVENTS_KEY = "r2s_leadops_webhook_events_v1";
const CONFIG_KEY = "r2s_leadops_webhook_config_v1";

function clone(obj) {
  return typeof structuredClone === "function" ? structuredClone(obj) : JSON.parse(JSON.stringify(obj));
}

function getStorage() {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

function loadEvents() {
  const storage = getStorage();
  if (!storage) return [];
  try {
    return JSON.parse(storage.getItem(EVENTS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveEvents(list) {
  getStorage()?.setItem(EVENTS_KEY, JSON.stringify(list.slice(0, 200))); // giữ tối đa 200 log gần nhất
}

function randomToken() {
  return Array.from({ length: 24 }, () => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 62)]).join("");
}

/** Cấu hình webhook (secret token dùng để Apps Script xác thực khi gọi vào). */
export function getWebhookConfig() {
  const storage = getStorage();
  if (!storage) return { secretToken: "" };
  let raw = storage.getItem(CONFIG_KEY);
  if (!raw) {
    raw = JSON.stringify({ secretToken: randomToken() });
    storage.setItem(CONFIG_KEY, raw);
  }
  return JSON.parse(raw);
}

/** Cấp lại secret token mới — vô hiệu hóa token cũ (nếu URL Apps Script từng bị lộ). */
export function regenerateWebhookToken() {
  const config = { secretToken: randomToken() };
  getStorage()?.setItem(CONFIG_KEY, JSON.stringify(config));
  return config;
}

export async function fetchWebhookEvents({ limit = 50 } = {}) {
  return clone(loadEvents().slice(0, limit));
}

/** Xóa toàn bộ nhật ký webhook (chỉ xóa log — không ảnh hưởng secret token hay lead đã tạo). */
export function clearWebhookEvents() {
  getStorage()?.removeItem(EVENTS_KEY);
}

/**
 * Nhận payload từ Google Apps Script (trigger onFormSubmit của Google Form).
 * payload dự kiến (đặt tên cột trong Google Sheet trùng các key này):
 *   { fullName, phone, email, course, studyGoal, city, campaign, secretToken, formResponseId }
 *
 * Luồng xử lý đúng Mục XIII.1 + Module 3 (chống trùng):
 *   1. Xác thực secretToken.
 *   2. Chặn xử lý trùng theo formResponseId (Google gửi lại do lỗi mạng/timeout).
 *   3. Validate tối thiểu (phải có tên + (phone hoặc email)).
 *   4. Kiểm tra lead trùng (theo SĐT/email đã chuẩn hóa) — nếu trùng thì CHỈ ghi
 *      nhận thêm 1 tương tác mới (không tạo lead mới), đúng nguyên tắc Module 3.
 *   5. Nếu là lead mới, gọi createLead() — đi đúng luồng chấm điểm/khởi tạo
 *      signals như lead nhập tay, để không lệch dữ liệu với các nguồn khác.
 */
export async function receiveGoogleFormWebhook(payload = {}) {
  const events = loadEvents();
  const eventId = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const baseEvent = {
    id: eventId,
    source: "GOOGLE_FORM",
    externalEventId: payload.formResponseId || null,
    payload: clone(payload),
    receivedAt: new Date().toISOString(),
    processingStatus: "PROCESSING",
    errorMessage: null,
    leadId: null,
  };

  const fail = (message, code) => {
    baseEvent.processingStatus = "FAILED";
    baseEvent.errorMessage = message;
    saveEvents([baseEvent, ...events]);
    throw new ApiError(message, { status: code === "UNAUTHORIZED" ? 401 : 400, code });
  };

  // 1) Xác thực secret token
  const config = getWebhookConfig();
  if (!payload.secretToken || payload.secretToken !== config.secretToken) {
    return fail("Secret token không đúng hoặc thiếu.", "UNAUTHORIZED");
  }

  // 2) Chống xử lý trùng nếu Google gửi lại đúng 1 responseId
  if (payload.formResponseId && events.some((e) => e.externalEventId === payload.formResponseId && e.processingStatus === "SUCCESS")) {
    baseEvent.processingStatus = "SKIPPED_DUPLICATE_EVENT";
    baseEvent.errorMessage = "Đã xử lý responseId này trước đó — bỏ qua để tránh tạo trùng.";
    saveEvents([baseEvent, ...events]);
    return { status: "skipped", event: baseEvent };
  }

  // 3) Validate tối thiểu — có tên và (phone hoặc email), tránh tạo lead rác
  // khi Form đổi câu hỏi/cột mà quên cập nhật mapping.
  if (!payload.fullName?.trim()) {
    return fail('Thiếu "fullName" trong payload — kiểm tra lại tên cột trong Google Sheet.', "VALIDATION_ERROR");
  }
  if (!payload.phone?.trim() && !payload.email?.trim()) {
    return fail("Thiếu cả số điện thoại và email — không đủ thông tin liên hệ.", "VALIDATION_ERROR");
  }

  try {
    // 4) Check trùng — theo đúng Module 3 tài liệu BA
    const dup = await findDuplicateLead({ phone: payload.phone, email: payload.email });
    let lead;
    if (dup) {
      lead = dup.lead;
      await addLeadActivity(lead.id, {
        text: `Nhận tương tác mới từ Google Form${payload.course ? ` — quan tâm khóa "${payload.course}"` : ""}`,
        channel: "Google Form",
        activityType: "NOTE",
      });
      baseEvent.processingStatus = "SUCCESS_MERGED";
    } else {
      // 5) Lead thật sự mới
      lead = await createLead({
        name: payload.fullName.trim(),
        course: payload.course || "Chưa xác định",
        source: "Google Form",
        phone: payload.phone,
        email: payload.email,
        campaign: payload.campaign,
        studyGoal: payload.studyGoal,
        city: payload.city,
        note: "Lead tạo tự động từ Google Form qua webhook.",
      });
      baseEvent.processingStatus = "SUCCESS_CREATED";
    }
    baseEvent.leadId = lead.id;
    saveEvents([baseEvent, ...events]);
    return { status: "ok", lead, event: baseEvent };
  } catch (err) {
    return fail(err.message || "Lỗi không xác định khi xử lý webhook.", "PROCESSING_ERROR");
  }
}