import { Link, useLocation } from 'react-router-dom';
import { LogOut, LogIn, ShieldCheck, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ETIQUETAS_ROL = {
  admin: 'Admin',
  animador: 'Animador',
  staff_gymkana: 'Staff Gymkana',
  staff_tesoro: 'Staff Tesoro',
  arbitro: 'Árbitro',
  formacion: 'Formación',
};

// Todo el staff que opera DESDE el Panel del Animador (ademas del Admin,
// que tiene acceso a ambos paneles).
const ROLES_PANEL_ANIMADOR = ['animador', 'staff_gymkana', 'staff_tesoro', 'arbitro', 'formacion'];

/**
 * Header compartido por toda la app.
 * - Logo: en Home (/) se usa icon.png (isotipo cuadrado); en cualquier
 *   otra página se usa widelogo.png (logo horizontal), ya que en Home
 *   el logo va junto al título grande y en el resto va solo en la
 *   esquina, donde un logo ancho se lee mejor.
 * - Clic en el logo siempre regresa a "/".
 * - Sesión: si hay usuario logueado, muestra su nombre/rol + "Cerrar
 *   sesión". Si no, muestra "Iniciar Sesión" (excepto en /login, donde
 *   ese botón sería redundante).
 */
export default function Header() {
  const { pathname } = useLocation();
  const { session, perfil, logout } = useAuth();

  const esHome = pathname === '/';
  const esLogin = pathname === '/login';
  const logoSrc = esHome ? '/icon.png' : '/widelogo.png';

  return (
    <header className="glass-header px-4 sm:px-8 py-4 sm:py-5 flex items-center justify-between">
      <Link
        to="/"
        className="flex items-center shrink-0 min-w-0 transition-transform duration-300 ease-in-out hover:scale-105"
      >
        {esHome ? (
          <img
            src={logoSrc}
            alt="Interoratorios 2026"
            className="h-20 w-20 sm:h-24 sm:w-24 object-contain drop-shadow-2xl"
          />
        ) : (
          <img
            src={logoSrc}
            alt="Interoratorios 2026"
            className="w-48 sm:w-64 max-w-[70vw] h-auto object-contain drop-shadow-2xl"
          />
        )}
      </Link>

      {!esLogin && (
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {session && perfil ? (
            <>
              {perfil.rol === 'admin' && (
                <Link to="/admin" className="btn-secondary !px-2.5 sm:!px-4">
                  <ShieldCheck size={16} />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              )}

              {(perfil.rol === 'admin' || ROLES_PANEL_ANIMADOR.includes(perfil.rol)) && (
                <Link to="/panel" className="btn-secondary !px-2.5 sm:!px-4">
                  <Users size={16} />
                  <span className="hidden sm:inline">Animador</span>
                </Link>
              )}

              <span className="text-sm text-white/90 hidden md:inline font-medium drop-shadow">
                {perfil?.nombre || ETIQUETAS_ROL[perfil?.rol] || 'Usuario'}
              </span>
              <button onClick={logout} className="btn-ghost hover:!text-red-300 hover:!bg-red-500/20">
                <LogOut size={16} />
                <span className="hidden sm:inline">Cerrar sesión</span>
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-secondary">
              <LogIn size={16} /> Iniciar Sesión
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
