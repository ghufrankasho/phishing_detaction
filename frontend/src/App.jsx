// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Auth from "./pages/Auth";
import Welcome from "./pages/Welcome";
import Overview from "./pages/Overview";
import NewScan from "./pages/NewScan";
import ScanList from "./pages/ScanList";
import ScanDetail from "./pages/ScanDetail";
import AdminApp from "./admin/AdminApp";
import Profile from "./pages/Profile";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
      
          <Route path="/admin/*" element={<AdminApp />} />
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Auth initialMode="signin" />} />
          <Route path="/register" element={<Auth initialMode="signup" />} />

          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Overview />} />
            <Route path="/scan" element={<NewScan />} />
            <Route path="/emails" element={<ScanList key="email" kind="email" title="رسائل البريد" />} />
            <Route path="/messages" element={<ScanList key="message" kind="message" title="الرسائل" />} />
            <Route path="/domains" element={<ScanList key="url" kind="url" title="النطاقات والروابط" />} />
            <Route path="/scans/:id" element={<ScanDetail />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
       
        
       
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
