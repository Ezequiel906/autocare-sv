import { useState } from "react";
import { CarFront, Menu, UserRound, X } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

function Navbar() {
  const { isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="navbar">
      <div className="navbar__container">
        <Link className="navbar__brand" to="/" aria-label="AutoCare SV, inicio" onClick={closeMenu}>
          <span className="navbar__brand-icon" aria-hidden="true">
            <CarFront size={22} strokeWidth={2.2} />
          </span>
          <span>AutoCare <strong>SV</strong></span>
        </Link>

        <button
          className="navbar__menu-button"
          type="button"
          aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={isMenuOpen}
          aria-controls="public-navigation"
          onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <nav
          id="public-navigation"
          className={`navbar__navigation${isMenuOpen ? " navbar__navigation--open" : ""}`}
          aria-label="Navegación principal"
        >
          <div className="navbar__links">
            <NavLink
              className={({ isActive }) =>
                `navbar__link${isActive ? " navbar__link--active" : ""}`
              }
              to="/"
              end
              onClick={closeMenu}
            >
              Inicio
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                `navbar__link${isActive ? " navbar__link--active" : ""}`
              }
              to="/servicios"
              onClick={closeMenu}
            >
              Servicios
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                `navbar__link${isActive ? " navbar__link--active" : ""}`
              }
              to="/agendar-cita"
              onClick={closeMenu}
            >
              Agendar cita
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                `navbar__link navbar__account-link${isActive ? " navbar__link--active" : ""}`
              }
              to={isAuthenticated ? "/cuenta" : "/login"}
              onClick={closeMenu}
            >
              <UserRound size={18} aria-hidden="true" />
              Mi cuenta
            </NavLink>
          </div>

          <Link className="navbar__cta" to="/agendar-cita" onClick={closeMenu}>
            Agendar cita
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
