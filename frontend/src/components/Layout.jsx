import React from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sliders from "../components/Slider";

// Define navigation items with an optional allowedRoles or permission key
const NAV = [
  { to: "/dashboard", icon: "bxs-dashboard", label: "الرئيسية", end: true },
  { to: "/scan", icon: "bx-search-alt", label: "فحص جديد" },
  { to: "/emails", icon: "bxs-envelope", label: "رسائل البريد", permission: "manage_emails" },
  { to: "/messages", icon: "bxs-message-dots", label: "الرسائل", permission: "manage_messages" },
  { to: "/domains", icon: "bx-globe", label: "النطاقات والروابط", permission: "manage_domains" },
  { to: "/profile", icon: "bxs-user", label: "الملف الشخصي" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleProfile = () => {
    navigate("/profile");
  };

  // Filter navigation links based on user role or specific permissions
  const filteredNav = NAV.filter((item) => {
    
    // If the item doesn't require any special permission, always show it
    if (!item.permission) return true;

    if (user?.permissions && Array.isArray(user.permissions)) {
      return user.permissions.includes(item.permission);
    }

    // Alternatively, if permissions are stored as boolean flags directly on the user object:
    // e.g., user?.manage_emails === true
    if (user?.[item.permission] === true) return true;

    return false;
  });

  return (
    <div className="app">
      <header className="site-header">
        <div className="topbar">
          {/* الشعار واسم التطبيق */}
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
            </div>
          </Link>

          {/* القائمة الرئيسية المفلترة حسب صلاحيات المستخدم */}
          <nav className="header-nav">
            {filteredNav.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className="nav-link">
                <i className={`bx ${item.icon}`}></i>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* أزرار الحساب والتسجيل */}
          <div className="topbar-actions">
            <button type="button" className="link-btn" onClick={handleProfile}>
              مرحباً <span>{user?.name}</span>
            </button>
            <button type="button" className="link-btn" onClick={handleLogout}>
              تسجيل الخروج
            </button>
          </div>
        </div>
      </header>

      {/* عرض الصفحة الرئيسي مباشرة بدون الشريط الجانبي */}
      <main className="page">
        <Sliders />
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="footer">
          <span>© {new Date().getFullYear()} كشف التصيّد الاحتيالي</span>
          <span>النتائج إرشادية ولا تغني عن الحذر.</span>
        </div>
      </footer>
    </div>
  );
}