import axios from "axios";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowRight, CalendarDays, CarFront, CircleAlert, Gauge, History, RefreshCw, Search, UserRound, Wrench } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./AdminServiceHistory.css";

type AppointmentStatus = "PENDING" | "CONFIRMED" | "IN_SERVICE" | "COMPLETED" | "CANCELLED";
type HistoryService = { id: number; name: string; price: string };
type AdminHistoryRecord = {
  id: number;
  date: string;
  mileage: number | null;
  description: string;
  observations: string | null;
  customer: { id: number; name: string; email: string; phone: string | null };
  vehicle: { id: number; brand: string; model: string; year: number; plate: string; type: string; color: string | null };
  services: HistoryService[];
  appointment: { id: number; date: string; status: AppointmentStatus } | null;
};
type HistoryFilters = { search: string; date: string };
const emptyFilters: HistoryFilters = { search: "", date: "" };

function statusLabel(status: AppointmentStatus) {
  const labels: Record<AppointmentStatus, string> = { PENDING: "Pendiente", CONFIRMED: "Confirmada", IN_SERVICE: "En servicio", COMPLETED: "Completada", CANCELLED: "Cancelada" };
  return labels[status];
}

function AdminServiceHistory() {
  const { accessToken } = useAuth();
  const [records, setRecords] = useState<AdminHistoryRecord[]>([]);
  const [filters, setFilters] = useState<HistoryFilters>(emptyFilters);
  const [activeFilters, setActiveFilters] = useState<HistoryFilters>(emptyFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");

  const loadHistory = useCallback(async (requestedFilters: HistoryFilters) => {
    setIsLoading(true); setHistoryError("");
    if (!accessToken) { setRecords([]); setHistoryError("Tu sesión no es válida. Inicia sesión nuevamente."); setIsLoading(false); return; }
    const search = requestedFilters.search.trim();
    try {
      const response = await axios.get<AdminHistoryRecord[]>("/admin/service-history", { params: { ...(search ? { search } : {}), ...(requestedFilters.date ? { date: requestedFilters.date } : {}) }, headers: { Authorization: `Bearer ${accessToken}` } });
      setRecords(response.data);
    } catch (error) {
      setRecords([]);
      if (axios.isAxiosError(error) && error.response?.status === 401) setHistoryError("Tu sesión expiró o no es válida. Inicia sesión nuevamente.");
      else if (axios.isAxiosError(error) && error.response?.status === 403) setHistoryError("Tu cuenta no tiene permisos para consultar el historial administrativo.");
      else setHistoryError("No pudimos cargar el historial de servicios. Inténtalo nuevamente.");
    } finally { setIsLoading(false); }
  }, [accessToken]);

  useEffect(() => { /* eslint-disable-next-line react-hooks/set-state-in-effect */ void loadHistory(emptyFilters); }, [loadHistory]);
  const submitFilters = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const next = { ...filters, search: filters.search.trim() }; setFilters(next); setActiveFilters(next); void loadHistory(next); };
  const clearFilters = () => { setFilters(emptyFilters); setActiveFilters(emptyFilters); void loadHistory(emptyFilters); };
  const hasFilters = Boolean(activeFilters.search || activeFilters.date);

  return <div className="admin-history">
    <header className="admin-history__header"><div><span>Gestión administrativa</span><h1>Historial de servicios</h1><p>Consulta los mantenimientos registrados en AutoCare SV.</p></div><span className="admin-history__count"><History size={18} aria-hidden="true" />{isLoading ? "Consultando historial..." : `${records.length} ${records.length === 1 ? "registro encontrado" : "registros encontrados"}`}</span></header>
    <form className="admin-history-filters" onSubmit={submitFilters}><label className="admin-history-field admin-history-field--search"><span>Buscar</span><div><Search size={17} aria-hidden="true" /><input type="search" placeholder="Buscar cliente, vehículo, placa o servicio..." value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} /></div></label><label className="admin-history-field"><span>Fecha</span><input type="date" value={filters.date} onChange={(event) => setFilters((current) => ({ ...current, date: event.target.value }))} /></label><div className="admin-history-filters__actions"><button type="submit" disabled={isLoading}><Search size={17} aria-hidden="true" />{isLoading ? "Buscando..." : "Buscar"}</button><button type="button" disabled={isLoading} onClick={clearFilters}>Limpiar</button></div></form>
    {isLoading ? <div className="admin-history-loading" role="status" aria-label="Cargando historial"><span /><span /><span /><span /></div> : historyError ? <section className="admin-history-state" role="alert"><CircleAlert size={40} aria-hidden="true" /><h2>No pudimos mostrar el historial</h2><p>{historyError}</p><button type="button" onClick={() => void loadHistory(activeFilters)}><RefreshCw size={17} aria-hidden="true" />Reintentar</button></section> : records.length === 0 ? <section className="admin-history-state"><History size={42} aria-hidden="true" /><h2>{hasFilters ? "No hay registros que coincidan con los filtros." : "No hay registros en el historial de servicios."}</h2></section> :
      <section className="admin-history-list" aria-label="Historial de servicios"><div className="admin-history-list__head" aria-hidden="true"><span>Fecha</span><span>Cliente</span><span>Vehículo</span><span>Kilometraje</span><span>Servicios</span><span>Estado</span><span>Acción</span></div>{records.map((record) => <article className="admin-history-row" key={record.id}><div><small>Fecha</small><strong><CalendarDays size={15} aria-hidden="true" />{format(new Date(record.date), "d MMM yyyy", { locale: es })}</strong></div><div><small>Cliente</small><strong><UserRound size={15} aria-hidden="true" />{record.customer.name}</strong></div><div><small>Vehículo</small><strong><CarFront size={15} aria-hidden="true" />{record.vehicle.brand} {record.vehicle.model}</strong><span>{record.vehicle.plate}</span></div><div><small>Kilometraje</small><span><Gauge size={15} aria-hidden="true" />{record.mileage === null ? "No registrado" : `${record.mileage.toLocaleString("es-SV")} km`}</span></div><div className="admin-history-row__services"><small>Servicios</small>{record.services.length ? <span><Wrench size={14} aria-hidden="true" />{record.services.map((service) => service.name).join(", ")}</span> : <span>Sin servicios asociados</span>}</div><div><small>Estado</small><span>{record.appointment ? statusLabel(record.appointment.status) : "Sin cita"}</span></div><div><small>Acción</small><Link to={`/admin/historial/${record.id}`}>Ver detalle<ArrowRight size={14} aria-hidden="true" /></Link></div></article>)}</section>}
  </div>;
}
export default AdminServiceHistory;
