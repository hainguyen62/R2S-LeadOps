import { Phone, Mail, Facebook } from "lucide-react";
import { ZaloIcon, TikTokIcon } from "./SocialIcons.jsx";

// Chuẩn hóa số điện thoại VN về dạng chỉ số, dùng cho link Zalo/tel.
function digitsOnly(phone) {
  return (phone || "").replace(/\D/g, "");
}

/**
 * Dãy nút liên hệ nhanh cho một lead — bấm vào là mở kênh liên hệ tương ứng
 * ngay lập tức (gọi điện / Zalo / email / Facebook / TikTok), thay vì phải
 * copy số điện thoại hay email đi tra cứu thủ công.
 * Chỉ hiển thị nút cho kênh nào lead thực sự có dữ liệu.
 */
export default function ContactButtons({ lead, size = "sm", className = "" }) {
  if (!lead) return null;

  const phone = digitsOnly(lead.phone);
  const hasPhone = !!phone;
  const hasEmail = lead.email && lead.email !== "—";

  const btnBase =
    size === "sm"
      ? "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors"
      : "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors";
  const iconSize = size === "sm" ? 13 : 15;

  const buttons = [];

  if (hasPhone) {
    buttons.push(
      <a
        key="phone"
        href={`tel:${phone}`}
        title="Gọi điện ngay"
        className={`${btnBase} border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}
      >
        <Phone size={iconSize} strokeWidth={2} /> Gọi điện
      </a>
    );
    buttons.push(
      <a
        key="zalo"
        href={`https://zalo.me/${phone}`}
        target="_blank"
        rel="noopener noreferrer"
        title="Nhắn Zalo"
        className={`${btnBase} border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100`}
      >
        <ZaloIcon size={iconSize} /> Zalo
      </a>
    );
  }

  if (hasEmail) {
    buttons.push(
      <a
        key="email"
        href={`mailto:${lead.email}`}
        title="Gửi email"
        className={`${btnBase} border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100`}
      >
        <Mail size={iconSize} strokeWidth={2} /> Email
      </a>
    );
  }

  if (lead.facebook) {
    buttons.push(
      <a
        key="facebook"
        href={lead.facebook}
        target="_blank"
        rel="noopener noreferrer"
        title="Xem Facebook"
        className={`${btnBase} border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100`}
      >
        <Facebook size={iconSize} strokeWidth={2} /> Facebook
      </a>
    );
  }

  if (lead.tiktok) {
    buttons.push(
      <a
        key="tiktok"
        href={lead.tiktok}
        target="_blank"
        rel="noopener noreferrer"
        title="Xem TikTok"
        className={`${btnBase} border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200`}
      >
        <TikTokIcon size={iconSize} /> TikTok
      </a>
    );
  }

  if (buttons.length === 0) return null;

  return <div className={`flex flex-wrap gap-1.5 ${className}`}>{buttons}</div>;
}