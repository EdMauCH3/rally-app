import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { useBasesGymkana } from '../../hooks/useBasesGymkana';

const TABS = [
  { id: 'gymkana', label: 'Ubicación en Gymkana' },
  { id: 'tesoro', label: 'Ubicación en Búsqueda del Tesoro' },
];

export default function TrackerUbicacion({ equiposGenerales, ubicacionesGymkana, ubicacionesTesoro }) {
  const [tab, setTab] = useState('gymkana');
  const basesGymkana = useBasesGymkana();

  const ubicaciones = tab === 'gymkana' ? ubicacionesGymkana : ubicacionesTesoro;

  function ubicacionDe(equipoId) {
    return ubicaciones.find((u) => u.equipo_id === equipoId) ?? null;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-center gap-1 border-b border-white/10">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`tab-pill ${tab === t.id ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {t.label}
            {tab === t.id && (
              <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand-brown" />
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {equiposGenerales.map((eq) => {
          const ubicacion = ubicacionDe(eq.equipo_id);
          return (
            <div
              key={eq.equipo_id}
              className="glass-card p-3 sm:p-4 text-center transition-all duration-300"
              style={{ borderTop: `4px solid ${eq.color_hex}` }}
            >
              <p className="font-bold text-white text-sm sm:text-base truncate">{eq.nombre}</p>
              <div className="flex items-center justify-center gap-1 mt-2 text-slate-400">
                <MapPin size={14} />
                {ubicacion ? (
                  <span className="text-xs sm:text-sm">Base {ubicacion.base_id}</span>
                ) : (
                  <span className="text-xs sm:text-sm">Sin iniciar</span>
                )}
              </div>
              {/* Los números de base del Tesoro son otros: el lugar solo aplica a la Gymkana */}
              {tab === 'gymkana' && ubicacion && basesGymkana[ubicacion.base_id]?.lugar && (
                <p className="mt-0.5 truncate text-[11px] sm:text-xs text-slate-500">
                  {basesGymkana[ubicacion.base_id].lugar}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
