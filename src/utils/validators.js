/* ============================================================
   VALIDATORS — dùng chung cho mọi form (Login, Register, Leads...).
   Bám theo "Tiêu chí chấp nhận" Module 1, Module 2 và các trường
   hợp Front-end/API Test ở Mục XVI của kế hoạch triển khai:
     - Thiếu số điện thoại và email
     - Email sai định dạng
     - Mật khẩu tối thiểu, không lưu dạng thuần (áp dụng phía BE,
       FE chỉ chặn mật khẩu quá ngắn/yếu trước khi gửi đi)
   ============================================================ */

// Chấp nhận các dạng phổ biến: 0901234567, 0901 234 567, +84901234567
const PHONE_REGEX = /^(\+?84|0)\d{9,10}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value) {
  if (!value) return false;
  return EMAIL_REGEX.test(String(value).trim());
}

export function isValidPhone(value) {
  if (!value) return false;
  const normalized = String(value).replace(/[\s.-]/g, "");
  return PHONE_REGEX.test(normalized);
}

/** Chuẩn hóa số điện thoại về dạng 0xxxxxxxxx — khớp quy tắc "chuẩn hóa số điện thoại" (Mục IX.2). */
export function normalizePhone(value) {
  if (!value) return "";
  let v = String(value).replace(/[\s.-]/g, "");
  if (v.startsWith("+84")) v = "0" + v.slice(3);
  else if (v.startsWith("84")) v = "0" + v.slice(2);
  return v;
}

/** Chuẩn hóa email về chữ thường — khớp quy tắc dữ liệu (Mục IX.2). */
export function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export function isRequired(value) {
  return typeof value === "string" ? value.trim().length > 0 : value !== undefined && value !== null;
}

/**
 * Validate form tạo/sửa lead — Thông tin bắt buộc theo Module 2:
 * Họ và tên, Khóa học quan tâm, Nguồn tiếp cận, và BẮT BUỘC cả
 * Số điện thoại lẫn Email (không còn chấp nhận chỉ 1 trong 2).
 */
export function validateLeadForm(form) {
  const errors = {};
  if (!isRequired(form.name)) errors.name = "Vui lòng nhập họ và tên.";
  if (!isRequired(form.course)) errors.course = "Vui lòng chọn khóa học quan tâm.";
  if (!isRequired(form.source)) errors.source = "Vui lòng chọn nguồn tiếp cận.";

  const hasPhone = isRequired(form.phone);
  const hasEmail = isRequired(form.email);

  if (!hasPhone) {
    errors.phone = "Vui lòng nhập số điện thoại.";
  } else if (!isValidPhone(form.phone)) {
    errors.phone = "Số điện thoại không hợp lệ (vd: 0901234567).";
  }

  if (!hasEmail) {
    errors.email = "Vui lòng nhập email.";
  } else if (!isValidEmail(form.email)) {
    errors.email = "Email không đúng định dạng.";
  }

  return errors;
}

/** Validate form đăng nhập — Tiêu chí chấp nhận Module 1: không được để trống. */
export function validateLoginForm({ email, password }) {
  const errors = {};
  if (!isRequired(email)) errors.email = "Vui lòng nhập email.";
  else if (!isValidEmail(email)) errors.email = "Email không đúng định dạng.";
  if (!isRequired(password)) errors.password = "Vui lòng nhập mật khẩu.";
  return errors;
}

/** Validate form đăng ký tài khoản — mật khẩu tối thiểu 6 ký tự, xác nhận khớp. */
export function validateRegisterForm({ name, email, password, confirmPassword }) {
  const errors = {};
  if (!isRequired(name)) errors.name = "Vui lòng nhập họ và tên.";
  if (!isRequired(email)) errors.email = "Vui lòng nhập email.";
  else if (!isValidEmail(email)) errors.email = "Email không đúng định dạng.";
  if (!isRequired(password)) errors.password = "Vui lòng nhập mật khẩu.";
  else if (String(password).length < 6) errors.password = "Mật khẩu cần tối thiểu 6 ký tự.";
  if (confirmPassword !== undefined && password !== confirmPassword) {
    errors.confirmPassword = "Xác nhận mật khẩu không khớp.";
  }
  return errors;
}

export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}
