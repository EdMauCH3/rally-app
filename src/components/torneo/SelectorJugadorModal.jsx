import { useState } from 'react';
import { X } from 'lucide-react';

const TITULOS = {
  gol: '¿Quién anotó?',
  amarilla: '¿Quién vio la amarilla?',
  roja: '¿Quién fue expulsado?',
};

const EMOJIS = { gol: '⚽', amarilla: '🟨', roja: '🟥' };

export default function SelectorJugadorModal({
  tipo,
  equipo,
  jugadores,
  eventos,
  partidoId,
  onElegir,
  onCerrar,
}) {
  const [autogol, setAutogol] = useState(false);

  const expulsados = new Set(
    eventos.filter((e) => e.tipo === 'roja' && e.jugador_id).map((e) => e.jugador_id)
  );

  const lista = jugadores.filter((j) => j.equipo_torneo_id === equipo.id);

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-3"
      onClick={onCerrar}
    >
      <div
        className="w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-3xl border border-white/15 bg-brand-navy p-5 space-y-4 shadow-2xl shadow-black/70 animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-2xl font-black text-white">
              <span className="mr-2">{EMOJIS[tipo]}</span>
              {TITULOS[tipo]}
            </p>
            <p className="mt-1 flex items-center gap-2 text-sm text-slate-300">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: equipo.color_hex }}
              />
              {equipo.nombre}
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all duration-300"
            aria-label="Cancelar"
          >
            <X size={22} />
          </button>
        </div>

        {tipo === 'amarilla' && (
          <p className="rounded-xl border border-amber-400/30 bg-amber-400/[0.07] px-4 py-2.5 text-sm text-amber-200">
            Recuerda: la segunda amarilla en el mismo partido es expulsión automática.
          </p>
        )}

        {tipo === 'gol' && (
          <button
            type="button"
            onClick={() => setAutogol((a) => !a)}
            className={`w-full rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${
              autogol
                ? 'border-amber-400 bg-amber-400/15 text-amber-200'
                : 'border-white/10 text-slate-400 hover:border-white/20'
            }`}
          >
            {autogol ? '✔ Es un autogol: el gol suma al rival' : 'Marcar como autogol'}
          </button>
        )}

        {lista.length === 0 ? (
          <p className="rounded-2xl border border-amber-400/30 bg-amber-400/[0.07] p-4 text-sm text-amber-200">
            Este equipo no tiene jugadores inscritos. Inscríbelos en la vista “Jugadores”.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {lista.map((j) => {
              const sancionado = j.sancionado && j.partido_sancion_id === partidoId;
              const expulsado = expulsados.has(j.jugador_id);
              const bloqueado = sancionado || expulsado;
              const amarillasAqui =
                tipo === 'amarilla'
                  ? eventos.filter((e) => e.tipo === 'amarilla' && e.jugador_id === j.jugador_id)
                      .length
                  : 0;
              return (
                <button
                  key={j.jugador_id}
                  type="button"
                  disabled={bloqueado}
                  onClick={() => onElegir(j, autogol)}
                  className={`rounded-2xl border-2 px-3 py-3 text-left transition-all duration-200 ${
                    bloqueado
                      ? 'cursor-not-allowed border-white/5 bg-white/[0.02] opacity-45'
                      : 'border-white/15 bg-white/[0.05] hover:bg-white/[0.12] active:scale-95'
                  }`}
                  style={bloqueado ? undefined : { borderColor: `${equipo.color_hex}99` }}
                >
                  <span className="block text-3xl font-black leading-none text-white tabular-nums">
                    {j.dorsal}
                  </span>
                  <span className="mt-1 block text-sm font-semibold text-slate-100 truncate">
                    {j.nombre}
                  </span>
                  {!bloqueado && amarillasAqui > 0 && (
                    <span className="mt-1 block text-[11px] font-bold text-amber-300">
                      🟨 {amarillasAqui} · la próxima es roja
                    </span>
                  )}
                  {sancionado && (
                    <span className="mt-1 block text-[11px] font-bold uppercase text-red-300">
                      Sancionado
                    </span>
                  )}
                  {expulsado && (
                    <span className="mt-1 block text-[11px] font-bold uppercase text-red-300">
                      Expulsado
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
