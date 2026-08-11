import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Courses", href: "/courses" },
  { label: "About Us", href: "/about" },
];

export default function PublicHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[#000c20]/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          to="/"
          className="flex cursor-pointer items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#000c20]"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white overflow-hidden shrink-0">
            <img src="/images/logor2s.jpg" alt="R2S" className="w-full h-full object-contain" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-white">
              R2S <span className="text-brand-400">ACADEMY</span>
            </p>
            <p className="text-[11px] text-slate-400">Đào tạo lập trình</p>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 lg:flex" aria-label="Điều hướng chính">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="cursor-pointer text-sm font-medium text-slate-300 transition-colors duration-200 hover:text-white"
            >
              {link.label}
            </a>
          ))}
          <Link
            to="/login"
            className="cursor-pointer rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-white/10"
          >
            Đăng Nhập
          </Link>
          <Link
            to="/consultation"
            className="cursor-pointer rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-700"
          >
            Đăng ký nhận tư vấn
          </Link>
        </nav>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="cursor-pointer rounded-lg p-2 text-slate-300 transition-colors duration-200 hover:bg-white/10 lg:hidden"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-white/10 bg-[#000c20]/95 px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="cursor-pointer text-sm font-medium text-slate-300 hover:text-white"
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="cursor-pointer rounded-lg border border-white/20 px-4 py-2.5 text-center text-sm font-semibold text-white"
            >
              Đăng nhập
            </Link>
            <Link
              to="/consultation"
              onClick={() => setMenuOpen(false)}
              className="cursor-pointer rounded-lg bg-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-white"
            >
              Đăng ký nhận tư vấn
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}