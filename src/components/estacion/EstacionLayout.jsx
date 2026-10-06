import { Check, Clock } from 'lucide-react';

/** Encabezado de la estación: qué estación es y cuántos han pasado. */
export function EncabezadoEstacion({ icono: Icono, etiqueta, numero, lugar, pasaron, total, unidad }) {
  const progreso = total > 0 ? (pasaron / total) * 100 : 0;
  return (
    <div className="glass-card space-y-3 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white">
          <Icono size={24} />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Tu estación</p>
          <p className="text-xl font-black leading-tight text-white">
            {etiqueta} {numero}
            {lugar ? <span className="text-base font-semibold text-slate-300"> · {lugar}</span> : null}
          </p>
        </div>
      </div>
      {total > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-end justify-between text-sm">
            <span className="text-slate-300">{unidad} que ya pasaron</span>
            <span className="font-black tabular-nums text-white">
              {pasaron} <span className="font-semibold text-slate-400">de {total}</span>
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-400 transition-all duration-500"
              style={{ width: `${progreso}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/** Pantalla tranquila: todavía no viene nadie. */
export function EstacionEnEspera() {
  return (
    <div className="glass-card space-y-3 p-8 text-center animate-fade-up">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sky-500/15 text-sky-300">
        <Clock size={32} />
      </span>
      <p className="text-lg font-bold leading-snug text-white">
        Aún no viene ningún equipo. Prepárate, en cualquier momento puede aparecer.
      </p>
      <p className="text-sm text-slate-400">
        Cuando el sistema mande a un equipo hacia tu estación, esta pantalla sonará y parpadeará.
      </p>
    </div>
  );
}

/** Todos pasaron: el juez ya puede recoger. */
export function EstacionCerrada({ unidad }) {
  return (
    <div className="space-y-3 rounded-3xl border-2 border-emerald-400/40 bg-emerald-500/10 p-8 text-center animate-fade-up">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
        <Check size={34} />
      </span>
      <p className="text-xl font-black leading-snug text-emerald-100">
        Todos los equipos han pasado por esta {unidad}. Ya puedes recoger y unirte al resto del
        evento.
      </p>
    </div>
  );
}
