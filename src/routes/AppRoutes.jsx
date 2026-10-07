import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import AppLayout from '../components/layout/AppLayout';

import Home from '../pages/Home';
import Login from '../pages/Login';
import AdminPage from '../pages/AdminPage';
import PanelAnimadorPage from '../pages/PanelAnimadorPage';
import VisorPage from '../pages/VisorPage';
import ColoresPage from '../pages/ColoresPage';
import ActividadesPage from '../pages/ActividadesPage';
import CronogramaPage from '../pages/CronogramaPage';
import GymkanaPublicoPage from '../pages/GymkanaPublicoPage';
import TesoroPublicoPage from '../pages/TesoroPublicoPage';
import TorneoPublicoPage from '../pages/TorneoPublicoPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* AppLayout pone el Header (logo + sesion) en TODAS las paginas */}
      <Route element={<AppLayout />}>
        {/* Pagina principal publica, con botones a cada actividad */}
        <Route path="/" element={<Home />} />

        {/* Publicas, sin autenticacion */}
        <Route path="/visor" element={<VisorPage />} />
        <Route path="/colores" element={<ColoresPage />} />
        <Route path="/actividades" element={<ActividadesPage />} />
        <Route path="/cronograma" element={<CronogramaPage />} />

        <Route path="/login" element={<Login />} />

        {/* Publicas, de solo lectura: cualquiera elige su equipo y ve su
            estado, sin poder modificar nada (eso solo se hace desde
            /panel). Reemplazan el redirect provisional de la Fase 1. */}
        <Route path="/gymkana" element={<GymkanaPublicoPage />} />
        <Route path="/tesoro" element={<TesoroPublicoPage />} />
        <Route path="/torneo" element={<TorneoPublicoPage />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/panel"
          element={
            <ProtectedRoute
              roles={['admin', 'animador', 'staff_gymkana', 'staff_tesoro', 'arbitro', 'formacion']}
            >
              <PanelAnimadorPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
