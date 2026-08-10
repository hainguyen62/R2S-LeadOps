import { useEffect, useMemo, useState } from "react";
import { Users, Activity, Bell, Link, ExternalLink, Pencil, Trash2, X, ShieldCheck, Check, Info, ArrowUpDown, ArrowUp, ArrowDown, AlertCircle, Loader2 } from "lucide-react";
import Avatar from "../components/ui/Avatar.jsx";
import Pill from "../components/ui/Pill.jsx";
import ConfirmDialog from "../components/ui/ConfirmDialog.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { SkeletonBlock } from "../components/ui/Skeleton.jsx";
import { useToast } from "../components/ui/ToastProvider.jsx";
import { fetchUsers, updateUser, deleteUser, fetchActivityLogs } from "../services/settingsService.js";

const roleStyle = {
  Administrator: "bg-red-50 text-red-700",
  "Leader Marketing": "bg-violet-50 text-violet-700",
  "Sales/Admissions": "bg-blue-50 text-blue-700",
  "Marketing Staff": "bg-amber-50 text-amber-700",
};

const tabs = [
  { id: "users", label: "Quản lý tài khoản", icon: Users },
  { id: "permissions", label: "Phân quyền", icon: ShieldCheck },
  { id: "logs", label: "Nhật ký hoạt động", icon: Activity },
  { id: "notify", label: "Thông báo", icon: Bell },
  { id: "integrations", label: "Kết nối", icon: Link },
];

// Các cột có thể sắp xếp (kiểu FC Online — giống trang Quản lý Lead):
//   key  -> trường dữ liệu của user
//   label -> tiêu đề cột hiển thị
const sortableColumns = [
  { key: "name", label: "Người dùng" },
  { key: "role", label: "Vai trò" },
  { key: "email", label: "Email" },
  { key: "status", label: "Trạng thái" },
];

// Ma trận phân quyền theo 4 nhóm đối tượng sử dụng (Mục IV tài liệu Kế
// hoạch triển khai): Administrator, Leader Marketing, Sales/Admissions,
// Marketing Staff. Chỉ Admin mới có quyền chỉnh sửa mục này.
const roles = ["Administrator", "Leader Marketing", "Sales/Admissions", "Marketing Staff"];

const defaultMatrix = {
  "Quản lý toàn bộ lead": { Administrator: true, "Leader Marketing": true, "Sales/Admissions": false, "Marketing Staff": false },
  "Xem lead được phân công": { Administrator: true, "Leader Marketing": true, "Sales/Admissions": true, "Marketing Staff": false },
  "Quản lý chiến dịch & nguồn lead": { Administrator: true, "Leader Marketing": true, "Sales/Admissions": false, "Marketing Staff": true },
  "Xem Dashboard": { Administrator: true, "Leader Marketing": true, "Sales/Admissions": false, "Marketing Staff": true },
  "Cấu hình chấm điểm (Lead Scoring)": { Administrator: true, "Leader Marketing": false, "Sales/Admissions": false, "Marketing Staff": false },
  "Quản lý tài khoản người dùng": { Administrator: true, "Leader Marketing": false, "Sales/Admissions": false, "Marketing Staff": false },
  "Xuất dữ liệu (CSV/Excel)": { Administrator: true, "Leader Marketing": true, "Sales/Admissions": false, "Marketing Staff": false },
  "Xem nhật ký hệ thống": { Administrator: true, "Leader Marketing": false, "Sales/Admissions": false, "Marketing Staff": false },
};

