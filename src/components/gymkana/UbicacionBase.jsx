/**
 * "Dirígete a la Base N, ubicada en <lugar>" + descripción debajo.
 * Igual que la rotación de la mañana. Si la base aún no tiene lugar o
 * descripción configurados, simplemente no se muestran esas líneas.
 *
 * Pensado para ir sobre un fondo de color (los banners de la Gymkana),
 * por eso usa texto blanco.
 */
export default function UbicacionBase({ numero, info }) {
  const lugar = info?.lugar?.trim();
  const descripcion = info?.descripcion?.trim();

  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-white/80">Dirígete a la</p>
      <p className="text-3xl font-black text-white leading-tight">Base {numero}</p>

      {lugar && (
        <p className="mt-1 text-base sm:text-lg font-bold text-white leading-snug">
          <span className="text-sm font-medium text-white/75">ubicada en </span>
          {lugar}
        </p>
      )}

      {descripcion && (
        <p className="mt-1.5 text-sm text-white/80 leading-snug">
          Descripción: {descripcion}
        </p>
      )}
    </div>
  );
}
