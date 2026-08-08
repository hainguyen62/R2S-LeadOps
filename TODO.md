# TODO — Nâng cấp giao diện R2S LeadOps (UI/UX Polish)

## Chiến lược chung
Giữ nguyên màu `#2563EB`, font (Plus Jakarta Sans), bố cục, UX. Chỉ tinh chỉnh
shadow, border, typography weight/contrast, hover/focus/transition.

## Kế hoạch chi tiết

### 1. Design tokens — `tailwind.config.js`
- [x] Mạnh hơn `card` shadow.
- [x] Mạnh hơn `elevated` shadow.
- [x] Thêm `modal` shadow.
- [x] Thêm `borderRadius` costants: input 10px, button 10px, card 12px, modal 16px.

### 2. Card (`StatCard`, `ChartCard`, pages, `.funnel-card`)
- [x] Border đậm hơn 1 cấp (`slate-200 → slate-300`).
- [x] Shadow dùng token mới + `hover:shadow-elevated transition-all duration-200 ease-out`.
- [x] Tiêu đề card `font-semibold → font-bold`.
- [x] Cập nhật `.funnel-card` trong `index.css`.

### 3. Typography (tiêu đề trang/description)
- [x] `h2` `font-semibold → font-bold`, giữ kích thước.
- [x] Title `text-slate-900`, description `text-slate-500` để tăng tương phản.

### 4. KPI Cards (`StatCard`)
- [x] Icon `w-10 h-10 → w-11 h-11`, `size 20 → 22` (+10-15%).
- [x] Background icon thêm `ring-1 ring-black/5` (giữ nguyên tint/màu).
- [x] Value `font-semibold → font-bold` (không dùng extrabold).

### 5. Charts (`LeadCharts`, `SourceFunnel`, `Reports`, `CampaignDetails`)
- [x] Grid rõ hơn (`#eef2f7 → #e2e8f0`) — LeadCharts, SourceFunnel, CampaignDetails.
- [x] Tooltip shadow mạnh hơn, border rõ — LeadCharts, SourceFunnel, Reports, CampaignDetails.
- [x] Area/Line `activeDot` to hơn + stroke trắng dày (hover rõ) — LeadCharts, CampaignDetails.
- [x] Bar chart `cursor` fill rõ hơn — SourceFunnel.

### 6. Table (`LeadTable`, `Leads`, `Settings`)
- [x] Header `text-slate-600`, `font-semibold`, `bg-slate-100/50` — LeadTable.
- [x] Hover row `hover:bg-brand-50/60` — LeadTable.
- [x] Row border tinh tế `border-slate-200/70`, padding `py-3` — LeadTable.
- [x] Áp dụng cho trang Leads & Settings.

### 7. Button
- [x] Primary: giữ màu, thêm `shadow-sm hover:shadow-md transition-all duration-200` — một số nút.
- [x] Secondary: `hover:bg-slate-100`, `focus-visible:ring`.

### 8. Badge (`mockData.js` + `Pill`)
- [x] Text `-700 → -800` tăng contrast, giữ màu ngữ nghĩa — mockData.js.
- [x] `Pill` thêm `border border-black/5` — Pill.jsx.

### 9. Sidebar (`Sidebar.jsx`)
- [x] Active: `shadow-md`, `transition-all duration-200`.
- [x] Inactive hover mượt.

### 10. Forms (`Leads`, `Settings`, `Profile`, `CampaignDetails`)
- [x] Input border rõ hơn (`slate-300`), focus `ring-2 ring-brand-500/20 border-brand-500`.
- [x] Placeholder `text-slate-500`.

### 11. Modal (`LeadDetailModal`, `Leads`, `Settings`)
- [x] Overlay `bg-slate-900/60 backdrop-blur-sm` — LeadDetailModal.
- [x] Card `shadow-modal`, border `slate-300` — LeadDetailModal.
- [x] Header rõ hơn — LeadDetailModal.
- [x] Áp dụng cho modals trong Leads & Settings.

### 12. Border Radius Consistency
- [x] Input 10px, Button 10px, Card 12px, Modal 16px, Badge 999px.

### 13. Transition Consistency
- [x] Thống nhất `transition-all duration-200 ease-out`.

### 14. Focus State
- [x] `focus-visible:ring` brand, không quá dày, cho mọi thành phần tương tác.

### 15. UI Consistency Review (cuối)
- [x] Kiểm tra shadow/border/radius/typography/hover/focus/transition thống nhất.

## Ghi chú
- Không đổi màu brand, font, bố cục, UX.
- Không đụng landing, Login/Register, dữ liệu.

## API Integration (chờ Back-end TTS2) — Front-end đã sẵn sàng

- [x] Tầng service `src/services/` (auth/lead/campaign/dashboard/settings) — mọi page gọi qua đây, không import `mockData` trực tiếp nữa (trừ các style map tĩnh như `statusStyle`).
- [x] `apiClient.js` — chuyển `VITE_USE_MOCK=false` trong `.env` để dùng API thật, không cần sửa UI.
- [x] `utils/validators.js` — validate dùng chung cho Login/Register/Leads (đúng định dạng email/phone, khớp Mục VI/XVI kế hoạch).
- [x] Loading/Error/Empty state cho toàn bộ trang tải dữ liệu (Dashboard, Leads, LeadDetail, Campaigns, CampaignDetails, History, Reports, Settings, Profile).
- [x] Unit test cơ bản (`npm run test`) cho leadScoring, validators, leadService.
- [ ] Kết nối thật với Back-end khi TTS2 gửi Swagger — đối chiếu lại field name response thực tế với `services/*.js`.
- [ ] Viết thêm Front-end Test cho component (hiện chỉ có test cho utils/services, chưa test render UI).
