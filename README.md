# R2S LeadOps – Lead Management & Scoring System

Hệ thống quản lý, phân loại và chấm điểm khách hàng tiềm năng phục vụ hoạt động tuyển sinh tại **R2S Academy**.

## Công nghệ

- **React 18** + **Vite 5**
- **Tailwind CSS** (dark theme)
- **Recharts** (biểu đồ)
- **React Router** (điều hướng)
- **Lucide React** (icons)
- **Vitest** (unit test)

## Bắt đầu

```bash
npm install
cp .env.example .env   # chỉnh VITE_API_BASE_URL / VITE_USE_MOCK nếu cần
npm run dev
```

Mở `http://localhost:5173`.

## Kết nối Back-end (API thật)

Mặc định dự án chạy ở **chế độ mock** (`VITE_USE_MOCK=true` trong `.env`) — mọi
thao tác đọc/ghi dữ liệu đi qua `src/services/*.js` và được mô phỏng bằng dữ
liệu trong `src/data/mockData.js` (có độ trễ giả lập ~300–700ms để test loading
state thực tế).

Khi TTS2 (Back-end, Spring Boot) triển khai xong API theo đúng danh sách
endpoint ở Mục X kế hoạch triển khai:

1. Đặt `VITE_API_BASE_URL=http://<host-backend>/api` trong `.env`.
2. Đặt `VITE_USE_MOCK=false`.
3. Không cần sửa bất kỳ page/component nào — toàn bộ UI chỉ gọi qua tầng
   `src/services/*.js`, tầng này tự chuyển sang gọi `fetch` thật khi
   `VITE_USE_MOCK=false` (xem `src/services/apiClient.js`).

Nếu tên trường dữ liệu (response JSON) từ Back-end khác với mock hiện tại,
chỉ cần chỉnh trong `services/*.js` — không phải sửa UI.

## Kiểm thử

```bash
npm run test        # chạy 1 lần
npm run test:watch  # chạy theo dõi khi code thay đổi
```

Test hiện có bao phủ: engine chấm điểm lead (`utils/leadScoring.test.js`),
validator dùng chung cho các form (`utils/validators.test.js`), và tầng
service quản lý lead — tạo/xóa/cập nhật trạng thái/phát hiện trùng
(`services/leadService.test.js`).

## Cấu trúc thư mục

```
src/
├── components/
│   ├── dashboard/   # LeadCharts, SourceFunnel, LeadTable, LeadDetailPanel
│   ├── layout/      # Sidebar, Topbar, Layout
│   └── ui/          # Pill, Avatar, StatCard, ChartCard
├── data/
│   └── mockData.js  # Dữ liệu demo — dùng làm "database" mock trong services/*
├── services/        # Tầng gọi API (auth, lead, campaign, dashboard, settings) — xem README ở trên
├── pages/           # Login, Dashboard, Leads, Campaigns, History, Reports, Settings
├── utils/           # exportCsv, importCsv, leadScoring, validators
├── App.jsx          # Routing & auth state
└── main.jsx
```

## Các module (phạm vi MVP)

1. Đăng nhập & phân quyền → `Login.jsx`, `services/authService.js`
2. Dashboard tuyển sinh → `Dashboard.jsx`, `services/dashboardService.js`
3. Quản lý lead (thêm, tìm, lọc, sắp xếp, phân trang) → `Leads.jsx`, `services/leadService.js`
4. Chấm điểm & phân loại lead nóng/ấm/lạnh → `utils/leadScoring.js`
5. Quản lý nguồn lead & chiến dịch → `Campaigns.jsx`, `services/campaignService.js`
6. Lịch sử chăm sóc → `History.jsx`
7. Báo cáo & xuất CSV → `Reports.jsx`, `utils/exportCsv.js`
8. Cài đặt, tài khoản, nhật ký hoạt động → `Settings.jsx`, `services/settingsService.js`

## Ghi chú

- Dữ liệu hiện tại là **mock data** cho tới khi Back-end sẵn sàng (xem mục "Kết nối Back-end" ở trên).
- Đăng nhập demo: dùng 1 trong các email ở màn Login, mật khẩu `123456`.

