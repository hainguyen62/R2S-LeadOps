import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";

export default function Layout({ user, onLogout, children }) {
  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-800 flex">
      <Sidebar />
      <div className="flex-1 flex min-w-0">
        <main className="flex-1 min-w-0 overflow-x-hidden">
          <Topbar user={user} onLogout={onLogout} />
          <div className="p-6 space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
