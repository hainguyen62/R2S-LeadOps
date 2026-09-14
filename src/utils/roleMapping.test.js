import { describe, it, expect } from "vitest";
import {
  mapRoleEnumToLabel,
  mapStatusEnumToLabel,
  ROLE_ENUM_TO_LABEL,
} from "./roleMapping.js";
import { ROLES } from "./permissions.js";

// File này là nơi map UserRole/UserStatus enum của Backend (ADMIN/MANAGER/STAFF,
// ACTIVE/LOCKED) sang nhãn tiếng Việt/Anh mà permissions.js + toàn bộ UI dùng.
// Theo đúng comment đầu roleMapping.js: TỪNG CÓ BUG THẬT khi authService.js
// quên gọi map này -> /auth/me trả "ADMIN" nhưng permissions.js chỉ nhận diện
// "Administrator" -> Admin bị rơi về quyền Sales thấp nhất. Bộ test này khóa
// chặt hành vi hiện tại để không lặp lại lỗi đó khi có ai sửa code sau này.

describe("mapRoleEnumToLabel", () => {
  it("map đúng 3 role enum của Backend sang nhãn UI đang dùng", () => {
    expect(mapRoleEnumToLabel("ADMIN")).toBe("Administrator");
    expect(mapRoleEnumToLabel("MANAGER")).toBe("Leader Marketing");
    expect(mapRoleEnumToLabel("STAFF")).toBe("Sales/Admissions");
  });

  it("trả về nguyên giá trị gốc khi gặp role lạ không nằm trong enum đã biết (không được throw hay trả undefined)", () => {
    expect(mapRoleEnumToLabel("SUPER_ADMIN")).toBe("SUPER_ADMIN");
  });

  it("không làm sập app khi Backend không trả field role (undefined/null)", () => {
    expect(mapRoleEnumToLabel(undefined)).toBeUndefined();
    expect(mapRoleEnumToLabel(null)).toBeNull();
  });
});

describe("mapStatusEnumToLabel", () => {
  it("map đúng 2 status enum của Backend sang nhãn tiếng Việt", () => {
    expect(mapStatusEnumToLabel("ACTIVE")).toBe("Hoạt động");
    expect(mapStatusEnumToLabel("LOCKED")).toBe("Đã khóa");
  });

  it("trả về nguyên giá trị gốc khi gặp status lạ", () => {
    expect(mapStatusEnumToLabel("SUSPENDED")).toBe("SUSPENDED");
  });
});

describe("Regression: nhãn role PHẢI khớp chính xác với permissions.ROLES", () => {
  it("mọi nhãn trong ROLE_ENUM_TO_LABEL đều phải tồn tại trong permissions.ROLES — nếu không, user sẽ rơi về quyền Sales thấp nhất do permissions.js không nhận diện được", () => {
    const validLabels = Object.values(ROLES);
    for (const [enumKey, label] of Object.entries(ROLE_ENUM_TO_LABEL)) {
      expect(
        validLabels.includes(label),
        `Nhãn "${label}" (map từ enum "${enumKey}") không khớp bất kỳ giá trị nào trong permissions.ROLES: [${validLabels.join(", ")}]`
      ).toBe(true);
    }
  });

  it("ADMIN phải map đúng ROLES.ADMIN (toàn quyền hệ thống)", () => {
    expect(mapRoleEnumToLabel("ADMIN")).toBe(ROLES.ADMIN);
  });

  it("MANAGER phải map đúng ROLES.LEADER (Leader Marketing)", () => {
    expect(mapRoleEnumToLabel("MANAGER")).toBe(ROLES.LEADER);
  });

  it("STAFF phải map đúng ROLES.SALES — LƯU Ý: đây là mapping TẠM (gộp cả Marketing Staff vào Sales), cần TTS2/BA xác nhận trước go-live; test này sẽ báo đỏ nếu ai đó âm thầm đổi mapping mà không cập nhật comment cảnh báo", () => {
    expect(mapRoleEnumToLabel("STAFF")).toBe(ROLES.SALES);
  });
});
