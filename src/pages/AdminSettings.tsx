import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { Building2, CircleAlert, Clock3, Gauge, Mail, MapPin, Phone, RefreshCw, Save, Settings } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { z } from "zod";
import { useAuth } from "../context/AuthContext";
import "./AdminSettings.css";

const settingsSchema = z.object({
  businessName: z.string().trim().min(1, "El nombre del negocio es obligatorio."),
  phone: z.string().trim().min(1, "El teléfono es obligatorio."),
  email: z.string().trim().min(1, "El correo electrónico es obligatorio.").email("Ingresa un correo electrónico válido."),
  address: z.string().trim().min(1, "La dirección es obligatoria."),
  openingHours: z.string().trim().min(1, "El horario de atención es obligatorio."),
  oilChangeIntervalKm: z
    .number({ error: "Ingresa un intervalo válido." })
    .int("El intervalo debe ser un número entero.")
    .min(1, "El intervalo debe ser mayor o igual a 1 km."),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

const alertClasses = {
  container: "autocare-alert-container",
  popup: "autocare-alert",
  icon: "autocare-alert__icon",
  title: "autocare-alert__title",
  htmlContainer: "autocare-alert__content",
  actions: "autocare-alert__actions",
  confirmButton: "autocare-alert__button autocare-alert__button--danger",
};

function getBackendMessage(data: unknown) {
  if (typeof data !== "object" || data === null || !("message" in data)) return null;
  const message = data.message;
  if (typeof message === "string") return message;
  if (Array.isArray(message) && message.every((item) => typeof item === "string")) return message.join(" ");
  return null;
}

function AdminSettings() {
  const { accessToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [saveError, setSaveError] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SettingsFormValues>({ resolver: zodResolver(settingsSchema) });

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setSettingsError("");

    if (!accessToken) {
      setSettingsError("Tu sesión expiró o no es válida.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.get<SettingsFormValues>(
        "/admin/settings",
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      reset(response.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setSettingsError("Tu sesión expiró o no es válida.");
      } else if (axios.isAxiosError(error) && error.response?.status === 403) {
        setSettingsError("Tu cuenta no tiene permisos para consultar la configuración.");
      } else {
        setSettingsError("No pudimos cargar la configuración. Inténtalo nuevamente.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, reset]);

  useEffect(() => {
    // Synchronize the form with the persisted administrative settings.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadSettings();
  }, [loadSettings]);

  const saveSettings = async (data: SettingsFormValues) => {
    if (!accessToken || isSaving) return;
    setIsSaving(true);
    setSaveError("");

    const payload: SettingsFormValues = {
      businessName: data.businessName.trim(),
      phone: data.phone.trim(),
      email: data.email.trim(),
      address: data.address.trim(),
      openingHours: data.openingHours.trim(),
      oilChangeIntervalKm: data.oilChangeIntervalKm,
    };

    try {
      const response = await axios.patch<SettingsFormValues>(
        "/admin/settings",
        payload,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      reset(response.data);
      await Swal.fire({
        title: "Configuración actualizada",
        text: "La configuración fue actualizada correctamente.",
        icon: "success",
        confirmButtonText: "Entendido",
        buttonsStyling: false,
        customClass: alertClasses,
      });
    } catch (error) {
      let message = "No pudimos guardar la configuración. Inténtalo nuevamente.";
      if (axios.isAxiosError(error) && error.response?.status === 401) message = "Tu sesión expiró o no es válida.";
      else if (axios.isAxiosError(error) && error.response?.status === 403) message = "Tu cuenta no tiene permisos para modificar la configuración.";
      else if (axios.isAxiosError(error) && error.response?.status === 400) message = getBackendMessage(error.response.data) ?? "Revisa los datos ingresados.";
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="admin-settings-loading" role="status" aria-label="Cargando configuración"><span /><span /><span /></div>;
  }

  if (settingsError) {
    return <section className="admin-settings-state" role="alert"><CircleAlert size={42} aria-hidden="true" /><h1>No pudimos mostrar la configuración</h1><p>{settingsError}</p><button type="button" onClick={() => void loadSettings()}><RefreshCw size={17} aria-hidden="true" />Reintentar</button></section>;
  }

  return (
    <div className="admin-settings">
      <header className="admin-settings__header">
        <div><span>Administración</span><h1>Configuración</h1><p>Administra la información general de AutoCare SV y las reglas utilizadas por el sistema.</p></div>
        <span className="admin-settings__header-icon" aria-hidden="true"><Settings size={24} /></span>
      </header>

      <form onSubmit={handleSubmit(saveSettings)}>
        <fieldset disabled={isSaving}>
          <section className="admin-settings-card">
            <div className="admin-settings-card__heading"><span><Building2 size={20} aria-hidden="true" /></span><div><h2>Información del negocio</h2><p>Datos generales utilizados para identificar y contactar a AutoCare SV.</p></div></div>
            <div className="admin-settings-grid">
              <label className="admin-settings-field"><span>Nombre del negocio</span><div><Building2 size={17} aria-hidden="true" /><input {...register("businessName")} /></div>{errors.businessName && <small>{errors.businessName.message}</small>}</label>
              <label className="admin-settings-field"><span>Teléfono</span><div><Phone size={17} aria-hidden="true" /><input type="tel" {...register("phone")} /></div>{errors.phone && <small>{errors.phone.message}</small>}</label>
              <label className="admin-settings-field"><span>Correo electrónico</span><div><Mail size={17} aria-hidden="true" /><input type="email" {...register("email")} /></div>{errors.email && <small>{errors.email.message}</small>}</label>
              <label className="admin-settings-field"><span>Horario de atención</span><div><Clock3 size={17} aria-hidden="true" /><input {...register("openingHours")} /></div>{errors.openingHours && <small>{errors.openingHours.message}</small>}</label>
              <label className="admin-settings-field admin-settings-field--wide"><span>Dirección</span><div><MapPin size={17} aria-hidden="true" /><input {...register("address")} /></div>{errors.address && <small>{errors.address.message}</small>}</label>
            </div>
          </section>

          <section className="admin-settings-card">
            <div className="admin-settings-card__heading"><span><Gauge size={20} aria-hidden="true" /></span><div><h2>Reglas de servicio</h2><p>Parámetros utilizados por el sistema para generar recomendaciones.</p></div></div>
            <label className="admin-settings-field admin-settings-field--interval"><span>Intervalo de cambio de aceite</span><div><Gauge size={17} aria-hidden="true" /><input type="number" min="1" step="1" {...register("oilChangeIntervalKm", { valueAsNumber: true })} /><strong>km</strong></div>{errors.oilChangeIntervalKm && <small>{errors.oilChangeIntervalKm.message}</small>}<p>Este valor se utiliza para calcular el próximo kilometraje recomendado después de un cambio de aceite.</p></label>
          </section>
        </fieldset>

        {saveError && <p className="admin-settings__error" role="alert">{saveError}</p>}
        <footer className="admin-settings__actions"><button type="submit" disabled={isSaving}><Save size={17} aria-hidden="true" />{isSaving ? "Guardando..." : "Guardar configuración"}</button></footer>
      </form>
    </div>
  );
}

export default AdminSettings;
