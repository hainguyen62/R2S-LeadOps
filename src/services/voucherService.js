/* ============================================================
   VOUCHER SERVICE — chương trình giảm giá gắn với lead/chiến dịch.
   Backend (api-1.json) chưa có resource Voucher, nên dùng đúng pattern
   đã áp dụng cho Campaign: lưu localStorage, độc lập USE_MOCK, và tái
   sử dụng leadService (addLeadActivity) để việc áp voucher luôn được
   ghi vào lịch sử chăm sóc như mọi hành động khác trong hệ thống.
   ============================================================ */

import { ApiError } from "./apiClient.js";
import { addLeadActivity } from "./leadService.js";
import { vouchers as seedVouchers, leadStatusOrder } from "../data/mockData.js";
import { getVietnamDateKey, vietnamDateToDate } from "../utils/datetime.js";

const VOUCHERS_KEY = "r2s_leadops_vouchers_v1";
const REDEMPTIONS_KEY = "r2s_leadops_voucher_redemptions_v1";

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

function loadVouchers() {
  const storage = getStorage();
  if (!storage) return clone(seedVouchers);
  const raw = storage.getItem(VOUCHERS_KEY);
  if (!raw) {
    storage.setItem(VOUCHERS_KEY, JSON.stringify(seedVouchers));
    return clone(seedVouchers);
  }
  try {
    return JSON.parse(raw);
  } catch {
    return clone(seedVouchers);
  }
}

function saveVouchers(list) {
  getStorage()?.setItem(VOUCHERS_KEY, JSON.stringify(list));
}

