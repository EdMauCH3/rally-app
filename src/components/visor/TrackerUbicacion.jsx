import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { useBasesGymkana } from '../../hooks/useBasesGymkana';
import IconoGota from '../tesoro/IconoGota';

const TABS = [
  { id: 'gymkana', label: 'Ubicación en Gymkana' },
  { id: 'tesoro', label: 'Ubicación en Las Tinajas Perdidas' },
];

export default function TrackerUbicacion({ equiposGenerales, ubicacionesGymkana, ubicacionesTesoro }) {
  const [tab, setTab] = useState('gymkana');
  const basesGymkana = useBasesGymkana();

  const ubicaciones = tab === 'gymkana' ? ubicacionesGymkana : ubicacionesTesoro;

  function ubicacionDe(equipoId) {
    return ubicaciones.find((u) => u.equipo_id === equipoId) ?? null;
  }

  // Gymkana: cada macro-equipo tiene 2 escuadras; se muestran las dos.
  function escuadrasDe(equipoId) {
    return ubicaciones
      .filter((u) => u.equipo_id === equipoId)
      .sort((a, b) => String(a.sub_nombre).localeCompare(String(b.sub_nombre)));
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
                <div className="mt-2 space-y-2">
                  {escuadrasDe(eq.equipo_id).map((u) => (
                    <div key={u.sub_nombre ?? u.base_id} className="rounded-lg bg-white/[0.04] px-2 py-1.5">
                      {u.sub_nombre && (
                        <p className="truncate text-[11px] font-bold uppercase tracking-wide text-slate-300">
                          {u.sub_nombre}
                        </p>
                      )}
                      <div className="flex items-center justify-center gap-1 text-slate-400">
                        <MapPin size={13} />
                        <span className="text-xs sm:text-sm">Base {u.base_id}</span>
                        {basesGymkana[u.base_id]?.lugar && (
                          <span className="truncate text-[11px] text-slate-500">
                            · {basesGymkana[u.base_id].lugar}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-slate-300">
                        <span className="font-black text-white">{u.completadas ?? 0}</span> de{' '}
                        {u.total ?? '—'} bases
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {/* Tinajas: cuántas tinajas ha encontrado y cuál fue la última */}
                  <div className="flex items-center justify-center gap-1.5 mt-2 text-slate-300">
                    <IconoGota size={15} className="text-cyan-400" />
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
