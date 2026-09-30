import { zodResolver } from "@hookform/resolvers/zod";

import {
  ArrowRight,
  CarFront,
  CheckCircle2,
  Eye,
  EyeOff,
  Gauge,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Wrench,
} from "lucide-react";

import { useState } from "react";

import { useForm } from "react-hook-form";

import { Link, useNavigate } from "react-router-dom";

import axios from "axios";

import { z } from "zod";

import { useAuth } from "../context/AuthContext";

import "./Login.css";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "El correo electrónico es obligatorio.")
    .email("Ingresa un correo electrónico válido."),
  password: z
    .string()
    .min(1, "La contraseña es obligatoria."),
  rememberMe: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticationPending, setIsAuthenticationPending] = useState(false);
  const [authenticationError, setAuthenticationError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const handleLogin = async (data: LoginFormValues) => {
    setIsAuthenticationPending(true);
    setAuthenticationError("");

    try {
      const response = await axios.post("/auth/login", {
        email: data.email,
        password: data.password,
      });

      const { accessToken, user } = response.data;

      login(user, accessToken, data.rememberMe);

      navigate(user.role === "ADMIN" ? "/admin/dashboard" : "/cuenta");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setAuthenticationError("El correo o la contraseña son incorrectos.");
      } else {
        setAuthenticationError(
          "No se pudo iniciar sesión. Verifica que el servidor esté disponible.",
        );
      }
    } finally {
      setIsAuthenticationPending(false);
    }
  };

  return (
    <section className="login-page" aria-labelledby="login-title">
      <div className="login-visual" aria-hidden="true">
        <div className="login-visual__brand">
          <span>
            <CarFront size={24} />
          </span>
          <p>
            AutoCare <strong>SV</strong>
          </p>
        </div>

        <div className="login-visual__message">
          <span>Tu vehículo, siempre presente</span>
          <h2>El cuidado de tu vehículo también empieza aquí.</h2>
          <p>
            Un espacio pensado para gestionar tus vehículos y mantener cada
            servicio en orden.
          </p>
        </div>

        <div className="login-visual__graphic">
          <span className="login-visual__orbit" />
          <div className="login-visual__car">
            <CarFront size={112} strokeWidth={1.35} />
          </div>
          <span className="login-visual__tool login-visual__tool--top">
            <Wrench size={22} />
          </span>
          <span className="login-visual__tool login-visual__tool--bottom">
            <Gauge size={22} />
          </span>
          <span className="login-visual__track" />
        </div>
      </div>

      <div className="login-panel">
        <div className="login-panel__content">
          <span className="login-eyebrow">
            <ShieldCheck size={16} aria-hidden="true" />
            Área de clientes
          </span>

          <h1 id="login-title">Bienvenido de nuevo</h1>

          <p className="login-panel__intro">
            Ingresa a tu cuenta para gestionar tus vehículos, citas e historial
            de servicios.
          </p>

          <form
            className="login-form"
            id="login-form"
            onSubmit={handleSubmit(handleLogin)}
            noValidate
          >
            <div className="login-field">
              <label htmlFor="login-email">Correo electrónico</label>

              <div className="login-field__control">
                <Mail size={19} aria-hidden="true" />

                <input
                  id="login-email"
                  type="email"
                  placeholder="tu@email.com"
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={
                    errors.email ? "login-email-error" : undefined
                  }
                  {...register("email")}
                />
              </div>

              {errors.email && (
                <p
                  className="login-field__error"
                  id="login-email-error"
                  role="alert"
                >
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="login-field">
              <label htmlFor="login-password">Contraseña</label>

              <div className="login-field__control login-field__control--password">
                <LockKeyhole size={19} aria-hidden="true" />

                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={
                    errors.password ? "login-password-error" : undefined
                  }
                  {...register("password")}
                />

                <button
                  type="button"
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? (
                    <EyeOff size={20} aria-hidden="true" />
                  ) : (
                    <Eye size={20} aria-hidden="true" />
                  )}
                </button>
              </div>

              {errors.password && (
                <p
                  className="login-field__error"
                  id="login-password-error"
                  role="alert"
                >
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="login-form__options">
              <label className="login-checkbox">
                <input type="checkbox" {...register("rememberMe")} />
                <span aria-hidden="true" /> Recordarme
              </label>

              <a
                href="#login-form"
                aria-label="Recuperación de contraseña, próximamente"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <button
              className="login-submit"
              type="submit"
              disabled={isAuthenticationPending}
            >
              {isAuthenticationPending
                ? "Iniciando sesión..."
                : "Iniciar sesión"}
              {!isAuthenticationPending && (
                <ArrowRight size={19} aria-hidden="true" />
              )}
            </button>

            {authenticationError && (
              <div className="login-field__error" role="alert">
                {authenticationError}
              </div>
            )}

            {isAuthenticationPending && (
              <div className="login-pending" role="status" aria-live="polite">
                <CheckCircle2 size={22} aria-hidden="true" />

                <div>
                  <h2>Iniciando sesión</h2>
                  <p>Estamos verificando tus credenciales.</p>
                </div>
              </div>
            )}
          </form>

          <p className="login-register">
            ¿Todavía no tienes una cuenta?{" "}
            <Link to="/registro">Crear cuenta</Link>
          </p>

          <div className="login-appointment">
            <span>¿Solo quieres agendar una cita?</span>

            <Link to="/agendar-cita">
              Agendar cita <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Login;
