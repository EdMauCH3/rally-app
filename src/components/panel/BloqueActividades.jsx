import { useState } from 'react';
import { Flag, Trophy, Map } from 'lucide-react';
import GymkanaPage from '../../pages/GymkanaPage';
import TorneoPage from '../../pages/TorneoPage';
import TesoroPage from '../../pages/TesoroPage';

const MODULOS = {
  gymkana: {
    nombre: 'Gymkana',
    icon: Flag,
    clases: 'from-emerald-500 to-emerald-700',
    Componente: GymkanaPage,
  },
  torneo: {
    nombre: 'Torneo',
    icon: Trophy,
    clases: 'from-violet-500 to-violet-700',
    Componente: TorneoPage,
  },
  tesoro: {
    nombre: 'Búsqueda del Tesoro',
    icon: Map,
    clases: 'from-amber-500 to-amber-700',
    Componente: TesoroPage,
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
  const [seleccionado, setSeleccionado] = useState(claves[0]);

  if (claves.length === 0) {
    return (
      <p className="text-center text-slate-400 py-12">
        No tienes ninguna actividad asignada todavía.
      </p>
    );
  }

  // Un solo rol asignado (staff_gymkana / staff_tesoro / arbitro): se
  // muestra directo, sin selector, porque no hay nada entre que elegir.
  if (claves.length === 1) {
    const { Componente } = MODULOS[claves[0]];
    return <Componente />;
  }

  // Admin: puede cambiar entre los 3 modulos con un selector de colores.
  const moduloActivo = MODULOS[seleccionado] ?? MODULOS[claves[0]];
  const ComponenteActivo = moduloActivo.Componente;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-2 max-w-xl mx-auto">
        {claves.map((clave) => {
          const def = MODULOS[clave];
          const Icon = def.icon;
          const activo = clave === seleccionado;
          return (
            <button
              key={clave}
              onClick={() => setSeleccionado(clave)}
              className={`flex flex-col items-center gap-2 rounded-2xl p-4 transition-all duration-300 ease-in-out ${
                activo
                  ? `bg-gradient-to-br ${def.clases} shadow-xl shadow-black/40 scale-105`
                  : 'bg-white/5 border border-white/10 hover:bg-white/10'
              }`}
            >
              <Icon size={24} className="text-white" />
              <span className="text-xs font-bold text-white text-center leading-tight">
                {def.nombre}
              </span>
            </button>
          );
        })}
      </div>

      <ComponenteActivo />
    </div>
  );
}
