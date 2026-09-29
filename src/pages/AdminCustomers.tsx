import axios from "axios";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowRight, CircleAlert, Mail, Phone, RefreshCw, Search, UserRound, Users } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./AdminCustomers.css";

type AdminCustomer = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
};

function AdminCustomers() {
  const { accessToken } = useAuth();
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [customersError, setCustomersError] = useState("");

  const loadCustomers = useCallback(async (requestedSearch: string) => {
    setIsLoading(true);
    setCustomersError("");
    if (!accessToken) {
      setCustomers([]);
      setCustomersError("Tu sesión no es válida. Inicia sesión nuevamente.");
      setIsLoading(false);
      return;
    }

    const normalizedSearch = requestedSearch.trim();
    try {
      const response = await axios.get<AdminCustomer[]>("/admin/customers", {
        params: normalizedSearch ? { search: normalizedSearch } : undefined,
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setCustomers(response.data);
    } catch (error) {
      setCustomers([]);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setCustomersError("Tu sesión expiró o no es válida. Inicia sesión nuevamente.");
      } else if (axios.isAxiosError(error) && error.response?.status === 403) {
        setCustomersError("Tu cuenta no tiene permisos para consultar los clientes administrativos.");
      } else {
        setCustomersError("No pudimos cargar los clientes. Inténtalo nuevamente.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    // Initial synchronization with the administrative customers endpoint.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCustomers("");
  }, [loadCustomers]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextSearch = search.trim();
    setSearch(nextSearch);
    setActiveSearch(nextSearch);
    void loadCustomers(nextSearch);
  };

  const clearSearch = () => {
    setSearch("");
    setActiveSearch("");
    void loadCustomers("");
  };

  return (
    <div className="admin-customers">
      <header className="admin-customers__header">
        <div><span>Gestión administrativa</span><h1>Clientes</h1><p>Consulta y administra los clientes registrados en AutoCare SV.</p></div>
        <span className="admin-customers__count"><Users size={18} aria-hidden="true" />{isLoading ? "Consultando clientes..." : `${customers.length} ${customers.length === 1 ? "cliente encontrado" : "clientes encontrados"}`}</span>
      </header>

      <form className="admin-customers-search" onSubmit={handleSearch}>
        <label><span>Buscar clientes</span><div><Search size={17} aria-hidden="true" /><input type="search" placeholder="Buscar por nombre, correo o teléfono..." value={search} onChange={(event) => setSearch(event.target.value)} /></div></label>
        <div><button type="submit" disabled={isLoading}><Search size={17} aria-hidden="true" />{isLoading ? "Buscando..." : "Buscar"}</button><button type="button" disabled={isLoading} onClick={clearSearch}>Limpiar</button></div>
      </form>

      {isLoading ? (
        <div className="admin-customers-loading" role="status" aria-label="Cargando clientes"><span /><span /><span /><span /></div>
      ) : customersError ? (
        <section className="admin-customers-state" role="alert"><CircleAlert size={40} aria-hidden="true" /><h2>No pudimos mostrar los clientes</h2><p>{customersError}</p><button type="button" onClick={() => void loadCustomers(activeSearch)}><RefreshCw size={17} aria-hidden="true" />Reintentar</button></section>
      ) : customers.length === 0 ? (
        <section className="admin-customers-state"><Users size={42} aria-hidden="true" /><h2>{activeSearch ? "No hay clientes que coincidan con la búsqueda." : "No hay clientes registrados."}</h2></section>
      ) : (
        <section className="admin-customers-list" aria-label="Listado de clientes">
          <div className="admin-customers-list__head" aria-hidden="true"><span>Cliente</span><span>Contacto</span><span>Registro</span><span>Acción</span></div>
          {customers.map((customer) => (
            <article className="admin-customers-row" key={customer.id}>
              <div><small>Cliente</small><strong><UserRound size={16} aria-hidden="true" />{customer.name}</strong></div>
              <div className="admin-customers-row__contact"><small>Contacto</small><span><Mail size={14} aria-hidden="true" />{customer.email}</span><span><Phone size={14} aria-hidden="true" />{customer.phone ?? "No registrado"}</span></div>
              <div><small>Registro</small><span>{format(new Date(customer.createdAt), "d 'de' MMMM 'de' yyyy", { locale: es })}</span></div>
              <div><small>Acción</small><Link to={`/admin/clientes/${customer.id}`}>Ver detalle<ArrowRight size={15} aria-hidden="true" /></Link></div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

export default AdminCustomers;
