import { useState } from "react";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";
import ScrollToTopButton from "../ui/ScrollToTopButton.jsx";

export default function Layout({ user, onLogout, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-800 flex">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex min-w-0">
        <main className="flex-1 min-w-0 overflow-x-hidden">
          <Topbar user={user} onLogout={onLogout} sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((v) => !v)} />
          <div className="p-6 space-y-6">{children}</div>
        </main>
      </div>
      <ScrollToTopButton />
    </div>
  );
}