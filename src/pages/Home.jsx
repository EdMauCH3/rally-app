import { Link } from 'react-router-dom';
import { Flag, Map, Trophy, Radio } from 'lucide-react';

const ACTIVIDADES = [
  { to: '/gymkana', icon: Flag, nombre: 'Gymkana', desc: '6 bases, rutas emparejadas' },
  { to: '/tesoro', icon: Map, nombre: 'Búsqueda del Tesoro', desc: '10 bases por equipo' },
  { to: '/torneo', icon: Trophy, nombre: 'Torneo', desc: 'Partidos entre los 4 equipos' },
];

export default function Home() {
  return (
    <main className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center text-center px-4 py-12">
        <img
          src="/widelogo.png"
          alt="Interoratorios 2026"
          className="w-full max-w-md object-contain mb-3 animate-fade-up"
        />
        <p className="text-slate-400 text-base sm:text-lg mb-12 animate-fade-up [animation-delay:80ms]">
          Elige una actividad para comenzar
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl mb-12">
          {ACTIVIDADES.map(({ to, icon: Icon, nombre, desc }, i) => (
            <Link
              key={to}
              to={to}
              style={{ animationDelay: `${140 + i * 80}ms` }}
              className="glass-card-hover animate-fade-up group flex flex-col items-center gap-3 px-6 py-8 hover:-translate-y-1"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-brown/25 to-amber-700/20 border border-white/10 text-amber-200 group-hover:from-brand-brown group-hover:to-amber-800 group-hover:text-white transition-all">
                <Icon size={26} />
              </span>
              <span className="font-semibold text-white text-lg">{nombre}</span>
              <span className="text-xs text-slate-500">{desc}</span>
            </Link>
          ))}
        </div>

        <Link
          to="/visor"
          className="animate-fade-up [animation-delay:380ms] inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-red-500 to-rose-500 px-7 py-3.5 font-bold text-white shadow-lg shadow-red-950/60 transition-all hover:scale-[1.03] hover:shadow-red-500/30"
        >
          <Radio size={18} className="animate-glow-pulse" />
          Ver Transmisión en Vivo
        </Link>
    </main>
  );
}
