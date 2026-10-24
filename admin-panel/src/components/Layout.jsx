import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { getUser, logout } from "../api";

export default function Layout() {
  const navigate = useNavigate();
  const user = getUser();
  const links = [
    ["/users", "Users & Permissions"],
    ["/scans", "Messages & Emails"],
    ["/domains", "Domains"],
  ];

  return (
    <div className="shell">
      <aside className="sidebar">
        <h2>Admin Panel</h2>
        <nav>
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} className={({ isActive }) => (isActive ? "active" : "")}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span>{user?.name}</span>
          <button onClick={() => { logout(); navigate("/login"); }}>Logout</button>
        </div>
      </aside>
      <main className="content"><Outlet /></main>
    </div>
  );
}