import axios from "axios";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft,
  CalendarDays,
  CalendarX,
  CarFront,
  ClipboardList,
  FileText,
  RotateCcw,
  Wrench,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { useAuth } from "../context/AuthContext";
import "./ClientAppointmentDetail.css";

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
    mileage?: number | null;
  };
  services: Array<{
    id: number;
    name: string;
    slug: string;
    category: string;
    duration: number;
    price: string;
  }>;
  mileage?: number | null;
  serviceHistory?: {
    id: number;
    date: string;
    mileage: number | null;
    description: string;
    observations: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
};

type DetailState = "ready" | "invalid-id" | "not-found" | "invalid-session" | "forbidden" | "error";

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

function getVehicleTypeLabel(type: string) {
  switch (type) {
    case "automovil":
      return "Automóvil";
    case "suv":
      return "SUV";
    case "pickup":
      return "Pickup";
    case "camioneta":
      return "Camioneta";
    case "motocicleta":
      return "Motocicleta";
    default:
      return type;
  }
}

function ClientAppointmentDetail() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [detailState, setDetailState] = useState<DetailState>("ready");
  const [isCancelling, setIsCancelling] = useState(false);

  const loadAppointment = useCallback(async () => {
    setIsLoading(true);
    setAppointment(null);
    setDetailState("ready");

    if (!accessToken) {
      setDetailState("invalid-session");
      setIsLoading(false);
      return;
    }

    const appointmentId = Number(id);
    const isValidId =
      typeof id === "string" &&
      /^\d+$/.test(id) &&
      Number.isSafeInteger(appointmentId) &&
      appointmentId > 0;

    if (!isValidId) {
      setDetailState("invalid-id");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.get<Appointment>(
        `/appointments/${appointmentId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      setAppointment(response.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        setDetailState("not-found");
      } else if (axios.isAxiosError(error) && error.response?.status === 401) {
        setDetailState("invalid-session");
      } else if (axios.isAxiosError(error) && error.response?.status === 403) {
        setDetailState("forbidden");
      } else {
        setDetailState("error");
      }
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, id]);

  useEffect(() => {
    // Synchronize the detail whenever the appointment route changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAppointment();
  }, [loadAppointment]);

  const handleCancelAppointment = async () => {
    if (!appointment) {
      return;
    }

    if (!accessToken) {
      const sessionResult = await Swal.fire({
        title: "Sesión no válida",
        text: "Tu sesión no es válida. Inicia sesión nuevamente.",
        icon: "error",
        showCancelButton: true,
        confirmButtonText: "Ir a iniciar sesión",
        cancelButtonText: "Cerrar",
        buttonsStyling: false,
        customClass: alertClasses,
      });

      if (sessionResult.isConfirmed) {
        navigate("/login");
      }
      return;
    }

    const appointmentDate = new Date(appointment.date);
    const servicesLabel = appointment.services
      .map((service) => service.name)
      .join(", ");

    const result = await Swal.fire<boolean>({
      title: "¿Cancelar cita?",
      text: `¿Estás seguro de que deseas cancelar esta cita?\n\n${format(appointmentDate, "d 'de' MMMM 'de' yyyy", { locale: es })} · ${format(appointmentDate, "hh:mm a", { locale: es }).toUpperCase()}\n${appointment.vehicle.brand} ${appointment.vehicle.model} · ${appointment.vehicle.plate}\n${servicesLabel}`,
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
        setIsCancelling(true);

        try {
          await axios.patch(
            `/appointments/${appointment.id}/cancel`,
            undefined,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            },
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
          setIsCancelling(false);
        }
      },
    });

    if (!result.isConfirmed || !result.value) {
      return;
    }

    await Swal.fire({
      title: "Cita cancelada",
      text: "La cita fue cancelada correctamente.",
      icon: "success",
      confirmButtonText: "Entendido",
      buttonsStyling: false,
      customClass: alertClasses,
    });

    await loadAppointment();
  };

  const renderRequestState = () => {
    if (isLoading) {
      return (
        <div className="appointment-detail-loading" role="status" aria-label="Cargando detalle de la cita">
          <span /><span /><span /><span />
        </div>
      );
    }

    if (detailState === "not-found" || detailState === "invalid-id") {
      return (
        <section className="appointment-detail-empty" aria-labelledby="appointment-not-found-title">
          <div className="appointment-detail-empty__visual" aria-hidden="true">
            <CalendarDays size={70} strokeWidth={1.4} />
          </div>
          <span className="appointment-detail-empty__label">Cita no disponible</span>
          <h2 id="appointment-not-found-title">La cita no fue encontrada</h2>
          <p>Verifica el enlace o vuelve a tu agenda para consultar tus citas registradas.</p>
          <div className="appointment-detail-empty__actions">
            <Link className="appointment-detail-button appointment-detail-button--primary" to="/cuenta/citas">
              <ArrowLeft size={18} aria-hidden="true" />
              Volver a mis citas
            </Link>
          </div>
        </section>
      );
    }

    if (detailState === "invalid-session") {
      return (
        <section className="appointment-detail-empty" aria-labelledby="appointment-session-title">
          <div className="appointment-detail-empty__visual" aria-hidden="true">
            <FileText size={62} strokeWidth={1.4} />
          </div>
          <span className="appointment-detail-empty__label">Sesión no válida</span>
          <h2 id="appointment-session-title">Inicia sesión nuevamente</h2>
          <p>Tu sesión no es válida y no pudimos consultar la información de esta cita.</p>
          <div className="appointment-detail-empty__actions">
            <Link className="appointment-detail-button appointment-detail-button--primary" to="/login">
              Ir a iniciar sesión
            </Link>
          </div>
        </section>
      );
    }

    if (detailState === "forbidden") {
      return (
        <section className="appointment-detail-empty" role="alert" aria-labelledby="appointment-forbidden-title">
          <div className="appointment-detail-empty__visual" aria-hidden="true"><FileText size={62} strokeWidth={1.4} /></div>
          <span className="appointment-detail-empty__label">Acceso no autorizado</span>
          <h2 id="appointment-forbidden-title">No puedes consultar esta cita</h2>
          <p>Tu cuenta no tiene permisos para consultar esta cita.</p>
          <div className="appointment-detail-empty__actions"><Link className="appointment-detail-button appointment-detail-button--secondary" to="/cuenta/citas"><ArrowLeft size={18} aria-hidden="true" />Volver a mis citas</Link></div>
        </section>
      );
    }

    if (detailState === "error") {
      return (
        <section className="appointment-detail-empty" role="alert" aria-labelledby="appointment-error-title">
          <div className="appointment-detail-empty__visual" aria-hidden="true">
            <RotateCcw size={62} strokeWidth={1.4} />
          </div>
          <span className="appointment-detail-empty__label">No disponible</span>
          <h2 id="appointment-error-title">No pudimos cargar la información de esta cita.</h2>
          <p>Inténtalo nuevamente o vuelve a tu lista de citas.</p>
          <div className="appointment-detail-empty__actions">
            <Link className="appointment-detail-button appointment-detail-button--secondary" to="/cuenta/citas">
              <ArrowLeft size={18} aria-hidden="true" />
              Volver a mis citas
            </Link>
            <button
              className="appointment-detail-button appointment-detail-button--primary"
              type="button"
              onClick={() => void loadAppointment()}
            >
              <RotateCcw size={18} aria-hidden="true" />
              Reintentar
            </button>
          </div>
        </section>
      );
    }

    return null;
  };

  const total = appointment?.services.reduce(
    (sum, service) => sum + Number(service.price),
    0,
  );

  return (
    <div className="client-appointment-detail">
      <nav className="client-appointment-detail__breadcrumb" aria-label="Ruta de navegación">
        <Link to="/cuenta/citas">
          <ArrowLeft size={16} aria-hidden="true" />
          Mis citas
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Detalle de cita</span>
      </nav>

      <header className="client-appointment-detail__header">
        <span>Agenda</span>
        <h1>Detalle de cita</h1>
        <p>Consulta la información completa de tu cita de mantenimiento.</p>
      </header>

      {!appointment ? renderRequestState() : (
        <section className="appointment-detail-structure" aria-labelledby="appointment-detail-structure-title">
          <div className="appointment-detail-structure__heading">
            <span>Cita #{appointment.id}</span>
            <h2 id="appointment-detail-structure-title">Información de la cita</h2>
            <p>Revisa los datos de tu visita, vehículo y servicios solicitados.</p>
          </div>

          <div className="appointment-detail-grid">
            <article className="appointment-detail-section-card">
              <span className="appointment-detail-section-card__icon" aria-hidden="true">
                <ClipboardList size={23} />
              </span>
              <div className="appointment-detail-section-card__content">
                <div className="appointment-detail-section-card__title">
                  <h3>Información de la cita</h3>
                  <span
                    className={`appointment-detail-status appointment-detail-status--${appointment.status.toLowerCase().replace("_", "-")}`}
                  >
                    {getStatusLabel(appointment.status)}
                  </span>
                </div>
                <dl className="appointment-detail-data">
                  <div>
                    <dt>Fecha</dt>
                    <dd>{format(new Date(appointment.date), "d 'de' MMMM 'de' yyyy", { locale: es })}</dd>
                  </div>
                  <div>
                    <dt>Hora</dt>
                    <dd>{format(new Date(appointment.date), "hh:mm a", { locale: es }).toUpperCase()}</dd>
                  </div>
                  <div>
                    <dt>Solicitada</dt>
                    <dd>{format(new Date(appointment.createdAt), "d 'de' MMMM 'de' yyyy", { locale: es })}</dd>
                  </div>
                </dl>
              </div>
            </article>

            <article className="appointment-detail-section-card">
              <span className="appointment-detail-section-card__icon" aria-hidden="true">
                <CarFront size={23} />
              </span>
              <div className="appointment-detail-section-card__content">
                <h3>Vehículo</h3>
                <dl className="appointment-detail-data appointment-detail-data--vehicle">
                  <div><dt>Vehículo</dt><dd>{appointment.vehicle.brand} {appointment.vehicle.model}</dd></div>
                  <div><dt>Año</dt><dd>{appointment.vehicle.year}</dd></div>
                  <div><dt>Placa</dt><dd>{appointment.vehicle.plate}</dd></div>
                  <div><dt>Tipo</dt><dd>{getVehicleTypeLabel(appointment.vehicle.type)}</dd></div>
                  <div><dt>Color</dt><dd>{appointment.vehicle.color ?? "No registrado"}</dd></div>
                  <div><dt>Kilometraje del vehículo</dt><dd>{appointment.vehicle.mileage == null ? "Sin información registrada" : `${appointment.vehicle.mileage.toLocaleString("es-SV")} km`}</dd></div>
                  <div><dt>Kilometraje de esta cita</dt><dd>{appointment.mileage == null ? "Sin información registrada" : `${appointment.mileage.toLocaleString("es-SV")} km`}</dd></div>
                </dl>
              </div>
            </article>

            <article className="appointment-detail-section-card appointment-detail-section-card--wide">
              <span className="appointment-detail-section-card__icon" aria-hidden="true">
                <Wrench size={23} />
              </span>
              <div className="appointment-detail-section-card__content">
                <h3>Servicios</h3>
                <div className="appointment-detail-services">
                  {appointment.services.length > 0 ? appointment.services.map((service) => (
                    <div key={service.id}>
                      <span>
                        <strong>{service.name}</strong>
                        <small>{service.category} · {service.duration} min</small>
                      </span>
                      <strong>${service.price}</strong>
                    </div>
                  )) : <p>Sin información registrada</p>}
                </div>
                {appointment.services.length > 0 && <div className="appointment-detail-total"><span>Total</span><strong>${total?.toFixed(2)}</strong></div>}
              </div>
            </article>

            <article className="appointment-detail-section-card appointment-detail-section-card--wide">
              <span className="appointment-detail-section-card__icon" aria-hidden="true"><FileText size={23} /></span>
              <div className="appointment-detail-section-card__content"><h3>Notas de tu solicitud</h3><p>{appointment.customerNotes?.trim() || "Sin información registrada"}</p></div>
            </article>

            <article className="appointment-detail-section-card appointment-detail-section-card--wide">
              <span className="appointment-detail-section-card__icon" aria-hidden="true"><ClipboardList size={23} /></span>
              <div className="appointment-detail-section-card__content">
                <h3>Historial del servicio</h3>
                {appointment.serviceHistory ? (
                  <dl className="appointment-detail-data">
                    <div><dt>Fecha</dt><dd>{format(new Date(appointment.serviceHistory.date), "d 'de' MMMM 'de' yyyy", { locale: es })}</dd></div>
                    <div><dt>Kilometraje</dt><dd>{appointment.serviceHistory.mileage === null ? "Sin información registrada" : `${appointment.serviceHistory.mileage.toLocaleString("es-SV")} km`}</dd></div>
                    <div><dt>Descripción</dt><dd>{appointment.serviceHistory.description}</dd></div>
                    <div><dt>Observaciones del servicio</dt><dd>{appointment.serviceHistory.observations?.trim() || "Sin información registrada"}</dd></div>
                  </dl>
                ) : <p>Esta cita todavía no tiene historial de servicio.</p>}
              </div>
            </article>
          </div>

          <div className="appointment-detail-structure__actions">
            <Link className="appointment-detail-button appointment-detail-button--secondary" to="/cuenta/citas">
              <ArrowLeft size={18} aria-hidden="true" />
              Volver a mis citas
            </Link>
            {(appointment.status === "PENDING" || appointment.status === "CONFIRMED") && (
              <button
                className="appointment-detail-button appointment-detail-button--primary"
                type="button"
                disabled={isCancelling}
                onClick={() => void handleCancelAppointment()}
              >
                <CalendarX size={18} aria-hidden="true" />
                {isCancelling ? "Cancelando cita..." : "Cancelar cita"}
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

export default ClientAppointmentDetail;
