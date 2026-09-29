import axios from "axios";
import { addDays, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CalendarX,
  CarFront,
  CheckCircle2,
  Clock3,
  Mail,
  Phone,
  Play,
  RefreshCw,
  UserRound,
  Wrench,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { useAuth } from "../context/AuthContext";
import "./AdminAgenda.css";

type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_SERVICE"
  | "COMPLETED"
  | "CANCELLED";

type Customer = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
};

type Vehicle = {
  id: number;
  brand: string;
  model: string;
  year: number;
  plate: string;
  type: string;
  color: string | null;
  mileage: number | null;
};

type AppointmentService = {
  id: number;
  name: string;
  slug: string;
  category: string;
  price: string;
  duration: number;
};

type AdminAppointment = {
  id: number;
  date: string;
  status: AppointmentStatus;
  customer: Customer;
  vehicle: Vehicle;
  services: AppointmentService[];
  customerNotes: string | null;
  technicianNotes: string | null;
  mileage: number | null;
  observations: string | null;
  createdAt: string;
  updatedAt: string;
};

type AppointmentAction = "confirm" | "start" | "complete" | "cancel";

const today = format(new Date(), "yyyy-MM-dd");

const alertClasses = {
  container: "autocare-alert-container",
  popup: "autocare-alert",
  icon: "autocare-alert__icon",
  title: "autocare-alert__title",
  htmlContainer: "autocare-alert__content",
  actions: "autocare-alert__actions",
  confirmButton: "autocare-alert__button autocare-alert__button--danger",
  cancelButton: "autocare-alert__button autocare-alert__button--cancel",
};

function getStatusLabel(status: AppointmentStatus) {
  switch (status) {
    case "PENDING": return "Pendiente";
    case "CONFIRMED": return "Confirmada";
    case "IN_SERVICE": return "En servicio";
    case "COMPLETED": return "Completada";
    case "CANCELLED": return "Cancelada";
  }
}

function getActionContent(action: AppointmentAction, customerName: string) {
  switch (action) {
    case "confirm":
      return {
        title: "¿Confirmar esta cita?",
        text: `La cita de ${customerName} quedará confirmada.`,
        confirmText: "Confirmar cita",
        successTitle: "Cita confirmada",
        successText: "La cita fue confirmada correctamente.",
      };
    case "start":
      return {
        title: "¿Iniciar el servicio?",
        text: `La cita de ${customerName} pasará a estar en servicio.`,
        confirmText: "Iniciar servicio",
        successTitle: "Servicio iniciado",
        successText: "La cita ahora está en servicio.",
      };
    case "complete":
      return {
        title: "¿Completar el servicio?",
        text: `La cita de ${customerName} quedará marcada como completada.`,
        confirmText: "Completar servicio",
        successTitle: "Servicio completado",
        successText: "La cita fue completada correctamente.",
      };
    case "cancel":
      return {
        title: "¿Cancelar esta cita?",
        text: "Esta acción cambiará el estado de la cita a cancelada.",
        confirmText: "Cancelar cita",
        successTitle: "Cita cancelada",
        successText: "La cita fue cancelada correctamente.",
      };
  }
}

function getBackendMessage(data: unknown) {
  if (typeof data !== "object" || data === null || !("message" in data)) return null;
  const message = data.message;
  if (typeof message === "string") return message;
  if (Array.isArray(message) && message.every((item) => typeof item === "string")) {
    return message.join(" ");
  }
  return null;
}

