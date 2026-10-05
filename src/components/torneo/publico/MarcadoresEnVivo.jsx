import { Radio } from 'lucide-react';
import DetalleEquipoEventos from './DetalleEquipoEventos';

export default function MarcadoresEnVivo({ partidos, roster, eventos }) {
  const vivos = partidos.filter((p) => p.estado === 'en_vivo' || p.estado === 'pausado');
  const proximo = partidos
    .filter((p) => p.estado === 'pendiente')
    .sort((a, b) => a.partido_num - b.partido_num)[0];

  function equipoDe(id) {
    return roster.find((e) => e.id === id);
  }

  if (vivos.length === 0) {
    const a = proximo ? equipoDe(proximo.equipo_a_id) : null;
    const b = proximo ? equipoDe(proximo.equipo_b_id) : null;
    return (
      <div className="glass-card p-5 text-center space-y-1">
        <p className="font-semibold text-slate-200">No hay partidos en juego ahora</p>
        {a && b && (
          <p className="text-sm text-slate-400">
            Próximo: <span className="font-semibold text-white">{a.nombre}</span> vs{' '}
            <span className="font-semibold text-white">{b.nombre}</span>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {vivos.map((p) => {
        const a = equipoDe(p.equipo_a_id);
        const b = equipoDe(p.equipo_b_id);
        if (!a || !b) return null;
        const enVivo = p.estado === 'en_vivo';

        return (
          <div
            key={p.id}
            className="rounded-3xl border-2 border-red-500/40 bg-gradient-to-b from-red-500/[0.08] via-brand-navy/70 to-brand-navy/90 p-5 shadow-2xl shadow-black/50"
          >
            <div className="mb-3 flex items-center justify-between text-xs">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-extrabold tracking-wider ${
                  enVivo
                    ? 'bg-red-500/20 text-red-200 animate-pulse'
                    : 'bg-amber-500/20 text-amber-200'
                }`}
              >
                <Radio size={12} />
                {enVivo ? 'EN VIVO' : 'EN PAUSA'}
              </span>
              <span className="text-slate-400">Partido {p.partido_num}</span>
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <div className="min-w-0 text-center">
                <span
                  className="mb-1 inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: a.color_hex, boxShadow: `0 0 10px ${a.color_hex}` }}
                />
                <p className="break-words text-base sm:text-xl font-black uppercase leading-tight text-white">
                  {a.nombre}
                </p>
              </div>
              <p className="text-5xl sm:text-7xl font-black tabular-nums text-white">
                {p.goles_a}
                <span className="mx-1 text-slate-500">-</span>
                {p.goles_b}
              </p>
              <div className="min-w-0 text-center">
                <span
                  className="mb-1 inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: b.color_hex, boxShadow: `0 0 10px ${b.color_hex}` }}
                />
                <p className="break-words text-base sm:text-xl font-black uppercase leading-tight text-white">
                  {b.nombre}
                </p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 text-center">
              <DetalleEquipoEventos partido={p} equipoId={a.id} eventos={eventos} />
              <DetalleEquipoEventos partido={p} equipoId={b.id} eventos={eventos} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
