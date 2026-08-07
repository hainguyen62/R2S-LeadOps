import { useMemo, useState } from "react";
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
} from "lucide-react";
import Pill from "../components/ui/Pill.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import ScoreRulesCard from "../components/leads/ScoreRulesCard.jsx";
import { leads, statusStyle, classStyle } from "../data/mockData.js";
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

// Lấy giá trị để so sánh theo từng cột
function getSortValue(l, key) {
  if (key === "date") {
    // date có dạng "12/05/2026 09:15" hoặc "12/05/2026" -> chuyển về timestamp
    const [datePart, timePart = "00:00"] = String(l.date || "").split(" ");
    const [d, m, y] = datePart.split("/").map(Number);
    const [hh, mm] = timePart.split(":").map(Number);
    return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0).getTime();
  }
  return l[key];
}

export default function Leads() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tất cả");
  const [classFilter, setClassFilter] = useState("Tất cả");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState(null); // 'desc' | 'asc' | null
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importMsg, setImportMsg] = useState("");
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

  const statuses = ["Tất cả", ...new Set(leads.map((l) => l.status))];
  const classes = ["Tất cả", "Lead nóng", "Lead ấm", "Lead lạnh"];

  // Lọc + sắp xếp cùng lúc, KHÔNG tải lại trang, giữ nguyên bộ lọc/tìm kiếm
  const filtered = useMemo(() => {
    let rows = leads.filter((l) => {
      const matchQ =
        !query ||
        l.name.toLowerCase().includes(query.toLowerCase()) ||
        l.course.toLowerCase().includes(query.toLowerCase()) ||
        l.email.toLowerCase().includes(query.toLowerCase());
      const matchS = statusFilter === "Tất cả" || l.status === statusFilter;
      const matchC = classFilter === "Tất cả" || l.cls === classFilter;
      return matchQ && matchS && matchC;
    });

    // Sắp xếp chỉ khi có sortKey + sortDir được chọn
    if (sortKey && sortDir) {
      const col = sortableColumns.find((c) => c.key === sortKey);
      const dir = sortDir === "asc" ? 1 : -1;
      rows = [...rows].sort((a, b) => {
        let va = getSortValue(a, sortKey);
        let vb = getSortValue(b, sortKey);

        if (col.type === "number") {
          return (va - vb) * dir;
        }
        // Chuỗi: dùng localeCompare('vi') để xếp đúng dấu tiếng Việt (vd: chữ Đ)
        const sa = String(va ?? "");
        const sb = String(vb ?? "");
        return sa.localeCompare(sb, "vi", { sensitivity: "base" }) * dir;
      });
    }

    return rows;
  }, [query, statusFilter, classFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

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
    return <ArrowUpDown size={13} className="text-slate-400" />;
  };

  const handleExport = () => {
    exportToCsv(
      filtered,
      ["name", "course", "source", "status", "score", "cls", "date", "phone", "email"],
      "r2s-leads.csv"
    );
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportMsg("");

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const imported = importLeadsFromCsv(text);
      if (imported.length === 0) {
        setImportMsg("Không tìm thấy lead hợp lệ nào trong file. Vui lòng kiểm tra lại.");
        return;
      }
      // Thêm các lead nhập vào (đảo ngược để giữ thứ tự ban đầu)
      imported.reverse().forEach((l) => leads.unshift(l));
      setImportMsg(`Đã nhập thành công ${imported.length} lead từ file CSV.`);
      resetPage();
      setShowImport(false);
    };
    reader.onerror = () => setImportMsg("Không thể đọc file. Vui lòng thử lại.");
    reader.readAsText(file);
    // Reset input để có thể chọn lại cùng file
    e.target.value = "";
  };

  // Thông tin lead bắt buộc theo Module 2 (Kế hoạch triển khai):
  // Họ và tên, Số điện thoại HOẶC Email (ít nhất một), Khóa học quan tâm, Nguồn tiếp cận.
  // Ngày tạo và Trạng thái do hệ thống tự sinh, không cần người dùng nhập.
  const validateForm = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = "Vui lòng nhập họ và tên.";
    if (!form.course.trim()) errors.course = "Vui lòng chọn khóa học quan tâm.";
    if (!form.source.trim()) errors.source = "Vui lòng chọn nguồn tiếp cận.";
    if (!form.phone.trim() && !form.email.trim()) {
      errors.contact = "Cần ít nhất một trong hai: Số điện thoại hoặc Email.";
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
    // Demo: thêm lead vào đầu danh sách
    leads.unshift({
      id: Date.now(),
      name: form.name.trim(),
      course: form.course,
      source: form.source,
      status: "Lead mới",
      score: 25,
      cls: "Lead lạnh",
      date: new Date().toLocaleDateString("vi-VN"),
      phone: form.phone.trim() || "—",
      email: form.email.trim() || "—",
      assignee: "Tư vấn viên A",
      // Thông tin mở rộng — chỉ lưu nếu người dùng có điền
      school: form.school.trim() || undefined,
      currentLevel: form.currentLevel || undefined,
      studyGoal: form.studyGoal.trim() || undefined,
      expectedEnrollment: form.expectedEnrollment || undefined,
      city: form.city.trim() || undefined,
      preferredContactTime: form.preferredContactTime || undefined,
      note: form.note.trim() || undefined,
      initials: form.name.trim().split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase(),
    });
    setShowAdd(false);
    setShowExtended(false);
    setForm(emptyForm);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Quản lý Lead</h2>
          <p className="text-sm text-slate-500">Quản lý, phân loại và chấm điểm khách hàng tiềm năng</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 text-xs border border-slate-300 rounded-card px-3 py-2 text-slate-600 hover:bg-slate-100 shadow-sm hover:shadow-md transition-all duration-200 ease-out"
          >
            <Download size={14} /> Xuất CSV
          </button>
          <button
            onClick={() => { setShowImport(true); setImportMsg(""); }}
            className="flex items-center gap-1.5 text-xs border border-slate-300 rounded-card px-3 py-2 text-slate-600 hover:bg-slate-100 shadow-sm hover:shadow-md transition-all duration-200 ease-out"
          >
            <Upload size={14} /> Nhập CSV
          </button>
          <button
            onClick={() => { setForm(emptyForm); setFormErrors({}); setShowExtended(false); setShowAdd(true); }}
            className="flex items-center gap-1.5 text-xs bg-brand-600 rounded-card px-3 py-2 text-white hover:bg-brand-500 shadow-sm hover:shadow-md transition-all duration-200 ease-out"
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
      <div className="bg-white border border-slate-300 rounded-card p-4 flex flex-wrap items-center gap-3 shadow-card transition-all duration-200 ease-out hover:shadow-elevated">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); resetPage(); }}
            placeholder="Tìm theo tên, khóa học, email..."
            className="w-full bg-slate-50 border border-slate-300 rounded-input pl-9 pr-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all duration-200 ease-out"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); resetPage(); }}
            className="bg-slate-50 border border-slate-300 rounded-input px-3 py-2 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200 ease-out"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={classFilter}
            onChange={(e) => { setClassFilter(e.target.value); resetPage(); }}
            className="bg-slate-50 border border-slate-300 rounded-input px-3 py-2 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200 ease-out"
          >
            {classes.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button className="flex items-center gap-1.5 text-xs border border-slate-300 rounded-card px-3 py-2 text-slate-600 hover:bg-slate-100 shadow-sm hover:shadow-md transition-all duration-200 ease-out">
            <ListFilter size={14} /> Bộ lọc
          </button>
        </div>
      </div>

      {/* Table */}
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
                <th className="py-3 px-4 font-semibold">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((l) => (
                <tr
                  key={l.id}
                  onClick={() => navigate(`/leads/${l.id}`)}
                  className="border-b border-slate-200/70 hover:bg-brand-50/60 cursor-pointer transition-colors duration-150"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Avatar name={l.name} initials={l.initials} size={28} />
                      <div>
                        <p className="whitespace-nowrap font-medium text-slate-800">{l.name}</p>
                        <p className="text-[10px] text-slate-500">{l.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{l.course}</td>
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{l.source}</td>
                  <td className="py-3 px-4"><Pill text={l.status} map={statusStyle} /></td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{l.score}</td>
                  <td className="py-3 px-4"><Pill text={l.cls} map={classStyle} /></td>
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{l.assignee}</td>
                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap text-xs">{l.date}</td>
                  <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5">
                      <button className="p-1.5 rounded-md text-slate-400 hover:bg-brand-50 hover:text-brand-600 transition-colors duration-150" title="Gọi điện"><Phone size={13} /></button>
                      <button className="p-1.5 rounded-md text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors duration-150" title="Gửi email"><Mail size={13} /></button>
                      <button className="p-1.5 rounded-md text-slate-400 hover:bg-violet-50 hover:text-violet-600 transition-colors duration-150" title="Nhắn tin"><MessageCircle size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-500 text-sm">
                    Không tìm thấy lead nào phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 text-xs text-slate-500">
          <span>
            {filtered.length === 0
              ? "0 kết quả"
              : `Hiển thị ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filtered.length)} của ${filtered.length}`}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-md border border-slate-300 hover:bg-slate-100 disabled:opacity-40 transition-colors duration-150"
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
                    : "border border-slate-300 hover:bg-slate-100 text-slate-500 transition-colors duration-150"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-md border border-slate-300 hover:bg-slate-100 disabled:opacity-40 transition-colors duration-150"
              disabled={page === totalPages}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Import CSV Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-card w-full max-w-md p-6 shadow-modal">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Nhập lead từ CSV</h3>
              <button onClick={() => setShowImport(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            {importMsg && (
              <div className={`text-xs rounded-lg px-3 py-2 mb-3 ${importMsg.startsWith("Đã nhập") ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {importMsg}
              </div>
            )}
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-xl p-8 cursor-pointer hover:border-brand-500 hover:bg-slate-50 transition-colors duration-200">
              <FileUp size={28} className="text-brand-600" />
              <span className="text-sm text-slate-600 font-medium">Chọn file CSV để tải lên</span>
              <span className="text-xs text-slate-500 text-center">
                Hỗ trợ cột tiếng Anh (name, course, source, phone, email...) và tiếng Việt (Họ tên, Khóa học, Số điện thoại...)
              </span>
              <input type="file" accept=".csv,text/csv" onChange={handleImportFile} className="hidden" />
            </label>
            <div className="flex gap-2 pt-4">
              <button
                onClick={() => setShowImport(false)}
                className="flex-1 border border-slate-300 rounded-card py-2 text-sm text-slate-600 hover:bg-slate-100 shadow-sm hover:shadow-md transition-all duration-200 ease-out"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-card w-full max-w-lg shadow-modal max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 pt-6 pb-2 shrink-0">
              <div>
                <h3 className="font-bold text-slate-900">Thêm lead mới</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Các trường có dấu * là bắt buộc</p>
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
                  className={`w-full bg-slate-50 border rounded-input px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200 ease-out ${
                    formErrors.name ? "border-red-300 focus:border-red-400" : "border-slate-300 focus:border-brand-500"
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
                    className={`w-full bg-slate-50 border rounded-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200 ease-out ${
                      formErrors.course ? "border-red-300 focus:border-red-400" : "border-slate-300 focus:border-brand-500"
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
                    className={`w-full bg-slate-50 border rounded-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200 ease-out ${
                      formErrors.source ? "border-red-300 focus:border-red-400" : "border-slate-300 focus:border-brand-500"
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
                    className={`w-full bg-slate-50 border rounded-input px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200 ease-out ${
                      formErrors.contact ? "border-red-300 focus:border-red-400" : "border-slate-300 focus:border-brand-500"
                    }`}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Email *</label>
                  <input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="email@gmail.com"
                    className={`w-full bg-slate-50 border rounded-input px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all duration-200 ease-out ${
                      formErrors.contact ? "border-red-300 focus:border-red-400" : "border-slate-300 focus:border-brand-500"
                    }`}
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 -mt-2">* Cần điền ít nhất một trong hai: số điện thoại hoặc email.</p>

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
                <div className="space-y-3 border-t border-slate-200/70 pt-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-500 block mb-1">Trường học</label>
                      <input
                        value={form.school}
                        onChange={(e) => setForm({ ...form, school: e.target.value })}
                        placeholder="ĐH Bách Khoa..."
                        className="w-full bg-slate-50 border border-slate-300 rounded-input px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200 ease-out"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 block mb-1">Trình độ hiện tại</label>
                      <select
                        value={form.currentLevel}
                        onChange={(e) => setForm({ ...form, currentLevel: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200 ease-out"
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
                      className="w-full bg-slate-50 border border-slate-300 rounded-input px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200 ease-out"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-500 block mb-1">Thời gian dự kiến đăng ký</label>
                      <select
                        value={form.expectedEnrollment}
                        onChange={(e) => setForm({ ...form, expectedEnrollment: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200 ease-out"
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
                        className="w-full bg-slate-50 border border-slate-300 rounded-input px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200 ease-out"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Khung giờ có thể liên hệ</label>
                    <input
                      value={form.preferredContactTime}
                      onChange={(e) => setForm({ ...form, preferredContactTime: e.target.value })}
                      placeholder="Sau 18h các ngày trong tuần..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-input px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200 ease-out"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Ghi chú ban đầu</label>
                    <textarea
                      value={form.note}
                      onChange={(e) => setForm({ ...form, note: e.target.value })}
                      rows={2}
                      placeholder="Quan tâm khóa học..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-input px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200 ease-out resize-none"
                    />
                  </div>
                </div>
              )}

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
                  Thêm lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

