import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import Layout from '../components/Layout';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import RegisterRequestPage from '../pages/RegisterRequestPage';
import DashboardPage from '../pages/DashboardPage';
import ProfilePage from '../pages/ProfilePage';
import ChatbotPage from '../pages/ChatbotPage';
import FeedPage from '../pages/FeedPage';
import AdminUsersPage from '../pages/AdminUsersPage';
import AdminRequestsPage from '../pages/AdminRequestsPage';
import AdminIncidentsPage from '../pages/AdminIncidentsPage';
import NotFoundPage from '../pages/NotFoundPage';
import PublicOnlyRoute from './PublicOnlyRoute';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterRequestPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="/chatbot" element={<ChatbotPage />} />

          <Route element={<RoleRoute allow={['admin']} />}>
            <Route path="/admin/usuarios" element={<AdminUsersPage />} />
          </Route>

          <Route element={<RoleRoute allow={['admin', 'moderador']} />}>
            <Route
              path="/admin/solicitudes"
              element={<AdminRequestsPage />}
            />
          </Route>

          <Route element={<RoleRoute allow={['admin', 'moderador']} />}>
            <Route path="/admin/incidentes" element={<AdminIncidentsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
