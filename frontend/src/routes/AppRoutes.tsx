import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import Layout from '../components/Layout';
import LoginPage from '../pages/LoginPage';
import RegisterRequestPage from '../pages/RegisterRequestPage';
import DashboardPage from '../pages/DashboardPage';
import ProfilePage from '../pages/ProfilePage';
import ChatbotPage from '../pages/ChatbotPage';
import AdminUsersPage from '../pages/AdminUsersPage';
import AdminRequestsPage from '../pages/AdminRequestsPage';
import NotFoundPage from '../pages/NotFoundPage';
import PublicOnlyRoute from './PublicOnlyRoute';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterRequestPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="/chatbot" element={<ChatbotPage />} />

          <Route element={<RoleRoute allow={['admin']} />}>
            <Route path="/admin/usuarios" element={<AdminUsersPage />} />
            <Route
              path="/admin/solicitudes"
              element={<AdminRequestsPage />}
            />
          </Route>
        </Route>
      </Route>

      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
