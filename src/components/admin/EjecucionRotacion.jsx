import { useEffect, useState } from 'react';
import { AlertTriangle, Flag, Footprints, Loader2, OctagonX, Play, RotateCcw, RotateCw } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import {
  rotarSiguienteBase,
  marcarUltimaBase,
  terminarRotacion,
  reiniciarConfiguracion,
  repetirRotacion,
} from '../../services/coloresService';
import { obtenerDesfaseConServidor } from '../../services/horaServidorService';
import { calcularFaseRotacion } from '../../hooks/useRotacionFormacion';
import ModalRotacion from './ModalRotacion';

function useAhoraServidor() {
  const [desfaseMs, setDesfaseMs] = useState(0);
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    obtenerDesfaseConServidor().then(setDesfaseMs).catch(() => {});
    const id = setInterval(() => setAhora(Date.now()), 250);
    return () => clearInterval(id);
  }, []);
  return ahora + desfaseMs;
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
  const ahoraServidor = useAhoraServidor();
  const { fase, desplazamientoMs, formacionMs } = calcularFaseRotacion(config, ahoraServidor);
  const desplazando = fase === 'desplazamiento';
  const restanteMs = desplazando ? desplazamientoMs : formacionMs;
  const tiempoAgotado = !desplazando && formacionMs <= 0;
  const [modalRotar, setModalRotar] = useState(false);
  const minutosSugeridos = Math.max(1, Math.round((config.duracion_segundos ?? 600) / 60));
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
          Tus equipos y bases siguen guardados. Puedes repetir la actividad tal cual o ajustar la
          configuración antes de empezar.
        </p>
        <button
          onClick={() => conManejoDeError(repetirRotacion, 'Rotación iniciada de nuevo desde la ronda 1')}
          disabled={procesando}
          className="btn-primary w-full"
        >
          {procesando ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />}
          Repetir con los mismos equipos y bases
        </button>
        <button
          onClick={() => conManejoDeError(reiniciarConfiguracion, 'Lista para ajustar la configuración')}
          disabled={procesando}
          className="btn-secondary w-full"
        >
          <RotateCcw size={16} />
          Ajustar la configuración
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {modalRotar && (
        <ModalRotacion
          minutosSugeridos={minutosSugeridos}
          ronda={config.ronda_actual + 2}
          totalRondas={bases.length}
          desplazamientoSegundos={config.desplazamiento_segundos ?? 120}
          procesando={procesando}
          onCancelar={() => setModalRotar(false)}
          onConfirmar={async (minutos) => {
            setProcesando(true);
            try {
              await rotarSiguienteBase({ minutos });
              showToast(`Rotación avanzada: ${minutos} min en la base tras el desplazamiento`, 'success');
              setModalRotar(false);
              onCambio();
            } catch (err) {
              showToast(err.message ?? 'No se pudo rotar', 'error');
            } finally {
              setProcesando(false);
            }
          }}
        />
      )}
      <div className="glass-card p-6 text-center space-y-2">
        <p className="text-sm text-slate-400">Ronda actual</p>
        <p className="text-4xl font-black text-white">{config.ronda_actual + 1}</p>
        <p
          className={`flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-widest ${
            desplazando ? 'text-amber-300' : 'text-emerald-300'
          }`}
        >
          {desplazando ? (
            <>
              <Footprints size={14} /> Desplazamiento a la siguiente base
            </>
          ) : (
            'Formación en la base'
          )}
        </p>
        <p
          className={`text-3xl font-mono font-bold transition-colors duration-300 ${
            tiempoAgotado ? 'text-red-400' : desplazando ? 'text-amber-300' : 'text-white'
          }`}
        >
          {formatoMMSS(restanteMs)}
        </p>
        {desplazando && (
          <p className="text-xs text-slate-400">
            Después empieza sola la formación ({Math.round((config.duracion_segundos ?? 0) / 60)} min).
          </p>
        )}
        {tiempoAgotado && (
          <p className="flex items-center justify-center gap-2 text-red-400 font-semibold text-sm animate-pulse">
            <AlertTriangle size={16} /> Esperando cambio de BASE
          </p>
        )}
      </div>

      <div className="grid gap-3">
        <button
          onClick={() => setModalRotar(true)}
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

      <div className="glass-card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-300">¿Quieres empezar de nuevo?</h3>
        <p className="text-xs text-slate-400">
          Tus equipos y bases NO se borran en ninguno de los dos casos.
        </p>
        <button
          onClick={() => {
            if (window.confirm('¿Volver a la ronda 1? Los equipos regresan a su base de inicio y el cronómetro arranca de nuevo.')) {
              conManejoDeError(repetirRotacion, 'Rotación reiniciada desde la ronda 1');
            }
          }}
          disabled={procesando}
          className="btn-secondary w-full"
        >
          <RotateCcw size={16} /> Reiniciar desde la ronda 1
        </button>
        <button
          onClick={() => {
            if (window.confirm('¿Detener la rotación y volver a la configuración? Los equipos y bases se conservan.')) {
              conManejoDeError(reiniciarConfiguracion, 'Volviste a la configuración (nada se borró)');
            }
          }}
          disabled={procesando}
          className="btn-ghost w-full justify-center"
        >
          Detener y volver a configurar
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
