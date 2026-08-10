import { useEffect, useState } from "react";
import { User, KeyRound, Check, AlertCircle } from "lucide-react";
import Avatar from "../components/ui/Avatar.jsx";
import Pill from "../components/ui/Pill.jsx";
import { SkeletonBlock } from "../components/ui/Skeleton.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { fetchProfile, updateProfile } from "../services/settingsService.js";
import { changePassword } from "../services/authService.js";

const roleStyle = {
  Administrator: "bg-red-50 text-red-800",
  "Leader Marketing": "bg-violet-50 text-violet-800",
  "Sales/Admissions": "bg-blue-50 text-blue-800",
  "Marketing Staff": "bg-amber-50 text-amber-800",
};

export default function Profile() {
  const [tab, setTab] = useState("info");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(null);
  const [savingInfo, setSavingInfo] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [savingPw, setSavingPw] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [pwError, setPwError] = useState("");

  // GET /api/auth/me (hồ sơ chi tiết) — xem services/settingsService.js
  useEffect(() => {
    let cancelled = false;
    fetchProfile()
      .then((data) => {
        if (cancelled) return;
        setProfile(data);
        setForm({ name: data.name, email: data.email, phone: data.phone, department: data.department });
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Không thể tải hồ sơ.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <SkeletonBlock className="h-[400px] rounded-xl" />;
  if (error) return <EmptyState icon={AlertCircle} title="Không thể tải hồ sơ" description={error} />;
  if (!profile || !form) return null;

  const initials = profile.name
    .split(" ")
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  // PUT /api/users/me — xem services/settingsService.js
  const handleSaveInfo = async (e) => {
    e.preventDefault();
    setSavingInfo(true);
    try {
      const updated = await updateProfile(form);
      setProfile(updated);
      setSavedMsg("Đã lưu thông tin cá nhân.");
      setTimeout(() => setSavedMsg(""), 2500);
    } catch (err) {
      setPwError("");
    } finally {
      setSavingInfo(false);
    }
  };

  // PUT /api/auth/change-password — xem services/authService.js
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError("");
    if (!pwForm.current || !pwForm.next || !pwForm.confirm) {
      setPwError("Vui lòng điền đầy đủ các trường mật khẩu.");
      return;
    }
    if (pwForm.next.length < 8) {
      setPwError("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwError("Xác nhận mật khẩu không khớp.");
      return;
    }
    setSavingPw(true);
    try {
      await changePassword({ oldPassword: pwForm.current, newPassword: pwForm.next });
      setSavedMsg("Đã đổi mật khẩu thành công.");
      setPwForm({ current: "", next: "", confirm: "" });
      setTimeout(() => setSavedMsg(""), 2500);
    } catch (err) {
      setPwError(err.message || "Đổi mật khẩu thất bại.");
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Hồ sơ cá nhân</h2>
        <p className="text-sm text-slate-500">Quản lý thông tin tài khoản của bạn</p>
      </div>

      {/* Header card */}
      <div className="bg-white border border-slate-300 rounded-card p-6 shadow-card flex items-center gap-4 transition-all duration-200 ease-out hover:shadow-elevated">
        <Avatar name={profile.name} initials={initials} size={56} />
        <div>
          <p className="font-semibold text-slate-900">{profile.name}</p>
          <p className="text-xs text-slate-500 mb-1.5">{profile.department}</p>
          <Pill text={profile.role} map={roleStyle} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab("info")}
          className={`flex items-center gap-2 px-4 py-2 rounded-card text-sm transition-all duration-200 ease-out ${
            tab === "info" ? "bg-brand-600 text-white shadow-sm" : "border border-slate-300 text-slate-500 hover:bg-slate-100"
          }`}
        >
          <User size={16} /> Thông tin
        </button>
        <button
          onClick={() => setTab("password")}
          className={`flex items-center gap-2 px-4 py-2 rounded-card text-sm transition-all duration-200 ease-out ${
            tab === "password" ? "bg-brand-600 text-white shadow-sm" : "border border-slate-300 text-slate-500 hover:bg-slate-100"
          }`}
        >
          <KeyRound size={16} /> Đổi mật khẩu
        </button>
      </div>

      {savedMsg && (
        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5 max-w-xl">
          <Check size={15} /> {savedMsg}
        </div>
      )}

      {/* Info tab */}
      {tab === "info" && (
        <form onSubmit={handleSaveInfo} className="bg-white border border-slate-300 rounded-card p-6 shadow-card max-w-xl space-y-3 transition-all duration-200 ease-out hover:shadow-elevated">
          <div>
            <label className="text-xs text-slate-500 block mb-1">Họ và tên</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-input px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200 ease-out"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-input px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200 ease-out"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Số điện thoại</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-input px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200 ease-out"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Phòng ban</label>
            <input
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-input px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200 ease-out"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Vai trò</label>
            <input
              disabled
              value={profile.role}
              title="Vai trò chỉ có thể thay đổi bởi Quản trị viên"
              className="w-full bg-slate-100 border border-slate-200 rounded-input px-3 py-2 text-sm text-slate-400 cursor-not-allowed"
            />
          </div>
          <div className="pt-2">
            <button type="submit" disabled={savingInfo} className="bg-brand-600 hover:bg-brand-500 rounded-card px-5 py-2 text-sm text-white shadow-sm hover:shadow-md transition-all duration-200 ease-out disabled:opacity-60">
              {savingInfo ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      )}

      {/* Password tab */}
      {tab === "password" && (
        <form onSubmit={handleChangePassword} className="bg-white border border-slate-300 rounded-card p-6 shadow-card max-w-xl space-y-3 transition-all duration-200 ease-out hover:shadow-elevated">
          {pwError && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{pwError}</div>
          )}
          <div>
            <label className="text-xs text-slate-500 block mb-1">Mật khẩu hiện tại *</label>
            <input
              type="password"
              required
              value={pwForm.current}
              onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-input px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200 ease-out"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Mật khẩu mới *</label>
            <input
              type="password"
              required
              value={pwForm.next}
              onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })}
              placeholder="Tối thiểu 8 ký tự"
              className="w-full bg-slate-50 border border-slate-300 rounded-input px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200 ease-out"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Xác nhận mật khẩu mới *</label>
            <input
              type="password"
              required
              value={pwForm.confirm}
              onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-input px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200 ease-out"
            />
          </div>
          <div className="pt-2">
            <button type="submit" disabled={savingPw} className="bg-brand-600 hover:bg-brand-500 rounded-card px-5 py-2 text-sm text-white shadow-sm hover:shadow-md transition-all duration-200 ease-out disabled:opacity-60">
              {savingPw ? "Đang xử lý..." : "Đổi mật khẩu"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}