import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Lock, LogIn, Loader2, Eye, EyeOff, Zap, ShieldCheck, UserPlus } from "lucide-react";
import Avatar from "../components/ui/Avatar.jsx";
import PublicHeader from "../components/layout/PublicHeader.jsx";
import { login } from "../services/authService.js";
import { validateLoginForm, hasErrors } from "../utils/validators.js";
import { useToast } from "../components/ui/ToastProvider.jsx";

// Tài khoản test mặc định
const testAccounts = [
  { name: "Admin", email: "admin@r2s.edu.vn", role: "Administrator" },
  { name: "Leader Marketing", email: "marketing@r2s.edu.vn", role: "Leader Marketing" },
  { name: "Tư vấn viên A", email: "tva@r2s.edu.vn", role: "Sales/Admissions" },
  { name: "Tư vấn viên B", email: "tvb@r2s.edu.vn", role: "Sales/Admissions" },
];

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const doLogin = async (loginEmail, loginPassword) => {
    setError("");
    const errors = validateLoginForm({ email: loginEmail, password: loginPassword });
    if (hasErrors(errors)) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    try {
      const user = await login({ email: loginEmail, password: loginPassword });
      toast.success(`Đăng nhập thành công! Chào mừng ${user?.name || "bạn"} quay trở lại.`);
      onLogin(user);
    } catch (err) {
      setError(err.message || "Đăng nhập thất bại. Vui lòng thử lại.");
      if (err.fieldErrors) setFieldErrors(err.fieldErrors);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    doLogin(email, password);
  };

  const quickLogin = (acc) => {
    setEmail(acc.email);
    setPassword("123456");
    doLogin(acc.email, "123456");
  };

  const inputBase =
    "w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white transition-colors";

  return (
    <div className="min-h-[100dvh] w-full bg-gradient-to-br from-[#000c20] to-[#001a40] text-slate-900 antialiased">
      <PublicHeader />

<div className="mx-auto grid min-h-[100dvh] max-w-7xl items-center gap-12 px-4 pb-16 pt-24 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        {/* Left — Hero */}
        <div className="text-center lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-300">
            Chào mừng trở lại
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-tight text-white md:text-5xl">
            Chào mừng bạn trở lại!
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-slate-400 md:text-lg">
            Đăng nhập để truy cập tài khoản của bạn.
          </p>
        </div>

        {/* Right — Form card */}
        <div className="mx-auto w-full max-w-md">
          <div className="rounded-2xl bg-white p-8 shadow-elevated">
            <h2 className="text-xl font-bold text-slate-900">Đăng nhập</h2>
            <p className="mt-1 text-sm text-slate-500">Truy cập vào hệ thống R2S LeadOps.</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className={`${inputBase} ${fieldErrors.email ? "ring-1 ring-red-400" : ""}`}
                  />
                </div>
                {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
              </div>

              <div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mật khẩu"
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
                <div className="mt-2 text-right">
                  <a
                    href="#forgot"
                    className="cursor-pointer text-xs font-medium text-brand-600 hover:text-brand-700"
                  >
                    Quên mật khẩu?
                  </a>
                </div>
              </div>

              {error && (
                <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand-700 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-600 active:bg-brand-800 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
                {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
              </button>
            </form>

            {/* Divider + social login */}
            <div className="mt-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-400">Hoặc đăng nhập với</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="mt-4 flex justify-center gap-4">
              <button
                type="button"
                aria-label="Đăng nhập với Google"
                className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-slate-200 text-slate-700 transition-colors duration-200 hover:border-slate-300 hover:bg-slate-50"
              >
                <span className="text-base font-bold">G</span>
              </button>
              <button
                type="button"
                aria-label="Đăng nhập với Facebook"
                className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-slate-200 text-slate-700 transition-colors duration-200 hover:border-slate-300 hover:bg-slate-50"
              >
                <span className="text-base font-bold">f</span>
              </button>
            </div>

            {/* Test accounts */}
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-3 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                <Zap size={12} className="text-amber-500" /> Tài khoản test (click để đăng nhập nhanh)
              </p>
              <div className="space-y-2">
                {testAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    onClick={() => quickLogin(acc)}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left transition-colors hover:border-brand-500/60 hover:bg-slate-50"
                  >
                    <Avatar
                      name={acc.name}
                      initials={acc.name.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase()}
                      size={28}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">{acc.name}</p>
                      <p className="text-[11px] text-slate-500">{acc.email}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                      {acc.role}
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-center text-[11px] text-slate-400">
                Mật khẩu mặc định: <span className="text-slate-500">123456</span>
              </p>
            </div>

            <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
              <ShieldCheck size={14} className="shrink-0 text-emerald-500" />
              Thông tin của bạn được bảo mật.
            </p>

            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="text-center text-sm text-slate-500">Chưa có tài khoản nhân viên?</p>
              <Link
                to="/register"
                className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-brand-200 bg-white py-2.5 text-sm font-semibold text-brand-700 transition-colors duration-200 hover:bg-brand-50"
              >
                <UserPlus size={16} />
                Đăng ký tài khoản
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}