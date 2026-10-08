/**
 * Escudo del equipo: círculo con el color de su Macro-Equipo y la inicial del
 * macro, con un aro del color propio del equipo. Si el equipo aún no está
 * definido (cruce por jugar) se dibuja un círculo punteado.
 */
export default function InsigniaEquipo({ colorEquipo, colorMacro, macroNombre, tamano = 36 }) {
  if (!colorEquipo && !colorMacro) {
    return (
      <span
        className="inline-block shrink-0 rounded-full border-2 border-dashed border-white/20"
        style={{ width: tamano, height: tamano }}
      />
    );
  }
  const inicial = (macroNombre ?? '?').trim().charAt(0).toUpperCase();
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-black text-white"
      style={{
        width: tamano,
        height: tamano,
        fontSize: tamano * 0.42,
        backgroundColor: colorMacro ?? '#334155',
        boxShadow: `0 0 0 3px ${colorEquipo ?? '#64748b'}, 0 0 14px ${colorEquipo ?? '#64748b'}55`,
        textShadow: '0 1px 2px rgba(0,0,0,.6)',
      }}
    >
      {inicial}
    </span>
  );
}
