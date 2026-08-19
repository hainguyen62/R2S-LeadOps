import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Flame, Droplet, UserCheck, ChevronDown, Check, AlertCircle, Users, X, Loader2, CalendarClock, PlusCircle, Clock, History as HistoryIcon, Ticket, Percent, Banknote } from "lucide-react";
import Pill from "../components/ui/Pill.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import ContactButtons from "../components/ui/ContactButtons.jsx";
import { LeadDetailSkeleton } from "../components/ui/Skeleton.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { useToast } from "../components/ui/ToastProvider.jsx";
import { statusStyle, classStyle, leadStatusOrder } from "../data/mockData.js";
import { fetchLeadById, fetchLeadActivities, updateLeadStatus, assignLead, addLeadActivity, updateLead, fetchLeadScoreEvents } from "../services/leadService.js";
import { fetchUsers } from "../services/settingsService.js";
import { fetchCampaigns } from "../services/campaignService.js";
import {
  fetchLeadAppointments,
  createAppointment,
  cancelAppointment,
  completeAppointment,
  APPOINTMENT_CHANNEL_ENUM,
  APPOINTMENT_RESULT_ENUM,
} from "../services/appointmentService.js";
import { fetchApplicableVouchers, fetchLeadVoucherRedemptions, redeemVoucher, computeDiscount } from "../services/voucherService.js";
import { fetchCourseByName, totalWithFees } from "../services/courseService.js";
import { priorityTier, getScoreBreakdown, scoreLead, scoringGroups, deductionGroup } from "../utils/leadScoring.js";
import { useAuth } from "../context/AuthContext.jsx";
import { isSales, isAdmin, can } from "../utils/permissions.js";
import { formatVietnamDateTime, vietnamDateTimeToIso } from "../utils/datetime.js";

// Loại hoạt động chăm sóc (Module 4 - Mục VI kế hoạch)
const activityTypes = [
  "Gọi điện",
  "Messenger",
  "Zalo",
  "Email",
  "Tư vấn trực tiếp",
  "Họp online",
  "Gửi tài liệu",
  "Hẹn gọi lại",
  "Ghi chú nội bộ",
];

// Kết quả sau tương tác (Mục V.2 kế hoạch)
const activityResults = [
  "Không nghe máy",
  "Đã kết nối",
  "Cần tư vấn thêm",
  "Hẹn gọi lại",
  "Đang cân nhắc",
  "Đồng ý đặt cọc",
  "Không phù hợp",
];

// Map nhãn tiếng Việt ở trên sang enum ACTIVITY_TYPE_ENUM/ACTIVITY_RESULT_ENUM
// của backend (dùng khi gọi API thật) — vài nhãn không có tương ứng chính xác,
// tạm chọn giá trị gần nghĩa nhất, cần TTS2 xác nhận lại.
const ACTIVITY_TYPE_LABEL_TO_ENUM = {
  "Gọi điện": "CALL",
  Messenger: "MESSAGE",
  Zalo: "ZALO",
  Email: "EMAIL",
  "Tư vấn trực tiếp": "CONSULTATION",
  "Họp online": "MEETING",
  "Gửi tài liệu": "NOTE",
  "Hẹn gọi lại": "FOLLOW_UP",
  "Ghi chú nội bộ": "NOTE",
};
const ACTIVITY_RESULT_LABEL_TO_ENUM = {
  "Không nghe máy": "NO_ANSWER",
  "Đã kết nối": "CONNECTED",
  "Cần tư vấn thêm": "OTHER",
  "Hẹn gọi lại": "CALLBACK",
  "Đang cân nhắc": "INTERESTED",
  "Đồng ý đặt cọc": "SUCCESS",
  "Không phù hợp": "NOT_INTERESTED",
};

const APPOINTMENT_CHANNEL_LABEL = { PHONE: "Điện thoại", MESSENGER: "Messenger", ZALO: "Zalo", EMAIL: "Email", GOOGLE_MEET: "Google Meet", OFFLINE: "Gặp trực tiếp", OTHER: "Khác" };
const APPOINTMENT_RESULT_LABEL = { INTERESTED: "Đang cân nhắc", NOT_INTERESTED: "Không phù hợp", CALLBACK: "Hẹn gọi lại", SUCCESS: "Thành công", FAILED: "Thất bại", OTHER: "Khác" };

