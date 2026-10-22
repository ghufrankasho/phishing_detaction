import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getToken } from "./api";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Users from "./pages/Users";

import Domains from "./pages/Domains";

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
          <Route path="/users" element={<Users />} />
        
          <Route path="/domains" element={<Domains />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}