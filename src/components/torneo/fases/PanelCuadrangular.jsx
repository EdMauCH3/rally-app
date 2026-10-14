import TablaFase from '../TablaFase';
import TarjetaPartido from './TarjetaPartido';
import { agruparPorFecha } from '../../../services/torneoLogica';

/** Cuadrangular / todos contra todos de la etapa 2: una sola tabla con los clasificados. */
export default function PanelCuadrangular({ ctx }) {
  const { partidos, tablas, equipos } = ctx;
  const lista = partidos.filter((p) => p.fase === 'cuadrangular');
  const filas = tablas.filter((t) => t.fase === 'cuadrangular');
  const completo = filas.length > 0 && filas.every((f) => f.completo);
  const fechas = agruparPorFecha(lista);
  const hayFinales = partidos.some((p) => p.etapa === 3 || (p.fase === 'final' && p.etapa !== 2));
  const nFilas = filas.length;
  const clasificanFinal = hayFinales || nFilas >= 2;

  return (
    <div className="space-y-4">
      <div className="glass-card px-3 py-3">
        <h3 className="mb-1 px-1 text-sm font-semibold text-slate-300">Tabla de la fase clasificatoria</h3>
        {filas.length > 0 ? (
          <>
            <TablaFase filas={filas} equipos={equipos} resaltar={completo ? Math.min(2, nFilas) : 0} />
            {clasificanFinal && (
              <p className="mt-2 px-1 text-[11px] text-slate-500">
                1.º y 2.º juegan la Gran Final{nFilas >= 4 ? ' · 3.º y 4.º, el Tercer Puesto' : ''}.
              </p>
            )}
          </>
        ) : (
          <p className="px-1 py-4 text-sm text-slate-400">La tabla aparece cuando empiece esta fase.</p>
        )}
      </div>

      {fechas.map(({ fecha, partidos: ps }) => (
        <section key={fecha} className="space-y-2.5">
          <h3 className="px-1 text-xs font-bold uppercase tracking-wide text-slate-400">Fecha {fecha}</h3>
          {ps.map((p) => (
            <TarjetaPartido key={p.id} p={p} {...ctx} />
          ))}
        </section>
      ))}
      {fechas.length === 0 && <p className="py-8 text-center text-sm text-slate-400">Los partidos aún no se han generado.</p>}
    </div>
  );
}
