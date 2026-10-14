import { useMemo, useState } from 'react';
import { Loader2, Radio } from 'lucide-react';
import { useTorneoFases } from '../../../hooks/useTorneoFases';
import { useEstadoPersistente } from '../../../hooks/useEstadoPersistente';
import { pestanaDePartido, pestanasVisibles, resumenProgreso } from '../../../services/torneoLogica';
import TarjetaPartido from './TarjetaPartido';
import PanelGrupos from './PanelGrupos';
import PanelCuadrangular from './PanelCuadrangular';
import PanelLlaves from './PanelLlaves';
import PuntosMacros from './PuntosMacros';
import DetalleEquipoModal from './DetalleEquipoModal';
import InsigniaEquipo from './InsigniaEquipo';

/** Pestaña que conviene mostrar al entrar: la del partido en vivo o la etapa en curso. */
function pestanaSugerida(partidos, pestanas) {
  const vivo = partidos.find((p) => !p.finalizado && (p.estado === 'en_vivo' || p.estado === 'pausado'));
  if (vivo) return pestanaDePartido(vivo);
  for (const t of pestanas) {
    const delTab = partidos.filter((p) => pestanaDePartido(p) === t.id);
    if (delTab.some((p) => !p.finalizado)) return t.id;
  }
  return pestanas[pestanas.length - 1]?.id ?? 'grupos';
}

/** Mientras no hay partidos: los equipos inscritos, agrupados por Macro-equipo. */
function EquiposInscritos({ equipos, macros, onEquipo }) {
  const activos = equipos.filter((e) => e.estado !== 'retirado');
  if (activos.length === 0) return null;
  return (
    <div className="space-y-3">
      <h2 className="px-1 text-xs font-bold uppercase tracking-wide text-slate-400">Equipos inscritos</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {macros
          .filter((m) => activos.some((e) => e.macro_equipo_id === m.id))
          .map((m) => (
            <div key={m.id} className="glass-card space-y-2 p-3" style={{ borderColor: `${m.color_hex}55` }}>
              <p className="flex items-center gap-2 text-sm font-black text-white">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: m.color_hex }} />
                {m.nombre}
              </p>
              {activos
                .filter((e) => e.macro_equipo_id === m.id)
                .map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => onEquipo(e.id)}
                    className="glass-row flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm font-semibold text-white hover:bg-white/10"
                  >
                    <InsigniaEquipo colorEquipo={e.color_hex} colorMacro={m.color_hex} macroNombre={m.nombre} tamano={26} />
                    {e.nombre}
                  </button>
                ))}
            </div>
          ))}
      </div>
    </div>
  );
}

export default function TorneoPublicoFases() {
  const datos = useTorneoFases({ detalle: true });
  const { partidos, tablas, equipos, macros, etapas, eventos, penales, jugadores, desfaseMs, cargando, error } = datos;
  const pestanas = useMemo(() => pestanasVisibles(partidos, equipos), [partidos, equipos]);
  const ids = pestanas.map((t) => t.id);
  const [guardada, setGuardada] = useEstadoPersistente('rally_ui_torneo_pestana', null, (v) => v === null || typeof v === 'string');
  const [equipoId, setEquipoId] = useState(null);

  const sugerida = useMemo(() => pestanaSugerida(partidos, pestanas), [partidos, pestanas]);
  const pestana = guardada && ids.includes(guardada) ? guardada : sugerida;
  const vivos = partidos.filter((p) => !p.finalizado && (p.estado === 'en_vivo' || p.estado === 'pausado'));
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

  const ctx = { partidos, tablas, equipos, etapas, eventos, penales, jugadores, desfaseMs, onEquipo: setEquipoId };

  if (partidos.length === 0) {
    return (
      <div className="animate-fade-up space-y-5">
        <h1 className="text-center text-xl font-black text-white">Torneo</h1>
        <p className="py-4 text-center text-slate-400">Aún no se han publicado los partidos. ¡Pronto!</p>
        <EquiposInscritos equipos={equipos} macros={macros} onEquipo={setEquipoId} />
        <PuntosMacros refrescarClave={0} />
        <DetalleEquipoModal
          equipo={equipos.find((e) => e.id === equipoId) ?? null}
          equipos={equipos}
          jugadores={jugadores}
          tablas={tablas}
          onCerrar={() => setEquipoId(null)}
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-up space-y-5">
      <header className="text-center">
        <h1 className="text-xl font-black text-white">Torneo</h1>
        <p className="text-xs text-slate-400">
          {prog.finalizados} de {prog.total} partidos jugados
          {prog.walkovers > 0 && ` · ${prog.walkovers} por W.O.`}
        </p>
      </header>

      {vivos.length > 0 && (
        <section className="space-y-2.5" aria-label="En vivo">
          <h2 className="flex items-center gap-1.5 px-1 text-xs font-bold uppercase tracking-wide text-red-300">
            <Radio size={13} className="animate-pulse" /> En vivo ahora
          </h2>
          {vivos.map((p) => (
            <TarjetaPartido key={p.id} p={p} {...ctx} abiertoInicial resaltarFase />
          ))}
        </section>
      )}

      {pestanas.length > 1 && (
        <nav className="flex gap-1 rounded-2xl bg-white/5 p-1" role="tablist" aria-label="Fases del torneo">
          {pestanas.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={pestana === f.id}
              onClick={() => setGuardada(f.id)}
              className={`flex-1 rounded-xl px-1.5 py-2 text-[11px] font-bold leading-tight transition sm:text-sm ${
                pestana === f.id ? 'bg-white text-slate-900 shadow' : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              {f.label}
            </button>
          ))}
        </nav>
      )}

      {pestana === 'grupos' && <PanelGrupos ctx={ctx} />}
      {pestana === 'cuadrangular' && <PanelCuadrangular ctx={ctx} />}
      {pestana === 'llaves' && <PanelLlaves ctx={ctx} />}

      <PuntosMacros refrescarClave={prog.finalizados} />

      <DetalleEquipoModal
        equipo={equipos.find((e) => e.id === equipoId) ?? null}
        equipos={equipos}
        jugadores={jugadores}
        tablas={tablas}
        onCerrar={() => setEquipoId(null)}
      />
    </div>
  );
}
