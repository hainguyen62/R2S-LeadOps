import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Flame,
  GitBranch,
  Headphones,
  Megaphone,
  Menu,
  Shield,
  Target,
  Users,
  X,
  Zap,
} from "lucide-react";
import DashboardPreview from "../components/landing/DashboardPreview.jsx";

const navLinks = [
  { label: "Tính năng", href: "#tinh-nang" },
  { label: "Vai trò", href: "#vai-tro" },
  { label: "Quy trình", href: "#quy-trinh" },
  { label: "Phản hồi", href: "#phan-hoi" },
];

const stats = [
  { value: "248+", label: "Lead được quản lý" },
  { value: "62%", label: "Tỷ lệ liên hệ trong 24h" },
  { value: "3x", label: "Nhanh hơn phân công lead nóng" },
  { value: "4", label: "Kênh marketing tích hợp" },
];

const features = [
  {
    title: "Chấm điểm lead tự động",
    body: "Phân loại nóng, ấm, lạnh theo hành vi và nguồn để ưu tiên lead có khả năng chuyển đổi cao.",
    icon: Flame,
    tint: "from-orange-500/15 to-orange-600/5",
    iconColor: "text-orange-600",
    iconBg: "bg-orange-50",
  },
  {
    title: "Quản lý chiến dịch",
    body: "Theo dõi ngân sách, nguồn và số lead từ Facebook, Google, TikTok và landing page.",
    icon: GitBranch,
    tint: "from-brand-500/15 to-brand-600/5",
    iconColor: "text-brand-600",
    iconBg: "bg-brand-50",
  },
  {
    title: "Phễu chuyển đổi trực quan",
    body: "Nhìn thấy tỷ lệ rơi ở từng giai đoạn từ lead mới đến đăng ký khóa học.",
    icon: Target,
    tint: "from-emerald-500/15 to-emerald-600/5",
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50",
  },
  {
    title: "Báo cáo theo thời gian thực",
    body: "Dashboard tổng hợp cho Marketing và Sales trong cùng một màn hình.",
    icon: BarChart3,
    tint: "from-violet-500/15 to-violet-600/5",
    iconColor: "text-violet-600",
    iconBg: "bg-violet-50",
  },
];

const roles = [
  {
    title: "Marketing",
    icon: Megaphone,
    tint: "border-brand-200 bg-brand-50/50",
    iconTint: "bg-brand-100 text-brand-700",
    points: [
      "Theo dõi hiệu quả từng chiến dịch và nguồn lead",
      "So sánh CPL giữa Facebook, TikTok, Google",
      "Xuất báo cáo CSV cho ban lãnh đạo",
    ],
  },
  {
    title: "Sales / Tư vấn",
    icon: Headphones,
    tint: "border-emerald-200 bg-emerald-50/50",
    iconTint: "bg-emerald-100 text-emerald-700",
    points: [
      "Nhận lead nóng được phân công tự động",
      "Xem lịch sử chăm sóc trước khi gọi",
      "Cập nhật trạng thái và ghi chú nhanh",
    ],
  },
  {
    title: "Quản lý",
    icon: Shield,
    tint: "border-violet-200 bg-violet-50/50",
    iconTint: "bg-violet-100 text-violet-700",
    points: [
      "Dashboard tổng quan toàn bộ phễu tuyển sinh",
      "Phân quyền theo vai trò Admin / Marketing / Sales",
      "Nhật ký hoạt động và audit trail",
    ],
  },
];

const steps = [
  {
    title: "Thu thập lead",
    body: "Gom lead từ form, ads và landing page về một danh sách tập trung.",
  },
  {
    title: "Chấm điểm và phân công",
    body: "Hệ thống gợi ý lead nóng, giao cho tư vấn viên phù hợp ngay trong ngày.",
  },
  {
    title: "Theo dõi đến khi đăng ký",
    body: "Cập nhật trạng thái, lịch sử liên hệ và tỷ lệ chuyển đổi theo từng khóa.",
  },
];

