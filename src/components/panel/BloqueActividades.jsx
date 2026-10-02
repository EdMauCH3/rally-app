import { Flag, Trophy, Map } from 'lucide-react';

const DEFINICIONES = {
  gymkana: {
    nombre: 'Gymkana',
    icon: Flag,
    clases: 'from-emerald-500 to-emerald-700 shadow-emerald-950/50',
  },
  torneo: {
    nombre: 'Torneo',
    icon: Trophy,
    clases: 'from-violet-500 to-violet-700 shadow-violet-950/50',
  },
  tesoro: {
    nombre: 'Búsqueda del Tesoro',
    icon: Map,
    clases: 'from-amber-500 to-amber-700 shadow-amber-950/50',
  },
};

// Cada rol de staff ve SOLO su actividad asignada; el Admin las ve todas.
const ACTIVIDADES_POR_ROL = {
  staff_gymkana: ['gymkana'],
  arbitro: ['torneo'],
  staff_tesoro: ['tesoro'],
  admin: ['gymkana', 'torneo', 'tesoro'],
};

export default function BloqueActividades({ rol }) {
  const claves = ACTIVIDADES_POR_ROL[rol] ?? [];

  if (claves.length === 0) {
    return (
      <p className="text-center text-slate-400 py-12">
        No tienes ninguna actividad asignada todavía.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
      {claves.map((clave, i) => {
        const def = DEFINICIONES[clave];
        const Icon = def.icon;
        return (
          <div
            key={clave}
            style={{ animationDelay: `${i * 80}ms` }}
            className={`animate-fade-up relative rounded-3xl bg-gradient-to-br ${def.clases} p-8 shadow-2xl flex flex-col items-center gap-3 text-center transition-all duration-300 ease-in-out hover:scale-105`}
          >
            <span className="absolute top-3 right-3 text-[10px] uppercase tracking-wide font-bold bg-black/25 text-white/80 px-2 py-0.5 rounded-full">
              Próximamente
            </span>
            <Icon size={40} className="text-white drop-shadow" />
            <span className="text-2xl font-black text-white">{def.nombre}</span>
            <span className="text-xs text-white/80">Disponible aquí en la Fase 4</span>
          </div>
        );
      })}
    </div>
  );
}
