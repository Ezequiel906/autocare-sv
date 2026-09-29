import axios from "axios";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, CalendarDays, CarFront, CircleAlert, ClipboardList, Gauge, Mail, Phone, RefreshCw, UserRound, Wrench } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./AdminServiceHistoryDetail.css";

type AppointmentStatus = "PENDING" | "CONFIRMED" | "IN_SERVICE" | "COMPLETED" | "CANCELLED";
type AdminHistoryDetail = {
  id: number;
  date: string;
  mileage: number | null;
  description: string;
  observations: string | null;
  customer: { id: number; name: string; email: string; phone: string | null };
  vehicle: { id: number; brand: string; model: string; year: number; plate: string; type: string; color: string | null };
  services: Array<{ id: number; name: string; price: string }>;
  appointment: { id: number; date: string; status: AppointmentStatus } | null;
};
type DetailState = "ready" | "invalid-id" | "not-found" | "invalid-session" | "forbidden" | "error";
const statusLabels: Record<AppointmentStatus, string> = { PENDING: "Pendiente", CONFIRMED: "Confirmada", IN_SERVICE: "En servicio", COMPLETED: "Completada", CANCELLED: "Cancelada" };

function AdminServiceHistoryDetail() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuth();
  const [record, setRecord] = useState<AdminHistoryDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [detailState, setDetailState] = useState<DetailState>("ready");

  const loadRecord = useCallback(async () => {
    setIsLoading(true); setRecord(null); setDetailState("ready");
    if (!accessToken) { setDetailState("invalid-session"); setIsLoading(false); return; }
    const recordId = Number(id);
    if (typeof id !== "string" || !/^\d+$/.test(id) || !Number.isSafeInteger(recordId) || recordId <= 0) { setDetailState("invalid-id"); setIsLoading(false); return; }
    try { const response = await axios.get<AdminHistoryDetail>(`/admin/service-history/${recordId}`, { headers: { Authorization: `Bearer ${accessToken}` } }); setRecord(response.data); }
    catch (error) { if (axios.isAxiosError(error) && error.response?.status === 401) setDetailState("invalid-session"); else if (axios.isAxiosError(error) && error.response?.status === 403) setDetailState("forbidden"); else if (axios.isAxiosError(error) && error.response?.status === 404) setDetailState("not-found"); else setDetailState("error"); }
    finally { setIsLoading(false); }
  }, [accessToken, id]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadRecord(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadRecord]);
  if (isLoading) return <div className="admin-history-detail-loading" role="status" aria-label="Cargando detalle del historial"><span /><span /><span /><span /></div>;
  if (!record) {
    const notFound = detailState === "invalid-id" || detailState === "not-found";
    const title = notFound ? "Registro no encontrado" : detailState === "invalid-session" ? "Sesión no válida" : detailState === "forbidden" ? "Acceso no autorizado" : "No pudimos cargar el registro";
    const message = notFound ? "El identificador no corresponde a un registro disponible." : detailState === "invalid-session" ? "Inicia sesión nuevamente para consultar este historial." : detailState === "forbidden" ? "Tu cuenta no tiene permisos para consultar este registro." : "Ocurrió un problema al obtener la información. Inténtalo nuevamente.";
    return <section className="admin-history-detail-state" role="alert"><CircleAlert size={42} aria-hidden="true" /><h1>{title}</h1><p>{message}</p><div><Link to="/admin/historial"><ArrowLeft size={17} aria-hidden="true" />Volver al historial</Link>{!notFound && <button type="button" onClick={() => void loadRecord()}><RefreshCw size={17} aria-hidden="true" />Reintentar</button>}</div></section>;
  }

  const total = record.services.reduce((sum, service) => sum + Number(service.price), 0);
  return <div className="admin-history-detail">
    <Link className="admin-history-detail__back" to="/admin/historial"><ArrowLeft size={17} aria-hidden="true" />Volver al historial</Link>
    <header><div><span>Historial de servicios</span><h1>{record.description}</h1><p><CalendarDays size={16} aria-hidden="true" />{format(new Date(record.date), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}</p></div></header>
    <section className="admin-history-detail__grid">
      <article><div className="admin-history-detail__title"><ClipboardList size={20} aria-hidden="true" /><h2>Información del registro</h2></div><dl><div><dt>Fecha</dt><dd>{format(new Date(record.date), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}</dd></div><div><dt>Kilometraje</dt><dd><Gauge size={15} aria-hidden="true" />{record.mileage === null ? "No registrado" : `${record.mileage.toLocaleString("es-SV")} km`}</dd></div><div className="wide"><dt>Descripción</dt><dd>{record.description}</dd></div><div className="wide"><dt>Observaciones</dt><dd>{record.observations ?? "Sin observaciones"}</dd></div></dl></article>
      <article><div className="admin-history-detail__title"><UserRound size={20} aria-hidden="true" /><h2>Cliente</h2></div><dl><div><dt>Nombre</dt><dd>{record.customer.name}</dd></div><div><dt>Correo</dt><dd><Mail size={15} aria-hidden="true" />{record.customer.email}</dd></div><div><dt>Teléfono</dt><dd><Phone size={15} aria-hidden="true" />{record.customer.phone ?? "No registrado"}</dd></div></dl></article>
      <article><div className="admin-history-detail__title"><CarFront size={20} aria-hidden="true" /><h2>Vehículo</h2></div><dl><div><dt>Vehículo</dt><dd>{record.vehicle.brand} {record.vehicle.model}</dd></div><div><dt>Año</dt><dd>{record.vehicle.year}</dd></div><div><dt>Placa</dt><dd>{record.vehicle.plate}</dd></div><div><dt>Tipo</dt><dd>{record.vehicle.type}</dd></div><div><dt>Color</dt><dd>{record.vehicle.color ?? "No registrado"}</dd></div></dl></article>
      <article><div className="admin-history-detail__title"><CalendarDays size={20} aria-hidden="true" /><h2>Cita relacionada</h2></div>{record.appointment ? <dl><div><dt>ID de cita</dt><dd>#{record.appointment.id}</dd></div><div><dt>Fecha</dt><dd>{format(new Date(record.appointment.date), "d MMM yyyy, HH:mm", { locale: es })}</dd></div><div><dt>Estado</dt><dd>{statusLabels[record.appointment.status]}</dd></div></dl> : <p className="admin-history-detail__empty">Este registro no tiene una cita relacionada.</p>}</article>
      <article className="admin-history-detail__services"><div className="admin-history-detail__title"><Wrench size={20} aria-hidden="true" /><h2>Servicios realizados</h2></div>{record.services.length ? <><ul>{record.services.map((service) => <li key={service.id}><span>{service.name}</span><strong>${Number(service.price).toFixed(2)}</strong></li>)}</ul><footer><span>Total histórico</span><strong>${total.toFixed(2)}</strong></footer></> : <p className="admin-history-detail__empty">No hay servicios asociados a este registro.</p>}</article>
    </section>
  </div>;
}
export default AdminServiceHistoryDetail;
