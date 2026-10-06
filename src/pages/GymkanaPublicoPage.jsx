import { useCallback, useEffect, useState } from 'react';
import { Loader2, MapPin, Lock } from 'lucide-react';
import { listarSubEquiposColorPorActividad } from '../services/subEquiposColorService';
import { listarEstadoActividades, suscribirseEstadoActividades } from '../services/estadoActividadesService';
import { obtenerEstadoGymkana, suscribirseGymkana } from '../services/gymkanaService';
import EquipoSelector from '../components/gymkana/EquipoSelector';
import LetreroActividadNoIniciada from '../components/common/LetreroActividadNoIniciada';
import PausaActividadOverlay from '../components/common/PausaActividadOverlay';
import { useBasesGymkana } from '../hooks/useBasesGymkana';

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

/**
 * Lectura rápida: "Siguiente: Base 3 - Fuente Principal" y, debajo, la descripción que
 * configuró el Admin. El color del equipo va en el borde grueso y en el círculo con la
 * insignia de la base; el fondo es oscuro y el texto blanco, así el contraste no depende
 * del color del equipo.
 */
function TarjetaSiguienteBase({ partido, info, rival, color }) {
  const lugar = info?.lugar?.trim();
  const descripcion = info?.descripcion?.trim();
  const estaAhi = !!partido.llegada_en;

  return (
    <div
      className="space-y-3 rounded-3xl border border-white/10 bg-slate-900/90 p-5 shadow-2xl shadow-black/40"
      style={{ borderLeft: `10px solid ${color}` }}
    >
      <div className="flex items-center gap-4">
        <span
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-slate-900 text-2xl font-black text-white"
          style={{ backgroundColor: color, boxShadow: `0 0 26px 4px ${color}88` }}
          aria-hidden="true"
        >
          {partido.base_id}
        </span>
        <div className="min-w-0">
          <p className="text-2xl font-black leading-tight text-white break-words">
            {estaAhi ? 'Estás en' : 'Siguiente'}: Base {partido.base_id}
            {lugar ? ` - ${lugar}` : ''}
          </p>
          {rival && (
            <p className="mt-1 text-sm text-slate-300">
              Compites contra <span className="font-bold text-white">{rival.nombre}</span>
            </p>
          )}
        </div>
      </div>

      {descripcion && (
        <p className="rounded-2xl bg-black/30 px-4 py-3 text-base leading-relaxed text-slate-100">
          Descripción: {descripcion}
        </p>
      )}
    </div>
  );
}

export default function GymkanaPublicoPage() {
  const bases = useBasesGymkana();
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
        <LetreroActividadNoIniciada tema="gymkana" />
      </main>
    );
  }

  const equipoSeleccionado = equipos.find((e) => e.id === equipoId) ?? null;

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <PausaActividadOverlay actividad="gymkana" />
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
            <TarjetaSiguienteBase
              partido={estado.actual}
              info={bases[estado.actual.base_id]}
              rival={estado.rival}
              color={equipoSeleccionado.color_hex}
            />
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
                    Base {partido.base_id}
                    {bases[partido.base_id]?.lugar ? ` · ${bases[partido.base_id].lugar}` : ''}{' '}
                    {esActual && '(actual)'}
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
