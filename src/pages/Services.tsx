import axios from "axios";
import {
  ArrowRight,
  BatteryCharging,
  CarFront,
  CircleGauge,
  Droplets,
  Funnel,
  ScanSearch,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Services.css";

type Service = {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: string;
  price: string;
  duration: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

function getServiceIcon(slug: string) {
  switch (slug) {
    case "cambio-de-aceite":
      return <Droplets size={27} aria-hidden="true" />;
    case "filtros":
      return <Funnel size={27} aria-hidden="true" />;
    case "control-de-fluidos":
      return <CircleGauge size={27} aria-hidden="true" />;
    case "baterias":
      return <BatteryCharging size={27} aria-hidden="true" />;
    case "inspeccion-rapida":
      return <ScanSearch size={27} aria-hidden="true" />;
    default:
      return <Wrench size={27} aria-hidden="true" />;
  }
}

function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [servicesError, setServicesError] = useState("");

  const loadServices = useCallback(async () => {
    setIsLoading(true);
    setServicesError("");

    try {
      const response = await axios.get<Service[]>("/services");
      setServices(response.data);
    } catch {
      setServices([]);
      setServicesError("No pudimos cargar los servicios. Inténtalo nuevamente.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial synchronization with the public services endpoint.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadServices();
  }, [loadServices]);

  return (
    <div className="services-page">
      <section className="services-header" aria-labelledby="services-page-title">
        <div className="services-header__content">
          <span className="services-eyebrow">
            <Wrench size={15} aria-hidden="true" />
            Nuestros servicios
          </span>
          <h1 id="services-page-title">Todo lo que tu vehículo necesita</h1>
          <p>
            En AutoCare SV brindamos servicios de mantenimiento y cuidado
            automotriz para ayudarte a conservar tu vehículo en buenas condiciones.
          </p>
        </div>
        <div className="services-header__mark" aria-hidden="true">
          <span>AC</span>
          <CarFront size={46} strokeWidth={1.5} />
        </div>
      </section>

      <section className="services-grid-section" aria-labelledby="services-grid-title">
        <div className="services-section-heading">
          <span className="services-section-heading__line" aria-hidden="true" />
          <h2 id="services-grid-title">Cuidado esencial para tu vehículo</h2>
        </div>

        {isLoading ? (
          <div className="services-state" role="status" aria-live="polite">
            <Wrench size={30} aria-hidden="true" />
            <p>Cargando servicios...</p>
          </div>
        ) : servicesError ? (
          <div className="services-state" role="alert">
            <CircleGauge size={30} aria-hidden="true" />
            <p>{servicesError}</p>
            <button type="button" onClick={() => void loadServices()}>
              Reintentar
            </button>
          </div>
        ) : services.length === 0 ? (
          <div className="services-state">
            <Wrench size={30} aria-hidden="true" />
            <p>No hay servicios disponibles en este momento.</p>
          </div>
        ) : (
          <div className="services-grid">
            {services.map((service, index) => (
              <article className="service-card" key={service.id}>
                <div className="service-card__top">
                  <span className="service-card__icon">
                    {getServiceIcon(service.slug)}
                  </span>
                  <span className="service-card__number" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3>{service.name}</h3>
                <p>{service.description}</p>
                <div className="service-card__meta">
                  <span>${service.price}</span>
                  <span>{service.duration} min</span>
                </div>
                <Link to={`/servicios/${service.slug}`}>
                  Ver servicio <ArrowRight size={17} aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="services-info" aria-labelledby="services-info-title">
        <div className="services-info__content">
          <span className="services-eyebrow">Mantenimiento preventivo</span>
          <h2 id="services-info-title">
            El mantenimiento empieza con los pequeños detalles
          </h2>
          <p>
            Las revisiones periódicas ayudan a identificar necesidades de
            mantenimiento a tiempo y a conservar el buen funcionamiento de tu
            vehículo en el uso diario.
          </p>
        </div>

        <div className="services-info__visual" aria-hidden="true">
          <div className="services-info__car">
            <CarFront size={104} strokeWidth={1.4} />
          </div>
          <span className="services-info__tool services-info__tool--wrench">
            <Wrench size={24} />
          </span>
          <span className="services-info__tool services-info__tool--shield">
            <ShieldCheck size={24} />
          </span>
          <span className="services-info__track" />
        </div>
      </section>

      <section className="services-cta" aria-labelledby="services-cta-title">
        <div>
          <span className="services-cta__label">AutoCare SV</span>
          <h2 id="services-cta-title">
            ¿Necesitas darle mantenimiento a tu vehículo?
          </h2>
          <p>
            Agenda una visita y encuentra el cuidado adecuado para tu vehículo.
          </p>
        </div>
        <Link className="services-cta__button" to="/agendar-cita">
          Agendar cita <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}

export default Services;
