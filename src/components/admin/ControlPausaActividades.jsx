import { useState } from 'react';
import { Flag, Loader2, Map, OctagonX, Play, Trophy } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useEstadoActividades } from '../../hooks/useEstadoActividades';
import {
  actualizarEstadoActividad,
  establecerPausaActividad,
} from '../../services/estadoActividadesService';
import { Switch } from './ControlInicioActividades';

const ACTIVIDADES = [
  { id: 'gymkana', label: 'Gymkana', icon: Flag, color: 'text-emerald-300' },
  { id: 'tesoro', label: 'Búsqueda del Tesoro', icon: Map, color: 'text-amber-300' },
  { id: 'torneo', label: 'Torneo', icon: Trophy, color: 'text-violet-300' },
];

/** Pausar / reanudar con confirmación. Compartido por el panel y por el banner. */
function usePausa() {
  const { showToast } = useToast();
  const [ocupadoId, setOcupadoId] = useState(null);

  async function cambiarPausa(actividad, nombre, pausar) {
    if (pausar) {
      const ok = window.confirm(
        `¿Pausar ${nombre}?\n\nTodas las pantallas de público y staff de esta actividad mostrarán el aviso de pausa y no se podrá registrar nada hasta que la reanudes.`
      );
      if (!ok) return;
    }
    setOcupadoId(actividad);
    try {
      await establecerPausaActividad(actividad, pausar);
      showToast(pausar ? `${nombre} pausada` : `${nombre} reanudada`, pausar ? 'warning' : 'success');
    } catch (err) {
      showToast(err.message ?? 'No se pudo cambiar la pausa', 'error');
    } finally {
      setOcupadoId(null);
    }
  }

  return { ocupadoId, cambiarPausa };
}

/**
 * Centro de control de las tres actividades de la tarde: encender/apagar y el
 * botón grande de emergencia. Pausar actualiza Supabase al instante y todas las
 * pantallas se bloquean con el aviso; Reanudar las libera sin recargar.
 */
export default function ControlPausaActividades() {
  const { showToast } = useToast();
  const { estados, cargando } = useEstadoActividades();
  const { ocupadoId, cambiarPausa } = usePausa();
  const [guardandoId, setGuardandoId] = useState(null);

  async function handleToggle(actividad, valor) {
    setGuardandoId(actividad);
    try {
      await actualizarEstadoActividad(actividad, valor);
    } catch (err) {
      showToast(err.message ?? 'No se pudo actualizar', 'error');
    } finally {
      setGuardandoId(null);
    }
  }

  if (cargando) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="animate-spin text-white" size={24} />
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-semibold text-white">Control de actividades</h2>
        <p className="text-sm text-slate-400">
          Enciende o apaga cada actividad y, si hay una emergencia, páusala: el servidor deja de
          aceptar registros y todas las pantallas muestran el aviso.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {ACTIVIDADES.map(({ id, label, icon: Icon, color }) => {
          const e = estados[id] ?? { iniciada: false, pausada: false };
          const pausada = e.iniciada && e.pausada;
          const ocupado = ocupadoId === id;

          return (
            <div
              key={id}
              className={`glass-card space-y-3 p-4 ${pausada ? 'ring-2 ring-red-400/70' : ''}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 font-bold text-white">
                  <Icon size={18} className={color} /> {label}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    pausada
                      ? 'animate-pulse bg-red-500/25 text-red-200'
                      : e.iniciada
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-white/10 text-slate-400'
                  }`}
                >
                  {pausada ? 'PAUSADA' : e.iniciada ? 'Activa' : 'Apagada'}
                </span>
              </div>

              <div className="glass-row flex items-center justify-between px-3 py-2">
                <span className="text-sm text-slate-300">{e.iniciada ? 'Encendida' : 'Apagada'}</span>
                <Switch
                  activo={e.iniciada}
                  disabled={guardandoId === id}
                  onChange={(v) => handleToggle(id, v)}
                />
              </div>

              {pausada ? (
                <button
                  type="button"
                  disabled={ocupado}
                  onClick={() => cambiarPausa(id, label, false)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-base font-black text-white shadow-lg shadow-black/40 transition-all duration-200 hover:bg-emerald-500 active:scale-95 disabled:opacity-60"
                >
                  {ocupado ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
                  Reanudar
                </button>
              ) : (
                <button
                  type="button"
                  disabled={ocupado || !e.iniciada}
                  onClick={() => cambiarPausa(id, label, true)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 py-3.5 text-base font-black text-white shadow-lg shadow-black/40 transition-all duration-200 hover:bg-red-500 active:scale-95 disabled:opacity-40"
                >
                  {ocupado ? <Loader2 className="animate-spin" size={18} /> : <OctagonX size={18} />}
                  Pausar Actividad
                </button>
              )}
              {!e.iniciada && (
                <p className="text-xs text-slate-500">Solo se puede pausar una actividad encendida.</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/**
 * Franja roja que se ve desde cualquier módulo de Animación mientras haya una
 * actividad pausada, con el botón de reanudar a mano. No se dibuja si no hay pausas.
 */
export function BannerPausasActivas() {
  const { estados } = useEstadoActividades();
  const { ocupadoId, cambiarPausa } = usePausa();

  const pausadas = ACTIVIDADES.filter((a) => estados[a.id]?.iniciada && estados[a.id]?.pausada);
  if (pausadas.length === 0) return null;

  return (
    <div role="alert" className="space-y-2 rounded-2xl border-2 border-red-400/70 bg-red-950/70 p-4">
      <p className="flex items-center gap-2 font-black text-red-100">
        <OctagonX size={20} /> Actividades pausadas: las pantallas están bloqueadas
      </p>
      <div className="flex flex-wrap gap-2">
        {pausadas.map((a) => (
          <button
            key={a.id}
            type="button"
            disabled={ocupadoId === a.id}
            onClick={() => cambiarPausa(a.id, a.label, false)}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-emerald-500 disabled:opacity-60"
          >
            {ocupadoId === a.id ? <Loader2 className="animate-spin" size={14} /> : <Play size={14} />}
            Reanudar {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
