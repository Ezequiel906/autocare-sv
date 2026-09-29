import axios from "axios";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  Activity,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CarFront,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  RefreshCw,
  Settings2,
  UsersRound,
  Wrench,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import "./AdminDashboard.css";

type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_SERVICE"
  | "COMPLETED"
  | "CANCELLED";

type AdminDashboardResponse = {
  appointmentsSummary: {
    todayAppointments: number;
    pendingAppointments: number;
    confirmedAppointments: number;
    inServiceAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
  };
  generalSummary: {
    totalCustomers: number;
    totalVehicles: number;
    totalServices: number;
    totalCompletedAppointments: number;
  };
  revenue: {
    todayRevenue: string;
    totalRevenue: string;
  };
  todaySchedule: Array<{
    id: number;
    date: string;
    status: AppointmentStatus;
    customer: {
      id: number;
      name: string;
    };
    vehicle: {
      id: number;
      brand: string;
      model: string;
      year: number;
      plate: string;
    };
    services: Array<{
      id: number;
      name: string;
      price: string;
    }>;
  }>;
  weeklyStats: Array<{
    date: string;
    appointments: number;
    completed: number;
    revenue: string;
  }>;
};

function getStatusLabel(status: AppointmentStatus) {
  switch (status) {
    case "PENDING":
      return "Pendiente";
    case "CONFIRMED":
      return "Confirmada";
    case "IN_SERVICE":
      return "En servicio";
    case "COMPLETED":
      return "Completada";
    case "CANCELLED":
      return "Cancelada";
  }
}

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number(value));
}

