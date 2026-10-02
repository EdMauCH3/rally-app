import { useEffect, useRef, useState } from 'react';
import { X, Bell, Megaphone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  obtenerNotificacionPermanenteActiva,
  suscribirseNotificacionesGlobales,
} from '../../services/notificacionesService';

/**
 * Vive montado en AppLayout, fuera del <Outlet>, para que sobreviva a
 * los cambios de ruta y pueda interrumpir CUALQUIER pantalla.
 */
export default function NotificationListener() {
  const { perfil } = useAuth();
  const esAdmin = perfil?.rol === 'admin';

  const [push, setPush] = useState(null);
  const [permanente, setPermanente] = useState(null);
  // Id de la permanente que el Admin cerro SOLO en su propia pantalla
  // (no apaga nada para los demas; eso sigue siendo el boton rojo del panel).
  const [permanenteDescartadaId, setPermanenteDescartadaId] = useState(null);
  const [flasheando, setFlasheando] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio('/sonido-rotacion.mp3');
  }, []);

  useEffect(() => {
    // Si ya existe una permanente activa al cargar la app, se muestra de
    // una vez, SIN flash ni sonido (esos efectos son solo para el momento
    // en que algo pasa EN VIVO, no para "alcanzar" un estado que ya existia).
    obtenerNotificacionPermanenteActiva()
      .then((data) => {
        if (data) setPermanente(data);
      })
      .catch(() => {});

    const unsubscribe = suscribirseNotificacionesGlobales({
      onInsert: (nueva) => {
        dispararEfecto();
        if (nueva.tipo === 'push') {
          setPush(nueva);
        } else if (nueva.tipo === 'permanente') {
          setPermanente(nueva);
        }
      },
      onUpdate: (actualizada) => {
        if (actualizada.tipo === 'permanente' && actualizada.estado_activa === false) {
          setPermanente((actual) => (actual?.id === actualizada.id ? null : actual));
        }
      },
    });

    return unsubscribe;
  }, []);

  function dispararEfecto() {
    setFlasheando(true);
    audioRef.current?.play().catch(() => {});
    setTimeout(() => setFlasheando(false), 2500);
  }

  // El Admin puede quitarla de SU pantalla (para poder navegar al panel y
  // apagarla de verdad); para cualquier otro rol esto nunca se cumple y la
  // permanente se queda bloqueando hasta que el Admin la apague de verdad.
  const mostrarPermanente =
    permanente && !(esAdmin && permanenteDescartadaId === permanente.id);

  return (
    <>
      {flasheando && (
        <div className="fixed inset-0 z-[200] pointer-events-none animate-luces-rotacion" />
      )}

      {mostrarPermanente && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center px-4 py-10 bg-brand-navy/70 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl border-2 border-[#733f2d]/25 bg-stone-50 shadow-2xl shadow-black/50 p-8 text-center space-y-5 animate-fade-up">
            {esAdmin && (
              <button
                onClick={() => setPermanenteDescartadaId(permanente.id)}
                className="absolute top-4 right-4 text-stone-400 hover:text-[#053866] transition-colors duration-300"
                aria-label="Cerrar solo en mi pantalla"
              >
                <X size={22} />
              </button>
            )}

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#053866]/10 border border-[#053866]/20">
              <Bell className="text-[#053866]" size={30} />
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-[#053866] leading-tight">
              {permanente.titulo}
            </h2>

            <p className="text-base sm:text-lg text-stone-700 whitespace-pre-line leading-relaxed">
              {permanente.mensaje}
            </p>

            {esAdmin ? (
              <button
                onClick={() => setPermanenteDescartadaId(permanente.id)}
                className="text-sm font-semibold text-[#733f2d] underline underline-offset-2 hover:text-[#053866] transition-colors duration-300"
              >
                Cerrar solo en mi pantalla
              </button>
            ) : (
              <p className="text-xs text-stone-400 uppercase tracking-widest font-semibold pt-2">
                El Admin cerrará este aviso
              </p>
            )}
          </div>
        </div>
      )}

      {push && !mostrarPermanente && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center px-4 py-10 bg-brand-navy/70 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl border-2 border-[#053866]/15 bg-stone-50 shadow-2xl shadow-black/50 p-8 text-center space-y-5 animate-fade-up">
            <button
              onClick={() => setPush(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-[#053866] transition-colors duration-300"
              aria-label="Cerrar"
            >
              <X size={22} />
            </button>

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#733f2d]/10 border border-[#733f2d]/20">
              <Megaphone className="text-[#733f2d]" size={30} />
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-[#053866] leading-tight">
              {push.titulo}
            </h2>

            <p className="text-base sm:text-lg text-stone-700 whitespace-pre-line leading-relaxed">
              {push.mensaje}
            </p>

            <button onClick={() => setPush(null)} className="btn-primary mx-auto">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
