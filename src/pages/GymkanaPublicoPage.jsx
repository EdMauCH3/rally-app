import { useCallback, useEffect, useState } from 'react';
import { Loader2, MapPin, Lock } from 'lucide-react';
import { listarSubEquiposColorPorActividad } from '../services/subEquiposColorService';
import { listarEstadoActividades, suscribirseEstadoActividades } from '../services/estadoActividadesService';
import { obtenerEstadoGymkana, suscribirseGymkana } from '../services/gymkanaService';
import EquipoSelector from '../components/gymkana/EquipoSelector';
import LetreroActividadNoIniciada from '../components/common/LetreroActividadNoIniciada';

const LS_KEY = 'gymkana_equipo_seleccionado';

const ETIQUETAS_RESULTADO = {
  gano: { texto: 'Ganó', clase: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' },
  empato: { texto: 'Empató', clase: 'bg-amber-500/15 text-amber-300 border border-amber-500/30' },
  perdio: { texto: 'Perdió', clase: 'bg-white/10 text-slate-300 border border-white/10' },
};

function calcularPuntos(recorrido, equipoId) {
  return recorrido.reduce((total, partido) => {
    if (!partido || !partido.finalizado) return total;
    const miLado = partido.equipo_a_id === equipoId ? 'a' : 'b';
    const resultado = miLado === 'a' ? partido.resultado_a : partido.resultado_b;
    const bono = resultado === 'gano' ? 3 : resultado === 'empato' ? 1 : 0;
    return total + 1 + bono;
  }, 0);
}

export default function GymkanaPublicoPage() {
  const [iniciada, setIniciada] = useState(null); // null = aun no sabemos
  const [equipos, setEquipos] = useState([]);
  const [equipoId, setEquipoId] = useState(() => localStorage.getItem(LS_KEY));
  const [estado, setEstado] = useState(null);
  const [cargandoEquipos, setCargandoEquipos] = useState(true);
  const [cargandoEstado, setCargandoEstado] = useState(false);

  useEffect(() => {
    function cargarEstadoGlobal() {
      listarEstadoActividades().then((lista) => {
        setIniciada(lista.find((e) => e.actividad === 'gymkana')?.iniciada ?? false);
      });
    }
    cargarEstadoGlobal();
    const unsubscribe = suscribirseEstadoActividades(cargarEstadoGlobal);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!iniciada) return;
    listarSubEquiposColorPorActividad('gymkana')
      .then(setEquipos)
      .finally(() => setCargandoEquipos(false));
  }, [iniciada]);

  const cargarEstado = useCallback((id) => {
    setCargandoEstado(true);
    obtenerEstadoGymkana(id)
      .then(setEstado)
      .finally(() => setCargandoEstado(false));
  }, []);

  useEffect(() => {
    if (!equipoId || !iniciada) return;
    cargarEstado(equipoId);
    const unsubscribe = suscribirseGymkana(() => cargarEstado(equipoId));
    return unsubscribe;
  }, [equipoId, iniciada, cargarEstado]);

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
        <LetreroActividadNoIniciada nombreActividad="Gymkana" />
      </main>
    );
  }

  const equipoSeleccionado = equipos.find((e) => e.id === equipoId) ?? null;

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-xl font-black text-white text-center">Gymkana</h1>

      {cargandoEquipos ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-white" size={28} />
        </div>
      ) : !equipoSeleccionado ? (
        <EquipoSelector equipos={equipos} equipoSeleccionado={null} onSeleccionar={elegirEquipo} />
      ) : cargandoEstado || !estado ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-white" size={28} />
        </div>
      ) : (
        <div className="space-y-5 animate-fade-up">
          {estado.actual ? (
            <div className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-700 p-5 flex items-center gap-4 shadow-2xl shadow-black/40">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white">
                <MapPin size={28} />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
                  Dirígete a la
                </p>
                <p className="text-3xl font-black text-white leading-tight">
                  Base {estado.actual.base_id}
                </p>
                <p className="text-sm text-white/80">
                  contra <span className="font-bold">{estado.rival?.nombre}</span>
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] p-6 text-center">
              <p className="font-semibold text-emerald-300">¡Recorrido completo!</p>
            </div>
          )}

          <div className="glass-card p-5 text-center">
            <p className="text-sm text-slate-400">Puntos en Gymkana</p>
            <p className="text-4xl font-black text-white">
              {calcularPuntos(estado.recorrido, equipoSeleccionado.id)}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-400">Historial de bases</h3>
            {estado.recorrido.map((partido, i) => {
              if (!partido) return null;
              const esActual = i === estado.actualIndex;
              const miLado = partido.equipo_a_id === equipoSeleccionado.id ? 'a' : 'b';
              const miResultado = miLado === 'a' ? partido.resultado_a : partido.resultado_b;

              return (
                <div
                  key={partido.id}
                  className="glass-row px-4 py-3 flex items-center justify-between"
                >
                  <span className="text-sm font-medium text-slate-200">
                    Base {partido.base_id} {esActual && '(actual)'}
                  </span>
                  {partido.finalizado ? (
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ETIQUETAS_RESULTADO[miResultado]?.clase}`}
                    >
                      {ETIQUETAS_RESULTADO[miResultado]?.texto}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Lock size={12} /> Pendiente
                    </span>
                  )}
                </div>
              );
            })}
          </div>

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
