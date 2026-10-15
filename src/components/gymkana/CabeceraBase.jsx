import { MapPin } from 'lucide-react';
import { tituloBase } from '../../services/gymkanaLogica';

/**
 * Jerarquía visual de una base: "Base 3 - Esperanza" y, debajo, el lugar físico
 * en letra grande y contrastada ("📍 Lugar: Cancha de baloncesto").
 * Fondo oscuro y texto blanco: el contraste no depende del color del equipo.
 */
export default function CabeceraBase({ numero, info, color = '#10b981', etiqueta }) {
  const lugar = info?.lugar?.trim();
  return (
    <div
      className="space-y-3 rounded-3xl border border-white/10 bg-slate-900/90 p-5 shadow-2xl shadow-black/40"
      style={{ borderLeft: `10px solid ${color}` }}
    >
      <div className="flex items-center gap-4">
        <span
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-slate-900 text-2xl font-black text-white"
          style={{ backgroundColor: color, boxShadow: `0 0 26px 4px ${color}88` }}
          aria-hidden="true"
        >
          {numero}
        </span>
        <div className="min-w-0">
          {etiqueta && (
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{etiqueta}</p>
          )}
          <h2 className="break-words text-2xl font-black leading-tight text-white">
            {tituloBase(numero, info)}
          </h2>
        </div>
      </div>

      {lugar ? (
        <p className="flex items-start gap-2 rounded-2xl bg-white px-4 py-3 text-lg font-black leading-snug text-slate-900 sm:text-xl">
          <MapPin size={22} className="mt-0.5 shrink-0 text-red-600" aria-hidden="true" />
          <span>
            <span aria-hidden="true">📍 </span>Lugar: {lugar}
          </span>
        </p>
      ) : (
        <p className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-slate-300">
          📍 Lugar: aún sin definir
        </p>
      )}
    </div>
  );
}
