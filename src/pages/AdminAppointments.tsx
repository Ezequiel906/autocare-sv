import axios from "axios";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  CalendarDays,
  CarFront,
  ListFilter,
  Mail,
  Phone,
  RefreshCw,
  Search,
  UserRound,
  Wrench,
} from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./AdminAppointments.css";

type AppointmentStatus = "PENDING" | "CONFIRMED" | "IN_SERVICE" | "COMPLETED" | "CANCELLED";

type AdminAppointment = {
  id: number;
  date: string;
  status: AppointmentStatus;
  customer: { id: number; name: string; email: string; phone: string | null };
  vehicle: {
    id: number;
    brand: string;
    model: string;
    year: number;
    plate: string;
    type: string;
    color: string | null;
    mileage: number | null;
  };
  services: Array<{
    id: number;
    name: string;
    slug: string;
    category: string;
    price: string;
    duration: number;
  }>;
  customerNotes: string | null;
  technicianNotes: string | null;
  mileage: number | null;
  observations: string | null;
  createdAt: string;
  updatedAt: string;
};

type AppointmentFilters = {
  search: string;
  status: "" | AppointmentStatus;
  date: string;
};

const emptyFilters: AppointmentFilters = { search: "", status: "", date: "" };

function getStatusLabel(status: AppointmentStatus) {
  switch (status) {
    case "PENDING": return "Pendiente";
    case "CONFIRMED": return "Confirmada";
    case "IN_SERVICE": return "En servicio";
    case "COMPLETED": return "Completada";
    case "CANCELLED": return "Cancelada";
  }
}

