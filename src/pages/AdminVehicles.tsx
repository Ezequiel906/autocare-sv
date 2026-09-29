import axios from "axios";
import {
  CarFront,
  CircleAlert,
  Mail,
  Pencil,
  Phone,
  RefreshCw,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { useAuth } from "../context/AuthContext";
import "./AdminVehicles.css";

type AdminVehicle = {
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
  customer: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
  };
};

type VehicleFilters = { search: string; type: string };

type VehicleFormValues = {
  brand: string;
  model: string;
  year: number;
  plate: string;
  type: string;
  color: string;
  mileage: number;
};

const emptyFilters: VehicleFilters = { search: "", type: "" };
const currentYear = new Date().getFullYear();

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

function getBackendMessage(data: unknown) {
  if (typeof data !== "object" || data === null || !("message" in data)) return null;
  const message = data.message;
  if (typeof message === "string") return message;
  if (Array.isArray(message) && message.every((item) => typeof item === "string")) return message.join(" ");
  return null;
}

function getRequestError(error: unknown, action: "update" | "delete") {
  if (!axios.isAxiosError(error)) {
    return action === "update"
      ? "No se pudo actualizar el vehículo. Inténtalo nuevamente."
      : "No se pudo eliminar el vehículo. Inténtalo nuevamente.";
  }

  switch (error.response?.status) {
    case 401: return "Tu sesión expiró o no es válida. Inicia sesión nuevamente.";
    case 403: return "Tu cuenta no tiene permisos para realizar esta acción.";
    case 404: return "El vehículo ya no existe.";
    case 409:
      return action === "update"
        ? "La placa ingresada ya está registrada."
        : "No se puede eliminar este vehículo porque tiene citas o historial de servicios asociado.";
    default:
      return getBackendMessage(error.response?.data) ?? (action === "update"
        ? "No se pudo actualizar el vehículo. Inténtalo nuevamente."
        : "No se pudo eliminar el vehículo. Inténtalo nuevamente.");
  }
}

