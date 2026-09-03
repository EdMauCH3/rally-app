import { MapPin } from 'lucide-react';

export default function TrackerUbicacion({ equipos, ubicaciones }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {equipos.map((e) => {
        const ubicacion = ubicaciones[e.equipo_id];
        return (
          <div
            key={e.equipo_id}
            className="glass-card p-3 sm:p-4 text-center border-t-2"
            style={{ borderTopColor: e.color_hex }}
          >
            <p className="font-bold text-slate-100 text-sm sm:text-base truncate">{e.nombre}</p>
            <div className="flex items-center justify-center gap-1 mt-2 text-slate-400">
              <MapPin size={14} />
              {ubicacion ? (
                <span className="text-xs sm:text-sm">
                  {ubicacion.modulo} · Base {ubicacion.base_id}
                </span>
              ) : (
                <span className="text-xs sm:text-sm">Sin iniciar</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
