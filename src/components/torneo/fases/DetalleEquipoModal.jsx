import { useEffect } from 'react';
import { X, ShieldAlert } from 'lucide-react';
import InsigniaEquipo from './InsigniaEquipo';
import { EMOJI_TIPO } from '../publico/utilsTorneo';

/** Ficha de un equipo: descripción, macro-equipo, plantilla con goles, tarjetas y sanciones. */
export default function DetalleEquipoModal({ equipo, jugadores, tablas, onCerrar }) {
  useEffect(() => {
    const tecla = (e) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [onCerrar]);

  if (!equipo) return null;
  const plantilla = jugadores
    .filter((j) => j.equipo_torneo_id === equipo.id)
    .sort((a, b) => (a.dorsal ?? 0) - (b.dorsal ?? 0));
  const filaGrupo = tablas.find((t) => t.fase === 'grupos' && t.equipo_torneo_id === equipo.id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
      onClick={onCerrar}
      role="dialog"
      aria-modal="true"
      aria-label={equipo.nombre}
    >
      <div
        className="glass-card max-h-[85vh] w-full max-w-md overflow-y-auto rounded-b-none p-5 sm:rounded-b-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <InsigniaEquipo
            colorEquipo={equipo.color_hex}
            colorMacro={equipo.macro_color}
            macroNombre={equipo.macro_nombre}
            tamano={52}
          />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-black leading-tight text-white">{equipo.nombre}</h2>
            <p className="text-xs text-slate-400">
              {equipo.macro_nombre} · Grupo {equipo.grupo}
            </p>
            {filaGrupo && filaGrupo.pj > 0 && (
              <p className="mt-1 text-xs text-slate-300">
                Grupo: {filaGrupo.pos}.º · {filaGrupo.pts} pts · {filaGrupo.pj} PJ
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {equipo.descripcion && (
          <p className="mt-3 text-sm leading-relaxed text-slate-300">{equipo.descripcion}</p>
        )}

        <h3 className="mb-2 mt-4 text-xs font-bold uppercase tracking-wide text-slate-400">Plantilla</h3>
        {plantilla.length === 0 ? (
          <p className="text-sm text-slate-400">La plantilla aún no está inscrita.</p>
        ) : (
          <ul className="space-y-1">
            {plantilla.map((j) => (
              <li key={j.jugador_id} className="glass-row flex items-center gap-3 px-3 py-2 text-sm">
                <span className="w-6 text-right font-black text-slate-400">{j.dorsal}</span>
                <span className="min-w-0 flex-1 truncate font-medium text-white">{j.nombre}</span>
                <span className="flex shrink-0 items-center gap-2 text-xs text-slate-300">
                  {j.goles > 0 && <span>{EMOJI_TIPO.gol} {j.goles}</span>}
                  {j.amarillas > 0 && <span>{EMOJI_TIPO.amarilla} {j.amarillas}</span>}
                  {j.rojas > 0 && <span>{EMOJI_TIPO.roja} {j.rojas}</span>}
                  {j.sancionado && (
                    <span title="Sancionado en su próximo partido" className="text-red-300">
                      <ShieldAlert size={14} />
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
