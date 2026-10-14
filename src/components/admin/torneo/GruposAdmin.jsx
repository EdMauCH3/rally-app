import { useMemo, useState } from 'react';
import { Layers, Loader2, Shuffle, Users, Sparkles } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { equiposActivos, etiquetaGrupoDe, letrasGrupos, tamanosDeGrupos } from '../../../services/torneoLogica';
import { asignarGrupo, incorporarEquipo, repartirGrupos } from '../../../services/torneoService';

/**
 * Armado de grupos por el Director Técnico: reparto automático (sin juntar equipos del mismo
 * Macro-equipo), un grupo por Macro-equipo, o mover equipos a mano antes de confirmar la etapa 1.
 */
export default function GruposAdmin({ equipos, partidos, borradores, onCambio }) {
  const { showToast } = useToast();
  const activos = useMemo(() => equiposActivos(equipos), [equipos]);
  const retirados = equipos.filter((e) => e.estado === 'retirado');
  const etapa1Confirmada = partidos.some((p) => p.etapa === 1);
  const [numGrupos, setNumGrupos] = useState(() => String(Math.max(1, Math.min(4, Math.floor(activos.length / 3) || 1))));
  const [trabajando, setTrabajando] = useState(false);
  const [moviendo, setMoviendo] = useState(null);

  const n = Number(numGrupos);
  const tamanos = tamanosDeGrupos(activos.length, n);
  const letrasUsadas = [...new Set(activos.map((e) => e.grupo).filter(Boolean))].sort();
  const letras = [...new Set([...letrasUsadas, ...letrasGrupos(Math.max(n, letrasUsadas.length))])].sort();
  const sinGrupo = activos.filter((e) => !e.grupo);

  async function repartir(modo) {
    if (activos.length < 2) return showToast('Necesitas al menos 2 equipos activos', 'error');
    if (modo === 'auto' && (!Number.isInteger(n) || n < 1 || n > Math.min(12, activos.length))) {
      return showToast(`El número de grupos debe estar entre 1 y ${Math.min(12, activos.length)}`, 'error');
    }
    if (letrasUsadas.length > 0 && !window.confirm('Esto reemplaza los grupos actuales. ¿Continuar?')) return;
    setTrabajando(true);
    try {
      const r = await repartirGrupos(modo, modo === 'auto' ? n : null);
      showToast(`${r.equipos} equipos repartidos en ${r.grupos} grupos`, 'success');
      onCambio();
    } catch (err) {
      showToast(err.message ?? 'No se pudieron repartir los grupos', 'error');
    } finally {
      setTrabajando(false);
    }
  }

  async function incorporar(equipo, grupo) {
    if (!grupo) return showToast('Elige el grupo al que entra', 'error');
    if (!window.confirm(`${equipo.nombre} jugará contra todos los del Grupo ${grupo}. Sus partidos se agregan al final del calendario. ¿Continuar?`)) return;
    setMoviendo(equipo.id);
    try {
      const r = await incorporarEquipo(equipo.id, grupo);
      showToast(`${equipo.nombre} entró al Grupo ${r.grupo}: ${r.partidos} partido(s) nuevo(s) al final del calendario`, 'success');
      onCambio();
    } catch (err) {
      showToast(err.message ?? 'No se pudo incorporar el equipo', 'error');
    } finally {
      setMoviendo(null);
    }
  }

  async function mover(equipo, grupo) {
    setMoviendo(equipo.id);
    try {
      await asignarGrupo(equipo.id, grupo || null);
      onCambio();
    } catch (err) {
      showToast(err.message ?? 'No se pudo mover el equipo', 'error');
    } finally {
      setMoviendo(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="glass-card space-y-4 p-5">
        <div>
          <h2 className="flex items-center gap-2 font-bold text-white">
            <Layers size={18} /> Grupos de la fase 1
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Reparte los {activos.length} equipos activos en los grupos que quieras. Puedes dejar que el sistema lo haga y luego mover
            equipos a mano. Todo queda editable hasta que confirmes la Etapa 1.
          </p>
        </div>

        {etapa1Confirmada ? (
          <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
            La Etapa 1 ya está confirmada: los grupos quedaron fijos. Para rehacerlos, reinicia la Etapa 1 desde la pestaña Etapas.
            Si llega un equipo nuevo, créalo en Equipos y aquí abajo (en "Sin grupo") elige a qué grupo entra: se le generan sus partidos
            contra los demás del grupo.
          </p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-[auto_1fr] sm:items-end">
              <div>
                <label className="field-label">Número de grupos</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={numGrupos}
                  onChange={(e) => setNumGrupos(e.target.value)}
                  className="field max-w-[7rem]"
                />
              </div>
              <p className="text-xs text-slate-500">
                {tamanos.length > 0 && Number.isInteger(n) && n <= activos.length
                  ? `Quedarían grupos de ${[...new Set(tamanos)].sort((a, b) => b - a).join(' y ')} equipos (${tamanos.join(' · ')}).`
                  : 'Elige cuántos grupos quieres.'}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={() => repartir('auto')} disabled={trabajando} className="btn-primary disabled:opacity-50">
                {trabajando ? <Loader2 className="animate-spin" size={16} /> : <Shuffle size={16} />}
                Repartir automático
              </button>
              <button type="button" onClick={() => repartir('macro')} disabled={trabajando} className="btn-secondary disabled:opacity-50">
                <Sparkles size={16} /> Un grupo por Macro-equipo
              </button>
            </div>
            <p className="text-xs text-slate-500">
              El reparto automático evita juntar equipos del mismo Macro-equipo en un grupo cuando se puede, y vuelve a sortear cada vez
              que lo pulsas.
              {borradores.length > 0 && ' Cambiar los grupos descarta la vista previa que tengas generada.'}
            </p>
          </>
        )}
      </div>

      {sinGrupo.length > 0 && (
        <section className="glass-card space-y-2 border-amber-500/30 p-4">
          <p className="text-sm font-bold text-amber-300">Sin grupo ({sinGrupo.length})</p>
          {sinGrupo.map((e) =>
            etapa1Confirmada ? (
              <FilaIncorporar key={e.id} e={e} letras={letrasUsadas} cargando={moviendo === e.id} onIncorporar={incorporar} />
            ) : (
              <FilaEquipoGrupo key={e.id} e={e} letras={letras} bloqueado={false} cargando={moviendo === e.id} onMover={mover} />
            )
          )}
        </section>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {letrasUsadas.map((letra) => {
          const lista = activos.filter((e) => e.grupo === letra);
          const macros = new Set(lista.map((e) => e.macro_equipo_id)).size;
          return (
            <section key={letra} className="glass-card overflow-hidden">
              <header className="flex items-center gap-3 bg-white/[0.05] px-4 py-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm font-black text-slate-900">{letra}</span>
                <div className="min-w-0">
                  <p className="truncate font-bold text-white">{etiquetaGrupoDe(letra, lista)}</p>
                  <p className="text-xs text-slate-400">
                    {lista.length} equipos · {macros} {macros === 1 ? 'macro' : 'macros'}
                  </p>
                </div>
                <Users size={15} className="ml-auto text-slate-500" />
              </header>
              <div className="space-y-1.5 p-3">
                {lista.map((e) => (
                  <FilaEquipoGrupo key={e.id} e={e} letras={letras} bloqueado={etapa1Confirmada} cargando={moviendo === e.id} onMover={mover} />
                ))}
                {lista.length === 1 && (
                  <p className="px-1 text-[11px] text-amber-400">Un solo equipo: pasa directo a la siguiente etapa sin jugar.</p>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {retirados.length > 0 && (
        <p className="text-center text-xs text-slate-500">
          {retirados.length} {retirados.length === 1 ? 'equipo retirado' : 'equipos retirados'} no se reparte{retirados.length === 1 ? '' : 'n'}: {retirados.map((e) => e.nombre).join(', ')}.
        </p>
      )}
    </div>
  );
}

function FilaEquipoGrupo({ e, letras, bloqueado, cargando, onMover }) {
  return (
    <div className="glass-row flex items-center gap-2.5 px-3 py-2">
      <span className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ backgroundColor: e.color_hex }} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-white">{e.nombre}</span>
        <span className="flex items-center gap-1 text-[11px] text-slate-500">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: e.macro_color }} />
          {e.macro_nombre}
        </span>
      </span>
      {cargando ? (
        <Loader2 className="animate-spin text-slate-400" size={15} />
      ) : (
        <select
          aria-label={`Grupo de ${e.nombre}`}
          value={e.grupo ?? ''}
          disabled={bloqueado}
          onChange={(ev) => onMover(e, ev.target.value)}
          className="field !h-8 !w-[6.5rem] !px-2 !py-0 text-xs disabled:opacity-50"
        >
          <option value="">Sin grupo</option>
          {letras.map((l) => (
            <option key={l} value={l}>
              Grupo {l}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

/** Equipo que llega tarde: elige grupo y se generan sus partidos. */
function FilaIncorporar({ e, letras, cargando, onIncorporar }) {
  const [grupo, setGrupo] = useState('');
  return (
    <div className="glass-row flex flex-wrap items-center gap-2.5 px-3 py-2">
      <span className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ backgroundColor: e.color_hex }} />
      <span className="min-w-0 flex-1 basis-32">
        <span className="block truncate text-sm font-semibold text-white">{e.nombre}</span>
        <span className="flex items-center gap-1 text-[11px] text-slate-500">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: e.macro_color }} />
          {e.macro_nombre}
        </span>
      </span>
      <select
        aria-label={`Grupo al que entra ${e.nombre}`}
        value={grupo}
        onChange={(ev) => setGrupo(ev.target.value)}
        className="field !h-8 !w-[6.5rem] !px-2 !py-0 text-xs"
      >
        <option value="">Grupo…</option>
        {letras.map((l) => (
          <option key={l} value={l}>
            Grupo {l}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={cargando || !grupo}
        onClick={() => onIncorporar(e, grupo)}
        className="btn-primary !px-3 !py-1.5 text-xs disabled:opacity-40"
      >
        {cargando ? <Loader2 className="animate-spin" size={14} /> : 'Incorporar'}
      </button>
    </div>
  );
}
