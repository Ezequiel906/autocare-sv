import axios from "axios";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowRight,
  CalendarDays,
  CalendarPlus,
  CalendarX,
  CarFront,
  Clock3,
  RotateCcw,
  Wrench,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { useAuth } from "../context/AuthContext";
import "./ClientAppointments.css";

type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_SERVICE"
  | "COMPLETED"
  | "CANCELLED";

type Appointment = {
  id: number;
  date: string;
  status: AppointmentStatus;
  customerNotes: string | null;
  vehicle: {
    id: number;
    brand: string;
    model: string;
    year: number;
    plate: string;
    type: string;
    color: string | null;
  };
  services: Array<{
    id: number;
    name: string;
    slug: string;
    category: string;
    duration: number;
    price: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

type AppointmentsErrorType = "" | "invalid-session" | "forbidden" | "general";

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

function getBackendMessage(data: unknown) {
  if (typeof data !== "object" || data === null || !("message" in data)) return null;
  const message = data.message;
  if (typeof message === "string") return message;
  if (Array.isArray(message) && message.every((item) => typeof item === "string")) return message.join(" ");
  return null;
}

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

function ClientAppointments() {
  const { accessToken } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState("");
  const [appointmentsErrorType, setAppointmentsErrorType] = useState<AppointmentsErrorType>("");
  const [cancellingAppointmentId, setCancellingAppointmentId] = useState<number | null>(null);

  const loadAppointments = useCallback(async () => {
    setIsLoading(true);
    setAppointmentsError("");
    setAppointmentsErrorType("");

    if (!accessToken) {
      setAppointments([]);
      setAppointmentsError("Tu sesión no es válida. Inicia sesión nuevamente.");
      setAppointmentsErrorType("invalid-session");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.get<Appointment[]>(
        "/appointments",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      setAppointments(response.data);
    } catch (error) {
      setAppointments([]);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setAppointmentsError("Tu sesión expiró o no es válida.");
        setAppointmentsErrorType("invalid-session");
      } else if (axios.isAxiosError(error) && error.response?.status === 403) {
        setAppointmentsError("Tu cuenta no tiene permisos para consultar estas citas.");
        setAppointmentsErrorType("forbidden");
      } else {
        setAppointmentsError("No pudimos cargar tus citas. Inténtalo nuevamente.");
        setAppointmentsErrorType("general");
      }
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    // Initial synchronization with the authenticated appointments endpoint.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAppointments();
  }, [loadAppointments]);

  const cancelAppointment = async (appointment: Appointment) => {
    if (!accessToken || cancellingAppointmentId !== null) return;

    const appointmentDate = new Date(appointment.date);
    const result = await Swal.fire<boolean>({
      title: "¿Cancelar cita?",
      text: `${format(appointmentDate, "d 'de' MMMM 'de' yyyy", { locale: es })} · ${format(appointmentDate, "hh:mm a", { locale: es }).toUpperCase()}\n${appointment.vehicle.brand} ${appointment.vehicle.model} · ${appointment.vehicle.plate}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, cancelar cita",
      cancelButtonText: "Mantener cita",
      buttonsStyling: false,
      reverseButtons: true,
      focusCancel: true,
      showLoaderOnConfirm: true,
      allowOutsideClick: () => !Swal.isLoading(),
      customClass: alertClasses,
      preConfirm: async () => {
        setCancellingAppointmentId(appointment.id);
        try {
          await axios.patch(
            `/appointments/${appointment.id}/cancel`,
            undefined,
            { headers: { Authorization: `Bearer ${accessToken}` } },
          );
          return true;
        } catch (error) {
          let message = "No pudimos cancelar la cita. Inténtalo nuevamente.";
          if (axios.isAxiosError(error) && error.response?.status === 401) message = "Tu sesión expiró o no es válida.";
          else if (axios.isAxiosError(error) && error.response?.status === 403) message = "Tu cuenta no tiene permisos para realizar esta acción.";
          else if (axios.isAxiosError(error) && error.response?.status === 404) message = "La cita ya no está disponible.";
          else if (axios.isAxiosError(error) && error.response?.status === 409) message = getBackendMessage(error.response.data) ?? "Esta cita ya no puede cancelarse.";
          Swal.showValidationMessage(message);
          return false;
        } finally {
          setCancellingAppointmentId(null);
        }
      },
    });

    if (!result.isConfirmed || !result.value) return;
    await Swal.fire({
      title: "Cita cancelada",
      text: "La cita fue cancelada correctamente.",
      icon: "success",
      confirmButtonText: "Entendido",
      buttonsStyling: false,
      customClass: alertClasses,
    });
    await loadAppointments();
  };

  return (
    <div className="client-appointments">
      <header className="client-appointments__header">
        <div>
          <span>Agenda</span>
          <h1>Mis citas</h1>
          <p>Consulta y administra las citas de mantenimiento de tus vehículos.</p>
        </div>
        <Link className="client-appointments__schedule" to="/agendar-cita">
          <CalendarPlus size={18} aria-hidden="true" />
          Agendar cita
        </Link>
      </header>

      <section className="client-appointments__content" aria-labelledby="appointments-list-title">
        <div className="client-appointments__content-heading">
          <div>
            <span>Programación</span>
            <h2 id="appointments-list-title">Citas registradas</h2>
          </div>
          <Clock3 size={22} aria-hidden="true" />
        </div>

        <div className="client-appointments__list" aria-live="polite">
          {isLoading ? (
            <div className="client-appointments-empty" role="status">
              <div className="client-appointments-empty__visual" aria-hidden="true">
                <CalendarDays size={68} strokeWidth={1.45} />
              </div>
              <h3>Cargando tus citas...</h3>
              <p>Estamos consultando tu agenda de mantenimiento.</p>
            </div>
          ) : appointmentsError ? (
            <div className="client-appointments-empty" role="alert">
              <div className="client-appointments-empty__visual" aria-hidden="true">
                <RotateCcw size={60} strokeWidth={1.45} />
              </div>
              <h3>No pudimos cargar tus citas</h3>
              <p>{appointmentsError}</p>
              <button
                className="client-appointments__schedule"
                type="button"
                onClick={() => void loadAppointments()}
              >
                <RotateCcw size={18} aria-hidden="true" />
                Reintentar
              </button>
              {appointmentsErrorType === "invalid-session" && (
                <Link to="/login">Ir a iniciar sesión</Link>
              )}
            </div>
          ) : appointments.length === 0 ? (
            <div className="client-appointments-empty">
              <div className="client-appointments-empty__visual" aria-hidden="true">
                <span className="client-appointments-empty__calendar">
                  <CalendarDays size={68} strokeWidth={1.45} />
                </span>
                <span className="client-appointments-empty__plus">
                  <CalendarPlus size={24} />
                </span>
              </div>
              <span className="client-appointments-empty__label">Agenda disponible</span>
              <h3>No tienes citas programadas</h3>
              <p>
                Cuando programes una visita, aquí podrás consultar la información de tu
                próxima cita.
              </p>
              <Link to="/agendar-cita">
                <CalendarPlus size={18} aria-hidden="true" />
                Agendar una cita
              </Link>
            </div>
          ) : (
            <div className="client-appointments-cards">
              {appointments.map((appointment) => {
                const appointmentDate = new Date(appointment.date);
                const total = appointment.services.reduce(
                  (sum, service) => sum + Number(service.price),
                  0,
                );

                return (
                  <article className="client-appointment-card" key={appointment.id}>
                    <header className="client-appointment-card__header">
                      <div>
                        <small className="client-appointment-card__number">Cita #{appointment.id}</small>
                        <span className="client-appointment-card__date">
                          <CalendarDays size={17} aria-hidden="true" />
                          {format(appointmentDate, "d 'de' MMMM 'de' yyyy", { locale: es })}
                        </span>
                        <strong>
                          {format(appointmentDate, "hh:mm a", { locale: es }).toUpperCase()}
                        </strong>
                      </div>
                      <span
                        className={`client-appointment-card__status client-appointment-card__status--${appointment.status.toLowerCase().replace("_", "-")}`}
                      >
                        {getStatusLabel(appointment.status)}
                      </span>
                    </header>

                    <div className="client-appointment-card__vehicle">
                      <span aria-hidden="true"><CarFront size={22} /></span>
                      <div>
                        <small>Vehículo</small>
                        <strong>{appointment.vehicle.brand} {appointment.vehicle.model}</strong>
                        <p>{appointment.vehicle.plate}</p>
                      </div>
                    </div>

                    <div className="client-appointment-card__services">
                      <span className="client-appointment-card__section-label">
                        <Wrench size={15} aria-hidden="true" />
                        Servicios
                      </span>
                      <ul>
                        {appointment.services.map((service) => (
                          <li key={service.id}>
                            <span>{service.name}</span>
                            <strong>${service.price}</strong>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <footer className="client-appointment-card__footer">
                      <strong>Total: ${total.toFixed(2)}</strong>
                      <div className="client-appointment-card__actions">
                        {(appointment.status === "PENDING" || appointment.status === "CONFIRMED") && (
                          <button type="button" disabled={cancellingAppointmentId === appointment.id} onClick={() => void cancelAppointment(appointment)}>
                            <CalendarX size={16} aria-hidden="true" />
                            {cancellingAppointmentId === appointment.id ? "Cancelando..." : "Cancelar"}
                          </button>
                        )}
                        <Link to={`/cuenta/citas/${appointment.id}`}>
                          Ver detalles
                          <ArrowRight size={16} aria-hidden="true" />
                        </Link>
                      </div>
                    </footer>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default ClientAppointments;
