import { Flag, Hourglass, PartyPopper, Timer } from 'lucide-react';
import { formatoMMSS, useAtrasoMs, useRestanteMs } from '../../hooks/useRotacionFormacion';
import { esRondaFinal, finDeRonda } from '../../services/gymkanaLogica';

/**
 * Reloj de la ronda, igual para coordinación, jueces y público. No consulta
 * nada por segundo: recibe el circuito (inicio + duración) y cuenta localmente
 * con la hora del servidor.
 *
 * `compacto`: una sola franja (para ir sobre otras tarjetas).
 */
export default function RelojRonda({ circuito, equipos, cruces, desfaseMs, compacto = false }) {
  const fin = finDeRonda(circuito);
  const restanteMs = useRestanteMs(fin, desfaseMs);
  const atrasoMs = useAtrasoMs(fin, desfaseMs);

  const final = esRondaFinal(circuito, equipos, cruces);
  const enCurso = circuito.estado === 'en_curso';
  const terminoTiempo = enCurso && fin && restanteMs <= 0;
  const poco = enCurso && restanteMs > 0 && restanteMs <= 60000;

  if (circuito.estado === 'esperando') {
    return (
      <div
        role="status"
        className="flex items-center gap-3 rounded-2xl border border-sky-400/30 bg-sky-500/10 px-4 py-3 text-sky-100"
      >
        <Hourglass size={compacto ? 18 : 22} className="shrink-0" />
        <p className="text-sm font-semibold">Esperando que la coordinación autorice la primera rotación.</p>
      </div>
    );
  }

  if (circuito.estado === 'completado') {
    return (
      <div
        role="status"
        className="flex items-center gap-3 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-emerald-100"
      >
        <PartyPopper size={compacto ? 18 : 22} className="shrink-0" />
        <p className="text-sm font-semibold">Circuito completado.</p>
      </div>
    );
  }

  const tono = terminoTiempo
    ? 'border-red-400/60 bg-red-500/15 text-red-100'
    : poco
      ? 'border-amber-400/60 bg-amber-500/15 text-amber-100'
      : 'border-emerald-400/40 bg-emerald-500/10 text-emerald-50';

  return (
    <div className={`rounded-2xl border-2 px-4 py-3 ${tono}`} role="timer" aria-live="off">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest opacity-80">
            {final ? <Flag size={13} /> : <Timer size={13} />}
            {final ? 'Ronda final' : `Ronda ${circuito.ronda_actual}`}
          </p>
          {final && <p className="text-base font-black leading-tight">¡Ronda Final en curso!</p>}
          {terminoTiempo && (
            <p className="text-sm font-semibold">Tiempo cumplido · esperando la señal de rotación</p>
          )}
        </div>
        <div className="text-right">
          <p className={`font-mono font-black leading-none tabular-nums ${compacto ? 'text-3xl' : 'text-5xl'}`}>
            {terminoTiempo ? '00:00' : formatoMMSS(restanteMs)}
          </p>
          {terminoTiempo && atrasoMs > 1000 && (
            <p className="mt-1 font-mono text-xs tabular-nums opacity-80">+{formatoMMSS(atrasoMs)} de atraso</p>
          )}
        </div>
      </div>
    </div>
  );
}
