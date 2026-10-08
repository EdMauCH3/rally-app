import { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import TablaFase from '../TablaFase';
import TarjetaPartido from './TarjetaPartido';
import { useEstadoPersistente } from '../../../hooks/useEstadoPersistente';

const LETRAS = ['A', 'B', 'C', 'D'];

/** Fase de Grupos: un grupo por macro-equipo; solo el 1.º avanza al cuadrangular. */
export default function PanelGrupos({ ctx }) {
  const { partidos, tablas, equipos, onEquipo } = ctx;
  const [filtro, setFiltro] = useEstadoPersistente(
    'rally_ui_torneo_grupo',
    'todos',
    (v) => v === 'todos' || LETRAS.includes(v)
  );

  const grupos = useMemo(
    () =>
      LETRAS.map((letra) => {
        const eqs = equipos.filter((e) => e.grupo === letra);
        return {
          letra,
          equipos: eqs,
          macro: eqs[0] ? { nombre: eqs[0].macro_nombre, color: eqs[0].macro_color } : null,
          filas: tablas.filter((t) => t.fase === 'grupos' && t.grupo === letra),
          partidos: partidos.filter((p) => p.fase === 'grupos' && p.grupo === letra),
        };
      }).filter((g) => g.equipos.length > 0),
    [equipos, tablas, partidos]
  );

  const visibles = filtro === 'todos' ? grupos : grupos.filter((g) => g.letra === filtro);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Grupo">
        {['todos', ...grupos.map((g) => g.letra)].map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={filtro === id}
            onClick={() => setFiltro(id)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
              filtro === id ? 'bg-white text-slate-900' : 'bg-white/10 text-slate-300 hover:bg-white/15'
            }`}
          >
            {id === 'todos' ? 'Todos' : `Grupo ${id}`}
          </button>
        ))}
      </div>

      {visibles.map((g) => {
        const completo = g.filas.length > 0 && g.filas.every((f) => f.completo);
        return (
          <section key={g.letra} className="space-y-3" aria-label={`Grupo ${g.letra}`}>
            <div className="glass-card overflow-hidden">
              <div
                className="flex items-center justify-between gap-3 px-4 py-2.5"
                style={{ background: `linear-gradient(90deg, ${g.macro?.color ?? '#334155'}55, transparent)` }}
              >
                <h3 className="flex items-center gap-2 font-black text-white">
                  <span
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-sm"
                    style={{ backgroundColor: g.macro?.color ?? '#334155' }}
                  >
                    {g.letra}
                  </span>
                  <span className="truncate">{g.macro?.nombre ?? `Grupo ${g.letra}`}</span>
                </h3>
                <span className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-emerald-300">
                  Avanza el 1.º <ArrowRight size={12} />
                </span>
              </div>
              <div className="px-3 pb-2">
                {g.filas.length > 0 ? (
                  <TablaFase filas={g.filas} equipos={equipos} resaltar={completo ? 1 : 0} />
                ) : (
                  <ul className="py-3 text-sm text-slate-300">
                    {g.equipos.map((e) => (
                      <li key={e.id} className="flex items-center gap-2 py-1">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: e.color_hex }} />
                        {e.nombre}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="space-y-2.5">
              {g.partidos.map((p) => (
                <TarjetaPartido key={p.id} p={p} {...ctx} />
              ))}
            </div>
          </section>
        );
      })}

      {visibles.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-400">Aún no hay grupos definidos.</p>
      )}
    </div>
  );
}
