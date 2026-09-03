import { useState } from 'react';
import { CheckCircle2, Circle, Lock, AlertTriangle, Loader2, PartyPopper } from 'lucide-react';

const ETIQUETAS_RESULTADO = {
  gano: { texto: 'Ganó', clase: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' },
  empato: { texto: 'Empató', clase: 'bg-amber-500/15 text-amber-300 border border-amber-500/30' },
  perdio: { texto: 'Perdió', clase: 'bg-white/10 text-slate-300 border border-white/10' },
};

/**
 * Muestra la base que le toca ahora mismo al equipo, contra quién
 * compite, y el estado de esa base:
 *  - abierta: botones Ganó / Empató / Perdió.
 *  - sellada por el rival mientras esta pantalla estaba en pausa:
 *    mensaje + "Reportar Error / Alerta".
 *  - alerta ya reportada: esperando al Admin.
 */
export default function PartidoGymkanaActual({
  equipoId,
  equipoColor,
  rival,
  estado, // resultado de obtenerEstadoGymkana()
  onCalificar,
  onReportarAlerta,
}) {
  const [cargando, setCargando] = useState(false);

  if (!estado) {
    return (
      <div className="glass-card border-dashed p-6 text-center text-sm text-slate-400">
        La Gymkana todavía no ha sido iniciada por el Admin. Espera a que se generen las rutas.
      </div>
    );
  }

  if (!estado.actual) {
    return (
      <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] backdrop-blur-xl p-6 text-center space-y-2">
        <PartyPopper className="mx-auto text-emerald-400" size={28} />
        <p className="font-semibold text-emerald-300">¡Recorrido completo!</p>
        <p className="text-sm text-emerald-400/80">Este equipo ya calificó sus 6 bases.</p>
      </div>
    );
  }

  const partido = estado.actual;
  const miLado = partido.equipo_a_id === equipoId ? 'a' : 'b';
  const bloqueado = partido.finalizado;

  async function handleCalificar(resultado) {
    setCargando(true);
    try {
      await onCalificar(partido.id, resultado);
    } finally {
      setCargando(false);
    }
  }

  async function handleAlerta() {
    setCargando(true);
    try {
      await onReportarAlerta(partido.id);
    } finally {
      setCargando(false);
    }
  }

  const miResultado = miLado === 'a' ? partido.resultado_a : partido.resultado_b;

  return (
    <div
      className="rounded-2xl border backdrop-blur-xl p-4 bg-white/[0.04] space-y-3 transition-colors"
      style={{ borderColor: bloqueado ? 'rgba(255,255,255,0.1)' : `${equipoColor}80` }}
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold text-white">
          Base {partido.base_id} · {estado.actualIndex + 1} de 6
        </span>
        <span className="text-sm text-slate-400">
          vs{' '}
          <span className="font-semibold" style={{ color: rival?.color_hex }}>
            {rival?.nombre}
          </span>
        </span>
      </div>

      {!bloqueado && (
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleCalificar('gano')}
            disabled={cargando}
            className="py-3 rounded-xl font-semibold text-white bg-gradient-to-b from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-950/50 disabled:opacity-60"
          >
            {cargando ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Ganó'}
          </button>
          <button
            onClick={() => handleCalificar('empato')}
            disabled={cargando}
            className="py-3 rounded-xl font-semibold text-white bg-gradient-to-b from-amber-500 to-amber-600 shadow-lg shadow-amber-950/50 disabled:opacity-60"
          >
            Empató
          </button>
          <button
            onClick={() => handleCalificar('perdio')}
            disabled={cargando}
            className="py-3 rounded-xl font-semibold text-slate-200 bg-white/10 border border-white/10 hover:bg-white/[0.14] disabled:opacity-60"
          >
            Perdió
          </button>
        </div>
      )}

      {bloqueado && !partido.requiere_auditoria && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <CheckCircle2 size={18} className="text-emerald-400" />
            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${ETIQUETAS_RESULTADO[miResultado]?.clase}`}>
              {ETIQUETAS_RESULTADO[miResultado]?.texto}
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Lock size={12} /> Base ya calificada
            </span>
          </div>
          <button onClick={handleAlerta} disabled={cargando} className="btn-danger w-full !bg-none !bg-red-500/10 !text-red-300 border border-red-500/25 !shadow-none hover:!bg-red-500/20">
            {cargando ? <Loader2 className="animate-spin" size={16} /> : <AlertTriangle size={16} />}
            Reportar Error / Alerta
          </button>
        </div>
      )}

      {partido.requiere_auditoria && (
        <div className="flex items-center gap-2 text-sm text-red-300 bg-red-500/10 border border-red-500/25 rounded-xl px-3 py-2.5">
          <AlertTriangle size={16} />
          Alerta enviada al Admin. Esperando resolución.
        </div>
      )}
    </div>
  );
}

export function MiniProgresoGymkana({ recorrido }) {
  return (
    <div className="flex items-center gap-1.5">
      {recorrido.map((p, i) => (
        <span
          key={i}
          title={p ? `Base ${p.base_id}` : ''}
          className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold ${
            p?.finalizado
              ? 'bg-emerald-500 text-white shadow-[0_0_8px_rgba(16,185,129,0.6)]'
              : 'bg-white/10 text-slate-500'
          }`}
        >
          {p?.finalizado ? <CheckCircle2 size={12} /> : <Circle size={12} />}
        </span>
      ))}
    </div>
  );
}
