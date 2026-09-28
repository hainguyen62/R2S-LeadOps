import { useEffect, useState } from "react";
import { Target, AlertCircle, Loader2, Save, Power, Info, RotateCcw, Plus, Trash2 } from "lucide-react";
import { fetchScoringRules, updateScoringRule, resetScoringRules, createScoringRule, deleteScoringRule, GROUP_LABELS, GROUP_ORDER } from "../services/scoringRuleService.js";
import { SkeletonBlock } from "../components/ui/Skeleton.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { useToast } from "../components/ui/ToastProvider.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { can } from "../utils/permissions.js";

/**
 * Cấu hình điểm Lead Scoring (Mục IV + X.4) — thay vì sửa cứng trong
 * utils/leadScoring.js, Admin/Leader Marketing đổi điểm ngay tại đây.
 *
 * LƯU Ý (tạm thời): Back-end chưa sẵn sàng nên thay đổi chỉ lưu ở
 * localStorage của trình duyệt hiện tại (xem services/scoringRuleService.js)
 * — chưa dùng chung được giữa nhiều máy/nhiều người. Khi Back-end xong sẽ
 * nối API thật mà không cần đổi giao diện này.
 */
export default function ScoringRules() {
  const toast = useToast();
  const user = useAuth();
  const canEdit = !!can(user, "configureScoring");

  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drafts, setDrafts] = useState({}); // { [ruleCode]: { points, active } } — thay đổi chưa lưu
  const [savingCode, setSavingCode] = useState(null);

  function load() {
    setLoading(true);
    setError(null);
    fetchScoringRules()
      .then((list) => setRules(list))
      .catch((err) => setError(err.message || "Không thể tải cấu hình chấm điểm."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function draftOf(rule) {
    return drafts[rule.ruleCode] ?? { points: rule.points, active: rule.active };
  }

  function setDraftPoints(rule, value) {
    setDrafts((prev) => ({ ...prev, [rule.ruleCode]: { ...draftOf(rule), points: value } }));
  }

  function toggleActive(rule) {
    if (!canEdit) return;
    setDrafts((prev) => ({ ...prev, [rule.ruleCode]: { ...draftOf(rule), active: !draftOf(rule).active } }));
  }

  function isDirty(rule) {
    const d = draftOf(rule);
    return Number(d.points) !== rule.points || d.active !== rule.active;
  }

  async function saveRule(rule) {
    const draft = draftOf(rule);
    const points = Number(draft.points);
    if (Number.isNaN(points)) {
      toast.error("Điểm phải là số nguyên.");
      return;
    }
    setSavingCode(rule.ruleCode);
    try {
      const updated = await updateScoringRule(rule.ruleCode, { points, active: draft.active });
      setRules((prev) => prev.map((r) => (r.ruleCode === rule.ruleCode ? updated : r)));
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[rule.ruleCode];
        return next;
      });
      toast.success(`Đã cập nhật "${rule.label}".`);
    } catch (err) {
      toast.error(err.message || "Không thể lưu thay đổi.");
    } finally {
      setSavingCode(null);
    }
  }

  const [showAdd, setShowAdd] = useState(false);
  const [newRule, setNewRule] = useState({ groupId: "A", label: "", points: 5 });
  const [adding, setAdding] = useState(false);

  async function handleAdd(e) {
    e.preventDefault();
    setAdding(true);
    try {
      await createScoringRule({ groupId: newRule.groupId, label: newRule.label, points: Number(newRule.points) });
      toast.success(`Đã thêm tiêu chí "${newRule.label.trim()}".`);
      setNewRule({ groupId: newRule.groupId, label: "", points: 5 });
      setShowAdd(false);
      load();
    } catch (err) {
      toast.error(err.message || "Không thể thêm tiêu chí.");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(rule) {
    const msg = rule.custom
      ? `Xóa tiêu chí "${rule.label}"?`
      : `Xóa tiêu chí gốc "${rule.label}"? Có thể khôi phục bằng nút "Khôi phục mặc định".`;
    if (!window.confirm(msg)) return;
    try {
      await deleteScoringRule(rule.ruleCode);
      toast.success(`Đã xóa "${rule.label}".`);
      load();
    } catch (err) {
      toast.error(err.message || "Không thể xóa tiêu chí.");
    }
  }

  async function handleReset() {
    if (!window.confirm("Khôi phục toàn bộ bảng điểm về mặc định gốc? Mọi thay đổi đã lưu sẽ mất.")) return;
    await resetScoringRules(); // hàm này tự reload trang
  }

  const grouped = GROUP_ORDER.map((g) => ({
    group: g,
    label: GROUP_LABELS[g],
    items: rules.filter((r) => r.groupCode === g),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <Target size={20} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Cấu hình chấm điểm Lead (Lead Scoring)</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Đổi điểm từng tiêu chí — áp dụng ngay cho các lần tính điểm sau, không cần sửa code.
            </p>
          </div>
        </div>
        {canEdit && !loading && !error && (
          <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowAdd((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-700"
          >
            <Plus size={14} />
            Thêm tiêu chí
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 shrink-0"
          >
            <RotateCcw size={14} />
            Khôi phục mặc định
          </button>
          </div>
        )}
      </div>

      <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-lg px-4 py-3">
        <Info size={16} className="mt-0.5 shrink-0" />
        <span>
          Bản tạm thời: thay đổi được lưu trên trình duyệt này (localStorage), do Back-end chưa sẵn sàng — chưa dùng
          chung được giữa nhiều người/máy khác nhau.
        </span>
      </div>

      {canEdit && showAdd && (
        <form onSubmit={handleAdd} className="bg-white border border-slate-200 rounded-xl p-4 grid gap-3 md:grid-cols-[180px_1fr_100px_auto] items-end">
          <label className="text-xs text-slate-500">
            Nhóm
            <select
              value={newRule.groupId}
              onChange={(e) => setNewRule({ ...newRule, groupId: e.target.value })}
              className="mt-1 w-full border border-slate-200 rounded-lg px-2 py-2 text-sm text-slate-700"
            >
              {["A", "C", "D", "E"].map((g) => (
                <option key={g} value={g}>{GROUP_LABELS[g].split(" (")[0]}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-500">
            Tên tiêu chí
            <input
              value={newRule.label}
              onChange={(e) => setNewRule({ ...newRule, label: e.target.value })}
              placeholder="VD: Được bạn bè giới thiệu"
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs text-slate-500">
            Điểm
            <input
              type="number"
              value={newRule.points}
              onChange={(e) => setNewRule({ ...newRule, points: e.target.value })}
              className="mt-1 w-full border border-slate-200 rounded-lg px-2 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={adding}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-60"
          >
            {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Thêm
          </button>
        </form>
      )}

      {!canEdit && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-3">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>Bạn chỉ có quyền xem cấu hình này. Chỉ Administrator và Leader Marketing được đổi điểm.</span>
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-40" />
          ))}
        </div>
      )}

      {!loading && error && <EmptyState icon={AlertCircle} title="Không tải được dữ liệu" description={error} />}

      {!loading &&
        !error &&
        grouped.map(({ group, label, items }) => (
          <div key={group} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
              <h2 className="text-sm font-semibold text-slate-700">{label}</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="px-4 py-2 font-medium">Tiêu chí</th>
                  <th className="px-4 py-2 font-medium w-32">Điểm</th>
                  <th className="px-4 py-2 font-medium w-24">Bật/Tắt</th>
                  <th className="px-4 py-2 font-medium w-36"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((rule) => {
                  const draft = draftOf(rule);
                  const dirty = isDirty(rule);
                  return (
                    <tr
                      key={rule.ruleCode}
                      className={`border-b border-slate-50 last:border-0 ${!draft.active ? "opacity-50" : ""}`}
                    >
                      <td className="px-4 py-2.5 text-slate-700">{rule.label}</td>
                      <td className="px-4 py-2.5">
                        <input
                          type="number"
                          value={draft.points}
                          disabled={!canEdit}
                          onChange={(e) => setDraftPoints(rule, e.target.value)}
                          className="w-20 border border-slate-200 rounded-lg px-2 py-1 text-sm disabled:bg-slate-50 disabled:text-slate-400"
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <button
                          type="button"
                          disabled={!canEdit}
                          onClick={() => toggleActive(rule)}
                          title={draft.active ? "Đang áp dụng — bấm để tắt" : "Đang tắt — bấm để bật lại"}
                          className={`p-1.5 rounded-lg ${
                            draft.active ? "text-emerald-600 bg-emerald-50" : "text-slate-400 bg-slate-100"
                          } disabled:opacity-50`}
                        >
                          <Power size={16} />
                        </button>
                      </td>
                      <td className="px-4 py-2.5 text-right whitespace-nowrap">
                        {canEdit && rule.deletable && (
                          <button
                            type="button"
                            onClick={() => handleDelete(rule)}
                            title="Xóa tiêu chí"
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 mr-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                        {canEdit && dirty && (
                          <button
                            type="button"
                            onClick={() => saveRule(rule)}
                            disabled={savingCode === rule.ruleCode}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-700 disabled:opacity-60"
                          >
                            {savingCode === rule.ruleCode ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Save size={14} />
                            )}
                            Lưu
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
    </div>
  );
}
