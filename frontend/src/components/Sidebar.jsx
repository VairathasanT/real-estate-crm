import {
  Building2,
  CalendarCheck,
  LayoutDashboard,
  LogOut,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Leads", path: "/leads", icon: Users },
  { name: "Properties", path: "/properties", icon: Building2 },
  { name: "Bookings", path: "/bookings", icon: CalendarCheck },
  { name: "Employees", path: "/employees", icon: UserCog, adminOnly: true },
];

export default function Sidebar({ mobileOpen = false, onClose = () => {} }) {
  const { user, logout } = useAuth();
  const roleLabel = user?.role === "ADMIN" ? "Administrator" : "Sales employee";
  const visibleLinks = links.filter((link) => !link.adminOnly || user?.role === "ADMIN");

  const navigation = (
    <nav className="sidebar-nav">
      {visibleLinks.map((link) => {
        const Icon = link.icon;
        return (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.path === "/"}
            title={link.name}
            onClick={onClose}
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
          >
            <Icon size={18} />
            <span>{link.name}</span>
          </NavLink>
        );
      })}
    </nav>
  );

  const userSection = (
    <div className="sidebar-bottom">
      <div className="sidebar-user">
        <div className="sidebar-avatar">{user?.name?.charAt(0).toUpperCase() || "?"}</div>
        <div>
          <strong>{user?.name || "Account"}</strong>
          <span>{roleLabel}</span>
        </div>
      </div>
      <button type="button" className="sidebar-logout" onClick={logout}>
        <LogOut size={17} />
        Sign out
      </button>
    </div>
  );

  return (
    <>
      {mobileOpen ? <div className="sidebar-overlay" onClick={onClose} /> : null}
      <aside className={`sidebar ${mobileOpen ? "sidebar--open" : ""}`} aria-label="Primary navigation">
        <div className="sidebar-mobile-header">
          <Brand />
          <button type="button" className="sidebar-close" aria-label="Close navigation menu" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <Brand />
        <div className="sidebar-nav-wrap">{navigation}</div>
        {userSection}
      </aside>
    </>
  );
}

function Brand() {
  return (
    <div className="sidebar-brand">
      <div className="sidebar-logo"><Building2 size={19} /></div>
      <div>
        <h2>EstateFlow</h2>
        <span>CRM Workspace</span>
      </div>
    </div>
  );
}
