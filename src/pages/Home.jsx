import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sunrise, Sun, CalendarClock, ClipboardCheck, Loader2, PlayCircle } from 'lucide-react';
import {
  obtenerConfiguracionApp,
  suscribirseConfiguracionApp,
} from '../services/configuracionAppService';
import ModalBienvenida from '../components/home/ModalBienvenida';

const VIDEO_EVALUACION_URL = 'https://www.youtube.com/watch?v=zC0JJGgnf9g';

// Si falla la lectura de configuracion_app, mejor mostrar de mas que
// dejar a alguien sin poder navegar (excepto el video, que se queda
// apagado por seguridad si no sabemos el estado real).
const CONFIG_DEFECTO = {
  mostrar_manana: true,
  mostrar_tarde: true,
  mostrar_cronograma: true,
  mostrar_evaluacion: true,
  mostrar_video_bienvenida: false,
  mostrar_boton_video: true,
};

export default function Home() {
  const [config, setConfig] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [modalVideoAbierto, setModalVideoAbierto] = useState(false);
  const autoAperturaHecha = useRef(false);

  const cargar = useCallback(() => {
    obtenerConfiguracionApp()
      .then((data) => {
        setConfig(data);
        // Auto-abre el video SOLO la primera vez que detectamos el flag
        // en true, para no reabrirlo de golpe si cambia algo más en la
        // configuración mientras el usuario ya lo cerró.
        if (data.mostrar_video_bienvenida && !autoAperturaHecha.current) {
          setModalVideoAbierto(true);
          autoAperturaHecha.current = true;
        }
      })
      .catch(() => setConfig(CONFIG_DEFECTO))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    cargar();
    const unsubscribe = suscribirseConfiguracionApp(cargar);
    return unsubscribe;
  }, [cargar]);

  return (
    <main className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center text-center px-4 py-12">
      <img
        src="/widelogo.png"
        alt="Interoratorios 2026"
        className="w-full max-w-md object-contain mb-3 animate-fade-up"
      />
      <p className="text-slate-400 text-base sm:text-lg mb-12 animate-fade-up [animation-delay:80ms]">
        Elige qué momento del día quieres ver
      </p>

      {cargando ? (
        <Loader2 className="animate-spin text-white" size={32} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-3xl">
          {config.mostrar_manana && (
            <Link
              to="/colores"
              className="glass-card-hover animate-fade-up group flex flex-col items-center gap-4 px-6 py-10 hover:-translate-y-1"
            >
              <span className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-yellow-400/25 to-amber-500/20 border border-white/10 text-yellow-200 group-hover:from-yellow-400 group-hover:to-amber-500 group-hover:text-white transition-all duration-300">
                <Sunrise size={40} />
              </span>
              <span className="font-black text-white text-2xl sm:text-3xl">Mañana</span>
              <span className="text-sm text-slate-500">Formación</span>
            </Link>
          )}

          {config.mostrar_tarde && (
            <Link
              to="/actividades"
              style={{ animationDelay: '80ms' }}
              className="glass-card-hover animate-fade-up group flex flex-col items-center gap-4 px-6 py-10 hover:-translate-y-1"
            >
              <span className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-500/25 to-orange-700/20 border border-white/10 text-orange-200 group-hover:from-orange-500 group-hover:to-orange-700 group-hover:text-white transition-all duration-300">
                <Sun size={40} />
              </span>
              <span className="font-black text-white text-2xl sm:text-3xl">Tarde</span>
              <span className="text-sm text-slate-500">Actividad</span>
            </Link>
          )}

          {config.mostrar_cronograma && (
            <Link
              to="/cronograma"
              style={{ animationDelay: '160ms' }}
              className="glass-card-hover animate-fade-up group flex flex-col items-center gap-4 px-6 py-10 hover:-translate-y-1"
            >
              <span className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600/25 to-brand-navy/50 border border-white/10 text-blue-200 group-hover:from-blue-600 group-hover:to-brand-navy group-hover:text-white transition-all duration-300">
                <CalendarClock size={40} />
              </span>
              <span className="font-black text-white text-2xl sm:text-3xl">Cronograma</span>
              <span className="text-sm text-slate-500">Horarios del día</span>
            </Link>
          )}

          {config.mostrar_evaluacion && (
            <a
              href={VIDEO_EVALUACION_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ animationDelay: '240ms' }}
              className="glass-card-hover animate-fade-up group flex flex-col items-center gap-4 px-6 py-10 hover:-translate-y-1"
            >
              <span className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500/25 to-emerald-700/20 border border-white/10 text-emerald-200 group-hover:from-emerald-500 group-hover:to-emerald-700 group-hover:text-white transition-all duration-300">
                <ClipboardCheck size={40} />
              </span>
              <span className="font-black text-white text-2xl sm:text-3xl">Evaluación</span>
              <span className="text-sm text-slate-500">Formulario del día</span>
            </a>
          )}
        </div>
      )}

      {!cargando && config?.mostrar_boton_video && (
        <button
          onClick={() => setModalVideoAbierto(true)}
          className="mt-10 w-full max-w-xs flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-all duration-300"
        >
          <PlayCircle size={15} />
          Ver video de bienvenida
        </button>
      )}

      <ModalBienvenida
        abierto={modalVideoAbierto}
        onCerrar={() => setModalVideoAbierto(false)}
      />
    </main>
  );
}
