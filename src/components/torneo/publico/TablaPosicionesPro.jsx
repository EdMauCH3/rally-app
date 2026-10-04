import { Fragment, useState } from 'react';
import { AlertTriangle, ChevronDown, Trophy } from 'lucide-react';

const COLUMNAS = [
  { clave: 'pj', label: 'PJ', titulo: 'Partidos jugados' },
  { clave: 'pg', label: 'PG', titulo: 'Partidos ganados' },
  { clave: 'pe', label: 'PE', titulo: 'Partidos empatados' },
  { clave: 'pp', label: 'PP', titulo: 'Partidos perdidos' },
  { clave: 'gf', label: 'GF', titulo: 'Goles a favor' },
  { clave: 'gc', label: 'GC', titulo: 'Goles en contra' },
  { clave: 'amarillas', label: '🟨', titulo: 'Tarjetas amarillas' },
  { clave: 'rojas', label: '🟥', titulo: 'Tarjetas rojas' },
];

function Plantilla({ equipo, jugadores }) {
  const lista = jugadores.filter((j) => j.equipo_torneo_id === equipo.equipo_torneo_id);
  const goleador = [...lista].sort((a, b) => b.goles - a.goles)[0];
  const sancionados = lista.filter((j) => j.sancionado);

  return (
    // sticky + ancho fijo: la plantilla se queda a la vista aunque la tabla se deslice
    <div className="sticky left-0 w-[calc(100vw-4.5rem)] max-w-xl space-y-3">
      <p className="text-xs text-slate-400">
        {equipo.pj} jugados · {equipo.gf} goles a favor · {equipo.gc} en contra
        {goleador && goleador.goles > 0 && (
          <>
            {' '}
            · Goleador: <span className="font-semibold text-slate-200">{goleador.nombre}</span> (
            {goleador.goles})
          </>
        )}
      </p>

      {sancionados.length > 0 && (
        <p className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/[0.07] px-3 py-2 text-xs text-red-200">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          {sancionados.length === 1
            ? 'Jugará con uno menos en su próximo partido por una sanción.'
            : `Jugará con ${sancionados.length} menos en su próximo partido por sanciones.`}
        </p>
      )}

      {lista.length === 0 ? (
        <p className="text-sm text-slate-500">Este equipo aún no tiene jugadores inscritos.</p>
      ) : (
        <div className="space-y-1.5">
          {lista.map((j) => (
            <div
              key={j.jugador_id}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${
                j.sancionado ? 'border-red-500/30 bg-red-500/[0.06]' : 'border-white/10 bg-white/[0.03]'
              }`}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base font-black text-white drop-shadow"
                style={{ backgroundColor: equipo.color_hex }}
              >
                {j.dorsal}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{j.nombre}</p>
                {(j.goles > 0 || j.amarillas > 0 || j.rojas > 0) && (
                  <p className="flex gap-3 text-xs text-slate-400">
                    {j.goles > 0 && <span>⚽ {j.goles}</span>}
                    {j.amarillas > 0 && <span>🟨 {j.amarillas}</span>}
                    {j.rojas > 0 && <span>🟥 {j.rojas}</span>}
                  </p>
                )}
              </div>
              {j.sancionado ? (
                <span className="shrink-0 rounded-full bg-red-500/20 px-2.5 py-1 text-[11px] font-bold text-red-300">
                  Sancionado · P{j.partido_sancion_num}
                </span>
              ) : (
                <span className="shrink-0 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
                  Habilitado
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TablaPosicionesPro({ posiciones, jugadores }) {
  const [abiertoId, setAbiertoId] = useState(null);

  // Desempate: puntos, luego diferencia de gol, luego goles a favor.
  const ordenadas = [...posiciones].sort(
    (a, b) =>
      b.puntos_torneo - a.puntos_torneo ||
      b.dg - a.dg ||
      b.gf - a.gf ||
      a.nombre.localeCompare(b.nombre)
  );

  if (ordenadas.length === 0) {
    return <p className="glass-card p-4 text-center text-sm text-slate-400">Aún no hay equipos.</p>;
  }

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-brand-navy shadow-2xl shadow-black/40">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-slate-400">
              <th className="sticky left-0 z-10 bg-brand-navy px-3 py-3 text-left">Equipo</th>
              <th className="px-3 py-3 text-center text-white" title="Puntos">
                <Trophy size={14} className="mx-auto" />
              </th>
              {COLUMNAS.map((c) => (
                <th key={c.clave} className="px-2.5 py-3 text-center" title={c.titulo}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ordenadas.map((eq, i) => {
              const abierto = abiertoId === eq.equipo_torneo_id;
              return (
                <Fragment key={eq.equipo_torneo_id}>
                  <tr
                    onClick={() => setAbiertoId(abierto ? null : eq.equipo_torneo_id)}
                    className="cursor-pointer border-t border-white/5 transition-colors duration-300 hover:bg-white/[0.04]"
                  >
                    <td className="sticky left-0 z-10 bg-brand-navy px-3 py-3">
                      <div className="flex items-center gap-2 min-w-[8.5rem]">
                        <span className="w-4 shrink-0 text-xs text-slate-500">{i + 1}</span>
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: eq.color_hex }}
                        />
                        <span className="truncate font-bold text-white">{eq.nombre}</span>
                        <ChevronDown
                          size={14}
                          className={`shrink-0 text-slate-500 transition-transform duration-300 ${
                            abierto ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                      {eq.es_exclusivo && (
                        <span className="ml-6 mt-0.5 inline-block rounded-full bg-brand-brown/40 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-200">
                          Solo Torneo
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center text-lg font-black tabular-nums text-white">
                      {eq.puntos_torneo}
                    </td>
                    {COLUMNAS.map((c) => (
                      <td key={c.clave} className="px-2.5 py-3 text-center tabular-nums text-slate-300">
                        {eq[c.clave]}
                      </td>
                    ))}
                  </tr>
                  {abierto && (
                    <tr className="border-t border-white/5 bg-black/20">
                      <td colSpan={COLUMNAS.length + 2} className="px-3 py-3">
                        <Plantilla equipo={eq} jugadores={jugadores} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="px-1 text-[11px] leading-relaxed text-slate-500">
        PJ jugados · PG ganados · PE empatados · PP perdidos · GF goles a favor · GC goles en
        contra. Cada roja resta 1 punto. Toca un equipo para ver su plantilla.
      </p>
    </div>
  );
}
