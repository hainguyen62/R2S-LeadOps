/* ============================================================
   CAMPAIGN SERVICE — khớp Mục X.7 (Master data: campaigns) trong
   kế hoạch triển khai.
   ============================================================ */

import { apiFetch, USE_MOCK, mockDelay, ApiError } from "./apiClient.js";
import { campaigns as mockCampaigns, campaignTrends as mockCampaignTrends } from "../data/mockData.js";

function clone(obj) {
  return typeof structuredClone === "function" ? structuredClone(obj) : JSON.parse(JSON.stringify(obj));
}

/** GET /api/campaigns */
export async function fetchCampaigns() {
  if (!USE_MOCK) return apiFetch("/campaigns");
  await mockDelay(350);
  return clone(mockCampaigns);
}

/** GET /api/campaigns (chi tiết 1 campaign — dùng chung dữ liệu list ở mock) */
export async function fetchCampaignById(id) {
  if (!USE_MOCK) return apiFetch(`/campaigns/${id}`);
  await mockDelay(300);
  const campaign = mockCampaigns.find((c) => c.id === Number(id));
  if (!campaign) throw new ApiError("Không tìm thấy chiến dịch.", { status: 404 });
  return clone(campaign);
}

/** Xu hướng lead theo ngày của 1 chiến dịch — dùng cho biểu đồ CampaignDetails */
export async function fetchCampaignTrend(id) {
  if (!USE_MOCK) return apiFetch(`/campaigns/${id}/trend`);
  await mockDelay(300);
  return clone(mockCampaignTrends[id] || []);
}

/** POST /api/campaigns */
export async function createCampaign(payload) {
  if (!USE_MOCK) return apiFetch("/campaigns", { method: "POST", body: payload });
  await mockDelay();
  if (!payload.name?.trim()) {
    throw new ApiError("Thiếu tên chiến dịch.", { status: 400, fieldErrors: { name: "Vui lòng nhập tên chiến dịch." } });
  }
  const newCampaign = {
    id: Date.now(),
    leads: 0,
    hotLeads: 0,
    deposits: 0,
    registrations: 0,
    status: "Đang chạy",
    ...payload,
  };
  mockCampaigns.unshift(newCampaign);
  return clone(newCampaign);
}

/** PUT /api/campaigns/{id} */
export async function updateCampaign(id, payload) {
  if (!USE_MOCK) return apiFetch(`/campaigns/${id}`, { method: "PUT", body: payload });
  await mockDelay();
  const idx = mockCampaigns.findIndex((c) => c.id === Number(id));
  if (idx === -1) throw new ApiError("Không tìm thấy chiến dịch.", { status: 404 });
  mockCampaigns[idx] = { ...mockCampaigns[idx], ...payload };
  return clone(mockCampaigns[idx]);
}

/** Xóa chiến dịch — dùng cho dữ liệu thử nghiệm nội bộ (chưa có trong danh sách endpoint chuẩn của kế hoạch). */
export async function deleteCampaign(id) {
  if (!USE_MOCK) return apiFetch(`/campaigns/${id}`, { method: "DELETE" });
  await mockDelay();
  const idx = mockCampaigns.findIndex((c) => c.id === Number(id));
  if (idx === -1) throw new ApiError("Không tìm thấy chiến dịch.", { status: 404 });
  const [removed] = mockCampaigns.splice(idx, 1);
  return clone(removed);
}
