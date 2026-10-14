import { agruparRondas } from '../../../services/torneoLogica';
import TarjetaPartido from './TarjetaPartido';

/**
 * Llave de eliminación directa: una columna por ronda (cuartos → semifinal → final).
 * En pantallas angostas las columnas se deslizan de lado. Solo dibuja las rondas que existen.
 */
export default function LlaveEliminatoria({ partidos, ctx, titulo = null }) {
  const rondas = agruparRondas(partidos);
  if (rondas.length === 0) return null;

  return (
    <section className="space-y-2" aria-label={titulo ?? 'Llave'}>
      {titulo && <h3 className="px-1 text-xs font-bold uppercase tracking-wide text-slate-400">{titulo}</h3>}
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2">
        {rondas.map((r) => (
          <div
            key={r.ronda}
            className={`snap-start space-y-2.5 ${rondas.length === 1 ? 'w-full' : 'w-[17.5rem] shrink-0 sm:w-[20rem]'}`}
          >
            <p className="px-1 text-center text-[11px] font-black uppercase tracking-wider text-amber-300">{r.nombre}</p>
            {r.partidos.map((p) => (
              <TarjetaPartido key={p.id} p={p} {...ctx} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