const channelLogos = [
  { name: "Facebook", slug: "facebook", color: "1877F2" },
  { name: "Google", slug: "google", color: "4285F4" },
  { name: "TikTok", slug: "tiktok", color: "000000" },
];

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2";

function Reveal({ children, className = "", delay = 0 }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function Landing() {
  const reduce = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-[100dvh] bg-[#F8FAFC] text-slate-900 font-sans antialiased">
      {/* Navigation */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200/80 bg-[#F8FAFC]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className={`flex items-center gap-2.5 cursor-pointer ${focusRing} rounded-lg`}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">
              R2S
            </div>
            <div className="leading-tight">
              <p className="font-display text-sm font-semibold text-slate-900">R2S LeadOps</p>
              <p className="text-[11px] text-slate-500">R2S Academy</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Điều hướng chính">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`cursor-pointer text-sm font-medium text-slate-600 transition-colors duration-200 hover:text-slate-900 ${focusRing} rounded-md px-1 py-0.5`}
              >
                {link.label}
              </a>
            ))}
<Link
              to="/register"
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-700 transition-colors duration-200 hover:bg-brand-50 ${focusRing}`}
            >
              Đăng ký
            </Link>
            <Link
              to="/login"
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-500 ${focusRing}`}
            >
              Đăng nhập
              <ArrowRight size={15} strokeWidth={2} aria-hidden />
            </Link>
          </nav>

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className={`cursor-pointer rounded-lg p-2 text-slate-600 transition-colors duration-200 hover:bg-slate-100 lg:hidden ${focusRing}`}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-slate-200 bg-[#F8FAFC] px-4 py-4 lg:hidden">
            <div className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="cursor-pointer text-sm font-medium text-slate-700"
                >
                  {link.label}
                </a>
              ))}