function AdminVehicles() {
  const { accessToken } = useAuth();
  const [vehicles, setVehicles] = useState<AdminVehicle[]>([]);
  const [filters, setFilters] = useState<VehicleFilters>(emptyFilters);
  const [activeFilters, setActiveFilters] = useState<VehicleFilters>(emptyFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [vehiclesError, setVehiclesError] = useState("");
  const [editingVehicle, setEditingVehicle] = useState<AdminVehicle | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deletingVehicleId, setDeletingVehicleId] = useState<number | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VehicleFormValues>();

  const loadVehicles = useCallback(async (requestedFilters: VehicleFilters) => {
    setIsLoading(true);
    setVehiclesError("");

    if (!accessToken) {
      setVehicles([]);
      setVehiclesError("Tu sesión no es válida. Inicia sesión nuevamente.");
      setIsLoading(false);
      return;
    }

    const search = requestedFilters.search.trim();
    const type = requestedFilters.type.trim();

    try {
      const response = await axios.get<AdminVehicle[]>("/admin/vehicles", {
        params: { ...(search ? { search } : {}), ...(type ? { type } : {}) },
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setVehicles(response.data);
    } catch (error) {
      setVehicles([]);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setVehiclesError("Tu sesión expiró o no es válida. Inicia sesión nuevamente.");
      } else if (axios.isAxiosError(error) && error.response?.status === 403) {
        setVehiclesError("Tu cuenta no tiene permisos para consultar los vehículos administrativos.");
      } else {
        setVehiclesError("No pudimos cargar los vehículos. Inténtalo nuevamente.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    // Initial synchronization with the administrative vehicles endpoint.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadVehicles(emptyFilters);
  }, [loadVehicles]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextFilters = { search: filters.search.trim(), type: filters.type.trim() };
    setFilters(nextFilters);
    setActiveFilters(nextFilters);
    void loadVehicles(nextFilters);
  };

  const clearFilters = () => {
    setFilters(emptyFilters);
    setActiveFilters(emptyFilters);
    void loadVehicles(emptyFilters);
  };

  const openEditModal = (vehicle: AdminVehicle) => {
    setFormError("");
    setEditingVehicle(vehicle);
    reset({
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      plate: vehicle.plate,
      type: vehicle.type,
      color: vehicle.color ?? "",
      mileage: vehicle.mileage ?? 0,
    });
  };

  const closeEditModal = () => {
    if (isSaving) return;
    setEditingVehicle(null);
    setFormError("");
    reset();
  };

  const updateVehicle = async (data: VehicleFormValues) => {
    if (!editingVehicle) return;
    if (!accessToken) {
      setFormError("Tu sesión no es válida. Inicia sesión nuevamente.");
      return;
    }

    setIsSaving(true);
    setFormError("");

    try {
      await axios.patch(
        `/admin/vehicles/${editingVehicle.id}`,
        {
          brand: data.brand.trim(),
          model: data.model.trim(),
          year: data.year,
          plate: data.plate.trim(),
          type: data.type.trim(),
          color: data.color.trim(),
          mileage: data.mileage,
        },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      setEditingVehicle(null);
      reset();
      await Swal.fire({
        title: "Vehículo actualizado",
        text: "La información del vehículo fue actualizada correctamente.",
        icon: "success",
        confirmButtonText: "Entendido",
        buttonsStyling: false,
        customClass: alertClasses,
      });
      await loadVehicles(activeFilters);
    } catch (error) {
      setFormError(getRequestError(error, "update"));
    } finally {
      setIsSaving(false);
    }
  };

  const deleteVehicle = async (vehicle: AdminVehicle) => {
    if (!accessToken) {
      await Swal.fire({
        title: "Sesión no válida",
        text: "Tu sesión no es válida. Inicia sesión nuevamente.",
        icon: "error",
        confirmButtonText: "Entendido",
        buttonsStyling: false,
        customClass: alertClasses,
      });
      return;
    }

    const result = await Swal.fire<boolean>({
      title: `¿Eliminar ${vehicle.brand} ${vehicle.model}?`,
      text: `Esta acción eliminará el vehículo con placa ${vehicle.plate}.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar vehículo",
      cancelButtonText: "Cancelar",
      buttonsStyling: false,
      reverseButtons: true,
      focusCancel: true,
      showLoaderOnConfirm: true,
      allowOutsideClick: () => !Swal.isLoading(),
      customClass: alertClasses,
      preConfirm: async () => {
        setDeletingVehicleId(vehicle.id);
        try {
          await axios.delete(`/admin/vehicles/${vehicle.id}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          return true;
        } catch (error) {
          Swal.showValidationMessage(getRequestError(error, "delete"));
          if (axios.isAxiosError(error) && error.response?.status === 404) {
            await loadVehicles(activeFilters);
          }
          return false;
        } finally {
          setDeletingVehicleId(null);
        }
      },
    });

    if (!result.isConfirmed || !result.value) return;
    await Swal.fire({
      title: "Vehículo eliminado",
      text: "El vehículo fue eliminado correctamente.",
      icon: "success",
      confirmButtonText: "Entendido",
      buttonsStyling: false,
      customClass: alertClasses,
    });
    await loadVehicles(activeFilters);
  };

  const hasFilters = Boolean(activeFilters.search || activeFilters.type);

  return (
    <div className="admin-vehicles">
      <header className="admin-vehicles__header">
        <div>
          <span>Gestión administrativa</span>
          <h1>Vehículos</h1>
          <p>Consulta y administra los vehículos registrados en AutoCare SV.</p>
        </div>
        <span className="admin-vehicles__count">
          <CarFront size={18} aria-hidden="true" />
          {isLoading ? "Consultando vehículos..." : `${vehicles.length} ${vehicles.length === 1 ? "vehículo encontrado" : "vehículos encontrados"}`}
        </span>
      </header>

      <form className="admin-vehicles-filters" onSubmit={handleSearch}>
        <div className="admin-vehicles-filters__fields">
          <label className="admin-vehicles-field admin-vehicles-field--search">
            <span>Buscar</span>
            <div>
              <Search size={17} aria-hidden="true" />
              <input
                type="search"
                placeholder="Buscar cliente, correo, teléfono, placa o vehículo..."
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              />
            </div>
          </label>
          <label className="admin-vehicles-field">
            <span>Tipo de vehículo</span>
            <input
              type="text"
              placeholder="Ej. SUV, Sedan, Pickup..."
              value={filters.type}
              onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}
            />
          </label>
          <div className="admin-vehicles-filters__actions">
            <button type="submit" disabled={isLoading}><Search size={17} aria-hidden="true" />{isLoading ? "Buscando..." : "Buscar"}</button>
            <button type="button" disabled={isLoading} onClick={clearFilters}>Limpiar filtros</button>
          </div>
        </div>
      </form>

      {isLoading ? (
        <div className="admin-vehicles-loading" role="status" aria-label="Cargando vehículos"><span /><span /><span /><span /></div>
      ) : vehiclesError ? (
        <section className="admin-vehicles-state" role="alert">
          <CircleAlert size={40} aria-hidden="true" />
          <h2>No pudimos mostrar los vehículos</h2>
          <p>{vehiclesError}</p>
          <button type="button" onClick={() => void loadVehicles(activeFilters)}><RefreshCw size={17} aria-hidden="true" />Reintentar</button>
        </section>
      ) : vehicles.length === 0 ? (
        <section className="admin-vehicles-state">
          <CarFront size={42} aria-hidden="true" />
          <h2>{hasFilters ? "No hay vehículos que coincidan con los filtros." : "No hay vehículos registrados."}</h2>
          {hasFilters && <p>Modifica los criterios o limpia los filtros para consultar todos los vehículos.</p>}
        </section>
      ) : (
        <section className="admin-vehicles-list" aria-label="Listado de vehículos">
          <div className="admin-vehicles-list__head" aria-hidden="true">
            <span>Vehículo</span><span>Placa</span><span>Cliente</span><span>Kilometraje</span><span>Color</span><span>Acciones</span>
          </div>
          {vehicles.map((vehicle) => (
            <article className="admin-vehicles-row" key={vehicle.id}>
              <div className="admin-vehicles-row__vehicle"><small>Vehículo</small><strong><CarFront size={16} aria-hidden="true" />{vehicle.brand} {vehicle.model}</strong><span>{vehicle.year} · {vehicle.type}</span></div>
              <div><small>Placa</small><strong className="admin-vehicles-row__plate">{vehicle.plate}</strong></div>
              <div className="admin-vehicles-row__customer"><small>Cliente</small><strong><UserRound size={14} aria-hidden="true" />{vehicle.customer.name}</strong><span><Mail size={13} aria-hidden="true" />{vehicle.customer.email}</span>{vehicle.customer.phone && <span><Phone size={13} aria-hidden="true" />{vehicle.customer.phone}</span>}</div>
              <div><small>Kilometraje</small><span>{vehicle.mileage === null ? "No registrado" : `${vehicle.mileage.toLocaleString("en-US")} km`}</span></div>
              <div><small>Color</small><span>{vehicle.color ?? "No registrado"}</span></div>
              <div className="admin-vehicles-row__actions">
                <small>Acciones</small>
                <button type="button" onClick={() => openEditModal(vehicle)} disabled={deletingVehicleId === vehicle.id}><Pencil size={15} aria-hidden="true" />Editar</button>
                <button type="button" className="admin-vehicles-row__delete" onClick={() => void deleteVehicle(vehicle)} disabled={deletingVehicleId === vehicle.id}><Trash2 size={15} aria-hidden="true" />{deletingVehicleId === vehicle.id ? "Eliminando..." : "Eliminar"}</button>
              </div>
            </article>
          ))}
        </section>
      )}

      {editingVehicle && (
        <div className="admin-vehicle-modal__backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeEditModal(); }}>
          <section className="admin-vehicle-modal" role="dialog" aria-modal="true" aria-labelledby="admin-vehicle-modal-title">
            <header className="admin-vehicle-modal__header">
              <div><span>Editar vehículo</span><h2 id="admin-vehicle-modal-title">{editingVehicle.brand} {editingVehicle.model}</h2></div>
              <button type="button" aria-label="Cerrar edición" onClick={closeEditModal} disabled={isSaving}><X size={20} aria-hidden="true" /></button>
            </header>
            <form onSubmit={handleSubmit(updateVehicle)}>
              <div className="admin-vehicle-modal__grid">
                <label><span>Marca</span><input {...register("brand", { required: "La marca es obligatoria." })} />{errors.brand && <small>{errors.brand.message}</small>}</label>
                <label><span>Modelo</span><input {...register("model", { required: "El modelo es obligatorio." })} />{errors.model && <small>{errors.model.message}</small>}</label>
                <label><span>Año</span><input type="number" {...register("year", { valueAsNumber: true, required: "El año es obligatorio.", min: { value: 1900, message: "Ingresa un año válido." }, max: { value: currentYear + 1, message: `El año no puede superar ${currentYear + 1}.` } })} />{errors.year && <small>{errors.year.message}</small>}</label>
                <label><span>Placa</span><input {...register("plate", { required: "La placa es obligatoria." })} />{errors.plate && <small>{errors.plate.message}</small>}</label>
                <label><span>Tipo</span><input {...register("type", { required: "El tipo es obligatorio." })} />{errors.type && <small>{errors.type.message}</small>}</label>
                <label><span>Color</span><input {...register("color")} /></label>
                <label className="admin-vehicle-modal__wide"><span>Kilometraje</span><input type="number" min="0" {...register("mileage", { valueAsNumber: true, required: "El kilometraje es obligatorio.", min: { value: 0, message: "El kilometraje no puede ser negativo." } })} />{errors.mileage && <small>{errors.mileage.message}</small>}</label>
              </div>
              {formError && <p className="admin-vehicle-modal__error" role="alert">{formError}</p>}
              <footer className="admin-vehicle-modal__actions">
                <button type="button" onClick={closeEditModal} disabled={isSaving}>Cancelar</button>
                <button type="submit" disabled={isSaving}>{isSaving ? "Guardando cambios..." : "Guardar cambios"}</button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default AdminVehicles;
