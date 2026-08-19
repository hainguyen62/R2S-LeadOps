import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Lock, Briefcase, ShieldCheck, UserPlus, Loader2, Eye, EyeOff, AlertTriangle, ArrowLeft } from "lucide-react";
import { registerStaff } from "../services/authService.js";
import { validateRegisterForm, hasErrors } from "../utils/validators.js";
import { useToast } from "../components/ui/ToastProvider.jsx";

/**
 * POST /auth/create-account — khớp đúng spec: chỉ ADMIN gọi được (Bearer token
 * Admin), dùng để Admin tạo tài khoản cho Staff/Manager. Trang này CHỈ truy cập
 * được sau khi đăng nhập (route "/settings/create-account", bảo vệ bởi
 * RequireAccess + capability "accessSettings" — xem App.jsx), thay cho
 * RegisterStaff.jsx công khai cũ vốn không có Bearer token nên sẽ luôn bị
 * Back-end từ chối.
 *
 * Vẫn giữ nguyên tắc bảo mật ở Mục XVII: KHÔNG cho tạo tài khoản "Administrator"
 * qua form này (Admin mới chỉ có thể được cấp thủ công/khác — tránh 1 phiên Admin
 * bị chiếm quyền có thể tự nhân bản thêm tài khoản toàn quyền qua UI). "Leader
 * Marketing" (role MANAGER) được phép tạo ở đây vì không phải role toàn quyền
 * (không có manageUsers/accessSettings — xem utils/permissions.js) và map 1-1 rõ
 * ràng sang MANAGER phía Back-end.
 */
const roleOptions = [
  { value: "Sales/Admissions", label: "Sales/Admissions — Tư vấn viên" },
  { value: "Marketing Staff", label: "Marketing Staff" },
  { value: "Leader Marketing", label: "Leader Marketing" },
];

export default function CreateAccount() {
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", role: "" });
  const [showPw, setShowPw] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.role) {
      setFieldErrors((prev) => ({ ...prev, role: "Vui lòng chọn vai trò." }));
      return;
    }
    const errors = validateRegisterForm(form);
    if (hasErrors(errors)) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    try {
      await registerStaff({ name: form.name, email: form.email, password: form.password, role: form.role });
      setSubmitted(true);
      toast.success(`Đã tạo tài khoản cho "${form.name}" thành công.`);
    } catch (err) {
      setError(err.message || "Tạo tài khoản thất bại. Vui lòng thử lại.");
      if (err.fieldErrors) setFieldErrors((prev) => ({ ...prev, ...err.fieldErrors }));
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({ name: "", email: "", password: "", confirmPassword: "", role: "" });
    setFieldErrors({});
    setError("");
    setSubmitted(false);
  };

  const inputBase =
    "w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white transition-colors";

  return (
    <div className="mx-auto max-w-lg">
      <button
        onClick={() => navigate("/settings")}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={15} />
        Quay lại Quản lý tài khoản
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Tạo tài khoản nhân viên</h1>
        <p className="mt-1 text-sm text-slate-500">Dành cho Sales và Marketing của R2S Academy.</p>

        {submitted ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <ShieldCheck size={20} />
              </div>
              <p className="text-sm font-semibold text-emerald-700">Tạo tài khoản thành công!</p>
              <p className="mt-1 text-xs text-emerald-600">Nhân viên có thể đăng nhập bằng email và mật khẩu vừa tạo.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={resetForm}
                className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Tạo tài khoản khác
              </button>
              <button
                onClick={() => navigate("/settings")}
                className="flex-1 rounded-lg bg-brand-700 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
              >
                Xong
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Họ và tên"
                  className={`${inputBase} ${fieldErrors.name ? "ring-1 ring-red-400" : ""}`}
                />
              </div>
              {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
            </div>

            <div>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Email công việc"
                  className={`${inputBase} ${fieldErrors.email ? "ring-1 ring-red-400" : ""}`}
                />
              </div>
              {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
            </div>

            <div>
              <div className="relative">
                <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className={`${inputBase} appearance-none cursor-pointer ${
                    form.role ? "text-slate-800" : "text-slate-400"
                  } ${fieldErrors.role ? "ring-1 ring-red-400" : ""}`}
                >
                  <option value="" disabled>
                    Chọn vai trò
                  </option>
                  {roleOptions.map((r) => (
                    <option key={r.value} value={r.value} className="text-slate-800">
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              {fieldErrors.role && <p className="mt-1 text-xs text-red-600">{fieldErrors.role}</p>}
            </div>

            <div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPw ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Mật khẩu (tối thiểu 8 ký tự)"
                  className={`${inputBase} pr-10 ${fieldErrors.password ? "ring-1 ring-red-400" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 transition-colors hover:text-slate-600"
                  aria-label={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
            </div>

            <div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPw ? "text" : "password"}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Xác nhận mật khẩu"
                  className={`${inputBase} ${fieldErrors.confirmPassword ? "ring-1 ring-red-400" : ""}`}
                />
              </div>
              {fieldErrors.confirmPassword && <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p>}
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand-700 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-600 active:bg-brand-800 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
              {submitting ? "Đang tạo..." : "Tạo tài khoản"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}