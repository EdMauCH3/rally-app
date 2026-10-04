import { CalendarClock } from 'lucide-react';
import { useCuentaRegresiva } from '../../hooks/useCuentaRegresiva';

// 17 de octubre de 2026, 08:00:00 en Colombia (UTC-5, sin horario de verano).
// El "-05:00" fija el instante exacto sin importar dónde esté el visitante.
const FECHA_EVENTO_MS = Date.parse('2026-10-17T08:00:00-05:00');

const textoFecha = (() => {
  const texto = new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'America/Bogota',
  }).format(new Date(FECHA_EVENTO_MS));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
})();

function dosDigitos(n) {
  return String(n).padStart(2, '0');
}

function Caja({ valor, etiqueta, late = false }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-white/15 bg-brand-navy/55 px-1.5 py-4 shadow-2xl shadow-black/50 backdrop-blur-xl sm:rounded-3xl sm:px-4 sm:py-7">
      <span
        // key = valor: en los segundos, cada cambio reinicia una animación corta de "tic"
        key={late ? valor : undefined}
        className={`font-display text-4xl font-black leading-none tabular-nums text-white drop-shadow-lg sm:text-6xl md:text-7xl ${
          late ? 'animate-fade-up [animation-duration:350ms]' : ''
        }`}
      >
        {valor}
      </span>
      <span className="mt-2.5 text-xs font-bold uppercase tracking-widest text-amber-200/85 sm:mt-3 sm:text-sm">
        {etiqueta}
      </span>
    </div>
  );
}

export default function ContadorTeaser() {
  const { segundos, sincronizado } = useCuentaRegresiva(FECHA_EVENTO_MS);

  const dias = Math.floor(segundos / 86400);
  const horas = Math.floor((segundos % 86400) / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const segs = segundos % 60;

  const terminado = sincronizado && segundos === 0;
  // Mientras llega la hora del servidor se muestran guiones, no números que luego saltarían.
  const v = (n) => (sincronizado ? dosDigitos(n) : '--');

  return (
    <div className="space-y-5">
      {terminado ? (
        <p className="animate-pulse text-center text-xl font-black text-amber-300 sm:text-3xl">
          🎉 ¡Llegó el gran momento! 🎉
        </p>
      ) : (
        <p className="text-center text-sm font-bold uppercase tracking-[0.3em] text-slate-300">
          Faltan
        </p>
      )}

      <div className="grid grid-cols-4 gap-2 sm:gap-4" role="timer" aria-live="off">
        <Caja valor={v(dias)} etiqueta="Días" />
        <Caja valor={v(horas)} etiqueta="Horas" />
        <Caja valor={v(minutos)} etiqueta="Minutos" />
        <Caja valor={v(segs)} etiqueta="Segundos" late={sincronizado} />
      </div>

      <p className="flex flex-wrap items-center justify-center gap-2 text-center text-sm text-slate-300 sm:text-base">
        <CalendarClock size={18} className="shrink-0 text-amber-300" />
        <span>
          {textoFecha} <span className="text-slate-400">(hora de Colombia)</span>
        </span>
      </p>
    </div>
  );
}
