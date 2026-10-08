import { useEffect, useMemo, useState } from 'react';
import { Clock, Eye, Hourglass, Loader2, Play } from 'lucide-react';
import { useTorneoFases } from '../../hooks/useTorneoFases';
import { useEstadoPersistente } from '../../hooks/useEstadoPersistente';
import {
  NOMBRE_FASE_PARTIDO,
  agruparPorFecha,
  formatoHora,
  nombreLado,
  partidoJugable,
} from '../../services/torneoLogica';
import PartidoProModal from './PartidoProModal';

const ESTADOS = {
  en_vivo: {
    texto: 'EN VIVO',
    clase: 'bg-red-500/15 text-red-300 border border-red-500/30 animate-pulse',
  },
  pausado: { texto: 'PAUSADO', clase: 'bg-amber-500/15 text-amber-300 border border-amber-500/30' },
  finalizado: { texto: 'FINALIZADO', clase: 'bg-white/10 text-slate-300 border border-white/10' },
  pendiente: { texto: 'PENDIENTE', clase: 'bg-white/5 text-slate-400 border border-white/10' },
};

const CANCHAS = [
  { id: 0, label: 'Todas' },
  { id: 1, label: 'Cancha 1' },
  { id: 2, label: 'Cancha 2' },
];

/** Fecha que el árbitro probablemente necesita: la que está en vivo, o la primera con algo pendiente. */
function fechaSugerida(fechas) {
  const enVivo = fechas.find((f) => f.partidos.some((p) => p.estado === 'en_vivo' || p.estado === 'pausado'));
  if (enVivo) return enVivo.fecha;
  const pendiente = fechas.find((f) => f.partidos.some((p) => !p.finalizado));
  return pendiente?.fecha ?? fechas[fechas.length - 1]?.fecha ?? 1;
}

function estadoFecha(f) {
  if (f.partidos.some((p) => p.estado === 'en_vivo' || p.estado === 'pausado')) return 'vivo';
  if (f.partidos.every((p) => p.finalizado)) return 'listo';
  return 'pendiente';
}

function EquipoBloque({ p, lado }) {
  return (
    <div className="min-w-0">
      {p[`${lado}_color`] && (
        <span className="mb-1 inline-block h-3 w-3 rounded-full" style={{ backgroundColor: p[`${lado}_color`] }} />
      )}
      <p
        className={`break-words font-semibold leading-tight ${
          p[`equipo_${lado}_id`] ? 'text-white' : 'text-slate-500'
        }`}
      >
        {nombreLado(p, lado)}
      </p>
    </div>
  );
}

