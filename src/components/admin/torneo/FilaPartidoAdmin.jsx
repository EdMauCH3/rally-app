import { CalendarClock, Pencil, RotateCcw, Trash2, Flag } from 'lucide-react';
import BadgeCancha from '../../torneo/BadgeCancha';
import InsigniaEquipo from '../../torneo/fases/InsigniaEquipo';
import { estadoUi, horaParaInput, nombreLado, nombreRonda, partidoIniciado, TEXTO_ESTADO } from '../../../services/torneoLogica';

export const CLASE_ESTADO = {
  pendiente: 'bg-slate-500/20 text-slate-300',
  en_vivo: 'bg-red-500/20 text-red-300',
  pausado: 'bg-amber-500/20 text-amber-300',
  finalizado: 'bg-emerald-500/20 text-emerald-300',
  wo: 'bg-fuchsia-500/20 text-fuchsia-300',
};

function Lado({ p, lado }) {
  const retirado = p[`${lado}_estado`] === 'retirado';
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <InsigniaEquipo
        colorEquipo={p[`${lado}_color`]}
        colorMacro={p[`${lado}_macro_color`]}
        macroNombre={p[`${lado}_macro_nombre`]}
        tamano={20}
      />
      <span className={`min-w-0 break-words ${p[`equipo_${lado}_id`] ? '' : 'italic text-slate-500'} ${retirado ? 'line-through opacity-60' : ''}`}>
        {nombreLado(p, lado)}
      </span>
      {p[`${lado}_macro_nombre`] && (
        <span className="hidden shrink-0 text-[10px] font-medium text-slate-500 sm:inline">
          · {p[`${lado}_macro_nombre`]}
        </span>
      )}
      {retirado && (
        <span className="shrink-0 rounded bg-red-500/20 px-1 text-[10px] font-bold uppercase text-red-300">Retirado</span>
      )}
    </span>
  );
}

/**
 * Fila de un partido para el Admin / Director Técnico.
 * `acciones` = { onWO, onCruce, onMover, onEliminar, onReabrir } (cada una opcional).
 */
export default function FilaPartidoAdmin({ p, onHora, acciones = {}, mostrarFase = false }) {
  const ui = estadoUi(p);
  const conMarcador = p.finalizado || p.estado === 'en_vivo' || p.estado === 'pausado';
  const iniciado = partidoIniciado(p);
  const definido = p.equipo_a_id && p.equipo_b_id;

  return (
    <div className="glass-row space-y-2 px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <BadgeCancha cancha={p.cancha} tamano="mini" />
        <span className="text-[11px] font-bold text-slate-500">#{p.partido_num}</span>
        <span className="flex order-last min-w-0 basis-full flex-wrap items-center gap-x-1.5 gap-y-1 text-sm font-semibold leading-tight text-white">
          <Lado p={p} lado="a" />
          <span className="text-slate-500">vs</span>
          <Lado p={p} lado="b" />
        </span>
        {conMarcador && (
          <span className="text-sm font-black tabular-nums text-white">
            {p.goles_a} - {p.goles_b}
            {p.fase_juego === 'penales' && p.pen_serie != null && (
              <span className="ml-1 text-xs font-semibold text-amber-300">({p.pen_a}-{p.pen_b} pen.)</span>
            )}
          </span>
        )}
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${CLASE_ESTADO[ui]}`}>{TEXTO_ESTADO[ui]}</span>
        {onHora && !p.borrador && (
          <input
            type="time"
            aria-label={`Hora del partido ${p.partido_num}`}
            defaultValue={horaParaInput(p.hora_programada)}
            key={`${p.id}-${p.hora_programada ?? ''}`}
            onBlur={(e) => onHora(p, e.target.value)}
            className="field !h-8 !w-[6.5rem] !px-2 !py-0 text-xs"
          />
        )}
      </div>

      {(mostrarFase || p.walkover) && (
        <p className="flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500">
          {mostrarFase && <span>{nombreRonda(p)}</span>}
          {p.walkover && (
            <span className="text-fuchsia-300">
              W.O. {p.wo_motivo ? `· ${p.wo_motivo}` : ''}
            </span>
          )}
        </p>
      )}

      <div className="flex flex-wrap gap-1.5">
        {acciones.onWO && !p.finalizado && definido && !p.borrador && !iniciado && (
          <BotonMini icono={Flag} onClick={() => acciones.onWO(p)}>W.O.</BotonMini>
        )}
        {acciones.onCruce && !iniciado && (
          <BotonMini icono={Pencil} onClick={() => acciones.onCruce(p)}>Cruce</BotonMini>
        )}
        {acciones.onMover && !p.finalizado && !p.en_juego && (
          <BotonMini icono={CalendarClock} onClick={() => acciones.onMover(p)}>Mover</BotonMini>
        )}
        {acciones.onReabrir && p.finalizado && (
          <BotonMini icono={RotateCcw} onClick={() => acciones.onReabrir(p)}>Reabrir</BotonMini>
        )}
        {acciones.onEliminar && !p.finalizado && !p.en_juego && (
          <BotonMini icono={Trash2} peligro onClick={() => acciones.onEliminar(p)}>Eliminar</BotonMini>
        )}
      </div>
    </div>
  );
}

function BotonMini({ icono: Icono, children, onClick, peligro = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
        peligro
          ? 'bg-red-500/10 text-red-300 hover:bg-red-500/20'
          : 'bg-white/[0.07] text-slate-200 hover:bg-white/15'
      }`}
    >
      <Icono size={12} />
      {children}
    </button>
  );
}

