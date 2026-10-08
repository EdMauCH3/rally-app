import { useMemo, useState } from 'react';
import { Loader2, Radio } from 'lucide-react';
import { useTorneoFases } from '../../../hooks/useTorneoFases';
import { useEstadoPersistente } from '../../../hooks/useEstadoPersistente';
import { FASES_TORNEO, pestanaDePartido, resumenProgreso } from '../../../services/torneoLogica';
import TarjetaPartido from './TarjetaPartido';
import PanelGrupos from './PanelGrupos';
import PanelCuadrangular from './PanelCuadrangular';
import PanelFinal from './PanelFinal';
import PuntosMacros from './PuntosMacros';
import DetalleEquipoModal from './DetalleEquipoModal';

const IDS = FASES_TORNEO.map((f) => f.id);

/** Pestaña que conviene mostrar al entrar: la del partido en vivo o la fase en curso. */
function pestanaSugerida(partidos, tablas) {
  const vivo = partidos.find((p) => p.estado === 'en_vivo' || p.estado === 'pausado');
  if (vivo) return pestanaDePartido(vivo);
  const de = (f) => partidos.filter((p) => pestanaDePartido(p) === f);
  const cuad = de('cuadrangular');
  const fin = de('finales');
  if (cuad.length && cuad.every((p) => p.finalizado) && fin.some((p) => p.equipo_a_id && p.equipo_b_id)) return 'finales';
  const grupos = de('grupos');
  if (grupos.length && grupos.every((p) => p.finalizado)) return 'cuadrangular';
  return 'grupos';
}

export default function TorneoPublicoFases() {
  const datos = useTorneoFases({ detalle: true });
  const { partidos, tablas, equipos, eventos, penales, jugadores, desfaseMs, cargando, error } = datos;
  const [guardada, setGuardada] = useEstadoPersistente('rally_ui_torneo_pestana', null, (v) => v === null || IDS.includes(v));
  const [equipoId, setEquipoId] = useState(null);

  const sugerida = useMemo(() => pestanaSugerida(partidos, tablas), [partidos, tablas]);
  const pestana = guardada ?? sugerida;
  const vivos = partidos.filter((p) => p.estado === 'en_vivo' || p.estado === 'pausado');
  const prog = resumenProgreso(partidos);

  if (cargando) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-white" size={28} />
      </div>
    );
  }
  if (error) {
    return <p className="py-10 text-center text-slate-400">No se pudo cargar el torneo. Reintentando…</p>;
  }
  if (partidos.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-center text-xl font-black text-white">Torneo</h1>
        <p className="py-8 text-center text-slate-400">Aún no se han generado los partidos.</p>
      </div>
    );
  }

  const ctx = { partidos, tablas, equipos, eventos, penales, jugadores, desfaseMs, onEquipo: setEquipoId };

  return (
    <div className="animate-fade-up space-y-5">
      <header className="text-center">
        <h1 className="text-xl font-black text-white">Torneo</h1>
        <p className="text-xs text-slate-400">
          {prog.finalizados} de {prog.total} partidos jugados
        </p>
      </header>

      {vivos.length > 0 && (
        <section className="space-y-2.5" aria-label="En vivo">
          <h2 className="flex items-center gap-1.5 px-1 text-xs font-bold uppercase tracking-wide text-red-300">
            <Radio size={13} className="animate-pulse" /> En vivo ahora
          </h2>
          {vivos.map((p) => (
            <TarjetaPartido key={p.id} p={p} {...ctx} abiertoInicial />
          ))}
        </section>
      )}

      <nav className="grid grid-cols-3 gap-1 rounded-2xl bg-white/5 p-1" role="tablist" aria-label="Fases del torneo">
        {FASES_TORNEO.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={pestana === f.id}
            onClick={() => setGuardada(f.id)}
            className={`rounded-xl px-1.5 py-2 text-[11px] font-bold leading-tight transition sm:text-sm ${
              pestana === f.id ? 'bg-white text-slate-900 shadow' : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            {f.label}
          </button>
        ))}
      </nav>

      {pestana === 'grupos' && <PanelGrupos ctx={ctx} />}
      {pestana === 'cuadrangular' && <PanelCuadrangular ctx={ctx} />}
      {pestana === 'finales' && <PanelFinal ctx={ctx} />}

      <PuntosMacros refrescarClave={prog.finalizados} />

      <DetalleEquipoModal
        equipo={equipos.find((e) => e.id === equipoId) ?? null}
        jugadores={jugadores}
        tablas={tablas}
        onCerrar={() => setEquipoId(null)}
      />
    </div>
  );
}
