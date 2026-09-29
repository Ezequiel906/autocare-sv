import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import ClientLayout from "../layouts/ClientLayout";
import AdminAgenda from "../pages/AdminAgenda";
import AdminAppointmentDetail from "../pages/AdminAppointmentDetail";
import AdminAppointments from "../pages/AdminAppointments";
import AdminCustomerDetail from "../pages/AdminCustomerDetail";
import AdminCustomers from "../pages/AdminCustomers";
import AdminDashboard from "../pages/AdminDashboard";
import AdminServiceDetail from "../pages/AdminServiceDetail";
import AdminServiceHistory from "../pages/AdminServiceHistory";
import AdminServiceHistoryDetail from "../pages/AdminServiceHistoryDetail";
import AdminServices from "../pages/AdminServices";
import AdminSettings from "../pages/AdminSettings";
import AdminVehicles from "../pages/AdminVehicles";
import BookAppointment from "../pages/BookAppointment";
import ClientAppointmentDetail from "../pages/ClientAppointmentDetail";
import ClientAppointments from "../pages/ClientAppointments";
import ClientDashboard from "../pages/ClientDashboard";
import ClientServiceHistory from "../pages/ClientServiceHistory";
import ClientVehicles from "../pages/ClientVehicles";
import Home from "../pages/Home";
import Login from "../pages/Login";
import MainLayout from "../layouts/MainLayout";
import Register from "../pages/Register";
import ServiceDetail from "../pages/ServiceDetail";
import Services from "../pages/Services";
import PrivateRoute from "./PrivateRoute";

type RoutePlaceholderProps = {
  title: string;
};

function RoutePlaceholder({ title }: RoutePlaceholderProps) {
  return (
    <section className="route-placeholder">
      <h1>{title}</h1>
    </section>
  );
}

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="servicios" element={<Services />} />
          <Route path="servicios/:slug" element={<ServiceDetail />} />
          <Route path="agendar-cita" element={<BookAppointment />} />
          <Route path="agendar" element={<RoutePlaceholder title="Agendar cita" />} />
          <Route path="login" element={<Login />} />
          <Route path="registro" element={<Register />} />

          <Route element={<PrivateRoute />}>
            <Route path="cuenta" element={<ClientLayout />}>
              <Route index element={<ClientDashboard />} />
              <Route path="vehiculos" element={<ClientVehicles />} />
              <Route path="citas" element={<ClientAppointments />} />
              <Route path="citas/:id" element={<ClientAppointmentDetail />} />
              <Route path="historial" element={<ClientServiceHistory />} />
            </Route>
          </Route>
        </Route>

        <Route element={<PrivateRoute requiredRole="ADMIN" />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="agenda" element={<AdminAgenda />} />
            <Route path="citas" element={<AdminAppointments />} />
            <Route path="citas/:id" element={<AdminAppointmentDetail />} />
            <Route path="vehiculos" element={<AdminVehicles />} />
            <Route path="clientes" element={<AdminCustomers />} />
            <Route path="clientes/:id" element={<AdminCustomerDetail />} />
            <Route path="servicios" element={<AdminServices />} />
            <Route path="servicios/:id" element={<AdminServiceDetail />} />
            <Route path="historial" element={<AdminServiceHistory />} />
            <Route path="historial/:id" element={<AdminServiceHistoryDetail />} />
            <Route path="configuracion" element={<AdminSettings />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
