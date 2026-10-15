import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Dices, Flag, Loader2, Minus, Plus, RotateCw, X } from 'lucide-react';
import { planificarRonda } from '../../services/gymkanaEmparejamiento';
import {
  TOTAL_BASES,
  basesDeEquipo,
  crucesDeRonda,
  equipoVisual,
  tituloBase,
} from '../../services/gymkanaLogica';
import { Switch } from '../admin/ControlInicioActividades';

const RAPIDOS = [10, 15, 20, 25, 30];

/**
 * Se abre SIEMPRE al pulsar "Rotar Equipos": pregunta cuántos minutos durará la
 * estación (20 sugeridos, editable) y muestra el cruce que propone el motor de
 * emparejamiento antes de autorizarlo. "Declarar Última Base" convierte esta en
 * la ronda final: no se generan más cruces.
 */
export default function ModalRotarGymkana({
  circuito,
  equipos,
  cruces,
  bases,
  procesando = false,
  onConfirmar,
  onCancelar,
}) {
  const sugerido = circuito.duracion_minutos || 20;
  const [texto, setTexto] = useState(String(sugerido));
  const [ultima, setUltima] = useState(false);
  const [forzar, setForzar] = useState(false);
  const [plan, setPlan] = useState(null); // null = calculando
  const campo = useRef(null);

  const minutos = Number.parseInt(texto, 10);
  const valido = Number.isInteger(minutos) && minutos >= 1 && minutos <= 180;

  const pendientes = useMemo(
    () =>
      circuito.estado === 'en_curso'
        ? crucesDeRonda(cruces, circuito.ronda_actual).filter((c) => !c.finalizado)
        : [],
    [circuito, cruces]
  );

  // Si se rota de todos modos, los cruces sin calificar se descartan: no cuentan como visitados.
  const historial = useMemo(
    () =>
      cruces
        .filter((c) => !(forzar && pendientes.some((p) => p.id === c.id)))
        .map((c) => ({ base: c.base_id, a: c.equipo_a_id, b: c.equipo_b_id })),
    [cruces, forzar, pendientes]
  );

  const calcular = useCallback(
    (semilla) => {
      setPlan(null);
      // Se cede el hilo un instante para que alcance a pintarse "Calculando…".
      setTimeout(() => {
        setPlan(
          planificarRonda({
            equipos: equipos.map((e) => ({ id: e.id, macro: e.macro_equipo_id })),
            historial,
            semilla,
          })
        );
      }, 30);
    },
    [equipos, historial]
  );

  useEffect(() => {
    calcular();
  }, [calcular]);

  useEffect(() => {
    campo.current?.select();
    const tecla = (e) => e.key === 'Escape' && !procesando && onCancelar();
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [onCancelar, procesando]);

  // ¿Con esta ronda todos completan las 6 bases? Entonces es la final aunque no se marque.
  const cierraElCircuito = useMemo(() => {
    if (!plan?.ok) return false;
    const juegan = new Set(plan.duelos.flatMap((d) => [d.a, d.b]));
    return equipos.every(
      (e) =>
        basesDeEquipo(
          historial.map((h) => ({ base_id: h.base, equipo_a_id: h.a, equipo_b_id: h.b })),
          e.id
        ).size +
          (juegan.has(e.id) ? 1 : 0) >=
        TOTAL_BASES
    );
  }, [plan, equipos, historial]);

  function ajustar(delta) {
    const base = Number.isInteger(minutos) ? minutos : sugerido;
    setTexto(String(Math.min(180, Math.max(1, base + delta))));
  }

  const bloqueadoPorPendientes = pendientes.length > 0 && !forzar;
  const puedeConfirmar = valido && plan?.ok && !procesando && !bloqueadoPorPendientes;
  const rondaNueva = (circuito.ronda_actual ?? 0) + 1;

  function enviar(e) {
    e.preventDefault();
    if (!puedeConfirmar) return;
    onConfirmar({
      duracion: minutos,
      ultima: ultima || cierraElCircuito,
      duelos: plan.duelos,
      forzar,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-rotar-gymkana"
      onClick={() => !procesando && onCancelar()}
    >
      <form
        onSubmit={enviar}
        onClick={(e) => e.stopPropagation()}
        className="glass-card max-h-[92vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-b-none p-5 sm:rounded-b-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Rotar a la ronda {rondaNueva}
            </p>
            <h2 id="titulo-rotar-gymkana" className="text-xl font-black leading-tight text-white">
              ¿Cuántos minutos durará esta estación?
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancelar}
            disabled={procesando}
            aria-label="Cancelar"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => ajustar(-1)}
            aria-label="Un minuto menos"
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/15"
          >
            <Minus size={20} />
          </button>
          <div className="text-center">
            <input
              ref={campo}
              value={texto}
              onChange={(e) => setTexto(e.target.value.replace(/\D/g, '').slice(0, 3))}
              inputMode="numeric"
              aria-label="Minutos de la estación"
              className="field !w-28 text-center font-mono !text-4xl font-black"
            />
            <p className="mt-1 text-xs text-slate-400">minutos</p>
          </div>
          <button
            type="button"
            onClick={() => ajustar(1)}
            aria-label="Un minuto más"
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/15"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Tiempos rápidos">
          {RAPIDOS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setTexto(String(m))}
              aria-pressed={minutos === m}
              className={`rounded-full px-3.5 py-1.5 text-sm font-bold transition ${
                minutos === m ? 'bg-white text-slate-900' : 'bg-white/10 text-slate-200 hover:bg-white/15'
              }`}
            >
              {m} min
            </button>
          ))}
        </div>
        {!valido && texto !== '' && <p className="text-sm text-red-300">Escribe un número entre 1 y 180.</p>}

        {/* Última base */}
        <div className="glass-row flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-bold text-white">
              <Flag size={16} className="text-amber-300" /> Declarar Última Base
            </p>
            <p className="text-xs text-slate-400">
              {ultima || cierraElCircuito
                ? 'Esta es la ronda final: no se generarán más cruces.'
                : 'Si la activas, después de esta ronda no habrá más rotaciones.'}
            </p>
          </div>
          <Switch activo={ultima || cierraElCircuito} disabled={cierraElCircuito} onChange={setUltima} />
        </div>
        {cierraElCircuito && !ultima && (
          <p className="text-xs text-amber-200">
            Con esta ronda todos los equipos completan las {TOTAL_BASES} bases, así que es la final
            automáticamente.
          </p>
        )}

        {/* Pendientes de la ronda actual */}
        {pendientes.length > 0 && (
          <div className="space-y-2 rounded-xl border border-amber-400/40 bg-amber-500/10 p-3 text-sm text-amber-100">
            <p className="flex items-start gap-2 font-semibold">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              Faltan {pendientes.length} {pendientes.length === 1 ? 'cruce' : 'cruces'} por calificar en la
              ronda actual.
            </p>
            <label className="flex cursor-pointer items-start gap-2 text-xs">
              <input
                type="checkbox"
                checked={forzar}
                onChange={(e) => setForzar(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-amber-400"
              />
              <span>
                Rotar de todos modos. Esos cruces se descartan (no suman puntos) y esos equipos podrán ir
                después a esas bases.
              </span>
            </label>
          </div>
        )}

        {/* Propuesta de cruces */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-200">Cruces propuestos</h3>
            <button
              type="button"
              onClick={() => calcular(Math.floor(Math.random() * 1e9))}
              disabled={plan === null || procesando}
              className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-white/15 disabled:opacity-50"
            >
              <Dices size={13} /> Volver a sortear
            </button>
          </div>

          {plan === null && (
            <p className="flex items-center justify-center gap-2 py-4 text-sm text-slate-300">
              <Loader2 className="animate-spin" size={16} /> Calculando el mejor cruce…
            </p>
          )}
          {plan && !plan.ok && (
            <p className="rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-100">
              {plan.mensaje}
            </p>
          )}
          {plan?.ok && (
            <ul className="space-y-1.5">
              {plan.duelos.map((d) => {
                const a = equipoVisual(equipos, d.a);
                const b = equipoVisual(equipos, d.b);
                return (
                  <li key={d.base} className="glass-row space-y-0.5 px-3 py-2">
                    <p className="text-xs font-bold text-emerald-300">{tituloBase(d.base, bases[d.base])}</p>
                    <p className="flex flex-wrap items-center gap-x-2 text-sm font-semibold text-white">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: a.color_hex }} />
                        {a.nombre}
                      </span>
                      <span className="text-xs font-normal text-slate-400">vs</span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: b.color_hex }} />
                        {b.nombre}
                      </span>
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
          {plan?.ok && plan.repetidos > 0 && (
            <p className="text-xs text-amber-200">
              Atención: {plan.repetidos === 1 ? 'un cruce repite' : `${plan.repetidos} cruces repiten`} rivales que ya
              se enfrentaron (no había otra combinación válida).
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={onCancelar} disabled={procesando} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={!puedeConfirmar} className="btn-primary">
            {procesando ? <Loader2 className="animate-spin" size={18} /> : <RotateCw size={18} />}
            Rotar ahora
          </button>
        </div>
      </form>
    </div>
  );
}
