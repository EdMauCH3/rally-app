import { Wrench, Sparkles } from 'lucide-react';

export default function BloqueEnMantenimiento({ titulo, descripcion }) {
  return (
    <div className="max-w-2xl mx-auto flex flex-col items-center gap-6 text-center py-12 animate-fade-up">
      <div className="relative flex items-center justify-center">
        <Sparkles
          className="absolute -top-5 -left-8 text-amber-300 animate-pulse"
          size={22}
        />
        <div className="rounded-full bg-gradient-to-br from-brand-brown/30 to-brand-navy/40 p-7 shadow-2xl shadow-black/50 backdrop-blur-xl border border-white/10">
          <Wrench className="text-white animate-bounce" size={48} />
        </div>
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-black text-white">{titulo}</h2>
        {descripcion && (
          <p className="text-slate-400 max-w-md mx-auto leading-relaxed">{descripcion}</p>
        )}
      </div>
    </div>
  );
}