function AdminAppointments() {
  const { accessToken, user } = useAuth();
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [filters, setFilters] = useState<AppointmentFilters>(emptyFilters);
  const [activeFilters, setActiveFilters] = useState<AppointmentFilters>(emptyFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState("");

  const loadAppointments = useCallback(async (requestedFilters: AppointmentFilters) => {
    setIsLoading(true);
    setAppointmentsError("");

    if (!accessToken || !user) {
      setAppointments([]);
      setAppointmentsError("Tu sesión no es válida. Inicia sesión con una cuenta administrativa.");
      setIsLoading(false);
      return;
    }

    const search = requestedFilters.search.trim();
    const params = {
      ...(search ? { search } : {}),
      ...(requestedFilters.status ? { status: requestedFilters.status } : {}),
      ...(requestedFilters.date ? { date: requestedFilters.date } : {}),
    };

    try {
      const response = await axios.get<AdminAppointment[]>(
        "/admin/appointments",
        {
          params,
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      setAppointments(response.data);
    } catch (error) {
      setAppointments([]);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setAppointmentsError("Tu sesión expiró o no es válida. Inicia sesión nuevamente.");
      } else if (axios.isAxiosError(error) && error.response?.status === 403) {
        setAppointmentsError("Tu cuenta no tiene permisos para consultar las citas administrativas.");
      } else {
        setAppointmentsError("No pudimos cargar las citas. Inténtalo nuevamente.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, user]);

  useEffect(() => {
    // Initial synchronization without filters.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAppointments(emptyFilters);
  }, [loadAppointments]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextFilters = { ...filters, search: filters.search.trim() };
    setFilters(nextFilters);
    setActiveFilters(nextFilters);
    void loadAppointments(nextFilters);
  };

  const clearFilters = () => {
    setFilters(emptyFilters);
    setActiveFilters(emptyFilters);
    void loadAppointments(emptyFilters);
  };

  return (
    <div className="admin-appointments">
      <header className="admin-appointments__header">
        <div>
          <span>Gestión administrativa</span>
          <h1>Citas</h1>
          <p>Consulta y administra las citas registradas en AutoCare SV.</p>
        </div>
        <span className="admin-appointments__count">
          <CalendarDays size={18} aria-hidden="true" />
          {isLoading ? "Consultando citas..." : `${appointments.length} ${appointments.length === 1 ? "cita encontrada" : "citas encontradas"}`}
        </span>
      </header>

      <form className="admin-appointments-filters" onSubmit={handleSearch}>
        <div className="admin-appointments-filters__heading">
          <ListFilter size={20} aria-hidden="true" />
          <h2>Filtros</h2>
        </div>
        <div className="admin-appointments-filters__fields">
          <label className="admin-appointments-field admin-appointments-field--search">
            <span>Buscar</span>
            <div>
              <Search size={17} aria-hidden="true" />
              <input
                type="search"
                placeholder="Buscar cliente, correo, teléfono, placa o vehículo..."
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              />
            </div>
          </label>
          <label className="admin-appointments-field">
            <span>Estado</span>
            <select
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as AppointmentFilters["status"] }))}
            >
              <option value="">Todos</option>
              <option value="PENDING">Pendientes</option>
              <option value="CONFIRMED">Confirmadas</option>
              <option value="IN_SERVICE">En servicio</option>
              <option value="COMPLETED">Completadas</option>
              <option value="CANCELLED">Canceladas</option>
            </select>
          </label>
          <label className="admin-appointments-field">
            <span>Fecha</span>
            <input
              type="date"
              value={filters.date}
              onChange={(event) => setFilters((current) => ({ ...current, date: event.target.value }))}
            />
          </label>
          <div className="admin-appointments-filters__actions">
            <button type="submit" disabled={isLoading}>
              <Search size={17} aria-hidden="true" />
              {isLoading ? "Buscando..." : "Buscar"}
            </button>
            <button type="button" disabled={isLoading} onClick={clearFilters}>
              Limpiar filtros
            </button>
          </div>
        </div>
      </form>

      {isLoading ? (
        <div className="admin-appointments-loading" role="status" aria-label="Cargando citas">
          <span /><span /><span /><span />
        </div>
      ) : appointmentsError ? (
        <section className="admin-appointments-state" role="alert">
          <RefreshCw size={38} aria-hidden="true" />
          <h2>No pudimos mostrar las citas</h2>
          <p>{appointmentsError}</p>
          <button type="button" onClick={() => void loadAppointments(activeFilters)}>
            <RefreshCw size={17} aria-hidden="true" /> Reintentar
          </button>
        </section>
      ) : appointments.length === 0 ? (
        <section className="admin-appointments-state">
          <CalendarDays size={42} aria-hidden="true" />
          <h2>No hay citas que coincidan con los filtros.</h2>
          <p>Modifica los criterios de búsqueda o limpia los filtros para consultar todas las citas.</p>
        </section>
      ) : (
        <section className="admin-appointments-list" aria-label="Listado de citas">
          <div className="admin-appointments-list__head" aria-hidden="true">
            <span>Fecha y hora</span><span>Cliente</span><span>Vehículo</span><span>Servicios</span><span>Estado</span><span>Acción</span>
          </div>
          {appointments.map((appointment) => (
            <article className="admin-appointments-row" key={appointment.id}>
              <div className="admin-appointments-row__date">
                <small>Fecha y hora</small>
                <strong>{format(new Date(appointment.date), "d MMM yyyy", { locale: es })}</strong>
                <span>{format(new Date(appointment.date), "hh:mm a", { locale: es }).toUpperCase()}</span>
              </div>
              <div className="admin-appointments-row__person">
                <small>Cliente</small>
                <strong><UserRound size={15} aria-hidden="true" /> {appointment.customer.name}</strong>
                <span><Mail size={13} aria-hidden="true" /> {appointment.customer.email}</span>
                {appointment.customer.phone && <span><Phone size={13} aria-hidden="true" /> {appointment.customer.phone}</span>}
              </div>
              <div className="admin-appointments-row__vehicle">
                <small>Vehículo</small>
                <strong><CarFront size={15} aria-hidden="true" /> {appointment.vehicle.brand} {appointment.vehicle.model}</strong>
                <span>{appointment.vehicle.year} · {appointment.vehicle.plate}</span>
              </div>
              <div className="admin-appointments-row__services">
                <small>Servicios</small>
                <span><Wrench size={14} aria-hidden="true" /> {appointment.services.map((service) => service.name).join(", ")}</span>
              </div>
              <div>
                <small>Estado</small>
                <span className={`admin-appointments-status admin-appointments-status--${appointment.status.toLowerCase().replace("_", "-")}`}>
                  {getStatusLabel(appointment.status)}
                </span>
              </div>
              <div className="admin-appointments-row__action">
                <small>Acción</small>
                <Link to={`/admin/citas/${appointment.id}`}>Ver detalle</Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

export default AdminAppointments;