export default function PartidosPro() {
  const { partidos, cargando, error } = useTorneoFases();
  const [abiertoId, setAbiertoId] = useEstadoPersistente('rally_ui_torneo_partido', null);
  const [fechaElegida, setFechaElegida] = useEstadoPersistente('rally_ui_torneo_fecha', null);
  const [cancha, setCancha] = useEstadoPersistente('rally_ui_torneo_cancha', 0, (v) => [0, 1, 2].includes(v));

  const fechas = useMemo(() => agruparPorFecha(partidos), [partidos]);
  const fecha = fechaElegida && fechas.some((f) => f.fecha === fechaElegida) ? fechaElegida : fechaSugerida(fechas);

  // Si el partido recordado ya no existe (p. ej. tras reiniciar el fixture), se olvida.
  useEffect(() => {
    if (!cargando && abiertoId && !partidos.some((p) => p.id === abiertoId)) setAbiertoId(null);
  }, [cargando, partidos, abiertoId, setAbiertoId]);

  if (cargando) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-white" size={28} />
      </div>
    );
  }

  if (error) {
    return (
      <p className="glass-card mx-auto max-w-2xl p-5 text-center text-sm text-slate-400">
        No se pudieron cargar los partidos. Revisa tu conexión.
      </p>
    );
  }

  const grupoFecha = fechas.find((f) => f.fecha === fecha);
  const lista = (grupoFecha?.partidos ?? []).filter((p) => cancha === 0 || p.cancha === cancha);
  const enVivoOtraFecha = fechas.find(
    (f) => f.fecha !== fecha && f.partidos.some((p) => p.estado === 'en_vivo' || p.estado === 'pausado')
  );

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4">
      <div className="space-y-1 text-center">
        <h2 className="text-lg font-black text-white">Partidos</h2>
        <p className="text-sm text-slate-400">Elige la fecha y tu cancha, y abre el partido para arbitrarlo.</p>
      </div>

      {partidos.length === 0 ? (
        <p className="glass-card p-5 text-center text-sm text-slate-400">
          Aún no hay partidos. El Admin debe generar el fixture (Admin → Torneo → Fixture).
        </p>
      ) : (
        <>
          {/* Selector rápido: Fecha + Cancha */}
          <div className="space-y-3">
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label="Fecha">
              {fechas.map((f) => {
                const st = estadoFecha(f);
                const activa = f.fecha === fecha;
                return (
                  <button
                    key={f.fecha}
                    type="button"
                    role="tab"
                    aria-selected={activa}
                    onClick={() => setFechaElegida(f.fecha)}
                    className={`relative shrink-0 rounded-xl border-2 px-3.5 py-2 text-sm font-bold transition-all duration-300 ${
                      activa
                        ? 'border-brand-brown bg-brand-brown/20 text-white'
                        : 'border-white/10 text-slate-400 hover:border-white/25'
                    }`}
                  >
                    F{f.fecha}
                    <span
                      className={`absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full ${
                        st === 'vivo'
                          ? 'animate-pulse bg-red-500'
                          : st === 'listo'
                            ? 'bg-emerald-400'
                            : 'bg-slate-600'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="Cancha">
              {CANCHAS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={cancha === c.id}
                  onClick={() => setCancha(c.id)}
                  className={`rounded-xl border-2 py-2 text-sm font-semibold transition-all duration-300 ${
                    cancha === c.id
                      ? 'border-brand-brown bg-brand-brown/15 text-white'
                      : 'border-white/10 text-slate-400 hover:border-white/20'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {enVivoOtraFecha && (
              <button
                type="button"
                onClick={() => setFechaElegida(enVivoOtraFecha.fecha)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 py-2 text-sm font-semibold text-red-200"
              >
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                Hay un partido en vivo en la Fecha {enVivoOtraFecha.fecha}
              </button>
            )}
          </div>

          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Fecha {fecha}
            {grupoFecha?.partidos[0] && (
              <span className="ml-2 normal-case text-slate-500">
                · {NOMBRE_FASE_PARTIDO[grupoFecha.partidos[0].fase]}
              </span>
            )}
          </p>

          {lista.length === 0 && (
            <p className="glass-card p-5 text-center text-sm text-slate-400">
              En esta fecha no hay partido en la Cancha {cancha}.
            </p>
          )}

          {lista.map((p) => {
            const estado = ESTADOS[p.estado] ?? ESTADOS.pendiente;
            const terminado = p.estado === 'finalizado';
            const jugable = partidoJugable(p);
            const hora = formatoHora(p.hora_programada);
            return (
              <div
                key={p.id}
                className={`glass-card space-y-3 p-4 transition-all duration-300 ${
                  p.estado === 'en_vivo' ? 'border-red-500/50' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                  <span className="flex flex-wrap items-center gap-x-2">
                    <span className="font-bold text-slate-200">Cancha {p.cancha}</span>
                    {hora && (
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} />
                        {hora}
                      </span>
                    )}
                    <span className="text-slate-500">{NOMBRE_FASE_PARTIDO[p.fase]}{p.grupo ? ` ${p.grupo}` : ''}</span>
                  </span>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${estado.clase}`}>
                    {estado.texto}
                  </span>
                </div>

                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
                  <EquipoBloque p={p} lado="a" />
                  <p className="text-3xl font-black tabular-nums text-white">
                    {jugable ? p.goles_a : '–'} <span className="text-slate-600">-</span>{' '}
                    {jugable ? p.goles_b : '–'}
                    {p.fase_juego === 'penales' && (
                      <span className="block text-xs font-bold text-amber-300">
                        pen. {p.pen_a ?? 0}-{p.pen_b ?? 0}
                      </span>
                    )}
                  </p>
                  <EquipoBloque p={p} lado="b" />
                </div>

                {jugable ? (
                  <button
                    type="button"
                    onClick={() => setAbiertoId(p.id)}
                    className={terminado ? 'btn-secondary w-full' : 'btn-primary w-full !py-3.5'}
                  >
                    {terminado ? <Eye size={18} /> : <Play size={18} />}
                    {terminado ? 'Ver partido' : p.estado === 'pendiente' ? 'Abrir partido' : 'Retomar partido'}
                  </button>
                ) : (
                  <p className="flex items-center justify-center gap-2 rounded-xl border border-white/10 py-3 text-sm text-slate-400">
                    <Hourglass size={16} />
                    Esperando a que termine la fase anterior
                  </p>
                )}
              </div>
            );
          })}
        </>
      )}

      {abiertoId && <PartidoProModal partidoId={abiertoId} onCerrar={() => setAbiertoId(null)} />}
    </div>
  );
}
