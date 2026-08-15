/* ============================================================
   API CLIENT — tầng gọi HTTP dùng chung cho toàn bộ services/*.
   Khi Back-end (TTS2) gửi API thật, CHỈ CẦN đổi:
     1) VITE_API_BASE_URL trong file .env
     2) VITE_USE_MOCK=false trong file .env
   Không cần sửa bất kỳ page/component nào vì tất cả đều gọi qua
   các hàm trong services/*.js, không import mockData trực tiếp.
   ============================================================ */

// Server thật khai báo base path "/api/v1" (xem "servers" trong OpenAPI spec
// của TTS2), KHÔNG phải "/api" như bản nháp ban đầu.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

// Khi true (mặc định lúc chưa có Back-end): mọi service dùng mock data
// + độ trễ giả lập. Khi Back-end sẵn sàng, đổi VITE_USE_MOCK=false trong .env.
export const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? "true") !== "false";

/** Lỗi API chuẩn hóa — mọi service ném lỗi loại này để UI xử lý đồng nhất. */
export class ApiError extends Error {
  constructor(message, { status, code, fieldErrors } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    // fieldErrors: { phone: "Số điện thoại không hợp lệ", ... } — map thẳng vào formErrors trên UI
    this.fieldErrors = fieldErrors || null;
  }
}

/** Đọc JWT hiện tại (nếu có) — TTS2 dùng Spring Security + JWT theo kiến trúc đề xuất (Mục VIII). */
function getToken() {
  return localStorage.getItem("r2s_token") || null;
}

export function setToken(token) {
  if (token) localStorage.setItem("r2s_token", token);
  else localStorage.removeItem("r2s_token");
}

/**
 * Gọi REST API thật. Dùng bên trong services/* khi USE_MOCK = false.
 * path: '/leads', '/auth/login'... (khớp danh sách endpoint ở Mục X kế hoạch)
 */
export async function apiFetch(path, { method = "GET", body, params, signal } = {}) {
  const url = new URL(API_BASE_URL + path, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
    });
  }

  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(url.toString(), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    // Lỗi mạng (mất kết nối, CORS, server down...)
    throw new ApiError("Không thể kết nối máy chủ. Vui lòng kiểm tra kết nối mạng.", { status: 0 });
  }

  // 204 No Content
  if (res.status === 204) return null;

  let data = null;
  try {
    data = await res.json();
  } catch {
    // response không có body JSON hợp lệ
  }

  if (!res.ok) {
    const message = data?.message || defaultMessageForStatus(res.status);
    throw new ApiError(message, {
      status: res.status,
      code: data?.code,
      // ErrorResponse thật (theo OpenAPI spec) không có field "fieldErrors"/"errors"
      // riêng — lỗi validate từng field nằm trong "details" (object tự do).
      fieldErrors: data?.details || null,
    });
  }

  return data;
}

function defaultMessageForStatus(status) {
  switch (status) {
    case 400:
      return "Dữ liệu gửi lên không hợp lệ.";
    case 401:
      return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    case 403:
      return "Bạn không có quyền thực hiện thao tác này.";
    case 404:
      return "Không tìm thấy dữ liệu.";
    case 409:
      return "Dữ liệu bị trùng hoặc xung đột.";
    case 500:
    default:
      return "Có lỗi xảy ra từ máy chủ. Vui lòng thử lại sau.";
  }
}

/**
 * Quy đổi tham số phân trang phía UI (page bắt đầu từ 1) sang tham số
 * query mà backend Spring Data mong đợi (page bắt đầu từ 0).
 */
export function toBackendPaging(page = 1, pageSize = 10) {
  return { page: Math.max(0, Number(page) - 1), size: Number(pageSize) };
}

/**
 * Chuẩn hoá response phân trang kiểu Spring Data (PageXxxResponse):
 * { content: [...], page: { page, size, totalElements, totalPages, first, last } }
 * thành { items, total, page, pageSize, totalPages } — page trả ra vẫn tính từ 1
 * để khớp phần còn lại của UI (component phân trang hiện có).
 */
export function unwrapPage(pageResponse) {
  const content = pageResponse?.content || [];
  const meta = pageResponse?.page || {};
  return {
    items: content,
    total: meta.totalElements ?? content.length,
    page: (meta.page ?? 0) + 1,
    pageSize: meta.size ?? content.length,
    totalPages: meta.totalPages ?? 1,
  };
}

/** Dùng trong các service mock để giả lập độ trễ mạng ~300-700ms. */
export function mockDelay(ms = 400 + Math.random() * 300) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}