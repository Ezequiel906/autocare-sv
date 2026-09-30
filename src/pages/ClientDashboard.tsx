import axios from "axios";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowRight,
  CalendarDays,
  CalendarPlus,
  CarFront,
  ClipboardClock,
  History,
  Plus,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./ClientDashboard.css";

type DashboardVehicle = {
  id: number;
};

type DashboardAppointment = {
  id: number;
  date: string;
  status: "PENDING" | "CONFIRMED" | "IN_SERVICE" | "COMPLETED" | "CANCELLED";
  vehicle: {
    brand: string;
    model: string;
    plate: string;
  };
};

type DashboardHistoryRecord = {
  id: number;
};

function ClientDashboard() {
  const { accessToken } = useAuth();
  const [vehicles, setVehicles] = useState<DashboardVehicle[]>([]);
  const [appointments, setAppointments] = useState<DashboardAppointment[]>([]);
  const [history, setHistory] = useState<DashboardHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");
  const [dashboardLoadedAt, setDashboardLoadedAt] = useState(0);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setDashboardError("");

    if (!accessToken) {
      setVehicles([]);
      setAppointments([]);
      setHistory([]);
      setDashboardError("Tu sesión no es válida. Inicia sesión nuevamente.");
      setIsLoading(false);
      return;
    }

    const requestConfig = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };

    try {
      const [vehiclesResponse, appointmentsResponse, historyResponse] = await Promise.all([
        axios.get<DashboardVehicle[]>("/vehicles", requestConfig),
        axios.get<DashboardAppointment[]>("/appointments", requestConfig),
        axios.get<DashboardHistoryRecord[]>("/service-history", requestConfig),
      ]);

      setVehicles(vehiclesResponse.data);
      setAppointments(appointmentsResponse.data);
      setHistory(historyResponse.data);
      setDashboardLoadedAt(Date.now());
    } catch (error) {
      setVehicles([]);
      setAppointments([]);
      setHistory([]);
      setDashboardError(
        axios.isAxiosError(error) && error.response?.status === 401
          ? "Tu sesión expiró o no es válida."
          : "No pudimos cargar el resumen de tu cuenta. Inténtalo nuevamente.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadDashboard(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadDashboard]);

  const upcomingAppointment = appointments
    .filter((appointment) => (
      new Date(appointment.date).getTime() > dashboardLoadedAt
      && appointment.status !== "COMPLETED"
      && appointment.status !== "CANCELLED"
    ))
    .sort((first, second) => (
      new Date(first.date).getTime() - new Date(second.date).getTime()
    ))[0] ?? null;

  const vehiclesSummary = isLoading
    ? "Cargando vehículos..."
    : dashboardError
      ? "Información no disponible"
      : vehicles.length === 0
        ? "Sin vehículos registrados"
        : `${vehicles.length} ${vehicles.length === 1 ? "vehículo registrado" : "vehículos registrados"}`;
  const appointmentsSummary = isLoading
    ? "Cargando citas..."
    : dashboardError
      ? "Información no disponible"
      : appointments.length === 0
        ? "No hay citas registradas"
        : `${appointments.length} ${appointments.length === 1 ? "cita registrada" : "citas registradas"}`;
  const historySummary = isLoading
    ? "Cargando historial..."
    : dashboardError
      ? "Información no disponible"
      : history.length === 0
        ? "Sin historial disponible"
        : `${history.length} ${history.length === 1 ? "servicio registrado" : "servicios registrados"}`;

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
            <p>{vehiclesSummary}</p>
            <Link to="/cuenta/vehiculos">Agregar vehículo <ArrowRight size={16} aria-hidden="true" /></Link>
          </article>
          <article className="client-summary-card">
            <div className="client-summary-card__icon"><CalendarDays size={24} aria-hidden="true" /></div>
            <h3>Próxima cita</h3>
            <p>{appointmentsSummary}</p>
            <Link to="/agendar-cita">Agendar cita <ArrowRight size={16} aria-hidden="true" /></Link>
          </article>
          <article className="client-summary-card">
            <div className="client-summary-card__icon"><History size={24} aria-hidden="true" /></div>
            <h3>Historial de servicios</h3>
            <p>{historySummary}</p>
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
          {isLoading ? (
            <p role="status">Estamos consultando tu próxima cita...</p>
          ) : dashboardError ? (
            <p role="alert">{dashboardError}</p>
          ) : upcomingAppointment ? (
            <p>
              {format(new Date(upcomingAppointment.date), "d 'de' MMMM 'de' yyyy 'a las' hh:mm a", { locale: es })}
              {" · "}{upcomingAppointment.vehicle.brand} {upcomingAppointment.vehicle.model}
              {" · "}{upcomingAppointment.vehicle.plate}
            </p>
          ) : (
            <p>
              Aún no tienes una próxima cita. Cuando agendes una visita, podrás consultar
              aquí su información.
            </p>
          )}
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
