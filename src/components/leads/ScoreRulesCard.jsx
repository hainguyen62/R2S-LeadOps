import { useState } from "react";
import { Info, ChevronDown, ChevronUp, Minus } from "lucide-react";
import { scoringGroups, deductionGroup, scoringMax, classificationRules } from "../../utils/leadScoring.js";

/**
 * Bảng luật chấm điểm lead — đúng theo Mục VII (THIẾT KẾ LEAD SCORING) của
 * tài liệu Kế hoạch triển khai: 4 nhóm cộng điểm A–D (mỗi nhóm có mức trần
 * riêng) + 1 nhóm điểm trừ E, quy đổi ra phân loại Nóng/Ấm/Lạnh/Không hợp lệ.
 * Mặc định thu gọn để không chiếm chỗ trang danh sách lead.
 */
export default function ScoreRulesCard() {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <Info size={14} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Bảng luật chấm điểm lead</p>
            <p className="text-xs text-slate-500">
              4 nhóm cộng điểm (A–D) + 1 nhóm điểm trừ (E) — tổng {scoringMax} điểm, quy đổi ra Nóng / Ấm / Lạnh / Không hợp lệ
            </p>
          </div>
        </div>
        {open ? <ChevronUp size={16} className="text-slate-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-slate-100 px-4 py-4 space-y-5">
          {/* 4 nhóm cộng điểm A–D */}
          {scoringGroups.map((g) => (
            <div key={g.id}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-700">
                  Nhóm {g.id} — {g.name}
                </p>
                <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap">tối đa {g.max}đ</span>
              </div>
              <div className="overflow-x-auto rounded-lg border border-slate-100">
                <table className="w-full text-sm">
                  <tbody>
                    {g.singleSelect
                      ? g.options.map((o) => (
                          <tr key={o.value} className="border-b border-slate-100 last:border-0">
                            <td className="py-2 px-3 text-slate-700">{o.label}</td>
                            <td
                              className={`py-2 px-3 text-right font-medium whitespace-nowrap ${
                                o.points < 0 ? "text-red-600" : o.points === 0 ? "text-slate-400" : "text-emerald-600"
                              }`}
                            >
                              {o.points > 0 ? `+${o.points}` : o.points}
                            </td>
                          </tr>
                        ))
                      : g.criteria.map((c) => (
                          <tr key={c.id} className="border-b border-slate-100 last:border-0">
                            <td className="py-2 px-3 text-slate-700">{c.label}</td>
                            <td className="py-2 px-3 text-right font-medium text-emerald-600 whitespace-nowrap">+{c.points}</td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
              {g.singleSelect && (
                <p className="text-[11px] text-slate-400 mt-1">Chỉ áp dụng một mức cao nhất phù hợp trong nhóm này.</p>
              )}
              {!g.singleSelect && (
                <p className="text-[11px] text-slate-400 mt-1">Tổng điểm nhóm này bị giới hạn ở mức {g.max}đ dù cộng dồn nhiều hơn.</p>
              )}
            </div>
          ))}

          {/* Nhóm E — điểm trừ */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Minus size={13} className="text-red-500" />
              <p className="text-xs font-semibold text-slate-700">
                Nhóm {deductionGroup.id} — {deductionGroup.name}
              </p>
            </div>
            <div className="overflow-x-auto rounded-lg border border-red-100">
              <table className="w-full text-sm">
                <tbody>
                  {deductionGroup.criteria.map((c) => (
                    <tr key={c.id} className="border-b border-red-50 last:border-0">
                      <td className="py-2 px-3 text-slate-700">{c.label}</td>
                      <td className="py-2 px-3 text-right font-medium text-red-600 whitespace-nowrap">{c.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bảng phân loại theo điểm */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Phân loại theo tổng điểm
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {classificationRules.map((r) => (
                <div key={r.cls} className="rounded-lg border border-slate-200 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.badgeClass}`}>{r.cls}</span>
                    <span className="text-xs text-slate-500 whitespace-nowrap">{r.range}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{r.action}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            Tổng điểm = điểm nhóm A + điểm nhóm B (chọn 1 mức) + điểm nhóm C (trần {scoringGroups[2].max}đ) + điểm
            nhóm D (trần {scoringGroups[3].max}đ) + điểm trừ nhóm E, giới hạn trong khoảng 0–{scoringMax}. Điểm được
            tính lại tự động mỗi khi lead có tương tác hoặc thay đổi thông tin mới. Xem chi tiết lý do cộng/trừ điểm
            của từng lead tại trang Chi tiết lead.
          </p>
        </div>
      )}
    </div>
  );
}