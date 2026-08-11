import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

// Bỏ dấu tiếng Việt để so khớp không phân biệt dấu khi gõ tìm kiếm
function stripAccents(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

/**
 * Dropdown lọc theo từ khóa gõ trực tiếp (searchable / typeahead select).
 *
 * props:
 * - label: nhãn hiển thị trên nút khi chưa chọn (vd. "Khóa học")
 * - options: mảng string các lựa chọn
 * - value: giá trị đang chọn (string | null)
 * - onChange: (value | null) => void — null nghĩa là "Tất cả"
 */
export default function SearchableSelect({ label, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const filtered = query.trim()
    ? options.filter((o) => stripAccents(o).includes(stripAccents(query.trim())))
    : options;

  function selectOption(opt) {
    onChange(opt);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 text-xs border rounded-lg px-2.5 py-1.5 bg-white cursor-pointer transition-colors ${
          value
            ? "border-blue-200 text-blue-700 bg-blue-50/60"
            : "border-gray-200 text-gray-600 hover:border-gray-300"
        } focus:outline-none focus:ring-1 focus:ring-blue-500`}
      >
        <span className="whitespace-nowrap max-w-[110px] truncate">
          {value || label}
        </span>
        <ChevronDown size={13} className="text-gray-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
          <div className="flex items-center gap-1.5 px-2.5 py-2 border-b border-gray-100">
            <Search size={13} className="text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Gõ để tìm ${label.toLowerCase()}...`}
              className="w-full text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none"
            />
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
            <button
              type="button"
              onClick={() => selectOption(null)}
              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 ${
                !value ? "text-blue-600 font-medium" : "text-gray-600"
              }`}
            >
              Tất cả
            </button>
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-xs text-gray-400">Không tìm thấy kết quả</p>
            )}
            {filtered.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => selectOption(opt)}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 truncate ${
                  value === opt ? "text-blue-600 font-medium bg-blue-50/60" : "text-gray-600"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}