import { useEffect, useMemo, useState } from 'react';
import { Loader2, Lock, Hourglass, Check } from 'lucide-react';
import { listarEstadoActividades, suscribirseEstadoActividades } from '../services/estadoActividadesService';
import EquipoSelector from '../components/gymkana/EquipoSelector';
import CabeceraBase from '../components/gymkana/CabeceraBase';
import RelojRonda from '../components/gymkana/RelojRonda';
import TarjetaCierreGymkana from '../components/gymkana/TarjetaCierreGymkana';
import LetreroActividadNoIniciada from '../components/common/LetreroActividadNoIniciada';
import PausaActividadOverlay from '../components/common/PausaActividadOverlay';
import { useBasesGymkana } from '../hooks/useBasesGymkana';
import { useCircuitoGymkana } from '../hooks/useCircuitoGymkana';
import {
  crucePropio,
  crucesDeEquipo,
  equipoVisual,
  puntosGymkana,
  tituloBase,
} from '../services/gymkanaLogica';

const LS_KEY = 'gymkana_equipo_seleccionado';

const ETIQUETAS_RESULTADO = {
  gano: { texto: 'Ganó', clase: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' },
  empato: { texto: 'Empató', clase: 'bg-amber-500/15 text-amber-300 border border-amber-500/30' },
  perdio: { texto: 'Perdió', clase: 'bg-white/10 text-slate-300 border border-white/10' },
};

export default function GymkanaPublicoPage() {
  const bases = useBasesGymkana();
  const [iniciada, setIniciada] = useState(null); // null = aun no sabemos
  const [equipoId, setEquipoId] = useState(() => {
    try {
      return localStorage.getItem(LS_KEY);
    } catch {
      return null;
    }
  });
  const { circuito, cruces, equipos, desfaseMs, cargando } = useCircuitoGymkana();

  useEffect(() => {
    function cargarEstadoGlobal() {
      listarEstadoActividades()
        .then((lista) => setIniciada(lista.find((e) => e.actividad === 'gymkana')?.iniciada ?? false))
        .catch(() => setIniciada(false));
    }
    cargarEstadoGlobal();
    return suscribirseEstadoActividades(cargarEstadoGlobal);
  }, []);

  function elegirEquipo(equipo) {
    try {
      localStorage.setItem(LS_KEY, equipo.id);
    } catch {
      // Sin almacenamiento: igual funciona en esta visita.
    }
    setEquipoId(equipo.id);
  }

  function cambiarEquipo() {
    try {
      localStorage.removeItem(LS_KEY);
    } catch {
      // nada que borrar
    }
    setEquipoId(null);
  }

  const equipo = equipos.find((e) => e.id === equipoId) ?? null;
  const mio = useMemo(
    () => (circuito && equipo ? crucePropio(circuito, cruces, equipo.id) : null),
    [circuito, cruces, equipo]
  );
  const historial = useMemo(
    () => (equipo ? crucesDeEquipo(cruces, equipo.id).filter((c) => c.finalizado) : []),
    [cruces, equipo]
  );

  if (iniciada === null) return null;

  if (!iniciada) {
    return (
      <main className="mx-auto max-w-2xl px-4">
        <LetreroActividadNoIniciada tema="gymkana" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <PausaActividadOverlay actividad="gymkana" />
      <h1 className="text-center text-xl font-black text-white">Gymkana</h1>

      {cargando || !circuito ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-white" size={28} />
        </div>
      ) : !equipo ? (
        <EquipoSelector equipos={equipos} equipoSeleccionado={null} onSeleccionar={elegirEquipo} />
      ) : (
        <div className="animate-fade-up space-y-5">
          <RelojRonda circuito={circuito} equipos={equipos} cruces={cruces} desfaseMs={desfaseMs} />

          {circuito.estado === 'completado' ? (
            <TarjetaCierreGymkana
              variante="publico"
              puntos={puntosGymkana(cruces, equipo.id)}
              colorEquipo={equipo.color_hex}
            />
          ) : circuito.estado === 'esperando' || !mio ? (
            <div className="glass-card space-y-3 p-6 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sky-500/15 text-sky-300">
                <Hourglass size={28} />
              </span>
              <p className="text-lg font-bold leading-snug text-white">
                {circuito.estado === 'esperando'
                  ? 'Todavía no empieza la Gymkana. Cuando la coordinación dé la señal, aquí verás tu primera base.'
                  : 'Espera la señal de rotación: aquí aparecerá tu próxima base.'}
              </p>
            </div>
          ) : (
            <>
              <CabeceraBase
                numero={Number(mio.base_id)}
                info={bases[mio.base_id]}
                color={equipo.color_hex}
                etiqueta={mio.finalizado ? 'Terminaste en' : 'Dirígete a'}
              />
              <RivalLinea cruce={mio} equipo={equipo} equipos={equipos} />
              {mio.finalizado && (
                <p
                  role="status"
                  className="flex items-start gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-100"
                >
                  <Check size={18} className="mt-0.5 shrink-0" />
                  Tu encuentro ya fue calificado. Espera la señal de rotación para saber tu próxima base.
                </p>
              )}
            </>
          )}

          {circuito.estado !== 'completado' && (
            <div className="glass-card p-5 text-center">
              <p className="text-sm text-slate-400">Puntos en Gymkana</p>
              <p className="text-4xl font-black text-white">{puntosGymkana(cruces, equipo.id)}</p>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-400">Historial de bases</h3>
            {historial.length === 0 && (
              <p className="glass-row flex items-center gap-1.5 px-4 py-3 text-sm text-slate-500">
                <Lock size={13} /> Aún no has completado ninguna base.
              </p>
            )}
            {historial.map((c) => {
              const lado = c.equipo_a_id === equipo.id ? 'a' : 'b';
              const resultado = lado === 'a' ? c.resultado_a : c.resultado_b;
              return (
                <div key={c.id} className="glass-row flex items-center justify-between px-4 py-3">
                  <span className="text-sm font-medium text-slate-200">
                    {tituloBase(c.base_id, bases[c.base_id])}
                    {bases[c.base_id]?.lugar ? (
                      <span className="block text-xs text-slate-400">📍 {bases[c.base_id].lugar}</span>
                    ) : null}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ETIQUETAS_RESULTADO[resultado]?.clase}`}
                  >
                    {ETIQUETAS_RESULTADO[resultado]?.texto}
                  </span>
                </div>
              );
            })}
          </div>

          <button
            onClick={cambiarEquipo}
            className="mx-auto block text-xs text-slate-500 underline underline-offset-2 transition-colors duration-300 hover:text-slate-300"
          >
            Cambiar equipo
          </button>
        </div>
      )}
    </main>
  );
}

function RivalLinea({ cruce, equipo, equipos }) {
  const rivalId = cruce.equipo_a_id === equipo.id ? cruce.equipo_b_id : cruce.equipo_a_id;
  const rival = equipoVisual(equipos, rivalId);
  return (
    <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-2xl bg-white/[0.04] px-4 py-3 text-base text-slate-200">
      <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Encuentro:</span>
      <span className="inline-flex items-center gap-1.5 font-black text-white">
        <span className="h-3.5 w-3.5 rounded-full border border-white/40" style={{ backgroundColor: equipo.color_hex }} />
        {equipo.nombre}
      </span>
      <span className="text-slate-400">vs</span>
      <span className="inline-flex items-center gap-1.5 font-black text-white">
        <span className="h-3.5 w-3.5 rounded-full border border-white/40" style={{ backgroundColor: rival.color_hex }} />
        {rival.nombre}
      </span>
    </p>
  );
}
