import { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import TablaFase from '../TablaFase';
import TarjetaPartido from './TarjetaPartido';
import LlaveEliminatoria from './LlaveEliminatoria';
import { useEstadoPersistente } from '../../../hooks/useEstadoPersistente';
import { CONFIG_DEFECTO, etiquetaGrupoDe, infoGrupos } from '../../../services/torneoLogica';

/**
 * Etapa 1: se dibujan SOLO los grupos que existen. Cada grupo muestra su tabla (todos contra todos)
 * o su llave (eliminación directa), según el formato que eligió el Director Técnico.
 */
export default function PanelGrupos({ ctx }) {
  const { partidos, tablas, equipos, etapas, onEquipo } = ctx;
  const info = useMemo(() => infoGrupos(equipos), [equipos]);
  const letras = useMemo(() => {
    const s = new Set([...info.keys(), ...partidos.filter((p) => p.etapa === 1 && p.grupo).map((p) => p.grupo)]);
    return [...s].sort();
  }, [info, partidos]);

  const [filtro, setFiltro] = useEstadoPersistente('rally_ui_torneo_grupo', 'todos', (v) => v === 'todos' || /^[A-L]$/.test(v));
  const cfg = { ...CONFIG_DEFECTO[1], ...(etapas?.find((e) => e.etapa === 1)?.config ?? {}) };

  const grupos = letras.map((letra) => {
    const eqs = equipos.filter((e) => e.grupo === letra);
    const delGrupo = partidos.filter((p) => p.etapa === 1 && p.grupo === letra);
    const esLlave = delGrupo.some((p) => p.fase === 'eliminatoria');
    const k = Number(cfg.grupos?.[letra]?.clasifican ?? cfg.clasifican ?? 1);
    return {
      letra,
      equipos: eqs,
      etiqueta: etiquetaGrupoDe(letra, eqs),
      color: info.get(letra)?.color ?? null,
      filas: tablas.filter((t) => t.fase === 'grupos' && t.grupo === letra),
      partidos: delGrupo,
      esLlave,
      k,
    };
  });
  const visibles = filtro === 'todos' ? grupos : grupos.filter((g) => g.letra === filtro);

  return (
    <div className="space-y-4">
      {grupos.length > 1 && (
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
              {id === 'todos' ? 'Todos' : grupos.find((g) => g.letra === id)?.etiqueta}
            </button>
          ))}
        </div>
      )}

      {visibles.map((g) => {
        const completo = g.filas.length > 0 && g.filas.every((f) => f.completo);
        return (
          <section key={g.letra} className="space-y-3" aria-label={g.etiqueta}>
            <div className="glass-card overflow-hidden">
              <div
                className="flex items-center justify-between gap-3 px-4 py-2.5"
                style={{ background: `linear-gradient(90deg, ${g.color ?? '#334155'}55, transparent)` }}
              >
                <h3 className="flex min-w-0 items-center gap-2 font-black text-white">
                  <span
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm"
                    style={{ backgroundColor: g.color ?? '#334155' }}
                  >
                    {g.letra}
                  </span>
                  <span className="truncate">{g.etiqueta}</span>
                </h3>
                {g.equipos.length > 1 && (
                  <span className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-emerald-300">
                    {g.esLlave ? 'Avanza el ganador' : g.k > 1 ? `Avanzan los ${g.k} primeros` : 'Avanza el 1.º'} <ArrowRight size={12} />
                  </span>
                )}
              </div>
              {!g.esLlave && (
                <div className="px-3 pb-2">
                  {g.filas.length > 0 ? (
                    <TablaFase filas={g.filas} equipos={equipos} resaltar={completo ? g.k : 0} />
                  ) : (
                    <ul className="py-3 text-sm text-slate-300">
                      {g.equipos.map((e) => (
                        <li key={e.id} className="flex items-center gap-2 py-1">
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: e.color_hex }} />
                          <button type="button" onClick={() => onEquipo?.(e.id)} className="hover:text-amber-200">
                            {e.nombre}
                          </button>
                          <span className="text-[11px] text-slate-500">{e.macro_nombre}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {g.esLlave && g.equipos.length > 0 && (
                <ul className="flex flex-wrap gap-x-4 gap-y-1 px-4 pb-3 text-xs text-slate-400">
                  {g.equipos.map((e) => (
                    <li key={e.id} className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: e.color_hex }} />
                      {e.nombre}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {g.esLlave ? (
              <LlaveEliminatoria partidos={g.partidos} ctx={ctx} />
            ) : (
              <div className="space-y-2.5">
                {g.partidos.map((p) => (
                  <TarjetaPartido key={p.id} p={p} {...ctx} />
                ))}
              </div>
            )}
          </section>
        );
      })}

      {visibles.length === 0 && <p className="py-8 text-center text-sm text-slate-400">Aún no hay grupos definidos.</p>}
    </div>
  );
}
