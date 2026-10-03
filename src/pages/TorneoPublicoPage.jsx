import { useCallback, useEffect, useState } from 'react';
import { Loader2, Radio, Lock, Trophy } from 'lucide-react';
import {
  listarPartidos,
  listarRosterTorneo,
  suscribirsePartidos,
  suscribirseRosterTorneo,
} from '../services/torneoService';
import { obtenerTorneoPosiciones } from '../services/visorService';
import {
  listarEstadoActividades,
  suscribirseEstadoActividades,
} from '../services/estadoActividadesService';
import LetreroActividadNoIniciada from '../components/common/LetreroActividadNoIniciada';

const ETIQUETA_RESULTADO = { gano: 'Ganó', empato: 'Empató', perdio: 'Perdió' };

export default function TorneoPublicoPage() {
  const [iniciada, setIniciada] = useState(null);
  const [roster, setRoster] = useState([]);
  const [partidos, setPartidos] = useState([]);
  const [posiciones, setPosiciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    function cargarEstadoGlobal() {
      listarEstadoActividades().then((lista) => {
        setIniciada(lista.find((e) => e.actividad === 'torneo')?.iniciada ?? false);
      });
    }
    cargarEstadoGlobal();
    const unsubscribe = suscribirseEstadoActividades(cargarEstadoGlobal);
    return unsubscribe;
  }, []);

  const cargarTodo = useCallback(() => {
    Promise.all([listarRosterTorneo(), listarPartidos(), obtenerTorneoPosiciones()])
      .then(([r, p, pos]) => {
        setRoster(r);
        setPartidos(p);
        setPosiciones(pos);
      })
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    if (!iniciada) return;
    cargarTodo();
    const unsubPartidos = suscribirsePartidos(cargarTodo);
    const unsubRoster = suscribirseRosterTorneo(cargarTodo);
    return () => {
      unsubPartidos();
      unsubRoster();
    };
  }, [iniciada, cargarTodo]);

  function equipoPorId(id) {
    return roster.find((e) => e.id === id);
  }

  if (iniciada === null) return null;

  if (!iniciada) {
    return (
      <main className="max-w-2xl mx-auto px-4">
        <LetreroActividadNoIniciada nombreActividad="el Torneo" />
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-xl font-black text-white text-center">Torneo</h1>

      {cargando ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-white" size={28} />
        </div>
      ) : partidos.length === 0 ? (
        <p className="text-center text-slate-400 py-10">Aún no se han generado los partidos.</p>
      ) : (
        <div className="space-y-6 animate-fade-up">
          <div className="glass-card p-4 space-y-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-300">
              <Trophy size={16} className="text-amber-300" /> Posiciones
            </h2>
            {posiciones
              .slice()
              .sort((a, b) => b.puntos_torneo - a.puntos_torneo)
              .map((eq, i) => (
                <div
                  key={eq.equipo_torneo_id}
                  className="flex items-center justify-between text-sm glass-row px-3 py-2"
                >
                  <span className="flex items-center gap-2 font-medium text-white">
                    <span className="w-5 text-slate-500">{i + 1}º</span>
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: eq.color_hex }}
                    />
                    <span className="truncate">{eq.nombre}</span>
                  </span>
                  <span className="font-bold text-white shrink-0">{eq.puntos_torneo}</span>
                </div>
              ))}
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-300">Partidos</h2>
            {partidos.map((p) => {
              const equipoA = equipoPorId(p.equipo_a_id);
              const equipoB = equipoPorId(p.equipo_b_id);
              if (!equipoA || !equipoB) return null;
              return (
                <div
                  key={p.id}
                  className={`glass-card p-4 space-y-2 transition-all duration-300 ${
                    p.en_juego ? 'border-red-500/50 shadow-red-950/40' : ''
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Partido {p.partido_num}</span>
                    {p.finalizado ? (
                      <span className="flex items-center gap-1">
                        <Lock size={12} /> Finalizado
                      </span>
                    ) : p.en_juego ? (
                      <span className="flex items-center gap-1 text-red-300 font-semibold animate-pulse">
                        <Radio size={12} /> EN VIVO
                      </span>
                    ) : (
                      <span>Pendiente</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-center">
                    <div className="flex-1">
                      <span
                        className="inline-block w-3 h-3 rounded-full mr-1 align-middle"
                        style={{ backgroundColor: equipoA.color_hex }}
                      />
                      <span className="font-semibold text-slate-100">{equipoA.nombre}</span>
                      {p.finalizado && (
                        <p className="text-xs text-slate-500">{ETIQUETA_RESULTADO[p.resultado_a]}</p>
                      )}
                    </div>
                    <span className="text-slate-600 font-bold px-2">vs</span>
                    <div className="flex-1">
                      <span className="font-semibold text-slate-100">{equipoB.nombre}</span>
                      <span
                        className="inline-block w-3 h-3 rounded-full ml-1 align-middle"
                        style={{ backgroundColor: equipoB.color_hex }}
                      />
                      {p.finalizado && (
                        <p className="text-xs text-slate-500">{ETIQUETA_RESULTADO[p.resultado_b]}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}
