import { useCallback, useEffect, useState } from 'react';
import { Loader2, Radio } from 'lucide-react';
import { obtenerMarcadorGeneral, obtenerUbicaciones, suscribirseVisor } from '../services/visorService';
import TablaPosicionesVisor from '../components/visor/TablaPosicionesVisor';
import TrackerUbicacion from '../components/visor/TrackerUbicacion';

export default function VisorPage() {
  const [marcador, setMarcador] = useState([]);
  const [ubicaciones, setUbicaciones] = useState({});
  const [cargando, setCargando] = useState(true);

  const cargarTodo = useCallback(() => {
    Promise.all([obtenerMarcadorGeneral(), obtenerUbicaciones()])
      .then(([m, u]) => {
        setMarcador(m);
        setUbicaciones(u);
      })
      .catch((err) => console.error('Error cargando el visor:', err.message))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    cargarTodo();
    const unsubscribe = suscribirseVisor(cargarTodo);
    return unsubscribe;
  }, [cargarTodo]);

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <header className="flex items-center justify-between mb-8 max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-4xl font-display font-extrabold heading-gradient">
          Interoratorios 2026
        </h1>
        <span className="flex items-center gap-2 text-sm sm:text-base font-semibold text-red-300 bg-red-500/10 border border-red-500/25 rounded-full px-3 py-1.5">
          <Radio size={14} className="animate-glow-pulse" />
          En vivo
        </span>
      </header>

      {cargando ? (
        <div className="flex justify-center py-24">
          <Loader2 className="animate-spin text-indigo-400" size={40} />
        </div>
      ) : (
        <div className="space-y-8 max-w-4xl mx-auto">
          <TablaPosicionesVisor equipos={marcador} />

          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-slate-100 mb-3">
              Ubicación actual
            </h2>
            <TrackerUbicacion equipos={marcador} ubicaciones={ubicaciones} />
          </div>
        </div>
      )}
    </div>
  );
}
