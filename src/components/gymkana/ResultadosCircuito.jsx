import { equipoVisual, tituloBase } from '../../services/gymkanaLogica';
import PartidoGymkanaRow from '../admin/PartidoGymkanaRow';

/**
 * Todos los cruces del circuito agrupados por ronda, con el lápiz para corregir
 * cualquier resultado (Admin y Coordinación).
 */
export default function ResultadosCircuito({ cruces, equipos, bases, onCambio }) {
  if (cruces.length === 0) {
    return <p className="text-sm text-slate-400">Aún no hay cruces: se crean al rotar los equipos.</p>;
  }
  const rondas = [...new Set(cruces.map((c) => c.ronda))].sort((a, b) => a - b);
  return (
    <div className="space-y-4">
      {rondas.map((r) => (
        <div key={r} className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Ronda {r}</p>
          {cruces
            .filter((c) => c.ronda === r)
            .map((c) => (
              <PartidoGymkanaRow
                key={c.id}
                onCambio={onCambio}
                titulo={tituloBase(c.base_id, bases[c.base_id])}
                partido={{
                  ...c,
                  equipo_a: equipoVisual(equipos, c.equipo_a_id),
                  equipo_b: equipoVisual(equipos, c.equipo_b_id),
                }}
              />
            ))}
        </div>
      ))}
    </div>
  );
}
