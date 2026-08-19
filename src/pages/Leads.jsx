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
  Archive,
  ArchiveRestore,
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
import { statusStyle, leadStatusOrder, courseOptions } from "../data/mockData.js";
import { fetchLeads, fetchMyLeads, createLead, archiveLead, unarchiveLead, importLeads, exportLeadsCsv, fetchLeadFilterOptions } from "../services/leadService.js";
import { fetchUsers } from "../services/settingsService.js";
import { validateLeadForm, hasErrors } from "../utils/validators.js";
import { exportToCsv } from "../utils/exportCsv.js";
import { importLeadsFromCsv } from "../utils/importCsv.js";
import { useAuth } from "../context/AuthContext.jsx";
import { isSales } from "../utils/permissions.js";
import { formatVietnamDateTime } from "../utils/datetime.js";
import useEscapeKey from "../hooks/useEscapeKey.js";

const pageSize = 6;

// Các cột có thể sắp xếp (kiểu FC Online):
//   key  -> trường dữ liệu của lead
//   label -> tiêu đề cột hiển thị
//   type -> loại dữ liệu để so sánh ('string' | 'number' | 'date')
const sortableColumns = [
  { key: "name", label: "Họ tên", type: "string" },
  { key: "phone", label: "Số điện thoại", type: "string" },
  { key: "course", label: "Khóa học", type: "string" },
  { key: "source", label: "Nguồn", type: "string" },
  { key: "status", label: "Trạng thái", type: "string" },
  { key: "score", label: "Điểm", type: "number" },
  { key: "cls", label: "Phân loại", type: "string" },
  { key: "assignee", label: "Người phụ trách", type: "string" },
  { key: "lastInteractionAt", label: "Lần tương tác gần nhất", type: "date" },
  { key: "nextFollowUpAt", label: "Ngày cần follow-up", type: "date" },
  { key: "date", label: "Ngày tạo", type: "date" },
];

