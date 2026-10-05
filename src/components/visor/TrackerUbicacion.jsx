import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { useBasesGymkana } from '../../hooks/useBasesGymkana';
import IconoCopaVino from '../tesoro/IconoCopaVino';

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
              {!ubicacion ? (
                <div className="flex items-center justify-center gap-1 mt-2 text-slate-400">
                  <MapPin size={14} />
                  <span className="text-xs sm:text-sm">Sin iniciar</span>
                </div>
              ) : tab === 'gymkana' ? (
                <>
                  <div className="flex items-center justify-center gap-1 mt-2 text-slate-400">
                    <MapPin size={14} />
                    <span className="text-xs sm:text-sm">Base {ubicacion.base_id}</span>
                  </div>
                  {basesGymkana[ubicacion.base_id]?.lugar && (
                    <p className="mt-0.5 truncate text-[11px] sm:text-xs text-slate-500">
                      {basesGymkana[ubicacion.base_id].lugar}
                    </p>
                  )}
                  {/* Cuántas bases lleva sobre el total de su recorrido */}
                  <p className="mt-1.5 text-xs sm:text-sm font-semibold text-slate-300">
                    <span className="font-black text-white">{ubicacion.completadas ?? 0}</span> de{' '}
                    {ubicacion.total ?? '—'} bases
                  </p>
                </>
              ) : (
                <>
                  {/* Tesoro: cuántas tinajas de vino ha encontrado y cuál fue la última */}
                  <div className="flex items-center justify-center gap-1.5 mt-2 text-slate-300">
                    <IconoCopaVino size={15} className="text-rose-300" />
                    <span className="text-xs sm:text-sm font-semibold">
                      <span className="font-black text-white">{ubicacion.encontradas ?? 0}</span> de{' '}
                      {ubicacion.total ?? '—'} tinajas
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[11px] sm:text-xs text-slate-500">
                    {ubicacion.base_id != null
                      ? `Última: Tinaja ${ubicacion.base_id}`
                      : 'Aún ninguna'}
                  </p>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
