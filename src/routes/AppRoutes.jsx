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

        {/* Rutas antiguas de Gymkana/Tesoro/Torneo: se retiraron como
            paginas independientes (pasan a vivir dentro del Panel del
            Animador en la Fase 3). Mientras tanto, redirigen a la
            pantalla de mantenimiento para no dejar un 404 ni un enlace
            roto en lo que ya este publicado. */}
        <Route path="/gymkana" element={<Navigate to="/cronograma" replace />} />
        <Route path="/tesoro" element={<Navigate to="/cronograma" replace />} />
        <Route path="/torneo" element={<Navigate to="/cronograma" replace />} />

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
              roles={['admin', 'animador', 'staff_gymkana', 'staff_tesoro', 'arbitro']}
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
