import { describe, it, expect, beforeEach } from "vitest";
import {
  getWebhookConfig,
  regenerateWebhookToken,
  receiveGoogleFormWebhook,
  fetchWebhookEvents,
  clearWebhookEvents,
} from "./webhookService.js";
import { findDuplicateLead } from "./leadService.js";
import { ApiError } from "./apiClient.js";

// webhookService.js là nơi xử lý Mục XIII (nhận lead từ Google Form qua Apps
// Script). Đây là logic nghiệp vụ THẬT (xác thực, chống trùng, merge), không
// chỉ là gọi API xuyên qua — nên rủi ro cao nếu có bug và xứng đáng có test.
//
// Cần chạy dưới environment "jsdom" (xem vite.config.js) vì code dùng
// window.localStorage để lưu secret token + nhật ký webhook.

// Mỗi test dùng số điện thoại RIÊNG để không đụng lead của các file test khác
// (leadService.test.js dùng dải 0909990xxx) và không đụng nhau giữa các test
// trong chính file này.

beforeEach(() => {
  // Reset sạch localStorage trước mỗi test để secret token / log webhook
  // không rò rỉ giữa các test (tránh test này ảnh hưởng kết quả test kia).
  window.localStorage.clear();
});

describe("getWebhookConfig / regenerateWebhookToken", () => {
  it("tự sinh secret token ở lần gọi đầu tiên và giữ nguyên ở các lần gọi sau (persist qua localStorage)", () => {
    const first = getWebhookConfig();
    expect(first.secretToken).toBeTruthy();
    expect(typeof first.secretToken).toBe("string");

    const second = getWebhookConfig();
    expect(second.secretToken).toBe(first.secretToken);
  });

  it("cấp lại token mới sẽ vô hiệu hóa token cũ ngay lập tức", async () => {
    const { secretToken: oldToken } = getWebhookConfig();
    const { secretToken: newToken } = regenerateWebhookToken();

    expect(newToken).not.toBe(oldToken);

    // Token cũ giờ phải bị từ chối (401) — đúng mô tả trong Integrations.jsx
    await expect(
      receiveGoogleFormWebhook({
        secretToken: oldToken,
        fullName: "Test User",
        phone: "0912340001",
      })
    ).rejects.toMatchObject({ status: 401 });
  });
});

