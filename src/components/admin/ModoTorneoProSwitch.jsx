import { Loader2, Trophy, CheckCircle2, Circle } from 'lucide-react';

const CON_PRO = [
  'Jugadores con dorsal por equipo (los inscribe el árbitro)',
  'Marcador y temporizador con pitazo, para proyectar en VideoBeam',
  'Goles, amarillas y rojas con su autor y minuto',
  'Roja: -1 punto y el jugador queda sancionado el siguiente partido',
  'Tabla completa (PJ, PG, PE, PP, GF, GC, tarjetas) y minuto a minuto públicos',
];

export default function ModoTorneoProSwitch({ activo, guardando, onCambiar }) {
  function handleClick() {
    if (guardando) return;
    if (activo) {
      const confirmado = window.confirm(
        '¿Apagar el Modo Torneo Pro?\n\nLos árbitros volverán al sistema básico (Ganó / Empate / Ganó). Los eventos y jugadores ya registrados se conservan.'
      );
      if (!confirmado) return;
    }
    onCambiar(!activo);
  }

  return (
    <div
      className={`rounded-3xl border-2 p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/50 transition-all duration-300 ease-in-out ${
        activo
          ? 'border-emerald-500/50 bg-gradient-to-br from-emerald-500/15 via-brand-navy/40 to-brand-navy/60'
          : 'border-white/10 bg-brand-navy/40'
      }`}
    >
      <div className="flex items-start justify-between gap-5">
        <div className="space-y-2 min-w-0">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-widest ${
              activo ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-slate-400'
            }`}
          >
            {activo ? 'Encendido' : 'Apagado'}
          </span>
          <h2 className="flex items-center gap-2.5 text-2xl sm:text-3xl font-black text-white leading-tight">
            <Trophy className={activo ? 'text-emerald-300' : 'text-slate-400'} size={30} />
            Modo Torneo Pro
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            {activo
              ? 'El Torneo funciona como un partido de fútbol profesional.'
              : 'El Torneo usa el sistema básico: el árbitro solo marca quién ganó.'}
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={activo}
          aria-label="Modo Torneo Pro"
          onClick={handleClick}
          disabled={guardando}
          className={`relative inline-flex h-12 w-24 shrink-0 items-center rounded-full transition-all duration-300 ease-in-out disabled:opacity-60 ${
            activo ? 'bg-emerald-600 shadow-lg shadow-emerald-950/60' : 'bg-white/15'
          }`}
        >
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg transition-transform duration-300 ease-in-out ${
              activo ? 'translate-x-[3.25rem]' : 'translate-x-1'
            }`}
          >
            {guardando && <Loader2 className="animate-spin text-slate-600" size={18} />}
          </span>
        </button>
      </div>

      <ul className="mt-6 space-y-2">
        {CON_PRO.map((texto) => (
          <li key={texto} className="flex items-start gap-2.5 text-sm text-slate-300">
            {activo ? (
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-300" />
            ) : (
              <Circle size={16} className="mt-0.5 shrink-0 text-slate-600" />
            )}
            <span className={activo ? '' : 'text-slate-500'}>{texto}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
