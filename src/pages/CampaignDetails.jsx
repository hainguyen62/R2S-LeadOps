import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  GitBranch,
  Users,
  Flame,
  Wallet,
  GraduationCap,
  TrendingUp,
  Check,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { fetchCampaignById, fetchCampaignTrend, updateCampaign } from "../services/campaignService.js";
import { fetchLeads } from "../services/leadService.js";
import { SkeletonBlock } from "../components/ui/Skeleton.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Pill from "../components/ui/Pill.jsx";
import { statusStyle } from "../data/mockData.js";
import LeadListModal from "../components/dashboard/LeadListModal.jsx";

const tooltipStyle = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  fontSize: 12,
  color: "#111827",
  boxShadow: "0 8px 24px rgba(15,23,42,0.14)",
  padding: "8px 12px",
};

// Các lựa chọn khoảng thời gian cho biểu đồ xu hướng (Mục 6.4).
// value: null = "Toàn bộ" (không lọc); số = số ngày tính lùi từ điểm dữ liệu gần nhất.
const TREND_RANGES = [
  { value: 7, label: "7 ngày gần nhất" },
  { value: 30, label: "30 ngày gần nhất" },
  { value: 90, label: "90 ngày gần nhất" },
  { value: null, label: "Toàn bộ" },
];

/**
 * Dữ liệu mock chỉ có "day" dạng "dd/mm" (không có năm), nên không thể so
 * với ngày hệ thống thực tế một cách đáng tin cậy. Để lọc theo khoảng thời
 * gian vẫn hoạt động đúng dù mock là dữ liệu quá khứ/tương lai so với hôm
 * nay, ta quy ước mốc "hiện tại" = điểm dữ liệu gần nhất trong chính chuỗi
 * xu hướng, rồi lọc lùi N ngày từ đó. Khi có Back-end thật trả về ngày đầy
 * đủ (yyyy-mm-dd), có thể thay hàm này bằng so sánh Date thật.
 */
function parseTrendDay(day) {
  const [d, m] = day.split("/").map(Number);
  if (!d || !m) return null;
  // Năm cố định giả lập chỉ để tính khoảng cách ngày tương đối giữa các điểm.
  return new Date(2000, m - 1, d);
}

function filterTrendByRange(trend, rangeDays) {
  if (!rangeDays || trend.length === 0) return trend;
  const parsed = trend
    .map((point) => ({ ...point, _date: parseTrendDay(point.day) }))
    .filter((point) => point._date);
  if (parsed.length === 0) return trend;
  const latest = parsed.reduce((max, p) => (p._date > max ? p._date : max), parsed[0]._date);
  const cutoff = new Date(latest);
  cutoff.setDate(cutoff.getDate() - rangeDays);
  return parsed.filter((p) => p._date >= cutoff).map(({ _date, ...rest }) => rest);
}

// "12/05/2026 09:15" -> "12/05" — để so khớp với nhãn ngày trên biểu đồ xu hướng.
function toShortDay(dateStr) {
  const datePart = String(dateStr || "").split(" ")[0];
  const [d, m] = datePart.split("/");
  if (!d || !m) return null;
  return `${d}/${m}`;
}

