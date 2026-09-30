# AutoCare SV

Aplicación web para la gestión de servicios automotrices, desarrollada como proyecto **Full Stack**, con una interfaz moderna y responsive para clientes y administradores.

El frontend permite a los clientes registrarse, iniciar sesión, gestionar sus vehículos, agendar citas y consultar su historial de servicios. También incluye un área administrativa para la gestión de la operación del lubricentro.

## Demo

**Aplicación:** https://autocare-sv.vercel.app

> El backend se encuentra desplegado en Layerbase y puede entrar en hibernación después de un período de inactividad. Por ello, la primera petición después de un tiempo sin uso puede tardar unos segundos mientras el servicio vuelve a estar disponible.

### Cuenta de demostración — Administrador

```text
Email: autocareSV@gmail.com
Contraseña: AutoCare2026
```

> Estas credenciales corresponden únicamente a la cuenta de demostración del proyecto.

## Funcionalidades

### Área pública

* Página principal del lubricentro.
* Presentación de servicios disponibles.
* Detalle individual de cada servicio.
* Formulario para agendar citas.
* Registro de usuarios.
* Inicio de sesión.
* Diseño responsive para dispositivos móviles, tablets y escritorio.

### Área de clientes

* Resumen de la cuenta.
* Gestión de vehículos.
* Visualización de citas.
* Detalle de citas.
* Historial de servicios.
* Consulta de la próxima cita.
* Acciones rápidas para agendar citas y agregar vehículos.

### Área administrativa

* Acceso protegido mediante autenticación.
* Dashboard administrativo.
* Gestión de la información relacionada con la operación del lubricentro.
* Control de acceso basado en roles.

### Autenticación

* Registro e inicio de sesión mediante API.
* Autenticación basada en JWT.
* Manejo de roles `CUSTOMER` y `ADMIN`.
* Protección de las áreas privadas.
* Persistencia de sesión mediante el contexto de autenticación.
* Manejo de errores de autenticación y sesiones inválidas.

## Tecnologías

### Frontend

* React
* TypeScript
* Vite
* React Router
* React Hook Form
* Zod
* Axios
* date-fns
* Lucide React
* CSS

### Herramientas

* Git
* GitHub
* VS Code
* Vercel

## Arquitectura

El proyecto está organizado por responsabilidades para mantener una estructura clara y facilitar el mantenimiento.

Entre sus principales elementos se encuentran:

* Componentes reutilizables.
* Contexto de autenticación.
* Layouts para las diferentes áreas de la aplicación.
* Páginas públicas, de clientes y administrativas.
* Rutas protegidas.
* Validación de formularios.
* Integración con la API mediante Axios.

La aplicación utiliza un contexto de autenticación para administrar la sesión del usuario y controlar el acceso a las diferentes áreas de la aplicación.

Las peticiones HTTP al backend se realizan mediante Axios.

## Backend

El frontend consume una API REST desarrollada específicamente para este proyecto.

**Repositorio del backend:**

https://github.com/Ezequiel906/autocare-sv-backend

El backend se encarga de:

* Autenticación y autorización.
* Gestión de usuarios.
* Gestión de vehículos.
* Gestión de citas.
* Gestión del historial de servicios.
* Gestión de servicios del lubricentro.
* Control de roles.

## Instalación

### Requisitos

* Node.js
* npm
* Backend de AutoCare SV ejecutándose localmente o disponible mediante su URL.

### 1. Clonar el repositorio

```bash
git clone https://github.com/Ezequiel906/autocare-sv.git
cd autocare-sv
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
# URL base publica del backend, sin barra final.
VITE_API_URL=http://localhost:3000
```

Si el backend está desplegado, utiliza la URL correspondiente del backend.

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

La aplicación estará disponible en:

```text
http://localhost:5173
```

## Scripts disponibles

### Desarrollo

```bash
npm run dev
```

Inicia el servidor de desarrollo.

### Build

```bash
npm run build
```

Genera la versión de producción.

### Lint

```bash
npm run lint
```

Ejecuta las comprobaciones de linting del proyecto.

### Preview

```bash
npm run preview
```

Sirve localmente la versión generada para producción.

## Deployment

El frontend está desplegado en **Vercel**.

**Demo:**

https://autocare-sv.vercel.app

El backend está desplegado de forma independiente y se conecta con el frontend mediante la URL configurada en las variables de entorno.

## Desarrollo con asistencia de IA

Durante el desarrollo del proyecto se utilizó **Codex** como herramienta de asistencia para la implementación, revisión y depuración del código.

La implementación se realizó de forma incremental, manteniendo la estructura del proyecto y validando las funcionalidades mediante pruebas locales y en producción.

## Responsive Design

La interfaz fue desarrollada teniendo en cuenta diferentes tamaños de pantalla:

* Escritorio.
* Tablets.
* Dispositivos móviles.

Las principales áreas de la aplicación cuentan con navegación y componentes adaptados para diferentes dispositivos.

## Licencia

Este proyecto fue desarrollado como proyecto personal de portafolio.
