import { useEffect, useRef, useState } from 'react';
import { Footprints, Loader2, Minus, Plus, RotateCw, Timer, X } from 'lucide-react';

const RAPIDOS = [5, 8, 10, 12, 15, 20];

/**
 * Se abre al pulsar "Rotar": el Admin define cuántos minutos durará la estación
 * a la que llegan los equipos. Cada rotación se confirma por separado; el tiempo
 * NO se arrastra en silencio de una ronda a la siguiente.
 */
export default function ModalRotacion({
  minutosSugeridos = 10,
  ronda,
  totalRondas,
  desplazamientoSegundos = 120,
  procesando = false,
  onConfirmar,
  onCancelar,
}) {
  const [texto, setTexto] = useState(String(minutosSugeridos));
  const campo = useRef(null);
  const minutos = Number.parseInt(texto, 10);
  const valido = Number.isInteger(minutos) && minutos >= 1 && minutos <= 180;
  const despMin = Math.round((desplazamientoSegundos / 60) * 10) / 10;

  useEffect(() => {
    campo.current?.select();
    const tecla = (e) => e.key === 'Escape' && !procesando && onCancelar();
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [onCancelar, procesando]);

  function ajustar(delta) {
    const base = Number.isInteger(minutos) ? minutos : minutosSugeridos;
    setTexto(String(Math.min(180, Math.max(1, base + delta))));
  }

  function enviar(e) {
    e.preventDefault();
    if (valido && !procesando) onConfirmar(minutos);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-rotacion"
      onClick={() => !procesando && onCancelar()}
    >
      <form
        onSubmit={enviar}
        onClick={(e) => e.stopPropagation()}
        className="glass-card w-full max-w-md space-y-5 rounded-b-none p-5 sm:rounded-b-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Rotación a la ronda {ronda} de {totalRondas}
            </p>
            <h2 id="titulo-rotacion" className="text-xl font-black leading-tight text-white">
              ¿Cuántos minutos durará esta estación?
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancelar}
            disabled={procesando}
            aria-label="Cancelar"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => ajustar(-1)}
            aria-label="Un minuto menos"
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/15"
          >
            <Minus size={20} />
          </button>
          <div className="text-center">
            <input
              ref={campo}
              value={texto}
              onChange={(e) => setTexto(e.target.value.replace(/\D/g, '').slice(0, 3))}
              inputMode="numeric"
              aria-label="Minutos de la estación"
              className="field !w-28 text-center font-mono !text-4xl font-black"
            />
            <p className="mt-1 text-xs text-slate-400">minutos</p>
          </div>
          <button
            type="button"
            onClick={() => ajustar(1)}
            aria-label="Un minuto más"
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/15"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Tiempos rápidos">
          {RAPIDOS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setTexto(String(m))}
              aria-pressed={minutos === m}
              className={`rounded-full px-3.5 py-1.5 text-sm font-bold transition ${
                minutos === m ? 'bg-white text-slate-900' : 'bg-white/10 text-slate-200 hover:bg-white/15'
              }`}
            >
              {m} min
            </button>
          ))}
        </div>

        <div className="space-y-1.5 rounded-xl bg-white/[0.05] p-3 text-sm text-slate-200">
          <p className="flex items-start gap-2">
            <Footprints size={16} className="mt-0.5 shrink-0 text-amber-300" />
            <span>
              Primero, <strong className="text-white">{despMin} min</strong> para que los grupos se desplacen.
            </span>
          </p>
          <p className="flex items-start gap-2">
            <Timer size={16} className="mt-0.5 shrink-0 text-emerald-300" />
            <span>
              Luego, <strong className="text-white">{valido ? minutos : '—'} min</strong> de formación en la base
              (empieza sola).
            </span>
          </p>
        </div>

        {!valido && texto !== '' && (
          <p className="text-sm text-red-300">Escribe un número entre 1 y 180.</p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={onCancelar} disabled={procesando} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={!valido || procesando} className="btn-primary">
            {procesando ? <Loader2 className="animate-spin" size={18} /> : <RotateCw size={18} />}
            Rotar ahora
          </button>
        </div>
      </form>
    </div>
  );
}
