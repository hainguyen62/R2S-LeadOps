# R2S LeadOps – Lead Management & Scoring System

Hệ thống quản lý, phân loại và chấm điểm khách hàng tiềm năng phục vụ hoạt động tuyển sinh tại **R2S Academy**.

## Công nghệ

- **React 18** + **Vite 5**
- **Tailwind CSS** (dark theme)
- **Recharts** (biểu đồ)
- **React Router** (điều hướng)
- **Lucide React** (icons)

## Bắt đầu

```bash
npm install
npm run dev
```

Mở `http://localhost:5173`.

## Cấu trúc thư mục

```
src/
├── components/
│   ├── dashboard/   # LeadCharts, SourceFunnel, LeadTable, LeadDetailPanel
│   ├── layout/      # Sidebar, Topbar, Layout
│   └── ui/          # Pill, Avatar, StatCard, ChartCard
├── data/
│   └── mockData.js  # Tất cả dữ liệu demo
├── pages/           # Login, Dashboard, Leads, Campaigns, History, Reports, Settings
├── utils/           # exportCsv, leadScoring
├── App.jsx          # Routing & auth state
└── main.jsx
```

## Các module (phạm vi MVP)

1. Đăng nhập & phân quyền → `Login.jsx`
2. Dashboard tuyển sinh → `Dashboard.jsx`
3. Quản lý lead (thêm, tìm, lọc, sắp xếp, phân trang) → `Leads.jsx`
4. Chấm điểm & phân loại lead nóng/ấm/lạnh → `utils/leadScoring.js`
5. Quản lý nguồn lead & chiến dịch → `Campaigns.jsx`
6. Lịch sử chăm sóc → `History.jsx`
7. Báo cáo & xuất CSV → `Reports.jsx`, `utils/exportCsv.js`
8. Cài đặt, tài khoản, nhật ký hoạt động → `Settings.jsx`

## Ghi chú

- Dữ liệu hiện tại là **mock data** (chưa có backend).
- Đăng nhập demo: nhập bất kỳ email & mật khẩu.
