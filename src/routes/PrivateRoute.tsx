import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type UserRole = "CUSTOMER" | "ADMIN";

type PrivateRouteProps = {
  requiredRole?: UserRole;
};

function PrivateRoute({ requiredRole }: PrivateRouteProps) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/cuenta" replace />;
  }

  return <Outlet />;
}

export default PrivateRoute;
