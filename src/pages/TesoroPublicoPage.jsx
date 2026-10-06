import { useCallback, useEffect, useState } from 'react';
import { Loader2, Amphora, Compass, Clock, MapPin, Check } from 'lucide-react';
import IconoCopaVino from '../components/tesoro/IconoCopaVino';
import { listarSubEquiposColorPorActividad } from '../services/subEquiposColorService';
import { listarEstadoActividades, suscribirseEstadoActividades } from '../services/estadoActividadesService';
import {
  obtenerPuntuacionesTesoro,
  obtenerProgresoTesoroEquipo,
  obtenerPistaTesoroEquipo,
  suscribirseTesoroGlobal,
} from '../services/tesoroService';
import PausaActividadOverlay from '../components/common/PausaActividadOverlay';
import EquipoSelector from '../components/gymkana/EquipoSelector';
import LetreroActividadNoIniciada from '../components/common/LetreroActividadNoIniciada';

const LS_KEY = 'tesoro_equipo_seleccionado';

/**
 * Lo más importante para el equipo: cuántas lleva, a qué tinaja se dirige y la pista que
 * se desbloqueó para llegar. El color del equipo va en el borde y el círculo; el fondo es
 * oscuro y el texto blanco para que se lea igual con cualquier color.
 */
function TarjetaDestino({ destino, llenas, total, color }) {
  const progreso = total > 0 ? (llenas / total) * 100 : 0;
  const estado = destino?.estado;

  return (
    <div
      className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/90 p-5 shadow-2xl shadow-black/40"
      style={{ borderLeft: `10px solid ${color}` }}
    >
      <div className="space-y-1.5">
        <div className="flex items-end justify-between gap-3">
          <p className="text-sm font-bold text-slate-200">Tinajas completadas:</p>
          <p className="text-2xl font-black tabular-nums text-white">
            {llenas}/{total}
          </p>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progreso}%`, backgroundColor: color }}
          />
        </div>
      </div>

      {(estado === 'en_camino' || estado === 'en_tinaja') && (
        <div className="flex items-center gap-4">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: color, boxShadow: `0 0 26px 4px ${color}88` }}
          >
            <Amphora size={28} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-300">
              {estado === 'en_camino' ? 'Tu siguiente destino' : 'Ya llegaste'}
            </p>
            <p className="text-2xl font-black leading-tight text-white">
              {estado === 'en_camino'
                ? `Dirígete a la Tinaja ${destino.tinaja}`
                : `Estás en la Tinaja ${destino.tinaja}`}
            </p>
            {estado === 'en_tinaja' && (
              <p className="text-sm text-slate-300">El juez de la tinaja te está calificando.</p>
            )}
          </div>
        </div>
      )}

      {estado === 'en_camino' && (
        <div className="rounded-2xl bg-black/30 p-4">
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-amber-200">
            <MapPin size={13} /> Pista desbloqueada
          </p>
          <p className="whitespace-pre-wrap text-base leading-relaxed text-white">
            {destino.pista?.trim() || 'Esta tinaja aún no tiene pista escrita. Pregunta a tu animador.'}
          </p>
        </div>
      )}

      {estado === 'espera' && (
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-sky-500/15 text-sky-300">
            <Clock size={28} />
          </span>
          <div>
            <p className="text-xl font-black leading-tight text-white">
              Todas tus tinajas cercanas están ocupadas
            </p>
            <p className="text-sm text-slate-300">
              Permanece donde estás. En cuanto se libere una, aquí te aparecerá tu pista.
            </p>
          </div>
        </div>
      )}

      {estado === 'termino' && (
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
            <Check size={30} />
          </span>
          <p className="text-xl font-black leading-tight text-white">
            ¡Encontraron todas las tinajas!
          </p>
        </div>
      )}
    </div>
  );
}

export default function TesoroPublicoPage() {
  const [iniciada, setIniciada] = useState(null);
  const [equipos, setEquipos] = useState([]);
  const [equipoId, setEquipoId] = useState(() => localStorage.getItem(LS_KEY));
  const [registros, setRegistros] = useState([]);
  const [progreso, setProgreso] = useState(null);
  const [destino, setDestino] = useState(null); // { estado, tinaja, pista, completadas, total }
  const [cargandoEquipos, setCargandoEquipos] = useState(true);
  const [cargandoRegistros, setCargandoRegistros] = useState(false);

  useEffect(() => {
    function cargarEstadoGlobal() {
      listarEstadoActividades().then((lista) => {
        setIniciada(lista.find((e) => e.actividad === 'tesoro')?.iniciada ?? false);
      });
    }
    cargarEstadoGlobal();
    const unsubscribe = suscribirseEstadoActividades(cargarEstadoGlobal);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!iniciada) return;
    listarSubEquiposColorPorActividad('tesoro')
      .then(setEquipos)
      .finally(() => setCargandoEquipos(false));
  }, [iniciada]);

  // Las puntuaciones del equipo + su progreso (cuántas tinajas tiene en total, cuántas
  // encontró y cuál fue la última). Si progreso es null, la búsqueda aún no tiene recorridos.
  const cargarRegistros = useCallback((id) => {
    setCargandoRegistros(true);
    Promise.all([
      obtenerPuntuacionesTesoro(id),
      obtenerProgresoTesoroEquipo(id),
      // Si aún no se corrió el SQL de estaciones, la página sigue funcionando sin la pista.
      obtenerPistaTesoroEquipo(id).catch(() => null),
    ])
      .then(([r, p, d]) => {
        setRegistros(r);
        setProgreso(p);
        setDestino(d);
      })
      .finally(() => setCargandoRegistros(false));
  }, []);

  useEffect(() => {
    if (!equipoId || !iniciada) return;
    cargarRegistros(equipoId);
    // Se escucha TODO el Tesoro (no solo a este equipo): cuando otro equipo califica y libera
    // una tinaja, el destino de este equipo puede cambiar sin que su propia fila se toque.
    // El repaso cada 15 s cubre una conexión caída. Las recargas no vuelven a mostrar el spinner.
    const refrescar = () => {
      Promise.all([
        obtenerPuntuacionesTesoro(equipoId),
        obtenerProgresoTesoroEquipo(equipoId),
        obtenerPistaTesoroEquipo(equipoId).catch(() => null),
      ])
        .then(([r, p, d]) => {
          setRegistros(r);
          setProgreso(p);
          setDestino(d);
        })
        .catch(() => {});
    };
    const unsubscribe = suscribirseTesoroGlobal(refrescar);
    const intervalo = setInterval(refrescar, 15000);
    return () => {
      unsubscribe();
      clearInterval(intervalo);
    };
  }, [equipoId, iniciada, cargarRegistros]);

  function elegirEquipo(equipo) {
    localStorage.setItem(LS_KEY, equipo.id);
    setEquipoId(equipo.id);
  }

  function cambiarEquipo() {
    localStorage.removeItem(LS_KEY);
    setEquipoId(null);
  }

  if (iniciada === null) return null;

  if (!iniciada) {
    return (
      <main className="max-w-2xl mx-auto px-4">
        <LetreroActividadNoIniciada tema="tesoro" />
      </main>
    );
  }

  const equipoSeleccionado = equipos.find((e) => e.id === equipoId) ?? null;
  const tinajas = progreso?.tinajas ?? [];
  const total = progreso?.total ?? 0;
  const llenas = registros.filter((r) => r.puntos_evaluacion != null).length;
  const porLlenar = Math.max(0, total - llenas);
  const copasDeVino = registros.reduce((t, r) => t + (r.puntos_totales ?? 0), 0);

  function registroDeBase(baseId) {
    return registros.find((r) => r.base_id === baseId) ?? null;
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <PausaActividadOverlay actividad="tesoro" />
      <div className="text-center space-y-1">
        <h1 className="text-xl font-black text-white">Búsqueda del Tesoro</h1>
        <p className="text-xs text-rose-200/70 uppercase tracking-widest font-semibold">
          Encuentra las tinajas y llénalas de vino
        </p>
      </div>

      {cargandoEquipos ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-white" size={28} />
        </div>
      ) : !equipoSeleccionado ? (
        <EquipoSelector equipos={equipos} equipoSeleccionado={null} onSeleccionar={elegirEquipo} />
      ) : cargandoRegistros ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-white" size={28} />
        </div>
      ) : !progreso ? (
        <LetreroActividadNoIniciada tema="tesoro" />
      ) : (
        <div className="space-y-6 animate-fade-up">
          <TarjetaDestino
            destino={destino}
            llenas={llenas}
            total={total}
            color={equipoSeleccionado.color_hex}
          />

          <div className="grid grid-cols-3 gap-3">
            <div className="glass-card p-4 text-center">
              <Amphora className="mx-auto text-orange-300 mb-1" size={22} />
              <p className="text-2xl font-black text-white">
                {llenas}
                <span className="text-sm font-bold text-slate-400"> de {total}</span>
              </p>
              <p className="text-xs text-slate-400">Tinajas llenas</p>
            </div>
            <div className="glass-card p-4 text-center">
              <Compass className="mx-auto text-orange-300 mb-1" size={22} />
              <p className="text-2xl font-black text-white">{porLlenar}</p>
              <p className="text-xs text-slate-400">Por llenar</p>
            </div>
            <div className="glass-card p-4 text-center">
              <IconoCopaVino className="mx-auto text-rose-300 mb-1" size={22} />
              <p className="text-2xl font-black text-white">{copasDeVino}</p>
              <p className="text-xs text-slate-400">Copas de vino</p>
            </div>
          </div>

          {/* Una casilla por cada tinaja del equipo; se "llena" de vino al calificarla */}
          <div className="relative rounded-3xl border-2 border-orange-900/40 bg-gradient-to-br from-orange-950/50 via-brand-navy/50 to-rose-950/30 p-6 shadow-2xl shadow-black/40">
            <div className="grid grid-cols-5 gap-3">
              {tinajas.map((baseId) => {
                const registro = registroDeBase(baseId);
                const llena = registro?.puntos_evaluacion != null;
                const enProgreso = registro && !llena;
                return (
                  <div
                    key={baseId}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1 border-2 transition-all duration-300 ${
                      llena
                        ? 'bg-rose-600/20 border-rose-500/60'
                        : enProgreso
                          ? 'bg-orange-500/10 border-orange-600/40 animate-pulse'
                          : 'bg-white/[0.03] border-white/10'
                    }`}
                  >
                    <Amphora
                      size={20}
                      className={llena ? 'text-rose-400' : enProgreso ? 'text-orange-400/70' : 'text-white/20'}
                      fill={llena ? 'currentColor' : 'none'}
                      fillOpacity={llena ? 0.35 : 0}
                    />
                    <span className="text-[10px] font-bold text-white/70">{baseId}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-center text-sm text-slate-300">
            {progreso.base_id != null ? (
              <>
                Última tinaja encontrada:{' '}
                <span className="font-bold text-white">Tinaja {progreso.base_id}</span>
              </>
            ) : (
              'Todavía no ha encontrado ninguna tinaja'
            )}
          </p>

          <button
            onClick={cambiarEquipo}
            className="block mx-auto text-xs text-slate-500 underline underline-offset-2 hover:text-slate-300 transition-colors duration-300"
          >
            Cambiar equipo
          </button>
        </div>
      )}
    </main>
  );
}