export default function CampaignDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [trendRange, setTrendRange] = useState(30); // mặc định 30 ngày gần nhất (Mục 6.4)
  // ---- Drill-down từ biểu đồ xu hướng: click 1 ngày -> xem lead phát sinh ngày đó ----
  const [campaignLeads, setCampaignLeads] = useState([]);
  const [drillDay, setDrillDay] = useState(null); // "dd/mm" đang được xem chi tiết, null = đóng modal
  // KPI đang được xem chi tiết dạng danh sách lead (click vào 1 trong 4 thẻ
  // Số lead / Lead nóng / Đã đặt cọc / Đã đăng ký) — giống hành vi Dashboard.
  const [kpiDrill, setKpiDrill] = useState(null); // { title, filters }

  // GET /api/campaigns/{id} + xu hướng lead — xem services/campaignService.js
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([fetchCampaignById(id), fetchCampaignTrend(id)])
      .then(([c, t]) => {
        if (cancelled) return;
        setCampaign(c);
        setTrend(t);
        setForm({
          name: c.name,
          course: c.course || "",
          source: c.source || "",
          status: c.status || "Đang chạy",
          budget: c.budget || "",
          start: c.start || "",
          end: c.end || "",
          utmSource: c.utmSource || "",
          utmMedium: c.utmMedium || "",
          utmCampaign: c.utmCampaign || "",
          utmContent: c.utmContent || "",
          utmTerm: c.utmTerm || "",
        });
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Không thể tải chiến dịch.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Nạp toàn bộ lead thuộc chiến dịch này (để phục vụ drill-down theo ngày
  // khi click vào biểu đồ xu hướng) — chỉ cần nạp lại khi tên chiến dịch đổi.
  useEffect(() => {
    if (!campaign?.name) return;
    let cancelled = false;
    fetchLeads({ campaign: campaign.name, pageSize: 500 })
      .then(({ items }) => {
        if (!cancelled) setCampaignLeads(items);
      })
      .catch(() => {
        if (!cancelled) setCampaignLeads([]);
      });
    return () => {
      cancelled = true;
    };
  }, [campaign?.name]);

  // Danh sách lead của chiến dịch phát sinh đúng ngày đang drill-down (so
  // khớp phần "dd/mm" trong lead.date với nhãn ngày trên biểu đồ).
  const drillDayLeads = useMemo(() => {
    if (!drillDay) return [];
    return campaignLeads.filter((l) => toShortDay(l.date) === drillDay);
  }, [drillDay, campaignLeads]);

  const conversionRate = useMemo(() => {
    if (!campaign || !campaign.leads) return "0%";
    return `${Math.round((campaign.registrations / campaign.leads) * 100)}%`;
  }, [campaign]);

  const filteredTrend = useMemo(() => filterTrendByRange(trend, trendRange), [trend, trendRange]);

  if (loading) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate("/campaigns")}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft size={16} /> Quay lại danh sách chiến dịch
        </button>
        <SkeletonBlock className="h-[400px] rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate("/campaigns")}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft size={16} /> Quay lại danh sách chiến dịch
        </button>
        <EmptyState icon={AlertCircle} title="Không thể tải chiến dịch" description={error} compact />
      </div>
    );
  }

  if (!campaign || !form) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate("/campaigns")}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft size={16} /> Quay lại danh sách chiến dịch
        </button>
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-500 shadow-card">
          Không tìm thấy chiến dịch này.
        </div>
      </div>
    );
  }

  // PUT /api/campaigns/{id} — xem services/campaignService.js
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateCampaign(campaign.id, form);
      setCampaign(updated);
      setSavedMsg("Đã lưu thay đổi chiến dịch.");
      setTimeout(() => setSavedMsg(""), 2500);
    } catch (err) {
      setSavedMsg("");
    } finally {
      setSaving(false);
    }
  };

  const statCards = [
    { key: "leads", label: "Số lead", value: campaign.leads, icon: Users, tint: "bg-blue-50 text-blue-600", filters: { campaign: campaign.name } },
    { key: "hot", label: "Lead nóng", value: campaign.hotLeads, icon: Flame, tint: "bg-orange-50 text-orange-600", filters: { campaign: campaign.name, cls: "Lead nóng" } },
    { key: "deposits", label: "Đã đặt cọc", value: campaign.deposits, icon: Wallet, tint: "bg-violet-50 text-violet-600", filters: { campaign: campaign.name, status: "Đã đặt cọc" } },
    { key: "registrations", label: "Đã đăng ký", value: campaign.registrations, icon: GraduationCap, tint: "bg-emerald-50 text-emerald-600", filters: { campaign: campaign.name, status: "Đã đăng ký" } },
  ];

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/campaigns")}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft size={16} /> Quay lại danh sách chiến dịch
      </button>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <GitBranch size={22} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{campaign.name}</h2>
            <p className="text-sm text-slate-500">Nguồn: {campaign.source}</p>
          </div>
        </div>
        <span
          className={`text-xs px-3 py-1.5 rounded-full font-medium ${
            campaign.status === "Đang chạy" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
          }`}
        >
          {campaign.status}
        </span>
      </div>

      {savedMsg && (
        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5">
          <Check size={15} /> {savedMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ---- Cột trái: Form thông tin chiến dịch + UTM ---- */}
        <form onSubmit={handleSave} className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-card space-y-3 h-fit">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Thông tin chiến dịch</p>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Tên chiến dịch</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Khóa học</label>
              <input
                value={form.course}
                onChange={(e) => setForm({ ...form, course: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Nguồn</label>
              <input
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Ngày bắt đầu</label>
              <input
                type="date"
                value={form.start}
                onChange={(e) => setForm({ ...form, start: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Ngày kết thúc</label>
              <input
                type="date"
                value={form.end}
                onChange={(e) => setForm({ ...form, end: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Ngân sách (VNĐ)</label>
              <input
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Trạng thái</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option>Đang chạy</option>
                <option>Tạm dừng</option>
                <option>Kết thúc</option>
              </select>
            </div>
          </div>

          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide pt-2">Thông số UTM</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">UTM Source</label>
              <input
                value={form.utmSource}
                onChange={(e) => setForm({ ...form, utmSource: e.target.value })}
                placeholder="facebook"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">UTM Medium</label>
              <input
                value={form.utmMedium}
                onChange={(e) => setForm({ ...form, utmMedium: e.target.value })}
                placeholder="cpc"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">UTM Campaign</label>
            <input
              value={form.utmCampaign}
              onChange={(e) => setForm({ ...form, utmCampaign: e.target.value })}
              placeholder="java-backend-t5"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">UTM Content</label>
              <input
                value={form.utmContent}
                onChange={(e) => setForm({ ...form, utmContent: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">UTM Term</label>
              <input
                value={form.utmTerm}
                onChange={(e) => setForm({ ...form, utmTerm: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <button type="submit" disabled={saving} className="w-full bg-brand-600 hover:bg-brand-500 rounded-lg py-2 text-sm text-white disabled:opacity-60 inline-flex items-center justify-center gap-1.5">
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>

        {/* ---- Cột phải: Số liệu hiệu quả + biểu đồ xu hướng ---- */}
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {statCards.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setKpiDrill({ title: `${s.label} · ${campaign.name}`, filters: s.filters })}
                  className="text-left bg-white border border-slate-200 rounded-xl p-4 shadow-card hover:border-brand-300 hover:shadow-elevated transition-all"
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${s.tint}`}>
                    <Icon size={16} />
                  </div>
                  <p className="text-xl font-semibold text-slate-900">{s.value}</p>
                  <p className="text-[11px] text-slate-500">{s.label}</p>
                </button>
              );
            })}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={14} className="text-brand-600" />
              <p className="text-sm font-medium text-slate-800">Tỷ lệ chuyển đổi (Đăng ký / Lead)</p>
            </div>
            <p className="text-3xl font-semibold text-brand-600">{conversionRate}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-slate-900">Xu hướng lead theo thời gian</p>
              <select
                value={trendRange ?? "all"}
                onChange={(e) => setTrendRange(e.target.value === "all" ? null : Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                {TREND_RANGES.map((r) => (
                  <option key={r.label} value={r.value ?? "all"}>{r.label}</option>
                ))}
              </select>
            </div>
            {filteredTrend.length > 0 && (
              <p className="text-[11px] text-slate-400 mb-3">Nhấn vào một điểm trên biểu đồ để xem lead phát sinh ngày đó.</p>
            )}
            {filteredTrend.length === 0 ? (
              <div className="h-[240px] flex items-center justify-center text-sm text-slate-400">
                Không có dữ liệu trong khoảng thời gian này.
              </div>
            ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart
                data={filteredTrend}
                margin={{ left: -20, right: 10, top: 10 }}
                onClick={(state) => {
                  if (state && state.activeLabel) setDrillDay(state.activeLabel);
                }}
                className="cursor-pointer"
              >
                <defs>
                  <linearGradient id="campaignTrendArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area
                  type="linear"
                  dataKey="value"
                  stroke="#2563EB"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="url(#campaignTrendArea)"
                  dot={{ r: 3, fill: "#2563EB", stroke: "#fff", strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: "#2563eb", stroke: "#fff", strokeWidth: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ---- Modal drill-down: danh sách lead phát sinh trong 1 ngày cụ thể ---- */}
      {drillDay && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-elevated max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 pt-6 pb-3 shrink-0">
              <div>
                <h3 className="font-semibold text-slate-900">Lead ngày {drillDay}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{campaign.name}</p>
              </div>
              <button onClick={() => setDrillDay(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto px-6 pb-6 space-y-2">
              {drillDayLeads.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">
                  Không tìm thấy lead nào của chiến dịch này trong ngày {drillDay}.
                </div>
              ) : (
                drillDayLeads.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => navigate(`/leads/${l.id}`)}
                    className="w-full flex items-center justify-between gap-3 text-left border border-slate-100 hover:border-brand-300 hover:bg-slate-50 rounded-lg px-3 py-2.5 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{l.name}</p>
                      <p className="text-xs text-slate-500 truncate">{l.course} · {l.date}</p>
                    </div>
                    <Pill text={l.status} map={statusStyle} />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      {/* ---- Modal drill-down KPI: click 1 thẻ số liệu -> xem danh sách lead tương ứng ---- */}
      {kpiDrill && (
        <LeadListModal title={kpiDrill.title} filters={kpiDrill.filters} onClose={() => setKpiDrill(null)} />
      )}
    </div>
  );
}