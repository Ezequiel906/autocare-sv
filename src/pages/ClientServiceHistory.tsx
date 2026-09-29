import axios from "axios";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  CalendarDays,
  CalendarPlus,
  CarFront,
  Gauge,
  History,
  RotateCcw,
  Wrench,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./ClientServiceHistory.css";

type ServiceHistoryRecord = {
  id: number;
  date: string;
  mileage: number | null;
  description: string;
  observations: string | null;
  vehicle: {
    id: number;
    brand: string;
    model: string;
    year: number;
    plate: string;
    type: string;
    color: string | null;
  };
  appointment: {
    id: number;
    date: string;
    status: "COMPLETED";
    services: Array<{
      id: number;
      name: string;
      price: string;
    }>;
  } | null;
};

function ClientServiceHistory() {
  const { accessToken } = useAuth();
  const [history, setHistory] = useState<ServiceHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    setHistoryError("");

    if (!accessToken) {
      setHistory([]);
      setHistoryError("Tu sesión no es válida. Inicia sesión nuevamente.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.get<ServiceHistoryRecord[]>(
        "/service-history",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      setHistory(response.data);
    } catch {
      setHistory([]);
      setHistoryError("No pudimos cargar tu historial. Inténtalo nuevamente.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    // Initial synchronization with the authenticated service history endpoint.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadHistory();
  }, [loadHistory]);

  return (
    <div className="client-service-history">
      <header className="client-service-history__header">
        <div>
          <span>Mantenimiento</span>
          <h1>Historial de servicios</h1>
          <p>Consulta los servicios de mantenimiento realizados a tus vehículos.</p>
        </div>
        <Link className="client-service-history__schedule" to="/agendar-cita">
          <CalendarPlus size={18} aria-hidden="true" />
          Agendar cita
        </Link>
      </header>

      <section
        className="client-service-history__content"
        aria-labelledby="service-history-list-title"
      >
        <div className="client-service-history__content-heading">
          <div>
            <span>Registro de mantenimiento</span>
            <h2 id="service-history-list-title">Servicios realizados</h2>
          </div>
          <History size={22} aria-hidden="true" />
        </div>

        <div className="client-service-history__list" aria-live="polite">
          {isLoading ? (
            <div className="client-service-history-empty" role="status">
              <div className="client-service-history-empty__visual" aria-hidden="true">
                <History size={68} strokeWidth={1.4} />
              </div>
              <h3>Cargando tu historial...</h3>
              <p>Estamos consultando los servicios realizados a tus vehículos.</p>
            </div>
          ) : historyError ? (
            <div className="client-service-history-empty" role="alert">
              <div className="client-service-history-empty__visual" aria-hidden="true">
                <RotateCcw size={60} strokeWidth={1.4} />
              </div>
              <h3>No pudimos cargar tu historial</h3>
              <p>{historyError}</p>
              <button
                className="client-service-history__schedule"
                type="button"
                onClick={() => void loadHistory()}
              >
                <RotateCcw size={18} aria-hidden="true" />
                Reintentar
              </button>
            </div>
          ) : history.length === 0 ? (
            <div className="client-service-history-empty">
              <div className="client-service-history-empty__visual" aria-hidden="true">
                <span className="client-service-history-empty__orbit" />
                <History size={68} strokeWidth={1.4} />
                <span className="client-service-history-empty__tool">
                  <Wrench size={23} />
                </span>
              </div>
              <span className="client-service-history-empty__label">Historial disponible</span>
              <h3>Aún no tienes servicios registrados</h3>
              <p>
                Cuando existan servicios realizados, aquí podrás consultar la información
                de mantenimiento de tus vehículos.
              </p>
              <Link to="/agendar-cita">
                <CalendarPlus size={18} aria-hidden="true" />
                Agendar cita
              </Link>
            </div>
          ) : (
            <div className="service-history-cards">
              {history.map((record) => {
                const services = record.appointment?.services ?? [];
                const total = services.reduce(
                  (sum, service) => sum + Number(service.price),
                  0,
                );

                return (
                  <article className="service-history-card" key={record.id}>
                    <header className="service-history-card__header">
                      <div>
                        <span className="service-history-card__date">
                          <CalendarDays size={17} aria-hidden="true" />
                          {format(new Date(record.date), "d 'de' MMMM 'de' yyyy", { locale: es })}
                        </span>
                        <h3>{record.description}</h3>
                      </div>
                      <span className="service-history-card__completed">Completado</span>
                    </header>

                    <div className="service-history-card__vehicle">
                      <span aria-hidden="true"><CarFront size={23} /></span>
                      <div>
                        <small>Vehículo</small>
                        <strong>
                          {record.vehicle.brand} {record.vehicle.model} · {record.vehicle.year}
                        </strong>
                        <p>{record.vehicle.plate}</p>
                      </div>
                    </div>

                    {record.mileage !== null && (
                      <div className="service-history-card__mileage">
                        <Gauge size={17} aria-hidden="true" />
                        <span>Kilometraje</span>
                        <strong>{record.mileage.toLocaleString("es-SV")} km</strong>
                      </div>
                    )}

                    <div className="service-history-card__services">
                      <span className="service-history-card__section-label">
                        <Wrench size={15} aria-hidden="true" />
                        Servicios realizados
                      </span>
                      {services.length > 0 ? (
                        <ul>
                          {services.map((service) => (
                            <li key={service.id}>
                              <span>{service.name}</span>
                              <strong>${service.price}</strong>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="service-history-card__unavailable">
                          No hay precios históricos asociados a este registro.
                        </p>
                      )}
                    </div>

                    {record.observations && (
                      <div className="service-history-card__observations">
                        <span>Observaciones</span>
                        <p>{record.observations}</p>
                      </div>
                    )}

                    <footer className="service-history-card__footer">
                      <span>Total del servicio</span>
                      <strong>{services.length > 0 ? `$${total.toFixed(2)}` : "No disponible"}</strong>
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

export default ClientServiceHistory;
