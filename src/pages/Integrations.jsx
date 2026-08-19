import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCcw, Copy, Check, Webhook, PlayCircle, ChevronRight, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { getWebhookConfig, regenerateWebhookToken, fetchWebhookEvents, receiveGoogleFormWebhook } from "../services/webhookService.js";
import { SkeletonBlock } from "../components/ui/Skeleton.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import ConfirmDialog from "../components/ui/ConfirmDialog.jsx";
import { useToast } from "../components/ui/ToastProvider.jsx";
import { courseOptions } from "../data/mockData.js";
import { formatVietnamDateTime } from "../utils/datetime.js";

// Endpoint "ảo" hiển thị cho người dùng dán vào Apps Script. Vì Back-end thật
// chưa có route /webhooks/google-form (xem ghi chú đầu webhookService.js),
// URL này chỉ mang tính minh họa — khi Back-end sẵn sàng cần thay đúng domain thật.
const WEBHOOK_URL = `${window.location.origin.replace(/:\d+$/, "")}/api/webhooks/google-form`;

const STATUS_META = {
  SUCCESS_CREATED: { label: "Tạo lead mới", className: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: CheckCircle2 },
  SUCCESS_MERGED: { label: "Gộp vào lead trùng", className: "bg-blue-50 text-blue-700 border-blue-200", Icon: CheckCircle2 },
  SKIPPED_DUPLICATE_EVENT: { label: "Bỏ qua (gửi trùng)", className: "bg-slate-100 text-slate-500 border-slate-200", Icon: Clock },
  FAILED: { label: "Lỗi", className: "bg-red-50 text-red-700 border-red-200", Icon: AlertCircle },
  PROCESSING: { label: "Đang xử lý", className: "bg-amber-50 text-amber-700 border-amber-200", Icon: Clock },
};

function appsScriptSnippet(secretToken) {
  return `function onFormSubmit(e) {
  var r = e.namedValues; // Google Form -> tên câu hỏi phải khớp key bên dưới
  var payload = {
    secretToken: "${secretToken}",
    formResponseId: e.response.getId(),
    fullName: r["Họ và tên"] ? r["Họ và tên"][0] : "",
    phone: r["Số điện thoại"] ? r["Số điện thoại"][0] : "",
    email: r["Email"] ? r["Email"][0] : "",
    course: r["Khóa học quan tâm"] ? r["Khóa học quan tâm"][0] : "",
    city: r["Thành phố"] ? r["Thành phố"][0] : "",
    campaign: r["Mã chiến dịch (UTM)"] ? r["Mã chiến dịch (UTM)"][0] : "",
  };
  UrlFetchApp.fetch("${WEBHOOK_URL}", {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });
}`;
}

function CopyButton({ text, label = "Sao chép" }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard có thể bị chặn quyền — im lặng bỏ qua, người dùng vẫn có thể bôi đen chọn thủ công */
        }
      }}
      className="flex items-center gap-1 text-[11px] font-medium text-brand-600 hover:text-brand-700"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "Đã sao chép" : label}
    </button>
  );
}

