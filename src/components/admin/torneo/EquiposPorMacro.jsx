import { useState } from 'react';
import { ChevronDown, Loader2, LogOut, Pencil, Plus, RotateCcw, Trash2, Users } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { resumenInscripcion } from '../../../services/torneoLogica';
import { quitarEquipoDelTorneo, reactivarEquipo } from '../../../services/torneoService';
import FormularioEquipoTorneo from './FormularioEquipoTorneo';
import PlantillaEquipoInline from './PlantillaEquipoInline';
import { ModalRetiro } from './ModalesPartidoAdmin';

/**
 * Equipos del torneo organizados por Macro-equipo. No hay cantidad fija: cada Macro-equipo
 * puede tener los equipos que necesite (1, 2, 5…) y todos suman a su marcador general.
 */
export default function EquiposPorMacro({ macros, equipos, jugadores = [], partidos = [], onCambio }) {
  const { showToast } = useToast();
  const [formulario, setFormulario] = useState(null); // { equipo?, macroId? }
  const [procesandoId, setProcesandoId] = useState(null);
  const [plantillaAbierta, setPlantillaAbierta] = useState(null);
  const [retiro, setRetiro] = useState(null);

  const { porMacro, total, activos, sinGrupo } = resumenInscripcion(macros, equipos);
  const hayPartidos = partidos.length > 0;
  const tienePartidos = (id) => partidos.some((p) => p.equipo_a_id === id || p.equipo_b_id === id);
  const pendientesDe = (id) =>
    partidos.filter((p) => !p.finalizado && (p.equipo_a_id === id || p.equipo_b_id === id)).length;

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

  async function handleReactivar(equipo) {
    setProcesandoId(equipo.id);
    try {
      await reactivarEquipo(equipo.id);
      showToast(`${equipo.nombre} volvió al torneo. Sus partidos ya declarados W.O. se pueden reabrir desde el Calendario.`, 'success');
      onCambio();
    } catch (err) {
      showToast(err.message ?? 'No se pudo reactivar', 'error');
    } finally {
      setProcesandoId(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="glass-card space-y-1 p-4 text-sm text-slate-300">
        <p>
          <strong className="text-white">{activos}</strong> equipos activos
          {total !== activos && <> · {total - activos} retirados</>}. Cada equipo se afilia a un Macro-equipo; los puntos que gane
          (y las rojas que reste) van directo a ese Macro-equipo, sin importar cuántos equipos tenga.
        </p>
        {sinGrupo > 0 && (
          <p className="text-xs text-amber-400">
            {sinGrupo} {sinGrupo === 1 ? 'equipo no está' : 'equipos no están'} en ningún grupo: ve a la pestaña Grupos.
          </p>
        )}
        {macros.length === 0 && (
          <p className="text-xs text-amber-400">Primero crea los Macro-equipos en Admin → Equipos.</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {porMacro.map(({ macro, equipos: lista, activos: nAct, retirados }) => (
          <section key={macro.id} className="glass-card overflow-hidden" style={{ borderColor: `${macro.color_hex}66` }}>
            <header className="flex items-center gap-3 px-4 py-3" style={{ backgroundColor: `${macro.color_hex}22` }}>
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base font-black text-white"
                style={{ backgroundColor: macro.color_hex }}
              >
                {macro.nombre.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate font-bold text-white">{macro.nombre}</p>
                <p className="text-xs text-slate-400">
                  {nAct} {nAct === 1 ? 'equipo' : 'equipos'}
                  {retirados > 0 && ` · ${retirados} retirado${retirados > 1 ? 's' : ''}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormulario({ macroId: macro.id })}
                className="ml-auto inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-white/20"
              >
                <Plus size={14} /> Equipo
              </button>
            </header>

            <div className="space-y-2 p-3">
              {lista.length === 0 && <p className="px-1 py-3 text-center text-sm text-slate-500">Aún sin equipos.</p>}
              {lista.map((eq) => {
                const retiradoEq = eq.estado === 'retirado';
                return (
                  <div key={eq.id} className={`glass-row space-y-2 px-3 py-2.5 ${retiradoEq ? 'opacity-70' : ''}`}>
                    <div className="flex items-center gap-3">
                      <span
                        className="h-4 w-4 shrink-0 rounded-full"
                        style={{ backgroundColor: eq.color_hex, boxShadow: `0 0 8px ${eq.color_hex}88` }}
                      />
                      <span className="min-w-0 flex-1">
                        <span className={`block break-words font-semibold leading-tight text-white ${retiradoEq ? 'line-through' : ''}`}>
                          {eq.nombre}
                        </span>
                        <span className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                          {eq.grupo ? <span className="rounded bg-white/10 px-1.5 font-bold text-slate-300">Grupo {eq.grupo}</span> : <span className="text-amber-400">Sin grupo</span>}
                          {retiradoEq && <span className="rounded bg-red-500/20 px-1.5 font-bold uppercase text-red-300">Retirado</span>}
                          {eq.descripcion && <span className="truncate">{eq.descripcion}</span>}
                        </span>
                        {retiradoEq && eq.motivo_retiro && (
                          <span className="block text-[11px] text-red-300/80">Motivo: {eq.motivo_retiro}</span>
                        )}
                      </span>
                      {procesandoId === eq.id ? (
                        <Loader2 className="animate-spin text-slate-400" size={16} />
                      ) : (
                        <span className="flex shrink-0 items-center">
                          <button type="button" aria-label="Editar equipo" onClick={() => setFormulario({ equipo: eq })} className="p-1.5 text-slate-400 hover:text-white">
                            <Pencil size={15} />
                          </button>
                          {retiradoEq ? (
                            <button type="button" aria-label="Reactivar equipo" title="Reactivar" onClick={() => handleReactivar(eq)} className="p-1.5 text-emerald-300 hover:text-emerald-200">
                              <RotateCcw size={15} />
                            </button>
                          ) : (
                            hayPartidos && (
                              <button type="button" aria-label="Retirar equipo" title="Retirar del torneo" onClick={() => setRetiro(eq)} className="p-1.5 text-amber-300 hover:text-amber-200">
                                <LogOut size={15} />
                              </button>
                            )
                          )}
                          {!tienePartidos(eq.id) && (
                            <button type="button" aria-label="Eliminar equipo" onClick={() => handleQuitar(eq)} className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/10">
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
                      <ChevronDown size={14} className={`ml-auto transition-transform duration-300 ${plantillaAbierta === eq.id ? 'rotate-180' : ''}`} />
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

      {formulario && (
        <FormularioEquipoTorneo
          macros={macros}
          equipo={formulario.equipo ?? null}
          macroInicialId={formulario.macroId ?? null}
          macroBloqueadoPorPartidos={formulario.equipo ? tienePartidos(formulario.equipo.id) : false}
          onCerrar={() => setFormulario(null)}
          onGuardado={() => {
            setFormulario(null);
            onCambio();
          }}
        />
      )}

      {retiro && (
        <ModalRetiro
          equipo={retiro}
          partidosPendientes={pendientesDe(retiro.id)}
          onCerrar={() => setRetiro(null)}
          onHecho={() => {
            setRetiro(null);
            onCambio();
          }}
        />
      )}
    </div>
  );
}

