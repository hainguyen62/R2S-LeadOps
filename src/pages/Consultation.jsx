import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Phone, Mail, BookOpen, ShieldCheck, Send, AlertTriangle, Loader2 } from "lucide-react";
import PublicHeader from "../components/layout/PublicHeader.jsx";
import { createLead, findDuplicateLead } from "../services/leadService.js";
import { isValidPhone, isValidEmail } from "../utils/validators.js";

const courses = [
  "ReactJS & Frontend",
  "Node.js & Backend",
  "AWS Cloud Computing",
];

export default function Consultation() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    course: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Luồng "Tiếp nhận lead từ Form/Landing Page" (Mục XIII.1 kế hoạch):
  // Front-end validate -> kiểm tra trùng -> tạo lead qua leadService (POST /api/leads).
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.fullName.trim() || !form.phone.trim() || !form.email.trim() || !form.course) {
      setError("Đăng ký thất bại: vui lòng điền đầy đủ thông tin và chọn khóa học.");
      return;
    }
    if (!isValidPhone(form.phone)) {
      setError("Đăng ký thất bại: số điện thoại không đúng định dạng (vd: 0901234567).");
      return;
    }
    if (!isValidEmail(form.email)) {
      setError("Đăng ký thất bại: email không đúng định dạng.");
      return;
    }

    setSubmitting(true);
    try {
      const duplicate = await findDuplicateLead({ phone: form.phone, email: form.email });
      if (duplicate) {
        const { lead, samePhone, sameEmail } = duplicate;
        const reason =
          samePhone && sameEmail
            ? "số điện thoại và email này"
            : samePhone
              ? "số điện thoại này"
              : "email này";
        setError(
          `Đăng ký thất bại: ${reason} đã tồn tại trong hệ thống (lead "${lead.name}", trạng thái "${lead.status}", phụ trách bởi ${lead.assignee}). Vui lòng chờ tư vấn viên liên hệ hoặc dùng thông tin liên hệ khác.`
        );
        return;
      }

      await createLead({
        name: form.fullName,
        course: form.course,
        source: "Landing Page",
        phone: form.phone,
        email: form.email,
        assignee: "Chưa phân công",
      });

      setSubmitted(true);
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err.message || "Đăng ký thất bại. Vui lòng thử lại.");
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
            Tuyển sinh 2026
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-tight text-white md:text-5xl">
            Nhận tư vấn khóa học
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-slate-400 md:text-lg">
            Đăng ký ngay để được tư vấn lộ trình phù hợp!
          </p>
        </div>

        {/* Right — Form card */}
        <div className="mx-auto w-full max-w-md">
          <div className="rounded-2xl bg-white p-8 shadow-elevated">
            <h2 className="text-xl font-bold text-slate-900">Đăng ký tư vấn</h2>
            <p className="mt-1 text-sm text-slate-500">
              Điền thông tin để chúng tôi liên hệ tư vấn cho bạn.
            </p>

            {submitted ? (
              <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <ShieldCheck size={20} />
                </div>
                <p className="text-sm font-semibold text-emerald-700">
                  Đăng ký thành công!
                </p>
                <p className="mt-1 text-xs text-emerald-600">
                  Thông tin của bạn đã được ghi nhận, không trùng với lead nào trong hệ thống. Đang chuyển đến
                  trang đăng nhập...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder="Họ và tên"
                    className={inputBase}
                  />
                </div>

                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Số điện thoại"
                    className={inputBase}
                  />
                </div>

                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Email"
                    className={inputBase}
                  />
                </div>

                <div className="relative">
                  <BookOpen size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    name="course"
                    value={form.course}
                    onChange={handleChange}
                    className={`${inputBase} appearance-none cursor-pointer ${
                      form.course ? "text-slate-800" : "text-slate-400"
                    }`}
                  >
                    <option value="" disabled>
                      Chọn khóa học
                    </option>
                    {courses.map((c) => (
                      <option key={c} value={c} className="text-slate-800">
                        {c}
                      </option>
                    ))}
                  </select>
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
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {submitting ? "Đang gửi..." : "Gửi thông tin"}
                </button>
              </form>
            )}

            <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
              <ShieldCheck size={14} className="shrink-0 text-emerald-500" />
              Thông tin của bạn được bảo mật và chỉ dùng để tư vấn khóa học.
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