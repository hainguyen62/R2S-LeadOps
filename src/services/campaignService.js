/* ============================================================
   CAMPAIGN SERVICE — backend chưa có resource Campaign (chỉ có
   campaignCode dạng chuỗi tự do trong Lead), nên toàn bộ dữ liệu
   campaign được quản lý cục bộ (localStorage) ở đây, độc lập với
   USE_MOCK. Số liệu leads/hotLeads/deposits/registrations được
   tính trực tiếp từ leadService (khớp lead có campaign = tên
   chiến dịch), nên luôn đúng với dữ liệu lead thật tại thời điểm
   gọi, dù đang chạy mock hay API thật.
   ============================================================ */

import { ApiError } from "./apiClient.js";
import { fetchLeads } from "./leadService.js";
import { campaigns as seedCampaigns } from "../data/mockData.js";

const STORAGE_KEY = "r2s_leadops_campaigns_v1";

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

function loadRaw() {
  const storage = getStorage();
  if (!storage) return clone(seedCampaigns);
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = seedCampaigns.map(({ leads, hotLeads, deposits, registrations, ...rest }) => rest);
    storage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return clone(seedCampaigns);
  }
}

function saveRaw(list) {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(STORAGE_KEY, JSON.stringify(list));
}

async function computeStats(campaignName) {
  try {
    const { items } = await fetchLeads({ campaign: campaignName, pageSize: 1000 });
    return {
      leads: items.length,
      hotLeads: items.filter((l) => l.cls === "Lead nóng").length,
      deposits: items.filter((l) => l.status === "Đã đặt cọc").length,
      registrations: items.filter((l) => l.status === "Đã đăng ký").length,
    };
  } catch {
    return { leads: 0, hotLeads: 0, deposits: 0, registrations: 0 };
  }
}

export async function fetchCampaigns() {
  const raw = loadRaw();
  return Promise.all(raw.map(async (c) => ({ ...c, ...(await computeStats(c.name)) })));
}

export async function fetchCampaignById(id) {
  const raw = loadRaw();
  const campaign = raw.find((c) => c.id === Number(id));
  if (!campaign) throw new ApiError("Không tìm thấy chiến dịch.", { status: 404 });
  return { ...campaign, ...(await computeStats(campaign.name)) };
}

/** Xu hướng lead theo ngày, gộp từ chính danh sách lead thật của chiến dịch. */
export async function fetchCampaignTrend(id) {
  const raw = loadRaw();
  const campaign = raw.find((c) => c.id === Number(id));
  if (!campaign) return [];
  const { items } = await fetchLeads({ campaign: campaign.name, pageSize: 1000 });
  const byDay = new Map();
  for (const l of items) {
    const full = (l.date || "").split(" ")[0]; // "dd/mm/yyyy hh:mm" -> "dd/mm/yyyy"
    if (!full) continue;
    byDay.set(full, (byDay.get(full) || 0) + 1);
  }
  return [...byDay.entries()]
    .map(([full, count]) => {
      const [d, m] = full.split("/");
      return { day: `${d}/${m}`, value: count, _full: full }; // "day"/"value" khớp field mà CampaignDetails.jsx (chart + parseTrendDay) đang đọc
    })
    .sort((a, b) => {
      const [d1, m1, y1] = a._full.split("/").map(Number);
      const [d2, m2, y2] = b._full.split("/").map(Number);
      return new Date(y1, m1 - 1, d1) - new Date(y2, m2 - 1, d2);
    })
    .map(({ _full, ...rest }) => rest);
}

export async function createCampaign(payload) {
  if (!payload.name?.trim()) {
    throw new ApiError("Thiếu tên chiến dịch.", { status: 400, fieldErrors: { name: "Vui lòng nhập tên chiến dịch." } });
  }
  const raw = loadRaw();
  const newCampaign = { id: Date.now(), status: "Đang chạy", ...payload };
  raw.unshift(newCampaign);
  saveRaw(raw);
  return { ...newCampaign, ...(await computeStats(newCampaign.name)) };
}

/** Đổi payload.name sẽ làm mất liên kết với lead đã tạo trước đó (lead lưu campaign theo tên cũ). */
export async function updateCampaign(id, payload) {
  const raw = loadRaw();
  const idx = raw.findIndex((c) => c.id === Number(id));
  if (idx === -1) throw new ApiError("Không tìm thấy chiến dịch.", { status: 404 });
  raw[idx] = { ...raw[idx], ...payload };
  saveRaw(raw);
  return { ...raw[idx], ...(await computeStats(raw[idx].name)) };
}

export async function deleteCampaign(id) {
  const raw = loadRaw();
  const idx = raw.findIndex((c) => c.id === Number(id));
  if (idx === -1) throw new ApiError("Không tìm thấy chiến dịch.", { status: 404 });
  const [removed] = raw.splice(idx, 1);
  saveRaw(raw);
  return removed;
}