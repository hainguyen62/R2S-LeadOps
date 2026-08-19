// Nhập dữ liệu từ file CSV (hỗ trợ cả header tiếng Anh & tiếng Việt)
import { formatVietnamDate } from "./datetime.js";
// Hàm parse CSV đơn giản, xử lý dấu ngoặc kép và dấu phẩy bên trong
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(field);
        field = "";
      } else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") {
          i++;
        }
        row.push(field);
        field = "";
        if (row.some((c) => c.trim() !== "")) {
          rows.push(row);
        }
        row = [];
      } else {
        field += ch;
      }
    }
  }
  // Xử lý dòng cuối
  if (field !== "" || row.length > 0) {
    row.push(field);
    if (row.some((c) => c.trim() !== "")) {
      rows.push(row);
    }
  }

  return rows;
}

// Ánh xạ tên cột (tiếng Anh & tiếng Việt) -> key field trong object lead
const columnMap = {
  name: "name",
  "họ tên": "name",
  "ho ten": "name",
  course: "course",
  "khóa học": "course",
  "khoa hoc": "course",
  source: "source",
  nguồn: "source",
  "nguồn gốc": "source",
  status: "status",
  "trạng thái": "status",
  "trang thai": "status",
  score: "score",
  điểm: "score",
  "điểm số": "score",
  cls: "cls",
  "phân loại": "cls",
  "phan loai": "cls",
  class: "cls",
  date: "date",
  "ngày tạo": "date",
  "ngay tao": "date",
  phone: "phone",
  "số điện thoại": "phone",
  "so dien thoai": "phone",
  "sđt": "phone",
  email: "email",
  "địa chỉ email": "email",
  assignee: "assignee",
  "người phụ trách": "assignee",
  "nguoi phu trach": "assignee",
  note: "note",
  "ghi chú": "note",
  "ghi chu": "note",
};

// Chuẩn hóa tên cột: bỏ dấu BOM, khoảng trắng thừa, chữ thường
function normalizeHeader(h) {
  return h.replace(/^\uFEFF/, "").trim().toLowerCase();
}

// Chuyển đổi một row (mảng giá trị) thành lead object
function rowToLead(headers, values) {
  const lead = {};

  headers.forEach((header, idx) => {
    const key = columnMap[normalizeHeader(header)];
    if (key) {
      lead[key] = (values[idx] || "").trim();
    }
  });

  // Bỏ qua dòng không có tên
  if (!lead.name) return null;

  // Tạo id duy nhất
  lead.id = Date.now() + Math.floor(Math.random() * 10000);

  // Giá trị mặc định
  lead.course = lead.course || "Chưa rõ";
  lead.source = lead.source || "Manual";
  lead.status = lead.status || "Lead mới";
  lead.date = lead.date || formatVietnamDate(new Date());
  lead.phone = lead.phone || "—";
  lead.email = lead.email || "—";
  lead.assignee = lead.assignee || "Tư vấn viên A";
  lead.note = lead.note || "";

  // Chuyển score sang số; mặc định 25
  lead.score =
    lead.score !== undefined && lead.score !== ""
      ? Number(lead.score) || 25
      : 25;

  // Phân loại dựa trên score nếu không có
  if (!lead.cls) {
    if (lead.score >= 70) lead.cls = "Lead nóng";
    else if (lead.score >= 40) lead.cls = "Lead ấm";
    else lead.cls = "Lead lạnh";
  }

  // Tạo initials
  lead.initials = lead.name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return lead;
}

// Nhập CSV -> mảng lead object hợp lệ
export function importLeadsFromCsv(text) {
  const rows = parseCsv(text);
  if (rows.length < 2) return [];

  const headers = rows[0];
  const leads = rows
    .slice(1)
    .map((values) => rowToLead(headers, values))
    .filter(Boolean);

  return leads;
}
