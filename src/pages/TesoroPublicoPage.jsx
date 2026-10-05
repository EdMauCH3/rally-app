import { useCallback, useEffect, useState } from 'react';
import { Loader2, Amphora, Compass } from 'lucide-react';
import IconoCopaVino from '../components/tesoro/IconoCopaVino';
import { listarSubEquiposColorPorActividad } from '../services/subEquiposColorService';
import { listarEstadoActividades, suscribirseEstadoActividades } from '../services/estadoActividadesService';
import {
  obtenerPuntuacionesTesoro,
  obtenerProgresoTesoroEquipo,
  suscribirseTesoro,
} from '../services/tesoroService';
import EquipoSelector from '../components/gymkana/EquipoSelector';
import LetreroActividadNoIniciada from '../components/common/LetreroActividadNoIniciada';

const LS_KEY = 'tesoro_equipo_seleccionado';

export default function TesoroPublicoPage() {
  const [iniciada, setIniciada] = useState(null);
  const [equipos, setEquipos] = useState([]);
  const [equipoId, setEquipoId] = useState(() => localStorage.getItem(LS_KEY));
  const [registros, setRegistros] = useState([]);
  const [progreso, setProgreso] = useState(null);
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
    Promise.all([obtenerPuntuacionesTesoro(id), obtenerProgresoTesoroEquipo(id)])
      .then(([r, p]) => {
        setRegistros(r);
        setProgreso(p);
      })
      .finally(() => setCargandoRegistros(false));
  }, []);

  useEffect(() => {
    if (!equipoId || !iniciada) return;
    cargarRegistros(equipoId);
    const unsubscribe = suscribirseTesoro(equipoId, () => cargarRegistros(equipoId));
    return unsubscribe;
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
