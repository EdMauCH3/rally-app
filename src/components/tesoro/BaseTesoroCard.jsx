import { useState } from 'react';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

export default function BaseTesoroCard({
  baseId,
  registro,
  equipoColor,
  onMarcarLlegada,
  onCalificar,
}) {
  const [cargando, setCargando] = useState(false);

  const yaLlego = !!registro;
  const yaCalificada = registro?.puntos_evaluacion != null;

  async function handleLlegada() {
    setCargando(true);
    try {
      await onMarcarLlegada(baseId);
    } finally {
      setCargando(false);
    }
  }

  async function handleCalificar(puntos) {
    setCargando(true);
    try {
      await onCalificar(baseId, puntos);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div
      className="rounded-2xl border backdrop-blur-xl p-4 bg-white/[0.04] space-y-3 transition-colors"
      style={{ borderColor: yaCalificada ? 'rgba(255,255,255,0.1)' : `${equipoColor}80` }}
    >
      <span className="font-semibold text-white">Base {baseId}</span>

      {!yaLlego && (
        <button
          onClick={handleLlegada}
          disabled={cargando}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white disabled:opacity-60 shadow-lg"
          style={{ backgroundColor: equipoColor, boxShadow: `0 8px 24px -8px ${equipoColor}` }}
        >
          {cargando ? <Loader2 className="animate-spin" size={18} /> : <Circle size={18} />}
          Marcar Llegada
        </button>
      )}

      {yaLlego && !yaCalificada && (
        <div className="space-y-1.5">
          <p className="text-xs text-slate-400">Califica el desempeño en esta base:</p>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((p) => (
              <button
                key={p}
                onClick={() => handleCalificar(p)}
                disabled={cargando}
                className="py-3 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-500 disabled:opacity-60"
              >
                {p} pt{p > 1 ? 's' : ''}
              </button>
            ))}
          </div>
        </div>
      )}

      {yaCalificada && (
        <div className="flex items-center gap-2 flex-wrap">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span className="text-sm font-semibold px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
            {registro.puntos_totales} pts totales
          </span>
          <span className="text-sm text-slate-500">· Base ya calificada</span>
        </div>
      )}
    </div>
  );
}
