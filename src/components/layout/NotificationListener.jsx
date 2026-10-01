import { useEffect, useRef, useState } from 'react';
import { X, AlertTriangle, Megaphone } from 'lucide-react';
import {
  obtenerNotificacionPermanenteActiva,
  suscribirseNotificacionesGlobales,
} from '../../services/notificacionesService';

/**
 * Vive montado en AppLayout, fuera del <Outlet>, para que sobreviva a
 * los cambios de ruta sin desmontarse y pueda interrumpir CUALQUIER
 * pantalla (Staff, Visor, Home, etc.) sin importar donde este el usuario.
 */
export default function NotificationListener() {
  const [push, setPush] = useState(null);
  const [permanente, setPermanente] = useState(null);
  const [flasheando, setFlasheando] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio('/sonido-rotacion.mp3');
  }, []);

  useEffect(() => {
    // Si ya existe una permanente activa (el Admin la mando antes de que
    // este usuario cargara la app), se muestra de una vez, SIN flash ni
    // sonido: esos efectos son para el momento en que algo pasa EN VIVO,
    // no para "alcanzar" un estado que ya estaba ahi.
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

  return (
    <>
      {flasheando && (
        <div className="fixed inset-0 z-[200] pointer-events-none animate-luces-rotacion" />
      )}

      {/* Permanente: bloquea TODO, sin boton de cerrar. Prioridad maxima. */}
      {permanente && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center px-4 py-10 bg-brand-navy/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl border-2 border-red-500/60 bg-gradient-to-b from-red-600/20 via-brand-navy/80 to-brand-navy/95 backdrop-blur-xl shadow-2xl shadow-black/70 p-8 text-center space-y-5 animate-fade-up">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 border border-red-500/40 animate-pulse">
              <AlertTriangle className="text-red-300" size={32} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              {permanente.titulo}
            </h2>
            <p className="text-base sm:text-lg text-white/85 whitespace-pre-line leading-relaxed">
              {permanente.mensaje}
            </p>
            <p className="text-xs text-white/40 uppercase tracking-widest font-semibold pt-2">
              El Admin cerrará este aviso
            </p>
          </div>
        </div>
      )}

      {/* Push: descartable. No se muestra si hay una permanente bloqueando. */}
      {push && !permanente && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center px-4 py-10 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl border border-brand-brown/40 bg-gradient-to-b from-brand-brown/20 via-brand-navy/80 to-brand-navy/95 backdrop-blur-xl shadow-2xl shadow-black/70 p-8 text-center space-y-5 animate-fade-up">
            <button
              onClick={() => setPush(null)}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors duration-300"
              aria-label="Cerrar"
            >
              <X size={22} />
            </button>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-brown/25 border border-brand-brown/40">
              <Megaphone className="text-amber-200" size={32} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              {push.titulo}
            </h2>
            <p className="text-base sm:text-lg text-white/85 whitespace-pre-line leading-relaxed">
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
