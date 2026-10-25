import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getToken } from "./api";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Users from "./pages/Users";

import Domains from "./pages/Domains";
import Scans from "./pages/ScanList";
import ScanDetail from "./pages/ScanDetail";

function Protected({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Protected><Layout /></Protected>}>
          <Route path="/" element={<Navigate to="/users" replace />} />
          <Route path="/dashboard" element={<Navigate to="/users" replace />} />
          <Route path="/users" element={<Users />} />
              
          {/* Example list routes */}
          <Route path="/domains" element={<Domains />} />
          {/* <Route path="/emails" element={<ScanList kind="email" title="البريد الإلكتروني" />} />
          <Route path="/messages" element={<ScanList kind="message" title="الرسائل" />} /> */}
          <Route path="/scans" element={<Scans />} />
          <Route path="/scans/:id" element={<ScanDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}