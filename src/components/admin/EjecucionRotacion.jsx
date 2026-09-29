import { useEffect, useState } from 'react';
import { AlertTriangle, Flag, Loader2, OctagonX, RotateCw } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import {
  rotarSiguienteBase,
  marcarUltimaBase,
  terminarRotacion,
  reiniciarConfiguracion,
} from '../../services/coloresService';

function useCuentaRegresiva(tiempoFin) {
  const [restanteMs, setRestanteMs] = useState(0);

  useEffect(() => {
    function tick() {
      if (!tiempoFin) {
        setRestanteMs(0);
        return;
      }
      setRestanteMs(Math.max(0, new Date(tiempoFin).getTime() - Date.now()));
    }
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [tiempoFin]);

  return restanteMs;
}

function formatoMMSS(ms) {
  const totalSeg = Math.ceil(ms / 1000);
  const m = Math.floor(totalSeg / 60)
    .toString()
    .padStart(2, '0');
  const s = (totalSeg % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function EjecucionRotacion({ config, bases, equipos, onCambio }) {
  const { showToast } = useToast();
  const [procesando, setProcesando] = useState(false);
  const restanteMs = useCuentaRegresiva(config.tiempo_fin);
  const tiempoAgotado = restanteMs <= 0;
  const terminado = config.estado === 'terminado';

  async function conManejoDeError(accion, mensajeExito) {
    setProcesando(true);
    try {
      await accion();
      if (mensajeExito) showToast(mensajeExito, 'success');
      onCambio();
    } catch (err) {
      showToast(err.message ?? 'Ocurrió un error', 'error');
    } finally {
      setProcesando(false);
    }
  }

  function equipoBaseActual(equipo) {
    if (bases.length === 0) return null;
    const idx = (equipo.orden + config.ronda_actual) % bases.length;
    return bases[idx];
  }

  if (terminado) {
    return (
      <div className="glass-card p-6 max-w-lg space-y-4 text-center">
        <h2 className="text-xl font-bold text-white">La rotación ha terminado</h2>
        <p className="text-slate-300 text-sm">
          Puedes configurar una nueva rotación cuando quieras.
        </p>
        <button
          onClick={() => conManejoDeError(reiniciarConfiguracion, 'Lista para configurar de nuevo')}
          disabled={procesando}
          className="btn-secondary"
        >
          {procesando && <Loader2 className="animate-spin" size={16} />}
          Configurar nueva rotación
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="glass-card p-6 text-center space-y-2">
        <p className="text-sm text-slate-400">Ronda actual</p>
        <p className="text-4xl font-black text-white">{config.ronda_actual + 1}</p>
        <p
          className={`text-3xl font-mono font-bold transition-colors duration-300 ${
            tiempoAgotado ? 'text-red-400' : 'text-white'
          }`}
        >
          {formatoMMSS(restanteMs)}
        </p>
        {tiempoAgotado && (
          <p className="flex items-center justify-center gap-2 text-red-400 font-semibold text-sm animate-pulse">
            <AlertTriangle size={16} /> Esperando cambio de BASE
          </p>
        )}
      </div>

      <div className="grid gap-3">
        <button
          onClick={() => conManejoDeError(rotarSiguienteBase, 'Rotación avanzada')}
          disabled={procesando}
          className="btn-primary w-full !py-6 !text-xl"
        >
          {procesando ? <Loader2 className="animate-spin" size={24} /> : <RotateCw size={24} />}
          Rotar a siguiente base
        </button>

        <button
          onClick={() => conManejoDeError(() => marcarUltimaBase(!config.ultima_base))}
          disabled={procesando}
          className={`btn-secondary w-full !py-4 transition-all duration-300 ${
            config.ultima_base ? '!border-red-500/60 !bg-red-500/10 !text-red-300' : ''
          }`}
        >
          <Flag size={18} />
          {config.ultima_base
            ? 'Última base ACTIVADA (toca para desactivar)'
            : 'Marcar como Última Base'}
        </button>

        <button
          onClick={() => {
            if (window.confirm('¿Terminar la rotación ahora? Esta acción no se puede deshacer.')) {
              conManejoDeError(terminarRotacion, 'Rotación terminada');
            }
          }}
          disabled={procesando}
          className="btn-danger w-full !py-4"
        >
          <OctagonX size={18} /> Terminar Ahora
        </button>
      </div>

      <div className="glass-card p-4 space-y-2">
        <h3 className="text-sm font-semibold text-slate-300">Equipos en esta ronda</h3>
        {equipos.map((eq) => {
          const base = equipoBaseActual(eq);
          return (
            <div
              key={eq.id}
              className="flex items-center justify-between text-sm glass-row px-3 py-2"
            >
              <span className="flex items-center gap-2 font-medium text-white">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: eq.color_hex }} />
                {eq.nombre}
              </span>
              <span className="text-slate-400">
                {base ? `${base.nombre} · ${base.lugar}` : '—'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
