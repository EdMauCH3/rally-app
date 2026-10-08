import TablaFase from '../TablaFase';
import TarjetaPartido from './TarjetaPartido';
import InsigniaEquipo from './InsigniaEquipo';
import { agruparPorFecha, etiquetaCruce } from '../../../services/torneoLogica';

/** Cuadrangular Final: los 4 líderes de grupo, todos contra todos (fechas 7-9). */
export default function PanelCuadrangular({ ctx }) {
  const { partidos, tablas, equipos } = ctx;
  const lista = partidos.filter((p) => p.fase === 'cuadrangular');
  const filas = tablas.filter((t) => t.fase === 'cuadrangular');
  const jugando = filas.some((f) => f.pj > 0);
  const completo = filas.length > 0 && filas.every((f) => f.completo);
  const fechas = agruparPorFecha(lista);

  // Los 4 clasificados (líderes) tal como aparecen en los cruces; así se ven antes de jugar.
  const clasificados = ['A', 'B', 'C', 'D'].map((letra) => {
    const ref = `L:${letra}`;
    const p = lista.find((x) => x.ref_a === ref || x.ref_b === ref);
    const lado = p ? (p.ref_a === ref ? 'a' : 'b') : null;
    return {
      ref,
      etiqueta: etiquetaCruce(ref),
      equipo: lado && p[`equipo_${lado}_id`]
        ? {
            nombre: p[`${lado}_nombre`],
            color: p[`${lado}_color`],
            macro: p[`${lado}_macro_nombre`],
            macroColor: p[`${lado}_macro_color`],
          }
        : null,
    };
  });

  return (
    <div className="space-y-4">
      <div className="glass-card p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-300">Clasificados</h3>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {clasificados.map((c) => (
            <div key={c.ref} className="glass-row flex flex-col items-center gap-1.5 px-2 py-3 text-center">
              <InsigniaEquipo
                colorEquipo={c.equipo?.color}
                colorMacro={c.equipo?.macroColor}
                macroNombre={c.equipo?.macro}
                tamano={38}
              />
              <span className="text-sm font-bold leading-tight text-white">
                {c.equipo ? c.equipo.nombre : 'Por definir'}
              </span>
              <span className="text-[11px] text-slate-400">{c.equipo ? c.equipo.macro : c.etiqueta}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card px-3 py-3">
        <h3 className="mb-1 px-1 text-sm font-semibold text-slate-300">Tabla del cuadrangular</h3>
        {filas.length > 0 && jugando ? (
          <>
            <TablaFase filas={filas} equipos={equipos} resaltar={completo ? 2 : 0} />
            <p className="mt-2 px-1 text-[11px] text-slate-500">
              1.º y 2.º juegan la Gran Final · 3.º y 4.º, el Tercer Puesto.
            </p>
          </>
        ) : (
          <p className="px-1 py-4 text-sm text-slate-400">
            La tabla aparece cuando empiece el cuadrangular (fecha 7), cuando los cuatro líderes de grupo estén definidos.
          </p>
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
      {fechas.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-400">Los partidos aún no se han generado.</p>
      )}
    </div>
  );
}
