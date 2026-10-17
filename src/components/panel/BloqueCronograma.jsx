import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Clock, MapPin, Users, Package, StickyNote, LayoutGrid, Table, ChevronDown, Sparkles, CalendarClock,
} from 'lucide-react';
import { useEstadoPersistente } from '../../hooks/useEstadoPersistente';
import { FECHA_EVENTO, cronogramaGeneralData, colorFestData } from '../../data/cronogramaStaff';

const TIPO_FEST = {
  animacion: 'border-sky-300/30 bg-sky-400/10',
  presentacion: 'border-violet-300/30 bg-violet-400/10',
  premio: 'border-amber-300/40 bg-amber-400/10',
  fiesta: 'border-fuchsia-300/40 bg-fuchsia-400/10',
  cierre: 'border-emerald-300/30 bg-emerald-400/10',
};
const ETIQUETA_FEST = { animacion: 'Animación', presentacion: 'Presentación', premio: 'Premiación', fiesta: 'Fiesta', cierre: 'Cierre' };

function ahoraColombia() {
  const d = new Date(Date.now() - 5 * 3600 * 1000);
  return { fecha: d.toISOString().slice(0, 10), min: d.getUTCHours() * 60 + d.getUTCMinutes() };
}

function Linea({ Icono, titulo, children }) {
  if (!children) return null;
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
        <Icono size={13} /> {titulo}
      </p>
      <p className="mt-1 text-sm text-slate-200 leading-relaxed">{children}</p>
    </div>
  );
}