describe("receiveGoogleFormWebhook — xác thực & validate", () => {
  it("từ chối (401) khi thiếu secretToken", async () => {
    await expect(
      receiveGoogleFormWebhook({ fullName: "Test User", phone: "0912340002" })
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("từ chối (401) khi secretToken sai", async () => {
    getWebhookConfig(); // đảm bảo đã có token hợp lệ được sinh ra
    await expect(
      receiveGoogleFormWebhook({
        secretToken: "token-sai-be-t",
        fullName: "Test User",
        phone: "0912340003",
      })
    ).rejects.toMatchObject({ status: 401 });
  });

  it("từ chối (400) khi thiếu fullName — thường do đổi tên câu hỏi trên Google Form mà quên cập nhật Apps Script", async () => {
    const { secretToken } = getWebhookConfig();
    await expect(
      receiveGoogleFormWebhook({ secretToken, phone: "0912340004" })
    ).rejects.toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
  });

  it("từ chối (400) khi thiếu cả phone lẫn email", async () => {
    const { secretToken } = getWebhookConfig();
    await expect(
      receiveGoogleFormWebhook({ secretToken, fullName: "Không Có Liên Hệ" })
    ).rejects.toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
  });

  it("chấp nhận khi chỉ có email, không có phone (giống rule validateLeadForm)", async () => {
    const { secretToken } = getWebhookConfig();
    const result = await receiveGoogleFormWebhook({
      secretToken,
      fullName: "Chỉ Có Email",
      email: "chi-co-email@example.com",
    });
    expect(result.status).toBe("ok");
    expect(result.event.processingStatus).toBe("SUCCESS_CREATED");
  });
});

describe("receiveGoogleFormWebhook — tạo lead mới & chống trùng (Module 3)", () => {
  it("tạo lead mới thành công khi số điện thoại chưa tồn tại, gán đúng nguồn Google Form", async () => {
    const { secretToken } = getWebhookConfig();
    const result = await receiveGoogleFormWebhook({
      secretToken,
      formResponseId: "resp-001",
      fullName: "Nguyễn Văn A",
      phone: "0912340005",
      email: "nguyenvana@example.com",
      course: "ReactJS",
      city: "Hà Nội",
    });

    expect(result.status).toBe("ok");
    expect(result.event.processingStatus).toBe("SUCCESS_CREATED");
    expect(result.lead.source).toBe("Google Form");
    expect(result.lead.phone).toBeDefined();
  });

  it("KHÔNG tạo lead mới nếu số điện thoại đã trùng lead có sẵn — chỉ gộp thêm 1 tương tác (đúng nguyên tắc Module 3)", async () => {
    const { secretToken } = getWebhookConfig();

    // Tạo lead gốc trước qua chính webhook để có 1 lead trùng sẵn trong hệ thống
    const first = await receiveGoogleFormWebhook({
      secretToken,
      formResponseId: "resp-002",
      fullName: "Trần Thị B",
      phone: "0912340006",
    });
    expect(first.event.processingStatus).toBe("SUCCESS_CREATED");

    // Gửi lại lần 2 với cùng số điện thoại nhưng formResponseId khác (giả lập
    // khách điền form 2 lần) -> phải merge vào lead cũ, không tạo lead mới.
    const second = await receiveGoogleFormWebhook({
      secretToken,
      formResponseId: "resp-003",
      fullName: "Trần Thị B",
      phone: "0912340006",
      course: "Tiếng Anh giao tiếp",
    });

    expect(second.event.processingStatus).toBe("SUCCESS_MERGED");
    expect(second.lead.id).toBe(first.lead.id);

    // Xác nhận thật sự chỉ có 1 lead cho số điện thoại này (không tạo bản ghi thứ 2)
    const dup = await findDuplicateLead({ phone: "0912340006" });
    expect(dup).not.toBeNull();
    expect(dup.lead.id).toBe(first.lead.id);
  });

  it("bỏ qua (SKIPPED_DUPLICATE_EVENT) khi Google gửi lại đúng 1 formResponseId đã xử lý thành công — tránh tạo trùng do Google retry khi timeout/lỗi mạng", async () => {
    const { secretToken } = getWebhookConfig();
    const payload = {
      secretToken,
      formResponseId: "resp-duplicate-retry",
      fullName: "Lê Văn C",
      phone: "0912340007",
    };

    const first = await receiveGoogleFormWebhook(payload);
    expect(first.event.processingStatus).toBe("SUCCESS_CREATED");

    // Google gửi lại nguyên payload (retry) — phải bị skip, không tạo thêm lead/hoạt động
    const second = await receiveGoogleFormWebhook(payload);
    expect(second.status).toBe("skipped");
    expect(second.event.processingStatus).toBe("SKIPPED_DUPLICATE_EVENT");
  });
});

describe("fetchWebhookEvents / clearWebhookEvents", () => {
  it("ghi lại nhật ký theo thứ tự mới nhất lên đầu và giới hạn đúng theo 'limit'", async () => {
    const { secretToken } = getWebhookConfig();
    await receiveGoogleFormWebhook({ secretToken, formResponseId: "e1", fullName: "Log 1", phone: "0912340008" });
    await receiveGoogleFormWebhook({ secretToken, formResponseId: "e2", fullName: "Log 2", phone: "0912340009" });
    await receiveGoogleFormWebhook({ secretToken, formResponseId: "e3", fullName: "Log 3", phone: "0912340010" });

    const events = await fetchWebhookEvents({ limit: 2 });
    expect(events).toHaveLength(2);
    // Mới nhất (e3) phải đứng đầu danh sách
    expect(events[0].externalEventId).toBe("e3");
  });

  it("xóa toàn bộ nhật ký nhưng không ảnh hưởng secret token đang dùng", async () => {
    const { secretToken } = getWebhookConfig();
    await receiveGoogleFormWebhook({ secretToken, formResponseId: "e4", fullName: "Log 4", phone: "0912340011" });

    clearWebhookEvents();

    const events = await fetchWebhookEvents();
    expect(events).toHaveLength(0);
    // Token không bị xóa theo
    expect(getWebhookConfig().secretToken).toBe(secretToken);
  });
});
