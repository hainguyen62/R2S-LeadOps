import { describe, it, expect } from "vitest";
import {
  isValidEmail,
  isValidPhone,
  normalizePhone,
  normalizeEmail,
  validateLeadForm,
  validateLoginForm,
  validateRegisterForm,
  hasErrors,
} from "./validators.js";

describe("isValidEmail", () => {
  it("chấp nhận email đúng định dạng", () => {
    expect(isValidEmail("a@b.com")).toBe(true);
    expect(isValidEmail("hoc.vien+r2s@gmail.com")).toBe(true);
  });
  it("từ chối email sai định dạng hoặc rỗng", () => {
    expect(isValidEmail("khong-phai-email")).toBe(false);
    expect(isValidEmail("a@b")).toBe(false);
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail(undefined)).toBe(false);
  });
});

describe("isValidPhone", () => {
  it("chấp nhận số điện thoại VN hợp lệ ở nhiều định dạng", () => {
    expect(isValidPhone("0901234567")).toBe(true);
    expect(isValidPhone("0901 234 567")).toBe(true);
    expect(isValidPhone("+84901234567")).toBe(true);
    expect(isValidPhone("84901234567")).toBe(true);
  });
  it("từ chối số điện thoại sai định dạng", () => {
    expect(isValidPhone("123")).toBe(false);
    expect(isValidPhone("abcxyz1234")).toBe(false);
    expect(isValidPhone("")).toBe(false);
  });
});

describe("normalizePhone / normalizeEmail", () => {
  it("chuẩn hóa số điện thoại về dạng 0xxxxxxxxx", () => {
    expect(normalizePhone("+84901234567")).toBe("0901234567");
    expect(normalizePhone("84901234567")).toBe("0901234567");
    expect(normalizePhone("0901 234 567")).toBe("0901234567");
  });
  it("chuẩn hóa email về chữ thường, bỏ khoảng trắng thừa", () => {
    expect(normalizeEmail("  Test@GMAIL.com  ")).toBe("test@gmail.com");
  });
});

describe("validateLeadForm", () => {
  it("báo lỗi khi thiếu các trường bắt buộc", () => {
    const errors = validateLeadForm({});
    expect(errors.name).toBeDefined();
    expect(errors.course).toBeDefined();
    expect(errors.source).toBeDefined();
    expect(errors.phone).toBeDefined();
    expect(errors.email).toBeDefined();
  });

  it("hợp lệ khi chỉ có một trong hai (phone hoặc email) — không còn bắt buộc cả hai", () => {
    const withPhoneOnly = validateLeadForm({ name: "A", course: "X", source: "Y", phone: "0901234567" });
    expect(hasErrors(withPhoneOnly)).toBe(false);

    const withEmailOnly = validateLeadForm({ name: "A", course: "X", source: "Y", email: "a@b.com" });
    expect(hasErrors(withEmailOnly)).toBe(false);
  });

  it("báo lỗi ở cả hai ô khi thiếu cả phone lẫn email", () => {
    const errors = validateLeadForm({ name: "A", course: "X", source: "Y" });
    expect(errors.phone).toBeDefined();
    expect(errors.email).toBeDefined();
  });

  it("báo lỗi định dạng khi phone/email sai, dù đã điền", () => {
    const errors = validateLeadForm({ name: "A", course: "X", source: "Y", phone: "123", email: "notanemail" });
    expect(errors.phone).toBeDefined();
    expect(errors.email).toBeDefined();
  });

  it("hợp lệ khi có đủ trường bắt buộc, gồm cả phone lẫn email đúng định dạng", () => {
    const errors = validateLeadForm({ name: "Nguyễn Văn A", course: "ReactJS", source: "Facebook Ads", phone: "0901234567", email: "a@b.com" });
    expect(hasErrors(errors)).toBe(false);
  });
});

describe("validateLoginForm", () => {
  it("báo lỗi khi thiếu email hoặc mật khẩu", () => {
    expect(hasErrors(validateLoginForm({ email: "", password: "" }))).toBe(true);
  });
  it("báo lỗi khi email sai định dạng", () => {
    const errors = validateLoginForm({ email: "sai-dinh-dang", password: "123456" });
    expect(errors.email).toBeDefined();
  });
  it("hợp lệ khi đủ thông tin đúng định dạng", () => {
    expect(hasErrors(validateLoginForm({ email: "a@b.com", password: "123456" }))).toBe(false);
  });
});

describe("validateRegisterForm", () => {
  it("báo lỗi khi mật khẩu dưới 6 ký tự", () => {
    const errors = validateRegisterForm({ name: "A", email: "a@b.com", password: "123" });
    expect(errors.password).toBeDefined();
  });
  it("báo lỗi khi xác nhận mật khẩu không khớp", () => {
    const errors = validateRegisterForm({ name: "A", email: "a@b.com", password: "123456", confirmPassword: "654321" });
    expect(errors.confirmPassword).toBeDefined();
  });
  it("hợp lệ khi đủ thông tin và mật khẩu khớp", () => {
    const errors = validateRegisterForm({ name: "A", email: "a@b.com", password: "123456", confirmPassword: "123456" });
    expect(hasErrors(errors)).toBe(false);
  });
});