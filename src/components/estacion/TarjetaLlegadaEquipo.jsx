import { useEffect } from 'react';

/**
 * "Viene el equipo: X". La identidad del equipo va en un acento limpio: borde
 * lateral grueso + círculo con brillo en su color. El fondo de la tarjeta es
 * oscuro y el texto blanco, así el contraste es el mismo con cualquier color
 * de equipo (incluso amarillo o blanco).
 *
 * `equipos`: uno (Tesoro) o dos (Gymkana: la pareja que viene).
 * `alertando`: la tarjeta late y el marco de la pantalla parpadea en el color del equipo.
 */
export default function TarjetaLlegadaEquipo({
  titulo,
  equipos,
  alertando = false,
  detalle,
  ocultarEtiqueta = false,
}) {
  const principal = equipos[0];

  // El parpadeo vive aquí mismo (CSS inline), sin tocar index.css.
  useEffect(() => {
    if (document.getElementById('estilos-estacion-parpadeo')) return;
    const estilo = document.createElement('style');
    estilo.id = 'estilos-estacion-parpadeo';
    estilo.textContent = `
      @keyframes estacion-parpadeo { 0%,100% { opacity: 0 } 50% { opacity: 1 } }
      @keyframes estacion-latido { 0%,100% { transform: scale(1) } 50% { transform: scale(1.025) } }
      @media (prefers-reduced-motion: reduce) {
        .estacion-parpadeo, .estacion-latido { animation: none !important; }
      }`;
    document.head.appendChild(estilo);
  }, []);

  return (
    <>
      {alertando && (
        <div
          aria-hidden="true"
          className="estacion-parpadeo pointer-events-none fixed inset-0 z-[90]"
          // Marco que late en el color del equipo: el centro queda transparente, así el texto
          // conserva su contraste completo mientras la pantalla parpadea.
          style={{
            boxShadow: `inset 0 0 0 10px ${principal.color_hex}, inset 0 0 80px 12px ${principal.color_hex}b3`,
            animation: 'estacion-parpadeo 0.7s ease-in-out infinite',
          }}
        />
      )}

      <div
        role="status"
        aria-live="assertive"
        className={`estacion-latido relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/90 p-5 shadow-2xl shadow-black/50 ${
          alertando ? 'ring-2 ring-white/60' : ''
        }`}
        style={{
          borderLeft: `10px solid ${principal.color_hex}`,
          animation: alertando ? 'estacion-latido 0.7s ease-in-out infinite' : 'none',
        }}
      >
        <div className="flex items-center gap-4">
          <div className="flex shrink-0 -space-x-3">
            {equipos.map((e) => (
              <span
                key={e.id}
                className="h-14 w-14 rounded-full border-4 border-slate-900"
                style={{
                  backgroundColor: e.color_hex,
                  boxShadow: `0 0 26px 4px ${e.color_hex}88`,
                }}
                aria-hidden="true"
              />
            ))}
          </div>

          <div className="min-w-0">
            {!ocultarEtiqueta && (
              <p className="text-xs font-bold uppercase tracking-widest text-slate-300">{titulo}</p>
            )}
            <p className="text-2xl font-black leading-tight text-white break-words">
              {equipos.map((e, i) => (
                <span key={e.id}>
                  {i > 0 && <span className="px-2 text-base font-semibold text-slate-400">vs</span>}
                  {e.nombre}
                </span>
              ))}
            </p>
            {detalle && <p className="mt-1 text-sm text-slate-300">{detalle}</p>}
          </div>
        </div>
      </div>
    </>
  );
}
