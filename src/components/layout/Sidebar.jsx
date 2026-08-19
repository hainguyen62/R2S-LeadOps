import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  GitBranch,
  History,
  BarChart3,
  Settings,
  CalendarClock,
  Webhook,
  Ticket,
  GraduationCap,
  X,
} from "lucide-react";
import { navItems } from "../../data/mockData.js";
import { canAccessPath } from "../../utils/permissions.js";

const iconMap = {
  LayoutDashboard,
  Users,
  GitBranch,
  History,
  BarChart3,
  Settings,
  CalendarClock,
  Webhook,
  Ticket,
  GraduationCap,
};

export default function Sidebar({ open = false, onClose, user }) {
  // Chỉ hiện các mục menu mà vai trò hiện tại được phép truy cập (Mục IV) —
  // route guard ở App.jsx (RequireAccess) đã chặn cả khi gõ URL trực tiếp,
  // đây là lớp ẩn UI tương ứng để không hiện link dẫn tới trang bị chặn.
  const visibleItems = navItems.filter((item) => canAccessPath(user, item.path));

  return (
    <>
      {/* Overlay tối phía sau sidebar — chỉ hiện trên mobile khi sidebar đang mở */}
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/60 md:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col transform transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:static md:z-auto md:transform-none md:transition-[width] ${
          open ? "md:w-60" : "md:w-0 md:border-r-0 md:overflow-hidden"
        }`}
      >
        <div className="h-16 flex items-center gap-2 px-5 border-b border-slate-800 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 overflow-hidden">
            <img src="/images/logor2s.jpg" alt="R2S" className="w-full h-full object-contain" />
          </div>
          <div className="leading-tight flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">R2S Academy</p>
            <p className="text-[11px] text-slate-400 truncate">Đào tạo kỹ năng là nền tảng</p>
          </div>
          {/* Nút đóng sidebar — hiện ở mọi kích thước màn hình */}
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 -mr-1 shrink-0"
            aria-label="Đóng menu"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto w-60">
          {visibleItems.map((item) => {
            const Icon = iconMap[item.icon] || Users;
            return (
              <NavLink
                key={item.label}
                to={item.path}
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ease-out ${
                    isActive
                      ? "bg-brand-600 text-white shadow-md"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`
                }
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}