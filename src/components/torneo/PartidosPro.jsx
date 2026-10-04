import { useCallback, useEffect, useState } from 'react';
import { Eye, Loader2, Play } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { listarRosterTorneo } from '../../services/torneoService';
import { listarPartidosPro, suscribirseTorneoPro } from '../../services/torneoProService';
import PartidoProModal from './PartidoProModal';
import { useEstadoPersistente } from '../../hooks/useEstadoPersistente';

const ESTADOS = {
  en_vivo: {
    texto: 'EN VIVO',
    clase: 'bg-red-500/15 text-red-300 border border-red-500/30 animate-pulse',
  },
  pausado: {
    texto: 'PAUSADO',
    clase: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  },
  finalizado: {
    texto: 'FINALIZADO',
    clase: 'bg-white/10 text-slate-300 border border-white/10',
  },
  pendiente: {
    texto: 'PENDIENTE',
    clase: 'bg-white/5 text-slate-400 border border-white/10',
  },
};

// En juego primero (lo urgente), luego lo pendiente, y al final lo terminado.
const PRIORIDAD = { en_vivo: 0, pausado: 0, pendiente: 1, finalizado: 2 };

export default function PartidosPro() {
  const { showToast } = useToast();
  const [partidos, setPartidos] = useState([]);
  const [roster, setRoster] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [abiertoId, setAbiertoId] = useEstadoPersistente('rally_ui_torneo_partido', null);

  const cargar = useCallback(() => {
    Promise.all([listarPartidosPro(), listarRosterTorneo()])
      .then(([p, r]) => {
        setPartidos(p);
        setRoster(r);
      })
      .catch(() => showToast('No se pudieron cargar los partidos', 'error'))
      .finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    cargar();
    const unsubscribe = suscribirseTorneoPro(cargar);
    return unsubscribe;
  }, [cargar]);

  // Si el partido recordado ya no existe (p. ej. tras Reiniciar Evento), se olvida.
  useEffect(() => {
    if (!cargando && abiertoId && !partidos.some((p) => p.id === abiertoId)) {
      setAbiertoId(null);
    }
  }, [cargando, partidos, abiertoId, setAbiertoId]);

  function equipoDe(id) {
    return roster.find((e) => e.id === id);
  }

  if (cargando) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-white" size={28} />
      </div>
    );
  }

  const ordenados = [...partidos].sort(
    (a, b) =>
      (PRIORIDAD[a.estado] ?? 1) - (PRIORIDAD[b.estado] ?? 1) || a.partido_num - b.partido_num
  );

  return (
    <div className="max-w-2xl mx-auto px-4 space-y-4">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-black text-white">Partidos</h2>
        <p className="text-sm text-slate-400">Abre un partido para arbitrarlo en pantalla completa.</p>
      </div>

      {partidos.length === 0 ? (
        <p className="glass-card p-5 text-center text-sm text-slate-400">
          Aún no hay partidos. El Admin debe generar el fixture (Admin → Torneo).
        </p>
      ) : (
        ordenados.map((p) => {
          const equipoA = equipoDe(p.equipo_a_id);
          const equipoB = equipoDe(p.equipo_b_id);
          if (!equipoA || !equipoB) return null;
          const estado = ESTADOS[p.estado] ?? ESTADOS.pendiente;
          const terminado = p.estado === 'finalizado';

          return (
            <div
              key={p.id}
              className={`glass-card p-4 space-y-3 transition-all duration-300 ${
                p.estado === 'en_vivo' ? 'border-red-500/50' : ''
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Partido {p.partido_num}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${estado.clase}`}>
                  {estado.texto}
                </span>
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
                <div className="min-w-0">
                  <span
                    className="mb-1 inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: equipoA.color_hex }}
                  />
                  <p className="truncate font-semibold text-white">{equipoA.nombre}</p>
                </div>
                <p className="text-3xl font-black tabular-nums text-white">
                  {p.goles_a} <span className="text-slate-600">-</span> {p.goles_b}
                </p>
                <div className="min-w-0">
                  <span
                    className="mb-1 inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: equipoB.color_hex }}
                  />
                  <p className="truncate font-semibold text-white">{equipoB.nombre}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAbiertoId(p.id)}
                className={terminado ? 'btn-secondary w-full' : 'btn-primary w-full !py-3.5'}
              >
                {terminado ? <Eye size={18} /> : <Play size={18} />}
                {terminado
                  ? 'Ver partido'
                  : p.estado === 'pendiente'
                    ? 'Abrir partido'
                    : 'Retomar partido'}
              </button>
            </div>
          );
        })
      )}

      {abiertoId && <PartidoProModal partidoId={abiertoId} onCerrar={() => setAbiertoId(null)} />}
    </div>
  );
}
