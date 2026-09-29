import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { CircleAlert, Clock3, Eye, Pencil, Plus, RefreshCw, Search, ToggleLeft, ToggleRight, Wrench, X } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { z } from "zod";
import { useAuth } from "../context/AuthContext";
import "./AdminServices.css";

type AdminService = { id: number; name: string; slug: string; description: string; category: string; price: string; duration: number; active: boolean; createdAt: string; updatedAt: string };
type ServiceFilters = { search: string; category: string; active: "" | "true" | "false" };

const serviceSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio."),
  slug: z.string().trim().min(1, "El slug es obligatorio."),
  description: z.string().trim().min(1, "La descripción es obligatoria."),
  category: z.string().trim().min(1, "La categoría es obligatoria."),
  price: z.number({ error: "Ingresa un precio válido." }).nonnegative("El precio no puede ser negativo."),
  duration: z.number({ error: "Ingresa una duración válida." }).int("La duración debe ser un número entero.").positive("La duración debe ser mayor que cero."),
  active: z.boolean(),
});
type ServiceFormValues = z.infer<typeof serviceSchema>;

const emptyFilters: ServiceFilters = { search: "", category: "", active: "" };
const alertClasses = { container: "autocare-alert-container", popup: "autocare-alert", icon: "autocare-alert__icon", title: "autocare-alert__title", htmlContainer: "autocare-alert__content", actions: "autocare-alert__actions", confirmButton: "autocare-alert__button autocare-alert__button--danger", cancelButton: "autocare-alert__button autocare-alert__button--cancel" };

function getActionError(error: unknown, action: "save" | "toggle") {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 400) return "Revisa los datos ingresados e inténtalo nuevamente.";
    if (error.response?.status === 401) return "Tu sesión expiró o no es válida. Inicia sesión nuevamente.";
    if (error.response?.status === 403) return "Tu cuenta no tiene permisos para realizar esta acción.";
    if (error.response?.status === 404) return "El servicio ya no existe.";
    if (error.response?.status === 409) return "El slug ingresado ya está utilizado por otro servicio.";
  }
  return action === "save" ? "No se pudo guardar el servicio. Inténtalo nuevamente." : "No se pudo cambiar el estado del servicio. Inténtalo nuevamente.";
}

