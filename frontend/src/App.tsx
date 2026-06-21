import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import AnalyticsTracker from './components/AnalyticsTracker';
import { AnalyticsProvider } from './context/AnalyticsContext';
import AppRoutes from './routes/AppRoutes';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <AnalyticsProvider>
        <AnalyticsTracker />
        <ToastProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </ToastProvider>
      </AnalyticsProvider>
    </BrowserRouter>
  );
}
