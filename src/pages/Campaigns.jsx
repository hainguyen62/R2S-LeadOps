import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, GitBranch, X, ChevronRight } from "lucide-react";
import { campaigns } from "../data/mockData.js";

// "2026-05-01" -> "01/05"
const formatShortDate = (iso) => {
  if (!iso || iso === "—") return "—";
  const parts = iso.split("-");
  if (parts.length !== 3) return iso.slice(0, 5);
  const [y, m, d] = parts;
  return `${d}/${m}`;
};

export default function Campaigns() {
  const navigate = useNavigate();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", source: "", budget: "", start: "", end: "" });

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.name) return;
    campaigns.push({
      id: Date.now(),
      name: form.name,
      source: form.source || "Manual",
      course: "",
      leads: 0,
      hotLeads: 0,
      deposits: 0,
      registrations: 0,
      status: "Đang chạy",
      budget: form.budget || "0",
      start: form.start || "—",
      end: form.end || "—",
      utmSource: "",
      utmMedium: "",
      utmCampaign: "",
      utmContent: "",
      utmTerm: "",
    });
    setShowAdd(false);
    setForm({ name: "", source: "", budget: "", start: "", end: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Chiến dịch & Nguồn lead</h2>
          <p className="text-sm text-slate-500">Quản lý nguồn lead và chiến dịch Marketing</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 text-xs bg-brand-600 rounded-card px-3 py-2 text-white hover:bg-brand-500 shadow-sm hover:shadow-md transition-all duration-200 ease-out"
        >
          <Plus size={14} /> Tạo chiến dịch
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {campaigns.map((c) => (
          <button
            key={c.id}
            onClick={() => navigate(`/campaigns/${c.id}`)}
            className="text-left bg-white border border-slate-300 rounded-card p-5 shadow-card hover:border-brand-300 hover:shadow-elevated transition-all duration-200 ease-out group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                <GitBranch size={20} />
              </div>
              <span
                className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${
                  c.status === "Đang chạy"
                    ? "bg-emerald-50 text-emerald-800"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {c.status}
              </span>
            </div>
            <h3 className="font-medium text-sm mb-1 text-slate-900 flex items-center gap-1">
              {c.name}
              <ChevronRight size={14} className="text-slate-300 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all" />
            </h3>
            <p className="text-xs text-slate-500 mb-4">Nguồn: {c.source}</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-50 rounded-lg py-2">
                <p className="text-lg font-semibold text-slate-900">{c.leads}</p>
                <p className="text-[10px] text-slate-500">Leads</p>
              </div>
              <div className="bg-slate-50 rounded-lg py-2">
                <p className="text-lg font-semibold text-slate-900">{c.budget}</p>
                <p className="text-[10px] text-slate-500">Ngân sách</p>
              </div>
              <div className="bg-slate-50 rounded-lg py-2">
                <p className="text-sm font-semibold text-slate-900">{formatShortDate(c.start)}</p>
                <p className="text-[10px] text-slate-500">Bắt đầu</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-card w-full max-w-md p-6 shadow-modal">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Tạo chiến dịch mới</h3>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Tên chiến dịch *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Tuyển sinh khóa..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-input px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200 ease-out"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Nguồn</label>
                <select
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200 ease-out"
                >
                  <option value="">Chọn nguồn</option>
                  <option>Facebook Ads</option>
                  <option>Google Ads</option>
                  <option>TikTok Ads</option>
                  <option>Landing Page</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Ngân sách (VNĐ)</label>
                  <input
                    value={form.budget}
                    onChange={(e) => setForm({ ...form, budget: e.target.value })}
                    placeholder="10.000.000"
                    className="w-full bg-slate-50 border border-slate-300 rounded-input px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200 ease-out"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Ngày bắt đầu</label>
                  <input
                    type="date"
                    value={form.start}
                    onChange={(e) => setForm({ ...form, start: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200 ease-out"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="flex-1 border border-slate-300 rounded-card py-2 text-sm text-slate-600 hover:bg-slate-100 shadow-sm hover:shadow-md transition-all duration-200 ease-out"
                >
                  Hủy
                </button>
                <button type="submit" className="flex-1 bg-brand-600 hover:bg-brand-500 rounded-card py-2 text-sm text-white shadow-sm hover:shadow-md transition-all duration-200 ease-out">
                  Tạo chiến dịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

