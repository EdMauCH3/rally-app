import { OctagonX } from 'lucide-react';
import { useEstadoActividad } from '../../hooks/useEstadoActividades';

export const MENSAJE_PAUSA =
  'Actividad pausada temporalmente por la coordinación general. Estamos ajustando detalles logísticos; por favor permanece en tu ubicación actual. Reanudaremos en breves minutos.';

/**
 * Aviso de prioridad que tapa la pantalla mientras el Admin tiene la actividad
 * pausada. Se monta una vez en cada pantalla pública y de staff; aparece y
 * desaparece solo (Realtime), sin recargar el navegador y sin perder nada de
 * lo que había en pantalla: el contenido de abajo sigue montado.
 *
 * Solo se muestra si la actividad está iniciada Y pausada.
 */
export default function PausaActividadOverlay({ actividad }) {
  const { iniciada, pausada } = useEstadoActividad(actividad);

  if (!(iniciada && pausada)) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={`pausa-titulo-${actividad}`}
      className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/90 p-5 backdrop-blur-md"
    >
      <div className="w-full max-w-md space-y-5 rounded-3xl border-2 border-amber-400/60 bg-slate-900 p-7 text-center shadow-2xl shadow-black">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/20 text-amber-300 animate-glow-pulse">
          <OctagonX size={44} />
        </span>
        <h2 id={`pausa-titulo-${actividad}`} className="text-2xl font-black text-amber-200">
          ⚠️ Actividad pausada
        </h2>
        <p className="text-base leading-relaxed text-slate-100">{MENSAJE_PAUSA}</p>
        <p className="text-xs text-slate-400">
          Esta pantalla se actualizará sola cuando se reanude la actividad.
        </p>
      </div>
    </div>
  );
}
