import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

/** Bloqueo de rutas (RF-04): sin token, redirige a /login con aviso. */
export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname, motivo: 'sesion' }} />;
  }
  return <Outlet />;
}
