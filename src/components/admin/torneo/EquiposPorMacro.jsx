import { useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, Loader2, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { etiquetaGrupo, revisarPlantilla } from '../../../services/torneoLogica';
import { moverEquipoTorneo, quitarEquipoDelTorneo } from '../../../services/torneoService';
import FormularioEquipoTorneo from './FormularioEquipoTorneo';
import PlantillaEquipoInline from './PlantillaEquipoInline';

/**
 * Los 12 equipos del torneo, organizados por macro-equipo (= grupo).
 * Cada grupo tiene 3 posiciones (A1, A2, A3…) que definen el fixture.
 */
export default function EquiposPorMacro({ macros, equipos, jugadores = [], fixtureGenerado, onCambio }) {
  const { showToast } = useToast();
  const [formulario, setFormulario] = useState(null); // { equipo?, macroId? }
  const [procesandoId, setProcesandoId] = useState(null);
  const [plantillaAbierta, setPlantillaAbierta] = useState(null); // id del equipo con la plantilla desplegada

  const { grupos, problemas } = revisarPlantilla(macros, equipos);
  const totalEquipos = equipos.length;

  async function handleMover(equipo, slotNuevo) {
    setProcesandoId(equipo.id);
    try {
      await moverEquipoTorneo(equipo.id, slotNuevo);
      onCambio();
    } catch (err) {
      showToast(err.message ?? 'No se pudo mover el equipo', 'error');
    } finally {
      setProcesandoId(null);
    }
  }

  async function handleQuitar(equipo) {
    if (!window.confirm(`¿Quitar "${equipo.nombre}" del torneo? También se borra su plantilla de jugadores.`)) return;
    setProcesandoId(equipo.id);
    try {
      await quitarEquipoDelTorneo(equipo.id);
      showToast('Equipo eliminado', 'success');
      onCambio();
    } catch (err) {
      showToast(err.message ?? 'No se pudo eliminar', 'error');
    } finally {
      setProcesandoId(null);
    }
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <ol className="grid grid-cols-3 gap-2 text-center text-[11px] font-bold uppercase leading-tight tracking-wide text-slate-300 sm:text-xs">
        {['Macro-equipo (grupo)', 'Equipo de microfútbol', 'Plantilla de jugadores'].map((t, i) => (
          <li key={t} className="rounded-xl bg-white/[0.06] px-2 py-2.5">
            <span className="mb-1 mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm font-black text-slate-900">
              {i + 1}
            </span>
            {t}
          </li>
        ))}
      </ol>

      <div className="glass-card p-4 text-sm text-slate-300 space-y-1">
        <p>
          <strong className="text-white">{totalEquipos} de 12</strong> equipos creados. Cada
          macro-equipo es un grupo con 3 equipos; los puntos que ganen (y las rojas que resten) van
          directo a su macro-equipo.
        </p>
        {fixtureGenerado && (
          <p className="text-amber-400 text-xs">
            El fixture ya está generado: puedes editar nombre, color y descripción, pero no mover
            equipos de grupo ni eliminarlos.
          </p>
        )}
        {!fixtureGenerado && problemas.length > 0 && (
          <p className="text-xs text-slate-500">{problemas[0]}</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {grupos.map((g) => (
          <section
            key={g.macro.id}
            className="glass-card overflow-hidden"
            style={{ borderColor: `${g.macro.color_hex}66` }}
          >
            <header
              className="flex items-center gap-3 px-4 py-3"
              style={{ backgroundColor: `${g.macro.color_hex}22` }}
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl text-base font-black text-white"
                style={{ backgroundColor: g.macro.color_hex }}
              >
                {g.letra}
              </span>
              <div className="min-w-0">
                <p className="truncate font-bold text-white">{etiquetaGrupo(g.letra, g.macro.nombre)}</p>
                <p className="truncate text-xs text-slate-400">Se actualiza solo con el Macro-equipo</p>
              </div>
              <span className="ml-auto text-xs text-slate-400">{g.total}/3</span>
            </header>

            <div className="space-y-2 p-3">
              {g.casillas.map((eq, i) => {
                const slot = i + 1;
                if (!eq) {
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={fixtureGenerado}
                      onClick={() => setFormulario({ macroId: g.macro.id })}
                      className="flex w-full items-center gap-3 rounded-xl border border-dashed border-white/15 px-3 py-3 text-left text-sm text-slate-400 transition-colors hover:border-white/30 hover:text-white disabled:opacity-40"
                    >
                      <span className="w-7 text-xs font-bold text-slate-500">
                        {g.letra}
                        {slot}
                      </span>
                      <Plus size={16} />
                      Agregar equipo
                    </button>
                  );
                }
                return (
                  <div key={eq.id} className="glass-row space-y-2 px-3 py-2.5">
                    <div className="flex items-center gap-3">
                    <span className="w-7 shrink-0 text-xs font-bold text-slate-400">
                      {g.letra}
                      {slot}
                    </span>
                    <span
                      className="h-4 w-4 shrink-0 rounded-full"
                      style={{ backgroundColor: eq.color_hex, boxShadow: `0 0 8px ${eq.color_hex}88` }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block break-words font-semibold text-white leading-tight">
                        {eq.nombre}
                      </span>
                      {eq.descripcion && (
                        <span className="block truncate text-xs text-slate-500">{eq.descripcion}</span>
                      )}
                    </span>
                    {procesandoId === eq.id ? (
                      <Loader2 className="animate-spin text-slate-400" size={16} />
                    ) : (
                      <span className="flex shrink-0 items-center">
                        {!fixtureGenerado && (
                          <>
                            <button
                              type="button"
                              aria-label="Subir posición"
                              disabled={slot === 1}
                              onClick={() => handleMover(eq, slot - 1)}
                              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-25"
                            >
                              <ArrowUp size={15} />
                            </button>
                            <button
                              type="button"
                              aria-label="Bajar posición"
                              disabled={slot === 3}
                              onClick={() => handleMover(eq, slot + 1)}
                              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-25"
                            >
                              <ArrowDown size={15} />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          aria-label="Editar equipo"
                          onClick={() => setFormulario({ equipo: eq })}
                          className="p-1.5 text-slate-400 hover:text-white"
                        >
                          <Pencil size={15} />
                        </button>
                        {!fixtureGenerado && (
                          <button
                            type="button"
                            aria-label="Eliminar equipo"
                            onClick={() => handleQuitar(eq)}
                            className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </span>
                    )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setPlantillaAbierta((v) => (v === eq.id ? null : eq.id))}
                      aria-expanded={plantillaAbierta === eq.id}
                      className="flex w-full items-center gap-2 rounded-lg bg-white/[0.05] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
                    >
                      <Users size={14} />
                      Plantilla · {jugadores.filter((j) => j.equipo_torneo_id === eq.id).length} jugadores
                      <ChevronDown
                        size={14}
                        className={`ml-auto transition-transform duration-300 ${plantillaAbierta === eq.id ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {plantillaAbierta === eq.id && (
                      <PlantillaEquipoInline
                        equipo={eq}
                        jugadores={jugadores.filter((j) => j.equipo_torneo_id === eq.id)}
                        onCambio={onCambio}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {macros.length !== 4 && (
        <p className="text-center text-xs text-amber-400">
          El torneo necesita exactamente 4 macro-equipos (hay {macros.length}). Créalos en Admin →
          Equipos.
        </p>
      )}

      {formulario && (
        <FormularioEquipoTorneo
          macros={macros}
          equipo={formulario.equipo ?? null}
          macroInicialId={formulario.macroId ?? null}
          fixtureGenerado={fixtureGenerado}
          onCerrar={() => setFormulario(null)}
          onGuardado={() => {
            setFormulario(null);
            onCambio();
          }}
        />
      )}
    </div>
  );
}
