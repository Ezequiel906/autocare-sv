import axios from "axios";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft,
  CalendarX,
  CarFront,
  CheckCircle2,
  ClipboardList,
  FileText,
  History,
  Mail,
  Phone,
  Play,
  RefreshCw,
  UserRound,
  Wrench,
} from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { useAuth } from "../context/AuthContext";
import "./AdminAppointmentDetail.css";

type AppointmentStatus = "PENDING" | "CONFIRMED" | "IN_SERVICE" | "COMPLETED" | "CANCELLED";
type AppointmentAction = "confirm" | "start" | "complete" | "cancel";

type AdminAppointmentDetailResponse = {
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
  serviceHistory: {
    id: number;
    date: string;
    mileage: number | null;
    description: string;
    observations: string | null;
  } | null;
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
    case "confirm": return { title: "¿Confirmar esta cita?", text: `La cita de ${customerName} quedará confirmada.`, confirm: "Confirmar cita", success: "Cita confirmada" };
    case "start": return { title: "¿Iniciar el servicio?", text: `La cita de ${customerName} pasará a estar en servicio.`, confirm: "Iniciar servicio", success: "Servicio iniciado" };
    case "complete": return { title: "¿Completar el servicio?", text: `La cita de ${customerName} quedará marcada como completada.`, confirm: "Completar servicio", success: "Servicio completado" };
    case "cancel": return { title: "¿Cancelar esta cita?", text: "Esta acción cambiará el estado de la cita a cancelada.", confirm: "Cancelar cita", success: "Cita cancelada" };
  }
}

function getBackendMessage(data: unknown) {
  if (typeof data !== "object" || data === null || !("message" in data)) return null;
  const message = data.message;
  if (typeof message === "string") return message;
  if (Array.isArray(message) && message.every((item) => typeof item === "string")) return message.join(" ");
  return null;
}

