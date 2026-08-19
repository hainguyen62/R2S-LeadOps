/* ============================================================
   COURSE SERVICE — quản lý khóa học và học phí (Mục III: Administrator
   "Quản lý khóa học"). Backend (api-1.json) chưa có resource Course kèm giá,
   nên dùng đúng pattern đã áp dụng cho Campaign/Voucher: lưu localStorage,
   độc lập USE_MOCK. Đây là nguồn dữ liệu học phí DUY NHẤT — được LeadDetail
   dùng để tính "Học phí" + "Tổng tiền cuối cùng" của từng lead theo khóa học
   lead đó chọn.
   ============================================================ */

import { ApiError } from "./apiClient.js";
import { courses as seedCourses } from "../data/mockData.js";

const COURSES_KEY = "r2s_leadops_courses_v1";

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

function loadCourses() {
  const storage = getStorage();
  if (!storage) return clone(seedCourses);
  const raw = storage.getItem(COURSES_KEY);
  if (!raw) {
    storage.setItem(COURSES_KEY, JSON.stringify(seedCourses));
    return clone(seedCourses);
  }
  try {
    return JSON.parse(raw);
  } catch {
    return clone(seedCourses);
  }
}

function saveCourses(list) {
  getStorage()?.setItem(COURSES_KEY, JSON.stringify(list));
}

/** Tổng phí phụ thu của 1 khóa học. */
export function sumFees(course) {
  return (course?.fees || []).reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
}

/** Tổng học phí đầy đủ (học phí gốc + toàn bộ phí phụ thu) — CHƯA áp mã giảm giá. */
export function totalWithFees(course) {
  if (!course) return 0;
  return (Number(course.basePrice) || 0) + sumFees(course);
}

export async function fetchCourses() {
  return clone(loadCourses());
}

export async function fetchCourseById(id) {
  const list = await fetchCourses();
  const c = list.find((x) => x.id === Number(id));
  if (!c) throw new ApiError("Không tìm thấy khóa học.", { status: 404 });
  return c;
}

/** Tra học phí theo TÊN khóa học (khớp với trường lead.course) — dùng ở LeadDetail. */
export async function fetchCourseByName(name) {
  if (!name) return null;
  const list = await fetchCourses();
  return list.find((c) => c.name === name) || null;
}

function validateCoursePayload(payload) {
  const fieldErrors = {};
  if (!payload.name?.trim()) fieldErrors.name = "Vui lòng nhập tên khóa học.";
  if (payload.basePrice === "" || payload.basePrice === null || payload.basePrice === undefined || Number(payload.basePrice) < 0) {
    fieldErrors.basePrice = "Vui lòng nhập học phí hợp lệ (≥ 0).";
  }
  (payload.fees || []).forEach((f, idx) => {
    if (!f.name?.trim()) fieldErrors[`fee_${idx}_name`] = "Vui lòng nhập tên phí.";
    if (f.amount === "" || f.amount === null || Number(f.amount) < 0) fieldErrors[`fee_${idx}_amount`] = "Phí phải ≥ 0.";
  });
  if (Object.keys(fieldErrors).length) {
    throw new ApiError("Vui lòng kiểm tra lại thông tin khóa học.", { status: 400, fieldErrors });
  }
}

function normalizeFees(fees) {
  return (fees || [])
    .filter((f) => f.name?.trim())
    .map((f, idx) => ({ id: f.id || idx + 1, name: f.name.trim(), amount: Number(f.amount) || 0 }));
}

export async function createCourse(payload) {
  validateCoursePayload(payload);
  const raw = loadCourses();
  const name = payload.name.trim();
  if (raw.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
    throw new ApiError("Tên khóa học đã tồn tại.", { status: 409, fieldErrors: { name: "Khóa học này đã có trong hệ thống." } });
  }
  const newCourse = {
    id: Date.now(),
    name,
    basePrice: Number(payload.basePrice) || 0,
    fees: normalizeFees(payload.fees),
    status: payload.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
  };
  raw.unshift(newCourse);
  saveCourses(raw);
  return newCourse;
}

export async function updateCourse(id, payload) {
  validateCoursePayload(payload);
  const raw = loadCourses();
  const idx = raw.findIndex((c) => c.id === Number(id));
  if (idx === -1) throw new ApiError("Không tìm thấy khóa học.", { status: 404 });
  const name = payload.name.trim();
  if (raw.some((c) => c.id !== Number(id) && c.name.toLowerCase() === name.toLowerCase())) {
    throw new ApiError("Tên khóa học đã tồn tại.", { status: 409, fieldErrors: { name: "Khóa học này đã có trong hệ thống." } });
  }
  raw[idx] = {
    ...raw[idx],
    name,
    basePrice: Number(payload.basePrice) || 0,
    fees: normalizeFees(payload.fees),
    status: payload.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
  };
  saveCourses(raw);
  return raw[idx];
}

export async function deleteCourse(id) {
  const raw = loadCourses();
  const idx = raw.findIndex((c) => c.id === Number(id));
  if (idx === -1) throw new ApiError("Không tìm thấy khóa học.", { status: 404 });
  const [removed] = raw.splice(idx, 1);
  saveCourses(raw);
  return removed;
}
