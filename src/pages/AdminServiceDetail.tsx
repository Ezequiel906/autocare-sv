import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, CalendarDays, CircleAlert, Clock3, Pencil, RefreshCw, Tag, Wrench, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { z } from "zod";
import { useAuth } from "../context/AuthContext";
import "./AdminServiceDetail.css";

type AdminService = { id: number; name: string; slug: string; description: string; category: string; price: string; duration: number; active: boolean; createdAt: string; updatedAt: string };
type DetailState = "ready" | "invalid-id" | "not-found" | "invalid-session" | "forbidden" | "error";
const schema = z.object({ name: z.string().trim().min(1, "El nombre es obligatorio."), slug: z.string().trim().min(1, "El slug es obligatorio."), description: z.string().trim().min(1, "La descripción es obligatoria."), category: z.string().trim().min(1, "La categoría es obligatoria."), price: z.number({ error: "Ingresa un precio válido." }).nonnegative("El precio no puede ser negativo."), duration: z.number({ error: "Ingresa una duración válida." }).int("La duración debe ser entera.").positive("La duración debe ser mayor que cero."), active: z.boolean() });
type FormValues = z.infer<typeof schema>;
const alertClasses = { container: "autocare-alert-container", popup: "autocare-alert", icon: "autocare-alert__icon", title: "autocare-alert__title", htmlContainer: "autocare-alert__content", actions: "autocare-alert__actions", confirmButton: "autocare-alert__button autocare-alert__button--danger" };

function AdminServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuth();
  const [service, setService] = useState<AdminService | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [state, setState] = useState<DetailState>("ready");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const loadService = useCallback(async () => {
    setIsLoading(true); setService(null); setState("ready");
    if (!accessToken) { setState("invalid-session"); setIsLoading(false); return; }
    const serviceId = Number(id);
    if (typeof id !== "string" || !/^\d+$/.test(id) || !Number.isSafeInteger(serviceId) || serviceId <= 0) { setState("invalid-id"); setIsLoading(false); return; }
    try { const response = await axios.get<AdminService>(`/admin/services/${serviceId}`, { headers: { Authorization: `Bearer ${accessToken}` } }); setService(response.data); }
    catch (error) { if (axios.isAxiosError(error) && error.response?.status === 401) setState("invalid-session"); else if (axios.isAxiosError(error) && error.response?.status === 403) setState("forbidden"); else if (axios.isAxiosError(error) && error.response?.status === 404) setState("not-found"); else setState("error"); }
    finally { setIsLoading(false); }
  }, [accessToken, id]);
  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadService(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadService]);

  const openEdit = () => { if (!service) return; setFormError(""); reset({ name: service.name, slug: service.slug, description: service.description, category: service.category, price: Number(service.price), duration: service.duration, active: service.active }); setIsEditing(true); };
  const closeEdit = () => { if (!isSaving) { setIsEditing(false); setFormError(""); } };
  const updateService = async (data: FormValues) => {
    if (!service || !accessToken) { setFormError("Tu sesión no es válida. Inicia sesión nuevamente."); return; }
    setIsSaving(true); setFormError("");
    try {
      await axios.patch(`/admin/services/${service.id}`, { name: data.name.trim(), slug: data.slug.trim(), description: data.description.trim(), category: data.category.trim(), price: data.price, duration: data.duration, active: data.active }, { headers: { Authorization: `Bearer ${accessToken}` } });
      setIsEditing(false);
      await Swal.fire({ title: "Servicio actualizado", text: "La información del servicio fue actualizada correctamente.", icon: "success", confirmButtonText: "Entendido", buttonsStyling: false, customClass: alertClasses });
      await loadService();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 400) setFormError("Revisa los datos ingresados e inténtalo nuevamente.");
      else if (axios.isAxiosError(error) && error.response?.status === 401) setFormError("Tu sesión expiró o no es válida.");
      else if (axios.isAxiosError(error) && error.response?.status === 403) setFormError("Tu cuenta no tiene permisos para actualizar este servicio.");
      else if (axios.isAxiosError(error) && error.response?.status === 404) setFormError("El servicio ya no existe.");
      else if (axios.isAxiosError(error) && error.response?.status === 409) setFormError("El slug ingresado ya está utilizado por otro servicio.");
      else setFormError("No se pudo actualizar el servicio. Inténtalo nuevamente.");
    } finally { setIsSaving(false); }
  };

  if (isLoading) return <div className="admin-service-detail-loading" role="status" aria-label="Cargando servicio"><span /><span /><span /></div>;
  if (!service) {
    const notFound = state === "invalid-id" || state === "not-found";
    const title = notFound ? "Servicio no encontrado" : state === "invalid-session" ? "Sesión no válida" : state === "forbidden" ? "Acceso no autorizado" : "No pudimos cargar el servicio";
    return <section className="admin-service-detail-state" role="alert"><CircleAlert size={42} aria-hidden="true" /><h1>{title}</h1><p>{notFound ? "El identificador no corresponde a un servicio disponible." : "No fue posible obtener la información solicitada."}</p><div><Link to="/admin/servicios"><ArrowLeft size={17} aria-hidden="true" />Volver a servicios</Link>{!notFound && <button type="button" onClick={() => void loadService()}><RefreshCw size={17} aria-hidden="true" />Reintentar</button>}</div></section>;
  }
  return <div className="admin-service-detail"><Link className="admin-service-detail__back" to="/admin/servicios"><ArrowLeft size={17} aria-hidden="true" />Volver a servicios</Link><header><div><span>Detalle del servicio</span><h1>{service.name}</h1><p>{service.slug}</p></div><button type="button" onClick={openEdit}><Pencil size={17} aria-hidden="true" />Editar servicio</button></header><section className="admin-service-detail__content"><article><div className="admin-service-detail__title"><Wrench size={20} aria-hidden="true" /><h2>Información del servicio</h2></div><p className="admin-service-detail__description">{service.description}</p><dl><div><dt>Categoría</dt><dd><Tag size={15} aria-hidden="true" />{service.category}</dd></div><div><dt>Precio</dt><dd>${Number(service.price).toFixed(2)}</dd></div><div><dt>Duración</dt><dd><Clock3 size={15} aria-hidden="true" />{service.duration} min</dd></div><div><dt>Estado</dt><dd><span className={`admin-service-detail__status admin-service-detail__status--${service.active ? "active" : "inactive"}`}>{service.active ? "Activo" : "Inactivo"}</span></dd></div></dl></article><aside><div className="admin-service-detail__title"><CalendarDays size={20} aria-hidden="true" /><h2>Registro</h2></div><dl><div><dt>Creado</dt><dd>{format(new Date(service.createdAt), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}</dd></div><div><dt>Actualizado</dt><dd>{format(new Date(service.updatedAt), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}</dd></div></dl></aside></section>
    {isEditing && <div className="admin-service-detail-modal__backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeEdit(); }}><section className="admin-service-detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-service-form-title"><header><div><span>Administración</span><h2 id="detail-service-form-title">Editar servicio</h2></div><button type="button" aria-label="Cerrar formulario" onClick={closeEdit} disabled={isSaving}><X size={20} aria-hidden="true" /></button></header><form onSubmit={handleSubmit(updateService)}><div><label><span>Nombre</span><input {...register("name")} />{errors.name && <small>{errors.name.message}</small>}</label><label><span>Slug</span><input {...register("slug")} />{errors.slug && <small>{errors.slug.message}</small>}</label><label className="wide"><span>Descripción</span><textarea rows={4} {...register("description")} />{errors.description && <small>{errors.description.message}</small>}</label><label><span>Categoría</span><input {...register("category")} />{errors.category && <small>{errors.category.message}</small>}</label><label><span>Precio</span><input type="number" min="0" step="0.01" {...register("price", { valueAsNumber: true })} />{errors.price && <small>{errors.price.message}</small>}</label><label><span>Duración (minutos)</span><input type="number" min="1" {...register("duration", { valueAsNumber: true })} />{errors.duration && <small>{errors.duration.message}</small>}</label><label className="check"><input type="checkbox" {...register("active")} /><span>Servicio activo</span></label></div>{formError && <p role="alert">{formError}</p>}<footer><button type="button" onClick={closeEdit} disabled={isSaving}>Cancelar</button><button type="submit" disabled={isSaving}>{isSaving ? "Guardando servicio..." : "Guardar cambios"}</button></footer></form></section></div>}
  </div>;
}
export default AdminServiceDetail;
