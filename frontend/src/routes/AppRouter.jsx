import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext.jsx';
import ProtectedRoute from '../auth/ProtectedRoute.jsx';
import Layout from '../components/Layout.jsx';
import { SECCIONES } from '../components/nav.js';
import HomePage from '../pages/publico/HomePage';
import LoginPage from '../pages/publico/LoginPage';
import DashboardPage from '../pages/admin/DashboardPage';
import SeccionPage from '../pages/admin/SeccionPage';
import ConductoresPage from '../pages/admin/conductores/ConductoresPage';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Bloqueo de rutas (RF-04): sin token redirige a /login */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/admin/conductores" element={<ConductoresPage />} />
              {SECCIONES.filter((s) => s.to !== '/dashboard').map((s) => (
                <Route key={s.to} path={s.to} element={<SeccionPage />} />
              ))}
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}