export default function BloqueCronograma() {
  const [bloque, setBloque] = useEstadoPersistente('rally_ui_cron_bloque', 'general', (v) => v === 'general' || v === 'fest');
  const [vista, setVista] = useEstadoPersistente('rally_ui_cron_vista', 'tarjetas', (v) => v === 'tarjetas' || v === 'tabla');
  const [ahora, setAhora] = useState(ahoraColombia);
  const [abierto, setAbierto] = useState(null);
  const refActual = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setAhora(ahoraColombia()), 30000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => setAbierto(null), [bloque]);

  const datos = bloque === 'general' ? cronogramaGeneralData : colorFestData;
  const idxActual = useMemo(() => {
    if (ahora.fecha !== FECHA_EVENTO) return -1;
    return datos.findIndex((m) => ahora.min >= m.ini && ahora.min < m.fin);
  }, [ahora, datos]);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <header className="space-y-1 text-center sm:text-left">
        <h2 className="flex items-center justify-center sm:justify-start gap-2 text-2xl font-black text-white">
          <CalendarClock size={24} className="text-blue-300" /> Cronograma del staff
        </h2>
        <p className="text-sm text-slate-400">Interoratorios 2026 · Sábado 17 de octubre · Hora de Colombia</p>
      </header>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex gap-1 rounded-full bg-white/10 p-1 border border-white/10 self-start">
          {[['general', 'Cronograma general'], ['fest', 'Fest Color']].map(([k, t]) => (
            <button
              key={k}
              onClick={() => setBloque(k)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${bloque === k ? 'bg-white text-brand-navy' : 'text-white/70 hover:text-white'}`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-full bg-white/10 p-1 border border-white/10 self-start">
          {[['tarjetas', 'Tarjetas', LayoutGrid], ['tabla', 'Tabla', Table]].map(([k, t, I]) => (
            <button
              key={k}
              onClick={() => setVista(k)}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-bold transition-colors ${vista === k ? 'bg-white text-brand-navy' : 'text-white/70 hover:text-white'}`}
            >
              <I size={15} /> {t}
            </button>
          ))}
        </div>
      </div>

      {idxActual >= 0 && (
        <button
          onClick={() => refActual.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          className="w-full glass-row px-4 py-3 text-left text-sm text-amber-200 font-bold"
        >
          ● Ahora: {bloque === 'general' ? datos[idxActual].actividad : datos[idxActual].momento} — toca para ir
        </button>
      )}

      {vista === 'tabla' ? (
        <Tabla bloque={bloque} datos={datos} idxActual={idxActual} />
      ) : (
        <ul className="space-y-3">
          {datos.map((m, i) => {
            const activo = i === idxActual;
            const abre = abierto === i;
            const fest = bloque === 'fest';
            const titulo = fest ? m.momento : m.actividad;
            const hayMas = fest ? m.prepara || m.notas : m.comision || m.responsables || m.materiales || m.notas;
            return (
              <li key={`${bloque}-${i}`} ref={activo ? refActual : null}>
                <article
                  className={`glass-card overflow-hidden ${activo ? 'ring-2 ring-amber-300/80' : ''} ${
                    fest ? TIPO_FEST[m.tipo] : m.cumbre ? 'border-fuchsia-300/40 bg-fuchsia-400/10' : ''
                  }`}
                >
                  <button
                    onClick={() => hayMas && setAbierto(abre ? null : i)}
                    className="w-full text-left p-4 flex items-start gap-3"
                    aria-expanded={abre}
                  >
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600/20 px-2.5 py-1 text-sm font-bold text-blue-400">
                          <Clock size={14} /> {m.hora}
                        </span>
                        {activo && <span className="rounded-full bg-amber-300 px-2.5 py-1 text-xs font-black text-brand-navy">● AHORA</span>}
                        {fest && <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold text-slate-300">{ETIQUETA_FEST[m.tipo]}</span>}
                        {!fest && m.cumbre && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-fuchsia-400/25 px-2.5 py-1 text-xs font-black text-fuchsia-100">
                            <Sparkles size={12} /> Momento cumbre
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-black text-white leading-snug">{titulo}</h3>
                      {m.detalle && <p className="text-sm text-slate-300 leading-relaxed">{m.detalle}</p>}
                      {!fest && (
                        <p className="flex items-start gap-1.5 text-sm text-slate-200">
                          <MapPin size={15} className="mt-0.5 shrink-0 text-blue-300" /> {m.lugar}
                        </p>
                      )}
                    </div>
                    {hayMas && <ChevronDown size={20} className={`mt-1 shrink-0 text-slate-400 transition-transform ${abre ? 'rotate-180' : ''}`} />}
                  </button>
                  {abre && (
                    <div className="border-t border-white/10 bg-black/15 p-4 grid gap-3 sm:grid-cols-2">
                      {fest ? (
                        <>
                          <Linea Icono={Package} titulo="Preparación">{m.prepara}</Linea>
                          <Linea Icono={StickyNote} titulo="Notas">{m.notas}</Linea>
                        </>
                      ) : (
                        <>
                          <Linea Icono={Users} titulo="Responsable · comisión">{m.comision}</Linea>
                          <Linea Icono={Users} titulo="Responsables particulares">{m.responsables}</Linea>
                          <Linea Icono={Package} titulo="Requerimientos materiales">{m.materiales}</Linea>
                          <Linea Icono={StickyNote} titulo="Notas">{m.notas}</Linea>
                        </>
                      )}
                    </div>
                  )}
                </article>
              </li>
            );
          })}
        </ul>
      )}

      {bloque === 'fest' && (
        <p className="glass-row px-4 py-3 text-sm text-slate-300">
          Cada presentación dura entre 5 y 8 minutos, con 2 minutos para el cambio. Mientras un apostolado se presenta, el otro debe estar alistándose.
        </p>
      )}
    </div>
  );
}

function Tabla({ bloque, datos, idxActual }) {
  const fest = bloque === 'fest';
  const cols = fest ? ['Hora', 'Momento', 'Preparación', 'Notas'] : ['Hora', 'Actividad', 'Lugar', 'Responsable'];
  return (
    <div className="glass-card overflow-x-auto scroll-smooth">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-wider text-slate-500 border-b border-white/10">
            {cols.map((c) => (
              <th key={c} className="px-4 py-3 font-bold">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {datos.map((m, i) => (
            <tr key={i} className={`border-b border-white/5 align-top ${i === idxActual ? 'bg-amber-300/15' : 'hover:bg-white/5'}`}>
              <td className="px-4 py-3 font-bold text-blue-400 whitespace-nowrap">{m.hora}</td>
              {fest ? (
                <>
                  <td className="px-4 py-3 font-bold text-white">{m.momento}{m.detalle && <span className="block text-xs font-normal text-slate-400">{m.detalle}</span>}</td>
                  <td className="px-4 py-3 text-slate-200">{m.prepara ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-200">{m.notas ?? '—'}</td>
                </>
              ) : (
                <>
                  <td className="px-4 py-3 font-bold text-white">{m.actividad}</td>
                  <td className="px-4 py-3 text-slate-200">{m.lugar}</td>
                  <td className="px-4 py-3 text-slate-200">{m.comision}{m.responsables && <span className="block text-xs text-slate-400">{m.responsables}</span>}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
