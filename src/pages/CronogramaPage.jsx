import { Wrench, HardHat, Sparkles } from 'lucide-react';

export default function CronogramaPage() {
  return (
    <main className="relative min-h-[calc(100vh-64px)] flex items-center justify-center px-6 py-16 text-center overflow-hidden">
      {/* Velo azul sobre el fondo global (bg.png) */}
      <div className="absolute inset-0 bg-brand-navy/55" />

      <div className="relative z-10 max-w-lg space-y-8 animate-fade-up">
        <div className="relative flex items-center justify-center">
          <Sparkles
            className="absolute -top-5 -left-8 text-amber-300 animate-pulse"
            size={26}
          />
          <Sparkles
            className="absolute -bottom-3 -right-10 text-brand-brown animate-pulse"
            size={20}
            style={{ animationDelay: '0.5s' }}
          />
          <div className="rounded-full bg-gradient-to-br from-brand-brown/30 to-brand-navy/40 p-8 sm:p-10 shadow-2xl shadow-black/50 backdrop-blur-xl border border-white/10">
            <Wrench className="text-white animate-bounce" size={64} />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
            Cronograma en construcción
          </h1>
          <p className="text-lg sm:text-xl text-white/75 max-w-md mx-auto leading-relaxed">
            Estamos afinando los horarios del día. Muy pronto podrás verlos aquí.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-white/60 tracking-wide uppercase font-semibold">
          <HardHat size={18} className="text-brand-brown" />
          Vuelve más tarde
        </div>
      </div>
    </main>
  );
}
