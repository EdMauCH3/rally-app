import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Envuelve una página que requiere sesión iniciada y, opcionalmente,
 * uno de los roles permitidos.
 *
 * Uso:
 *   <ProtectedRoute roles={['admin']}><AdminPage /></ProtectedRoute>
 *   <ProtectedRoute roles={['staff_gymkana', 'admin']}><GymkanaPage /></ProtectedRoute>
 */
export default function ProtectedRoute({ children, roles }) {
  const { session, perfil, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-400" size={32} />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!perfil) {
    // Usuario autenticado pero sin rol asignado en `perfiles` todavía
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <p className="glass-card px-6 py-5 text-slate-300 max-w-sm">
          Tu cuenta aún no tiene un rol asignado. Contacta al Admin del evento.
        </p>
      </div>
    );
  }

  if (roles && !roles.includes(perfil.rol)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