function loadRedemptions() {
  const storage = getStorage();
  if (!storage) return [];
  try {
    return JSON.parse(storage.getItem(REDEMPTIONS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRedemptions(list) {
  getStorage()?.setItem(REDEMPTIONS_KEY, JSON.stringify(list));
}

/** Trạng thái hiển thị suy ra từ ngày hết hạn — tương tự getCampaignDisplayStatus. */
export function getVoucherDisplayStatus(v) {
  if (v.status === "DISABLED") return "Đã tắt";
  const today = vietnamDateToDate(getVietnamDateKey());
  const end = v.endDate ? vietnamDateToDate(v.endDate) : null;
  if (end && !isNaN(end) && today > end) return "Hết hạn";
  const start = v.startDate ? vietnamDateToDate(v.startDate) : null;
  if (start && !isNaN(start) && today < start) return "Sắp diễn ra";
  return "Đang áp dụng";
}

export async function fetchVouchers() {
  const raw = loadVouchers();
  const redemptions = loadRedemptions();
  return raw.map((v) => ({
    ...v,
    usedCount: redemptions.filter((r) => r.voucherId === v.id).length,
    displayStatus: getVoucherDisplayStatus(v),
  }));
}

export async function fetchVoucherById(id) {
  const list = await fetchVouchers();
  const v = list.find((x) => x.id === Number(id));
  if (!v) throw new ApiError("Không tìm thấy voucher.", { status: 404 });
  return v;
}

export async function fetchVoucherRedemptions(voucherId) {
  return clone(loadRedemptions().filter((r) => r.voucherId === Number(voucherId))).reverse();
}

/** Lịch sử voucher đã dùng của 1 lead cụ thể — dùng ở khu vực "Áp dụng voucher" trong LeadDetail. */
export async function fetchLeadVoucherRedemptions(leadId) {
  return clone(loadRedemptions().filter((r) => r.leadId === Number(leadId))).reverse();
}

/** Danh sách voucher ĐANG có thể áp dụng cho 1 lead cụ thể (dùng ở LeadDetail). */
export async function fetchApplicableVouchers(lead) {
  const list = await fetchVouchers();
  const leadStageIdx = leadStatusOrder.indexOf(lead.status);
  return list.filter((v) => {
    if (v.displayStatus !== "Đang áp dụng") return false;
    if (v.courseId && v.courseId !== lead.course) return false;
    if (v.minLeadStage && leadStageIdx < leadStatusOrder.indexOf(v.minLeadStage)) return false;
    if (v.usageLimit && v.usedCount >= v.usageLimit) return false;
    return true;
  });
}

function validateVoucherPayload(payload) {
  const fieldErrors = {};
  if (!payload.code?.trim()) fieldErrors.code = "Vui lòng nhập mã voucher.";
  if (!payload.name?.trim()) fieldErrors.name = "Vui lòng nhập tên chương trình.";
  if (!payload.discountValue || Number(payload.discountValue) <= 0) fieldErrors.discountValue = "Giá trị giảm phải lớn hơn 0.";
  if (payload.discountType === "PERCENT" && Number(payload.discountValue) > 100) {
    fieldErrors.discountValue = "Giảm theo % không được vượt quá 100.";
  }
  if (Object.keys(fieldErrors).length) {
    throw new ApiError("Vui lòng kiểm tra lại thông tin voucher.", { status: 400, fieldErrors });
  }
}

export async function createVoucher(payload) {
  validateVoucherPayload(payload);
  const raw = loadVouchers();
  const code = payload.code.trim().toUpperCase();
  if (raw.some((v) => v.code.toUpperCase() === code)) {
    throw new ApiError("Mã voucher đã tồn tại.", { status: 409, fieldErrors: { code: "Mã này đã được dùng cho voucher khác." } });
  }
  const newVoucher = {
    id: Date.now(),
    code,
    name: payload.name.trim(),
    description: payload.description?.trim() || "",
    discountType: payload.discountType === "FIXED_AMOUNT" ? "FIXED_AMOUNT" : "PERCENT",
    discountValue: Number(payload.discountValue),
    courseId: payload.courseId || null,
    campaignId: payload.campaignId ? Number(payload.campaignId) : null,
    startDate: payload.startDate || null,
    endDate: payload.endDate || null,
    usageLimit: payload.usageLimit ? Number(payload.usageLimit) : null,
    usageLimitPerLead: payload.usageLimitPerLead ? Number(payload.usageLimitPerLead) : 1,
    minLeadStage: payload.minLeadStage || "Đang cân nhắc",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
  };
  raw.unshift(newVoucher);
  saveVouchers(raw);
  return newVoucher;
}

export async function updateVoucher(id, payload) {
  validateVoucherPayload(payload);
  const raw = loadVouchers();
  const idx = raw.findIndex((v) => v.id === Number(id));
  if (idx === -1) throw new ApiError("Không tìm thấy voucher.", { status: 404 });
  const code = payload.code.trim().toUpperCase();
  if (raw.some((v) => v.id !== Number(id) && v.code.toUpperCase() === code)) {
    throw new ApiError("Mã voucher đã tồn tại.", { status: 409, fieldErrors: { code: "Mã này đã được dùng cho voucher khác." } });
  }
  raw[idx] = {
    ...raw[idx],
    ...payload,
    code,
    discountValue: Number(payload.discountValue),
    campaignId: payload.campaignId ? Number(payload.campaignId) : null,
    usageLimit: payload.usageLimit ? Number(payload.usageLimit) : null,
    usageLimitPerLead: payload.usageLimitPerLead ? Number(payload.usageLimitPerLead) : 1,
  };
  saveVouchers(raw);
  return raw[idx];
}

export async function updateVoucherStatus(id, status) {
  const raw = loadVouchers();
  const idx = raw.findIndex((v) => v.id === Number(id));
  if (idx === -1) throw new ApiError("Không tìm thấy voucher.", { status: 404 });
  raw[idx].status = status;
  saveVouchers(raw);
  return raw[idx];
}

/**
 * Điều kiện để 1 voucher được phép xóa:
 *  - Chưa có học viên/lead nào sử dụng (usedCount === 0) — xóa voucher đã
 *    dùng sẽ làm mồ côi dữ liệu lịch sử/thống kê (voucher_redemptions,
 *    "Hiệu quả voucher" ở Reports...).
 *  - Trạng thái hiển thị khác "Đang áp dụng" — voucher đang chạy có thể
 *    đang được lead khác thao tác áp mã cùng lúc; phải tắt (DISABLED) hoặc
 *    để hết hạn trước, tránh xóa nhầm 1 chương trình đang active.
 * Trả về { allowed, reason } để UI (nút Xóa, tooltip) dùng trực tiếp mà
 * không cần đoán lại logic, và để deleteVoucher() dùng làm nguồn chân lý
 * khi validate trước khi xóa thật.
 */
export function getVoucherDeleteConstraint(v) {
  if (!v) return { allowed: false, reason: "Không tìm thấy voucher." };
  if (v.usedCount > 0) {
    return { allowed: false, reason: "Không thể xóa: voucher này đã có học viên sử dụng." };
  }
  const displayStatus = v.displayStatus || getVoucherDisplayStatus(v);
  if (displayStatus === "Đang áp dụng") {
    return { allowed: false, reason: 'Không thể xóa voucher đang ở trạng thái "Đang áp dụng". Hãy tắt voucher trước khi xóa.' };
  }
  return { allowed: true, reason: null };
}

export async function deleteVoucher(id) {
  const raw = loadVouchers();
  const idx = raw.findIndex((v) => v.id === Number(id));
  if (idx === -1) throw new ApiError("Không tìm thấy voucher.", { status: 404 });

  const target = raw[idx];
  const redemptions = loadRedemptions();
  const usedCount = redemptions.filter((r) => r.voucherId === target.id).length;
  const { allowed, reason } = getVoucherDeleteConstraint({ ...target, usedCount });
  if (!allowed) {
    throw new ApiError(reason, { status: 409 });
  }

  const [removed] = raw.splice(idx, 1);
  saveVouchers(raw);
  return removed;
}

/** Số tiền được giảm — export để FE (LeadDetail) preview trước khi thực sự áp mã. */
export function computeDiscount(voucher, orderValue) {
  const value = Number(orderValue) || 0;
  const raw = voucher.discountType === "PERCENT" ? (value * voucher.discountValue) / 100 : voucher.discountValue;
  return Math.min(raw, value); // không giảm vượt quá giá trị đơn hàng
}

/**
 * Áp voucher cho 1 lead — validate đầy đủ (còn hạn/còn lượt/đúng khóa/lead
 * chưa vượt usageLimitPerLead), ghi voucher_redemptions, và ghi 1 activity
 * "Áp dụng voucher {code}..." vào lịch sử chăm sóc của lead (nhất quán với
 * cách hệ thống ghi log mọi hành động khác — xem leadService.appendActivity).
 */
export async function redeemVoucher(lead, { voucherCode, orderValue, actorName } = {}) {
  const raw = loadVouchers();
  const voucher = raw.find((v) => v.code.toUpperCase() === (voucherCode || "").trim().toUpperCase());
  if (!voucher) throw new ApiError("Mã voucher không tồn tại.", { status: 404, fieldErrors: { voucherCode: "Không tìm thấy mã voucher này." } });

  const displayStatus = getVoucherDisplayStatus(voucher);
  if (displayStatus !== "Đang áp dụng") {
    throw new ApiError(`Voucher "${voucher.code}" hiện đang ${displayStatus.toLowerCase()}, không thể áp dụng.`, { status: 400 });
  }
  if (voucher.courseId && voucher.courseId !== lead.course) {
    throw new ApiError(`Voucher "${voucher.code}" chỉ áp dụng cho khóa "${voucher.courseId}".`, { status: 400 });
  }
  const leadStageIdx = leadStatusOrder.indexOf(lead.status);
  if (voucher.minLeadStage && leadStageIdx < leadStatusOrder.indexOf(voucher.minLeadStage)) {
    throw new ApiError(`Voucher "${voucher.code}" chỉ áp dụng khi lead đã đạt trạng thái "${voucher.minLeadStage}" trở lên.`, { status: 400 });
  }

  const redemptions = loadRedemptions();
  const totalUsed = redemptions.filter((r) => r.voucherId === voucher.id).length;
  if (voucher.usageLimit && totalUsed >= voucher.usageLimit) {
    throw new ApiError(`Voucher "${voucher.code}" đã hết lượt sử dụng.`, { status: 400 });
  }
  const usedByThisLead = redemptions.filter((r) => r.voucherId === voucher.id && r.leadId === lead.id).length;
  if (usedByThisLead >= (voucher.usageLimitPerLead || 1)) {
    throw new ApiError(`Lead này đã dùng voucher "${voucher.code}" đủ số lần cho phép.`, { status: 400 });
  }

  const discountAmount = computeDiscount(voucher, orderValue);
  const redemption = {
    id: Date.now(),
    voucherId: voucher.id,
    voucherCode: voucher.code,
    leadId: lead.id,
    leadName: lead.name,
    orderValue: Number(orderValue) || 0,
    discountAmount,
    redeemedBy: actorName || "Hệ thống",
    redeemedAt: new Date().toISOString(),
  };
  redemptions.push(redemption);
  saveRedemptions(redemptions);

  await addLeadActivity(lead.id, {
    text: `Áp dụng voucher "${voucher.code}" (${voucher.name}) — giảm ${discountAmount.toLocaleString("vi-VN")}đ trên đơn ${Number(orderValue || 0).toLocaleString("vi-VN")}đ`,
    channel: actorName || "Hệ thống",
    activityType: "NOTE",
  });

  return redemption;
}

/** Thống kê hiệu quả voucher — dùng cho card "Hiệu quả voucher" ở Reports. */
export async function fetchVoucherStats() {
  const vouchers = await fetchVouchers();
  const redemptions = loadRedemptions();
  return vouchers
    .map((v) => {
      const rs = redemptions.filter((r) => r.voucherId === v.id);
      return {
        id: v.id,
        code: v.code,
        name: v.name,
        redemptions: rs.length,
        totalDiscount: rs.reduce((sum, r) => sum + r.discountAmount, 0),
      };
    })
    .filter((s) => s.redemptions > 0)
    .sort((a, b) => b.redemptions - a.redemptions);
}
