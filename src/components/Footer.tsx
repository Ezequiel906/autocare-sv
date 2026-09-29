import {
  CarFront,
  Camera,
  Clock3,
  Mail,
  MapPin,
  MessagesSquare,
  Phone,
} from "lucide-react";
import { Link } from "react-router-dom";
import "./Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__brand-column">
          <Link className="footer__brand" to="/" aria-label="AutoCare SV, inicio">
            <span className="footer__brand-icon" aria-hidden="true">
              <CarFront size={22} />
            </span>
            <span>AutoCare <strong>SV</strong></span>
          </Link>
          <p>
            Cuidado automotriz confiable para mantener tu vehículo seguro y listo
            para cada recorrido.
          </p>
          <div className="footer__socials" aria-label="Redes sociales">
            <a href="#" aria-label="Facebook">
              <MessagesSquare size={19} />
            </a>
            <a href="#" aria-label="Instagram">
              <Camera size={19} />
            </a>
          </div>
        </div>

        <div className="footer__column">
          <h2>Navegación</h2>
          <nav aria-label="Navegación del pie de página">
            <Link to="/">Inicio</Link>
            <Link to="/servicios">Servicios</Link>
            <Link to="/agendar-cita">Agendar cita</Link>
            <Link to="/login">Mi cuenta</Link>
          </nav>
        </div>

        <div className="footer__column">
          <h2>Servicios</h2>
          <ul>
            <li>Cambio de aceite</li>
            <li>Cambio de filtros</li>
            <li>Control de fluidos</li>
            <li>Revisión rápida</li>
            <li>Baterías</li>
          </ul>
        </div>

        <div className="footer__column footer__contact">
          <h2>Contacto</h2>
          <p><Phone size={17} aria-hidden="true" /> Teléfono</p>
          <p><Mail size={17} aria-hidden="true" /> Correo electrónico</p>
          <p><MapPin size={17} aria-hidden="true" /> El Salvador</p>
        </div>

        <div className="footer__column footer__hours">
          <h2>Horarios</h2>
          <p><Clock3 size={17} aria-hidden="true" /> Lunes a viernes</p>
          <span>8:00 a. m. - 5:30 p. m.</span>
          <p>Sábado</p>
          <span>8:00 a. m. - 1:00 p. m.</span>
        </div>
      </div>

      <div className="footer__bottom">
        <div className="footer__bottom-content">
          <p>© {new Date().getFullYear()} AutoCare SV. Todos los derechos reservados.</p>
          <div>
            <a href="#">Privacidad</a>
            <a href="#">Términos</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