// Cùng bộ 3 cấp độ ưu tiên với popup Chi tiết lead ở Dashboard, để icon
// lửa/giọt nước và badge nhất quán xuyên suốt ứng dụng.
const priorityStyles = {
  hot: { Icon: Flame, fill: true, iconClass: "text-red-600", badgeClass: "bg-red-50 text-red-700 border border-red-200" },
  warm: { Icon: Flame, fill: true, iconClass: "text-orange-500", badgeClass: "bg-orange-50 text-orange-600 border border-orange-200" },
  cool: { Icon: Droplet, fill: false, iconClass: "text-sky-500", badgeClass: "bg-sky-50 text-sky-600 border border-sky-200" },
};

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const user = useAuth();
  const salesView = isSales(user);
  const [lead, setLead] = useState(null);
  const [history, setHistory] = useState([]);
  const [scoreEvents, setScoreEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // ---- Chiến dịch nguồn của lead (Mục 6.5) ----
  // lead.campaign chỉ lưu TÊN chiến dịch, nên cần tra cứu id tương ứng
  // trong danh sách campaigns để có thể điều hướng sang trang chi tiết.
  const [campaignMatch, setCampaignMatch] = useState(null);

  // ---- Phân công lead (Module 5) ----
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignees, setAssignees] = useState([]);
  const [assigneesLoading, setAssigneesLoading] = useState(false);
  const [assignForm, setAssignForm] = useState({ assignee: "", reason: "" });
  const [assigning, setAssigning] = useState(false);

  // ---- Thêm hoạt động chăm sóc (Module 4) ----
  const [activityOpen, setActivityOpen] = useState(false);
  const [activityForm, setActivityForm] = useState({ type: "Gọi điện", content: "", result: "" });
  const [addingActivity, setAddingActivity] = useState(false);

  // ---- Đặt lịch follow-up (Mục V.2, IX: next_follow_up_at) ----
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [followUpForm, setFollowUpForm] = useState({ datetime: "", note: "" });
  const [savingFollowUp, setSavingFollowUp] = useState(false);

  // ---- Bảng điểm checkbox — chỉnh sửa tín hiệu chấm điểm (Mục 3.3) ----
  const [scoreFormOpen, setScoreFormOpen] = useState(false);
  const [draftSignals, setDraftSignals] = useState({});
  const [savingScore, setSavingScore] = useState(false);

  const [appointments, setAppointments] = useState([]);
  const [apptLoading, setApptLoading] = useState(false);
  const [apptOpen, setApptOpen] = useState(false);
  const [apptForm, setApptForm] = useState({ title: "", date: "", time: "", durationMinutes: 30, channel: "PHONE", note: "" });
  const [apptSaving, setApptSaving] = useState(false);
  const [apptAction, setApptAction] = useState(null); // { appointment, mode: "cancel" | "complete" }
  const [apptActionForm, setApptActionForm] = useState({ reason: "", result: "SUCCESS", note: "" });
  const [apptActionSaving, setApptActionSaving] = useState(false);

  // ---- Học phí + mã giảm giá (thay cho khối "Voucher giảm giá" cũ) ----
  const [coursePricing, setCoursePricing] = useState(null); // { basePrice, fees, ... } | null nếu chưa cấu hình ở "Quản lý khóa học"
  const [applicableVouchers, setApplicableVouchers] = useState([]);
  const [discountCode, setDiscountCode] = useState(""); // mã đang gõ/chọn — chưa chắc đã áp dụng
  const [codeMenuOpen, setCodeMenuOpen] = useState(false);
  const [manualOrderValue, setManualOrderValue] = useState(""); // chỉ dùng khi khóa học CHƯA có học phí cấu hình
  const [redeemingVoucher, setRedeemingVoucher] = useState(false);
  const [redemptions, setRedemptions] = useState([]);

  // GET /api/leads/{id} + GET /api/leads/{id}/activities — xem leadService.js
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([fetchLeadById(id), fetchLeadActivities(id), fetchLeadScoreEvents(id)])
      .then(([l, h, se]) => {
        if (cancelled) return;
        if (salesView && l.assignee !== user?.name) {
          setError("Bạn không có quyền xem lead này (chỉ được phân công cho nhân viên khác).");
          return;
        }
        setLead(l);
        setHistory(h);
        setScoreEvents(se);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Không thể tải thông tin lead.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, salesView, user]);

  // Tra cứu id chiến dịch theo tên (lead.campaign) để hiển thị link sang
  // CampaignDetails — chỉ tải khi lead có gắn chiến dịch và user có quyền
  // xem trang Campaign (Sales không có quyền accessCampaignsPage).
  useEffect(() => {
    let cancelled = false;
    if (!lead?.campaign || !can(user, "accessCampaignsPage")) {
      setCampaignMatch(null);
      return;
    }
    fetchCampaigns()
      .then((list) => {
        if (cancelled) return;
        setCampaignMatch(list.find((c) => c.name === lead.campaign) || null);
      })
      .catch(() => {
        if (!cancelled) setCampaignMatch(null);
      });
    return () => {
      cancelled = true;
    };
  }, [lead?.campaign, user]);

  // GET /leads/{id}/appointments — chỉ có dữ liệu khi kết nối API thật (Mục 4.1)
  // Hook này phải được khai báo trước các nhánh return loading/error để thứ tự
  // Hooks không thay đổi giữa lần render đầu và sau khi tải lead xong.
  const refreshAppointments = () => {
    setApptLoading(true);
    fetchLeadAppointments(id, { pageSize: 50 })
      .then(({ items }) => setAppointments(items))
      .catch(() => setAppointments([]))
      .finally(() => setApptLoading(false));
  };
  useEffect(() => {
    refreshAppointments();
  }, [id]);

  // Danh sách voucher còn có thể áp dụng cho lead này + lịch sử đã dùng —
  // phải chờ `lead` tải xong (cần lead.course/lead.status để lọc điều kiện áp dụng).
  const refreshVouchers = () => {
    if (!lead) return;
    fetchApplicableVouchers(lead).then(setApplicableVouchers).catch(() => setApplicableVouchers([]));
    fetchLeadVoucherRedemptions(lead.id).then(setRedemptions).catch(() => setRedemptions([]));
  };
  useEffect(() => {
    refreshVouchers();
  }, [lead?.id, lead?.status, lead?.course]);

  // Học phí của khóa học lead đang chọn — lấy từ "Quản lý khóa học" (courseService).
  // Nếu Admin chưa cấu hình giá cho khóa này, coursePricing = null và UI sẽ cho
  // nhập tay giá trị đơn hàng như luồng cũ (không chặn Sales áp voucher).
  useEffect(() => {
    if (!lead?.course) {
      setCoursePricing(null);
      return;
    }
    let cancelled = false;
    fetchCourseByName(lead.course)
      .then((c) => {
        if (!cancelled) setCoursePricing(c);
      })
      .catch(() => {
        if (!cancelled) setCoursePricing(null);
      });
    return () => {
      cancelled = true;
    };
  }, [lead?.course]);

  // Tổng học phí (học phí gốc + phí phụ thu) CHƯA áp mã — null nếu chưa có giá cấu hình.
  const tuitionSubtotal = coursePricing ? totalWithFees(coursePricing) : null;
  const orderValueForVoucher = tuitionSubtotal != null ? tuitionSubtotal : Number(manualOrderValue) || 0;

  // Voucher khớp đúng mã đang gõ/chọn (so khớp không phân biệt hoa thường) — dùng để preview số tiền giảm.
  const matchedVoucher = applicableVouchers.find(
    (v) => v.code.toUpperCase() === discountCode.trim().toUpperCase()
  );
  const previewDiscount = matchedVoucher ? computeDiscount(matchedVoucher, orderValueForVoucher) : 0;
  // Sau khi áp dụng, số tiền giảm phải lấy từ lượt đổi mã đã lưu thay vì mã
  // đang nhập (mã này sẽ được xóa để ẩn khung nhập voucher).
  const appliedDiscount = redemptions.reduce((sum, redemption) => sum + (Number(redemption.discountAmount) || 0), 0);
  const hasAppliedVoucher = redemptions.length > 0;
  const discountAmount = hasAppliedVoucher ? Math.min(appliedDiscount, orderValueForVoucher) : previewDiscount;
  const finalTotal = Math.max(orderValueForVoucher - discountAmount, 0);

  if (loading) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate("/leads")}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft size={16} /> Quay lại danh sách lead
        </button>
        <LeadDetailSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate("/leads")}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft size={16} /> Quay lại danh sách lead
        </button>
        <EmptyState icon={AlertCircle} title="Không thể tải lead" description={error} compact />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate("/leads")}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft size={16} /> Quay lại danh sách lead
        </button>
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-500 shadow-card">
          Không tìm thấy lead này.
        </div>
      </div>
    );
  }

  // PATCH /api/leads/{id}/status — xem leadService.js
  const handleChangeStatus = async (newStatus) => {
    setStatusOpen(false);
    if (newStatus === lead.status) return;
    setUpdatingStatus(true);
    try {
      const updated = await updateLeadStatus(lead.id, { newStatus, actorName: user?.name });
      setLead(updated);
      const freshHistory = await fetchLeadActivities(lead.id);
      setHistory(freshHistory);
      toast.success("Cập nhật trạng thái thành công.");
    } catch (err) {
      toast.error(err.message || "Cập nhật trạng thái thất bại.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const refreshLead = async () => {
    const [l, h, se] = await Promise.all([fetchLeadById(lead.id), fetchLeadActivities(lead.id), fetchLeadScoreEvents(lead.id)]);
    setLead(l);
    setHistory(h);
    setScoreEvents(se);
  };

  // GET /api/users — mở modal Phân công là lúc mới cần danh sách Sales, không tải sẵn
  // từ đầu trang để tránh gọi API thừa cho những lead không ai mở modal này.
  const openApptModal = () => {
    setApptForm({ title: "", date: "", time: "", durationMinutes: 30, channel: "PHONE", note: "" });
    setApptOpen(true);
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    if (!apptForm.title.trim() || !apptForm.date || !apptForm.time) return;
    setApptSaving(true);
    try {
      const appointmentAt = vietnamDateTimeToIso(apptForm.date, apptForm.time);
      await createAppointment(lead.id, {
        title: apptForm.title.trim(),
        appointmentAt,
        durationMinutes: Number(apptForm.durationMinutes) || 30,
        channel: apptForm.channel,
        note: apptForm.note.trim() || undefined,
      });
      refreshAppointments();
      toast.success("Đã đặt lịch hẹn.");
      setApptOpen(false);
    } catch (err) {
      toast.error(err.message || "Đặt lịch hẹn thất bại.");
    } finally {
      setApptSaving(false);
    }
  };

  const handleRedeemVoucher = async () => {
    if (!discountCode.trim()) return;
    setRedeemingVoucher(true);
    try {
      const redemption = await redeemVoucher(lead, {
        voucherCode: discountCode.trim(),
        orderValue: orderValueForVoucher,
        actorName: user?.name,
      });
      const freshHistory = await fetchLeadActivities(lead.id);
      setHistory(freshHistory);
      // Cập nhật ngay để UI chuyển sang chi tiết thanh toán, không chờ lần
      // tải lại danh sách voucher ở nền.
      setRedemptions((current) => [redemption, ...current]);
      refreshVouchers();
      toast.success(`Đã áp dụng mã "${discountCode.trim().toUpperCase()}".`);
      setDiscountCode("");
      setManualOrderValue("");
    } catch (err) {
      toast.error(err.message || "Áp dụng mã giảm giá thất bại.");
    } finally {
      setRedeemingVoucher(false);
    }
  };

  const openApptAction = (appointment, mode) => {
    setApptActionForm({ reason: "", result: "SUCCESS", note: "" });
    setApptAction({ appointment, mode });
  };

  const handleApptAction = async (e) => {
    e.preventDefault();
    if (!apptAction) return;
    setApptActionSaving(true);
    try {
      if (apptAction.mode === "cancel") {
        if (!apptActionForm.reason.trim()) return;
        await cancelAppointment(apptAction.appointment.id, apptActionForm.reason.trim());
        toast.success("Đã hủy lịch hẹn.");
      } else {
        await completeAppointment(apptAction.appointment.id, { result: apptActionForm.result, note: apptActionForm.note.trim() || undefined });
        toast.success("Đã hoàn thành lịch hẹn.");
      }
      refreshAppointments();
      setApptAction(null);
    } catch (err) {
      toast.error(err.message || "Cập nhật lịch hẹn thất bại.");
    } finally {
      setApptActionSaving(false);
    }
  };

  const openAssignModal = async () => {
    setAssignForm({ assignee: "", reason: "" });
    setAssignOpen(true);
    setAssigneesLoading(true);
    try {
      const users = await fetchUsers();
      setAssignees(users.filter((u) => u.role === "Sales/Admissions"));
    } catch {
      toast.error("Không thể tải danh sách Sales.");
    } finally {
      setAssigneesLoading(false);
    }
  };

  // PATCH /api/leads/{id}/assignment — xem leadService.js
  const handleAssign = async (e) => {
    e.preventDefault();
    if (!assignForm.assignee) return;
    const selected = assignees.find((u) => String(u.id) === String(assignForm.assignee));
    if (!selected) return;
    if (selected.name === lead.assignee) {
      setAssignOpen(false);
      return;
    }
    setAssigning(true);
    try {
      await assignLead(lead.id, { assignee: selected.name, ownerId: selected.id, reason: assignForm.reason.trim() || undefined, actorName: user?.name });
      await refreshLead();
      toast.success(`Đã phân công lead cho ${selected.name}.`);
      setAssignOpen(false);
    } catch (err) {
      toast.error(err.message || "Phân công thất bại.");
    } finally {
      setAssigning(false);
    }
  };

  // POST /api/leads/{id}/activities — xem leadService.js
  const handleAddActivity = async (e) => {
    e.preventDefault();
    if (!activityForm.content.trim()) return;
    setAddingActivity(true);
    try {
      const text = activityForm.result
        ? `${activityForm.type}: ${activityForm.content.trim()} — Kết quả: ${activityForm.result}`
        : `${activityForm.type}: ${activityForm.content.trim()}`;
      await addLeadActivity(lead.id, {
        text,
        channel: lead.assignee || "Hệ thống",
        activityType: ACTIVITY_TYPE_LABEL_TO_ENUM[activityForm.type],
        result: activityForm.result ? ACTIVITY_RESULT_LABEL_TO_ENUM[activityForm.result] : undefined,
      });
      await refreshLead();
      toast.success("Đã ghi nhận hoạt động chăm sóc.");
      setActivityOpen(false);
      setActivityForm({ type: "Gọi điện", content: "", result: "" });
    } catch (err) {
      toast.error(err.message || "Ghi nhận hoạt động thất bại.");
    } finally {
      setAddingActivity(false);
    }
  };

  // POST /api/leads/{id}/activities với nextActionAt (không dùng PUT /leads/{id} —
  // UpdateLeadRequest không có field này) — xem services/leadService.js
  const handleSaveFollowUp = async (e) => {
    e.preventDefault();
    if (!followUpForm.datetime) return;
    setSavingFollowUp(true);
    try {
      const [date, time] = followUpForm.datetime.split("T");
      const nextActionAt = vietnamDateTimeToIso(date, time);
      const formatted = formatVietnamDateTime(nextActionAt);
      // Backend không có field nextFollowUpAt trong UpdateLeadRequest (PUT /leads/{id}),
      // nên KHÔNG dùng updateLead ở đây — nó sẽ bị lược bỏ âm thầm. Theo đúng spec,
      // thời gian follow-up phải gửi qua nextActionAt của CreateActivityRequest
      // (POST /leads/{id}/activities); backend tự cập nhật LeadResponse.nextActionAt.
      await addLeadActivity(lead.id, {
        text: `Đặt lịch follow-up lúc ${formatted}${followUpForm.note.trim() ? ` — Ghi chú: ${followUpForm.note.trim()}` : ""}`,
        channel: lead.assignee || "Hệ thống",
        activityType: "FOLLOW_UP",
        nextAction: followUpForm.note.trim() || undefined,
        nextActionAt,
      });
      await refreshLead();
      toast.success("Đã đặt lịch follow-up.");
      setFollowUpOpen(false);
      setFollowUpForm({ datetime: "", note: "" });
    } catch (err) {
      toast.error(err.message || "Đặt lịch follow-up thất bại.");
    } finally {
      setSavingFollowUp(false);
    }
  };

  // Mở bảng điểm checkbox — nạp lại từ lead.signals hiện tại mỗi lần mở,
  // tránh giữ state cũ từ lần chỉnh trước đó chưa lưu.
  const openScoreForm = () => {
    setDraftSignals({ ...(lead.signals || {}) });
    setScoreFormOpen(true);
  };

  const toggleSignal = (id) => {
    setDraftSignals((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const selectEnrollmentIntent = (value) => {
    setDraftSignals((prev) => ({ ...prev, enrollmentIntent: value }));
  };

  const draftScore = scoreLead({ signals: draftSignals });

  // PUT /api/leads/{id} — lưu lại toàn bộ tín hiệu chấm điểm đã chỉnh sửa;
  // Back-end (hoặc mock) tự tính lại score/cls từ signals mới, không tính
  // điểm ở FE để tránh lệch công thức giữa các nơi (Mục VII.6).
  const handleSaveScore = async (e) => {
    e.preventDefault();
    setSavingScore(true);
    try {
      const updated = await updateLead(lead.id, {
        signals: draftSignals,
        scoreUpdatedAt: formatVietnamDateTime(new Date()),
      });
      await addLeadActivity(lead.id, {
        text: `Cập nhật bảng điểm thủ công — điểm mới: ${updated.score}`,
        channel: lead.assignee || "Hệ thống",
        activityType: "NOTE",
      });
      await refreshLead();
      toast.success("Đã lưu bảng điểm.");
      setScoreFormOpen(false);
    } catch (err) {
      toast.error(err.message || "Lưu bảng điểm thất bại.");
    } finally {
      setSavingScore(false);
    }
  };

  const breakdown = getScoreBreakdown(lead);
  const tier = priorityTier(lead.score);
  const style = priorityStyles[tier];
  const PriorityIcon = style.Icon;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/leads")}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft size={16} /> Quay lại danh sách lead
      </button>

      <h2 className="text-lg font-semibold text-slate-900">Chi tiết Lead</h2>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ---- Cột trái ---- */}
        <div className="lg:col-span-2 space-y-6">
          {/* Thông tin liên hệ */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card space-y-4">
            <div className="flex items-center gap-3">
              <Avatar name={lead.name} initials={lead.initials} size={48} />
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 truncate">{lead.name}</p>
                <div className="mt-1"><Pill text={lead.status} map={statusStyle} /></div>
                <p className="text-xs text-slate-500 mt-1 truncate">{lead.course} · {lead.source}</p>
                {lead.campaign && (
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    Chiến dịch:{" "}
                    {campaignMatch ? (
                      <button
                        onClick={() => navigate(`/campaigns/${campaignMatch.id}`)}
                        className="text-brand-600 hover:text-brand-700 hover:underline font-medium"
                      >
                        {lead.campaign}
                      </button>
                    ) : (
                      <span className="text-slate-700 font-medium">{lead.campaign}</span>
                    )}
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Thông tin liên hệ</p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">SĐT</span>
                  <span className="text-slate-800">{lead.phone}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Email</span>
                  <span className="text-slate-800 text-right truncate">{lead.email}</span>
                </div>
                <div className="flex justify-between gap-3 items-center">
                  <span className="text-slate-500">Người phụ trách</span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-slate-800">{lead.assignee || "Chưa phân công"}</span>
                    {can(user, "assignLeads") && (
                      <button
                        onClick={openAssignModal}
                        title="Phân công / chuyển người phụ trách"
                        className="text-brand-600 hover:text-brand-700 shrink-0"
                      >
                        <Users size={13} />
                      </button>
                    )}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Ngày tạo</span>
                  <span className="text-slate-800">{lead.date}</span>
                </div>
                {lead.nextFollowUpAt && (
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Lịch follow-up</span>
                    <span className={new Date(lead.nextFollowUpAt) <= new Date() ? "text-red-600 font-medium" : "text-slate-800"}>
                      {formatVietnamDateTime(lead.nextFollowUpAt)}
                      {new Date(lead.nextFollowUpAt) <= new Date() ? " (quá hạn)" : ""}
                    </span>
                  </div>
                )}
              </div>
              {/* Liên hệ nhanh — bấm là mở kênh tương ứng ngay, không cần copy số/email */}
              <div className="mt-3 border-t border-slate-100 pt-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Liên hệ nhanh</p>
                <ContactButtons lead={lead} />
              </div>
            </div>
          </div>

          {/* Khối điểm số — nền trắng, viền, không dùng nền tối */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center bg-slate-50 border border-slate-200`}>
                  <PriorityIcon
                    size={22}
                    className={style.iconClass}
                    fill={style.fill ? "currentColor" : "none"}
                    strokeWidth={style.fill ? 0 : 2}
                  />
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">Tổng điểm</p>
                  <p className="text-3xl font-semibold text-slate-900">{lead.score}</p>
                </div>
              </div>
              <Pill text={lead.cls} map={classStyle} />
            </div>

            {(can(user, "editLeadCare") || isAdmin(user)) && (
              <button
                onClick={openScoreForm}
                className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                <PlusCircle size={13} /> Chỉnh sửa bảng điểm
              </button>
            )}

            {lead.scoreUpdatedAt && (
              <p className="flex items-center gap-1 text-[11px] text-slate-400">
                <Clock size={11} /> Tính điểm lúc: {lead.scoreUpdatedAt}
              </p>
            )}

            {breakdown.length > 0 && (
              <div className="border-t border-slate-100 pt-3 space-y-1.5">
                {breakdown.map((b, i) => (
                  <div key={i} className="flex justify-between text-xs gap-3">
                    <span className="text-slate-500">{b.label}</span>
                    <span
                      className={`font-medium shrink-0 ${
                        b.group === "E" || b.value.trim().startsWith("-") ? "text-red-600" : "text-emerald-600"
                      }`}
                    >
                      {b.value}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {scoreEvents.length > 0 && (
              <div className="border-t border-slate-100 pt-3">
                <p className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 mb-2">
                  <HistoryIcon size={12} /> Lịch sử thay đổi điểm
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {scoreEvents.map((ev, i) => (
                    <div key={i} className="flex items-start justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <p className="text-slate-600 truncate">{ev.label}</p>
                        <p className="text-[10px] text-slate-400">{formatVietnamDateTime(ev.date)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={ev.value.trim().startsWith("-") ? "text-red-600 font-medium" : "text-emerald-600 font-medium"}>
                          {ev.value}
                        </span>
                        <p className="text-[10px] text-slate-400">→ {ev.scoreAfter}đ</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Hành động */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setActivityForm({ type: "Gọi điện", content: "", result: "" }); setActivityOpen(true); }}
                className="flex items-center justify-center gap-1.5 border border-slate-300 rounded-lg py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                <PlusCircle size={14} /> Hoạt động
              </button>
              <button
                onClick={() => {
                  setFollowUpForm({
                    datetime: lead.nextFollowUpAt ? lead.nextFollowUpAt.slice(0, 16) : "",
                    note: "",
                  });
                  setFollowUpOpen(true);
                }}
                className="flex items-center justify-center gap-1.5 border border-slate-300 rounded-lg py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                <CalendarClock size={14} /> Follow-up
              </button>
            </div>
            <div className="relative">
              <button
                onClick={() => setStatusOpen((v) => !v)}
                disabled={updatingStatus}
                className="w-full flex items-center justify-center gap-1.5 bg-brand-600 hover:bg-brand-500 rounded-lg py-2.5 text-sm text-white font-medium disabled:opacity-60"
              >
                {updatingStatus ? "Đang cập nhật..." : "Cập nhật trạng thái"} <ChevronDown size={15} className={statusOpen ? "rotate-180 transition-transform" : "transition-transform"} />
              </button>
              {statusOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setStatusOpen(false)} />
                  <div className="absolute z-20 bottom-full mb-2 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-elevated overflow-hidden">
                    {leadStatusOrder.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleChangeStatus(s)}
                        className="w-full flex items-center justify-between gap-2 px-3.5 py-2 text-sm text-left text-slate-700 hover:bg-slate-50"
                      >
                        {s}
                        {s === lead.status && <Check size={14} className="text-brand-600" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ---- Cột phải: Lịch hẹn tư vấn + Lịch sử chăm sóc ---- */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-slate-900">Lịch hẹn tư vấn</p>
              <button
                onClick={openApptModal}
                className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                <PlusCircle size={13} /> Đặt lịch hẹn
              </button>
            </div>
            {apptLoading ? (
              <p className="text-sm text-slate-400">Đang tải...</p>
            ) : appointments.length === 0 ? (
              <p className="text-sm text-slate-400">Chưa có lịch hẹn nào.</p>
            ) : (
              <div className="space-y-3">
                {appointments.map((a) => (
                  <div key={a.id} className="border border-slate-100 rounded-lg p-3">
                    <p className="text-sm font-medium text-slate-800">{a.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatVietnamDateTime(a.appointmentAt)} · {a.durationMinutes} phút · {a.channelLabel}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <Pill
                        text={a.statusLabel}
                        map={{
                          "Đã hoàn thành": "bg-emerald-50 text-emerald-700",
                          "Đã hủy": "bg-slate-100 text-slate-500",
                          "Lead không đến": "bg-slate-100 text-slate-500",
                        }}
                        fallback="bg-indigo-50 text-indigo-700"
                      />
                      {(a.status === "SCHEDULED" || a.status === "CONFIRMED") && (
                        <div className="flex items-center gap-2">
                          <button onClick={() => openApptAction(a, "complete")} className="text-xs font-medium text-emerald-600 hover:text-emerald-700">Hoàn thành</button>
                          <button onClick={() => openApptAction(a, "cancel")} className="text-xs font-medium text-red-500 hover:text-red-600">Hủy</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ---- Học phí & mã giảm giá (thay cho khối "Voucher giảm giá" cũ) ---- */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
            <p className="text-sm font-semibold text-slate-900 mb-4">Học phí</p>

            {/* Học phí — tự động lấy theo khóa học lead đang chọn, cấu hình ở "Quản lý khóa học" */}
            {coursePricing ? (
              <div className="space-y-1.5 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Học phí — {lead.course}</span>
                  <span className="font-medium text-slate-800">{coursePricing.basePrice.toLocaleString("vi-VN")}đ</span>
                </div>
                {coursePricing.fees?.map((f) => (
                  <div key={f.id} className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">+ {f.name}</span>
                    <span className="text-slate-500">{f.amount.toLocaleString("vi-VN")}đ</span>
                  </div>
                ))}
              </div>
            ) : (can(user, "editLeadCare") || isAdmin(user)) ? (
              <div className="mb-4">
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-3">
                  Chưa cấu hình học phí cho khóa "{lead.course}". {isAdmin(user) ? "Vào \"Quản lý khóa học\" để cài đặt giá, hoặc nhập tay giá trị đơn hàng bên dưới." : "Nhập tay giá trị đơn hàng bên dưới hoặc liên hệ Admin để cài đặt học phí."}
                </p>
                <label className="text-xs text-slate-500 block mb-1">Giá trị đơn hàng (VNĐ)</label>
                <input
                  type="number"
                  min="0"
                  value={manualOrderValue}
                  onChange={(e) => setManualOrderValue(e.target.value)}
                  placeholder="VD: 15000000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            ) : (
              <p className="text-xs text-slate-400 mb-4">Chưa cấu hình học phí cho khóa "{lead.course}".</p>
            )}

            {/* Chỉ cho nhập mã khi lead chưa có voucher được áp dụng. Sau đó,
                khối này được thay bằng chi tiết thanh toán bên dưới. */}
            {(can(user, "editLeadCare") || isAdmin(user)) && !hasAppliedVoucher && (
              <div className="mb-4">
                <label className="text-xs text-slate-500 block mb-1">Mã giảm giá</label>
                <div className="relative">
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus-within:ring-1 focus-within:ring-brand-500">
                    <Ticket size={14} className="text-slate-400 shrink-0" />
                    <input
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                      onFocus={() => setCodeMenuOpen(true)}
                      onBlur={() => setTimeout(() => setCodeMenuOpen(false), 120)}
                      placeholder={applicableVouchers.length > 0 ? "Nhập hoặc chọn mã..." : "Nhập mã giảm giá..."}
                      className="flex-1 min-w-0 bg-transparent text-sm font-mono focus:outline-none"
                    />
                    {discountCode && (
                      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => setDiscountCode("")} className="text-slate-300 hover:text-slate-500 shrink-0">
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {codeMenuOpen && applicableVouchers.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-elevated z-10 overflow-hidden max-h-48 overflow-y-auto">
                      {applicableVouchers
                        .filter((v) => !discountCode.trim() || v.code.includes(discountCode.trim().toUpperCase()))
                        .map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setDiscountCode(v.code);
                              setCodeMenuOpen(false);
                            }}
                            className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs hover:bg-slate-50 text-left"
                          >
                            <span className="font-mono font-medium text-slate-800">{v.code}</span>
                            <span className="flex items-center gap-1 text-violet-600 shrink-0">
                              {v.discountType === "PERCENT" ? <Percent size={10} /> : <Banknote size={10} />}
                              {v.discountType === "PERCENT" ? `${v.discountValue}%` : `${v.discountValue.toLocaleString("vi-VN")}đ`}
                            </span>
                          </button>
                        ))}
                      {applicableVouchers.filter((v) => !discountCode.trim() || v.code.includes(discountCode.trim().toUpperCase())).length === 0 && (
                        <p className="px-3 py-2 text-xs text-slate-400">Không có mã nào khớp.</p>
                      )}
                    </div>
                  )}
                </div>
                {discountCode.trim() && !matchedVoucher && (
                  <p className="text-[11px] text-slate-400 mt-1">Mã này chưa thỏa điều kiện áp dụng cho lead — hệ thống sẽ kiểm tra lại khi bấm áp dụng.</p>
                )}
              </div>
            )}

            {/* Chi tiết thanh toán — gồm học phí, các phí phụ thu ở trên và khoản
                giảm giá từ voucher đã áp dụng (hoặc phần xem trước khi đang nhập mã). */}
            {orderValueForVoucher > 0 && (
              <div className="border-t border-slate-100 pt-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Tạm tính</span>
                  <span>{orderValueForVoucher.toLocaleString("vi-VN")}đ</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex items-center justify-between text-xs text-emerald-600">
                    <span>Giảm giá ({hasAppliedVoucher ? redemptions.map((r) => r.voucherCode).join(", ") : discountCode.trim().toUpperCase()})</span>
                    <span>− {discountAmount.toLocaleString("vi-VN")}đ</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900">Tổng tiền cuối cùng</span>
                  <span className="text-lg font-semibold text-brand-600">{finalTotal.toLocaleString("vi-VN")}đ</span>
                </div>
              </div>
            )}

            {(can(user, "editLeadCare") || isAdmin(user)) && !hasAppliedVoucher && (
              <button
                type="button"
                onClick={handleRedeemVoucher}
                disabled={redeemingVoucher || !discountCode.trim() || orderValueForVoucher <= 0}
                className="w-full mt-4 bg-brand-600 hover:bg-brand-500 rounded-lg py-2 text-sm text-white disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5"
              >
                {redeemingVoucher && <Loader2 size={14} className="animate-spin" />}
                {redeemingVoucher ? "Đang áp dụng..." : "Áp dụng mã giảm giá"}
              </button>
            )}

            {hasAppliedVoucher && (
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                <p className="text-xs font-medium text-slate-500 mb-1">Voucher đã áp dụng</p>
                {redemptions.map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-xs border border-slate-100 rounded-lg px-3 py-2">
                    <div className="min-w-0">
                      <p className="font-mono font-medium text-slate-800">{r.voucherCode}</p>
                      <p className="text-slate-400">{formatVietnamDateTime(r.redeemedAt)} · {r.redeemedBy}</p>
                    </div>
                    <p className="font-medium text-emerald-600 shrink-0">− {r.discountAmount.toLocaleString("vi-VN")}đ</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
            <p className="text-sm font-semibold text-slate-900 mb-4">Lịch sử chăm sóc</p>
            {history.length === 0 ? (
              <p className="text-sm text-slate-400">Chưa có hoạt động chăm sóc nào.</p>
            ) : (
              <div className="space-y-4">
                {history.map((h, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <UserCheck size={11} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-slate-700">{h.text}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{h.channel} · {h.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ---- Modal: Đặt lịch hẹn tư vấn ---- */}
      {apptOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-elevated">
            <div className="flex items-center justify-between px-6 pt-6 pb-2">
              <p className="text-sm font-semibold text-slate-900">Đặt lịch hẹn tư vấn</p>
              <button onClick={() => setApptOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateAppointment} className="px-6 pb-6 pt-2 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600">Tiêu đề</label>
                <input
                  value={apptForm.title}
                  onChange={(e) => setApptForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Tư vấn khóa học..."
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">Ngày</label>
                  <input type="date" value={apptForm.date} onChange={(e) => setApptForm((f) => ({ ...f, date: e.target.value }))} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" required />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Giờ</label>
                  <input type="time" value={apptForm.time} onChange={(e) => setApptForm((f) => ({ ...f, time: e.target.value }))} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">Thời lượng (phút)</label>
                  <input
                    type="number"
                    min={5}
                    max={480}
                    value={apptForm.durationMinutes}
                    onChange={(e) => setApptForm((f) => ({ ...f, durationMinutes: e.target.value }))}
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Kênh</label>
                  <select value={apptForm.channel} onChange={(e) => setApptForm((f) => ({ ...f, channel: e.target.value }))} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
                    {APPOINTMENT_CHANNEL_ENUM.map((c) => (
                      <option key={c} value={c}>{APPOINTMENT_CHANNEL_LABEL[c]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Ghi chú</label>
                <textarea
                  value={apptForm.note}
                  onChange={(e) => setApptForm((f) => ({ ...f, note: e.target.value }))}
                  rows={2}
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setApptOpen(false)} className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">Hủy</button>
                <button type="submit" disabled={apptSaving} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60 flex items-center gap-2">
                  {apptSaving && <Loader2 size={14} className="animate-spin" />} Lưu lịch hẹn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---- Modal: Hủy / Hoàn thành lịch hẹn ---- */}
      {apptAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-elevated">
            <div className="flex items-center justify-between px-6 pt-6 pb-2">
              <p className="text-sm font-semibold text-slate-900">{apptAction.mode === "cancel" ? "Hủy lịch hẹn" : "Hoàn thành lịch hẹn"}</p>
              <button onClick={() => setApptAction(null)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
            <form onSubmit={handleApptAction} className="px-6 pb-6 pt-2 space-y-3">
              {apptAction.mode === "cancel" ? (
                <div>
                  <label className="text-xs font-medium text-slate-600">Lý do hủy</label>
                  <textarea
                    value={apptActionForm.reason}
                    onChange={(e) => setApptActionForm((f) => ({ ...f, reason: e.target.value }))}
                    rows={3}
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    required
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-medium text-slate-600">Kết quả</label>
                    <select value={apptActionForm.result} onChange={(e) => setApptActionForm((f) => ({ ...f, result: e.target.value }))} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
                      {APPOINTMENT_RESULT_ENUM.map((r) => (
                        <option key={r} value={r}>{APPOINTMENT_RESULT_LABEL[r]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">Ghi chú</label>
                    <textarea
                      value={apptActionForm.note}
                      onChange={(e) => setApptActionForm((f) => ({ ...f, note: e.target.value }))}
                      rows={2}
                      className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </>
              )}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setApptAction(null)} className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">Đóng</button>
                <button type="submit" disabled={apptActionSaving} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60 flex items-center gap-2">
                  {apptActionSaving && <Loader2 size={14} className="animate-spin" />} Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---- Modal: Phân công lead (Module 5) ---- */}
      {assignOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-elevated">
            <div className="flex items-center justify-between px-6 pt-6 pb-2">
              <h3 className="font-semibold text-slate-900">Phân công lead</h3>
              <button onClick={() => setAssignOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAssign} className="px-6 pb-6 space-y-3">
              <p className="text-xs text-slate-500">
                Đang phụ trách: <span className="font-medium text-slate-700">{lead.assignee || "Chưa phân công"}</span>
              </p>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Phân công cho *</label>
                {assigneesLoading ? (
                  <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                    <Loader2 size={14} className="animate-spin" /> Đang tải danh sách Sales...
                  </div>
                ) : (
                  <select
                    value={assignForm.assignee}
                    onChange={(e) => setAssignForm({ ...assignForm, assignee: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="">Chọn nhân viên Sales</option>
                    {assignees.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Lý do chuyển (tùy chọn)</label>
                <input
                  value={assignForm.reason}
                  onChange={(e) => setAssignForm({ ...assignForm, reason: e.target.value })}
                  placeholder="VD: Cân bằng tải, Sales A đang nghỉ..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignOpen(false)}
                  className="flex-1 border border-slate-300 rounded-lg py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={assigning || !assignForm.assignee}
                  className="flex-1 bg-brand-600 hover:bg-brand-500 rounded-lg py-2 text-sm text-white disabled:opacity-60 inline-flex items-center justify-center gap-1.5"
                >
                  {assigning && <Loader2 size={14} className="animate-spin" />}
                  {assigning ? "Đang phân công..." : "Xác nhận phân công"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---- Modal: Thêm hoạt động chăm sóc (Module 4) ---- */}
      {activityOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-elevated">
            <div className="flex items-center justify-between px-6 pt-6 pb-2">
              <h3 className="font-semibold text-slate-900">Thêm hoạt động chăm sóc</h3>
              <button onClick={() => setActivityOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddActivity} className="px-6 pb-6 space-y-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Loại hoạt động *</label>
                <select
                  value={activityForm.type}
                  onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  {activityTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Nội dung *</label>
                <textarea
                  value={activityForm.content}
                  onChange={(e) => setActivityForm({ ...activityForm, content: e.target.value })}
                  rows={3}
                  placeholder="Ghi lại nội dung trao đổi..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Kết quả (tùy chọn)</label>
                <select
                  value={activityForm.result}
                  onChange={(e) => setActivityForm({ ...activityForm, result: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="">Không chọn</option>
                  {activityResults.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActivityOpen(false)}
                  className="flex-1 border border-slate-300 rounded-lg py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={addingActivity || !activityForm.content.trim()}
                  className="flex-1 bg-brand-600 hover:bg-brand-500 rounded-lg py-2 text-sm text-white disabled:opacity-60 inline-flex items-center justify-center gap-1.5"
                >
                  {addingActivity && <Loader2 size={14} className="animate-spin" />}
                  {addingActivity ? "Đang lưu..." : "Lưu hoạt động"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---- Modal: Đặt lịch follow-up ---- */}
      {followUpOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-elevated">
            <div className="flex items-center justify-between px-6 pt-6 pb-2">
              <h3 className="font-semibold text-slate-900">Đặt lịch follow-up</h3>
              <button onClick={() => setFollowUpOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveFollowUp} className="px-6 pb-6 space-y-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Thời gian cần liên hệ lại *</label>
                <input
                  type="datetime-local"
                  value={followUpForm.datetime}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, datetime: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Ghi chú (tùy chọn)</label>
                <input
                  value={followUpForm.note}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, note: e.target.value })}
                  placeholder="VD: Gọi lại hỏi về học phí..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFollowUpOpen(false)}
                  className="flex-1 border border-slate-300 rounded-lg py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingFollowUp || !followUpForm.datetime}
                  className="flex-1 bg-brand-600 hover:bg-brand-500 rounded-lg py-2 text-sm text-white disabled:opacity-60 inline-flex items-center justify-center gap-1.5"
                >
                  {savingFollowUp && <Loader2 size={14} className="animate-spin" />}
                  {savingFollowUp ? "Đang lưu..." : "Lưu lịch follow-up"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ---- Modal: Chỉnh sửa bảng điểm (checkbox theo tín hiệu — Mục 3.3) ---- */}
      {scoreFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-elevated max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 pt-6 pb-2 shrink-0">
              <h3 className="font-semibold text-slate-900">Chỉnh sửa bảng điểm</h3>
              <button onClick={() => setScoreFormOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveScore} className="px-6 pb-6 flex flex-col min-h-0 flex-1">
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 mb-4 shrink-0">
                <span className="text-xs text-slate-500">Tổng điểm dự kiến</span>
                <span className="text-xl font-semibold text-slate-900">{draftScore}đ</span>
              </div>

              <div className="overflow-y-auto pr-1 space-y-4">
                {scoringGroups.map((group) => (
                  <div key={group.id} className="border-t border-slate-100 pt-3 first:border-t-0 first:pt-0">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      {group.name} <span className="text-slate-400 font-normal normal-case">(tối đa {group.max}đ)</span>
                    </p>
                    {group.singleSelect ? (
                      <div className="space-y-1.5">
                        {group.options.map((opt) => (
                          <label key={opt.value} className="flex items-center justify-between gap-3 text-sm cursor-pointer">
                            <span className="flex items-center gap-2 text-slate-700">
                              <input
                                type="radio"
                                name="enrollmentIntent"
                                checked={draftSignals.enrollmentIntent === opt.value}
                                onChange={() => selectEnrollmentIntent(opt.value)}
                                className="accent-brand-600"
                              />
                              {opt.label}
                            </span>
                            <span className={opt.points < 0 ? "text-red-600 text-xs font-medium" : "text-emerald-600 text-xs font-medium"}>
                              {opt.points > 0 ? "+" : ""}{opt.points}
                            </span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {group.criteria.map((c) => (
                          <label key={c.id} className="flex items-center justify-between gap-3 text-sm cursor-pointer">
                            <span className="flex items-center gap-2 text-slate-700">
                              <input
                                type="checkbox"
                                checked={!!draftSignals[c.id]}
                                onChange={() => toggleSignal(c.id)}
                                className="accent-brand-600"
                              />
                              {c.label}
                            </span>
                            <span className="text-emerald-600 text-xs font-medium">+{c.points}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-2">
                    {deductionGroup.name}
                  </p>
                  <div className="space-y-1.5">
                    {deductionGroup.criteria.map((c) => (
                      <label key={c.id} className="flex items-center justify-between gap-3 text-sm cursor-pointer">
                        <span className="flex items-center gap-2 text-slate-700">
                          <input
                            type="checkbox"
                            checked={!!draftSignals[c.id]}
                            onChange={() => toggleSignal(c.id)}
                            className="accent-red-600"
                          />
                          {c.label}
                        </span>
                        <span className="text-red-600 text-xs font-medium">{c.points}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setScoreFormOpen(false)}
                  className="flex-1 border border-slate-300 rounded-lg py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingScore}
                  className="flex-1 bg-brand-600 hover:bg-brand-500 rounded-lg py-2 text-sm text-white disabled:opacity-60 inline-flex items-center justify-center gap-1.5"
                >
                  {savingScore && <Loader2 size={14} className="animate-spin" />}
                  {savingScore ? "Đang lưu..." : "Lưu bảng điểm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
