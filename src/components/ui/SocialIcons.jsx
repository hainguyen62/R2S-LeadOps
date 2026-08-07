// Lucide-react không có sẵn icon Zalo/TikTok — định nghĩa SVG tối giản,
// cùng phong cách stroke/fill với bộ icon lucide đang dùng trong app.

export function ZaloIcon({ size = 16, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <rect x="2" y="2" width="20" height="20" rx="5" fill="currentColor" />
      <text
        x="12"
        y="15.5"
        textAnchor="middle"
        fontSize="9"
        fontWeight="700"
        fill="white"
        fontFamily="Arial, sans-serif"
      >
        Zalo
      </text>
    </svg>
  );
}

export function TikTokIcon({ size = 16, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M16.5 2h-3.1v13.6a2.9 2.9 0 1 1-2.05-2.77v-3.2a6.1 6.1 0 1 0 5.15 6.03V8.9a7.6 7.6 0 0 0 4.5 1.46V7.24a4.4 4.4 0 0 1-4.5-4.4V2Z" />
    </svg>
  );
}