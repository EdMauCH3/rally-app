import { useEffect, useState } from 'react';
import { listarPuntosTorneoMacros } from '../../../services/torneoService';

/** Puntos que el torneo le suma a cada macro-equipo en el marcador general. */
export default function PuntosMacros({ refrescarClave }) {
  const [filas, setFilas] = useState(null);
  useEffect(() => {
    let vivo = true;
    listarPuntosTorneoMacros()
      .then((d) => vivo && setFilas(d))
      .catch(() => vivo && setFilas([]));
    return () => {
      vivo = false;
    };
  }, [refrescarClave]);

  if (!filas || filas.length === 0) return null;
  const orden = [...filas].sort((a, b) => (b.total_torneo ?? 0) - (a.total_torneo ?? 0));

  return (
    <div className="glass-card p-4">
      <h3 className="text-sm font-semibold text-slate-300">Puntos del torneo para el Rally</h3>
      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {orden.map((m) => (
          <div key={m.equipo_id} className="glass-row px-3 py-2.5 text-center">
            <span className="mx-auto mb-1 block h-1.5 w-8 rounded-full" style={{ backgroundColor: m.color_hex }} />
            <p className="truncate text-xs text-slate-300">{m.nombre}</p>
            <p className="text-xl font-black text-white">{m.total_torneo ?? 0}</p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-slate-500">3 por victoria · 1 por empate · −1 por tarjeta roja</p>
    </div>
  );
}
