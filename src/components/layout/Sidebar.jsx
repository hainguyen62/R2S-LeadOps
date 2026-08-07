import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  GitBranch,
  History,
  BarChart3,
  Settings,
} from "lucide-react";
import { navItems } from "../../data/mockData.js";

const iconMap = {
  LayoutDashboard,
  Users,
  GitBranch,
  History,
  BarChart3,
  Settings,
};

export default function Sidebar() {
  return (
    <aside className="w-60 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col">
      <div className="h-16 flex items-center gap-2 px-5 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center font-bold text-sm text-white">
          R2S
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-white">R2S Academy</p>
          <p className="text-[11px] text-slate-400">Đào tạo kỹ năng là nền tảng</p>
        </div>
      </div>
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
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
  );
}