export default function Integrations() {
  const navigate = useNavigate();
  const toast = useToast();
  const [config, setConfig] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmRegen, setConfirmRegen] = useState(false);
  const [testing, setTesting] = useState(false);
  const [refreshTick, forceRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([Promise.resolve(getWebhookConfig()), fetchWebhookEvents({ limit: 30 })]).then(([cfg, evts]) => {
      if (cancelled) return;
      setConfig(cfg);
      setEvents(evts);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  const handleRegenerate = () => {
    const cfg = regenerateWebhookToken();
    setConfig(cfg);
    setConfirmRegen(false);
    toast.success("Đã cấp secret token mới. Nhớ cập nhật lại Apps Script với token mới này.");
  };

  // Giả lập 1 lượt Google Form gửi dữ liệu thật — để test toàn bộ luồng
  // (xác thực token, chống trùng, tạo lead, chấm điểm) mà không cần có Form thật.
  const handleSendTest = async () => {
    setTesting(true);
    try {
      const rand = Math.floor(Math.random() * 9000) + 1000;
      const result = await receiveGoogleFormWebhook({
        secretToken: config.secretToken,
        formResponseId: `test_${Date.now()}`,
        fullName: `Lead Test Form ${rand}`,
        phone: `09${String(rand).padStart(8, "0")}`,
        email: `leadtest${rand}@gmail.com`,
        course: courseOptions[Math.floor(Math.random() * courseOptions.length)],
        city: "Hà Nội",
      });
      toast.success(result.status === "ok" ? "Gửi thử thành công — đã tạo lead mới từ Google Form giả lập." : "Gửi thử thành công.");
      forceRefresh((n) => n + 1);
    } catch (err) {
      toast.error(err.message || "Gửi thử thất bại.");
      forceRefresh((n) => n + 1);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Nguồn tích hợp</h2>
        <p className="text-sm text-slate-500">
          Kết nối Google Form (hoặc bất kỳ nguồn ngoài nào gọi Webhook) để tự động tạo lead — khớp Mục XIII.2 tài liệu kế hoạch.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SkeletonBlock className="h-[260px] rounded-xl" />
          <SkeletonBlock className="h-[260px] rounded-xl" />
        </div>
      ) : (
        <>
          {/* ---- Cấu hình Webhook ---- */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
                  <Webhook size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Google Form</p>
                  <p className="text-xs text-slate-500">Webhook nhận dữ liệu tự động khi có người điền Form</p>
                </div>
              </div>
              <button
                onClick={handleSendTest}
                disabled={testing}
                className="flex items-center gap-1.5 text-xs bg-brand-600 hover:bg-brand-500 text-white rounded-lg px-3 py-2 disabled:opacity-60"
              >
                <PlayCircle size={14} /> {testing ? "Đang gửi..." : "Gửi thử (giả lập)"}
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-slate-500">Webhook URL</label>
                <CopyButton text={WEBHOOK_URL} />
              </div>
              <code className="block bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 break-all">{WEBHOOK_URL}</code>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-slate-500">Secret Token (dán vào Apps Script để xác thực)</label>
                <CopyButton text={config.secretToken} />
              </div>
              <code className="block bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 break-all">{config.secretToken}</code>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-slate-500">Apps Script mẫu — dán vào Google Sheet gắn với Form (Tiện ích &gt; Apps Script), gắn trigger "Khi gửi biểu mẫu"</label>
                <CopyButton text={appsScriptSnippet(config.secretToken)} />
              </div>
              <pre className="bg-slate-900 text-slate-100 rounded-lg px-3 py-3 text-[11px] leading-relaxed overflow-x-auto">
                <code>{appsScriptSnippet(config.secretToken)}</code>
              </pre>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Đổi tên câu hỏi trong <code className="bg-slate-100 px-1 rounded">r["..."]</code> cho khớp đúng câu hỏi trong Form của bạn.
              </p>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <p className="text-[11px] text-slate-400">Lộ token cho người ngoài? Cấp lại token mới để vô hiệu hóa token cũ.</p>
              <button
                onClick={() => setConfirmRegen(true)}
                className="flex items-center gap-1 text-[11px] font-medium text-red-600 hover:text-red-700"
              >
                <RefreshCcw size={12} /> Cấp lại token
              </button>
            </div>
          </div>

          {/* ---- Log webhook_events ---- */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-card">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-medium text-slate-900">Nhật ký webhook gần đây</p>
              <p className="text-xs text-slate-500">Đối chiếu khi Form có dữ liệu nhưng không thấy lead xuất hiện.</p>
            </div>
            {events.length === 0 ? (
              <EmptyState
                icon={Webhook}
                title="Chưa có lượt gọi webhook nào"
                description='Bấm "Gửi thử (giả lập)" ở trên để kiểm tra toàn bộ luồng, hoặc điền thử Google Form thật đã gắn Apps Script.'
                compact
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {events.map((e) => {
                  const meta = STATUS_META[e.processingStatus] || STATUS_META.FAILED;
                  const Icon = meta.Icon;
                  return (
                    <button
                      key={e.id}
                      onClick={() => e.leadId && navigate(`/leads/${e.leadId}`)}
                      disabled={!e.leadId}
                      className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-slate-50 disabled:hover:bg-transparent disabled:cursor-default"
                    >
                      <span className={`shrink-0 flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md border ${meta.className}`}>
                        <Icon size={11} /> {meta.label}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-800 truncate">
                          {e.payload?.fullName || "(không có tên)"} {e.payload?.phone ? `· ${e.payload.phone}` : ""}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {formatVietnamDateTime(e.receivedAt)}
                          {e.errorMessage ? ` · ${e.errorMessage}` : ""}
                        </p>
                      </div>
                      {e.leadId && <ChevronRight size={14} className="text-slate-300 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmRegen}
        title="Cấp lại secret token"
        message="Token cũ sẽ ngừng hoạt động ngay lập tức. Apps Script đang dùng token cũ sẽ gửi lỗi 401 cho tới khi bạn cập nhật token mới vào Script."
        confirmLabel="Cấp lại token"
        danger={false}
        onCancel={() => setConfirmRegen(false)}
        onConfirm={handleRegenerate}
      />
    </div>
  );
}
