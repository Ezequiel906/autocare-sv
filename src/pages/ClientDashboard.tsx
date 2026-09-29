import {
  ArrowRight,
  CalendarDays,
  CalendarPlus,
  CarFront,
  ClipboardClock,
  History,
  Plus,
} from "lucide-react";
import { Link } from "react-router-dom";
import "./ClientDashboard.css";

function ClientDashboard() {
  return (
    <div className="client-dashboard">
      <header className="client-dashboard__header">
        <span>Área de clientes</span>
        <h1>Mi cuenta</h1>
        <p>Administra tus vehículos, citas e historial de servicios desde un solo lugar.</p>
      </header>

      <section className="client-dashboard__summary" aria-labelledby="account-summary-title">
        <div className="client-dashboard__section-heading">
          <div>
            <span>Vista general</span>
            <h2 id="account-summary-title">Resumen</h2>
          </div>
        </div>

        <div className="client-summary-grid">
          <article className="client-summary-card">
            <div className="client-summary-card__icon"><CarFront size={24} aria-hidden="true" /></div>
            <h3>Mis vehículos</h3>
            <p>Sin vehículos registrados</p>
            <Link to="/cuenta/vehiculos">Agregar vehículo <ArrowRight size={16} aria-hidden="true" /></Link>
          </article>
          <article className="client-summary-card">
            <div className="client-summary-card__icon"><CalendarDays size={24} aria-hidden="true" /></div>
            <h3>Próxima cita</h3>
            <p>No hay próxima cita</p>
            <Link to="/agendar-cita">Agendar cita <ArrowRight size={16} aria-hidden="true" /></Link>
          </article>
          <article className="client-summary-card">
            <div className="client-summary-card__icon"><History size={24} aria-hidden="true" /></div>
            <h3>Historial de servicios</h3>
            <p>Sin historial disponible</p>
            <Link to="/cuenta/historial">Ver historial <ArrowRight size={16} aria-hidden="true" /></Link>
          </article>
        </div>
      </section>

      <section className="client-upcoming" aria-labelledby="upcoming-appointment-title">
        <div className="client-upcoming__visual" aria-hidden="true">
          <ClipboardClock size={42} />
        </div>
        <div className="client-upcoming__content">
          <span>Agenda</span>
          <h2 id="upcoming-appointment-title">Próxima cita</h2>
          <p>
            Aún no tienes una próxima cita. Cuando agendes una visita, podrás consultar
            aquí su información.
          </p>
        </div>
        <Link className="client-dashboard__primary-action" to="/agendar-cita">
          <CalendarPlus size={18} aria-hidden="true" />
          Agendar cita
        </Link>
      </section>

      <section className="client-quick-actions" aria-labelledby="quick-actions-title">
        <div className="client-dashboard__section-heading">
          <div>
            <span>Accesos</span>
            <h2 id="quick-actions-title">Acciones rápidas</h2>
          </div>
        </div>
        <div className="client-quick-actions__grid">
          <Link to="/agendar-cita">
            <CalendarPlus size={21} aria-hidden="true" />
            <span>Agendar cita</span>
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
          <Link to="/cuenta/vehiculos">
            <Plus size={21} aria-hidden="true" />
            <span>Agregar vehículo</span>
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
          <Link to="/cuenta/citas">
            <CalendarDays size={21} aria-hidden="true" />
            <span>Ver mis citas</span>
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}

export default ClientDashboard;
