import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, Loader2, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { listarRosterTorneo } from '../../services/torneoService';
import {
  listarPartidosPro,
  listarEventosTorneo,
  listarJugadoresTorneo,
  crearEventoAdmin,
  actualizarEventoAdmin,
  eliminarEventoAdmin,
  reabrirPartido,
  suscribirseTorneoPro,
} from '../../services/torneoProService';

const TIPOS = [
  { valor: 'gol', emoji: '⚽', label: 'Gol' },
  { valor: 'amarilla', emoji: '🟨', label: 'Amarilla' },
  { valor: 'roja', emoji: '🟥', label: 'Roja' },
];

const ESTADO_BADGE = {
  en_vivo: {
    texto: 'EN VIVO',
    clase: 'bg-red-500/15 text-red-300 border border-red-500/30 animate-pulse',
  },
  pausado: {
    texto: 'PAUSADO',
    clase: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  },
  finalizado: {
    texto: 'FINALIZADO',
    clase: 'bg-white/10 text-slate-300 border border-white/10',
  },
  pendiente: {
    texto: 'PENDIENTE',
    clase: 'bg-white/5 text-slate-400 border border-white/10',
  },
};

export default function HistorialEventosTorneo({ modoPro }) {
  const { showToast } = useToast();
  const [partidos, setPartidos] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [jugadores, setJugadores] = useState([]);
  const [roster, setRoster] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [abiertoId, setAbiertoId] = useState(null);
  const [form, setForm] = useState(null); // { partidoId, eventoId|null, tipo, jugadorId, minuto, autogol }
  const [guardando, setGuardando] = useState(false);
  const [procesandoId, setProcesandoId] = useState(null);

  const cargar = useCallback(() => {
    Promise.all([
      listarPartidosPro(),
      listarEventosTorneo(),
      listarJugadoresTorneo(),
      listarRosterTorneo(),
    ])
      .then(([p, e, j, r]) => {
        setPartidos(p);
        setEventos(e);
        setJugadores(j);
        setRoster(r);
      })
      .catch(() => showToast('No se pudo cargar el historial del Torneo', 'error'))
      .finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    cargar();
    const unsubscribe = suscribirseTorneoPro(cargar);
    return unsubscribe;
  }, [cargar]);

  function equipoDe(id) {
    return roster.find((e) => e.id === id);
  }

  function eventosDe(partidoId) {
    return eventos.filter((e) => e.partido_id === partidoId);
  }

  function abrirFormNuevo(partidoId) {
    setForm({ partidoId, eventoId: null, tipo: 'gol', jugadorId: '', minuto: '', autogol: false });
  }

  function abrirFormEditar(ev) {
    setForm({
      partidoId: ev.partido_id,
      eventoId: ev.id,
      tipo: ev.tipo,
      jugadorId: ev.jugador_id ?? '',
      minuto: String(ev.minuto),
      autogol: ev.autogol,
    });
  }

  async function handleGuardar(e) {
    e.preventDefault();
    const jugador = jugadores.find((j) => j.id === form.jugadorId);
    if (!jugador) {
      showToast('Elige un jugador', 'error');
      return;
    }
    const minuto = Number(form.minuto);
    if (form.minuto === '' || !Number.isInteger(minuto) || minuto < 0) {
      showToast('El minuto debe ser un número entero (0 o más)', 'error');
      return;
    }

    const datos = {
      tipo: form.tipo,
      jugadorId: jugador.id,
      equipoTorneoId: jugador.equipo_torneo_id,
      minuto,
      autogol: form.autogol,
    };

    setGuardando(true);
    try {
      if (form.eventoId) {
        await actualizarEventoAdmin(form.eventoId, datos);
      } else {
        await crearEventoAdmin({ partidoId: form.partidoId, ...datos });
      }
      showToast('Evento guardado', 'success');
      setForm(null);
      cargar();
    } catch (err) {
      showToast(err.message ?? 'No se pudo guardar el evento', 'error');
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminar(ev) {
    if (!window.confirm('¿Borrar este evento? El marcador y los puntos se recalculan solos.')) return;
    setProcesandoId(ev.id);
    try {
      await eliminarEventoAdmin(ev.id);
      showToast('Evento borrado', 'success');
      cargar();
    } catch (err) {
      showToast(err.message ?? 'No se pudo borrar el evento', 'error');
    } finally {
      setProcesandoId(null);
    }
  }

  async function handleReabrir(partido) {
    if (
      !window.confirm(
        `¿Reabrir el Partido ${partido.partido_num}? Quedará pausado y sin resultado, para que el árbitro lo retome.`
      )
    ) {
      return;
    }
    setProcesandoId(partido.id);
    try {
      await reabrirPartido(partido.id);
      showToast('Partido reabierto', 'success');
      cargar();
    } catch (err) {
      showToast(err.message ?? 'No se pudo reabrir el partido', 'error');
    } finally {
      setProcesandoId(null);
    }
  }

  if (cargando) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="animate-spin text-white" size={24} />
      </div>
    );
  }

  // Con el Modo Pro apagado y sin ningún evento guardado, no hay nada que mostrar.
  if (!modoPro && eventos.length === 0) return null;

  return (
    <section className="space-y-3 max-w-2xl mx-auto">
      <div>
        <h2 className="font-semibold text-white">Historial y correcciones</h2>
        <p className="text-sm text-slate-400 mt-1">
          Cada gol y tarjeta, partido por partido. Al corregir uno, el marcador, el resultado y los
          puntos se recalculan solos.
        </p>
      </div>

      {partidos.length === 0 && (
        <p className="glass-card p-4 text-sm text-slate-400">
          Aún no hay partidos. Genera el fixture primero.
        </p>
      )}

      {partidos.map((p) => {
        const equipoA = equipoDe(p.equipo_a_id);
        const equipoB = equipoDe(p.equipo_b_id);
        const badge = ESTADO_BADGE[p.estado] ?? ESTADO_BADGE.pendiente;
        const abierto = abiertoId === p.id;
        const lista = eventosDe(p.id);

        return (
          <div key={p.id} className="glass-card overflow-hidden">
            <button
              type="button"
              onClick={() => setAbiertoId(abierto ? null : p.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.03] transition-colors duration-300"
            >
              <span className="text-xs font-bold text-slate-500 w-6 shrink-0">#{p.partido_num}</span>
              <span className="flex-1 min-w-0 text-sm font-semibold text-white truncate">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 align-middle"
                  style={{ backgroundColor: equipoA?.color_hex }}
                />
                {equipoA?.nombre}
                <span className="mx-2 text-lg font-black tabular-nums">
                  {p.goles_a} - {p.goles_b}
                </span>
                {equipoB?.nombre}
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full ml-1.5 align-middle"
                  style={{ backgroundColor: equipoB?.color_hex }}
                />
              </span>
              <span className={`hidden sm:inline text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${badge.clase}`}>
                {badge.texto}
              </span>
              <ChevronDown
                size={18}
                className={`shrink-0 text-slate-400 transition-transform duration-300 ${abierto ? 'rotate-180' : ''}`}
              />
            </button>

            {abierto && (
              <div className="border-t border-white/10 px-4 py-4 space-y-3">
                <div className="flex items-center justify-between gap-2 sm:hidden">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.clase}`}>
                    {badge.texto}
                  </span>
                </div>

                {lista.length === 0 && (
                  <p className="text-sm text-slate-500">Este partido aún no tiene eventos.</p>
                )}

                {lista.map((ev) => {
                  const eq = equipoDe(ev.equipo_torneo_id);
                  const tipo = TIPOS.find((t) => t.valor === ev.tipo);
                  return (
                    <div key={ev.id} className="glass-row px-3 py-2.5 flex items-center gap-3">
                      <span className="w-9 shrink-0 text-sm font-bold text-slate-300 tabular-nums">
                        {ev.minuto}'
                      </span>
                      <span className="text-lg shrink-0">{tipo?.emoji}</span>
                      <span className="flex-1 min-w-0 text-sm text-slate-100">
                        <span className="font-semibold">
                          {ev.jugador_dorsal != null ? `#${ev.jugador_dorsal} ` : ''}
                          {ev.jugador_nombre ?? 'Jugador eliminado'}
                        </span>
                        {ev.autogol && <span className="text-amber-300"> (autogol)</span>}
                        {ev.automatica && (
                          <span className="text-amber-300"> (roja por doble amarilla)</span>
                        )}
                        <span className="block text-xs text-slate-500">
                          <span
                            className="inline-block w-2 h-2 rounded-full mr-1 align-middle"
                            style={{ backgroundColor: eq?.color_hex }}
                          />
                          {eq?.nombre}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => abrirFormEditar(ev)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300"
                        aria-label="Editar evento"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEliminar(ev)}
                        disabled={procesandoId === ev.id}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-300 disabled:opacity-50"
                        aria-label="Borrar evento"
                      >
                        {procesandoId === ev.id ? (
                          <Loader2 className="animate-spin" size={15} />
                        ) : (
                          <Trash2 size={15} />
                        )}
                      </button>
                    </div>
                  );
                })}

                {form && form.partidoId === p.id ? (
                  <form
                    onSubmit={handleGuardar}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3"
                  >
                    <p className="text-sm font-semibold text-white">
                      {form.eventoId ? 'Editar evento' : 'Agregar evento'}
                    </p>

                    <div className="grid grid-cols-3 gap-2">
                      {TIPOS.map((t) => (
                        <button
                          key={t.valor}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, tipo: t.valor }))}
                          className={`rounded-xl border-2 py-2 text-sm font-semibold transition-all duration-300 ${
                            form.tipo === t.valor
                              ? 'border-brand-brown bg-brand-brown/15 text-white'
                              : 'border-white/10 text-slate-400 hover:border-white/20'
                          }`}
                        >
                          <span className="mr-1">{t.emoji}</span>
                          {t.label}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-1.5">
                      <label className="field-label">Jugador</label>
                      <select
                        value={form.jugadorId}
                        onChange={(e) => setForm((f) => ({ ...f, jugadorId: e.target.value }))}
                        className="field"
                        style={{ colorScheme: 'dark' }}
                      >
                        <option value="">Selecciona jugador</option>
                        {[p.equipo_a_id, p.equipo_b_id].map((eqId) => (
                          <optgroup key={eqId} label={equipoDe(eqId)?.nombre ?? 'Equipo'}>
                            {jugadores
                              .filter((j) => j.equipo_torneo_id === eqId)
                              .map((j) => (
                                <option key={j.id} value={j.id}>
                                  #{j.dorsal} {j.nombre}
                                </option>
                              ))}
                          </optgroup>
                        ))}
                      </select>
                      {jugadores.filter((j) =>
                        [p.equipo_a_id, p.equipo_b_id].includes(j.equipo_torneo_id)
                      ).length === 0 && (
                        <p className="text-xs text-amber-300">
                          Estos equipos aún no tienen jugadores inscritos.
                        </p>
                      )}
                    </div>

                    <div className="flex items-end gap-4">
                      <div className="space-y-1.5 w-28">
                        <label className="field-label">Minuto</label>
                        <input
                          type="number"
                          min={0}
                          value={form.minuto}
                          onChange={(e) => setForm((f) => ({ ...f, minuto: e.target.value }))}
                          className="field"
                        />
                      </div>
                      {form.tipo === 'gol' && (
                        <label className="flex items-center gap-2 pb-3 text-sm text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.autogol}
                            onChange={(e) => setForm((f) => ({ ...f, autogol: e.target.checked }))}
                            className="h-4 w-4"
                          />
                          Autogol
                        </label>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button type="submit" disabled={guardando} className="btn-primary flex-1">
                        {guardando && <Loader2 className="animate-spin" size={16} />}
                        Guardar
                      </button>
                      <button type="button" onClick={() => setForm(null)} className="btn-secondary">
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => abrirFormNuevo(p.id)} className="btn-secondary">
                      <Plus size={16} /> Agregar evento
                    </button>
                    {p.finalizado && (
                      <button
                        type="button"
                        onClick={() => handleReabrir(p)}
                        disabled={procesandoId === p.id}
                        className="btn-secondary disabled:opacity-50"
                      >
                        {procesandoId === p.id ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          <RotateCcw size={16} />
                        )}
                        Reabrir partido
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
