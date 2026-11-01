import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getToken } from "./api";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Users from "./pages/Users";
import Home from './pages/Home';
import AdminScans from "./pages/AdminScans";
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
          <Route path="/" element={<Home/>} />
           <Route path="/home" element={<Home/>} />
          <Route path="/users" element={<Users />} />
              
          <Route path="/messages" element={<AdminScans key="message" kind="message" />} />
          <Route path="/emails"   element={<AdminScans key="email"   kind="email" />} />
          <Route path="/domains"  element={<AdminScans key="url"     kind="url" />} />
          {/* <Route path="/emails" element={<ScanList kind="email" title="البريد الإلكتروني" />} />
          <Route path="/messages" element={<ScanList kind="message" title="الرسائل" />} /> */}
          <Route path="/scans" element={<Scans />} />
          <Route path="/scans/:id" element={<ScanDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}