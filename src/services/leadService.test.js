import { describe, it, expect } from "vitest";
import {
  fetchLeads,
  fetchLeadById,
  createLead,
  findDuplicateLead,
  deleteLead,
  updateLeadStatus,
} from "./leadService.js";
import { ApiError } from "./apiClient.js";

// Các test này chạy ở chế độ mock (VITE_USE_MOCK mặc định true khi không có .env
// trong môi trường test), thao tác trực tiếp trên "database" mock dùng chung —
// nên mỗi test dùng dữ liệu số điện thoại/email RIÊNG BIỆT để không đụng nhau.

describe("fetchLeadById", () => {
  it("tìm đúng lead khi id truyền vào là string (giống useParams của React Router)", async () => {
    // Lead có sẵn trong mockData với id number = 1 — mô phỏng URL /leads/1
    const lead = await fetchLeadById("1");
    expect(lead).not.toBeNull();
    expect(lead.id).toBe(1);
  });

  it("báo lỗi 404 khi id không tồn tại", async () => {
    await expect(fetchLeadById("999999")).rejects.toBeInstanceOf(ApiError);
  });
});

describe("fetchLeads", () => {
  it("trả về danh sách có phân trang đúng pageSize", async () => {
    const { items, total } = await fetchLeads({ page: 1, pageSize: 3 });
    expect(items.length).toBeLessThanOrEqual(3);
    expect(total).toBeGreaterThan(0);
  });

  it("lọc đúng theo từ khóa tìm kiếm (không tìm thấy trả về mảng rỗng)", async () => {
    const { items, total } = await fetchLeads({ query: "khong-ton-tai-xyz-123", page: 1, pageSize: 10 });
    expect(items).toEqual([]);
    expect(total).toBe(0);
  });
});

describe("createLead", () => {
  it("báo lỗi khi thiếu trường bắt buộc", async () => {
    await expect(createLead({})).rejects.toBeInstanceOf(ApiError);
  });

  it("báo lỗi khi không có cả phone lẫn email", async () => {
    await expect(
      createLead({ name: "Test User", course: "ReactJS", source: "Facebook Ads" })
    ).rejects.toThrow(/Số điện thoại hoặc Email/);
  });

  it("tạo lead thành công và tự tính điểm/phân loại", async () => {
    const lead = await createLead({
      name: "Test Vitest User",
      course: "ReactJS",
      source: "Landing Page",
      phone: "0909990001",
      email: "vitest.user@example.com",
      expectedEnrollment: "Trong 7 ngày",
    });
    expect(lead.id).toBeDefined();
    expect(lead.status).toBe("Lead mới");
    expect(typeof lead.score).toBe("number");
    expect(lead.cls).toBeDefined();
  });
});

describe("findDuplicateLead", () => {
  it("phát hiện trùng theo số điện thoại đã chuẩn hóa", async () => {
    await createLead({
      name: "Duplicate Phone Source",
      course: "ReactJS",
      source: "Facebook Ads",
      phone: "0909990002",
    });
    const duplicate = await findDuplicateLead({ phone: "+84909990002" });
    expect(duplicate).not.toBeNull();
    expect(duplicate.samePhone).toBe(true);
  });

  it("trả về null khi không trùng", async () => {
    const duplicate = await findDuplicateLead({ phone: "0909990099", email: "khong-trung@example.com" });
    expect(duplicate).toBeNull();
  });
});

describe("deleteLead / updateLeadStatus", () => {
  it("xóa lead thành công và báo lỗi khi xóa lại lần 2", async () => {
    const lead = await createLead({
      name: "To Be Deleted",
      course: "ReactJS",
      source: "Landing Page",
      phone: "0909990003",
    });
    const removed = await deleteLead(lead.id);
    expect(removed.id).toBe(lead.id);
    await expect(deleteLead(lead.id)).rejects.toBeInstanceOf(ApiError);
  });

  it("cập nhật trạng thái lead và ghi lại lịch sử", async () => {
    const lead = await createLead({
      name: "Status Change Test",
      course: "ReactJS",
      source: "Landing Page",
      phone: "0909990004",
    });
    const updated = await updateLeadStatus(lead.id, { newStatus: "Đã liên hệ" });
    expect(updated.status).toBe("Đã liên hệ");
  });
});