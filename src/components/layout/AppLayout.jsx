import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import NotificationListener from './NotificationListener';
import Footer from './Footer';
import PantallaCuentaRegresiva from '../teaser/PantallaCuentaRegresiva';
import { useAuth } from '../../context/AuthContext';
import { useModoCuentaRegresiva } from '../../hooks/useModoCuentaRegresiva';

export default function AppLayout() {
  const { pathname } = useLocation();
  const { perfil, loading } = useAuth();
  const { activo: cuentaRegresiva, cargando: cargandoModo } = useModoCuentaRegresiva();

  // Mientras no sabemos si hay sesión ni si el modo está encendido no se
  // muestra contenido: así el público nunca alcanza a ver la app un instante
  // antes de que la cubra la pantalla de cuenta regresiva.
  if ((loading && !perfil) || cargandoModo) {
    return <div className="min-h-screen" />;
  }

  // Bloqueo: modo encendido + sin un usuario válido (con rol). /login queda
  // siempre abierto para que el staff pueda entrar. Al iniciar sesión,
  // `perfil` aparece y el bloqueo desaparece solo.
  const bloqueado = cuentaRegresiva && !perfil && pathname !== '/login';

  if (bloqueado) {
    return (
      <>
        <NotificationListener />
        <PantallaCuentaRegresiva />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <NotificationListener />
      <Header />
      <div className="flex-1 pb-10">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
