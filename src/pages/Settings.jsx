import { useMemo, useState } from "react";
import {
  Users,
  Activity,
  Bell,
  Link,
  ExternalLink,
  Pencil,
  Trash2,
  X,
  Search,
  ListFilter,
  Plus,
  ChevronLeft,
ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import Avatar from "../components/ui/Avatar.jsx";
import Pill from "../components/ui/Pill.jsx";
import { users, activityLogs } from "../data/mockData.js";

const roleStyle = {
  Admin: "bg-red-50 text-red-800",
  Marketing: "bg-violet-50 text-violet-800",
  Sales: "bg-blue-50 text-blue-800",
};

const tabs = [
  { id: "users", label: "Quản lý tài khoản", icon: Users },
  { id: "logs", label: "Nhật ký hoạt động", icon: Activity },
  { id: "notify", label: "Thông báo", icon: Bell },
  { id: "integrations", label: "Kết nối", icon: Link },
];

const pageSize = 4;

// Các cột có thể sắp xếp (tương tự trang Lead):
//   key  -> trường dữ liệu của user
//   label -> tiêu đề cột hiển thị
//   type -> loại dữ liệu để so sánh ('string' | 'boolean')
const sortableColumns = [
  { key: "name", label: "Họ tên", type: "string" },
  { key: "role", label: "Vai trò", type: "string" },
  { key: "email", label: "Email", type: "string" },
  { key: "status", label: "Trạng thái", type: "string" },
];

export default function Settings() {
  const [tab, setTab] = useState("users");
  const [userList, setUserList] = useState(users);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", role: "", email: "" });

  // Tìm kiếm + lọc + phân trang + sắp xếp (giống trang Lead)
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("Tất cả");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState(null); // 'desc' | 'asc' | null

  // Thêm tài khoản
  const [showAdd, setShowAdd] = useState(false);
  const emptyForm = { name: "", role: "", email: "" };
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});

  const roles = ["Tất cả", "Sales", "Marketing", "Admin"];

  const openEdit = (user) => {
    setEditingUser(user);
    setEditForm({ name: user.name, role: user.role, email: user.email });
  };

  const saveEdit = () => {
    setUserList((list) =>
      list.map((u) => (u.id === editingUser.id ? { ...u, ...editForm } : u))
    );
    setEditingUser(null);
  };

  const deleteUser = (id) => {
    setUserList((list) => list.filter((u) => u.id !== id));
  };

  // Lọc + sắp xếp cùng lúc, giữ nguyên bộ lọc/tìm kiếm
  const filtered = useMemo(() => {
    let rows = userList.filter((u) => {
      const matchQ =
        !query ||
        u.name.toLowerCase().includes(query.toLowerCase()) ||
        u.email.toLowerCase().includes(query.toLowerCase());
      const matchR = roleFilter === "Tất cả" || u.role === roleFilter;
      return matchQ && matchR;
    });

    // Sắp xếp chỉ khi có sortKey + sortDir được chọn
    if (sortKey && sortDir) {
      const dir = sortDir === "asc" ? 1 : -1;
      rows = [...rows].sort((a, b) => {
        const va = String(a[sortKey] ?? "");
        const vb = String(b[sortKey] ?? "");
        return va.localeCompare(vb, "vi", { sensitivity: "base" }) * dir;
      });
    }

    return rows;
  }, [userList, query, roleFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const resetPage = () => setPage(1);

  // Cơ chế click tiêu đề cột giống trang Lead:
  //   lần 1 -> desc (↓), lần 2 -> asc (↑), lần 3 -> hủy (↕ về mặc định)
  const handleSort = (key) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("desc");
    } else if (sortDir === "desc") {
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortKey(null);
      setSortDir(null);
    }
    resetPage();
  };

  const renderSortIcon = (key) => {
    if (sortKey === key && sortDir === "desc") {
      return <ArrowDown size={13} className="text-brand-600" />;
    }
    if (sortKey === key && sortDir === "asc") {
      return <ArrowUp size={13} className="text-brand-600" />;
    }
    return <ArrowUpDown size={13} className="text-slate-300" />;
  };

  const validateForm = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = "Vui lòng nhập tên tài khoản.";
    if (!form.role) errors.role = "Vui lòng chọn vai trò.";
    if (!form.email.trim()) {
      errors.email = "Vui lòng nhập email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = "Email không hợp lệ.";
    }
    return errors;
  };

  const handleAdd = (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setUserList((list) => [
      ...list,
      {
        id: Date.now(),
        name: form.name.trim(),
        role: form.role,
        email: form.email.trim(),
        status: "Hoạt động",
      },
    ]);
    setShowAdd(false);
    setForm(emptyForm);
    resetPage();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Cài đặt</h2>
        <p className="text-sm text-slate-500">Quản lý tài khoản, nhật ký hoạt động và cấu hình hệ thống</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-card text-sm transition-all duration-200 ease-out ${
                tab === t.id
                  ? "bg-brand-600 text-white shadow-sm"
                  : "border border-slate-300 text-slate-500 hover:bg-slate-100"
              }`}
            >
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

{/* Users tab */}
      {tab === "users" && (
        <>
          {/* Header + nút thêm tài khoản */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Quản lý tài khoản</h2>
              <p className="text-sm text-slate-500">Quản lý người dùng và phân quyền truy cập hệ thống</p>
            </div>
            <button
              onClick={() => { setForm(emptyForm); setFormErrors({}); setShowAdd(true); }}
              className="flex items-center gap-1.5 text-xs bg-brand-600 rounded-card px-3 py-2 text-white hover:bg-brand-500 shadow-sm hover:shadow-md transition-all duration-200 ease-out"
            >
              <Plus size={14} /> Thêm tài khoản
            </button>
          </div>

          {/* Bộ lọc */}
          <div className="bg-white border border-slate-300 rounded-card p-4 flex flex-wrap items-center gap-3 shadow-card transition-all duration-200 ease-out hover:shadow-elevated">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); resetPage(); }}
                placeholder="Tìm theo tên, email..."
                className="w-full bg-slate-50 border border-slate-300 rounded-input pl-9 pr-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all duration-200 ease-out"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); resetPage(); }}
                className="bg-slate-50 border border-slate-300 rounded-input px-3 py-2 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200 ease-out"
              >
                {roles.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <button className="flex items-center gap-1.5 text-xs border border-slate-300 rounded-card px-3 py-2 text-slate-600 hover:bg-slate-100 shadow-sm hover:shadow-md transition-all duration-200 ease-out">
                <ListFilter size={14} /> Bộ lọc
              </button>
            </div>
          </div>

          {/* Bảng tài khoản */}
          <div className="bg-white border border-slate-300 rounded-card overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] text-slate-600 border-b border-slate-200 bg-slate-100/50">
                    {sortableColumns.map((col) => (
                      <th key={col.key} className="py-3 px-4 font-semibold">
                        <button
                          type="button"
                          onClick={() => handleSort(col.key)}
                          className="inline-flex items-center gap-1 hover:text-slate-900 transition-colors duration-200 ease-out"
                          title="Bấm để sắp xếp (↓ giảm dần, ↑ tăng dần, bấm lần nữa để hủy)"
                        >
                          {col.label}
                          {renderSortIcon(col.key)}
                        </button>
                      </th>
                    ))}
                    <th className="py-3 px-4 font-semibold text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((u) => (
                    <tr key={u.id} className="border-b border-slate-200/70 hover:bg-brand-50/60 transition-colors duration-150">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Avatar name={u.name} initials={u.name.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase()} size={28} />
                          <span className="whitespace-nowrap font-medium text-slate-800">{u.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4"><Pill text={u.role} map={roleStyle} /></td>
                      <td className="py-3 px-4 text-slate-500">{u.email}</td>
                      <td className="py-3 px-4">
                        <span className="text-xs text-emerald-600 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" /> {u.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(u)}
                            title="Sửa"
                            className="p-1.5 rounded-md text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => deleteUser(u.id)}
                            disabled={u.role === "Admin"}
                            title={u.role === "Admin" ? "Không thể xóa tài khoản Admin" : "Xóa"}
                            className={`p-1.5 rounded-md transition-colors duration-150 ${
                              u.role === "Admin"
                                ? "text-slate-300 cursor-not-allowed"
                                : "text-slate-500 hover:bg-red-50 hover:text-red-600"
                            }`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pageRows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-500 text-sm">
                        Không tìm thấy tài khoản nào phù hợp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Phân trang */}
            <div className="flex items-center justify-between px-4 py-3 text-xs text-slate-500">
              <span>
                {filtered.length === 0
                  ? "0 kết quả"
                  : `Hiển thị ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filtered.length)} của ${filtered.length}`}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-md border border-slate-300 hover:bg-slate-50 disabled:opacity-40"
                  disabled={page === 1}
                >
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`w-7 h-7 rounded-md text-xs ${
                      page === i + 1
                        ? "bg-brand-600 text-white"
                        : "border border-slate-300 hover:bg-slate-50 text-slate-500"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-md border border-slate-300 hover:bg-slate-50 disabled:opacity-40"
                  disabled={page === totalPages}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Modal sửa tài khoản */}
          {editingUser && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white border border-slate-300 rounded-card w-full max-w-md p-6 shadow-modal">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900">Sửa tài khoản</h3>
                  <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600">
                    <X size={18} />
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Tên tài khoản</label>
                    <input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-input px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200 ease-out"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Vai trò</label>
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200 ease-out"
                    >
                      <option>Sales</option>
                      <option>Marketing</option>
                      <option>Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Email</label>
                    <input
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-input px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200 ease-out"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => setEditingUser(null)}
                    className="flex-1 border border-slate-300 rounded-card py-2 text-sm text-slate-600 hover:bg-slate-100 shadow-sm hover:shadow-md transition-all duration-200 ease-out"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={saveEdit}
                    className="flex-1 bg-brand-600 hover:bg-brand-500 rounded-card py-2 text-sm text-white shadow-sm hover:shadow-md transition-all duration-200 ease-out"
                  >
                    Lưu
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal thêm tài khoản */}
          {showAdd && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white border border-slate-300 rounded-card w-full max-w-md p-6 shadow-modal">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900">Thêm tài khoản mới</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Các trường có dấu * là bắt buộc</p>
                  </div>
                  <button onClick={() => { setShowAdd(false); setFormErrors({}); }} className="text-slate-400 hover:text-slate-600">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleAdd} className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Tên tài khoản *</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Nguyễn Văn A"
                      className={`w-full bg-slate-50 border rounded-input px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200 ease-out ${
                        formErrors.name ? "border-red-300 focus:border-red-400" : "border-slate-300 focus:border-brand-500"
                      }`}
                    />
                    {formErrors.name && <p className="text-[11px] text-red-600 mt-1">{formErrors.name}</p>}
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Vai trò *</label>
                    <select
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      className={`w-full bg-slate-50 border rounded-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200 ease-out ${
                        formErrors.role ? "border-red-300 focus:border-red-400" : "border-slate-300 focus:border-brand-500"
                      }`}
                    >
                      <option value="">Chọn vai trò</option>
                      <option>Sales</option>
                      <option>Marketing</option>
                      <option>Admin</option>
                    </select>
                    {formErrors.role && <p className="text-[11px] text-red-600 mt-1">{formErrors.role}</p>}
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Email *</label>
                    <input
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="email@gmail.com"
                      className={`w-full bg-slate-50 border rounded-input px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200 ease-out ${
                        formErrors.email ? "border-red-300 focus:border-red-400" : "border-slate-300 focus:border-brand-500"
                      }`}
                    />
                    {formErrors.email && <p className="text-[11px] text-red-600 mt-1">{formErrors.email}</p>}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => { setShowAdd(false); setFormErrors({}); }}
                      className="flex-1 border border-slate-300 rounded-card py-2 text-sm text-slate-600 hover:bg-slate-100 shadow-sm hover:shadow-md transition-all duration-200 ease-out"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-brand-600 hover:bg-brand-500 rounded-card py-2 text-sm text-white shadow-sm hover:shadow-md transition-all duration-200 ease-out"
                    >
                      Thêm tài khoản
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}

