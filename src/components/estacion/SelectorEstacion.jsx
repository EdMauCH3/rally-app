/**
 * Elegir en qué estación está parado el juez: Base 1..6 o Tinaja 1..10.
 * `detalle(n)` agrega una segunda línea (por ejemplo el lugar de la base).
 */
export default function SelectorEstacion({ etiqueta, numeros, seleccionada, onSeleccionar, detalle }) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-semibold text-slate-200">¿En qué {etiqueta.toLowerCase()} estás?</h2>
        <p className="text-sm text-slate-400">
          Elige tu estación. Te quedas en ese punto y los equipos vienen a ti.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {numeros.map((n) => {
          const activa = n === seleccionada;
          const extra = detalle?.(n);
          return (
            <button
              key={n}
              type="button"
              onClick={() => onSeleccionar(n)}
              aria-pressed={activa}
              className={`rounded-2xl border-2 px-3 py-3.5 text-left transition-all duration-300 ease-in-out ${
                activa
                  ? 'border-brand-brown bg-brand-brown/20 text-white shadow-lg'
                  : 'border-white/10 bg-white/[0.03] text-slate-200 hover:border-white/25'
              }`}
            >
              <span className="block text-lg font-black leading-tight">
                {etiqueta} {n}
              </span>
              {extra && <span className="block truncate text-xs text-slate-400">{extra}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
