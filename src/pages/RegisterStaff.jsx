import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Briefcase, ShieldCheck, UserPlus, Loader2, Eye, EyeOff, AlertTriangle } from "lucide-react";
import PublicHeader from "../components/layout/PublicHeader.jsx";
import { registerStaff } from "../services/authService.js";
import { validateRegisterForm, hasErrors } from "../utils/validators.js";
import { useToast } from "../components/ui/ToastProvider.jsx";

// Vai trò nhân viên có thể tự đăng ký — chỉ 2 vai trò tuyến đầu theo Mục IV kế hoạch.
// KHÔNG cho tự chọn "Administrator" (chỉ Admin khác mới cấp được) hay "Leader Marketing"
// (vai trò Product Owner/lãnh đạo — chỉ có 1 người, do Admin chỉ định thủ công), theo
// đúng nguyên tắc bảo mật ở Mục XVII: tài khoản có quyền cao không nên tự đăng ký công khai.
const roleOptions = [
  { value: "Sales/Admissions", label: "Sales/Admissions — Tư vấn viên" },
  { value: "Marketing Staff", label: "Marketing Staff" },
];

export default function RegisterStaff() {
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

  // Luồng "Tạo tài khoản" (Module 1) — Front-end validate -> POST /api/auth/register
  // qua authService.registerStaff (mock cho tới khi có Back-end thật).
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
      toast.success("Đăng ký tài khoản nhân viên thành công! Vui lòng đăng nhập.");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err.message || "Đăng ký thất bại. Vui lòng thử lại.");
      if (err.fieldErrors) setFieldErrors((prev) => ({ ...prev, ...err.fieldErrors }));
    } finally {
      setSubmitting(false);
    }
  };

  const inputBase =
    "w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white transition-colors";

  return (
    <div className="min-h-[100dvh] w-full bg-gradient-to-br from-[#000c20] to-[#001a40] text-slate-900 antialiased">
      <PublicHeader />

      <div className="mx-auto grid min-h-[100dvh] max-w-7xl items-center gap-12 px-4 pb-16 pt-24 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        {/* Left — Hero */}
        <div className="text-center lg:text-left">
          <img src="/images/logor2s.jpg" alt="R2S" className="mx-auto lg:mx-0 h-14 w-14 rounded-2xl bg-white object-contain p-1.5 shadow-elevated" />
          <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-300">
            Nội bộ R2S Academy
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-tight text-white md:text-5xl">
            Đăng ký tài khoản nhân viên
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-slate-400 md:text-lg">
            Dành cho nhân viên Sales và Marketing của R2S Academy để truy cập hệ thống R2S LeadOps.
          </p>
        </div>

        {/* Right — Form card */}
        <div className="mx-auto w-full max-w-md">
          <div className="rounded-2xl bg-white p-8 shadow-elevated">
            <h2 className="text-xl font-bold text-slate-900">Đăng ký tài khoản</h2>
            <p className="mt-1 text-sm text-slate-500">Tạo tài khoản để đăng nhập vào R2S LeadOps.</p>

            {submitted ? (
              <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <ShieldCheck size={20} />
                </div>
                <p className="text-sm font-semibold text-emerald-700">Đăng ký thành công!</p>
                <p className="mt-1 text-xs text-emerald-600">Đang chuyển đến trang đăng nhập...</p>
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
                      placeholder="Mật khẩu (tối thiểu 6 ký tự)"
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
                  {fieldErrors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p>
                  )}
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
                  {submitting ? "Đang đăng ký..." : "Đăng ký tài khoản"}
                </button>
              </form>
            )}

            <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
              <ShieldCheck size={14} className="shrink-0 text-emerald-500" />
              Chỉ dành cho nhân viên nội bộ R2S Academy.
            </p>

            <p className="mt-4 border-t border-slate-100 pt-4 text-center text-sm text-slate-500">
              Đã có tài khoản?{" "}
              <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}