function AdminAppointmentDetail() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuth();
  const [appointment, setAppointment] = useState<AdminAppointmentDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [detailState, setDetailState] = useState<DetailState>("ready");
  const [isUpdating, setIsUpdating] = useState(false);
  const [technicianNotes, setTechnicianNotes] = useState("");
  const [mileage, setMileage] = useState("");
  const [observations, setObservations] = useState("");
  const [isSavingWorkData, setIsSavingWorkData] = useState(false);

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
    if (typeof id !== "string" || !/^\d+$/.test(id) || !Number.isSafeInteger(appointmentId) || appointmentId <= 0) {
      setDetailState("invalid-id");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.get<AdminAppointmentDetailResponse>(
        `/admin/appointments/${appointmentId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      setAppointment(response.data);
      setTechnicianNotes(response.data.technicianNotes ?? "");
      setMileage(response.data.mileage === null ? "" : String(response.data.mileage));
      setObservations(response.data.observations ?? "");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) setDetailState("invalid-session");
      else if (axios.isAxiosError(error) && error.response?.status === 403) setDetailState("forbidden");
      else if (axios.isAxiosError(error) && error.response?.status === 404) setDetailState("not-found");
      else setDetailState("error");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, id]);

  useEffect(() => {
    // Synchronize the administrative detail whenever its route ID changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAppointment();
  }, [loadAppointment]);

  const handleSaveWorkData = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!appointment || !accessToken || isSavingWorkData) return;

    const normalizedMileage = mileage.trim();
    const parsedMileage = normalizedMileage === "" ? null : Number(normalizedMileage);
    if (parsedMileage !== null && (!Number.isInteger(parsedMileage) || parsedMileage < 0)) {
      await Swal.fire({
        title: "Kilometraje no válido",
        text: "Ingresa un kilometraje entero mayor o igual a cero.",
        icon: "error",
        confirmButtonText: "Entendido",
        buttonsStyling: false,
        customClass: alertClasses,
      });
      return;
    }

    setIsSavingWorkData(true);
    try {
      await axios.patch(
        `/admin/appointments/${appointment.id}/work-data`,
        {
          technicianNotes: technicianNotes.trim() || null,
          mileage: parsedMileage,
          observations: observations.trim() || null,
        },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      await Swal.fire({
        title: "Datos guardados",
        text: "Los datos del servicio fueron guardados correctamente.",
        icon: "success",
        confirmButtonText: "Entendido",
        buttonsStyling: false,
        customClass: alertClasses,
      });
      await loadAppointment();
    } catch (error) {
      let message = "No pudimos guardar los datos del servicio. Inténtalo nuevamente.";
      if (axios.isAxiosError(error) && error.response?.status === 401) message = "Tu sesión expiró o no es válida.";
      else if (axios.isAxiosError(error) && error.response?.status === 403) message = "Tu cuenta no tiene permisos para realizar esta acción.";
      else if (axios.isAxiosError(error) && error.response?.status === 404) message = "La cita ya no existe.";
      else if (axios.isAxiosError(error) && error.response?.status === 400) message = getBackendMessage(error.response.data) ?? "Revisa los datos ingresados.";
      await Swal.fire({
        title: "No se pudieron guardar los datos",
        text: message,
        icon: "error",
        confirmButtonText: "Entendido",
        buttonsStyling: false,
        customClass: alertClasses,
      });
    } finally {
      setIsSavingWorkData(false);
    }
  };

  const hasUnsavedWorkData = appointment?.status === "IN_SERVICE" && (
    technicianNotes !== (appointment.technicianNotes ?? "")
    || mileage !== (appointment.mileage === null ? "" : String(appointment.mileage))
    || observations !== (appointment.observations ?? "")
  );

  const handleAction = async (action: AppointmentAction) => {
    if (!appointment || !accessToken) return;
    if (action === "complete" && hasUnsavedWorkData) {
      await Swal.fire({
        title: "Cambios sin guardar",
        text: "Hay cambios sin guardar. Guarda los datos de trabajo antes de completar la cita.",
        icon: "warning",
        confirmButtonText: "Entendido",
        buttonsStyling: false,
        customClass: alertClasses,
      });
      return;
    }

    const content = getActionContent(action, appointment.customer.name);
    const result = await Swal.fire<boolean>({
      title: content.title,
      text: content.text,
      icon: action === "cancel" ? "warning" : "question",
      showCancelButton: true,
      confirmButtonText: content.confirm,
      cancelButtonText: action === "cancel" ? "Volver" : "Cancelar",
      buttonsStyling: false,
      reverseButtons: true,
      focusCancel: true,
      showLoaderOnConfirm: true,
      allowOutsideClick: () => !Swal.isLoading(),
      customClass: alertClasses,
      preConfirm: async () => {
        setIsUpdating(true);
        try {
          await axios.patch(
            `/appointments/${appointment.id}/${action}`,
            undefined,
            { headers: { Authorization: `Bearer ${accessToken}` } },
          );
          return true;
        } catch (error) {
          let message = "No pudimos actualizar la cita. Inténtalo nuevamente.";
          if (axios.isAxiosError(error) && error.response?.status === 401) message = "Tu sesión expiró o no es válida.";
          else if (axios.isAxiosError(error) && error.response?.status === 403) message = "Tu cuenta no tiene permisos para realizar esta acción.";
          else if (axios.isAxiosError(error) && error.response?.status === 409) message = getBackendMessage(error.response.data) ?? "La cita ya no puede cambiar a ese estado.";
          Swal.showValidationMessage(message);
          return false;
        } finally {
          setIsUpdating(false);
        }
      },
    });

    if (!result.isConfirmed || !result.value) return;
    await Swal.fire({
      title: content.success,
      text: "El estado de la cita fue actualizado correctamente.",
      icon: "success",
      confirmButtonText: "Entendido",
      buttonsStyling: false,
      customClass: alertClasses,
    });
    await loadAppointment();
  };

  const renderState = () => {
    if (isLoading) {
      return <div className="admin-appointment-detail-loading" role="status" aria-label="Cargando detalle"><span /><span /><span /><span /></div>;
    }

    const notFound = detailState === "invalid-id" || detailState === "not-found";
    const title = notFound
      ? "Cita no encontrada"
      : detailState === "invalid-session"
        ? "Sesión no válida"
        : detailState === "forbidden"
          ? "Acceso no autorizado"
          : "No pudimos cargar el detalle de la cita.";
    const message = notFound
      ? "El identificador no corresponde a una cita disponible."
      : detailState === "invalid-session"
        ? "Inicia sesión nuevamente con una cuenta administrativa."
        : detailState === "forbidden"
          ? "Tu cuenta no tiene permisos para consultar esta información."
          : "Inténtalo nuevamente.";

    return (
      <section className="admin-appointment-detail-state" role="alert">
        <RefreshCw size={38} aria-hidden="true" />
        <h2>{title}</h2>
        <p>{message}</p>
        <div>
          <Link to="/admin/agenda"><ArrowLeft size={17} aria-hidden="true" /> Volver a agenda</Link>
          {detailState === "error" && <button type="button" onClick={() => void loadAppointment()}><RefreshCw size={17} aria-hidden="true" /> Reintentar</button>}
        </div>
      </section>
    );
  };

  const total = appointment?.services.reduce((sum, service) => sum + Number(service.price), 0) ?? 0;

  return (
    <div className="admin-appointment-detail">
      <Link className="admin-appointment-detail__back" to="/admin/agenda"><ArrowLeft size={17} aria-hidden="true" /> Volver a agenda</Link>

      {!appointment ? renderState() : (
        <>
          <header className="admin-appointment-detail__header">
            <div>
              <span>Cita #{appointment.id}</span>
              <h1>Detalle de cita</h1>
              <p>{format(new Date(appointment.date), "d 'de' MMMM 'de' yyyy · hh:mm a", { locale: es }).toUpperCase()}</p>
            </div>
            <span className={`admin-appointment-detail-status admin-appointment-detail-status--${appointment.status.toLowerCase().replace("_", "-")}`}>
              {getStatusLabel(appointment.status)}
            </span>
          </header>

          <div className="admin-appointment-detail-grid">
            <section className="admin-detail-panel">
              <div className="admin-detail-panel__heading"><span><UserRound size={20} /></span><h2>Información del cliente</h2></div>
              <dl className="admin-detail-data">
                <div><dt>Nombre</dt><dd>{appointment.customer.name}</dd></div>
                <div><dt>Correo</dt><dd><Mail size={14} /> {appointment.customer.email}</dd></div>
                {appointment.customer.phone && <div><dt>Teléfono</dt><dd><Phone size={14} /> {appointment.customer.phone}</dd></div>}
              </dl>
            </section>

            <section className="admin-detail-panel">
              <div className="admin-detail-panel__heading"><span><CarFront size={20} /></span><h2>Información del vehículo</h2></div>
              <h3>{appointment.vehicle.brand} {appointment.vehicle.model}</h3>
              <p className="admin-detail-panel__subtitle">{appointment.vehicle.year} · {appointment.vehicle.type}</p>
              <dl className="admin-detail-data admin-detail-data--compact">
                <div><dt>Placa</dt><dd>{appointment.vehicle.plate}</dd></div>
                {appointment.vehicle.color && <div><dt>Color</dt><dd>{appointment.vehicle.color}</dd></div>}
                <div><dt>Kilometraje del vehículo</dt><dd>{appointment.vehicle.mileage !== null ? `${appointment.vehicle.mileage.toLocaleString("es-SV")} km` : "No registrado"}</dd></div>
                <div><dt>Kilometraje de esta cita</dt><dd>{appointment.mileage !== null ? `${appointment.mileage.toLocaleString("es-SV")} km` : "No registrado"}</dd></div>
              </dl>
            </section>

            <section className="admin-detail-panel admin-detail-panel--wide">
              <div className="admin-detail-panel__heading"><span><Wrench size={20} /></span><h2>Servicios</h2></div>
              <div className="admin-detail-services">
                {appointment.services.map((service) => (
                  <article key={service.id}>
                    <div><strong>{service.name}</strong><span>{service.category} · {service.duration} min</span></div>
                    <strong>${service.price}</strong>
                  </article>
                ))}
              </div>
              <div className="admin-detail-total"><span>Total</span><strong>${total.toFixed(2)}</strong></div>
            </section>

            <section className="admin-detail-panel admin-detail-panel--wide">
              <div className="admin-detail-panel__heading"><span><FileText size={20} /></span><h2>Notas y observaciones</h2></div>
              <div className="admin-detail-notes">
                <article><h3>Notas del cliente</h3><p>{appointment.customerNotes?.trim() || "Sin notas"}</p></article>
                {appointment.status !== "IN_SERVICE" && <article><h3>Notas del técnico</h3><p>{appointment.technicianNotes?.trim() || "Sin notas"}</p></article>}
                {appointment.status !== "IN_SERVICE" && <article><h3>Observaciones</h3><p>{appointment.observations?.trim() || "Sin observaciones"}</p></article>}
              </div>
              {appointment.status === "IN_SERVICE" && (
                <form className="admin-detail-work-form" onSubmit={handleSaveWorkData}>
                  <div className="admin-detail-form-field">
                    <label className="admin-detail-form-label" htmlFor="service-mileage">Kilometraje del servicio</label>
                    <input className="admin-detail-form-input" id="service-mileage" type="number" min="0" step="1" value={mileage} onChange={(event) => setMileage(event.target.value)} placeholder="Kilometraje de esta cita" />
                  </div>
                  <div className="admin-detail-form-field">
                    <label className="admin-detail-form-label" htmlFor="technician-notes">Notas del técnico</label>
                    <textarea className="admin-detail-form-textarea" id="technician-notes" value={technicianNotes} onChange={(event) => setTechnicianNotes(event.target.value)} placeholder="Notas internas del trabajo realizado" />
                  </div>
                  <div className="admin-detail-form-field">
                    <label className="admin-detail-form-label" htmlFor="service-observations">Observaciones</label>
                    <textarea className="admin-detail-form-textarea" id="service-observations" value={observations} onChange={(event) => setObservations(event.target.value)} placeholder="Observaciones del servicio" />
                  </div>
                  <div className="admin-detail-work-form__actions">
                    <button type="submit" disabled={isSavingWorkData}>{isSavingWorkData ? "Guardando..." : "Guardar datos"}</button>
                  </div>
                </form>
              )}
            </section>

            <section className="admin-detail-panel admin-detail-panel--wide">
              <div className="admin-detail-panel__heading"><span><History size={20} /></span><h2>Historial del servicio</h2></div>
              {appointment.serviceHistory ? (
                <div className="admin-detail-history">
                  <dl className="admin-detail-data admin-detail-data--compact">
                    <div><dt>Fecha</dt><dd>{format(new Date(appointment.serviceHistory.date), "d 'de' MMMM 'de' yyyy", { locale: es })}</dd></div>
                    <div><dt>Kilometraje</dt><dd>{appointment.serviceHistory.mileage !== null ? `${appointment.serviceHistory.mileage.toLocaleString("es-SV")} km` : "No registrado"}</dd></div>
                  </dl>
                  <h3>{appointment.serviceHistory.description}</h3>
                  <p>{appointment.serviceHistory.observations?.trim() || "Sin observaciones"}</p>
                </div>
              ) : (
                <p className="admin-detail-empty-copy">Esta cita todavía no tiene un historial de servicio registrado.</p>
              )}
            </section>
          </div>

          {(appointment.status === "PENDING" || appointment.status === "CONFIRMED" || appointment.status === "IN_SERVICE") && (
            <footer className="admin-appointment-detail__actions">
              {appointment.status === "PENDING" && <button type="button" disabled={isUpdating} onClick={() => void handleAction("confirm")}><CheckCircle2 size={18} /> Confirmar</button>}
              {appointment.status === "CONFIRMED" && <button type="button" disabled={isUpdating} onClick={() => void handleAction("start")}><Play size={18} /> Iniciar servicio</button>}
              {appointment.status === "IN_SERVICE" && <button type="button" disabled={isUpdating} onClick={() => void handleAction("complete")}><ClipboardList size={18} /> Completar servicio</button>}
              {(appointment.status === "PENDING" || appointment.status === "CONFIRMED") && <button className="admin-appointment-detail__cancel" type="button" disabled={isUpdating} onClick={() => void handleAction("cancel")}><CalendarX size={18} /> Cancelar</button>}
            </footer>
          )}
        </>
      )}
    </div>
  );
}

export default AdminAppointmentDetail;
