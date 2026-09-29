import {
  ArrowRight,
  CarFront,
  CircleGauge,
  Clock3,
  Droplets,
  Funnel,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import { Link } from "react-router-dom";
import "./Home.css";

function Home() {
  return (
    <div className="home">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero__content">
          <span className="home-eyebrow">
            <Wrench size={15} aria-hidden="true" />
            Mantenimiento automotriz
          </span>
          <h1 id="home-title">
            Tu vehículo merece el <span>mejor cuidado.</span>
          </h1>
          <p>
            Mantenimiento automotriz confiable y práctico para que conduzcas con
            tranquilidad en cada recorrido.
          </p>
          <div className="home-hero__actions">
            <Link className="home-button home-button--primary" to="/agendar-cita">
              Agendar cita
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link className="home-button home-button--secondary" to="/servicios">
              Ver servicios
            </Link>
          </div>
        </div>

        <div className="home-hero__visual" aria-hidden="true">
          <div className="home-hero__visual-grid" />
          <div className="home-hero__accent-line" />
          <div className="home-hero__car">
            <CarFront size={148} strokeWidth={1.25} />
          </div>
          <div className="home-hero__detail home-hero__detail--top">
            <CircleGauge size={22} />
            <span>Diagnóstico</span>
          </div>
          <div className="home-hero__detail home-hero__detail--bottom">
            <ShieldCheck size={22} />
            <span>Cuidado confiable</span>
          </div>
          <span className="home-hero__wheel home-hero__wheel--left" />
          <span className="home-hero__wheel home-hero__wheel--right" />
        </div>
      </section>

      <section className="home-section home-services" aria-labelledby="services-title">
        <div className="home-section__heading">
          <span className="home-section__label">Servicios destacados</span>
          <h2 id="services-title">Servicios para mantener tu vehículo en marcha</h2>
          <p>
            Atención esencial para cuidar el rendimiento y prolongar la vida útil
            de tu vehículo.
          </p>
        </div>

        <div className="home-services__grid">
          <article className="home-service-card">
            <div className="home-service-card__icon">
              <Droplets size={27} aria-hidden="true" />
            </div>
            <h3>Cambio de aceite</h3>
            <p>
              Protege el motor y conserva un funcionamiento suave con el
              mantenimiento adecuado.
            </p>
            <Link to="/servicios">
              Conocer más <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </article>

          <article className="home-service-card">
            <div className="home-service-card__icon">
              <Funnel size={27} aria-hidden="true" />
            </div>
            <h3>Filtros</h3>
            <p>
              Mantén limpio el flujo de aire y fluidos que necesita tu vehículo
              para responder mejor.
            </p>
            <Link to="/servicios">
              Conocer más <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </article>

          <article className="home-service-card">
            <div className="home-service-card__icon">
              <CircleGauge size={27} aria-hidden="true" />
            </div>
            <h3>Control de fluidos</h3>
            <p>
              Revisión de los niveles esenciales para una conducción segura y un
              desempeño consistente.
            </p>
            <Link to="/servicios">
              Conocer más <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </article>
        </div>
      </section>

      <section className="home-why" aria-labelledby="why-title">
        <div className="home-why__intro">
          <span className="home-section__label">Por qué AutoCare SV</span>
          <h2 id="why-title">Cuidamos cada detalle de tu vehículo</h2>
          <p>
            Un servicio claro y cuidadoso, pensado para darte confianza antes de
            volver al camino.
          </p>
        </div>

        <div className="home-why__benefits">
          <article className="home-benefit">
            <span><ShieldCheck size={24} aria-hidden="true" /></span>
            <div>
              <h3>Atención profesional</h3>
              <p>Cuidado responsable en cada revisión y mantenimiento.</p>
            </div>
          </article>
          <article className="home-benefit">
            <span><Clock3 size={24} aria-hidden="true" /></span>
            <div>
              <h3>Servicio eficiente</h3>
              <p>Un proceso práctico que respeta tu tiempo y tus necesidades.</p>
            </div>
          </article>
          <article className="home-benefit">
            <span><Sparkles size={24} aria-hidden="true" /></span>
            <div>
              <h3>Mantenimiento preventivo</h3>
              <p>Atención oportuna para mantener tu vehículo en buenas condiciones.</p>
            </div>
          </article>
        </div>
      </section>

      <section className="home-final-cta" aria-labelledby="final-cta-title">
        <div>
          <span className="home-section__label">Tu vehículo, en buenas manos</span>
          <h2 id="final-cta-title">¿Listo para cuidar tu vehículo?</h2>
          <p>Agenda tu próxima visita y dale a tu vehículo la atención que necesita.</p>
        </div>
        <Link className="home-button home-button--light" to="/agendar-cita">
          Agendar cita
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}

export default Home;
