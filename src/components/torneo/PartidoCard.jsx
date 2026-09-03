import { useState } from 'react';
import { Lock, Loader2 } from 'lucide-react';

const ETIQUETA_RESULTADO = {
  gano: 'Ganó',
  empato: 'Empató',
  perdio: 'Perdió',
  pendiente: 'Pendiente',
};

export default function PartidoCard({ partido, equipoA, equipoB, esAdmin, onFinalizar }) {
  const [cargando, setCargando] = useState(false);

  const bloqueado = partido.finalizado && !esAdmin;

  async function handleSeleccion(ganador) {
    setCargando(true);
    try {
      await onFinalizar(partido.id, ganador);
    } finally {
      setCargando(false);
    }
  }

  if (!equipoA || !equipoB) {
    return null;
  }

  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Partido {partido.partido_num}</span>
        {partido.finalizado && (
          <span className="flex items-center gap-1">
            <Lock size={12} /> Finalizado
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-center">
        <div className="flex-1">
          <span
            className="inline-block w-3 h-3 rounded-full mr-1 align-middle"
            style={{ backgroundColor: equipoA.color_hex, boxShadow: `0 0 8px ${equipoA.color_hex}` }}
          />
          <span className="font-semibold text-slate-100">{equipoA.nombre}</span>
          {partido.finalizado && (
            <p className="text-xs text-slate-500">{ETIQUETA_RESULTADO[partido.resultado_a]}</p>
          )}
        </div>
        <span className="text-slate-600 font-bold px-2">vs</span>
        <div className="flex-1">
          <span className="font-semibold text-slate-100">{equipoB.nombre}</span>
          <span
            className="inline-block w-3 h-3 rounded-full ml-1 align-middle"
            style={{ backgroundColor: equipoB.color_hex, boxShadow: `0 0 8px ${equipoB.color_hex}` }}
          />
          {partido.finalizado && (
            <p className="text-xs text-slate-500">{ETIQUETA_RESULTADO[partido.resultado_b]}</p>
          )}
        </div>
      </div>

      {bloqueado ? (
        <p className="text-center text-xs text-slate-500 bg-white/[0.03] border border-white/10 rounded-xl py-2">
          Este partido ya fue calificado. Solo el Admin puede editarlo.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleSeleccion('equipo_a')}
            disabled={cargando}
            className="py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 shadow-lg"
            style={{ backgroundColor: equipoA.color_hex, boxShadow: `0 8px 20px -8px ${equipoA.color_hex}` }}
          >
            {cargando ? <Loader2 className="animate-spin mx-auto" size={16} /> : `Ganó ${equipoA.nombre}`}
          </button>
          <button
            onClick={() => handleSeleccion('empate')}
            disabled={cargando}
            className="py-2.5 rounded-xl text-sm font-semibold text-slate-200 bg-white/10 border border-white/10 hover:bg-white/[0.14] disabled:opacity-60"
          >
            Empate
          </button>
          <button
            onClick={() => handleSeleccion('equipo_b')}
            disabled={cargando}
            className="py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 shadow-lg"
            style={{ backgroundColor: equipoB.color_hex, boxShadow: `0 8px 20px -8px ${equipoB.color_hex}` }}
          >
            {cargando ? <Loader2 className="animate-spin mx-auto" size={16} /> : `Ganó ${equipoB.nombre}`}
          </button>
        </div>
      )}
    </div>
  );
}
