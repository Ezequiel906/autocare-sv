import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import {
  ArrowRight,
  CalendarCheck,
  CarFront,
  CheckCircle2,
  Eye,
  EyeOff,
  History,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../context/AuthContext";
import "./Register.css";

const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "El nombre es obligatorio.")
      .min(2, "Ingresa un nombre válido.")
      .max(100, "El nombre no puede superar los 100 caracteres."),
    email: z
      .string()
      .trim()
      .min(1, "El correo electrónico es obligatorio.")
      .email("Ingresa un correo electrónico válido."),
    phone: z
      .string()
      .trim()
      .min(1, "El teléfono es obligatorio.")
      .regex(/^[+\d][\d\s()-]{6,19}$/, "Ingresa un teléfono válido."),
    password: z
      .string()
      .min(1, "La contraseña es obligatoria.")
      .min(8, "La contraseña debe tener al menos 8 caracteres."),
    confirmPassword: z.string().min(1, "Confirma tu contraseña."),
    terms: z.boolean().refine((accepted) => accepted, {
      message: "Debes aceptar los términos y condiciones.",
    }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

type RegisterResponse = {
  user: Record<string, unknown>;
  accessToken: string;
};

function PasswordField({
  id,
  label,
  isVisible,
  error,
  describedBy,
  registration,
  onToggle,
}: {
  id: string;
  label: string;
  isVisible: boolean;
  error: boolean;
  describedBy?: string;
  registration: UseFormRegisterReturn;
  onToggle: () => void;
}) {
  return (
    <div className="register-field__control register-field__control--password">
      <LockKeyhole size={19} aria-hidden="true" />
      <input
        id={id}
        type={isVisible ? "text" : "password"}
        placeholder="••••••••"
        autoComplete={id === "register-password" ? "new-password" : "new-password"}
        aria-invalid={error}
        aria-describedby={describedBy}
        {...registration}
      />
      <button
        type="button"
        aria-label={isVisible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
        aria-pressed={isVisible}
        onClick={onToggle}
      >
        {isVisible ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
      </button>
    </div>
  );
}

function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isRegistrationPending, setIsRegistrationPending] = useState(false);
  const [registrationError, setRegistrationError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  });

  const handleRegister = async (data: RegisterFormValues) => {
    setIsRegistrationPending(true);
    setRegistrationError("");

    try {
      const response = await axios.post<RegisterResponse>(
        "/auth/register",
        {
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: data.password,
        },
      );

      const { accessToken, user } = response.data;

      login(user, accessToken, true);
      navigate("/cuenta");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        setRegistrationError("El correo electrónico ya está registrado.");
      } else if (axios.isAxiosError(error) && !error.response) {
        setRegistrationError("No se pudo conectar con el servidor.");
      } else {
        setRegistrationError(
          "No se pudo crear la cuenta. Verifica los datos e inténtalo nuevamente.",
        );
      }
    } finally {
      setIsRegistrationPending(false);
    }
  };

  return (
    <section className="register-page" aria-labelledby="register-title">
      <div className="register-visual" aria-hidden="true">
        <div className="register-visual__brand">
          <span><CarFront size={24} /></span>
          <p>AutoCare <strong>SV</strong></p>
        </div>
        <div className="register-visual__message">
          <span>Tu espacio de cuidado automotriz</span>
          <h2>Cuida tu vehículo desde un solo lugar</h2>
          <p>Crea tu cuenta para gestionar tus vehículos, citas e historial de servicios.</p>
        </div>
        <div className="register-visual__features">
          <span><CarFront size={21} /> Vehículos</span>
          <span><CalendarCheck size={21} /> Citas</span>
          <span><History size={21} /> Historial</span>
        </div>
        <div className="register-visual__lines" />
      </div>

      <div className="register-panel">
        <div className="register-panel__content">
          {isRegistrationPending ? (
            <div className="register-pending" role="status" aria-live="polite">
              <span className="register-pending__icon" aria-hidden="true">
                <CheckCircle2 size={46} />
              </span>
              <span className="register-eyebrow">Creando cuenta</span>
              <h1 id="register-title">Procesando registro</h1>
              <p>Estamos verificando tus datos y creando tu cuenta.</p>
              <div className="register-pending__actions">
                <Link className="register-button register-button--primary" to="/">
                  Volver al inicio
                </Link>
                <Link className="register-button register-button--secondary" to="/login">
                  Iniciar sesión
                </Link>
              </div>
            </div>
          ) : (
            <>
              <span className="register-eyebrow">
                <ShieldCheck size={16} aria-hidden="true" /> Crear cuenta
              </span>
              <h1 id="register-title">Crea tu cuenta</h1>
              <p className="register-panel__intro">
                Regístrate para gestionar tus vehículos y tus próximas citas.
              </p>

              <form className="register-form" onSubmit={handleSubmit(handleRegister)} noValidate>
                <div className="register-field register-field--full">
                  <label htmlFor="register-name">Nombre completo</label>
                  <div className="register-field__control">
                    <UserRound size={19} aria-hidden="true" />
                    <input id="register-name" type="text" placeholder="Tu nombre completo" autoComplete="name" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "register-name-error" : undefined} {...register("name")} />
                  </div>
                  {errors.name && <p className="register-field__error" id="register-name-error" role="alert">{errors.name.message}</p>}
                </div>

                <div className="register-field">
                  <label htmlFor="register-email">Correo electrónico</label>
                  <div className="register-field__control">
                    <Mail size={19} aria-hidden="true" />
                    <input id="register-email" type="email" placeholder="tu@email.com" autoComplete="email" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "register-email-error" : undefined} {...register("email")} />
                  </div>
                  {errors.email && <p className="register-field__error" id="register-email-error" role="alert">{errors.email.message}</p>}
                </div>

                <div className="register-field">
                  <label htmlFor="register-phone">Teléfono</label>
                  <div className="register-field__control">
                    <Phone size={19} aria-hidden="true" />
                    <input id="register-phone" type="tel" placeholder="0000-0000" autoComplete="tel" aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "register-phone-error" : undefined} {...register("phone")} />
                  </div>
                  {errors.phone && <p className="register-field__error" id="register-phone-error" role="alert">{errors.phone.message}</p>}
                </div>

                <div className="register-field">
                  <label htmlFor="register-password">Contraseña</label>
                  <PasswordField id="register-password" label="Contraseña" isVisible={showPassword} error={Boolean(errors.password)} describedBy={errors.password ? "register-password-error" : undefined} registration={register("password")} onToggle={() => setShowPassword((visible) => !visible)} />
                  {errors.password && <p className="register-field__error" id="register-password-error" role="alert">{errors.password.message}</p>}
                </div>

                <div className="register-field">
                  <label htmlFor="register-confirm-password">Confirmar contraseña</label>
                  <PasswordField id="register-confirm-password" label="Confirmar contraseña" isVisible={showConfirmation} error={Boolean(errors.confirmPassword)} describedBy={errors.confirmPassword ? "register-confirm-error" : undefined} registration={register("confirmPassword")} onToggle={() => setShowConfirmation((visible) => !visible)} />
                  {errors.confirmPassword && <p className="register-field__error" id="register-confirm-error" role="alert">{errors.confirmPassword.message}</p>}
                </div>

                <div className="register-terms register-field--full">
                  <label>
                    <input type="checkbox" aria-invalid={Boolean(errors.terms)} aria-describedby={errors.terms ? "register-terms-error" : undefined} {...register("terms")} />
                    <span className="register-terms__box" aria-hidden="true" />
                    <span>
                      Acepto los <a href="#register-form">términos y condiciones</a> y la <a href="#register-form">política de privacidad</a>.
                    </span>
                  </label>
                  {errors.terms && <p className="register-field__error" id="register-terms-error" role="alert">{errors.terms.message}</p>}
                </div>

                <button className="register-submit register-field--full" id="register-form" type="submit">
                  Crear cuenta <ArrowRight size={19} aria-hidden="true" />
                </button>

                {registrationError && (
                  <p className="register-field__error register-field--full" role="alert">
                    {registrationError}
                  </p>
                )}
              </form>

              <p className="register-login">¿Ya tienes una cuenta? <Link to="/login">Iniciar sesión</Link></p>
              <div className="register-appointment">
                <span>¿Solo quieres agendar una cita?</span>
                <Link to="/agendar-cita">Agendar cita <ArrowRight size={16} aria-hidden="true" /></Link>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default Register;