export default function Leads() {
  const navigate = useNavigate();
  const toast = useToast();
  const user = useAuth();
  const salesView = isSales(user);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tất cả");
  const [classFilter, setClassFilter] = useState("Tất cả");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advFilters, setAdvFilters] = useState({
    dateFrom: "", dateTo: "", scoreMin: "", scoreMax: "", overdueOnly: false,
    course: "Tất cả", source: "Tất cả", assignee: "Tất cả", campaign: "Tất cả",
  });
  const [advFiltersDraft, setAdvFiltersDraft] = useState(advFilters);
  const [filterOptions, setFilterOptions] = useState({ courses: [], sources: [], assignees: [], campaigns: [] });
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState(null); // 'desc' | 'asc' | null
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  useEscapeKey(showAdd, () => setShowAdd(false));
  useEscapeKey(showImport, () => setShowImport(false));
  const [importMsg, setImportMsg] = useState("");
  const [importing, setImporting] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [archiving, setArchiving] = useState(false);
  const [showArchived, setShowArchived] = useState(false); // xem "Lead lưu trữ" thay vì danh sách hoạt động
  const [restoringId, setRestoringId] = useState(null);
  const [salesUsers, setSalesUsers] = useState([]); // danh sách Sales cho dropdown "Người phụ trách"
  const [submitting, setSubmitting] = useState(false);
  const [refreshTick, forceRefresh] = useState(0);

  // GET /api/users — nạp danh sách Sales/Admissions cho dropdown "Người phụ
  // trách" ở form Thêm lead. Chỉ cần nạp 1 lần, không phụ thuộc vào Sales/
  // Admissions hiện tại (họ vốn không được tạo lead cho người khác).
  // Lưu ý khi nối Back-end thật: hiện dùng chung /admin/users (chỉ Admin gọi
  // được) — nên đổi sang 1 endpoint nhẹ hơn kiểu GET /users?role=Sales,
  // không giới hạn quyền Admin, để mọi vai trò tạo lead đều gọi được.
  useEffect(() => {
    fetchUsers()
      .then((list) => setSalesUsers(list.filter((u) => u.role === "Sales/Admissions" && u.status !== "Đã khóa")))
      .catch(() => {});
  }, []);

  // GET /api/leads/filter-options — nạp 1 lần cho các lựa chọn Khóa học/Nguồn/
  // Người phụ trách/Chiến dịch trong bộ lọc nâng cao.
  useEffect(() => {
    fetchLeadFilterOptions().then(setFilterOptions).catch(() => {});
  }, [refreshTick]);

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
    // Sales/Admissions chỉ được xem lead được phân công cho mình (Mục IV.3) —
    // dùng đúng endpoint /leads/my thay vì /leads để Back-end tự giới hạn
    // theo token đăng nhập, không dựa vào tham số assignee do FE tự truyền.
    const fetchFn = isSales(user) ? fetchMyLeads : fetchLeads;
    fetchFn({
      query,
      status: statusFilter,
      cls: classFilter,
      sortKey,
      sortDir,
      page,
      pageSize,
      dateFrom: advFilters.dateFrom || undefined,
      dateTo: advFilters.dateTo || undefined,
      scoreMin: advFilters.scoreMin,
      scoreMax: advFilters.scoreMax,
      overdueOnly: advFilters.overdueOnly,
      course: advFilters.course,
      source: advFilters.source,
      assignee: advFilters.assignee,
      campaign: advFilters.campaign,
      archivedOnly: showArchived,
    }, user?.name)
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
  }, [query, statusFilter, classFilter, sortKey, sortDir, page, refreshTick, advFilters, user, showArchived]);

  const emptyForm = {
    // Bắt buộc
    name: "",
    course: "",
    source: "",
    phone: "",
    email: "",
    // Mở rộng (tùy chọn)
    assignee: "", // "" = Chưa phân công
    campaign: "",
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
      const items = await exportLeadsCsv({
        query,
        status: statusFilter,
        cls: classFilter,
        dateFrom: advFilters.dateFrom || undefined,
        dateTo: advFilters.dateTo || undefined,
        scoreMin: advFilters.scoreMin,
        scoreMax: advFilters.scoreMax,
        overdueOnly: advFilters.overdueOnly,
        course: advFilters.course,
        source: advFilters.source,
        assignee: advFilters.assignee,
        campaign: advFilters.campaign,
      });
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

  // POST /api/leads/{id}/archive — Mục IX.2: không xóa cứng lead trong MVP,
  // dùng trạng thái lưu trữ thay cho xóa.
  const handleArchiveLead = async () => {
    if (!archiveTarget) return;
    setArchiving(true);
    try {
      await archiveLead(archiveTarget.id);
      toast.success(`Đã lưu trữ lead "${archiveTarget.name}".`);
      setArchiveTarget(null);
      forceRefresh((n) => n + 1);
    } catch (err) {
      toast.error(err.message || "Lưu trữ thất bại.");
    } finally {
      setArchiving(false);
    }
  };

  // POST /api/leads/{id}/unarchive — khôi phục lead từ trang "Lead lưu trữ"
  // về danh sách hoạt động bình thường.
  const handleRestoreLead = async (lead) => {
    setRestoringId(lead.id);
    try {
      await unarchiveLead(lead.id);
      toast.success(`Đã khôi phục lead "${lead.name}".`);
      forceRefresh((n) => n + 1);
    } catch (err) {
      toast.error(err.message || "Khôi phục thất bại.");
    } finally {
      setRestoringId(null);
    }
  };

  // Chuyển qua lại giữa danh sách lead hoạt động <-> lead đã lưu trữ.
  const toggleArchivedView = () => {
    setShowArchived((v) => !v);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {showArchived ? "Lead đã lưu trữ" : "Quản lý Lead"}
          </h2>
          <p className="text-sm text-slate-500">
            {showArchived
              ? "Các lead đã được ẩn khỏi danh sách chính — dữ liệu vẫn được giữ nguyên, có thể khôi phục bất cứ lúc nào."
              : "Quản lý, phân loại và chấm điểm khách hàng tiềm năng"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleArchivedView}
            className={`flex items-center gap-1.5 text-xs border rounded-lg px-3 py-2 ${
              showArchived ? "border-brand-500 text-brand-700 bg-brand-50" : "border-slate-300 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {showArchived ? <ChevronLeft size={14} /> : <Archive size={14} />}
            {showArchived ? "Quay lại danh sách" : "Lead lưu trữ"}
          </button>
          {!showArchived && (
            <>
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
            </>
          )}
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
            placeholder="Tìm theo tên, khóa học, email, số điện thoại..."
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
          <button
            onClick={() => { setAdvFiltersDraft(advFilters); setShowAdvancedFilters((v) => !v); }}
            className={`flex items-center justify-center gap-1.5 text-xs border rounded-lg px-3 py-2 shrink-0 whitespace-nowrap ${
              showAdvancedFilters ? "border-brand-500 text-brand-700 bg-brand-50" : "border-slate-300 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <ListFilter size={14} /> Bộ lọc
            {(advFilters.dateFrom || advFilters.dateTo || advFilters.scoreMin || advFilters.scoreMax || advFilters.overdueOnly ||
              advFilters.course !== "Tất cả" || advFilters.source !== "Tất cả" || advFilters.assignee !== "Tất cả" || advFilters.campaign !== "Tất cả") && (
              <span className="w-1.5 h-1.5 rounded-full bg-brand-600" />
            )}
          </button>
        </div>
      </div>

      {/* Bộ lọc nâng cao — theo khoảng thời gian, khoảng điểm, follow-up quá hạn (Mục XI.3) */}
      {showAdvancedFilters && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Từ ngày</label>
              <input
                type="date"
                value={advFiltersDraft.dateFrom}
                onChange={(e) => setAdvFiltersDraft({ ...advFiltersDraft, dateFrom: e.target.value })}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Đến ngày</label>
              <input
                type="date"
                value={advFiltersDraft.dateTo}
                onChange={(e) => setAdvFiltersDraft({ ...advFiltersDraft, dateTo: e.target.value })}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Điểm từ</label>
              <input
                type="number"
                min={0}
                max={100}
                value={advFiltersDraft.scoreMin}
                onChange={(e) => setAdvFiltersDraft({ ...advFiltersDraft, scoreMin: e.target.value })}
                placeholder="0"
                className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Điểm đến</label>
              <input
                type="number"
                min={0}
                max={100}
                value={advFiltersDraft.scoreMax}
                onChange={(e) => setAdvFiltersDraft({ ...advFiltersDraft, scoreMax: e.target.value })}
                placeholder="100"
                className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <label className="flex items-center gap-1.5 text-xs text-slate-600 pb-2 cursor-pointer">
              <input
                type="checkbox"
                checked={advFiltersDraft.overdueOnly}
                onChange={(e) => setAdvFiltersDraft({ ...advFiltersDraft, overdueOnly: e.target.checked })}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              Chỉ follow-up quá hạn
            </label>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Khóa học</label>
              <select
                value={advFiltersDraft.course}
                onChange={(e) => setAdvFiltersDraft({ ...advFiltersDraft, course: e.target.value })}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="Tất cả">Tất cả</option>
                {filterOptions.courses.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Nguồn</label>
              <select
                value={advFiltersDraft.source}
                onChange={(e) => setAdvFiltersDraft({ ...advFiltersDraft, source: e.target.value })}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="Tất cả">Tất cả</option>
                {filterOptions.sources.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            {!salesView && (
              <div>
                <label className="text-xs text-slate-500 block mb-1">Nhân viên phụ trách</label>
                <select
                  value={advFiltersDraft.assignee}
                  onChange={(e) => setAdvFiltersDraft({ ...advFiltersDraft, assignee: e.target.value })}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="Tất cả">Tất cả</option>
                  {filterOptions.assignees.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="text-xs text-slate-500 block mb-1">Chiến dịch</label>
              <select
                value={advFiltersDraft.campaign}
                onChange={(e) => setAdvFiltersDraft({ ...advFiltersDraft, campaign: e.target.value })}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="Tất cả">Tất cả</option>
                {filterOptions.campaigns.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
            <button
              onClick={() => {
                const cleared = {
                  dateFrom: "", dateTo: "", scoreMin: "", scoreMax: "", overdueOnly: false,
                  course: "Tất cả", source: "Tất cả", assignee: "Tất cả", campaign: "Tất cả",
                };
                setAdvFiltersDraft(cleared);
                setAdvFilters(cleared);
                resetPage();
              }}
              className="text-xs text-slate-500 hover:text-slate-700 mt-2"
            >
              Xóa bộ lọc
            </button>
            <button
              onClick={() => { setAdvFilters(advFiltersDraft); resetPage(); }}
              className="ml-auto mt-2 text-xs bg-brand-600 hover:bg-brand-500 text-white rounded-lg px-3 py-1.5"
            >
              Áp dụng
            </button>
          </div>
        </div>
      )}

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
                  <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">
                    {l.phone && l.phone !== "—" ? l.phone : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">{l.course}</td>
                  <td className="py-2.5 px-4 whitespace-nowrap"><SourceBadge source={l.source} /></td>
                  <td className="py-2.5 px-4"><Pill text={l.status} map={statusStyle} /></td>
                  <td className="py-2.5 px-4 font-medium text-slate-800">{l.score}</td>
                  <td className="py-2.5 px-4"><ClassBadge cls={l.cls} /></td>
                  <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">{l.assignee || "Chưa phân công"}</td>
                  <td className="py-2.5 px-4 text-slate-400 whitespace-nowrap text-xs">
                    {l.lastInteractionAt || "—"}
                  </td>
                  <td className="py-2.5 px-4 whitespace-nowrap text-xs">
                    {l.nextFollowUpAt ? (
                      <span className={new Date(l.nextFollowUpAt) <= new Date() ? "text-red-600 font-medium" : "text-slate-400"}>
                        {formatVietnamDateTime(l.nextFollowUpAt)}
                        {new Date(l.nextFollowUpAt) <= new Date() ? " (quá hạn)" : ""}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-slate-400 whitespace-nowrap text-xs">{l.date}</td>
                  <td className="py-2.5 px-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5">
                      {l.phone && l.phone !== "—" ? (
                        <a
                          href={`tel:${l.phone.replace(/\D/g, "")}`}
                          className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-brand-600"
                          title="Gọi điện"
                        >
                          <Phone size={13} />
                        </a>
                      ) : (
                        <span className="p-1.5 text-slate-200" title="Chưa có số điện thoại"><Phone size={13} /></span>
                      )}
                      {l.email && l.email !== "—" ? (
                        <a
                          href={`mailto:${l.email}`}
                          className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-emerald-600"
                          title="Gửi email"
                        >
                          <Mail size={13} />
                        </a>
                      ) : (
                        <span className="p-1.5 text-slate-200" title="Chưa có email"><Mail size={13} /></span>
                      )}
                      {l.phone && l.phone !== "—" ? (
                        <a
                          href={`https://zalo.me/${l.phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-violet-600"
                          title="Nhắn Zalo"
                        >
                          <MessageCircle size={13} />
                        </a>
                      ) : (
                        <span className="p-1.5 text-slate-200" title="Chưa có số điện thoại"><MessageCircle size={13} /></span>
                      )}
                      <button
                        onClick={() => (showArchived ? handleRestoreLead(l) : setArchiveTarget(l))}
                        disabled={restoringId === l.id}
                        className={`p-1.5 rounded-md text-slate-400 disabled:opacity-50 ${
                          showArchived ? "hover:bg-emerald-50 hover:text-emerald-600" : "hover:bg-amber-50 hover:text-amber-600"
                        }`}
                        title={showArchived ? "Khôi phục lead" : "Lưu trữ lead"}
                      >
                        {restoringId === l.id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : showArchived ? (
                          <ArchiveRestore size={13} />
                        ) : (
                          <Archive size={13} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={12} className="p-0">
                    <EmptyState
                      icon={showArchived ? Archive : SearchX}
                      title={showArchived ? "Chưa có lead nào được lưu trữ" : "Không tìm thấy kết quả phù hợp"}
                      description={
                        showArchived
                          ? "Lead sau khi lưu trữ sẽ hiển thị ở đây, có thể khôi phục lại bất cứ lúc nào."
                          : "Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái/phân loại."
                      }
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
        open={!!archiveTarget}
        title="Lưu trữ lead"
        message={archiveTarget ? `Bạn có chắc chắn muốn lưu trữ lead "${archiveTarget.name}"? Lead sẽ được ẩn khỏi danh sách nhưng toàn bộ lịch sử chăm sóc và điểm số vẫn được giữ nguyên (không xóa cứng dữ liệu).` : ""}
        confirmLabel="Lưu trữ"
        danger={false}
        irreversible={false}
        onCancel={() => setArchiveTarget(null)}
        onConfirm={handleArchiveLead}
        loading={archiving}
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
                    {courseOptions.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
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

              <div>
                <label className="text-xs text-slate-500 block mb-1">Chiến dịch (nếu có)</label>
                <select
                  value={form.campaign}
                  onChange={(e) => setForm({ ...form, campaign: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="">Không thuộc chiến dịch nào</option>
                  {filterOptions.campaigns.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-500 block mb-1">Người phụ trách</label>
                <select
                  value={form.assignee}
                  onChange={(e) => setForm({ ...form, assignee: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="">Chưa phân công</option>
                  {salesUsers.map((u) => (
                    <option key={u.id} value={u.name}>{u.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Số điện thoại</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="0900 000 000"
                    className={`w-full bg-slate-50 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 ${
                      formErrors.phone ? "border-red-300" : "border-slate-200"
                    }`}
                  />
                  {formErrors.phone && <p className="text-[11px] text-red-600 mt-1">{formErrors.phone}</p>}
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Email</label>
                  <input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="email@gmail.com"
                    className={`w-full bg-slate-50 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 ${
                      formErrors.email ? "border-red-300" : "border-slate-200"
                    }`}
                  />
                  {formErrors.email && <p className="text-[11px] text-red-600 mt-1">{formErrors.email}</p>}
                </div>
              </div>
              <p className="text-[11px] text-slate-400 -mt-2">* Cần nhập ít nhất một trong hai: số điện thoại hoặc email.</p>

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
