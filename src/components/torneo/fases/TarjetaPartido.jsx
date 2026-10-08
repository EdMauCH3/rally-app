import { useEffect, useState } from 'react';
import { AlertTriangle, ChevronDown, Clock, Radio } from 'lucide-react';
import {
  NOMBRE_FASE_PARTIDO,
  formatoHora,
  nombreLado,
  ladoDefinido,
} from '../../../services/torneoLogica';
import { EMOJI_TIPO, ETIQUETA_TIPO } from '../publico/utilsTorneo';
import DetalleEquipoEventos from '../publico/DetalleEquipoEventos';
import InsigniaEquipo from './InsigniaEquipo';

/** Minuto del partido en vivo (con la hora del servidor), actualizado cada segundo. */
function useMinuto(p, desfaseMs) {
  const [seg, setSeg] = useState(0);
  useEffect(() => {
    function tick() {
      let s = p.segundos_acumulados ?? 0;
      if (p.reloj_inicio_en) {
        s += Math.max(0, (Date.now() + desfaseMs - Date.parse(p.reloj_inicio_en)) / 1000);
      }
      if (p.fase_juego === 'prorroga') s += p.duracion_regular_segundos ?? 0;
      setSeg(s);
    }
    tick();
    if (!p.reloj_inicio_en) return undefined;
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [p, desfaseMs]);
  return Math.floor(seg / 60) + 1;
}

function EstadoChip({ p, desfaseMs }) {
  const minuto = useMinuto(p, desfaseMs);
  if (p.finalizado) {
    return (
      <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-bold text-slate-300">
        FINAL{p.fase_juego === 'penales' ? ' · PEN.' : p.fase_juego === 'prorroga' ? ' · T.S.' : ''}
      </span>
    );
  }
  if (p.estado === 'en_vivo' || p.estado === 'pausado') {
    const texto =
      p.fase_juego === 'penales'
        ? 'PENALES'
        : p.estado === 'pausado'
          ? `EN PAUSA · ${minuto}'`
          : p.fase_juego === 'prorroga'
            ? `T.S. · ${minuto}'`
            : `${minuto}'`;
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
          p.estado === 'pausado' ? 'bg-amber-500/15 text-amber-300' : 'animate-pulse bg-red-500/20 text-red-300'
        }`}
      >
        <Radio size={11} /> EN VIVO · {texto}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] font-semibold text-slate-400">
      PENDIENTE
    </span>
  );
}

function FilaEquipo({ p, lado, mostrarMarcador, ganador, onEquipo }) {
  const definido = ladoDefinido(p, lado);
  const goles = lado === 'a' ? p.goles_a : p.goles_b;
  const pen = lado === 'a' ? p.pen_a : p.pen_b;
  const hayPen = p.fase_juego === 'penales' && pen != null;
  const id = p[`equipo_${lado}_id`];

  return (
    <div className={`flex items-center gap-3 ${ganador === false ? 'opacity-60' : ''}`}>
      <InsigniaEquipo
        colorEquipo={p[`${lado}_color`]}
        colorMacro={p[`${lado}_macro_color`]}
        macroNombre={p[`${lado}_macro_nombre`]}
      />
      <div className="min-w-0 flex-1">
        {definido ? (
          <button
            type="button"
            onClick={() => onEquipo?.(id)}
            className={`block max-w-full break-words text-left leading-tight text-white transition-colors hover:text-amber-200 ${
              ganador ? 'font-black' : 'font-semibold'
            }`}
          >
            {nombreLado(p, lado)}
          </button>
        ) : (
          <span className="block break-words font-medium italic leading-tight text-slate-500">
            {nombreLado(p, lado)}
          </span>
        )}
        {definido && (
          <span className="block truncate text-[11px] text-slate-500">{p[`${lado}_macro_nombre`]}</span>
        )}
      </div>
      <div className="flex w-12 shrink-0 items-baseline justify-end gap-1 tabular-nums">
        <span className={`text-2xl ${ganador ? 'font-black text-white' : 'font-bold text-slate-200'}`}>
          {mostrarMarcador ? goles : '–'}
        </span>
        {hayPen && <span className="text-xs font-bold text-amber-300">({pen})</span>}
      </div>
    </div>
  );
}

function Resumen({ p, eventos, penales, jugadores }) {
  const delPartido = eventos.filter((e) => e.partido_id === p.id);
  const tiros = penales.filter((t) => t.partido_id === p.id);
  const bajas = jugadores.filter((j) => j.sancionado && j.partido_sancion_id === p.id);
  const nombreEquipo = (id) => (id === p.equipo_a_id ? p.a_nombre : p.b_nombre);

  if (!p.equipo_a_id || !p.equipo_b_id) {
    return <p className="text-sm text-slate-500">Este cruce se define cuando termine la fase anterior.</p>;
  }

  return (
    <div className="space-y-3">
      {bajas.length > 0 && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/[0.07] px-3 py-2.5 text-sm text-red-200">
          <p className="flex items-center gap-2 font-semibold">
            <AlertTriangle size={14} /> No pueden jugar este partido
          </p>
          <ul className="mt-1 space-y-0.5 text-xs">
            {bajas.map((j) => (
              <li key={j.jugador_id}>
                #{j.dorsal} {j.nombre} · {nombreEquipo(j.equipo_torneo_id)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {delPartido.length === 0 && tiros.length === 0 ? (
        <p className="text-sm text-slate-500">
          {p.estado === 'pendiente' ? 'Este partido aún no empieza.' : 'Todavía no hay goles ni tarjetas.'}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {['a', 'b'].map((lado) => (
              <div key={lado} className="min-w-0">
                <p className="mb-1.5 truncate text-xs font-bold uppercase tracking-wide text-slate-400">
                  <span
                    className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
                    style={{ backgroundColor: p[`${lado}_color`] }}
                  />
                  {p[`${lado}_nombre`]}
                </p>
                <DetalleEquipoEventos partido={p} equipoId={p[`equipo_${lado}_id`]} eventos={eventos} />
              </div>
            ))}
          </div>

          {delPartido.length > 0 && (
            <ol className="space-y-1.5 border-t border-white/10 pt-3">
              {delPartido.map((ev) => (
                <li key={ev.id} className="flex items-start gap-2.5 text-sm text-slate-200">
                  <span className="w-8 shrink-0 pt-0.5 text-right text-xs font-bold tabular-nums text-slate-400">
                    {ev.minuto}'
                  </span>
                  <span className="shrink-0">{EMOJI_TIPO[ev.tipo]}</span>
                  <span className="min-w-0">
                    <span className="font-semibold text-white">{ETIQUETA_TIPO[ev.tipo]}</span>
                    <span className="text-slate-300">
                      {' · '}
                      {ev.jugador_dorsal != null ? `#${ev.jugador_dorsal} ` : ''}
                      {ev.jugador_nombre ?? 'Jugador'}
                      {ev.autogol ? ' (autogol)' : ''}
                      {ev.automatica ? ' (2.ª amarilla)' : ''}
                    </span>
                    <span className="text-slate-500"> · {nombreEquipo(ev.equipo_torneo_id)}</span>
                  </span>
                </li>
              ))}
            </ol>
          )}

          {tiros.length > 0 && (
            <div className="space-y-1.5 border-t border-white/10 pt-3">
              <p className="text-xs font-bold uppercase tracking-wide text-amber-300">
                Tanda de penales · {p.pen_a ?? 0} - {p.pen_b ?? 0}
              </p>
              <ol className="space-y-1">
                {tiros.map((t) => (
                  <li key={t.id} className="flex items-center gap-2 text-sm text-slate-200">
                    <span className="w-5 shrink-0 text-right text-xs tabular-nums text-slate-500">{t.orden}</span>
                    <span>{t.convertido ? '✅' : '❌'}</span>
                    <span className="min-w-0 truncate">
                      {t.jugador_nombre ? `${t.jugador_dorsal != null ? `#${t.jugador_dorsal} ` : ''}${t.jugador_nombre}` : 'Jugador'}
                      <span className="text-slate-500"> · {nombreEquipo(t.equipo_torneo_id)}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Partido estilo FIFA: dos filas (escudo, nombre, marcador), estado, fecha y
 * cancha, y un resumen desplegable con goleadores y tarjetas con nombres.
 */
export default function TarjetaPartido({
  p,
  eventos,
  penales,
  jugadores,
  desfaseMs,
  onEquipo,
  abiertoInicial = false,
  resaltarFase = false,
}) {
  const [abierto, setAbierto] = useState(abiertoInicial);
  const empezo = p.finalizado || p.estado === 'en_vivo' || p.estado === 'pausado';
  const hora = formatoHora(p.hora_programada);
  const vivo = p.estado === 'en_vivo';

  return (
    <article
      className={`glass-card overflow-hidden transition-all duration-300 ${
        vivo ? 'border-red-500/50 shadow-red-950/40' : ''
      }`}
    >
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-white/5 px-4 py-2.5 text-xs text-slate-400">
        <span className="flex flex-wrap items-center gap-x-2">
          <span className="font-bold text-slate-200">Fecha {p.fecha_num}</span>
          <span>Cancha {p.cancha}</span>
          {hora && (
            <span className="inline-flex items-center gap-1">
              <Clock size={11} />
              {hora}
            </span>
          )}
          {resaltarFase && <span className="text-slate-500">{NOMBRE_FASE_PARTIDO[p.fase]}</span>}
        </span>
        <EstadoChip p={p} desfaseMs={desfaseMs} />
      </header>

      <div className="space-y-3 px-4 py-3.5">
        <FilaEquipo
          p={p}
          lado="a"
          mostrarMarcador={empezo}
          ganador={p.finalizado && p.ganador_id ? p.ganador_id === p.equipo_a_id : null}
          onEquipo={onEquipo}
        />
        <FilaEquipo
          p={p}
          lado="b"
          mostrarMarcador={empezo}
          ganador={p.finalizado && p.ganador_id ? p.ganador_id === p.equipo_b_id : null}
          onEquipo={onEquipo}
        />
      </div>

      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className="flex w-full items-center justify-center gap-1.5 border-t border-white/5 py-2 text-xs font-semibold text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
      >
        {abierto ? 'Ocultar resumen' : 'Ver resumen'}
        <ChevronDown size={14} className={`transition-transform duration-300 ${abierto ? 'rotate-180' : ''}`} />
      </button>

      {abierto && (
        <div className="border-t border-white/5 bg-black/10 px-4 py-3.5">
          <Resumen p={p} eventos={eventos} penales={penales} jugadores={jugadores} />
        </div>
      )}
    </article>
  );
}
