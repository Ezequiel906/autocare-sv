import axios from "axios";
import {
  ArrowLeft,
  ArrowRight,
  BatteryCharging,
  CarFront,
  CheckCircle2,
  CircleGauge,
  ClipboardCheck,
  Droplets,
  Funnel,
  ScanSearch,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "./ServiceDetail.css";

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
      return <Droplets size={104} strokeWidth={1.35} />;
    case "filtros":
      return <Funnel size={104} strokeWidth={1.35} />;
    case "control-de-fluidos":
      return <CircleGauge size={104} strokeWidth={1.35} />;
    case "baterias":
      return <BatteryCharging size={104} strokeWidth={1.35} />;
    case "inspeccion-rapida":
      return <ScanSearch size={104} strokeWidth={1.35} />;
    default:
      return <Wrench size={104} strokeWidth={1.35} />;
  }
}

function ServiceNotFound() {
  return (
    <section className="service-not-found" aria-labelledby="service-not-found-title">
      <span className="service-not-found__icon" aria-hidden="true">
        <ScanSearch size={42} />
      </span>
      <h1 id="service-not-found-title">Servicio no encontrado</h1>
      <p>
        El servicio que buscas no está disponible. Puedes volver para conocer las
        opciones de mantenimiento de AutoCare SV.
      </p>
      <Link className="service-detail-button service-detail-button--primary" to="/servicios">
        <ArrowLeft size={18} aria-hidden="true" />
        Volver a servicios
      </Link>
    </section>
  );
}

function ServiceDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [serviceError, setServiceError] = useState("");
  const [isNotFound, setIsNotFound] = useState(false);

  const loadService = useCallback(async () => {
    setIsLoading(true);
    setServiceError("");
    setIsNotFound(false);
    setService(null);

    if (!slug) {
      setIsNotFound(true);
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.get<Service>(
        `/services/slug/${encodeURIComponent(slug)}`,
      );
      setService(response.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        setIsNotFound(true);
      } else {
        setServiceError(
          "No pudimos cargar la información del servicio. Inténtalo nuevamente.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    // Synchronize the detail whenever the route slug changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadService();
  }, [loadService]);

  if (isLoading) {
    return (
      <section className="service-not-found" role="status" aria-live="polite">
        <span className="service-not-found__icon" aria-hidden="true">
          <Wrench size={42} />
        </span>
        <h1>Cargando servicio...</h1>
        <p>Estamos consultando la información del servicio.</p>
      </section>
    );
  }

  if (isNotFound) {
    return <ServiceNotFound />;
  }

  if (serviceError) {
    return (
      <section className="service-not-found" role="alert" aria-labelledby="service-error-title">
        <span className="service-not-found__icon" aria-hidden="true">
          <CircleGauge size={42} />
        </span>
        <h1 id="service-error-title">No pudimos cargar el servicio</h1>
        <p>{serviceError}</p>
        <button
          className="service-detail-button service-detail-button--primary"
          type="button"
          onClick={() => void loadService()}
        >
          Reintentar
        </button>
      </section>
    );
  }

  if (!service) {
    return <ServiceNotFound />;
  }

  return (
    <div className="service-detail-page">
      <nav className="service-breadcrumb" aria-label="Ruta de navegación">
        <Link to="/">Inicio</Link>
        <span aria-hidden="true">/</span>
        <Link to="/servicios">Servicios</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{service.name}</span>
      </nav>

      <section className="service-detail-hero" aria-labelledby="service-detail-title">
        <div className="service-detail-hero__content">
          <span className="service-detail-eyebrow">
            <Wrench size={15} aria-hidden="true" />
            {service.category}
          </span>
          <h1 id="service-detail-title">{service.name}</h1>
          <p>{service.description}</p>
          <dl className="service-detail-hero__meta">
            <div>
              <dt>Precio</dt>
              <dd>${service.price}</dd>
            </div>
            <div>
              <dt>Duración</dt>
              <dd>{service.duration} min</dd>
            </div>
          </dl>
          <div className="service-detail-hero__actions">
            <Link
              className="service-detail-button service-detail-button--primary"
              to="/agendar-cita"
            >
              Agendar cita
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link
              className="service-detail-button service-detail-button--secondary"
              to="/servicios"
            >
              <ArrowLeft size={18} aria-hidden="true" />
              Volver a servicios
            </Link>
          </div>
        </div>

        <div className="service-detail-hero__visual" aria-hidden="true">
          <span className="service-detail-hero__orbit" />
          <span className="service-detail-hero__orbit service-detail-hero__orbit--inner" />
          <div className="service-detail-hero__main-icon">
            {getServiceIcon(service.slug)}
          </div>
          <span className="service-detail-hero__visual-detail service-detail-hero__visual-detail--car">
            <CarFront size={25} />
          </span>
          <span className="service-detail-hero__visual-detail service-detail-hero__visual-detail--shield">
            <ShieldCheck size={25} />
          </span>
          <span className="service-detail-hero__track" />
        </div>
      </section>

      <section className="service-includes" aria-labelledby="service-includes-title">
        <div className="service-includes__heading">
          <span className="service-detail-eyebrow">Atención del vehículo</span>
          <h2 id="service-includes-title">¿Qué incluye este servicio?</h2>
          <p>
            Un proceso de atención enfocado en revisar las necesidades del vehículo
            y orientar su mantenimiento de forma clara.
          </p>
        </div>

        <div className="service-includes__grid">
          <article className="service-concept">
            <span className="service-concept__icon">
              <ScanSearch size={25} aria-hidden="true" />
            </span>
            <h3>Revisión</h3>
            <p>Observamos el estado general relacionado con el servicio solicitado.</p>
          </article>
          <article className="service-concept">
            <span className="service-concept__icon">
              <ClipboardCheck size={25} aria-hidden="true" />
            </span>
            <h3>Atención</h3>
            <p>Atendemos las necesidades identificadas con un proceso ordenado.</p>
          </article>
          <article className="service-concept">
            <span className="service-concept__icon">
              <CheckCircle2 size={25} aria-hidden="true" />
            </span>
            <h3>Seguimiento</h3>
            <p>Compartimos orientación general para continuar cuidando el vehículo.</p>
          </article>
        </div>
      </section>

      <section className="service-detail-cta" aria-labelledby="service-detail-cta-title">
        <div>
          <span className="service-detail-cta__label">Cuida cada recorrido</span>
          <h2 id="service-detail-cta-title">
            ¿Quieres mantener tu vehículo en buenas condiciones?
          </h2>
          <p>Agenda una visita y dale a tu vehículo la atención que necesita.</p>
        </div>
        <Link className="service-detail-cta__button" to="/agendar-cita">
          Agendar cita
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}

export default ServiceDetail;
