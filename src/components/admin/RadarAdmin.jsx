import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Amphora, Check, Clock, Flag, Loader2, MapPin } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useBasesGymkana } from '../../hooks/useBasesGymkana';
import { listarEquipos } from '../../services/equiposService';
import { listarSubEquiposColor } from '../../services/subEquiposColorService';
import { obtenerEstacionesGymkana, suscribirseGymkana } from '../../services/gymkanaService';
import {
  listarRutasTesoro,
  listarPuntuacionesTesoro,
  listarAsignacionesTesoro,
  suscribirseTesoroGlobal,
  BASES_TESORO,
} from '../../services/tesoroService';
import {
  mapaEquipos,
  radarGymkana,
  radarTesoro,
  ocupacionBases,
  ocupacionTinajas,
} from '../../services/estacionesLogica';
import ControlPausaActividades from './ControlPausaActividades';
import IniciarGymkanaPanel from './IniciarGymkanaPanel';
import SupervisionTesoroAdmin from './SupervisionTesoroAdmin';

const BASES_GYMKANA = [1, 2, 3, 4, 5, 6];

function Punto({ color, grande = false }) {
  return (
    <span
      className={`inline-block shrink-0 rounded-full ${grande ? 'h-3.5 w-3.5' : 'h-2.5 w-2.5'}`}
      style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}99` }}
    />
  );
}

/** Una celda de la matriz: dónde está o a dónde va un equipo (de color) en una actividad. */
function CeldaEquipo({ fila, unidad, lugar, icono: Icono }) {
  if (!fila) {
    return <p className="text-sm text-slate-500">Sin equipo asignado</p>;
  }

  let texto;
  let clase = 'text-slate-200';
  if (fila.estado === 'termino') {
    texto = 'Terminó su recorrido';
    clase = 'text-emerald-300';
  } else if (fila.estado === 'espera') {
    texto = 'Esperando que se libere una tinaja';
    clase = 'text-sky-300';
  } else if (fila.estado === 'en_lugar') {
    texto = `En ${unidad} ${fila.destino}${lugar ? ` · ${lugar}` : ''}`;
    clase = 'text-emerald-300';
  } else {
    texto = `Va a ${unidad} ${fila.destino}${lugar ? ` · ${lugar}` : ''}`;
    clase = 'text-amber-200';
  }

  const pct = fila.total > 0 ? (fila.completadas / fila.total) * 100 : 0;

  return (
    <div className="space-y-1.5">
      <p className="flex items-center gap-2 text-sm font-semibold text-white">
        <Punto color={fila.equipo.color_hex} grande />
        {fila.equipo.nombre}
        {fila.rival && (
          <span className="text-xs font-normal text-slate-400">vs {fila.rival.nombre}</span>
        )}
      </p>
      <p className={`flex items-center gap-1.5 text-sm ${clase}`}>
        {fila.estado === 'espera' ? (
          <Clock size={14} />
        ) : fila.estado === 'termino' ? (
          <Check size={14} />
        ) : (
          <Icono size={14} />
        )}
        {texto}
      </p>
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: fila.equipo.color_hex }}
          />
        </div>
        <span className="text-xs tabular-nums text-slate-400">
          {fila.completadas}/{fila.total}
        </span>
      </div>
    </div>
  );
}

const ESTILO_ESTADO = {
  libre: 'border-white/10 bg-white/[0.03] text-slate-400',
  en_camino: 'border-amber-400/50 bg-amber-500/10 text-amber-200',
  compitiendo: 'border-emerald-400/60 bg-emerald-500/15 text-emerald-200',
  en_tinaja: 'border-emerald-400/60 bg-emerald-500/15 text-emerald-200',
  cerrada: 'border-white/10 bg-white/[0.02] text-slate-500',
};

const ETIQUETA_ESTADO = {
  libre: 'Libre',
  en_camino: 'Viene un equipo',
  compitiendo: 'Compitiendo',
  en_tinaja: 'Calificando',
  cerrada: 'Cerrada',
};

function FichaEstacion({ etiqueta, estacion, lugar, equiposDeEstacion }) {
  const { numero, estado } = estacion;
  return (
    <div className={`space-y-1.5 rounded-2xl border-2 p-3 ${ESTILO_ESTADO[estado]}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-base font-black text-white">
          {etiqueta} {numero}
        </span>
        {estado === 'cerrada' && <Check size={16} />}
      </div>
      {lugar && <p className="truncate text-xs text-slate-400">{lugar}</p>}
      <p className="text-xs font-semibold">{ETIQUETA_ESTADO[estado]}</p>
      {equiposDeEstacion.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {equiposDeEstacion.map((e) => (
            <span key={e.id} className="flex items-center gap-1 text-xs text-white">
              <Punto color={e.color_hex} />
              {e.nombre}
            </span>
          ))}
        </div>
      )}
      {estacion.choque && (
        <p className="flex items-center gap-1 text-xs font-semibold text-red-300">
          <AlertTriangle size={12} /> Dos parejas a la vez
        </p>
      )}
    </div>
  );
}

