/* ============================================================
   SCORING RULE SERVICE — cấu hình bảng điểm Lead Scoring (Mục IV + X.4).
   TẠM THỜI: Back-end chưa sẵn sàng, nên toàn bộ lưu ở localStorage (giống
   pattern courseService/voucherService trước khi có Back-end thật). Khi
   Back-end xong, chỉ cần đổi 2 hàm dưới đây gọi apiFetch("/scoring-rules"),
   không cần đổi trang ScoringRules.jsx.
   ============================================================ */

import { getAllRuleDefs, updateRuleOverride, resetAllRuleOverrides, addCustomRule, deleteRule } from "../utils/leadScoring.js";
import { mockDelay } from "./apiClient.js";

export const GROUP_LABELS = {
  A: "A. Mức độ phù hợp với khóa học (trần 25đ)",
  B: "B. Ý định và thời gian đăng ký (chọn 1 mức)",
  C: "C. Mức độ tương tác (trần 25đ)",
  D: "D. Tín hiệu mua hàng (trần 20đ)",
  E: "E. Điểm trừ (không giới hạn)",
};

export const GROUP_ORDER = ["A", "B", "C", "D", "E"];

export async function fetchScoringRules() {
  await mockDelay(150);
  return getAllRuleDefs();
}

export async function updateScoringRule(ruleCode, { points, active }) {
  await mockDelay(150);
  if (typeof points !== "number" || Number.isNaN(points)) {
    throw new Error("Điểm phải là số nguyên.");
  }
  return updateRuleOverride(ruleCode, { points, active });
}

export async function resetScoringRules() {
  await mockDelay(100);
  resetAllRuleOverrides();
}

export async function createScoringRule({ groupId, label, points }) {
  await mockDelay(150);
  return addCustomRule({ groupId, label, points });
}

export async function deleteScoringRule(ruleCode) {
  await mockDelay(150);
  deleteRule(ruleCode);
}
