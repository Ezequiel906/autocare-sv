import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { format, isBefore, parseISO, startOfDay } from "date-fns";
import {
  ArrowRight,
  CalendarDays,
  CarFront,
  ClipboardList,
  Clock3,
  MessageSquareText,
  RefreshCw,
  Wrench,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { z } from "zod";
import { useAuth } from "../context/AuthContext";
import "./BookAppointment.css";

const today = format(new Date(), "yyyy-MM-dd");

const appointmentSchema = z.object({
  vehicleId: z.number().int().positive("Selecciona un vehículo."),
  serviceIds: z.array(z.number()).min(1, "Selecciona al menos un servicio."),
  date: z
    .string()
    .min(1, "Selecciona una fecha.")
    .refine(
      (value) => !value || !isBefore(startOfDay(parseISO(value)), startOfDay(new Date())),
      "La fecha no puede ser anterior al día de hoy.",
    ),
  time: z.string().min(1, "Selecciona una hora."),
  customerNotes: z.string().trim().optional(),
});

type AppointmentFormValues = z.infer<typeof appointmentSchema>;

type Vehicle = {
  id: number;
  brand: string;
  model: string;
  year: number;
  plate: string;
  type: string;
  color: string | null;
  mileage: number | null;
  createdAt: string;
  updatedAt: string;
};

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

type AppointmentResponse = {
  id: number;
  status: string;
};

const alertClasses = {
  container: "autocare-alert-container",
  popup: "autocare-alert",
  icon: "autocare-alert__icon",
  title: "autocare-alert__title",
  htmlContainer: "autocare-alert__content",
  actions: "autocare-alert__actions",
  confirmButton: "autocare-alert__button autocare-alert__button--danger",
  cancelButton: "autocare-alert__button autocare-alert__button--cancel",
};

function BookAppointment() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [vehiclesError, setVehiclesError] = useState("");
  const [servicesError, setServicesError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      vehicleId: 0,
      serviceIds: [],
      date: "",
      time: "",
      customerNotes: "",
    },
  });

  const [vehicleId, serviceIds, date, time] = useWatch({
    control,
    name: ["vehicleId", "serviceIds", "date", "time"],
  });

  const loadVehicles = useCallback(async () => {
    setIsLoadingVehicles(true);
    setVehiclesError("");

    if (!accessToken) {
      setVehicles([]);
      setVehiclesError("Inicia sesión para consultar tus vehículos y agendar una cita.");
      setIsLoadingVehicles(false);
      return;
    }

    try {
      const response = await axios.get<Vehicle[]>("/vehicles", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setVehicles(response.data);
    } catch {
      setVehicles([]);
      setVehiclesError("No pudimos cargar tus vehículos. Inténtalo nuevamente.");
    } finally {
      setIsLoadingVehicles(false);
    }
  }, [accessToken]);

  const loadServices = useCallback(async () => {
    setIsLoadingServices(true);
    setServicesError("");

    try {
      const response = await axios.get<Service[]>("/services");
      setServices(response.data);
    } catch {
      setServices([]);
      setServicesError("No pudimos cargar los servicios. Inténtalo nuevamente.");
    } finally {
      setIsLoadingServices(false);
    }
  }, []);

  useEffect(() => {
    // Initial synchronization with the appointment form resources.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadVehicles();
    void loadServices();
  }, [loadServices, loadVehicles]);

  const showSessionAlert = async () => {
    const result = await Swal.fire({
      title: "Sesión requerida",
      text: "Inicia sesión para solicitar una cita.",
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "Ir a iniciar sesión",
      cancelButtonText: "Cerrar",
      buttonsStyling: false,
      customClass: alertClasses,
    });

    if (result.isConfirmed) {
      navigate("/login");
    }
  };

  const submitAppointment = async (data: AppointmentFormValues) => {
    if (!accessToken) {
      await showSessionAlert();
      return;
    }

    setIsSubmitting(true);

    try {
      const customerNotes = data.customerNotes?.trim();
      const appointmentData = {
        vehicleId: data.vehicleId,
        date: new Date(`${data.date}T${data.time}:00`).toISOString(),
        serviceIds: data.serviceIds,
        ...(customerNotes ? { customerNotes } : {}),
      };

      await axios.post<AppointmentResponse>(
        "/appointments",
        appointmentData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      reset();
      const result = await Swal.fire({
        title: "¡Cita solicitada!",
        text: "Tu solicitud de cita fue registrada correctamente y quedó pendiente de confirmación.",
        icon: "success",
        showCancelButton: true,
        confirmButtonText: "Ver mis citas",
        cancelButtonText: "Cerrar",
        buttonsStyling: false,
        customClass: alertClasses,
      });

      if (result.isConfirmed) {
        navigate("/cuenta/citas");
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        await showSessionAlert();
      } else {
        await Swal.fire({
          title: "No pudimos registrar la cita",
          text: "No pudimos registrar tu cita. Inténtalo nuevamente.",
          icon: "error",
          confirmButtonText: "Entendido",
          buttonsStyling: false,
          customClass: alertClasses,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === vehicleId);
  const selectedServices = services.filter((service) => serviceIds.includes(service.id));
  const dateSummary = date ? format(parseISO(date), "dd/MM/yyyy") : "Aún no seleccionada";
  const isLoadingResources = isLoadingVehicles || isLoadingServices;

  return (
    <div className="booking-page">
      <header className="booking-header">
        <span className="booking-eyebrow">
          <CalendarDays size={16} aria-hidden="true" />
          Agenda tu visita
        </span>
        <h1>Reserva tu cita en AutoCare SV</h1>
        <p>
          Cuéntanos qué necesita tu vehículo y elige el momento que mejor te convenga.
        </p>
      </header>

      {!accessToken ? (
        <section className="booking-resource-state" aria-labelledby="booking-session-title">
          <CarFront size={38} aria-hidden="true" />
          <h2 id="booking-session-title">Inicia sesión para agendar</h2>
          <p>Necesitamos identificar tus vehículos antes de registrar una cita.</p>
          <Link className="booking-button booking-button--primary" to="/login">
            Ir a iniciar sesión
          </Link>
        </section>
      ) : isLoadingResources ? (
        <section className="booking-resource-state" role="status" aria-live="polite">
          <RefreshCw size={38} aria-hidden="true" />
          <h2>Preparando el formulario...</h2>
          <p>Estamos cargando tus vehículos y los servicios disponibles.</p>
        </section>
      ) : vehiclesError || servicesError ? (
        <section className="booking-resource-state" role="alert">
          <Wrench size={38} aria-hidden="true" />
          <h2>No pudimos preparar tu cita</h2>
          <p>{vehiclesError || servicesError}</p>
          <button
            className="booking-button booking-button--primary"
            type="button"
            onClick={() => {
              if (vehiclesError) void loadVehicles();
              if (servicesError) void loadServices();
            }}
          >
            Reintentar
          </button>
        </section>
      ) : vehicles.length === 0 ? (
        <section className="booking-resource-state" aria-labelledby="booking-vehicles-empty-title">
          <CarFront size={38} aria-hidden="true" />
          <h2 id="booking-vehicles-empty-title">Primero registra un vehículo</h2>
          <p>Necesitas tener al menos un vehículo registrado para solicitar una cita.</p>
          <Link className="booking-button booking-button--primary" to="/cuenta/vehiculos">
            Registrar vehículo
          </Link>
        </section>
      ) : services.length === 0 ? (
        <section className="booking-resource-state" aria-labelledby="booking-services-empty-title">
          <Wrench size={38} aria-hidden="true" />
          <h2 id="booking-services-empty-title">No hay servicios disponibles</h2>
          <p>En este momento no encontramos servicios habilitados para agendar.</p>
        </section>
      ) : (
        <div className="booking-layout">
          <form className="booking-form" onSubmit={handleSubmit(submitAppointment)} noValidate>
            <section className="booking-form-section" aria-labelledby="booking-service-title">
              <div className="booking-form-section__heading">
                <span><Wrench size={21} aria-hidden="true" /></span>
                <div>
                  <p>Paso 1</p>
                  <h2 id="booking-service-title">Servicios</h2>
                </div>
              </div>
              <Controller
                control={control}
                name="serviceIds"
                render={({ field }) => (
                  <div className="booking-service-options">
                    {services.map((service) => {
                      const isSelected = field.value.includes(service.id);

                      return (
                        <label
                          className={`booking-service-option${isSelected ? " booking-service-option--selected" : ""}`}
                          key={service.id}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              field.onChange(
                                isSelected
                                  ? field.value.filter((id) => id !== service.id)
                                  : [...field.value, service.id],
                              );
                            }}
                          />
                          <span className="booking-service-option__content">
                            <strong>{service.name}</strong>
                            <small>{service.description}</small>
                            <span>
                              ${service.price} · {service.duration} min
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              />
              {errors.serviceIds && (
                <p className="booking-field__error" role="alert">
                  {errors.serviceIds.message}
                </p>
              )}
            </section>

            <section className="booking-form-section" aria-labelledby="booking-vehicle-title">
              <div className="booking-form-section__heading">
                <span><CarFront size={21} aria-hidden="true" /></span>
                <div>
                  <p>Paso 2</p>
                  <h2 id="booking-vehicle-title">Tu vehículo</h2>
                </div>
              </div>
              <div className="booking-field">
                <label htmlFor="vehicleId">Vehículo</label>
                <select
                  id="vehicleId"
                  aria-invalid={Boolean(errors.vehicleId)}
                  aria-describedby={errors.vehicleId ? "vehicle-error" : undefined}
                  {...register("vehicleId", { valueAsNumber: true })}
                >
                  <option value={0}>Selecciona un vehículo</option>
                  {vehicles.map((vehicle) => (
                    <option value={vehicle.id} key={vehicle.id}>
                      {vehicle.brand} {vehicle.model} · {vehicle.plate}
                    </option>
                  ))}
                </select>
                {errors.vehicleId && (
                  <p className="booking-field__error" id="vehicle-error" role="alert">
                    {errors.vehicleId.message}
                  </p>
                )}
              </div>
            </section>

            <section className="booking-form-section" aria-labelledby="booking-date-title">
              <div className="booking-form-section__heading">
                <span><CalendarDays size={21} aria-hidden="true" /></span>
                <div>
                  <p>Paso 3</p>
                  <h2 id="booking-date-title">¿Cuándo quieres venir?</h2>
                </div>
              </div>
              <div className="booking-fields-grid">
                <div className="booking-field">
                  <label htmlFor="date">Fecha</label>
                  <input id="date" type="date" min={today} aria-invalid={Boolean(errors.date)} aria-describedby={errors.date ? "date-error" : undefined} {...register("date")} />
                  {errors.date && <p className="booking-field__error" id="date-error" role="alert">{errors.date.message}</p>}
                </div>
                <div className="booking-field">
                  <label htmlFor="time">Hora</label>
                  <select id="time" aria-invalid={Boolean(errors.time)} aria-describedby={errors.time ? "time-error booking-time-note" : "booking-time-note"} {...register("time")}>
                    <option value="">Selecciona una hora</option>
                    <option value="08:00">08:00</option>
                    <option value="09:00">09:00</option>
                    <option value="10:00">10:00</option>
                    <option value="11:00">11:00</option>
                    <option value="13:00">13:00</option>
                    <option value="14:00">14:00</option>
                    <option value="15:00">15:00</option>
                    <option value="16:00">16:00</option>
                  </select>
                  {errors.time && <p className="booking-field__error" id="time-error" role="alert">{errors.time.message}</p>}
                </div>
              </div>
              <p className="booking-form__note" id="booking-time-note">
                <Clock3 size={16} aria-hidden="true" />
                Los horarios mostrados son referenciales. La disponibilidad se confirmará al procesar tu solicitud.
              </p>
            </section>

            <section className="booking-form-section" aria-labelledby="booking-comments-title">
              <div className="booking-form-section__heading">
                <span><MessageSquareText size={21} aria-hidden="true" /></span>
                <div>
                  <p>Opcional</p>
                  <h2 id="booking-comments-title">¿Hay algo que debamos saber?</h2>
                </div>
              </div>
              <div className="booking-field">
                <label htmlFor="customerNotes">Comentarios <span>(opcional)</span></label>
                <textarea id="customerNotes" rows={5} placeholder="Cuéntanos brevemente si notas algún problema o tienes alguna solicitud especial." {...register("customerNotes")} />
              </div>
            </section>

            <button className="booking-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Registrando cita..." : "Solicitar cita"}
              {!isSubmitting && <ArrowRight size={19} aria-hidden="true" />}
            </button>
          </form>

          <aside className="booking-summary" aria-labelledby="booking-summary-title">
            <div className="booking-summary__heading">
              <span><ClipboardList size={22} aria-hidden="true" /></span>
              <div>
                <p>Vista previa</p>
                <h2 id="booking-summary-title">Resumen de tu solicitud</h2>
              </div>
            </div>
            <dl>
              <div>
                <dt>Servicios</dt>
                <dd>
                  {selectedServices.length > 0
                    ? selectedServices.map((service) => service.name).join(", ")
                    : "Aún no seleccionados"}
                </dd>
              </div>
              <div>
                <dt>Vehículo</dt>
                <dd>
                  {selectedVehicle
                    ? `${selectedVehicle.brand} ${selectedVehicle.model} · ${selectedVehicle.plate}`
                    : "Aún no seleccionado"}
                </dd>
              </div>
              <div>
                <dt>Fecha</dt>
                <dd>{dateSummary}</dd>
              </div>
              <div>
                <dt>Hora</dt>
                <dd>{time || "Aún no seleccionada"}</dd>
              </div>
            </dl>
            <p className="booking-summary__note">
              Esta solicitud no confirma una cita. Revisaremos la información antes de confirmar la disponibilidad.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}

export default BookAppointment;
