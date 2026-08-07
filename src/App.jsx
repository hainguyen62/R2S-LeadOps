import { Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Layout from "./components/layout/Layout.jsx";
import { ToastProvider } from "./components/ui/ToastProvider.jsx";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Leads from "./pages/Leads.jsx";
import LeadDetail from "./pages/LeadDetail.jsx";
import Campaigns from "./pages/Campaigns.jsx";
import CampaignDetails from "./pages/CampaignDetails.jsx";
import History from "./pages/History.jsx";
import Reports from "./pages/Reports.jsx";
import Settings from "./pages/Settings.jsx";
import Profile from "./pages/Profile.jsx";

export default function App() {
  const [user, setUser] = useState(null);

  // Mock login: no real auth — just UI demo
  const handleLogin = (name) => setUser({ name });

  if (!user) {
    return (
      <ToastProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <Layout user={user} onLogout={() => setUser(null)}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/leads/:id" element={<LeadDetail />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/campaigns/:id" element={<CampaignDetails />} />
          <Route path="/history" element={<History />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </ToastProvider>
  );
}