export default function Settings() {
  const toast = useToast();
  const [tab, setTab] = useState("users");
  const [userList, setUserList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [logsError, setLogsError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [savingUser, setSavingUser] = useState(false);
  const [form, setForm] = useState({ name: "", role: "", email: "" });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [matrix, setMatrix] = useState(defaultMatrix);
  const [matrixDirty, setMatrixDirty] = useState(false);
  const [refreshTick, forceRefresh] = useState(0);

  // GET /api/users — xem services/settingsService.js
  useEffect(() => {
    if (tab !== "users") return;
    let cancelled = false;
    setLoadingUsers(true);
    setUsersError(null);
    fetchUsers()
      .then((data) => {
        if (!cancelled) setUserList(data);
      })
      .catch((err) => {
        if (!cancelled) setUsersError(err.message || "Không thể tải danh sách tài khoản.");
      })
      .finally(() => {
        if (!cancelled) setLoadingUsers(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, refreshTick]);

  // GET /api/audit-logs — xem services/settingsService.js
  useEffect(() => {
    if (tab !== "logs") return;
    let cancelled = false;
    setLoadingLogs(true);
    fetchActivityLogs()
      .then((data) => {
        if (!cancelled) setActivityLogs(data);
      })
      .catch((err) => {
        if (!cancelled) setLogsError(err.message || "Không thể tải nhật ký hoạt động.");
      })
      .finally(() => {
        if (!cancelled) setLoadingLogs(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tab]);

  // Sắp xếp cột kiểu FC Online — giống trang Quản lý Lead
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState(null); // 'desc' | 'asc' | null

  // Danh sách tài khoản đã sắp xếp (chỉ sắp xếp khi có sortKey + sortDir)
  const sortedUsers = useMemo(() => {
    if (!sortKey || !sortDir) return userList;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...userList].sort((a, b) => {
      const va = String(a[sortKey] ?? "");
      const vb = String(b[sortKey] ?? "");
      return va.localeCompare(vb, "vi", { sensitivity: "base" }) * dir;
    });
  }, [userList, sortKey, sortDir]);

  // Cơ chế click tiêu đề cột:
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

  const openEdit = (user) => {
    setEditingUser(user);
    setForm({ name: user.name, role: user.role, email: user.email });
  };

  const saveEdit = async () => {
    setSavingUser(true);
    try {
      const updated = await updateUser(editingUser.id, form);
      setUserList((list) => list.map((u) => (u.id === editingUser.id ? updated : u)));
      setEditingUser(null);
      toast.success("Cập nhật tài khoản thành công.");
    } catch (err) {
      toast.error(err.message || "Cập nhật tài khoản thất bại.");
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setDeletingUser(true);
    try {
      await deleteUser(deleteTarget.id);
      setUserList((list) => list.filter((u) => u.id !== deleteTarget.id));
      toast.success(`Đã xóa tài khoản "${deleteTarget.name}" thành công.`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.message || "Xóa thất bại.");
    } finally {
      setDeletingUser(false);
    }
  };

  const togglePermission = (module, role) => {
    setMatrix((prev) => ({
      ...prev,
      [module]: { ...prev[module], [role]: !prev[module][role] },
    }));
    setMatrixDirty(true);
  };

  const savePermissions = () => {
    setMatrixDirty(false);
    toast.success("Đã lưu cấu hình phân quyền.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Cài đặt</h2>
        <p className="text-sm text-slate-500">Quản lý tài khoản, phân quyền, nhật ký hoạt động và cấu hình hệ thống</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                tab === t.id
                  ? "bg-brand-600 text-white"
                  : "border border-slate-300 text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Users tab */}
      {tab === "users" && (
        loadingUsers ? (
          <SkeletonBlock className="h-[300px] rounded-xl" />
        ) : usersError ? (
          <EmptyState
            icon={AlertCircle}
            title="Không thể tải danh sách tài khoản"
            description={usersError}
            action={{ label: "Thử lại", onClick: () => forceRefresh((n) => n + 1) }}
          />
        ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] text-slate-500 border-b border-slate-200 bg-slate-50">
                  {sortableColumns.map((col) => (
                    <th key={col.key} className="py-3 px-4 font-medium">
                      <button
                        type="button"
                        onClick={() => handleSort(col.key)}
                        className="inline-flex items-center gap-1 hover:text-slate-800 transition-colors"
                        title="Bấm để sắp xếp (↓ giảm dần, ↑ tăng dần, bấm lần nữa để hủy)"
                      >
                        {col.label}
                        {renderSortIcon(col.key)}
                      </button>
                    </th>
                  ))}
                  <th className="py-3 px-4 font-medium text-right">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Avatar name={u.name} initials={u.name.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase()} size={28} />
                        <span className="whitespace-nowrap text-slate-800">{u.name}</span>
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
                          className="p-1.5 rounded-md text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(u)}
                          title={u.role === "Administrator" ? "Không thể xóa tài khoản Admin" : "Xóa"}
                          className="p-1.5 rounded-md transition-colors text-slate-500 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )
      )}

      {/* Permissions tab */}
      {tab === "permissions" && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-card overflow-hidden">
          <div className="flex items-start gap-2 px-5 pt-5">
            <Info size={15} className="text-brand-600 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-500">
              Ma trận phân quyền theo 4 nhóm đối tượng sử dụng hệ thống. Chỉ tài khoản Admin mới có quyền chỉnh sửa
              mục này. Bấm vào ô để bật/tắt quyền tương ứng.
            </p>
          </div>
          <div className="overflow-x-auto p-5">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-[11px] text-slate-500 border-b border-slate-200">
                  <th className="py-2 pr-4 font-medium">Chức năng / Đối tượng</th>
                  {roles.map((r) => (
                    <th key={r} className="py-2 px-3 font-medium text-center whitespace-nowrap">
                      {r}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(matrix).map(([module, perms]) => (
                  <tr key={module} className="border-b border-slate-100 last:border-0">
                    <td className="py-2.5 pr-4 text-slate-700">{module}</td>
                    {roles.map((r) => (
                      <td key={r} className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => togglePermission(module, r)}
                          className={`w-6 h-6 rounded-md border inline-flex items-center justify-center transition-colors ${
                            perms[r]
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "bg-white border-slate-300 text-transparent hover:border-slate-400"
                          }`}
                          title={perms[r] ? "Đang được cấp quyền — bấm để thu hồi" : "Chưa có quyền — bấm để cấp"}
                        >
                          <Check size={14} />
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-100">
            <button
              onClick={savePermissions}
              disabled={!matrixDirty}
              className="text-xs font-medium bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2"
            >
              Lưu cấu hình phân quyền
            </button>
          </div>
        </div>
      )}

      {/* Logs tab */}
      {tab === "logs" && (
        loadingLogs ? (
          <SkeletonBlock className="h-[240px] rounded-xl" />
        ) : logsError ? (
          <EmptyState icon={AlertCircle} title="Không thể tải nhật ký" description={logsError} compact />
        ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-card">
          <div className="space-y-3">
            {activityLogs.map((log) => (
              <div key={log.id} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                <Avatar name={log.user} initials={log.user.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase()} size={28} />
                <div className="flex-1">
                  <p className="text-sm text-slate-700">
                    <span className="font-medium text-slate-900">{log.user}</span>{" "}
                    <span className="text-slate-500">{log.action}</span>
                  </p>
                  <p className="text-[11px] text-slate-500">{log.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        )
      )}

      {/* Notify tab */}
      {tab === "notify" && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-xl shadow-card">
          <div className="space-y-4">
            {[
              { title: "Thông báo lead nóng", desc: "Nhận cảnh báo khi có lead mới được phân loại Lead nóng", on: true },
              { title: "Thông báo qua email", desc: "Gửi email thông báo khi có lead mới hoặc lead nóng", on: true },
              { title: "Thông báo qua Telegram", desc: "Gửi tin nhắn Telegram khi có lead nóng", on: false },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">{item.title}</p>
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
        <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-xl shadow-card">
          <div className="space-y-4">
            {[
              { name: "Facebook / TikTok Ads", desc: "Nhận lead từ quảng cáo", status: "Đã kết nối" },
              { name: "Landing Page", desc: "Nhận lead từ form đăng ký", status: "Đã kết nối" },
              { name: "Google Form", desc: "Nhận lead từ form Google", status: "Đã kết nối" },
              { name: "Webhook", desc: "Nhận lead qua Webhook API", status: "Chưa kết nối" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                    <ExternalLink size={16} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full ${
                    item.status === "Đã kết nối"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit user modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-elevated">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Sửa tài khoản</h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Họ tên</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Email</label>
                <input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Vai trò</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="Administrator">Administrator</option>
                  <option value="Leader Marketing">Leader Marketing</option>
                  <option value="Sales/Admissions">Sales/Admissions</option>
                  <option value="Marketing Staff">Marketing Staff</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-5">
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 border border-slate-300 rounded-lg py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={saveEdit}
                disabled={savingUser}
                className="flex-1 bg-brand-600 hover:bg-brand-500 rounded-lg py-2 text-sm text-white font-medium disabled:opacity-60 inline-flex items-center justify-center gap-1.5"
              >
                {savingUser && <Loader2 size={14} className="animate-spin" />}
                {savingUser ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa tài khoản"
        message={
          deleteTarget
            ? `Bạn có chắc chắn muốn xóa tài khoản "${deleteTarget.name}"? Toàn bộ lead đang phụ trách sẽ cần được phân công lại.`
            : ""
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteUser}
        loading={deletingUser}
      />
    </div>
  );
}