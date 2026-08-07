import { useState } from "react";
import { Info, ChevronDown, ChevronUp } from "lucide-react";
import { scoringCriteria, scoringMax, classificationRules } from "../../utils/leadScoring.js";

/**
 * Bảng luật chấm điểm lead — giải thích cách hệ thống tự động tính điểm
 * (Module 8) và quy đổi ra phân loại Nóng/Ấm/Lạnh (Module 9), để đội
 * Marketing/Sales hiểu vì sao một lead có điểm số như vậy.
 * Mặc định thu gọn để không chiếm chỗ trang danh sách lead.
 */
export default function ScoreRulesCard() {
  const [open, setOpen] = useState(false);
  const groups = [...new Set(scoringCriteria.map((c) => c.group))];

  return (
    <div className="bg-white border border-slate-300 rounded-card shadow-card overflow-hidden transition-all duration-200 ease-out hover:shadow-elevated">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors duration-200"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <Info size={14} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Bảng luật chấm điểm lead</p>
            <p className="text-xs text-slate-500">Cách hệ thống tự động tính điểm và phân loại Nóng / Ấm / Lạnh</p>
          </div>
        </div>
        {open ? <ChevronUp size={16} className="text-slate-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-slate-100 px-4 py-4 space-y-5">
          {/* Bảng tiêu chí cộng điểm */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Tiêu chí cộng điểm (tối đa {scoringMax} điểm)
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] text-slate-500 border-b border-slate-200">
                    <th className="py-2 pr-4 font-medium">Nhóm</th>
                    <th className="py-2 pr-4 font-medium">Tiêu chí</th>
                    <th className="py-2 pr-0 font-medium text-right">Điểm cộng</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group) =>
                    scoringCriteria
                      .filter((c) => c.group === group)
                      .map((c, i) => (
                        <tr key={c.label} className="border-b border-slate-100 last:border-0">
                          {i === 0 ? (
                            <td
                              className="py-2 pr-4 text-slate-500 align-top whitespace-nowrap"
                              rowSpan={scoringCriteria.filter((x) => x.group === group).length}
                            >
                              {group}
                            </td>
                          ) : null}
                          <td className="py-2 pr-4 text-slate-700">{c.label}</td>
                          <td className="py-2 pr-0 text-right font-medium text-emerald-600">+{c.points}</td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bảng phân loại theo điểm */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Phân loại theo tổng điểm
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              {classificationRules.map((r) => (
                <div
                  key={r.cls}
                  className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2"
                >
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.badgeClass}`}>{r.cls}</span>
                  <span className="text-xs text-slate-500 whitespace-nowrap">{r.range}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            Điểm được tính tự động khi lead được tạo hoặc cập nhật, dựa trên thông tin liên hệ có sẵn và nội dung
            ghi chú chăm sóc. Xem điểm chi tiết của từng lead tại trang Chi tiết lead.
          </p>
        </div>
      )}
    </div>
  );
}