function AdminAgenda() {
  const { accessToken, user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(today);
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [agendaError, setAgendaError] = useState("");
  const [updatingAppointmentId, setUpdatingAppointmentId] = useState<number | null>(null);

  const loadAppointments = useCallback(async () => {
    setIsLoading(true);
    setAgendaError("");

    if (!accessToken || !user) {
      setAppointments([]);
      setAgendaError("Tu sesión no es válida. Inicia sesión con una cuenta administrativa.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.get<AdminAppointment[]>(
        "/admin/appointments",
        {
          params: { date: selectedDate },
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      setAppointments(response.data);
    } catch (error) {
      setAppointments([]);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setAgendaError("Tu sesión expiró o no es válida. Inicia sesión nuevamente.");
      } else if (axios.isAxiosError(error) && error.response?.status === 403) {
        setAgendaError("Tu cuenta no tiene permisos para consultar la agenda administrativa.");
      } else {
        setAgendaError("No pudimos cargar la agenda. Intenta nuevamente.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, selectedDate, user]);

  useEffect(() => {
    // Synchronize the administrative agenda whenever its date changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAppointments();
  }, [loadAppointments]);

  const changeDay = (amount: number) => {
    setSelectedDate(format(addDays(parseISO(selectedDate), amount), "yyyy-MM-dd"));
  };

  const handleAppointmentAction = async (
    appointment: AdminAppointment,
    action: AppointmentAction,
  ) => {
    if (!accessToken) return;

    const content = getActionContent(action, appointment.customer.name);
    const result = await Swal.fire<boolean>({
      title: content.title,
      text: content.text,
      icon: action === "cancel" ? "warning" : "question",
      showCancelButton: true,
      confirmButtonText: content.confirmText,
      cancelButtonText: action === "cancel" ? "Volver" : "Cancelar",
      buttonsStyling: false,
      reverseButtons: true,
      focusCancel: true,
      showLoaderOnConfirm: true,
      allowOutsideClick: () => !Swal.isLoading(),
      customClass: alertClasses,
      preConfirm: async () => {
        setUpdatingAppointmentId(appointment.id);
        try {
          await axios.patch(
            `/appointments/${appointment.id}/${action}`,
            undefined,
            { headers: { Authorization: `Bearer ${accessToken}` } },
          );
          return true;
        } catch (error) {
          let message = "No pudimos actualizar la cita. Inténtalo nuevamente.";
          if (axios.isAxiosError(error) && error.response?.status === 401) {
            message = "Tu sesión expiró o no es válida.";
          } else if (axios.isAxiosError(error) && error.response?.status === 403) {
            message = "Tu cuenta no tiene permisos para realizar esta acción.";
          } else if (axios.isAxiosError(error) && error.response?.status === 409) {
            message = getBackendMessage(error.response.data) ?? "La cita ya no puede cambiar a ese estado.";
          }
          Swal.showValidationMessage(message);
          return false;
        } finally {
          setUpdatingAppointmentId(null);
        }
      },
    });

    if (!result.isConfirmed || !result.value) return;

    await Swal.fire({
      title: content.successTitle,
      text: content.successText,
      icon: "success",
      confirmButtonText: "Entendido",
      buttonsStyling: false,
      customClass: alertClasses,
    });
    await loadAppointments();
  };

  const pendingCount = appointments.filter((item) => item.status === "PENDING").length;
  const confirmedCount = appointments.filter((item) => item.status === "CONFIRMED").length;
  const inServiceCount = appointments.filter((item) => item.status === "IN_SERVICE").length;
  const completedCount = appointments.filter((item) => item.status === "COMPLETED").length;
  const cancelledCount = appointments.filter((item) => item.status === "CANCELLED").length;

  return (
    <div className="admin-agenda">
      <header className="admin-agenda__header">
        <div>
          <span>Operación diaria</span>
          <h1>Agenda</h1>
          <p>Gestiona las citas programadas y el estado de atención de los clientes.</p>
        </div>
        <div className="admin-agenda-date-control">
          <button type="button" aria-label="Día anterior" onClick={() => changeDay(-1)}>
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
          <label>
            <span>Fecha de la agenda</span>
            <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
          </label>
          <button type="button" aria-label="Día siguiente" onClick={() => changeDay(1)}>
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      </header>

      {isLoading ? (
        <div className="admin-agenda-loading" role="status" aria-label="Cargando agenda">
          <span /><span /><span />
        </div>
      ) : agendaError ? (
        <section className="admin-agenda-state" role="alert">
          <RefreshCw size={38} aria-hidden="true" />
          <h2>No pudimos mostrar la agenda</h2>
          <p>{agendaError}</p>
          <div>
            <Link to="/login">Ir al login</Link>
            <button type="button" onClick={() => void loadAppointments()}>
              <RefreshCw size={17} aria-hidden="true" /> Reintentar
            </button>
          </div>
        </section>
      ) : (
        <>
          <section className="admin-agenda-summary" aria-label="Resumen del día">
            <article><span>Total</span><strong>{appointments.length}</strong></article>
            <article><span>Pendientes</span><strong>{pendingCount}</strong></article>
            <article><span>Confirmadas</span><strong>{confirmedCount}</strong></article>
            <article><span>En servicio</span><strong>{inServiceCount}</strong></article>
            <article><span>Completadas</span><strong>{completedCount}</strong></article>
            <article><span>Canceladas</span><strong>{cancelledCount}</strong></article>
          </section>

          <section className="admin-agenda-content" aria-labelledby="admin-agenda-list-title">
            <div className="admin-agenda-content__heading">
              <div>
                <span>{format(parseISO(selectedDate), "EEEE, d 'de' MMMM", { locale: es })}</span>
                <h2 id="admin-agenda-list-title">Citas programadas</h2>
              </div>
              <CalendarDays size={22} aria-hidden="true" />
            </div>

            {appointments.length === 0 ? (
              <div className="admin-agenda-empty">
                <CalendarDays size={48} aria-hidden="true" />
                <h3>No hay citas para este día</h3>
                <p>No existen citas programadas para la fecha seleccionada.</p>
              </div>
            ) : (
              <div className="admin-agenda-list">
                {appointments.map((appointment) => (
                  <article className="admin-agenda-card" key={appointment.id}>
                    <div className="admin-agenda-card__time">
                      <Clock3 size={19} aria-hidden="true" />
                      <time dateTime={appointment.date}>
                        {format(new Date(appointment.date), "hh:mm a", { locale: es }).toUpperCase()}
                      </time>
                    </div>

                    <div className="admin-agenda-card__body">
                      <header>
                        <div>
                          <span>Cita #{appointment.id}</span>
                          <h3>{appointment.customer.name}</h3>
                        </div>
                        <span className={`admin-agenda-status admin-agenda-status--${appointment.status.toLowerCase().replace("_", "-")}`}>
                          {getStatusLabel(appointment.status)}
                        </span>
                      </header>

                      <div className="admin-agenda-card__details">
                        <section>
                          <span className="admin-agenda-card__icon"><UserRound size={18} aria-hidden="true" /></span>
                          <div>
                            <small>Cliente</small>
                            <strong>{appointment.customer.name}</strong>
                            <p><Mail size={13} aria-hidden="true" /> {appointment.customer.email}</p>
                            {appointment.customer.phone && <p><Phone size={13} aria-hidden="true" /> {appointment.customer.phone}</p>}
                          </div>
                        </section>
                        <section>
                          <span className="admin-agenda-card__icon"><CarFront size={18} aria-hidden="true" /></span>
                          <div>
                            <small>Vehículo</small>
                            <strong>{appointment.vehicle.brand} {appointment.vehicle.model} · {appointment.vehicle.year}</strong>
                            <p>Placa: {appointment.vehicle.plate}</p>
                            {appointment.vehicle.color && <p>Color: {appointment.vehicle.color}</p>}
                            {appointment.vehicle.mileage !== null && <p>{appointment.vehicle.mileage.toLocaleString("es-SV")} km</p>}
                          </div>
                        </section>
                      </div>

                      <div className="admin-agenda-card__services">
                        <span><Wrench size={15} aria-hidden="true" /> Servicios</span>
                        <ul>
                          {appointment.services.map((service) => (
                            <li key={service.id}>
                              <span>{service.name}<small>{service.duration} min</small></span>
                              <strong>${service.price}</strong>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {appointment.customerNotes && (
                        <div className="admin-agenda-card__notes">
                          <span>Notas del cliente</span>
                          <p>{appointment.customerNotes}</p>
                        </div>
                      )}

                      <footer className="admin-agenda-card__actions">
                        <Link className="admin-agenda-card__detail" to={`/admin/citas/${appointment.id}`}>
                          Ver detalle <ArrowRight size={17} aria-hidden="true" />
                        </Link>
                        <div>
                          {appointment.status === "PENDING" && (
                            <button type="button" disabled={updatingAppointmentId !== null} onClick={() => void handleAppointmentAction(appointment, "confirm")}>
                              <CheckCircle2 size={17} aria-hidden="true" /> Confirmar
                            </button>
                          )}
                          {appointment.status === "CONFIRMED" && (
                            <button type="button" disabled={updatingAppointmentId !== null} onClick={() => void handleAppointmentAction(appointment, "start")}>
                              <Play size={17} aria-hidden="true" /> Iniciar servicio
                            </button>
                          )}
                          {appointment.status === "IN_SERVICE" && (
                            <button type="button" disabled={updatingAppointmentId !== null} onClick={() => void handleAppointmentAction(appointment, "complete")}>
                              <CheckCircle2 size={17} aria-hidden="true" /> Completar servicio
                            </button>
                          )}
                          {(appointment.status === "PENDING" || appointment.status === "CONFIRMED") && (
                            <button className="admin-agenda-card__cancel" type="button" disabled={updatingAppointmentId !== null} onClick={() => void handleAppointmentAction(appointment, "cancel")}>
                              <CalendarX size={17} aria-hidden="true" /> Cancelar
                            </button>
                          )}
                        </div>
                      </footer>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default AdminAgenda;
