import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarClock, X, Loader2, Pencil } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/ui/ToastProvider.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { SkeletonBlock } from "../components/ui/Skeleton.jsx";
import Pill from "../components/ui/Pill.jsx";
import {
  fetchMyAppointments,
  updateAppointment,
  APPOINTMENT_CHANNEL_ENUM,
} from "../services/appointmentService.js";
import useEscapeKey from "../hooks/useEscapeKey.js";
import { formatVietnamDateTime, getVietnamDateTimeInput, vietnamDateTimeToIso } from "../utils/datetime.js";

const CHANNEL_LABEL = { PHONE: "Điện thoại", MESSENGER: "Messenger", ZALO: "Zalo", EMAIL: "Email", GOOGLE_MEET: "Google Meet", OFFLINE: "Gặp trực tiếp", OTHER: "Khác" };

/** GET /appointments/my — trang riêng vì backend infer user hiện tại từ JWT, không cần truyền id. */
export default function MyAppointments() {
  const user = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  useEscapeKey(!!editing, () => setEditing(null));
  const [form, setForm] = useState({ title: "", date: "", time: "", durationMinutes: 30, channel: "PHONE", note: "" });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetchMyAppointments({ pageSize: 100 }, user?.name)
      .then(({ items }) => setItems(items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openEdit = (a) => {
    const { date, time } = getVietnamDateTimeInput(a.appointmentAt);
    setForm({
      title: a.title,
      date,
      time,
      durationMinutes: a.durationMinutes,
      channel: a.channel,
      note: a.note || "",
    });
    setEditing(a);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const appointmentAt = vietnamDateTimeToIso(form.date, form.time);
      await updateAppointment(editing.id, {
        title: form.title.trim(),
        appointmentAt,
        durationMinutes: Number(form.durationMinutes) || 30,
        channel: form.channel,
        note: form.note.trim() || undefined,
      });
      toast.success("Đã cập nhật lịch hẹn.");
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.message || "Cập nhật thất bại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-slate-900">Lịch hẹn của tôi</h1>
        <p className="text-sm text-slate-500 mt-0.5">Toàn bộ lịch hẹn tư vấn bạn đang phụ trách.</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          <SkeletonBlock className="h-20 rounded-xl" />
          <SkeletonBlock className="h-20 rounded-xl" />
          <SkeletonBlock className="h-20 rounded-xl" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl">
          <EmptyState icon={CalendarClock} title="Chưa có lịch hẹn nào" description="Lịch hẹn tư vấn bạn tạo ở trang chi tiết lead sẽ hiện ở đây." />
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <div key={a.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-start justify-between gap-3">
              <button className="text-left min-w-0" onClick={() => a.leadId && navigate(`/leads/${a.leadId}`)}>
                <p className="text-sm font-medium text-slate-800 truncate">{a.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {a.leadName ? `${a.leadName} · ` : ""}
                  {formatVietnamDateTime(a.appointmentAt)} · {a.durationMinutes} phút · {a.channelLabel}
                </p>
                <div className="mt-2">
                  <Pill
                    text={a.statusLabel}
                    map={{ "Đã hoàn thành": "bg-emerald-50 text-emerald-700", "Đã hủy": "bg-slate-100 text-slate-500", "Lead không đến": "bg-slate-100 text-slate-500" }}
                    fallback="bg-indigo-50 text-indigo-700"
                  />
                </div>
              </button>
              {(a.status === "SCHEDULED" || a.status === "CONFIRMED") && (
                <button onClick={() => openEdit(a)} title="Sửa lịch hẹn" className="p-1.5 rounded-md text-slate-400 hover:bg-slate-50 hover:text-indigo-600 shrink-0">
                  <Pencil size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-elevated">
            <div className="flex items-center justify-between px-6 pt-6 pb-2">
              <p className="text-sm font-semibold text-slate-900">Sửa lịch hẹn</p>
              <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
            <form onSubmit={handleSave} className="px-6 pb-6 pt-2 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600">Tiêu đề</label>
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">Ngày</label>
                  <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" required />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Giờ</label>
                  <input type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">Thời lượng (phút)</label>
                  <input type="number" min={5} max={480} value={form.durationMinutes} onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Kênh</label>
                  <select value={form.channel} onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
                    {APPOINTMENT_CHANNEL_ENUM.map((c) => (
                      <option key={c} value={c}>{CHANNEL_LABEL[c]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Ghi chú</label>
                <textarea value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} rows={2} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditing(null)} className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">Hủy</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60 flex items-center gap-2">
                  {saving && <Loader2 size={14} className="animate-spin" />} Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
