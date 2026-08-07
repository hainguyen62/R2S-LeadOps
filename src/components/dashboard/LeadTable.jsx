import { useState } from "react";
import { Search, ListFilter, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import Pill from "../ui/Pill.jsx";
import Avatar from "../ui/Avatar.jsx";
import { statusStyle, classStyle } from "../../data/mockData.js";

export default function LeadTable({ leads = [], selectedId, onSelect }) {
  const [page, setPage] = useState(1);
  const pageSize = 4;

  const totalPages = Math.ceil(leads.length / pageSize);
  const pageRows = leads.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="bg-white border border-slate-300 rounded-card p-4 shadow-card transition-all duration-200 ease-out hover:shadow-elevated">
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <p className="text-sm font-semibold text-slate-800">Danh sách lead</p>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Tìm kiếm..."
              className="bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs w-40 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
          <button className="flex items-center gap-1.5 text-xs border border-slate-300 rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-100 transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30">
            <ListFilter size={14} /> Bộ lọc
          </button>
          <button className="flex items-center gap-1.5 text-xs bg-brand-600 rounded-lg px-3 py-1.5 text-white hover:bg-brand-500 shadow-sm hover:shadow-md transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40">
            <Plus size={14} /> Thêm lead
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] text-slate-600 border-b border-slate-200 bg-slate-100/50 font-semibold">
              <th className="py-3 pr-3">Họ tên</th>
              <th className="py-3 pr-3">Khóa học</th>
              <th className="py-3 pr-3">Nguồn</th>
              <th className="py-3 pr-3">Trạng thái</th>
              <th className="py-3 pr-3">Điểm</th>
              <th className="py-3 pr-3">Phân loại</th>
              <th className="py-3 pr-3">Ngày tạo</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((l) => (
              <tr
                key={l.id}
                onClick={() => onSelect(l.id)}
                className={`border-b border-slate-200/70 cursor-pointer hover:bg-brand-50/60 transition-colors duration-150 ${
                  selectedId === l.id ? "bg-blue-50/60" : ""
                }`}
              >
                <td className="py-3 pr-3">
                  <div className="flex items-center gap-2">
                    <Avatar name={l.name} initials={l.initials} size={26} />
                    <span className="whitespace-nowrap text-slate-800">{l.name}</span>
                  </div>
                </td>
                <td className="py-3 pr-3 text-slate-500 whitespace-nowrap">{l.course}</td>
                <td className="py-3 pr-3 text-slate-500 whitespace-nowrap">{l.source}</td>
                <td className="py-3 pr-3">
                  <Pill text={l.status} map={statusStyle} />
                </td>
                <td className="py-3 pr-3 font-medium text-slate-800">{l.score}</td>
                <td className="py-3 pr-3">
                  <Pill text={l.cls} map={classStyle} />
                </td>
                <td className="py-3 pr-3 text-slate-400 whitespace-nowrap text-xs">{l.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
        <span>
          Hiển thị {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, leads.length)} của{" "}
          {leads.length}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded-md border border-slate-300 hover:bg-slate-100 disabled:opacity-40 transition-all duration-200 ease-out"
            disabled={page === 1}
          >
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`w-7 h-7 rounded-md text-xs transition-all duration-200 ease-out ${
                page === i + 1
                  ? "bg-brand-600 text-white shadow-sm"
                  : "border border-slate-300 hover:bg-slate-100 text-slate-500"
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="p-1.5 rounded-md border border-slate-300 hover:bg-slate-100 disabled:opacity-40 transition-all duration-200 ease-out"
            disabled={page === totalPages}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
