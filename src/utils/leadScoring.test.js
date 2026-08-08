import { describe, it, expect } from "vitest";
import { scoreLead, classify, priorityTier, getScoreBreakdown } from "./leadScoring.js";

describe("scoreLead", () => {
  it("trả về 0 khi lead không có tín hiệu nào", () => {
    expect(scoreLead({ signals: {} })).toBe(0);
    expect(scoreLead({})).toBe(0);
  });

  it("cộng đúng điểm nhóm A (mức độ phù hợp) khi có đủ tín hiệu", () => {
    const lead = {
      signals: {
        fitCourseDefined: true, // +5
        fitTargetGroup: true, // +5
      },
    };
    expect(scoreLead(lead)).toBe(10);
  });

  it("nhóm B chỉ tính MỘT mức enrollmentIntent cao nhất phù hợp", () => {
    expect(scoreLead({ signals: { enrollmentIntent: "7d" } })).toBe(30);
    expect(scoreLead({ signals: { enrollmentIntent: "30d" } })).toBe(20);
    expect(scoreLead({ signals: { enrollmentIntent: "6m+" } })).toBe(0); // -10 nhưng tổng bị chặn dưới ở 0
  });

  it("giới hạn trần nhóm C ở 25 điểm dù tổng tiêu chí vượt quá", () => {
    const lead = {
      signals: {
        hasFullContact: true, // 5
        downloadedOneDoc: true, // 3
        downloadedTwoPlusDocs: true, // 5
        repliedMessengerZalo: true, // 5
        openedRepliedEmail: true, // 3
        revisitedOrResubmitted: true, // 5
        attendedWorkshop: true, // 7 -> tổng thô 33, vượt trần 25
      },
    };
    expect(scoreLead(lead)).toBe(25);
  });

  it("giới hạn trần nhóm D ở 20 điểm", () => {
    const lead = {
      signals: {
        askedTuitionFee: true, // 5
        askedSchedule: true, // 5
        askedPaymentPolicy: true, // 5
        requestedOneOnOne: true, // 8 -> tổng thô 23, vượt trần 20
      },
    };
    expect(scoreLead(lead)).toBe(20);
  });

  it("áp dụng điểm trừ nhóm E và không cho điểm âm dưới 0", () => {
    const lead = { signals: { fitCourseDefined: true, declaredNoNeed: true } }; // +5 -30
    expect(scoreLead(lead)).toBe(0);
  });

  it("giới hạn điểm tối đa ở 100 dù tổng các nhóm vượt quá", () => {
    const lead = {
      signals: {
        fitCourseDefined: true,
        fitTargetGroup: true,
        fitPriorKnowledge: true,
        fitCareerGoal: true,
        fitScheduleMatch: true, // nhóm A = 25
        enrollmentIntent: "7d", // nhóm B = 30
        hasFullContact: true,
        activelyMessaged: true,
        attendedWorkshop: true, // nhóm C (trần 25)
        confirmedReserveSpot: true,
        bookedConsultation: true, // nhóm D (trần 20)
      },
    };
    expect(scoreLead(lead)).toBeLessThanOrEqual(100);
  });
});

describe("classify", () => {
  it("phân loại đúng 4 mức theo Mục VII.4", () => {
    expect(classify(85, {})).toBe("Lead nóng");
    expect(classify(70, {})).toBe("Lead nóng");
    expect(classify(55, {})).toBe("Lead ấm");
    expect(classify(40, {})).toBe("Lead ấm");
    expect(classify(20, {})).toBe("Lead lạnh");
    expect(classify(0, {})).toBe("Không hợp lệ");
  });

  it("luôn trả về 'Không hợp lệ' khi lead bị đánh dấu spam, bất kể điểm", () => {
    const lead = { signals: { isSpamOrFake: true } };
    expect(classify(90, lead)).toBe("Không hợp lệ");
  });
});

describe("priorityTier", () => {
  it("phân theo 3 mức hot/warm/cool", () => {
    expect(priorityTier(85)).toBe("hot");
    expect(priorityTier(80)).toBe("hot");
    expect(priorityTier(60)).toBe("warm");
    expect(priorityTier(50)).toBe("warm");
    expect(priorityTier(30)).toBe("cool");
  });
});

describe("getScoreBreakdown", () => {
  it("chỉ liệt kê các tiêu chí có tín hiệu true, kèm dấu +/- đúng", () => {
    const lead = {
      signals: { fitCourseDefined: true, enrollmentIntent: "7d", scheduleMismatch: true },
    };
    const breakdown = getScoreBreakdown(lead);
    expect(breakdown).toContainEqual({ label: "Xác định rõ khóa học quan tâm", value: "+5", group: "A" });
    expect(breakdown).toContainEqual({ label: "Muốn đăng ký trong 7 ngày", value: "+30", group: "B" });
    expect(breakdown).toContainEqual({ label: "Thời gian học không phù hợp", value: "-10", group: "E" });
  });

  it("trả về mảng rỗng khi không có tín hiệu nào", () => {
    expect(getScoreBreakdown({ signals: {} })).toEqual([]);
  });
});