<Link
                to="/register"
                onClick={() => setMenuOpen(false)}
                className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-700"
              >
                Đăng ký
              </Link>
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Đăng nhập
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-24 pb-12 lg:pb-20">
        <div aria-hidden className="pointer-events-none absolute inset-0 hero-grid-pattern" />
        <div
          aria-hidden
          className="hero-blob pointer-events-none absolute -right-32 top-20 h-[28rem] w-[28rem] rounded-full bg-brand-300/45 blur-3xl"
        />
        <div
          aria-hidden
          className="hero-blob-slow pointer-events-none absolute -left-24 bottom-0 h-96 w-96 rounded-full bg-emerald-300/40 blur-3xl"
        />
        <div
          aria-hidden
          className="hero-blob pointer-events-none absolute left-1/3 top-0 h-72 w-72 rounded-full bg-violet-300/25 blur-3xl"
          style={{ animationDelay: "3s" }}
        />

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
          <motion.div
            initial={reduce ? false : { opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="shimmer-badge mb-4 inline-flex items-center gap-2 rounded-full border border-brand-300 px-3 py-1.5 shadow-sm">
              <Zap size={14} className="text-brand-700" strokeWidth={2.5} aria-hidden />
              <span className="text-xs font-bold text-brand-800">Lead Management & Scoring</span>
            </div>

            <h1 className="font-display text-4xl font-bold tracking-tight text-slate-900 md:text-5xl lg:text-[3.15rem] lg:leading-[1.08]">
              Quản lý lead tập trung cho{" "}
              <span className="hero-gradient-text">đội tuyển sinh</span>
            </h1>
            <p className="mt-5 max-w-[60ch] text-base leading-relaxed text-slate-600">
              Theo dõi, chấm điểm và chuyển đổi lead từ mọi kênh marketing — xây dựng riêng cho quy trình
              tuyển sinh tại R2S Academy.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/login"
                className={`cta-glow inline-flex cursor-pointer items-center gap-2 rounded-xl bg-accent-600 px-5 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 hover:bg-accent-700 ${focusRing}`}
              >
                Truy cập
                <ArrowRight size={16} strokeWidth={2} aria-hidden />
              </Link>
              <a
                href="#tinh-nang"
                className={`inline-flex cursor-pointer items-center rounded-xl border-2 border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors duration-200 hover:border-brand-400 hover:bg-slate-50 ${focusRing}`}
              >
                Xem tính năng
              </a>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
              {["Không cần cài đặt", "Dữ liệu sẵn sàng", "Phân quyền theo vai trò"].map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="shrink-0 text-accent-600" strokeWidth={2.5} aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <DashboardPreview />
            <motion.div
              className="absolute -bottom-4 -left-4 hidden rounded-xl border border-orange-200 bg-white p-4 shadow-elevated sm:block"
              animate={reduce ? {} : { y: [0, -8, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                  <Flame size={20} strokeWidth={2} aria-hidden />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Lead nóng hôm nay</p>
                  <p className="font-display text-lg font-bold text-slate-900">36</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats bar — social proof */}
      <section className="border-y border-slate-200 bg-white py-10" aria-label="Thống kê nổi bật">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
          {stats.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 0.05}>
              <div className="text-center md:text-left">
                <p className="font-display text-3xl font-bold text-brand-600 md:text-4xl">{stat.value}</p>
                <p className="mt-1 text-sm text-slate-600">{stat.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Logo wall */}
      <section className="py-10" aria-label="Kênh tích hợp">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="mb-6 text-center text-sm font-medium text-slate-500">Tích hợp nguồn lead phổ biến</p>
          <div className="flex flex-wrap items-center justify-center gap-10 sm:gap-16">
            {channelLogos.map((logo) => (
              <img
                key={logo.slug}
                src={`https://cdn.simpleicons.org/${logo.slug}/${logo.color}`}
                alt={logo.name}
                className="h-7 w-auto opacity-75 transition-opacity duration-200 hover:opacity-100"
                width={28}
                height={28}
                loading="lazy"
              />
            ))}
            <div className="flex items-center gap-2 text-slate-500">
              <Users size={22} strokeWidth={1.5} aria-hidden />
              <span className="font-display text-sm font-semibold text-slate-600">Landing Page</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features bento */}
      <section id="tinh-nang" className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-2xl">
            <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              Mọi thứ đội Marketing và Sales cần
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Không phải CRM chung chung — được thiết kế cho quy trình tuyển sinh thực tế tại R2S Academy.
            </p>
          </Reveal>

          <div className="mt-12 grid auto-rows-fr gap-4 md:grid-cols-2 lg:grid-cols-12">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              const span =
                i === 0
                  ? "md:col-span-2 lg:col-span-7 lg:row-span-2"
                  : i === 1
                    ? "lg:col-span-5"
                    : i === 2
                      ? "lg:col-span-5"
                      : "md:col-span-2 lg:col-span-12";
              const isLarge = i === 0;

              return (
                <Reveal key={feature.title} delay={i * 0.06} className={span}>
                  <div
                    className={`group relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 transition-shadow duration-200 hover:shadow-elevated lg:p-8 ${
                      isLarge ? "min-h-[260px]" : ""
                    }`}
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${feature.tint} pointer-events-none`}
                      aria-hidden
                    />
                    <div className="relative">
                      <div
                        className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${feature.iconBg} ${feature.iconColor}`}
                      >
                        <Icon size={22} strokeWidth={2} aria-hidden />
                      </div>
                      <h3 className="font-display text-xl font-semibold text-slate-900">{feature.title}</h3>
                      <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600">{feature.body}</p>

                      {isLarge && (
                        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <div className="mb-3 flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-600">Phân loại lead</span>
                            <span className="text-slate-400">Hôm nay</span>
                          </div>
                          <div className="flex gap-3">
                            {[
                              { label: "Nóng", value: 36, color: "bg-orange-500" },
                              { label: "Ấm", value: 128, color: "bg-amber-400" },
                              { label: "Lạnh", value: 84, color: "bg-brand-400" },
                            ].map((item) => (
                              <div key={item.label} className="flex-1">
                                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                                  <div
                                    className={`h-full rounded-full ${item.color}`}
                                    style={{ width: `${(item.value / 248) * 100}%` }}
                                  />
                                </div>
                                <p className="mt-1.5 text-[11px] font-medium text-slate-600">
                                  {item.label}{" "}
                                  <span className="text-slate-900">{item.value}</span>
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Solutions by role */}
      <section id="vai-tro" className="border-y border-slate-200 bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              Giải pháp theo vai trò
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Mỗi thành viên trong đội tuyển sinh có góc nhìn riêng — LeadOps hỗ trợ tất cả trên cùng một nền tảng.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {roles.map((role, i) => {
              const Icon = role.icon;
              return (
                <Reveal key={role.title} delay={i * 0.08}>
                  <article
                    className={`flex h-full flex-col rounded-2xl border p-6 lg:p-7 ${role.tint}`}
                  >
                    <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${role.iconTint}`}>
                      <Icon size={22} strokeWidth={2} aria-hidden />
                    </div>
                    <h3 className="font-display text-lg font-semibold text-slate-900">{role.title}</h3>
                    <ul className="mt-4 flex flex-1 flex-col gap-3">
                      {role.points.map((point) => (
                        <li key={point} className="flex gap-2 text-sm leading-relaxed text-slate-600">
                          <CheckCircle2
                            size={16}
                            className="mt-0.5 shrink-0 text-accent-600"
                            strokeWidth={2.5}
                            aria-hidden
                          />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section id="quy-trinh" className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <Reveal>
              <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                Từ lead mới đến học viên đăng ký
              </h2>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-slate-600">
                Quy trình 3 bước giúp giảm lead bị bỏ quên và tăng tốc phản hồi cho khách hàng tiềm năng.
              </p>
            </Reveal>

            <div className="space-y-4">
              {steps.map((step, i) => (
                <Reveal key={step.title} delay={i * 0.08}>
                  <div className="flex gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 font-display text-lg font-bold text-brand-600"
                      aria-hidden
                    >
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="font-display text-lg font-semibold text-slate-900">{step.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">{step.body}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section id="phan-hoi" className="border-y border-slate-200 bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <blockquote className="mx-auto max-w-3xl text-center">
              <p className="font-display text-2xl font-medium leading-snug text-slate-800 md:text-3xl">
                &ldquo;Lead nóng được giao ngay trong buổi sáng, không còn tình trạng lead Facebook nằm im cả
                tuần.&rdquo;
              </p>
            </blockquote>
          </Reveal>
        </div>
      </section>

      {/* Final CTA */}
      <section className="pb-20 lg:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="cta-mesh-bg relative overflow-hidden rounded-3xl px-8 py-12 text-center shadow-elevated md:px-16 md:py-16">
              <div aria-hidden className="pointer-events-none absolute inset-0 hero-grid-pattern opacity-40" />
              <div
                aria-hidden
                className="hero-blob pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/15 blur-2xl"
              />
              <div
                aria-hidden
                className="hero-blob-slow pointer-events-none absolute -bottom-16 -right-16 h-72 w-72 rounded-full bg-emerald-300/40 blur-2xl"
              />
              <div className="relative">
                <h2 className="font-display text-3xl font-bold text-white md:text-4xl">
                  Sẵn sàng quản lý lead hiệu quả hơn?
                </h2>
                <p className="mx-auto mt-4 max-w-lg text-base text-brand-100">
                  Truy cập với tài khoản test và khám phá dashboard ngay hôm nay.
                </p>
                <Link
                  to="/login"
                  className={`mt-8 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-brand-700 shadow-lg transition-transform duration-200 hover:-translate-y-0.5 hover:bg-brand-50 ${focusRing}`}
                >
                  Đăng nhập
                  <ArrowRight size={16} strokeWidth={2} aria-hidden />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">
              R2S
            </div>
            <div>
              <p className="font-display text-sm font-semibold text-slate-900">R2S LeadOps</p>
              <p className="text-xs text-slate-500">Đào tạo kỹ năng là nền tảng</p>
            </div>
          </div>
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} R2S Academy. Dự án LeadOps.
          </p>
        </div>
      </footer>
    </div>
  );
}