import { useState } from 'react';
import { AlertTriangle, ChevronDown } from 'lucide-react';
import { EMOJI_TIPO } from './utilsTorneo';

const ESTADO = {
  en_vivo: { texto: 'EN VIVO', clase: 'bg-red-500/15 text-red-300 animate-pulse' },
  pausado: { texto: 'EN PAUSA', clase: 'bg-amber-500/15 text-amber-300' },
  finalizado: { texto: 'FINAL', clase: 'bg-white/10 text-slate-300' },
  pendiente: { texto: 'POR JUGAR', clase: 'bg-white/5 text-slate-400' },
};

function Resumen({ partido, equipoA, equipoB, eventos, jugadores, roster }) {
  const delPartido = eventos.filter((e) => e.partido_id === partido.id);

  // Bajas por sanción para ESTE partido (roja en el partido anterior de su equipo).
  const bajas = jugadores.filter((j) => j.sancionado && j.partido_sancion_id === partido.id);

  // Expulsados en este partido que aún no cumplen su suspensión.
  const expulsadosPendientes = delPartido
    .filter((e) => e.tipo === 'roja' && e.jugador_id)
    .map((e) => jugadores.find((j) => j.jugador_id === e.jugador_id))
    .filter((j) => j && j.sancionado);

  const nombreEquipo = (id) => roster.find((e) => e.id === id)?.nombre ?? '';
  const colorEquipo = (id) => roster.find((e) => e.id === id)?.color_hex;

  return (
    <div className="space-y-3">
      {bajas.length > 0 && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/[0.07] px-3 py-2.5 text-sm text-red-200">
          <p className="flex items-center gap-2 font-semibold">
            <AlertTriangle size={14} /> No pueden jugar este partido
          </p>
          <ul className="mt-1 space-y-0.5 text-xs">
            {bajas.map((j) => (
              <li key={j.jugador_id}>
                #{j.dorsal} {j.nombre} ·{' '}
                {nombreEquipo(j.equipo_torneo_id)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {delPartido.length === 0 ? (
        <p className="text-sm text-slate-500">
          {partido.estado === 'pendiente'
            ? 'Este partido aún no empieza.'
            : 'Todavía no hay goles ni tarjetas.'}
        </p>
      ) : (
        <ol className="space-y-1.5">
          {delPartido.map((ev) => (
            <li key={ev.id} className="flex items-start gap-2.5 text-sm text-slate-200">
              <span className="w-8 shrink-0 pt-0.5 text-right text-xs font-bold tabular-nums text-slate-400">
                {ev.minuto}'
              </span>
              <span className="shrink-0">{EMOJI_TIPO[ev.tipo]}</span>
              <span className="min-w-0">
                <span className="font-semibold text-white">
                  {ev.jugador_dorsal != null ? `#${ev.jugador_dorsal} ` : ''}
                  {ev.jugador_nombre ?? 'Jugador'}
                </span>
                {ev.autogol && <span className="text-amber-300"> (autogol)</span>}
                {ev.automatica && <span className="text-amber-300"> (doble amarilla)</span>}
                <span className="block text-xs text-slate-500">
                  <span
                    className="mr-1 inline-block h-2 w-2 rounded-full align-middle"
                    style={{ backgroundColor: colorEquipo(ev.equipo_torneo_id) }}
                  />
                  {nombreEquipo(ev.equipo_torneo_id)}
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}

      {expulsadosPendientes.length > 0 && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/[0.07] px-3 py-2.5 text-xs text-red-200">
          <p className="mb-1 flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle size={14} /> Inhabilitados para su próximo partido
          </p>
          {expulsadosPendientes.map((j) => (
            <p key={j.jugador_id}>
              #{j.dorsal} {j.nombre} ({nombreEquipo(j.equipo_torneo_id)}) · no juega el partido #
              {j.partido_sancion_num}
            </p>
          ))}
        </div>
      )}

      <p className="text-[11px] text-slate-600">
        {equipoA.nombre} vs {equipoB.nombre}
      </p>
    </div>
  );
}

export default function ListaPartidosPro({ partidos, roster, eventos, jugadores }) {
  const [abiertoId, setAbiertoId] = useState(null);

  if (partidos.length === 0) {
    return (
      <p className="glass-card p-4 text-center text-sm text-slate-400">
        Aún no se han generado los partidos.
      </p>
    );
  }

  function equipoDe(id) {
    return roster.find((e) => e.id === id);
  }

  return (
    <div className="space-y-2.5">
      {partidos.map((p) => {
        const a = equipoDe(p.equipo_a_id);
        const b = equipoDe(p.equipo_b_id);
        if (!a || !b) return null;
        const estado = ESTADO[p.estado] ?? ESTADO.pendiente;
        const abierto = abiertoId === p.id;
        const conMarcador = p.estado !== 'pendiente';

        return (
          <div key={p.id} className="glass-card overflow-hidden">
            <div className="space-y-2.5 px-4 py-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Partido {p.partido_num}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${estado.clase}`}>
                  {estado.texto}
                </span>
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
                <p className="truncate text-sm font-semibold text-white">
                  <span
                    className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full align-middle"
                    style={{ backgroundColor: a.color_hex }}
                  />
                  {a.nombre}
                </p>
                <p className="text-xl font-black tabular-nums text-white">
                  {conMarcador ? (
                    <>
                      {p.goles_a} <span className="text-slate-600">-</span> {p.goles_b}
                    </>
                  ) : (
                    <span className="text-sm font-bold text-slate-500">vs</span>
                  )}
                </p>
                <p className="truncate text-sm font-semibold text-white">
                  {b.nombre}
                  <span
                    className="ml-1.5 inline-block h-2.5 w-2.5 rounded-full align-middle"
                    style={{ backgroundColor: b.color_hex }}
                  />
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setAbiertoId(abierto ? null : p.id)}
              className="flex w-full items-center justify-center gap-1.5 border-t border-white/10 py-2.5 text-xs font-semibold text-slate-400 transition-colors duration-300 hover:bg-white/[0.04] hover:text-slate-200"
            >
              {abierto ? 'Ocultar resumen' : 'Ver resumen'}
              <ChevronDown
                size={14}
                className={`transition-transform duration-300 ${abierto ? 'rotate-180' : ''}`}
              />
            </button>

            {abierto && (
              <div className="border-t border-white/10 bg-black/20 px-4 py-4">
                <Resumen
                  partido={p}
                  equipoA={a}
                  equipoB={b}
                  eventos={eventos}
                  jugadores={jugadores}
                  roster={roster}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
