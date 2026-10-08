import { ABREV_DESEMPATE, TEXTO_DESEMPATE } from '../../services/torneoLogica';

/**
 * Tabla de posiciones de un grupo o del cuadrangular.
 * `filas` viene de v_torneo_tabla (ya desempatada). `equipos` permite pintar
 * nombre, color y macro de cada fila. `resaltar` = cuántos primeros puestos
 * clasifican (1 en grupos).
 */
export default function TablaFase({ filas, equipos, resaltar = 0, compacta = false }) {
  const porId = new Map(equipos.map((e) => [e.id, e]));

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm min-w-[22rem]">
        <thead>
          <tr className="text-[11px] uppercase tracking-wide text-slate-500">
            <th className="py-1.5 pl-1 pr-1 text-left font-medium w-6">#</th>
            <th className="py-1.5 pr-2 text-left font-medium">Equipo</th>
            <th className="py-1.5 px-1 text-center font-medium">PJ</th>
            {!compacta && (
              <>
                <th className="py-1.5 px-1 text-center font-medium">G</th>
                <th className="py-1.5 px-1 text-center font-medium">E</th>
                <th className="py-1.5 px-1 text-center font-medium">P</th>
                <th className="py-1.5 px-1 text-center font-medium">GF</th>
                <th className="py-1.5 px-1 text-center font-medium">GC</th>
              </>
            )}
            <th className="py-1.5 px-1 text-center font-medium">DG</th>
            <th className="py-1.5 pl-1 pr-1 text-center font-medium">Pts</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => {
            const eq = porId.get(f.equipo_torneo_id);
            const clasifica = f.pos <= resaltar;
            return (
              <tr
                key={f.equipo_torneo_id}
                className={`border-t border-white/5 ${clasifica ? 'bg-emerald-500/[0.07]' : ''}`}
              >
                <td className="py-2 pl-1 pr-1 font-bold text-slate-300">{f.pos}</td>
                <td className="py-2 pr-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: eq?.color_hex ?? '#64748b' }}
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-white">
                        {eq?.nombre ?? 'Equipo'}
                      </span>
                      <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <span className="truncate">{eq?.macro_nombre}</span>
                        {f.desempate && f.pos > 1 && (
                          <span
                            title={`Desempate: ${TEXTO_DESEMPATE[f.desempate]}`}
                            className="shrink-0 rounded bg-amber-500/15 px-1 font-semibold text-amber-300"
                          >
                            {ABREV_DESEMPATE[f.desempate]}
                          </span>
                        )}
                      </span>
                    </span>
                  </div>
                </td>
                <td className="px-1 text-center text-slate-300">{f.pj}</td>
                {!compacta && (
                  <>
                    <td className="px-1 text-center text-slate-300">{f.pg}</td>
                    <td className="px-1 text-center text-slate-300">{f.pe}</td>
                    <td className="px-1 text-center text-slate-300">{f.pp}</td>
                    <td className="px-1 text-center text-slate-300">{f.gf}</td>
                    <td className="px-1 text-center text-slate-300">{f.gc}</td>
                  </>
                )}
                <td className="px-1 text-center text-slate-300">{f.dg > 0 ? `+${f.dg}` : f.dg}</td>
                <td className="pl-1 pr-1 text-center font-bold text-white">{f.pts}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
