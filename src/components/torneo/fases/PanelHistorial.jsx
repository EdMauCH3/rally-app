import { useMemo, useState } from 'react';
import { History, Sparkles } from 'lucide-react';
import TarjetaPartido from './TarjetaPartido';

const FILTROS = [
  ['todos', 'Todos'],
  ['campeonato', 'Campeonato'],
  ['adicional', 'Adicionales'],
];

/** Más reciente primero: por hora real de finalización y, si falta, por fecha y número de partido. */
function masReciente(a, b) {
  const ta = a.finalizado_en ? Date.parse(a.finalizado_en) : 0;
  const tb = b.finalizado_en ? Date.parse(b.finalizado_en) : 0;
  if (ta !== tb) return tb - ta;
  return (b.fecha_num ?? 999) - (a.fecha_num ?? 999) || b.partido_num - a.partido_num;
}

/** Puntos que cada Macro-equipo ganó (o perdió por rojas) en los partidos adicionales. */
function aporteAdicionales(adicionales, eventos, equipos) {
  const mapa = new Map();
  const suma = (id, nombre, color, pts) => {
    if (!id) return;
    const f = mapa.get(id) ?? { id, nombre, color, pts: 0 };
    f.pts += pts;
    mapa.set(id, f);
  };
  const fin = adicionales.filter((p) => p.finalizado);
  for (const p of fin) {
    suma(p.a_macro_id, p.a_macro_nombre, p.a_macro_color, p.puntos_a ?? 0);
    suma(p.b_macro_id, p.b_macro_nombre, p.b_macro_color, p.puntos_b ?? 0);
  }
  const ids = new Set(fin.map((p) => p.id));
  for (const ev of eventos ?? []) {
    if (ev.tipo !== 'roja' || !ids.has(ev.partido_id)) continue;
    const eq = equipos.find((e) => e.id === ev.equipo_torneo_id);
    if (eq) suma(eq.macro_equipo_id, eq.macro_nombre, eq.macro_color, -1);
  }
  return [...mapa.values()].sort((x, y) => y.pts - x.pts);
}

/**
 * Historial público: todos los partidos ya jugados (campeonato y adicionales), el más reciente
 * primero, más los adicionales que aún están por jugarse.
 */
export default function PanelHistorial({ ctx }) {
  const { partidos, eventos, equipos } = ctx;
  const [filtro, setFiltro] = useState('todos');

  const adicionales = useMemo(() => partidos.filter((p) => p.fase === 'adicional'), [partidos]);
  const porJugar = adicionales
    .filter((p) => !p.finalizado)
    .sort((a, b) => (a.hora_programada ?? '9').localeCompare(b.hora_programada ?? '9') || a.partido_num - b.partido_num);
  const jugados = useMemo(() => {
    const lista = partidos.filter((p) => p.finalizado);
    const f = filtro === 'adicional' ? lista.filter((p) => p.fase === 'adicional') : filtro === 'campeonato' ? lista.filter((p) => p.fase !== 'adicional') : lista;
    return [...f].sort(masReciente);
  }, [partidos, filtro]);
  const aporte = useMemo(() => aporteAdicionales(adicionales, eventos, equipos), [adicionales, eventos, equipos]);
  const mostrarPorJugar = filtro !== 'campeonato' && porJugar.length > 0;

  return (
    <div className="space-y-4">
      {adicionales.length > 0 && (
        <nav className="flex gap-1 rounded-2xl bg-white/5 p-1" role="tablist" aria-label="Filtrar historial">
          {FILTROS.map(([id, texto]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={filtro === id}
              onClick={() => setFiltro(id)}
              className={`flex-1 rounded-xl px-2 py-1.5 text-xs font-bold transition ${
                filtro === id ? 'bg-white text-slate-900 shadow' : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              {texto}
            </button>
          ))}
        </nav>
      )}

      {aporte.length > 0 && filtro !== 'campeonato' && (
        <div className="glass-card space-y-2 border-violet-400/20 p-3">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-violet-200">
            <Sparkles size={13} /> Puntos de los partidos adicionales
          </p>
          <div className="flex flex-wrap gap-2">
            {aporte.map((m) => (
              <span
                key={m.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-white"
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: m.color }} />
                {m.nombre} <span className="tabular-nums text-violet-200">{m.pts > 0 ? `+${m.pts}` : m.pts}</span>
              </span>
            ))}
          </div>
          <p className="text-[11px] text-slate-400">Suman al Macro-equipo; no cuentan para el campeonato.</p>
        </div>
      )}

      {mostrarPorJugar && (
        <section className="space-y-2.5" aria-label="Adicionales por jugar">
          <h3 className="flex items-center gap-1.5 px-1 text-xs font-bold uppercase tracking-wide text-violet-200">
            <Sparkles size={13} /> Adicionales por jugar
          </h3>
          {porJugar.map((p) => (
            <TarjetaPartido key={p.id} p={p} {...ctx} />
          ))}
        </section>
      )}

      <section className="space-y-2.5" aria-label="Partidos jugados">
        <h3 className="flex items-center gap-1.5 px-1 text-xs font-bold uppercase tracking-wide text-slate-400">
          <History size={13} /> Partidos jugados ({jugados.length}) · el más reciente primero
        </h3>
        {jugados.length === 0 ? (
          <p className="glass-card p-5 text-center text-sm text-slate-400">Todavía no hay partidos jugados.</p>
        ) : (
          jugados.map((p) => <TarjetaPartido key={p.id} p={p} {...ctx} resaltarFase />)
        )}
      </section>
    </div>
  );
}