function AdminServices() {
  const { accessToken } = useAuth();
  const [services, setServices] = useState<AdminService[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [filters, setFilters] = useState<ServiceFilters>(emptyFilters);
  const [activeFilters, setActiveFilters] = useState<ServiceFilters>(emptyFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [servicesError, setServicesError] = useState("");
  const [formService, setFormService] = useState<AdminService | "new" | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ServiceFormValues>({ resolver: zodResolver(serviceSchema), defaultValues: { active: true } });

  const loadServices = useCallback(async (requestedFilters: ServiceFilters) => {
    setIsLoading(true);
    setServicesError("");
    if (!accessToken) { setServices([]); setServicesError("Tu sesión no es válida. Inicia sesión nuevamente."); setIsLoading(false); return; }
    const search = requestedFilters.search.trim();
    try {
      const response = await axios.get<AdminService[]>("/admin/services", {
        params: { ...(search ? { search } : {}), ...(requestedFilters.category ? { category: requestedFilters.category } : {}), ...(requestedFilters.active ? { active: requestedFilters.active } : {}) },
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setServices(response.data);
      if (!search && !requestedFilters.category && !requestedFilters.active) setCategories([...new Set(response.data.map((service) => service.category))].sort((a, b) => a.localeCompare(b, "es")));
    } catch (error) {
      setServices([]);
      if (axios.isAxiosError(error) && error.response?.status === 401) setServicesError("Tu sesión expiró o no es válida. Inicia sesión nuevamente.");
      else if (axios.isAxiosError(error) && error.response?.status === 403) setServicesError("Tu cuenta no tiene permisos para consultar los servicios administrativos.");
      else setServicesError("No pudimos cargar los servicios. Inténtalo nuevamente.");
    } finally { setIsLoading(false); }
  }, [accessToken]);

  useEffect(() => { /* eslint-disable-next-line react-hooks/set-state-in-effect */ void loadServices(emptyFilters); }, [loadServices]);

  const searchServices = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const next = { ...filters, search: filters.search.trim() }; setFilters(next); setActiveFilters(next); void loadServices(next); };
  const clearFilters = () => { setFilters(emptyFilters); setActiveFilters(emptyFilters); void loadServices(emptyFilters); };
  const openCreate = () => { setFormError(""); reset({ name: "", slug: "", description: "", category: "", price: 0, duration: 1, active: true }); setFormService("new"); };
  const openEdit = (service: AdminService) => { setFormError(""); reset({ name: service.name, slug: service.slug, description: service.description, category: service.category, price: Number(service.price), duration: service.duration, active: service.active }); setFormService(service); };
  const closeForm = () => { if (!isSaving) { setFormService(null); setFormError(""); reset(); } };

  const saveService = async (data: ServiceFormValues) => {
    if (!accessToken || !formService) { setFormError("Tu sesión no es válida. Inicia sesión nuevamente."); return; }
    setIsSaving(true); setFormError("");
    const payload = { name: data.name.trim(), slug: data.slug.trim(), description: data.description.trim(), category: data.category.trim(), price: data.price, duration: data.duration, active: data.active };
    try {
      if (formService === "new") await axios.post("/admin/services", payload, { headers: { Authorization: `Bearer ${accessToken}` } });
      else await axios.patch(`/admin/services/${formService.id}`, payload, { headers: { Authorization: `Bearer ${accessToken}` } });
      const wasNew = formService === "new";
      setFormService(null); reset();
      await Swal.fire({ title: wasNew ? "Servicio creado" : "Servicio actualizado", text: wasNew ? "El servicio fue creado correctamente." : "La información del servicio fue actualizada correctamente.", icon: "success", confirmButtonText: "Entendido", buttonsStyling: false, customClass: alertClasses });
      await loadServices(activeFilters);
    } catch (error) { setFormError(getActionError(error, "save")); } finally { setIsSaving(false); }
  };

  const toggleService = async (service: AdminService) => {
    if (!accessToken) return;
    const nextActive = !service.active;
    const result = await Swal.fire<boolean>({ title: nextActive ? "¿Activar servicio?" : "¿Desactivar servicio?", text: `${service.name} quedará ${nextActive ? "disponible" : "inactivo"} en el catálogo.`, icon: "question", showCancelButton: true, confirmButtonText: nextActive ? "Activar servicio" : "Desactivar servicio", cancelButtonText: "Cancelar", buttonsStyling: false, reverseButtons: true, focusCancel: true, showLoaderOnConfirm: true, allowOutsideClick: () => !Swal.isLoading(), customClass: alertClasses,
      preConfirm: async () => { try { await axios.patch(`/admin/services/${service.id}`, { active: nextActive }, { headers: { Authorization: `Bearer ${accessToken}` } }); return true; } catch (error) { Swal.showValidationMessage(getActionError(error, "toggle")); return false; } },
    });
    if (!result.isConfirmed || !result.value) return;
    await Swal.fire({ title: nextActive ? "Servicio activado" : "Servicio desactivado", text: "El estado del servicio fue actualizado correctamente.", icon: "success", confirmButtonText: "Entendido", buttonsStyling: false, customClass: alertClasses });
    await loadServices(activeFilters);
  };

  const hasFilters = Boolean(activeFilters.search || activeFilters.category || activeFilters.active);
  return (
    <div className="admin-services">
      <header className="admin-services__header"><div><span>Gestión administrativa</span><h1>Servicios</h1><p>Consulta y administra los servicios disponibles en AutoCare SV.</p></div><div className="admin-services__header-actions"><span><Wrench size={18} aria-hidden="true" />{isLoading ? "Consultando servicios..." : `${services.length} ${services.length === 1 ? "servicio encontrado" : "servicios encontrados"}`}</span><button type="button" onClick={openCreate}><Plus size={18} aria-hidden="true" />Nuevo servicio</button></div></header>
      <form className="admin-services-filters" onSubmit={searchServices}>
        <label className="admin-services-field admin-services-field--search"><span>Buscar</span><div><Search size={17} aria-hidden="true" /><input type="search" placeholder="Buscar por nombre, slug o descripción..." value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} /></div></label>
        <label className="admin-services-field"><span>Categoría</span><select value={filters.category} onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}><option value="">Todas</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
        <label className="admin-services-field"><span>Estado</span><select value={filters.active} onChange={(event) => setFilters((current) => ({ ...current, active: event.target.value as ServiceFilters["active"] }))}><option value="">Todos</option><option value="true">Activos</option><option value="false">Inactivos</option></select></label>
        <div className="admin-services-filters__actions"><button type="submit" disabled={isLoading}><Search size={17} aria-hidden="true" />{isLoading ? "Buscando..." : "Buscar"}</button><button type="button" disabled={isLoading} onClick={clearFilters}>Limpiar</button></div>
      </form>
      {isLoading ? <div className="admin-services-loading" role="status" aria-label="Cargando servicios"><span /><span /><span /><span /></div> : servicesError ? <section className="admin-services-state" role="alert"><CircleAlert size={40} aria-hidden="true" /><h2>No pudimos mostrar los servicios</h2><p>{servicesError}</p><button type="button" onClick={() => void loadServices(activeFilters)}><RefreshCw size={17} aria-hidden="true" />Reintentar</button></section> : services.length === 0 ? <section className="admin-services-state"><Wrench size={42} aria-hidden="true" /><h2>{hasFilters ? "No hay servicios que coincidan con los filtros." : "No hay servicios registrados."}</h2></section> :
        <section className="admin-services-list" aria-label="Listado de servicios"><div className="admin-services-list__head" aria-hidden="true"><span>Servicio</span><span>Categoría</span><span>Precio</span><span>Duración</span><span>Estado</span><span>Acciones</span></div>{services.map((service) => <article className="admin-services-row" key={service.id}><div><small>Servicio</small><strong>{service.name}</strong><span>{service.slug}</span></div><div><small>Categoría</small><span>{service.category}</span></div><div><small>Precio</small><strong>${Number(service.price).toFixed(2)}</strong></div><div><small>Duración</small><span><Clock3 size={14} aria-hidden="true" />{service.duration} min</span></div><div><small>Estado</small><span className={`admin-services-status admin-services-status--${service.active ? "active" : "inactive"}`}>{service.active ? "Activo" : "Inactivo"}</span></div><div className="admin-services-row__actions"><small>Acciones</small><Link to={`/admin/servicios/${service.id}`} aria-label={`Ver detalle de ${service.name}`}><Eye size={16} aria-hidden="true" /></Link><button type="button" aria-label={`Editar ${service.name}`} onClick={() => openEdit(service)}><Pencil size={16} aria-hidden="true" /></button><button type="button" aria-label={`${service.active ? "Desactivar" : "Activar"} ${service.name}`} onClick={() => void toggleService(service)}>{service.active ? <ToggleRight size={18} aria-hidden="true" /> : <ToggleLeft size={18} aria-hidden="true" />}</button></div></article>)}</section>}
      {formService && <div className="admin-service-modal__backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeForm(); }}><section className="admin-service-modal" role="dialog" aria-modal="true" aria-labelledby="service-form-title"><header><div><span>Administración</span><h2 id="service-form-title">{formService === "new" ? "Nuevo servicio" : "Editar servicio"}</h2></div><button type="button" aria-label="Cerrar formulario" onClick={closeForm} disabled={isSaving}><X size={20} aria-hidden="true" /></button></header><form onSubmit={handleSubmit(saveService)}><div className="admin-service-modal__grid"><label><span>Nombre</span><input {...register("name")} />{errors.name && <small>{errors.name.message}</small>}</label><label><span>Slug</span><input {...register("slug")} />{errors.slug && <small>{errors.slug.message}</small>}</label><label className="admin-service-modal__wide"><span>Descripción</span><textarea rows={4} {...register("description")} />{errors.description && <small>{errors.description.message}</small>}</label><label><span>Categoría</span><input {...register("category")} />{errors.category && <small>{errors.category.message}</small>}</label><label><span>Precio</span><input type="number" min="0" step="0.01" {...register("price", { valueAsNumber: true })} />{errors.price && <small>{errors.price.message}</small>}</label><label><span>Duración (minutos)</span><input type="number" min="1" step="1" {...register("duration", { valueAsNumber: true })} />{errors.duration && <small>{errors.duration.message}</small>}</label><label className="admin-service-modal__check"><input type="checkbox" {...register("active")} /><span>Servicio activo</span></label></div>{formError && <p role="alert">{formError}</p>}<footer><button type="button" onClick={closeForm} disabled={isSaving}>Cancelar</button><button type="submit" disabled={isSaving}>{isSaving ? "Guardando servicio..." : "Guardar servicio"}</button></footer></form></section></div>}
    </div>
  );
}

export default AdminServices;
