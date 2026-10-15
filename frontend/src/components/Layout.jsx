import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="app">
      {/* Outer element = full-width colored band, inner .topbar = centered content */}
      <header className="site-header">
        <div className="topbar">
          <Link to="/dashboard" className="brand">
            <div className="logo">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="1.8"
                   strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l8 3v6c0 4.5-3.2 8.3-8 9-4.8-.7-8-4.5-8-9V6l8-3z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h1>كشف التصيّد الاحتيالي</h1>
              <p>افحص الروابط والرسائل قبل أن تثق بها</p>
            </div>
          </Link>

          <div className="topbar-actions">
            <span className="status">مرحباً، {user.name}</span>
            <button type="button" className="link-btn" onClick={handleLogout}>
              تسجيل الخروج
            </button>
          </div>
        </div>
      </header>

      <div className="page">
        <Outlet />
      </div>

      <footer className="site-footer">
        <div className="footer">
          <span>© {new Date().getFullYear()} كشف التصيّد الاحتيالي</span>
          <span>النتائج إرشادية ولا تغني عن الحذر.</span>
        </div>
      </footer>
    </div>
  );
}
