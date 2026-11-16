import { Navigate, Route, Routes } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import ProtectedRoute from './components/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import DoctorDashboardPage from './pages/DoctorDashboardPage';
import HistoryPage from './pages/HistoryPage';

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/dashboard" element={<ProtectedRoute role="patient"><DashboardPage /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute role="patient"><HistoryPage /></ProtectedRoute>} />
        <Route path="/doctor" element={<ProtectedRoute role="doctor"><DoctorDashboardPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <Analytics />
    </>
  );
}
