import { useState } from "react";
import { User, KeyRound, Check } from "lucide-react";
import Avatar from "../components/ui/Avatar.jsx";
import Pill from "../components/ui/Pill.jsx";
import { currentUserProfile } from "../data/mockData.js";

const roleStyle = {
  Admin: "bg-red-50 text-red-800",
  Marketing: "bg-violet-50 text-violet-800",
  Sales: "bg-blue-50 text-blue-800",
};

export default function Profile() {
  const [tab, setTab] = useState("info");
  const [form, setForm] = useState({
    name: currentUserProfile.name,
    email: currentUserProfile.email,
    phone: currentUserProfile.phone,
    department: currentUserProfile.department,
  });
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [savedMsg, setSavedMsg] = useState("");
  const [pwError, setPwError] = useState("");

  const initials = currentUserProfile.name
    .split(" ")
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const handleSaveInfo = (e) => {
    e.preventDefault();
    setSavedMsg("Đã lưu thông tin cá nhân.");
    setTimeout(() => setSavedMsg(""), 2500);
  };

  const handleChangePassword = (e) => {
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
    setSavedMsg("Đã đổi mật khẩu thành công.");
    setPwForm({ current: "", next: "", confirm: "" });
    setTimeout(() => setSavedMsg(""), 2500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Hồ sơ cá nhân</h2>
        <p className="text-sm text-slate-500">Quản lý thông tin tài khoản của bạn</p>
      </div>

      {/* Header card */}
      <div className="bg-white border border-slate-300 rounded-card p-6 shadow-card flex items-center gap-4 transition-all duration-200 ease-out hover:shadow-elevated">
        <Avatar name={currentUserProfile.name} initials={initials} size={56} />
        <div>
          <p className="font-semibold text-slate-900">{currentUserProfile.name}</p>
          <p className="text-xs text-slate-500 mb-1.5">{currentUserProfile.department}</p>
          <Pill text={currentUserProfile.role} map={roleStyle} />
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
              value={currentUserProfile.role}
              title="Vai trò chỉ có thể thay đổi bởi Quản trị viên"
              className="w-full bg-slate-100 border border-slate-200 rounded-input px-3 py-2 text-sm text-slate-400 cursor-not-allowed"
            />
          </div>
          <div className="pt-2">
            <button type="submit" className="bg-brand-600 hover:bg-brand-500 rounded-card px-5 py-2 text-sm text-white shadow-sm hover:shadow-md transition-all duration-200 ease-out">
              Lưu thay đổi
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
            <button type="submit" className="bg-brand-600 hover:bg-brand-500 rounded-card px-5 py-2 text-sm text-white shadow-sm hover:shadow-md transition-all duration-200 ease-out">
              Đổi mật khẩu
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
