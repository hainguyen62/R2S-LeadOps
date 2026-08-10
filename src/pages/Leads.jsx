import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ListFilter,
  Plus,
  Phone,
  Mail,
  MessageCircle,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  X,
  FileUp,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  Users,
  SearchX,
  Loader2,
} from "lucide-react";
import Pill from "../components/ui/Pill.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import SourceBadge from "../components/ui/SourceBadge.jsx";
import ClassBadge from "../components/ui/ClassBadge.jsx";
import ScoreRulesCard from "../components/leads/ScoreRulesCard.jsx";
import ConfirmDialog from "../components/ui/ConfirmDialog.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { LeadListSkeleton } from "../components/ui/Skeleton.jsx";
import { useToast } from "../components/ui/ToastProvider.jsx";
import { statusStyle, leadStatusOrder } from "../data/mockData.js";
import { fetchLeads, createLead, deleteLead, importLeads, exportLeadsCsv } from "../services/leadService.js";
import { validateLeadForm, hasErrors } from "../utils/validators.js";
import { exportToCsv } from "../utils/exportCsv.js";
import { importLeadsFromCsv } from "../utils/importCsv.js";

const pageSize = 6;

// Các cột có thể sắp xếp (kiểu FC Online):
//   key  -> trường dữ liệu của lead
//   label -> tiêu đề cột hiển thị
//   type -> loại dữ liệu để so sánh ('string' | 'number' | 'date')
const sortableColumns = [
  { key: "name", label: "Họ tên", type: "string" },
  { key: "course", label: "Khóa học", type: "string" },
  { key: "source", label: "Nguồn", type: "string" },
  { key: "status", label: "Trạng thái", type: "string" },
  { key: "score", label: "Điểm", type: "number" },
  { key: "cls", label: "Phân loại", type: "string" },
  { key: "assignee", label: "Người phụ trách", type: "string" },
  { key: "date", label: "Ngày tạo", type: "date" },
];

