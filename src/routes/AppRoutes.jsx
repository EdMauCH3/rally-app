import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import AppLayout from '../components/layout/AppLayout';

import Home from '../pages/Home';
import Login from '../pages/Login';
import GymkanaPage from '../pages/GymkanaPage';
import TesoroPage from '../pages/TesoroPage';
import TorneoPage from '../pages/TorneoPage';
import AdminPage from '../pages/AdminPage';
import VisorPage from '../pages/VisorPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* AppLayout pone el Header (logo + sesion) en TODAS las paginas */}
      <Route element={<AppLayout />}>
        {/* Pagina principal publica, con botones a cada actividad */}
        <Route path="/" element={<Home />} />

        {/* Publica, sin autenticacion */}
        <Route path="/visor" element={<VisorPage />} />

        <Route path="/login" element={<Login />} />

        <Route
          path="/gymkana"
          element={
            <ProtectedRoute roles={['staff_gymkana', 'admin']}>
              <GymkanaPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tesoro"
          element={
            <ProtectedRoute roles={['staff_tesoro', 'admin']}>
              <TesoroPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/torneo"
          element={
            <ProtectedRoute roles={['arbitro', 'admin']}>
              <TorneoPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
