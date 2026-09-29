import {
  CalendarDays,
  CarFront,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "../styles/client-layout.css";

function ClientLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMenu = () => setIsMenuOpen(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="client-layout">
      <aside className="client-sidebar">
        <div className="client-sidebar__header">
          <div className="client-sidebar__brand">
            <span aria-hidden="true"><CarFront size={22} /></span>
            <div>
              <strong>AutoCare SV</strong>
              <small>Área de clientes</small>
            </div>
          </div>
          <button
            className="client-sidebar__menu-button"
            type="button"
            aria-label={isMenuOpen ? "Cerrar menú de cuenta" : "Abrir menú de cuenta"}
            aria-expanded={isMenuOpen}
            aria-controls="client-navigation"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        <nav
          id="client-navigation"
          className={`client-sidebar__navigation${isMenuOpen ? " client-sidebar__navigation--open" : ""}`}
          aria-label="Navegación de mi cuenta"
        >
          <NavLink
            to="/cuenta"
            end
            className={({ isActive }) =>
              `client-sidebar__link${isActive ? " client-sidebar__link--active" : ""}`
            }
            onClick={closeMenu}
          >
            <LayoutDashboard size={19} aria-hidden="true" />
            Resumen
          </NavLink>
          <NavLink
            to="/cuenta/vehiculos"
            className={({ isActive }) =>
              `client-sidebar__link${isActive ? " client-sidebar__link--active" : ""}`
            }
            onClick={closeMenu}
          >
            <CarFront size={19} aria-hidden="true" />
            Mis vehículos
          </NavLink>
          <NavLink
            to="/cuenta/citas"
            className={({ isActive }) =>
              `client-sidebar__link${isActive ? " client-sidebar__link--active" : ""}`
            }
            onClick={closeMenu}
          >
            <CalendarDays size={19} aria-hidden="true" />
            Mis citas
          </NavLink>
          <NavLink
            to="/cuenta/historial"
            className={({ isActive }) =>
              `client-sidebar__link${isActive ? " client-sidebar__link--active" : ""}`
            }
            onClick={closeMenu}
          >
            <History size={19} aria-hidden="true" />
            Historial
          </NavLink>
        </nav>

        <button
          className="client-sidebar__link client-sidebar__logout"
          type="button"
          onClick={handleLogout}
        >
          <LogOut size={19} aria-hidden="true" />
          Cerrar sesión
        </button>

        <div className="client-sidebar__footer">
          <span aria-hidden="true"><CarFront size={18} /></span>
          <p>Gestión de mantenimiento</p>
        </div>
      </aside>

      <div className="client-layout__content">
        <Outlet />
      </div>
    </div>
  );
}

export default ClientLayout;