export default function Leads() {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tất cả");
  const [classFilter, setClassFilter] = useState("Tất cả");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState(null); // 'desc' | 'asc' | null
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const [importing, setImporting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refreshTick, forceRefresh] = useState(0);

  // Debounce ô tìm kiếm 300ms trước khi gọi API — tránh gọi liên tục theo từng phím gõ.
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(queryInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [queryInput]);

  // GET /api/leads — tải danh sách theo query/filter/sort/page hiện tại (xem leadService.js).
  // Đây là nơi DUY NHẤT gọi API tải danh sách; mọi thay đổi bộ lọc/trang chỉ cần
  // cập nhật state ở trên, effect này sẽ tự tải lại.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setListError(null);
    fetchLeads({ query, status: statusFilter, cls: classFilter, sortKey, sortDir, page, pageSize })
      .then(({ items, total: t }) => {
        if (cancelled) return;
        setRows(items);
        setTotal(t);
      })
      .catch((err) => {
        if (!cancelled) setListError(err.message || "Không thể tải danh sách lead.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query, statusFilter, classFilter, sortKey, sortDir, page, refreshTick]);

  const emptyForm = {
    // Bắt buộc
    name: "",
    course: "",
    source: "",
    phone: "",
    email: "",
    // Mở rộng (tùy chọn)
    school: "",
    currentLevel: "",
    studyGoal: "",
    expectedEnrollment: "",
    city: "",
    preferredContactTime: "",
    note: "",
  };
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [showExtended, setShowExtended] = useState(false);

  const statuses = ["Tất cả", ...leadStatusOrder];
  const classes = ["Tất cả", "Lead nóng", "Lead ấm", "Lead lạnh", "Không hợp lệ"];

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageRows = rows;

  const resetPage = () => setPage(1);

  // Xử lý click tiêu đề cột theo cơ chế FC Online:
  //   lần 1 -> desc (↓), lần 2 -> asc (↑), lần 3 -> hủy (↕ về mặc định)
  //   Nếu click cột khác -> cột cũ trở về trạng thái mặc định.
  const handleSort = (key) => {
    if (sortKey !== key) {
      // Chọn cột mới: bắt đầu từ giảm dần
      setSortKey(key);
      setSortDir("desc");
    } else if (sortDir === "desc") {
      setSortDir("asc");
    } else if (sortDir === "asc") {
      // Hủy sắp xếp, về thứ tự mặc định
      setSortKey(null);
      setSortDir(null);
    }
    resetPage();
  };

  // Render icon mũi tên cho tiêu đề cột
  const renderSortIcon = (key) => {
    if (sortKey === key && sortDir === "desc") {
      return <ArrowDown size={13} className="text-brand-600" />;
    }
    if (sortKey === key && sortDir === "asc") {
      return <ArrowUp size={13} className="text-brand-600" />;
    }
    return <ArrowUpDown size={13} className="text-slate-300" />;
  };

  // GET /api/export/leads.csv — xuất theo đúng bộ lọc đang áp dụng (không chỉ trang hiện tại)
  const handleExport = async () => {
    try {
      const items = await exportLeadsCsv({ query, status: statusFilter, cls: classFilter });
      exportToCsv(items, ["name", "course", "source", "status", "score", "cls", "date", "phone", "email"], "r2s-leads.csv");
    } catch (err) {
      toast.error(err.message || "Xuất CSV thất bại.");
    }
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportMsg("");

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target.result;
      const imported = importLeadsFromCsv(text);
      if (imported.length === 0) {
        setImportMsg("Không tìm thấy lead hợp lệ nào trong file. Vui lòng kiểm tra lại.");
        toast.error("Import CSV thất bại: không tìm thấy lead hợp lệ nào trong file.");
        return;
      }
      setImporting(true);
      try {
        await importLeads(imported);
        setImportMsg(`Đã nhập thành công ${imported.length} lead từ file CSV.`);
        toast.success(`Import CSV hoàn tất — đã thêm ${imported.length} lead.`);
        resetPage();
        setShowImport(false);
        forceRefresh((n) => n + 1);
      } catch (err) {
        setImportMsg(err.message || "Import CSV thất bại.");
        toast.error(err.message || "Import CSV thất bại.");
      } finally {
        setImporting(false);
      }
    };
    reader.onerror = () => {
      setImportMsg("Không thể đọc file. Vui lòng thử lại.");
      toast.error("Import CSV thất bại: không thể đọc file.");
    };
    reader.readAsText(file);
    // Reset input để có thể chọn lại cùng file
    e.target.value = "";
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    // Validate theo Module 2 (Họ tên, Khóa học, Nguồn bắt buộc; SĐT/Email đúng
    // định dạng nếu có nhập) — dùng chung utils/validators.js với Login/Register.
    const errors = validateLeadForm(form);
    if (hasErrors(errors)) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setSubmitting(true);
    try {
      await createLead(form);
      setShowAdd(false);
      setShowExtended(false);
      setForm(emptyForm);
      toast.success("Tạo lead thành công.");
      resetPage();
      forceRefresh((n) => n + 1);
    } catch (err) {
      if (err.fieldErrors) setFormErrors(err.fieldErrors);
      toast.error(err.message || "Tạo lead thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLead = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteLead(deleteTarget.id);
      toast.success(`Đã xóa lead "${deleteTarget.name}" thành công.`);
      setDeleteTarget(null);
      forceRefresh((n) => n + 1);
    } catch (err) {
      toast.error(err.message || "Xóa thất bại.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Quản lý Lead</h2>
          <p className="text-sm text-slate-500">Quản lý, phân loại và chấm điểm khách hàng tiềm năng</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 text-xs border border-slate-300 rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-50"
          >
            <Download size={14} /> Xuất CSV
          </button>
          <button
            onClick={() => { setShowImport(true); setImportMsg(""); }}
            className="flex items-center gap-1.5 text-xs border border-slate-300 rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-50"
          >
            <Upload size={14} /> Nhập CSV
          </button>
          <button
            onClick={() => { setForm(emptyForm); setFormErrors({}); setShowExtended(false); setShowAdd(true); }}
            className="flex items-center gap-1.5 text-xs bg-brand-600 rounded-lg px-3 py-2 text-white hover:bg-brand-500"
          >
            <Plus size={14} /> Thêm lead
          </button>
        </div>
      </div>

      {/* Bảng luật chấm điểm lead — thu gọn mặc định */}
      <ScoreRulesCard />

      {/* Import success message */}
      {importMsg && (importMsg.startsWith("Đã nhập") || importMsg.startsWith("Không thể")) && !showImport && (
        <div className={`text-sm rounded-lg px-4 py-3 ${importMsg.startsWith("Đã nhập") ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {importMsg}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center gap-3 shadow-card">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder="Tìm theo tên, khóa học, email..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); resetPage(); }}
            className="flex-1 min-w-[130px] bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={classFilter}
            onChange={(e) => { setClassFilter(e.target.value); resetPage(); }}
            className="flex-1 min-w-[130px] bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            {classes.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button className="flex items-center justify-center gap-1.5 text-xs border border-slate-300 rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-50 shrink-0 whitespace-nowrap">
            <ListFilter size={14} /> Bộ lọc
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LeadListSkeleton />
      ) : listError ? (
        <EmptyState
          icon={AlertCircle}
          title="Không thể tải danh sách lead"
          description={listError}
          action={{ label: "Thử lại", onClick: () => forceRefresh((n) => n + 1) }}
        />
      ) : total === 0 && !query && statusFilter === "Tất cả" && classFilter === "Tất cả" ? (
        <div className="bg-white border border-slate-200 rounded-xl shadow-card">
          <EmptyState
            icon={Users}
            title="Chưa có lead nào"
            description="Bắt đầu bằng cách thêm lead thủ công hoặc nhập từ file CSV."
            action={{ label: "Thêm lead", onClick: () => { setForm(emptyForm); setFormErrors({}); setShowExtended(false); setShowAdd(true); } }}
          />
        </div>
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
                <th className="py-3 px-4 font-medium">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((l) => (
                <tr
                  key={l.id}
                  onClick={() => navigate(`/leads/${l.id}`)}
                  className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                >
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2">
                      <Avatar name={l.name} initials={l.initials} size={28} />
                      <div>
                        <p className="whitespace-nowrap text-slate-800">{l.name}</p>
                        <p className="text-[10px] text-slate-500">{l.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">{l.course}</td>
                  <td className="py-2.5 px-4 whitespace-nowrap"><SourceBadge source={l.source} /></td>
                  <td className="py-2.5 px-4"><Pill text={l.status} map={statusStyle} /></td>
                  <td className="py-2.5 px-4 font-medium text-slate-800">{l.score}</td>
                  <td className="py-2.5 px-4"><ClassBadge cls={l.cls} /></td>
                  <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">{l.assignee}</td>
                  <td className="py-2.5 px-4 text-slate-400 whitespace-nowrap text-xs">{l.date}</td>
                  <td className="py-2.5 px-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5">
                      <button className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-brand-600" title="Gọi điện"><Phone size={13} /></button>
                      <button className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-emerald-600" title="Gửi email"><Mail size={13} /></button>
                      <button className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-violet-600" title="Nhắn tin"><MessageCircle size={13} /></button>
                      <button
                        onClick={() => setDeleteTarget(l)}
                        className="p-1.5 rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600"
                        title="Xóa lead"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-0">
                    <EmptyState
                      icon={SearchX}
                      title="Không tìm thấy kết quả phù hợp"
                      description="Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái/phân loại."
                      compact
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 text-xs text-slate-500">
          <span>
            {total === 0
              ? "0 kết quả"
              : `Hiển thị ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} của ${total}`}
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
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa lead"
        message={deleteTarget ? `Bạn có chắc chắn muốn xóa lead "${deleteTarget.name}"? Toàn bộ lịch sử chăm sóc liên quan cũng sẽ không còn hiển thị.` : ""}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteLead}
        loading={deleting}
      />

      {/* Import CSV Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-elevated">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Nhập lead từ CSV</h3>
              <button onClick={() => setShowImport(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            {importMsg && (
              <div className={`text-xs rounded-lg px-3 py-2 mb-3 ${importMsg.startsWith("Đã nhập") ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {importMsg}
              </div>
            )}
            <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-8 transition-colors ${importing ? "border-slate-200 opacity-60 cursor-not-allowed" : "border-slate-300 cursor-pointer hover:border-brand-500 hover:bg-slate-50"}`}>
              {importing ? (
                <Loader2 size={28} className="text-brand-600 animate-spin" />
              ) : (
                <FileUp size={28} className="text-brand-600" />
              )}
              <span className="text-sm text-slate-600 font-medium">
                {importing ? "Đang nhập dữ liệu..." : "Chọn file CSV để tải lên"}
              </span>
              <span className="text-xs text-slate-400 text-center">
                Hỗ trợ cột tiếng Anh (name, course, source, phone, email...) và tiếng Việt (Họ tên, Khóa học, Số điện thoại...)
              </span>
              <input type="file" accept=".csv,text/csv" onChange={handleImportFile} disabled={importing} className="hidden" />
            </label>
            <div className="flex gap-2 pt-4">
              <button
                onClick={() => setShowImport(false)}
                className="flex-1 border border-slate-300 rounded-lg py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-elevated max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 pt-6 pb-2 shrink-0">
              <div>
                <h3 className="font-semibold text-slate-900">Thêm lead mới</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Các trường có dấu * là bắt buộc</p>
              </div>
              <button
                onClick={() => { setShowAdd(false); setFormErrors({}); }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAdd} className="flex-1 overflow-y-auto px-6 pb-6 space-y-3">
              {formErrors.contact && (
                <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" /> {formErrors.contact}
                </div>
              )}

              {/* ---- Thông tin bắt buộc ---- */}
              <div>
                <label className="text-xs text-slate-500 block mb-1">Họ và tên *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nguyễn Văn A"
                  className={`w-full bg-slate-50 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 ${
                    formErrors.name ? "border-red-300" : "border-slate-200"
                  }`}
                />
                {formErrors.name && <p className="text-[11px] text-red-600 mt-1">{formErrors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Khóa học quan tâm *</label>
                  <select
                    value={form.course}
                    onChange={(e) => setForm({ ...form, course: e.target.value })}
                    className={`w-full bg-slate-50 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 ${
                      formErrors.course ? "border-red-300" : "border-slate-200"
                    }`}
                  >
                    <option value="">Chọn khóa học</option>
                    <option>Java Backend</option>
                    <option>ReactJS</option>
                    <option>Flutter</option>
                    <option>Business Analyst</option>
                    <option>Data Analyst</option>
                    <option>UI/UX Design</option>
                  </select>
                  {formErrors.course && <p className="text-[11px] text-red-600 mt-1">{formErrors.course}</p>}
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Nguồn tiếp cận *</label>
                  <select
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                    className={`w-full bg-slate-50 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 ${
                      formErrors.source ? "border-red-300" : "border-slate-200"
                    }`}
                  >
                    <option value="">Chọn nguồn</option>
                    <option>Facebook</option>
                    <option>TikTok</option>
                    <option>Landing Page</option>
                    <option>Google Form</option>
                    <option>Manual</option>
                  </select>
                  {formErrors.source && <p className="text-[11px] text-red-600 mt-1">{formErrors.source}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Số điện thoại *</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="0900 000 000"
                    className={`w-full bg-slate-50 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 ${
                      formErrors.contact || formErrors.phone ? "border-red-300" : "border-slate-200"
                    }`}
                  />
                  {formErrors.phone && <p className="text-[11px] text-red-600 mt-1">{formErrors.phone}</p>}
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Email *</label>
                  <input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="email@gmail.com"
                    className={`w-full bg-slate-50 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 ${
                      formErrors.contact || formErrors.email ? "border-red-300" : "border-slate-200"
                    }`}
                  />
                  {formErrors.email && <p className="text-[11px] text-red-600 mt-1">{formErrors.email}</p>}
                </div>
              </div>
              <p className="text-[11px] text-slate-400 -mt-2">* Cần điền ít nhất một trong hai: số điện thoại hoặc email.</p>

              {/* ---- Thông tin mở rộng (tùy chọn) ---- */}
              <button
                type="button"
                onClick={() => setShowExtended((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 pt-1"
              >
                {showExtended ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                Thông tin bổ sung (tùy chọn)
              </button>

              {showExtended && (
                <div className="space-y-3 border-t border-slate-100 pt-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-500 block mb-1">Trường học</label>
                      <input
                        value={form.school}
                        onChange={(e) => setForm({ ...form, school: e.target.value })}
                        placeholder="ĐH Bách Khoa..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 block mb-1">Trình độ hiện tại</label>
                      <select
                        value={form.currentLevel}
                        onChange={(e) => setForm({ ...form, currentLevel: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                      >
                        <option value="">Chọn trình độ</option>
                        <option>Chưa biết gì</option>
                        <option>Mới bắt đầu</option>
                        <option>Có nền tảng cơ bản</option>
                        <option>Đã đi làm, muốn chuyển hướng</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Mục tiêu học</label>
                    <input
                      value={form.studyGoal}
                      onChange={(e) => setForm({ ...form, studyGoal: e.target.value })}
                      placeholder="Đi làm đúng chuyên ngành, chuyển nghề..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-500 block mb-1">Thời gian dự kiến đăng ký</label>
                      <select
                        value={form.expectedEnrollment}
                        onChange={(e) => setForm({ ...form, expectedEnrollment: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                      >
                        <option value="">Chưa xác định</option>
                        <option>Trong 7 ngày</option>
                        <option>Trong 30 ngày</option>
                        <option>1–3 tháng</option>
                        <option>Chưa có nhu cầu trong 6 tháng</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 block mb-1">Thành phố</label>
                      <input
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        placeholder="TP.HCM, Hà Nội..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Khung giờ có thể liên hệ</label>
                    <input
                      value={form.preferredContactTime}
                      onChange={(e) => setForm({ ...form, preferredContactTime: e.target.value })}
                      placeholder="Sau 18h các ngày trong tuần..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Ghi chú ban đầu</label>
                    <textarea
                      value={form.note}
                      onChange={(e) => setForm({ ...form, note: e.target.value })}
                      rows={2}
                      placeholder="Quan tâm khóa học..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAdd(false); setFormErrors({}); }}
                  className="flex-1 border border-slate-300 rounded-lg py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-brand-600 hover:bg-brand-500 rounded-lg py-2 text-sm text-white disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  {submitting ? "Đang lưu..." : "Thêm lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}