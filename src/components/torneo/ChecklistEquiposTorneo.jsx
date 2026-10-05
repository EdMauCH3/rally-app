import { useEffect, useState } from 'react';
import { Loader2, Shuffle } from 'lucide-react';
import { listarSubEquiposColor } from '../../services/subEquiposColorService';
import { listarEquipos } from '../../services/equiposService';

/**
 * Antes de generar el fixture, el Admin marca explícitamente qué equipos
 * compiten. Sirve igual en modo normal y en Modo Pro (comparten fixture).
 *
 * Se guardan los DESMARCADOS (no los marcados): así, un equipo que se
 * agregue al roster mientras esta pantalla está abierta entra marcado por
 * defecto, en vez de quedar fuera sin que nadie lo note.
 */
export default function ChecklistEquiposTorneo({ roster, generando, onGenerar }) {
  const [desmarcados, setDesmarcados] = useState(() => new Set());
  const [macroPorSubEquipo, setMacroPorSubEquipo] = useState({});

  // Para mostrar de qué Macro-Equipo es cada color. Si falla, solo se omite esa línea.
  useEffect(() => {
    Promise.all([listarSubEquiposColor(), listarEquipos()])
      .then(([subs, macros]) => {
        const nombreMacro = new Map(macros.map((m) => [m.id, m.nombre]));
        setMacroPorSubEquipo(
          Object.fromEntries(subs.map((s) => [s.id, nombreMacro.get(s.macro_equipo_id)]))
        );
      })
      .catch(() => setMacroPorSubEquipo({}));
  }, []);

  const seleccionados = roster.filter((e) => !desmarcados.has(e.id));
  const n = seleccionados.length;
  const totalPartidos = (n * (n - 1)) / 2;

  function alternar(id) {
    setDesmarcados((prev) => {
      const siguiente = new Set(prev);
      if (siguiente.has(id)) siguiente.delete(id);
      else siguiente.add(id);
      return siguiente;
    });
  }

  function handleGenerar() {
    const aviso = `Se generarán ${totalPartidos} partidos con ${n} equipos. Los equipos que no marcaste quedan fuera del fixture y de la tabla.\n\nSi te equivocas, solo se puede rehacer con Reiniciar Evento. ¿Generar ahora?`;
    if (!window.confirm(aviso)) return;
    onGenerar(seleccionados.map((e) => e.id));
  }

  return (
    <div className="space-y-4 text-left">
      <div className="space-y-1 text-center">
        <p className="font-semibold text-white">¿Qué equipos van a competir?</p>
        <p className="text-sm text-slate-400">
          Marca los que entran al fixture (todos contra todos). Aún no se han generado los partidos.
        </p>
      </div>

      <div className="flex justify-end gap-3 text-xs">
        <button
          type="button"
          onClick={() => setDesmarcados(new Set())}
          className="text-slate-400 underline underline-offset-2 hover:text-white transition-colors duration-300"
        >
          Marcar todos
        </button>
        <button
          type="button"
          onClick={() => setDesmarcados(new Set(roster.map((e) => e.id)))}
          className="text-slate-400 underline underline-offset-2 hover:text-white transition-colors duration-300"
        >
          Desmarcar todos
        </button>
      </div>

      <div className="space-y-2">
        {roster.map((e) => {
          const marcado = !desmarcados.has(e.id);
          const macro = macroPorSubEquipo[e.sub_equipo_id];
          return (
            <label
              key={e.id}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-3.5 py-3 transition-all duration-300 ${
                marcado
                  ? 'border-brand-brown bg-brand-brown/10'
                  : 'border-white/10 bg-white/[0.02] opacity-60'
              }`}
            >
              <input
                type="checkbox"
                checked={marcado}
                onChange={() => alternar(e.id)}
                className="h-5 w-5 shrink-0 cursor-pointer accent-[#733f2d]"
              />
              <span
                className="h-3.5 w-3.5 shrink-0 rounded-full"
                style={{ backgroundColor: e.color_hex }}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-white">{e.nombre}</span>
                <span className="block truncate text-xs text-slate-400">
                  {e.es_exclusivo
                    ? 'Equipo adicional (solo Torneo)'
                    : macro
                      ? `Macro-Equipo: ${macro}`
                      : 'Color de Torneo'}
                </span>
              </span>
            </label>
          );
        })}
      </div>

      <p className="text-center text-sm text-slate-300">
        <span className="font-bold text-white">{n}</span>{' '}
        {n === 1 ? 'equipo seleccionado' : 'equipos seleccionados'}
        {n >= 2 && (
          <>
            {' '}
            · <span className="font-bold text-white">{totalPartidos}</span>{' '}
            {totalPartidos === 1 ? 'partido' : 'partidos'}
          </>
        )}
      </p>

      {n < 2 && (
        <p className="text-center text-xs text-amber-400">
          Marca al menos 2 equipos para poder generar el fixture.
        </p>
      )}

      <button
        type="button"
        onClick={handleGenerar}
        disabled={generando || n < 2}
        className="btn-primary mx-auto disabled:opacity-50"
      >
        {generando ? <Loader2 className="animate-spin" size={18} /> : <Shuffle size={18} />}
        Generar fixture
      </button>
    </div>
  );
}
