import { CalendarClock } from 'lucide-react';

export default function LetreroActividadNoIniciada({ nombreActividad }) {
  return (
    <div className="max-w-md mx-auto text-center py-16 px-4 space-y-4 animate-fade-up">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-brown/15 border border-brand-brown/30">
        <CalendarClock className="text-brand-brown" size={30} />
      </div>
      <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
        Aún no ha iniciado {nombreActividad}
      </h2>
      <p className="text-slate-400">Estate pendiente de tu animador.</p>
    </div>
  );
}
