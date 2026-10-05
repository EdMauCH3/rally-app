import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Flag, Map, Trophy } from 'lucide-react';
import {
  listarEstadoActividades,
  suscribirseEstadoActividades,
} from '../../services/estadoActividadesService';
import { listarPartidos, suscribirsePartidos } from '../../services/torneoService';
import TablaMarcador from './TablaMarcador';

function Tarjeta({ icono: Icono, nombre, color, visible, cargado, lineas, alerta }) {
  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 font-bold text-white">
          <Icono size={18} className={color} />
          {nombre}
        </span>
        {cargado && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
              visible ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-slate-400'
            }`}
          >
            {visible ? 'Iniciada' : 'Apagada'}
          </span>
        )}
      </div>

      <div className="space-y-1">
        {lineas.map((l) => (
          <p key={l} className="text-sm text-slate-300">
            {l}
          </p>
        ))}
      </div>

      {alerta && (
        <p className="flex items-center gap-1.5 text-sm font-semibold text-red-300">
          <AlertTriangle size={14} />
          {alerta}
        </p>
      )}
    </div>
  );
}

/**
 * Estado general de las actividades de la tarde + el marcador general.
 * "Iniciada / Apagada" es el interruptor que decide si el público ve la
 * actividad o el letrero de espera (Admin → Equipos, o dentro de cada módulo).
 */
export default function ResumenAnimacion({
  marcador,
  gymkanaLanzada,
  partidosGymkana,
  alertasGymkanaPendientes,
}) {
  const [estados, setEstados] = useState([]);
  const [partidosTorneo, setPartidosTorneo] = useState([]);
  const [cargado, setCargado] = useState(false);

  const cargar = useCallback(() => {
    Promise.allSettled([listarEstadoActividades(), listarPartidos()]).then(([e, p]) => {
      if (e.status === 'fulfilled') setEstados(e.value);
      if (p.status === 'fulfilled') setPartidosTorneo(p.value);
      setCargado(true);
    });
  }, []);

  useEffect(() => {
    cargar();
    const cancelarEstados = suscribirseEstadoActividades(cargar);
    const cancelarPartidos = suscribirsePartidos(cargar);
    return () => {
      cancelarEstados();
      cancelarPartidos();
    };
  }, [cargar]);

  const visible = (actividad) => estados.find((e) => e.actividad === actividad)?.iniciada ?? false;

  const gymkanaTotal = partidosGymkana.length;
  const gymkanaListos = partidosGymkana.filter((p) => p.finalizado).length;
  const torneoTotal = partidosTorneo.length;
  const torneoListos = partidosTorneo.filter((p) => p.finalizado).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Tarjeta
          icono={Flag}
          nombre="Gymkana"
          color="text-emerald-300"
          visible={visible('gymkana')}
          cargado={cargado}
          lineas={
            gymkanaLanzada
              ? [`${gymkanaListos} de ${gymkanaTotal} partidos finalizados`]
              : ['Aún no se ha lanzado']
          }
          alerta={
            alertasGymkanaPendientes > 0
              ? `${alertasGymkanaPendientes} ${alertasGymkanaPendientes === 1 ? 'alerta pendiente' : 'alertas pendientes'}`
              : null
          }
        />
        <Tarjeta
          icono={Trophy}
          nombre="Torneo"
          color="text-violet-300"
          visible={visible('torneo')}
          cargado={cargado}
          lineas={
            torneoTotal > 0
              ? [`${torneoListos} de ${torneoTotal} partidos jugados`]
              : ['Fixture sin generar']
          }
        />
        <Tarjeta
          icono={Map}
          nombre="Búsqueda del Tesoro"
          color="text-amber-300"
          visible={visible('tesoro')}
          cargado={cargado}
          lineas={['Se inicia y califica desde su módulo']}
        />
      </div>

      <div className="space-y-2">
        <h2 className="font-semibold text-white">Marcador general</h2>
        <TablaMarcador equipos={marcador} />
      </div>
    </div>
  );
}
