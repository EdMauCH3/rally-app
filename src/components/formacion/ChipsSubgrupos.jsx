import { separarSubgrupos } from '../../services/formacionLogica';

/** Subgrupos del equipo como etiquetas; el punto de color lleva la identidad del equipo. */
export default function ChipsSubgrupos({ texto, color, className = '' }) {
  const lista = separarSubgrupos(texto);
  if (lista.length === 0) return null;
  return (
    <ul className={`flex flex-wrap gap-1.5 ${className}`} aria-label="Subgrupos del equipo">
      {lista.map((s) => (
        <li
          key={s}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-semibold text-slate-100"
        >
          <span
            aria-hidden="true"
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: color }}
          />
          {s}
        </li>
      ))}
    </ul>
  );
}
