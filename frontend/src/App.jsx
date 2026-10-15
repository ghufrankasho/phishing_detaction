// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Auth from "./pages/Auth";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Welcome from "./pages/welcome";
import AdminApp from "./admin/AdminApp";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
           {/* your existing routes: home, login, register, ... */}
          <Route path="/admin/*" element={<AdminApp />} />
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Auth initialMode="signin" />} />
          <Route path="/register" element={<Auth initialMode="signup" />} />  
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          {/* later: <Route path="/history" element={<History />} /> */}
         </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}