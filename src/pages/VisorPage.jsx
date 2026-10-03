import { useCallback, useEffect, useState } from 'react';
import { Loader2, Radio } from 'lucide-react';
import {
  obtenerMarcadorGeneral,
  obtenerTorneoPosiciones,
  obtenerUbicacionesGymkana,
  obtenerUbicacionesTesoro,
  suscribirseVisor,
} from '../services/visorService';
import { listarSubEquiposColor } from '../services/subEquiposColorService';
import TablaPosicionesVisor from '../components/visor/TablaPosicionesVisor';
import TrackerUbicacion from '../components/visor/TrackerUbicacion';

export default function VisorPage() {
  const [marcador, setMarcador] = useState([]);
  const [exclusivosTorneo, setExclusivosTorneo] = useState([]);
  const [ubicacionesGymkana, setUbicacionesGymkana] = useState([]);
  const [ubicacionesTesoro, setUbicacionesTesoro] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargarTodo = useCallback(() => {
    Promise.all([
      obtenerMarcadorGeneral(),
      obtenerTorneoPosiciones(),
      obtenerUbicacionesGymkana(),
      obtenerUbicacionesTesoro(),
      listarSubEquiposColor(),
    ])
      .then(([m, torneo, ug, ut, colores]) => {
        // ug/ut traen equipo_id = id del COLOR (sub_equipos_color); como
        // el Visor solo muestra Macro-Equipos, se resuelve cada color a
        // su macro_equipo_id antes de pasarlo al tracker.
        const macroDeColor = new Map(colores.map((c) => [c.id, c.macro_equipo_id]));
        const porMacroEquipo = (ubicaciones) =>
          ubicaciones.map((u) => ({
            ...u,
            equipo_id: macroDeColor.get(u.equipo_id) ?? u.equipo_id,
          }));

        setMarcador(m);
        setExclusivosTorneo(torneo.filter((t) => t.es_exclusivo));
        setUbicacionesGymkana(porMacroEquipo(ug));
        setUbicacionesTesoro(porMacroEquipo(ut));
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
    <div className="p-4 sm:p-8">
      <div className="flex items-center justify-end mb-6 max-w-4xl mx-auto">
        <span className="flex items-center gap-2 text-sm sm:text-base font-semibold text-red-300 bg-red-500/10 border border-red-500/25 rounded-full px-3 py-1.5">
          <Radio size={14} className="animate-glow-pulse" />
          En vivo
        </span>
      </div>

      {cargando ? (
        <div className="flex justify-center py-24">
          <Loader2 className="animate-spin text-white" size={40} />
        </div>
      ) : (
        <div className="space-y-10 max-w-4xl mx-auto">
          <TablaPosicionesVisor generales={marcador} exclusivos={exclusivosTorneo} />

          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-white mb-3 text-center sm:text-left">
              ¿Dónde están los equipos?
            </h2>
            <TrackerUbicacion
              equiposGenerales={marcador}
              ubicacionesGymkana={ubicacionesGymkana}
              ubicacionesTesoro={ubicacionesTesoro}
            />
          </div>
        </div>
      )}
    </div>
  );
}