{/* Logs tab */}
      {tab === "logs" && (
        <div className="bg-white border border-slate-300 rounded-card p-6 shadow-card">
          <div className="space-y-3">
            {activityLogs.map((log) => (
              <div key={log.id} className="flex items-center gap-3 py-2.5 border-b border-slate-200/70 last:border-0">
                <Avatar name={log.user} initials={log.user.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase()} size={32} />
                <div className="flex-1">
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">{log.user}</span>{" "}
                    <span className="text-slate-500">{log.action}</span>
                  </p>
                  <p className="text-[11px] text-slate-500">{log.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notify tab */}
      {tab === "notify" && (
        <div className="bg-white border border-slate-300 rounded-card p-6 max-w-xl shadow-card">
          <div className="space-y-4">
            {[
              { title: "Thông báo lead nóng", desc: "Nhận cảnh báo khi có lead mới được phân loại Lead nóng", on: true },
              { title: "Thông báo qua email", desc: "Gửi email thông báo khi có lead mới hoặc lead nóng", on: true },
              { title: "Thông báo qua Telegram", desc: "Gửi tin nhắn Telegram khi có lead nóng", on: false },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
                <div
                  className={`w-10 h-6 rounded-full relative transition-colors cursor-pointer ${
                    item.on ? "bg-brand-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all`}
                    style={{ left: item.on ? "18px" : "2px" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Integrations tab */}
      {tab === "integrations" && (
        <div className="bg-white border border-slate-300 rounded-card p-6 max-w-xl shadow-card">
          <div className="space-y-4">
            {[
              { name: "Facebook / TikTok Ads", desc: "Nhận lead từ quảng cáo", status: "Đã kết nối" },
              { name: "Landing Page", desc: "Nhận lead từ form đăng ký", status: "Đã kết nối" },
              { name: "Google Form", desc: "Nhận lead từ form Google", status: "Đã kết nối" },
              { name: "Webhook", desc: "Nhận lead qua Webhook API", status: "Chưa kết nối" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-slate-200/70 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                    <ExternalLink size={16} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full ${
                    item.status === "Đã kết nối"
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-amber-50 text-amber-800"
                  }`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