/**
 * Radar en vivo para el Admin: dónde está cada macro-equipo ahora mismo en la
 * Gymkana y en el Tesoro, qué bases y tinajas están libres o con equipos, y los
 * controles de pausa. Se actualiza solo por Realtime. Las correcciones de
 * resultados viven abajo, reutilizando las pantallas de edición que ya existían.
 */
export default function RadarAdmin({
  coloresGymkana,
  rutasGymkana,
  partidosGymkana,
  gymkanaIniciada,
  alertasPendientes,
  onCambio,
}) {
  const { showToast } = useToast();
  const bases = useBasesGymkana();

  const [macros, setMacros] = useState([]);
  const [subs, setSubs] = useState([]);
  const [gym, setGym] = useState({ rutas: [], partidos: [] });
  const [tes, setTes] = useState({ rutas: [], puntuaciones: [], asignaciones: [] });
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    const r = await Promise.allSettled([
      listarEquipos(),
      listarSubEquiposColor(),
      obtenerEstacionesGymkana(),
      listarRutasTesoro(),
      listarPuntuacionesTesoro(),
      listarAsignacionesTesoro(),
    ]);
    if (r[0].status === 'fulfilled') setMacros(r[0].value);
    if (r[1].status === 'fulfilled') setSubs(r[1].value);
    if (r[2].status === 'fulfilled') setGym(r[2].value);
    // Sin el SQL de estaciones (o sin iniciar) el Tesoro simplemente aparece vacío.
    setTes({
      rutas: r[3].status === 'fulfilled' ? r[3].value : [],
      puntuaciones: r[4].status === 'fulfilled' ? r[4].value : [],
      asignaciones: r[5].status === 'fulfilled' ? r[5].value : [],
    });
    if (r.slice(0, 2).some((x) => x.status === 'rejected')) {
      showToast('No se pudo cargar todo el radar', 'error');
    }
    setCargando(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    cargar();
    let temporizador;
    const refrescar = () => {
      clearTimeout(temporizador);
      temporizador = setTimeout(cargar, 300);
    };
    const c1 = suscribirseGymkana(refrescar);
    const c2 = suscribirseTesoroGlobal(refrescar);
    const intervalo = setInterval(cargar, 30000);
    return () => {
      clearTimeout(temporizador);
      clearInterval(intervalo);
      c1();
      c2();
    };
  }, [cargar]);

  const calculos = useMemo(() => {
    const equipos = mapaEquipos(
      subs.map((s) => ({ id: s.id, nombre: s.color_nombre, color_hex: s.color_hex }))
    );
    return {
      gymFilas: radarGymkana(gym.rutas, gym.partidos, equipos),
      tesFilas: radarTesoro(tes.rutas, tes.puntuaciones, tes.asignaciones, equipos),
      bases: ocupacionBases(gym.rutas, gym.partidos, equipos, BASES_GYMKANA),
      tinajas: ocupacionTinajas(tes.rutas, tes.puntuaciones, tes.asignaciones, equipos, BASES_TESORO),
    };
  }, [subs, gym, tes]);

  if (cargando) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="animate-spin text-white" size={28} />
      </div>
    );
  }

  const subPorId = new Map(subs.map((s) => [s.id, s]));
  const filaGym = (macroId) =>
    calculos.gymFilas.find((f) => subPorId.get(f.equipo.id)?.macro_equipo_id === macroId);
  const filaTes = (macroId) =>
    calculos.tesFilas.find((f) => subPorId.get(f.equipo.id)?.macro_equipo_id === macroId);

  const equipoDe = (id) => {
    const s = subPorId.get(id);
    return s ? { id: s.id, nombre: s.color_nombre, color_hex: s.color_hex } : null;
  };

  const equiposDeBase = (n) =>
    calculos.bases
      .find((b) => b.numero === n)
      .parejas.flatMap((p) => [p.equipoA, p.equipoB]);
  const equiposDeTinaja = (n) => {
    const t = calculos.tinajas.find((x) => x.numero === n);
    return t.equipo ? [t.equipo] : [];
  };
  const hayTesoro = tes.rutas.length > 0;

  return (
    <div className="space-y-8">
      <ControlPausaActividades />

      {/* ───────── Matriz por macro-equipo ───────── */}
      <section className="space-y-3">
        <div>
          <h2 className="font-semibold text-white">¿Dónde está cada equipo?</h2>
          <p className="text-sm text-slate-400">
            Se actualiza solo. Cada macro-equipo lleva un color distinto en cada actividad.
          </p>
        </div>

        {macros.length === 0 ? (
          <p className="glass-card p-5 text-center text-sm text-slate-400">
            Aún no hay macro-equipos creados.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="hidden grid-cols-[1.1fr_2fr_2fr] gap-3 px-1 text-xs font-bold uppercase tracking-wide text-slate-500 md:grid">
              <span>Macro-equipo</span>
              <span className="flex items-center gap-1.5">
                <Flag size={13} /> Gymkana
              </span>
              <span className="flex items-center gap-1.5">
                <Amphora size={13} /> Búsqueda del Tesoro
              </span>
            </div>

            {macros.map((m) => {
              const g = filaGym(m.id);
              const t = filaTes(m.id);
              return (
                <div
                  key={m.id}
                  className="glass-card grid gap-3 p-4 md:grid-cols-[1.1fr_2fr_2fr] md:items-center"
                  style={{ borderLeft: `8px solid ${m.color_hex}` }}
                >
                  <p className="font-black text-white">{m.nombre}</p>
                  <div>
                    <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500 md:hidden">
                      Gymkana
                    </p>
                    {gymkanaIniciada || gym.rutas.length > 0 ? (
                      <CeldaEquipo
                        fila={g}
                        unidad="la Base"
                        lugar={g?.destino ? bases[g.destino]?.lugar?.trim() : null}
                        icono={MapPin}
                      />
                    ) : (
                      <p className="text-sm text-slate-500">Aún no se inicia</p>
                    )}
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500 md:hidden">
                      Búsqueda del Tesoro
                    </p>
                    {hayTesoro ? (
                      <CeldaEquipo fila={t} unidad="la Tinaja" icono={Amphora} />
                    ) : (
                      <p className="text-sm text-slate-500">Aún no se inicia</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ───────── Ocupación de estaciones ───────── */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-semibold text-white">
          <Flag size={16} className="text-emerald-300" /> Bases de la Gymkana
        </h2>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          {calculos.bases.map((b) => (
            <FichaEstacion
              key={b.numero}
              etiqueta="Base"
              estacion={b}
              lugar={bases[b.numero]?.lugar?.trim()}
              equiposDeEstacion={equiposDeBase(b.numero)}
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-semibold text-white">
          <Amphora size={16} className="text-amber-300" /> Tinajas del Tesoro
        </h2>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          {calculos.tinajas.map((t) => (
            <FichaEstacion
              key={t.numero}
              etiqueta="Tinaja"
              estacion={t}
              equiposDeEstacion={equiposDeTinaja(t.numero)}
            />
          ))}
        </div>
        <p className="text-xs text-slate-500">
          Libre = nadie viene todavía · Viene un equipo = el sistema ya lo mandó · Compitiendo /
          Calificando = ya llegó · Cerrada = todos los equipos ya pasaron.
        </p>
      </section>

      {alertasPendientes > 0 && (
        <p className="flex items-center gap-2 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
          <AlertTriangle size={16} />
          Hay {alertasPendientes} {alertasPendientes === 1 ? 'alerta' : 'alertas'} de Gymkana por
          revisar (Animación → Gymkana → Alertas).
        </p>
      )}

      {/* ───────── Correcciones (pantallas que ya existían) ───────── */}
      <section className="space-y-3">
        <h2 className="font-semibold text-white">Avance y correcciones</h2>

        <details className="glass-card group p-4">
          <summary className="cursor-pointer select-none font-semibold text-slate-200">
            Gymkana: fixture y resultados (toca el lápiz para corregir)
          </summary>
          <div className="mt-4">
            <IniciarGymkanaPanel
              equipos={coloresGymkana}
              rutas={rutasGymkana}
              partidos={partidosGymkana}
              gymkanaIniciada={gymkanaIniciada}
              onCambio={onCambio}
            />
          </div>
        </details>

        <details className="glass-card group p-4">
          <summary className="cursor-pointer select-none font-semibold text-slate-200">
            Tesoro: avance por equipo y recalificación
          </summary>
          <div className="mt-4">
            <SupervisionTesoroAdmin />
          </div>
        </details>
      </section>
    </div>
  );
}
