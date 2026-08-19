import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Bell, Flame, Clock, Info, UserPlus, CheckCheck, BellOff } from "lucide-react";
import { notifications as initialNotifications } from "../../data/mockData.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { isSales, can } from "../../utils/permissions.js";
import { fetchLeads, fetchMyLeads } from "../../services/leadService.js";
import { USE_MOCK } from "../../services/apiClient.js";
import { fetchNotifications, fetchUnreadCount, markNotificationRead, markAllNotificationsRead } from "../../services/notificationService.js";
import EmptyState from "../ui/EmptyState.jsx";
import { formatVietnamDateTime, getVietnamDateKey } from "../../utils/datetime.js";

const typeConfig = {
  "hot-lead": { icon: Flame, tint: "bg-orange-50 text-orange-600" },
  followup: { icon: Clock, tint: "bg-red-50 text-red-600" },
  assign: { icon: UserPlus, tint: "bg-blue-50 text-blue-600" },
  system: { icon: Info, tint: "bg-slate-100 text-slate-500" },
};

// Trạng thái cuối trong phễu = lead đã "hoàn thành" hành trình chăm sóc,
// không cần nhắc follow-up nữa dù còn sót nextFollowUpAt cũ (Mục leadStatusOrder).
const COMPLETED_STATUS = "Đã đăng ký";

const todayKey = () => getVietnamDateKey();
const storageKeyFor = (user) => `r2s_notifications_${user?.name || "guest"}`;

// Sinh thông báo follow-up từ danh sách lead quá hạn/đến hạn — bỏ qua lead
// đã hoàn thành (đăng ký) dù còn sót lịch follow-up cũ.
function buildFollowUpNotifications(leads) {
  const now = Date.now();
  return leads
    .filter((l) => l.status !== COMPLETED_STATUS && l.nextFollowUpAt)
    .map((l) => {
      const due = new Date(l.nextFollowUpAt);
      const isOverdue = due.getTime() <= now;
      const hours = Math.max(0, Math.round(Math.abs(now - due.getTime()) / 3600000));
      return {
        id: `followup-${l.id}`,
        type: "followup",
        title: `Follow-up ${isOverdue ? "quá hạn" : "đến hạn"}: ${l.name}`,
        desc: isOverdue
          ? `Lịch hẹn gọi lại đã quá hạn ${hours} giờ.`
          : `Đến hạn liên hệ lại trong ${hours} giờ nữa.`,
        time: formatVietnamDateTime(due),
        read: false,
        leadId: l.id,
      };
    });
}

