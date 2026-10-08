import { useState } from 'react';
import { Loader2, RotateCcw, Trophy } from 'lucide-react';

/** Puntos de la tanda: ✅ convertido, ❌ fallado, ⚪ por patear. */
function Tiros({ tiros, total }) {
  const cantidad = Math.max(total, tiros.length);
  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {Array.from({ length: cantidad }, (_, i) => {
        const t = tiros[i];
        const clase =
          t === undefined
            ? 'border-white/20 bg-white/5 text-slate-500'
            : t.convertido
              ? 'border-emerald-400/60 bg-emerald-500/25 text-emerald-200'
              : 'border-red-400/60 bg-red-500/25 text-red-200';
        return (
          <span
            key={i}
            title={t?.jugador_nombre ?? ''}
            className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-black sm:h-10 sm:w-10 ${clase} ${
              i >= total ? 'ring-2 ring-amber-400/50' : ''
            }`}
          >
            {t === undefined ? i + 1 : t.convertido ? '⚽' : '✕'}
          </span>
        );
      })}
    </div>
  );
}

/**
 * Tanda de penales (Tercer Puesto: 3 tiros · Final: 5 tiros · luego muerte súbita).
 * El servidor decide quién patea y cuándo termina la serie; aquí solo se
 * muestra el estado y se registra cada tiro (con el jugador, si se quiere).
 */
export default function PanelPenales({
  partido,
  equipoA,
  equipoB,
  penales,
  jugadores,
  eventos,
  ocupado,
  onRegistrar,
  onDeshacer,
}) {
  const [jugadorId, setJugadorId] = useState('');
  const serie = partido.pen_serie ?? (partido.fase === 'final' ? 5 : 3);
  const terminada = Boolean(partido.pen_terminada);
  const tirosA = penales.filter((t) => t.equipo_torneo_id === equipoA.id);
  const tirosB = penales.filter((t) => t.equipo_torneo_id === equipoB.id);
  const patea = partido.pen_proximo_id === equipoA.id ? equipoA : equipoB;
  const ganador = terminada ? (partido.pen_ganador_id === equipoA.id ? equipoA : equipoB) : null;

  const expulsados = new Set(
    eventos.filter((e) => e.tipo === 'roja' && e.jugador_id).map((e) => e.jugador_id)
  );
  const elegibles = jugadores.filter(
    (j) => j.equipo_torneo_id === patea.id && !expulsados.has(j.jugador_id)
  );
  const yaPatearon = new Set(penales.filter((t) => t.jugador_id).map((t) => t.jugador_id));

  function registrar(convertido) {
    onRegistrar({ jugadorId: jugadorId || null, convertido });
    setJugadorId('');
  }

  const enMuerteSubita = Math.max(tirosA.length, tirosB.length) >= serie && !terminada;

  return (
    <div className="space-y-4 rounded-3xl border border-amber-400/30 bg-black/25 p-4 sm:p-6">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-300">
          Tanda de penales
        </p>
        <p className="text-sm text-slate-300">
          {serie} tiros por equipo{enMuerteSubita ? ' · MUERTE SÚBITA' : ' y muerte súbita si sigue el empate'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          [equipoA, tirosA, partido.pen_a],
          [equipoB, tirosB, partido.pen_b],
        ].map(([eq, tiros, goles]) => (
          <div key={eq.id} className="space-y-2 text-center">
            <p className="flex items-center justify-center gap-2 text-sm font-bold uppercase text-white">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: eq.color_hex }} />
              <span className="break-words">{eq.nombre}</span>
            </p>
            <p className="text-4xl font-black tabular-nums text-white">{goles ?? 0}</p>
            <Tiros tiros={tiros} total={serie} />
          </div>
        ))}
      </div>

      {terminada ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/40 bg-emerald-500/15 p-3 text-center font-bold text-emerald-200">
          <Trophy size={20} />
          Gana {ganador.nombre} por penales ({partido.pen_a} - {partido.pen_b})
        </div>
      ) : (
        <div className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-3">
          <p className="flex items-center justify-center gap-2 text-center text-lg font-black text-white">
            Patea
            <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: patea.color_hex }} />
            {patea.nombre}
          </p>

          <select
            value={jugadorId}
            onChange={(e) => setJugadorId(e.target.value)}
            className="field"
            aria-label="Jugador que patea"
          >
            <option value="">Jugador (opcional)</option>
            {elegibles.map((j) => (
              <option key={j.jugador_id} value={j.jugador_id}>
                #{j.dorsal} {j.nombre}
                {yaPatearon.has(j.jugador_id) ? ' · ya pateó' : ''}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={ocupado}
              onClick={() => registrar(true)}
              className="rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 py-5 text-lg font-black text-white shadow-lg transition-all active:scale-95 disabled:opacity-40"
            >
              {ocupado ? <Loader2 className="mx-auto animate-spin" size={22} /> : '⚽ GOL'}
            </button>
            <button
              type="button"
              disabled={ocupado}
              onClick={() => registrar(false)}
              className="rounded-xl bg-gradient-to-br from-red-500 to-rose-700 py-5 text-lg font-black text-white shadow-lg transition-all active:scale-95 disabled:opacity-40"
            >
              {ocupado ? <Loader2 className="mx-auto animate-spin" size={22} /> : '✕ FALLÓ'}
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onDeshacer}
        disabled={ocupado || penales.length === 0}
        className="btn-secondary mx-auto !py-2.5 disabled:opacity-40"
      >
        <RotateCcw size={16} />
        Deshacer último tiro
      </button>
    </div>
  );
}
