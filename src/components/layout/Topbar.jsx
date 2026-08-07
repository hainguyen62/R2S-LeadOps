import { Search, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import Avatar from "../ui/Avatar.jsx";
import NotificationBell from "./NotificationBell.jsx";

export default function Topbar({ user, onLogout }) {
  const initials = user?.name
    ? user.name.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase()
    : "TA";

  return (
    <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 bg-white/80 backdrop-blur">
      <h1 className="text-lg font-semibold text-slate-900">R2S LeadOps</h1>
      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Tìm kiếm lead..."
            className="bg-slate-100 border border-slate-300 rounded-input pl-9 pr-3 py-1.5 text-sm w-56 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all duration-200 ease-out"
          />
        </div>
        <NotificationBell />
        <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity" title="Hồ sơ cá nhân">
          <Avatar name={user?.name || "Tư vấn viên A"} initials={initials} size={30} />
          <span className="text-sm text-slate-700 hidden md:inline">{user?.name}</span>
        </Link>
        <button
          onClick={onLogout}
          className="text-slate-500 hover:text-slate-800"
          title="Đăng xuất"
        >
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );
}
