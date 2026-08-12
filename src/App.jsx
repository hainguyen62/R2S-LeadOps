import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState } from "react";
import Layout from "./components/layout/Layout.jsx";
import { useToast } from "./components/ui/ToastProvider.jsx";
import { logout as logoutApi } from "./services/authService.js";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { canAccessPath, getHomePath } from "./utils/permissions.js";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import RegisterStaff from "./pages/RegisterStaff.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Leads from "./pages/Leads.jsx";
import LeadDetail from "./pages/LeadDetail.jsx";
import Campaigns from "./pages/Campaigns.jsx";
import CampaignDetails from "./pages/CampaignDetails.jsx";
import History from "./pages/History.jsx";
import Reports from "./pages/Reports.jsx";
import Settings from "./pages/Settings.jsx";
import Profile from "./pages/Profile.jsx";
import Consultation from "./pages/Consultation.jsx";

/**
 * Chặn truy cập theo route nếu vai trò hiện tại không có quyền (Mục IV).
 * Đây là lớp bảo vệ ở FE (ẩn/chặn điều hướng) — không thay thế việc
 * Back-end thật vẫn phải tự kiểm tra quyền trên từng API (Mục XVII).
 */
function RequireAccess({ children }) {
  const user = useAuth();
  const location = useLocation();
  if (!canAccessPath(user, location.pathname)) {
    return <Navigate to={getHomePath(user)} replace />;
  }
  return children;
}

export default function App() {
  const [user, setUser] = useState(null);
  const toast = useToast();

  // Đăng nhập thật qua authService (mock cho tới khi có Back-end — xem services/authService.js)
  const handleLogin = (loggedInUser) => setUser(loggedInUser);

  // Đăng xuất: Topbar đã hỏi xác nhận trước khi gọi hàm này, nên ở đây chỉ cần
  // gọi API đăng xuất, báo toast rồi xóa user khỏi state.
  const handleLogout = () => {
    logoutApi().finally(() => {
      setUser(null);
      toast.success("Đăng xuất thành công. Hẹn gặp lại!");
    });
  };

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/register" element={<RegisterStaff />} />
        <Route path="/consultation" element={<Consultation />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <AuthProvider user={user}>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<RequireAccess><Dashboard /></RequireAccess>} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/leads/:id" element={<LeadDetail />} />
          <Route path="/campaigns" element={<RequireAccess><Campaigns /></RequireAccess>} />
          <Route path="/campaigns/:id" element={<RequireAccess><CampaignDetails /></RequireAccess>} />
          <Route path="/history" element={<RequireAccess><History /></RequireAccess>} />
          <Route path="/reports" element={<RequireAccess><Reports /></RequireAccess>} />
          <Route path="/settings" element={<RequireAccess><Settings /></RequireAccess>} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to={getHomePath(user)} replace />} />
        </Routes>
      </Layout>
    </AuthProvider>
  );
}