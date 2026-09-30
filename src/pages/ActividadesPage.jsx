import { Link } from 'react-router-dom';
import { Flag, Map, Trophy, Radio } from 'lucide-react';

const ACTIVIDADES = [
  { to: '/gymkana', icon: Flag, nombre: 'Gymkana', desc: 'Rutas emparejadas por base' },
  { to: '/tesoro', icon: Map, nombre: 'Búsqueda del Tesoro', desc: '10 bases por equipo' },
  { to: '/torneo', icon: Trophy, nombre: 'Torneo', desc: 'Partidos entre equipos' },
  { to: '/visor', icon: Radio, nombre: 'Live Transmission', desc: 'Marcador en vivo' },
];

export default function ActividadesPage() {
  return (
    <main className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center text-center px-4 py-12">
      <h1 className="text-2xl sm:text-4xl font-black text-white mb-2 animate-fade-up">
        Actividad de la Tarde
      </h1>
      <p className="text-slate-400 text-base sm:text-lg mb-12 animate-fade-up [animation-delay:80ms]">
        Elige a dónde quieres ir
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
        {ACTIVIDADES.map(({ to, icon: Icon, nombre, desc }, i) => (
          <Link
            key={to}
            to={to}
            style={{ animationDelay: `${140 + i * 80}ms` }}
            className="glass-card-hover animate-fade-up group flex flex-col items-center gap-3 px-6 py-8 hover:-translate-y-1"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-brown/25 to-amber-700/20 border border-white/10 text-amber-200 group-hover:from-brand-brown group-hover:to-amber-800 group-hover:text-white transition-all duration-300">
              <Icon size={26} />
            </span>
            <span className="font-semibold text-white text-lg">{nombre}</span>
            <span className="text-xs text-slate-500">{desc}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
