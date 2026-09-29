import {
  CalendarCheck,
  CalendarDays,
  CarFront,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/layouts.css";
import "../styles/admin-layout.css";

function AdminLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const userName =
    typeof user?.name === "string" && user.name.trim()
      ? user.name
      : "Administrador";

  const closeMenu = () => setIsMenuOpen(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getLinkClassName = ({ isActive }: { isActive: boolean }) =>
    `admin-sidebar__link${isActive ? " admin-sidebar__link--active" : ""}`;

  return (
    <div className="admin-layout">
      <aside className="admin-layout__sidebar">
        <div className="admin-sidebar__header">
          <div className="admin-sidebar__brand">
            <span aria-hidden="true"><CarFront size={23} /></span>
            <div>
              <strong>AutoCare SV</strong>
              <small>Administración</small>
            </div>
          </div>
          <button
            className="admin-sidebar__menu-button"
            type="button"
            aria-label={isMenuOpen ? "Cerrar menú administrativo" : "Abrir menú administrativo"}
            aria-expanded={isMenuOpen}
            aria-controls="admin-sidebar-panel"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        <div
          id="admin-sidebar-panel"
          className={`admin-sidebar__panel${isMenuOpen ? " admin-sidebar__panel--open" : ""}`}
        >
          <nav className="admin-sidebar__navigation" aria-label="Navegación administrativa">
            <NavLink to="/admin/dashboard" className={getLinkClassName} onClick={closeMenu}>
              <LayoutDashboard size={19} aria-hidden="true" /> Dashboard
            </NavLink>
            <NavLink to="/admin/agenda" className={getLinkClassName} onClick={closeMenu}>
              <CalendarDays size={19} aria-hidden="true" /> Agenda
            </NavLink>
            <NavLink to="/admin/citas" className={getLinkClassName} onClick={closeMenu}>
              <CalendarCheck size={19} aria-hidden="true" /> Citas
            </NavLink>
            <NavLink to="/admin/vehiculos" className={getLinkClassName} onClick={closeMenu}>
              <CarFront size={19} aria-hidden="true" /> Vehículos
            </NavLink>
            <NavLink to="/admin/clientes" className={getLinkClassName} onClick={closeMenu}>
              <Users size={19} aria-hidden="true" /> Clientes
            </NavLink>
            <NavLink to="/admin/servicios" className={getLinkClassName} onClick={closeMenu}>
              <Wrench size={19} aria-hidden="true" /> Servicios
            </NavLink>
            <NavLink to="/admin/historial" className={getLinkClassName} onClick={closeMenu}>
              <ClipboardList size={19} aria-hidden="true" /> Historial
            </NavLink>
            <NavLink to="/admin/configuracion" className={getLinkClassName} onClick={closeMenu}>
              <Settings size={19} aria-hidden="true" /> Configuración
            </NavLink>
          </nav>

          <div className="admin-sidebar__account">
            <div className="admin-sidebar__user">
              <span aria-hidden="true"><ShieldCheck size={19} /></span>
              <div>
                <strong>{userName}</strong>
                <small>ADMIN</small>
              </div>
            </div>
            <button type="button" onClick={handleLogout}>
              <LogOut size={18} aria-hidden="true" /> Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      <main className="admin-layout__content">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