export default function NotificationBell() {
  const user = useAuth();
  const [open, setOpen] = useState(false);
  // Khởi tạo tạm bằng mock tĩnh (loại followup) — sẽ được thay bằng dữ liệu
  // thật/khôi phục từ localStorage ngay khi effect bên dưới chạy.
  const [items, setItems] = useState(() => initialNotifications.filter((n) => n.type !== "followup"));
  const [coords, setCoords] = useState({ top: 0, right: 0 });
  // Số chưa đọc lấy riêng từ GET /notifications/unread-count (tính trên TOÀN BỘ
  // notification phía server, không chỉ trang đã tải) — chỉ áp dụng khi có API thật.
  const [serverUnreadCount, setServerUnreadCount] = useState(null);
  const btnRef = useRef(null);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || USE_MOCK) return;
    fetchUnreadCount()
      .then(setServerUnreadCount)
      .catch(() => setServerUnreadCount(null));
  }, [user]);

  // ---- Sinh thông báo follow-up theo vai trò, tối đa 1 lần/ngày (Mục chuông thông báo) ----
  // - Sales: chỉ follow-up của lead do chính mình phụ trách.
  // - Admin / Leader Marketing (viewAllCareHistory): follow-up của toàn bộ lead.
  // - Marketing Staff: không tham gia chăm sóc trực tiếp nên không nhận thông báo follow-up.
  // Kết quả được cache theo ngày trong localStorage để mở lại app cùng ngày
  // không bị sinh trùng / gửi lại, nhưng vẫn giữ trạng thái đã đọc.
  useEffect(() => {
    if (!user) return;
    const key = storageKeyFor(user);
    const today = todayKey();
    let cached = null;
    try {
      cached = JSON.parse(localStorage.getItem(key) || "null");
    } catch {
      cached = null;
    }

    if (cached && cached.date === today) {
      setItems(cached.items);
      return;
    }

    const canSeeFollowUps = isSales(user) || can(user, "viewAllCareHistory");

    let cancelled = false;
    const staticItemsPromise = USE_MOCK
      ? Promise.resolve(initialNotifications.filter((n) => n.type !== "followup"))
      : fetchNotifications({ pageSize: 30 }).catch(() => []);

    staticItemsPromise.then((staticItems) => {
      if (cancelled) return;
      if (!canSeeFollowUps) {
        setItems(staticItems);
        localStorage.setItem(key, JSON.stringify({ date: today, items: staticItems }));
        return;
      }
      const fetchFn = isSales(user) ? fetchMyLeads : fetchLeads;
      fetchFn({ overdueOnly: true, pageSize: 200 }, user.name)
        .then(({ items: leads }) => {
          if (cancelled) return;
          const followUps = buildFollowUpNotifications(leads);
          const merged = [...followUps, ...staticItems];
          setItems(merged);
          localStorage.setItem(key, JSON.stringify({ date: today, items: merged }));
        })
        .catch(() => {
          if (!cancelled) setItems(staticItems);
        });
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Ghi lại mỗi khi items đổi (đọc/đánh dấu đã đọc) để giữ trạng thái nếu
  // reload trang trong cùng ngày.
  useEffect(() => {
    if (!user) return;
    const key = storageKeyFor(user);
    let cached = null;
    try {
      cached = JSON.parse(localStorage.getItem(key) || "null");
    } catch {
      cached = null;
    }
    const date = cached?.date === todayKey() ? cached.date : todayKey();
    localStorage.setItem(key, JSON.stringify({ date, items }));
  }, [items, user]);

  const followUpUnread = items.filter((n) => n.type === "followup" && !n.read).length;
  const unreadCount = !USE_MOCK && serverUnreadCount !== null ? serverUnreadCount + followUpUnread : items.filter((n) => !n.read).length;

  // Tính vị trí panel dựa theo nút chuông, để panel render qua Portal
  // (gắn thẳng vào <body>) không bị bất kỳ vùng nội dung nào (biểu đồ,
  // card có transform...) đè lên trên do khác ngữ cảnh xếp lớp (stacking context).
  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;

    const updateCoords = () => {
      const rect = btnRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    };

    updateCoords();

    // Topbar chứa nút chuông đã "sticky top-0", nên vị trí chuông trên màn
    // hình không đổi khi cuộn trang — nhưng vẫn lắng nghe scroll/resize để
    // panel luôn bám đúng nút chuông trong mọi trường hợp (đổi kích thước
    // cửa sổ, thanh địa chỉ trình duyệt mobile ẩn/hiện làm đổi viewport...).
    // Dùng { passive: true } vì chỉ đọc vị trí, không chặn cuộn trang.
    window.addEventListener("scroll", updateCoords, { passive: true, capture: true });
    window.addEventListener("resize", updateCoords);
    return () => {
      window.removeEventListener("scroll", updateCoords, { capture: true });
      window.removeEventListener("resize", updateCoords);
    };
  }, [open]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target) &&
        panelRef.current && !panelRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const markAllRead = () => {
    setItems((list) => list.map((n) => ({ ...n, read: true })));
    if (!USE_MOCK) {
      markAllNotificationsRead().catch(() => {});
      setServerUnreadCount(0);
    }
  };

  const handleClickItem = (n) => {
    const wasUnread = !n.read;
    setItems((list) => list.map((i) => (i.id === n.id ? { ...i, read: true } : i)));
    if (!USE_MOCK && typeof n.id === "number") {
      markNotificationRead(n.id).catch(() => {});
      if (wasUnread) setServerUnreadCount((c) => (c === null ? c : Math.max(0, c - 1)));
    }
    setOpen(false);
    if (n.leadId) {
      navigate(`/leads/${n.leadId}`);
    }
  };

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        className="relative text-slate-500 hover:text-slate-800"
        title="Thông báo"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            style={{ position: "fixed", top: coords.top, right: coords.right }}
            className="w-80 max-w-[90vw] bg-white border border-slate-200 rounded-xl shadow-elevated z-[9999] overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-900">Thông báo</p>
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-[11px] text-brand-600 hover:text-brand-700"
              >
                <CheckCheck size={13} /> Đánh dấu đã đọc tất cả
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
              {items.length === 0 && (
                <EmptyState icon={BellOff} title="Chưa có thông báo nào" compact />
              )}
              {items.map((n) => {
                const cfg = typeConfig[n.type] || typeConfig.system;
                const Icon = cfg.icon;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleClickItem(n)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors ${
                      !n.read ? "bg-blue-50/60" : ""
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.tint}`}>
                      <Icon size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-800 flex items-center gap-1.5">
                        {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
                        <span className="truncate">{n.title}</span>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{n.desc}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{n.time}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
