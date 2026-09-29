import axios from "axios";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, CalendarCheck, CheckCircle2, CircleAlert, Mail, Pencil, Phone, RefreshCw, UserRound, X, CarFront } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { useAuth } from "../context/AuthContext";
import "./AdminCustomerDetail.css";

type AdminCustomerDetailResponse = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
  vehiclesCount: number;
  appointmentsCount: number;
  completedAppointmentsCount: number;
};

type CustomerFormValues = { name: string; email: string; phone: string };
type DetailState = "ready" | "invalid-id" | "not-found" | "invalid-session" | "forbidden" | "error";

const alertClasses = {
  container: "autocare-alert-container",
  popup: "autocare-alert",
  icon: "autocare-alert__icon",
  title: "autocare-alert__title",
  htmlContainer: "autocare-alert__content",
  actions: "autocare-alert__actions",
  confirmButton: "autocare-alert__button autocare-alert__button--danger",
};

function AdminCustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuth();
  const [customer, setCustomer] = useState<AdminCustomerDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [detailState, setDetailState] = useState<DetailState>("ready");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CustomerFormValues>();

  const loadCustomer = useCallback(async () => {
    setIsLoading(true);
    setCustomer(null);
    setDetailState("ready");
    if (!accessToken) {
      setDetailState("invalid-session");
      setIsLoading(false);
      return;
    }

    const customerId = Number(id);
    if (typeof id !== "string" || !/^\d+$/.test(id) || !Number.isSafeInteger(customerId) || customerId <= 0) {
      setDetailState("invalid-id");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.get<AdminCustomerDetailResponse>(`/admin/customers/${customerId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setCustomer(response.data);
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
    // Synchronize the administrative customer detail whenever its route ID changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCustomer();
  }, [loadCustomer]);

  const openEditModal = () => {
    if (!customer) return;
    setFormError("");
    reset({ name: customer.name, email: customer.email, phone: customer.phone ?? "" });
    setIsEditing(true);
  };

  const closeEditModal = () => {
    if (isSaving) return;
    setIsEditing(false);
    setFormError("");
  };

  const updateCustomer = async (data: CustomerFormValues) => {
    if (!customer || !accessToken) {
      setFormError("Tu sesión no es válida. Inicia sesión nuevamente.");
      return;
    }
    setIsSaving(true);
    setFormError("");
    try {
      await axios.patch(
        `/admin/customers/${customer.id}`,
        { name: data.name.trim(), email: data.email.trim(), phone: data.phone.trim() },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      setIsEditing(false);
      await Swal.fire({ title: "Cliente actualizado", text: "La información del cliente fue actualizada correctamente.", icon: "success", confirmButtonText: "Entendido", buttonsStyling: false, customClass: alertClasses });
      await loadCustomer();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) setFormError("El correo electrónico ya está registrado.");
      else if (axios.isAxiosError(error) && error.response?.status === 404) setFormError("El cliente ya no existe.");
      else if (axios.isAxiosError(error) && error.response?.status === 401) setFormError("Tu sesión expiró o no es válida. Inicia sesión nuevamente.");
      else if (axios.isAxiosError(error) && error.response?.status === 403) setFormError("Tu cuenta no tiene permisos para actualizar este cliente.");
      else setFormError("No se pudo actualizar el cliente. Inténtalo nuevamente.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="admin-customer-detail-loading" role="status" aria-label="Cargando cliente"><span /><span /><span /><span /></div>;

  if (!customer) {
    const notFound = detailState === "invalid-id" || detailState === "not-found";
    const title = notFound ? "Cliente no encontrado" : detailState === "invalid-session" ? "Sesión no válida" : detailState === "forbidden" ? "Acceso no autorizado" : "No pudimos cargar el cliente";
    const message = notFound ? "El identificador no corresponde a un cliente disponible." : detailState === "invalid-session" ? "Inicia sesión nuevamente para consultar este cliente." : detailState === "forbidden" ? "Tu cuenta no tiene permisos para consultar este cliente." : "Ocurrió un problema al obtener la información. Inténtalo nuevamente.";
    return <section className="admin-customer-detail-state" role="alert"><CircleAlert size={42} aria-hidden="true" /><h1>{title}</h1><p>{message}</p><div><Link to="/admin/clientes"><ArrowLeft size={17} aria-hidden="true" />Volver a clientes</Link>{!notFound && <button type="button" onClick={() => void loadCustomer()}><RefreshCw size={17} aria-hidden="true" />Reintentar</button>}</div></section>;
  }

  return (
    <div className="admin-customer-detail">
      <Link className="admin-customer-detail__back" to="/admin/clientes"><ArrowLeft size={17} aria-hidden="true" />Volver a clientes</Link>
      <header className="admin-customer-detail__header">
        <div><span>Detalle del cliente</span><h1>{customer.name}</h1><p>Información y actividad registrada en AutoCare SV.</p></div>
        <button type="button" onClick={openEditModal}><Pencil size={17} aria-hidden="true" />Editar cliente</button>
      </header>

      <section className="admin-customer-detail__content">
        <article className="admin-customer-detail__profile">
          <div className="admin-customer-detail__section-title"><UserRound size={20} aria-hidden="true" /><h2>Información del cliente</h2></div>
          <dl>
            <div><dt>Nombre</dt><dd>{customer.name}</dd></div>
            <div><dt>Correo electrónico</dt><dd><Mail size={15} aria-hidden="true" />{customer.email}</dd></div>
            <div><dt>Teléfono</dt><dd><Phone size={15} aria-hidden="true" />{customer.phone ?? "No registrado"}</dd></div>
            <div><dt>Fecha de registro</dt><dd>{format(new Date(customer.createdAt), "d 'de' MMMM 'de' yyyy", { locale: es })}</dd></div>
          </dl>
        </article>
        <section className="admin-customer-detail__activity" aria-labelledby="customer-activity-title">
          <div className="admin-customer-detail__section-title"><CalendarCheck size={20} aria-hidden="true" /><h2 id="customer-activity-title">Actividad</h2></div>
          <div className="admin-customer-detail__stats">
            <article><CarFront size={21} aria-hidden="true" /><span>Vehículos registrados</span><strong>{customer.vehiclesCount}</strong></article>
            <article><CalendarCheck size={21} aria-hidden="true" /><span>Total de citas</span><strong>{customer.appointmentsCount}</strong></article>
            <article><CheckCircle2 size={21} aria-hidden="true" /><span>Citas completadas</span><strong>{customer.completedAppointmentsCount}</strong></article>
          </div>
        </section>
      </section>

      {isEditing && (
        <div className="admin-customer-modal__backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeEditModal(); }}>
          <section className="admin-customer-modal" role="dialog" aria-modal="true" aria-labelledby="admin-customer-modal-title">
            <header><div><span>Administración</span><h2 id="admin-customer-modal-title">Editar cliente</h2></div><button type="button" aria-label="Cerrar edición" onClick={closeEditModal} disabled={isSaving}><X size={20} aria-hidden="true" /></button></header>
            <form onSubmit={handleSubmit(updateCustomer)}>
              <label><span>Nombre</span><input {...register("name", { required: "El nombre es obligatorio.", validate: (value) => value.trim().length > 0 || "El nombre es obligatorio." })} />{errors.name && <small>{errors.name.message}</small>}</label>
              <label><span>Correo electrónico</span><input type="email" {...register("email", { required: "El correo es obligatorio.", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Ingresa un correo electrónico válido." } })} />{errors.email && <small>{errors.email.message}</small>}</label>
              <label><span>Teléfono</span><input type="tel" {...register("phone")} /></label>
              {formError && <p role="alert">{formError}</p>}
              <footer><button type="button" onClick={closeEditModal} disabled={isSaving}>Cancelar</button><button type="submit" disabled={isSaving}>{isSaving ? "Guardando cambios..." : "Guardar cambios"}</button></footer>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default AdminCustomerDetail;