function formatWeekday(value: string) {
  const label = format(parseISO(value), "EEE", { locale: es }).replace(".", "");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function AdminDashboard() {
  const { accessToken } = useAuth();
  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setDashboardError("");

    if (!accessToken) {
      setDashboard(null);
      setDashboardError("Tu sesión no es válida. Inicia sesión con una cuenta administrativa.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.get<AdminDashboardResponse>(
        "/admin/dashboard",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      setDashboard(response.data);
    } catch (error) {
      setDashboard(null);
      setDashboardError(
        axios.isAxiosError(error) && error.response?.status === 403
          ? "Tu cuenta no tiene permisos para consultar el dashboard administrativo."
          : "No pudimos cargar el dashboard. Inténtalo nuevamente.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    // Initial synchronization with the administrative dashboard endpoint.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDashboard();
  }, [loadDashboard]);

  if (isLoading) {
    return (
      <div className="admin-dashboard" aria-busy="true">
        <header className="admin-dashboard__header">
          <div>
            <span>Panel administrativo</span>
            <h1>Dashboard</h1>
            <p>Cargando la operación actual de AutoCare SV...</p>
          </div>
        </header>
        <div className="admin-dashboard-skeletons" aria-label="Cargando dashboard">
          <span /><span /><span /><span /><span /><span />
        </div>
      </div>
    );
  }

  if (dashboardError || !dashboard) {
    return (
      <div className="admin-dashboard">
        <section className="admin-dashboard-state" role="alert">
          <RefreshCw size={38} aria-hidden="true" />
          <h1>No pudimos mostrar el dashboard</h1>
          <p>{dashboardError}</p>
          <button type="button" onClick={() => void loadDashboard()}>
            <RefreshCw size={17} aria-hidden="true" />
            Reintentar
          </button>
        </section>
      </div>
    );
  }

  const weeklyChartData = dashboard.weeklyStats.map((day) => ({
    ...day,
    revenueValue: Number(day.revenue),
  }));

  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard__header">
        <div>
          <span>Panel administrativo</span>
          <h1>Dashboard</h1>
          <p>Resumen operativo y financiero de AutoCare SV.</p>
        </div>
        <span className="admin-dashboard__date">
          <CalendarDays size={18} aria-hidden="true" />
          {format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es })}
        </span>
      </header>

      <section className="admin-dashboard-section" aria-labelledby="appointments-summary-title">
        <div className="admin-dashboard-section__heading">
          <div>
            <span>Operación de hoy</span>
            <h2 id="appointments-summary-title">Resumen de citas</h2>
          </div>
          <CalendarClock size={22} aria-hidden="true" />
        </div>
        <div className="admin-metrics-grid">
          <article className="admin-metric-card admin-metric-card--featured">
            <span className="admin-metric-card__icon"><CalendarDays size={22} aria-hidden="true" /></span>
            <p>Citas de hoy</p>
            <strong>{dashboard.appointmentsSummary.todayAppointments}</strong>
          </article>
          <article className="admin-metric-card">
            <span className="admin-metric-card__icon"><Clock3 size={22} aria-hidden="true" /></span>
            <p>Pendientes</p>
            <strong>{dashboard.appointmentsSummary.pendingAppointments}</strong>
          </article>
          <article className="admin-metric-card">
            <span className="admin-metric-card__icon"><CalendarCheck size={22} aria-hidden="true" /></span>
            <p>Confirmadas</p>
            <strong>{dashboard.appointmentsSummary.confirmedAppointments}</strong>
          </article>
          <article className="admin-metric-card">
            <span className="admin-metric-card__icon"><Activity size={22} aria-hidden="true" /></span>
            <p>En servicio</p>
            <strong>{dashboard.appointmentsSummary.inServiceAppointments}</strong>
          </article>
          <article className="admin-metric-card">
            <span className="admin-metric-card__icon"><CheckCircle2 size={22} aria-hidden="true" /></span>
            <p>Completadas</p>
            <strong>{dashboard.appointmentsSummary.completedAppointments}</strong>
          </article>
          <article className="admin-metric-card">
            <span className="admin-metric-card__icon"><XCircle size={22} aria-hidden="true" /></span>
            <p>Canceladas</p>
            <strong>{dashboard.appointmentsSummary.cancelledAppointments}</strong>
          </article>
        </div>
      </section>

      <div className="admin-dashboard-overview">
        <section className="admin-dashboard-panel" aria-labelledby="general-summary-title">
          <div className="admin-dashboard-section__heading">
            <div>
              <span>Información general</span>
              <h2 id="general-summary-title">Estado del negocio</h2>
            </div>
            <Settings2 size={21} aria-hidden="true" />
          </div>
          <dl className="admin-general-summary">
            <div><dt><UsersRound size={18} aria-hidden="true" /> Clientes</dt><dd>{dashboard.generalSummary.totalCustomers}</dd></div>
            <div><dt><CarFront size={18} aria-hidden="true" /> Vehículos</dt><dd>{dashboard.generalSummary.totalVehicles}</dd></div>
            <div><dt><Wrench size={18} aria-hidden="true" /> Servicios activos</dt><dd>{dashboard.generalSummary.totalServices}</dd></div>
            <div><dt><CheckCircle2 size={18} aria-hidden="true" /> Citas completadas</dt><dd>{dashboard.generalSummary.totalCompletedAppointments}</dd></div>
          </dl>
        </section>

        <section className="admin-dashboard-panel" aria-labelledby="revenue-summary-title">
          <div className="admin-dashboard-section__heading">
            <div>
              <span>Ingresos</span>
              <h2 id="revenue-summary-title">Resumen financiero</h2>
            </div>
            <CircleDollarSign size={21} aria-hidden="true" />
          </div>
          <div className="admin-revenue-summary">
            <div><span>Ingresos de hoy</span><strong>{formatCurrency(dashboard.revenue.todayRevenue)}</strong></div>
            <div><span>Ingresos totales</span><strong>{formatCurrency(dashboard.revenue.totalRevenue)}</strong></div>
          </div>
        </section>
      </div>

      <section className="admin-dashboard-panel" aria-labelledby="today-schedule-title">
        <div className="admin-dashboard-section__heading">
          <div>
            <span>Agenda</span>
            <h2 id="today-schedule-title">Citas de hoy</h2>
          </div>
          <CalendarDays size={21} aria-hidden="true" />
        </div>
        {dashboard.todaySchedule.length === 0 ? (
          <div className="admin-schedule-empty">
            <CalendarCheck size={34} aria-hidden="true" />
            <p>No hay citas programadas para hoy.</p>
          </div>
        ) : (
          <div className="admin-schedule-list">
            {dashboard.todaySchedule.map((appointment) => (
              <article className="admin-schedule-item" key={appointment.id}>
                <time dateTime={appointment.date}>
                  {format(new Date(appointment.date), "hh:mm a", { locale: es }).toUpperCase()}
                </time>
                <div className="admin-schedule-item__customer">
                  <small>Cliente</small>
                  <strong>{appointment.customer.name}</strong>
                </div>
                <div className="admin-schedule-item__vehicle">
                  <small>Vehículo</small>
                  <strong>{appointment.vehicle.brand} {appointment.vehicle.model} · {appointment.vehicle.year}</strong>
                  <span>{appointment.vehicle.plate}</span>
                </div>
                <div className="admin-schedule-item__services">
                  <small>Servicios</small>
                  {appointment.services.map((service) => (
                    <span key={service.id}>{service.name} · {formatCurrency(service.price)}</span>
                  ))}
                </div>
                <span className={`admin-schedule-status admin-schedule-status--${appointment.status.toLowerCase().replace("_", "-")}`}>
                  {getStatusLabel(appointment.status)}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="admin-dashboard-panel" aria-labelledby="weekly-stats-title">
        <div className="admin-dashboard-section__heading">
          <div>
            <span>Últimos 7 días</span>
            <h2 id="weekly-stats-title">Actividad semanal</h2>
          </div>
          <Activity size={21} aria-hidden="true" />
        </div>
        <div className="admin-weekly-chart">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={weeklyChartData} margin={{ top: 12, right: 8, left: -18, bottom: 0 }} accessibilityLayer>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="date" tickFormatter={formatWeekday} tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="counts" allowDecimals={false} tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="revenue" orientation="right" tickFormatter={(value: number) => `$${value}`} tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip labelFormatter={(value) => format(parseISO(String(value)), "EEEE, d 'de' MMMM", { locale: es })} />
              <Legend />
              <Bar yAxisId="counts" dataKey="appointments" name="Citas" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="counts" dataKey="completed" name="Completadas" fill="var(--color-success)" radius={[4, 4, 0, 0]} />
              <Line yAxisId="revenue" type="monotone" dataKey="revenueValue" name="Ingresos ($)" stroke="var(--color-accent)" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

export default AdminDashboard;
