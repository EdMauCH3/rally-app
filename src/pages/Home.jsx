import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon, CalendarClock, Loader2 } from 'lucide-react';
import {
  obtenerConfiguracionApp,
  suscribirseConfiguracionApp,
} from '../services/configuracionAppService';

export default function Home() {
  const [config, setConfig] = useState(null);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(() => {
    obtenerConfiguracionApp()
      .then(setConfig)
      .catch(() => setConfig({ mostrar_manana: true, mostrar_tarde: true })) // fallback seguro
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
          {config.mostrar_manana && (
            <Link
              to="/colores"
              className="glass-card-hover animate-fade-up group flex flex-col items-center gap-3 px-6 py-8 hover:-translate-y-1"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/25 to-amber-700/20 border border-white/10 text-amber-200 group-hover:from-amber-500 group-hover:to-amber-700 group-hover:text-white transition-all duration-300">
                <Sun size={26} />
              </span>
              <span className="font-semibold text-white text-lg">Mañana</span>
              <span className="text-xs text-slate-500">Formación</span>
            </Link>
          )}

          {config.mostrar_tarde && (
            <Link
              to="/actividades"
              style={{ animationDelay: '80ms' }}
              className="glass-card-hover animate-fade-up group flex flex-col items-center gap-3 px-6 py-8 hover:-translate-y-1"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-brown/25 to-amber-800/20 border border-white/10 text-amber-100 group-hover:from-brand-brown group-hover:to-amber-900 group-hover:text-white transition-all duration-300">
                <Moon size={26} />
              </span>
              <span className="font-semibold text-white text-lg">Tarde</span>
              <span className="text-xs text-slate-500">Actividad</span>
            </Link>
          )}

          <Link
            to="/cronograma"
            style={{ animationDelay: '160ms' }}
            className="glass-card-hover animate-fade-up group flex flex-col items-center gap-3 px-6 py-8 hover:-translate-y-1"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-navy/60 to-brand-brown/20 border border-white/10 text-slate-200 group-hover:from-brand-navy group-hover:to-brand-brown group-hover:text-white transition-all duration-300">
              <CalendarClock size={26} />
            </span>
            <span className="font-semibold text-white text-lg">Cronograma</span>
            <span className="text-xs text-slate-500">Horarios del día</span>
          </Link>
        </div>
      )}
    </main>
  );
}
