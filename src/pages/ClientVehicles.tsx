import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { CarFront, CheckCircle2, CircleAlert, Pencil, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { z } from "zod";
import { useAuth } from "../context/AuthContext";
import "./ClientVehicles.css";

const currentYear = new Date().getFullYear();

const vehicleSchema = z.object({
  brand: z.string().trim().min(1, "La marca es obligatoria."),
  model: z.string().trim().min(1, "El modelo es obligatorio."),
  year: z
    .number({ error: "Ingresa un año válido." })
    .int("El año debe ser un número entero.")
    .min(1900, "Ingresa un año a partir de 1900.")
    .max(currentYear + 1, `El año no puede ser mayor que ${currentYear + 1}.`),
  plate: z.string().trim().min(1, "La placa es obligatoria."),
  vehicleType: z.string().min(1, "Selecciona un tipo de vehículo."),
  color: z.string().trim().min(1, "El color es obligatorio."),
  mileage: z
    .number({ error: "Ingresa un kilometraje válido." })
    .nonnegative("El kilometraje debe ser mayor o igual a 0."),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

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

function ClientVehicles() {
  const { accessToken } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
  const [vehiclesError, setVehiclesError] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [deletingVehicleId, setDeletingVehicleId] = useState<number | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      brand: "",
      model: "",
      plate: "",
      vehicleType: "",
      color: "",
    },
  });

  const loadVehicles = useCallback(async () => {
    setIsLoadingVehicles(true);
    setVehiclesError("");

    if (!accessToken) {
      setVehicles([]);
      setVehiclesError("Tu sesión no es válida. Inicia sesión nuevamente.");
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
      setVehiclesError("No se pudieron cargar tus vehículos. Inténtalo nuevamente.");
    } finally {
      setIsLoadingVehicles(false);
    }
  }, [accessToken]);

  useEffect(() => {
    // Initial synchronization with the authenticated vehicles endpoint.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadVehicles();
  }, [loadVehicles]);

  const openForm = () => {
    reset();
    setEditingVehicle(null);
    setSubmissionError("");
    setSuccessMessage("");
    setIsFormOpen(true);
  };

  const closeForm = () => {
    reset();
    setEditingVehicle(null);
    setSubmissionError("");
    setIsFormOpen(false);
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setSubmissionError("");
    setSuccessMessage("");
    reset({
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      plate: vehicle.plate,
      vehicleType: vehicle.type,
      color: vehicle.color ?? "",
      mileage: vehicle.mileage ?? 0,
    });
    setIsFormOpen(true);
  };

  const handleCreateVehicle = async (data: VehicleFormValues) => {
    setSubmissionError("");
    setSuccessMessage("");

    if (!accessToken) {
      setSubmissionError("Tu sesión no es válida. Inicia sesión nuevamente.");
      return;
    }

    setIsSubmitting(true);

    try {
      const vehicleData = {
        brand: data.brand,
        model: data.model,
        year: data.year,
        plate: data.plate,
        type: data.vehicleType,
        color: data.color,
        mileage: data.mileage,
      };
      const requestConfig = {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      };

      if (editingVehicle) {
        await axios.patch(
          `/vehicles/${editingVehicle.id}`,
          vehicleData,
          requestConfig,
        );
      } else {
        await axios.post(
          "/vehicles",
          vehicleData,
          requestConfig,
        );
      }

      reset();
      setIsFormOpen(false);
      setSuccessMessage(
        editingVehicle
          ? "El vehículo fue actualizado correctamente."
          : "El vehículo fue registrado correctamente.",
      );
      setEditingVehicle(null);
      await loadVehicles();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        setSubmissionError("La placa ingresada ya está registrada.");
      } else {
        setSubmissionError(
          editingVehicle
            ? "No se pudo actualizar el vehículo. Inténtalo nuevamente."
            : "No se pudo registrar el vehículo. Inténtalo nuevamente.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVehicle = async (vehicle: Vehicle) => {
    setSubmissionError("");
    setSuccessMessage("");

    if (!accessToken) {
      setSubmissionError("Tu sesión no es válida. Inicia sesión nuevamente.");
      return;
    }

    setDeletingVehicleId(vehicle.id);

    try {
      await axios.delete(`/vehicles/${vehicle.id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (editingVehicle?.id === vehicle.id) {
        reset();
        setEditingVehicle(null);
        setIsFormOpen(false);
      }

      setSuccessMessage("El vehículo fue eliminado correctamente.");
      await loadVehicles();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        Swal.showValidationMessage(
          "No se puede eliminar este vehículo porque tiene citas o historial de servicios asociado.",
        );
      } else {
        setSubmissionError("No se pudo eliminar el vehículo. Inténtalo nuevamente.");
      }
    } finally {
      setDeletingVehicleId(null);
    }
  };

  const confirmDeleteVehicle = async (vehicle: Vehicle) => {
    await Swal.fire({
      title: "¿Eliminar vehículo?",
      text: `Esta acción eliminará el vehículo de tu cuenta.\n\n${vehicle.brand} ${vehicle.model} · ${vehicle.plate}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar vehículo",
      cancelButtonText: "Cancelar",
      buttonsStyling: false,
      reverseButtons: true,
      focusCancel: true,
      showLoaderOnConfirm: true,
      allowOutsideClick: () => !Swal.isLoading(),
      customClass: {
        container: "autocare-alert-container",
        popup: "autocare-alert",
        icon: "autocare-alert__icon",
        title: "autocare-alert__title",
        htmlContainer: "autocare-alert__content",
        actions: "autocare-alert__actions",
        confirmButton: "autocare-alert__button autocare-alert__button--danger",
        cancelButton: "autocare-alert__button autocare-alert__button--cancel",
      },
      preConfirm: async () => {
        await handleDeleteVehicle(vehicle);
      },
    });
  };

  return (
    <div className="client-vehicles">
      <header className="client-vehicles__header">
        <div>
          <span>Garaje</span>
          <h1>Mis vehículos</h1>
          <p>Administra los vehículos que utilizas para tus citas y servicios.</p>
        </div>
        {!isFormOpen && (
          <button className="client-vehicles__add-button" type="button" onClick={openForm}>
            <Plus size={18} aria-hidden="true" />
            Agregar vehículo
          </button>
        )}
      </header>

      {successMessage && (
        <div className="vehicle-form-card__pending" role="status" aria-live="polite">
          <CheckCircle2 size={22} aria-hidden="true" />
          <div>
            <h3>Vehículo registrado</h3>
            <p>{successMessage}</p>
          </div>
        </div>
      )}

      {!isFormOpen && submissionError && (
        <div className="vehicle-form-card__pending" role="alert">
          <CircleAlert size={22} aria-hidden="true" />
          <div>
            <h3>No se pudo completar la acción</h3>
            <p>{submissionError}</p>
          </div>
        </div>
      )}

      {isFormOpen ? (
        <section className="vehicle-form-card" aria-labelledby="vehicle-form-title">
          <div className="vehicle-form-card__heading">
            <div>
              <span>{editingVehicle ? "Editar vehículo" : "Nuevo registro"}</span>
              <h2 id="vehicle-form-title">Información del vehículo</h2>
              <p>Completa los datos para preparar el registro de tu vehículo.</p>
            </div>
            <button type="button" aria-label="Cerrar formulario" onClick={closeForm}>
              <X size={21} aria-hidden="true" />
            </button>
          </div>

          {submissionError && (
            <div className="vehicle-form-card__pending" role="alert">
              <CircleAlert size={22} aria-hidden="true" />
              <div>
                <h3>No se pudo completar el registro</h3>
                <p>{submissionError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(handleCreateVehicle)} noValidate>
            <div className="vehicle-form__grid">
              <div className="vehicle-field">
                <label htmlFor="vehicle-brand">Marca</label>
                <input id="vehicle-brand" type="text" autoComplete="off" aria-invalid={Boolean(errors.brand)} aria-describedby={errors.brand ? "vehicle-brand-error" : undefined} {...register("brand")} />
                {errors.brand && <p id="vehicle-brand-error" role="alert">{errors.brand.message}</p>}
              </div>

              <div className="vehicle-field">
                <label htmlFor="vehicle-model">Modelo</label>
                <input id="vehicle-model" type="text" autoComplete="off" aria-invalid={Boolean(errors.model)} aria-describedby={errors.model ? "vehicle-model-error" : undefined} {...register("model")} />
                {errors.model && <p id="vehicle-model-error" role="alert">{errors.model.message}</p>}
              </div>

              <div className="vehicle-field">
                <label htmlFor="vehicle-year">Año</label>
                <input id="vehicle-year" type="number" inputMode="numeric" min="1900" max={currentYear + 1} aria-invalid={Boolean(errors.year)} aria-describedby={errors.year ? "vehicle-year-error" : undefined} {...register("year", { valueAsNumber: true })} />
                {errors.year && <p id="vehicle-year-error" role="alert">{errors.year.message}</p>}
              </div>

              <div className="vehicle-field">
                <label htmlFor="vehicle-plate">Placa</label>
                <input id="vehicle-plate" type="text" autoComplete="off" aria-invalid={Boolean(errors.plate)} aria-describedby={errors.plate ? "vehicle-plate-error" : undefined} {...register("plate")} />
                {errors.plate && <p id="vehicle-plate-error" role="alert">{errors.plate.message}</p>}
              </div>

              <div className="vehicle-field">
                <label htmlFor="vehicle-type">Tipo de vehículo</label>
                <select id="vehicle-type" aria-invalid={Boolean(errors.vehicleType)} aria-describedby={errors.vehicleType ? "vehicle-type-error" : undefined} {...register("vehicleType")}>
                  <option value="">Selecciona un tipo</option>
                  <option value="automovil">Automóvil</option>
                  <option value="suv">SUV</option>
                  <option value="pickup">Pickup</option>
                  <option value="camioneta">Camioneta</option>
                  <option value="motocicleta">Motocicleta</option>
                </select>
                {errors.vehicleType && <p id="vehicle-type-error" role="alert">{errors.vehicleType.message}</p>}
              </div>

              <div className="vehicle-field">
                <label htmlFor="vehicle-color">Color</label>
                <input id="vehicle-color" type="text" autoComplete="off" aria-invalid={Boolean(errors.color)} aria-describedby={errors.color ? "vehicle-color-error" : undefined} {...register("color")} />
                {errors.color && <p id="vehicle-color-error" role="alert">{errors.color.message}</p>}
              </div>

              <div className="vehicle-field vehicle-field--full">
                <label htmlFor="vehicle-mileage">Kilometraje</label>
                <input id="vehicle-mileage" type="number" inputMode="numeric" min="0" aria-invalid={Boolean(errors.mileage)} aria-describedby={errors.mileage ? "vehicle-mileage-error" : undefined} {...register("mileage", { valueAsNumber: true })} />
                {errors.mileage && <p id="vehicle-mileage-error" role="alert">{errors.mileage.message}</p>}
              </div>
            </div>

            <div className="vehicle-form__actions">
              <button type="button" className="vehicle-form__cancel" onClick={closeForm}>Cancelar</button>
              <button type="submit" className="vehicle-form__submit" disabled={isSubmitting}>
                {isSubmitting
                  ? editingVehicle
                    ? "Guardando cambios..."
                    : "Guardando vehículo..."
                  : editingVehicle
                    ? "Guardar cambios"
                    : "Preparar registro"}
              </button>
            </div>
          </form>
        </section>
      ) : isLoadingVehicles ? (
        <section className="client-vehicles-empty" aria-live="polite">
          <div className="client-vehicles-empty__visual" aria-hidden="true">
            <CarFront size={72} strokeWidth={1.45} />
          </div>
          <h2>Cargando vehículos...</h2>
        </section>
      ) : vehiclesError ? (
        <section className="client-vehicles-empty" aria-labelledby="vehicles-error-title">
          <div className="client-vehicles-empty__visual" aria-hidden="true">
            <CircleAlert size={64} strokeWidth={1.45} />
          </div>
          <h2 id="vehicles-error-title">No se pudieron cargar tus vehículos</h2>
          <p>{vehiclesError}</p>
          <button type="button" onClick={() => void loadVehicles()}>
            <RotateCcw size={18} aria-hidden="true" />
            Volver a intentar
          </button>
        </section>
      ) : vehicles.length === 0 ? (
        <section className="client-vehicles-empty" aria-labelledby="vehicles-empty-title">
          <div className="client-vehicles-empty__visual" aria-hidden="true">
            <span className="client-vehicles-empty__orbit" />
            <CarFront size={72} strokeWidth={1.45} />
          </div>
          <span className="client-vehicles-empty__label">Tu garaje está listo</span>
          <h2 id="vehicles-empty-title">Aún no tienes vehículos registrados</h2>
          <p>Registra un vehículo para agilizar la información de tus futuras citas y servicios.</p>
          <button type="button" onClick={openForm}>
            <Plus size={18} aria-hidden="true" />
            Agregar vehículo
          </button>
        </section>
      ) : (
        <section className="vehicle-list" aria-label="Vehículos registrados">
          {vehicles.map((vehicle) => (
            <article className="vehicle-card" key={vehicle.id}>
              <header className="vehicle-card__header">
                <span className="vehicle-card__icon" aria-hidden="true">
                  <CarFront size={26} />
                </span>
                <div className="vehicle-card__identity">
                  <h2>{vehicle.brand} {vehicle.model}</h2>
                  <p className="vehicle-card__type">
                    {vehicle.type === "automovil"
                      ? "Automóvil"
                      : vehicle.type === "suv"
                        ? "SUV"
                        : vehicle.type === "pickup"
                          ? "Pickup"
                          : vehicle.type === "camioneta"
                            ? "Camioneta"
                            : vehicle.type === "motocicleta"
                              ? "Motocicleta"
                              : vehicle.type}
                    <span aria-hidden="true">·</span>
                    {vehicle.year}
                  </p>
                </div>
              </header>

              <dl className="vehicle-card__details">
                <div className="vehicle-card__detail">
                  <dt className="vehicle-card__label">Placa</dt>
                  <dd className="vehicle-card__value">{vehicle.plate}</dd>
                </div>
                <div className="vehicle-card__detail">
                  <dt className="vehicle-card__label">Color</dt>
                  <dd className="vehicle-card__value">
                    {vehicle.color ?? "No registrado"}
                  </dd>
                </div>
                <div className="vehicle-card__detail vehicle-card__detail--wide">
                  <dt className="vehicle-card__label">Kilometraje</dt>
                  <dd className="vehicle-card__value">
                    {vehicle.mileage !== null
                      ? `${vehicle.mileage.toLocaleString("es-SV")} km`
                      : "No registrado"}
                  </dd>
                </div>
              </dl>

              <div className="vehicle-form__actions">
                <button
                  type="button"
                  className="vehicle-form__cancel"
                  onClick={() => handleEditVehicle(vehicle)}
                >
                  <Pencil size={16} aria-hidden="true" />
                  Editar
                </button>
                <button
                  type="button"
                  className="vehicle-form__cancel"
                  disabled={deletingVehicleId === vehicle.id}
                  onClick={() => void confirmDeleteVehicle(vehicle)}
                >
                  <Trash2 size={16} aria-hidden="true" />
                  {deletingVehicleId === vehicle.id ? "Eliminando..." : "Eliminar"}
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

    </div>
  );
}

export default ClientVehicles;
