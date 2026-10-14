import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { listarRosterTorneo, suscribirseRosterTorneo } from '../../services/torneoService';
import {
  listarEstadoJugadores,
  crearJugador,
  actualizarJugador,
  eliminarJugador,
  suscribirseTorneoPro,
} from '../../services/torneoProService';
import { etiquetaGrupo } from '../../services/torneoLogica';
import { useEstadoPersistente } from '../../hooks/useEstadoPersistente';

/** Tamaño de plantilla de referencia para el contador "8/12 jugadores". */
export const MAX_JUGADORES = 12;

function siguienteDorsalLibre(lista) {
  const usados = new Set(lista.map((j) => j.dorsal));
  for (let n = 1; n <= 99; n += 1) {
    if (!usados.has(n)) return n;
  }
  return '';
}

function mensajeDeError(err) {
  // 23505 = violación de unicidad: el dorsal ya existe en ese equipo.
  if (err?.code === '23505') return 'Ese dorsal ya lo tiene otro jugador de este equipo.';
  return err?.message ?? 'No se pudo guardar el jugador';
}

function dorsalValido(texto) {
  const d = Number(texto);
  return texto !== '' && Number.isInteger(d) && d >= 0 && d <= 99;
}

/** Contador visual "8/12" con barra: verde al completar, ámbar si se pasa. */
function ContadorJugadores({ cantidad, color }) {
  const pct = Math.min(100, (cantidad / MAX_JUGADORES) * 100);
  const pasado = cantidad > MAX_JUGADORES;
  const completo = cantidad === MAX_JUGADORES;
  return (
    <div className="space-y-1.5">
      <p className="flex items-baseline justify-between text-sm">
        <span className="text-slate-400">Inscritos</span>
        <span className={`font-black ${pasado ? 'text-amber-300' : completo ? 'text-emerald-300' : 'text-white'}`}>
          {cantidad}/{MAX_JUGADORES} <span className="text-xs font-semibold text-slate-400">jugadores</span>
        </span>
      </p>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: pasado ? '#fbbf24' : completo ? '#34d399' : color }}
        />
      </div>
    </div>
  );
}

export default function InscripcionJugadores() {
  const { showToast } = useToast();
  const [roster, setRoster] = useState([]);
  const [jugadores, setJugadores] = useState([]);
  const [grupoSel, setGrupoSel] = useEstadoPersistente('rally_ui_inscripcion_grupo', null);
  const [equipoId, setEquipoId] = useEstadoPersistente('rally_ui_inscripcion_equipo', null);
  const [cargando, setCargando] = useState(true);

  const [nuevo, setNuevo] = useState({ dorsal: '', nombre: '' });
  const [errorDorsal, setErrorDorsal] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [edicion, setEdicion] = useState({ dorsal: '', nombre: '' });
  const [errorEdicion, setErrorEdicion] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [procesandoId, setProcesandoId] = useState(null);
  const dorsalRef = useRef(null);
  const nombreRef = useRef(null);

  const cargar = useCallback(() => {
    Promise.all([listarRosterTorneo(), listarEstadoJugadores()])
      .then(([r, j]) => {
        setRoster(r);
        setJugadores(j);
      })
      .catch(() => showToast('No se pudo cargar la plantilla', 'error'))
      .finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    cargar();
    const cancelar = [suscribirseTorneoPro(cargar), suscribirseRosterTorneo(cargar)];
    return () => cancelar.forEach((fn) => fn());
  }, [cargar]);

  // Grupos A-D con sus equipos (la etiqueta sale del Macro-equipo: "Grupo A - Verde").
  const grupos = useMemo(() => {
    const mapa = new Map();
    for (const e of roster) {
      if (!e.grupo) continue;
      if (!mapa.has(e.grupo)) {
        mapa.set(e.grupo, { letra: e.grupo, nombre: e.macro_nombre, color: e.macro_color, equipos: [] });
      }
      mapa.get(e.grupo).equipos.push(e);
    }
    return [...mapa.values()]
      .sort((a, b) => a.letra.localeCompare(b.letra))
      .map((g) => ({ ...g, equipos: g.equipos.sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0)) }));
  }, [roster]);

  const contador = useMemo(() => {
    const m = new Map();
    for (const j of jugadores) m.set(j.equipo_torneo_id, (m.get(j.equipo_torneo_id) ?? 0) + 1);
    return m;
  }, [jugadores]);

  const grupoActivo = grupos.find((g) => g.letra === grupoSel) ?? grupos[0] ?? null;
  const equipo = roster.find((e) => e.id === equipoId) ?? null;
  const delEquipo = useMemo(
    () =>
      jugadores
        .filter((j) => j.equipo_torneo_id === equipoId)
        .sort((a, b) => a.dorsal - b.dorsal),
    [jugadores, equipoId]
  );
  const sancionados = delEquipo.filter((j) => j.sancionado);

  // Si el equipo recordado ya no existe, se vuelve a la vista de grupos.
  useEffect(() => {
    if (!cargando && equipoId && !roster.some((e) => e.id === equipoId)) setEquipoId(null);
  }, [cargando, roster, equipoId, setEquipoId]);

  function abrirEquipo(eq) {
    setEquipoId(eq.id);
    setEditandoId(null);
    setErrorDorsal('');
    const lista = jugadores.filter((j) => j.equipo_torneo_id === eq.id);
    setNuevo({ dorsal: String(siguienteDorsalLibre(lista)), nombre: '' });
  }

  function volver() {
    setEquipoId(null);
    setEditandoId(null);
  }

  function dorsalOcupado(dorsalTexto, exceptoId = null) {
    const d = Number(dorsalTexto);
    return delEquipo.find((j) => j.dorsal === d && j.jugador_id !== exceptoId) ?? null;
  }

  async function handleAgregar(e) {
    e.preventDefault();
    const nombre = nuevo.nombre.trim();
    const dorsal = Number(nuevo.dorsal);
    if (!dorsalValido(nuevo.dorsal)) {
      setErrorDorsal('El dorsal debe ser un número entre 0 y 99');
      dorsalRef.current?.focus();
      return;
    }
    const repetido = dorsalOcupado(nuevo.dorsal);
    if (repetido) {
      setErrorDorsal(`El #${dorsal} ya lo tiene ${repetido.nombre}`);
      dorsalRef.current?.select();
      return;
    }
    if (!nombre) {
      showToast('Escribe el nombre completo del jugador', 'error');
      nombreRef.current?.focus();
      return;
    }

    setGuardando(true);
    try {
      await crearJugador({ equipoTorneoId: equipoId, nombre, dorsal });
      const lista = [...delEquipo, { dorsal }];
      setNuevo({ dorsal: String(siguienteDorsalLibre(lista)), nombre: '' });
      setErrorDorsal('');
      cargar();
      nombreRef.current?.focus(); // listo para el siguiente jugador, sin soltar el teclado
    } catch (err) {
      if (err?.code === '23505') setErrorDorsal('Ese dorsal ya lo tiene otro jugador de este equipo.');
      else showToast(mensajeDeError(err), 'error');
    } finally {
      setGuardando(false);
    }
  }

  function abrirEdicion(j) {
    setEditandoId(j.jugador_id);
    setEdicion({ dorsal: String(j.dorsal), nombre: j.nombre });
    setErrorEdicion('');
  }

  async function handleGuardarEdicion(j) {
    const nombre = edicion.nombre.trim();
    const dorsal = Number(edicion.dorsal);
    if (!nombre) {
      setErrorEdicion('El nombre no puede quedar vacío');
      return;
    }
    if (!dorsalValido(edicion.dorsal)) {
      setErrorEdicion('El dorsal debe ser un número entre 0 y 99');
      return;
    }
    const repetido = dorsalOcupado(edicion.dorsal, j.jugador_id);
    if (repetido) {
      setErrorEdicion(`El #${dorsal} ya lo tiene ${repetido.nombre}`);
      return;
    }

    setProcesandoId(j.jugador_id);
    try {
      await actualizarJugador(j.jugador_id, { nombre, dorsal });
      setEditandoId(null);
      cargar();
    } catch (err) {
      setErrorEdicion(mensajeDeError(err));
    } finally {
      setProcesandoId(null);
    }
  }

  async function handleEliminar(j) {
    const tieneEventos = j.goles + j.amarillas + j.rojas > 0;
    const aviso = tieneEventos
      ? `¿Borrar a #${j.dorsal} ${j.nombre}? Tiene goles o tarjetas registrados: el historial los conserva con su nombre.`
      : `¿Borrar a #${j.dorsal} ${j.nombre} de la plantilla?`;
    if (!window.confirm(aviso)) return;

    setProcesandoId(j.jugador_id);
    try {
      await eliminarJugador(j.jugador_id);
      cargar();
    } catch (err) {
      showToast(err.message ?? 'No se pudo borrar al jugador', 'error');
    } finally {
      setProcesandoId(null);
    }
  }

  if (cargando) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-white" size={28} />
      </div>
    );
  }

  // ───────────────────────── Vista 2: planilla de un equipo ─────────────────────────
  if (equipo) {
    const etiqueta = etiquetaGrupo(equipo.grupo, equipo.macro_nombre);
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 animate-fade-up">
        <button
          type="button"
          onClick={volver}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/10 py-2 pl-2.5 pr-4 text-sm font-semibold text-slate-100 transition hover:bg-white/15"
        >
          <ChevronLeft size={18} /> Volver a los equipos
        </button>

        <header
          className="glass-card space-y-3 p-4"
          style={{ borderLeft: `8px solid ${equipo.color_hex}` }}
        >
          <div className="flex items-center gap-3">
            <span
              className="h-11 w-11 shrink-0 rounded-full border-2 border-white/30"
              style={{ backgroundColor: equipo.color_hex, boxShadow: `0 0 18px 2px ${equipo.color_hex}66` }}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <h3 className="truncate text-xl font-black text-white">{equipo.nombre}</h3>
              <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-400">{etiqueta}</p>
            </div>
          </div>
          <ContadorJugadores cantidad={delEquipo.length} color={equipo.color_hex} />
        </header>

        {sancionados.length > 0 && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-red-500/30 bg-red-500/[0.07] px-4 py-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-300" />
            <p className="text-sm text-red-200">
              {sancionados.length === 1
                ? '1 jugador sancionado: el equipo jugará con uno menos'
                : `${sancionados.length} jugadores sancionados: el equipo jugará con ${sancionados.length} menos`}{' '}
              en su próximo partido.
            </p>
          </div>
        )}

        {/* 1 · Formulario inline: Enter en el dorsal salta al nombre; Enter en el nombre guarda */}
        <form
          onSubmit={handleAgregar}
          className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4"
        >
          <p className="text-sm font-bold text-white">Agregar jugador</p>
          <div className="flex gap-2">
            <input
              ref={dorsalRef}
              type="number"
              inputMode="numeric"
              min={0}
              max={99}
              value={nuevo.dorsal}
              onChange={(e) => {
                setNuevo((n) => ({ ...n, dorsal: e.target.value }));
                setErrorDorsal('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  nombreRef.current?.focus();
                }
              }}
              placeholder="#"
              aria-label="Dorsal"
              aria-invalid={!!errorDorsal}
              className={`field !w-20 shrink-0 text-center !text-lg !font-black ${
                errorDorsal ? '!border-red-400' : ''
              }`}
            />
            <input
              ref={nombreRef}
              value={nuevo.nombre}
              onChange={(e) => setNuevo((n) => ({ ...n, nombre: e.target.value }))}
              placeholder="Nombre completo"
              aria-label="Nombre completo"
              autoComplete="off"
              className="field min-w-0 flex-1"
            />
            <button
              type="submit"
              disabled={guardando}
              className="btn-primary shrink-0 !px-4"
              aria-label="Agregar jugador"
            >
              {guardando ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
              <span className="hidden sm:inline">Agregar</span>
            </button>
          </div>
          {errorDorsal ? (
            <p role="alert" className="text-sm font-semibold text-red-300">
              {errorDorsal}
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              Escribe el dorsal, presiona Enter, escribe el nombre y Enter otra vez: se guarda y queda listo el
              siguiente.
            </p>
          )}
        </form>

        {/* 2 · Grilla de jugadores */}
        {delEquipo.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/15 py-8 text-center text-sm text-slate-400">
            Este equipo aún no tiene jugadores inscritos.
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {delEquipo.map((j) =>
              editandoId === j.jugador_id ? (
                <li key={j.jugador_id} className="glass-row space-y-1.5 px-3 py-2.5 sm:col-span-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={99}
                      value={edicion.dorsal}
                      onChange={(e) => {
                        setEdicion((d) => ({ ...d, dorsal: e.target.value }));
                        setErrorEdicion('');
                      }}
                      aria-label="Dorsal"
                      className="field !w-16 !px-2 text-center font-bold"
                    />
                    <input
                      autoFocus
                      value={edicion.nombre}
                      onChange={(e) => {
                        setEdicion((d) => ({ ...d, nombre: e.target.value }));
                        setErrorEdicion('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleGuardarEdicion(j);
                        }
                        if (e.key === 'Escape') setEditandoId(null);
                      }}
                      aria-label="Nombre completo"
                      className="field min-w-0 flex-1 !px-3"
                    />
                    <button
                      type="button"
                      onClick={() => handleGuardarEdicion(j)}
                      disabled={procesandoId === j.jugador_id}
                      className="rounded-lg p-2 text-emerald-300 transition hover:bg-emerald-500/10 disabled:opacity-50"
                      aria-label="Guardar cambios"
                    >
                      {procesandoId === j.jugador_id ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <Check size={18} />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditandoId(null)}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10"
                      aria-label="Cancelar"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  {errorEdicion && (
                    <p role="alert" className="text-sm font-semibold text-red-300">
                      {errorEdicion}
                    </p>
                  )}
                </li>
              ) : (
                <li
                  key={j.jugador_id}
                  className={`glass-row flex items-center gap-3 px-3 py-2.5 ${
                    j.sancionado ? '!border-red-500/40 !bg-red-500/[0.06]' : ''
                  }`}
                >
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-black text-white drop-shadow"
                    style={{ backgroundColor: equipo.color_hex }}
                  >
                    {j.dorsal}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-white">{j.nombre}</p>
                    {(j.goles > 0 || j.amarillas > 0 || j.rojas > 0) && (
                      <p className="flex gap-3 text-xs text-slate-400">
                        {j.goles > 0 && <span>⚽ {j.goles}</span>}
                        {j.amarillas > 0 && <span>🟨 {j.amarillas}</span>}
                        {j.rojas > 0 && <span>🟥 {j.rojas}</span>}
                      </p>
                    )}
                    {j.sancionado && (
                      <p className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-red-300">
                        <AlertTriangle size={12} />
                        Sancionado: no juega el partido #{j.partido_sancion_num}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => abrirEdicion(j)}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
                    aria-label={`Editar a ${j.nombre}`}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEliminar(j)}
                    disabled={procesandoId === j.jugador_id}
                    className="rounded-lg p-2 text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                    aria-label={`Borrar a ${j.nombre}`}
                  >
                    {procesandoId === j.jugador_id ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </li>
              )
            )}
          </ul>
        )}
      </div>
    );
  }

  // ───────────────────────── Vista 1: grupos y tarjetas de equipo ─────────────────────────
  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4">
      <div className="space-y-1 text-center">
        <h2 className="text-lg font-black text-white">Inscripción de jugadores</h2>
        <p className="text-sm text-slate-400">Elige el grupo y toca un equipo para armar su planilla.</p>
      </div>

      {grupos.length === 0 ? (
        <p className="glass-card p-5 text-center text-sm text-slate-400">
          Aún no hay equipos del torneo. El Admin debe crearlos (Admin → Torneo → Equipos y plantillas).
        </p>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Grupos">
            {grupos.map((g) => {
              const activo = g.letra === grupoActivo?.letra;
              return (
                <button
                  key={g.letra}
                  type="button"
                  role="tab"
                  aria-selected={activo}
                  onClick={() => setGrupoSel(g.letra)}
                  className={`flex shrink-0 items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-bold transition ${
                    activo ? 'bg-white text-slate-900' : 'bg-white/[0.06] text-slate-200 hover:bg-white/10'
                  }`}
                  style={{ borderColor: activo ? '#ffffff' : `${g.color ?? '#475569'}88` }}
                >
                  <span
                    className="h-3 w-3 rounded-full border border-black/20"
                    style={{ backgroundColor: g.color ?? '#475569' }}
                    aria-hidden="true"
                  />
                  {etiquetaGrupo(g.letra, g.nombre)}
                </button>
              );
            })}
          </div>

          {grupoActivo && (
            <div className="grid gap-3 sm:grid-cols-3" role="tabpanel">
              {grupoActivo.equipos.map((eq) => {
                const n = contador.get(eq.id) ?? 0;
                return (
                  <button
                    key={eq.id}
                    type="button"
                    onClick={() => abrirEquipo(eq)}
                    className="group glass-card space-y-3 p-4 text-left transition-all duration-300 hover:scale-[1.02] hover:bg-white/[0.08]"
                    style={{ borderTop: `5px solid ${eq.color_hex}` }}
                  >
                    <span className="flex items-center gap-2.5">
                      <span
                        className="h-4 w-4 shrink-0 rounded-full border border-white/30"
                        style={{ backgroundColor: eq.color_hex, boxShadow: `0 0 10px ${eq.color_hex}` }}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1 truncate font-black text-white">{eq.nombre}</span>
                      <ChevronRight
                        size={18}
                        className="shrink-0 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-white"
                      />
                    </span>
                    <ContadorJugadores cantidad={n} color={eq.color_hex} />
                    <span className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Users size={13} />
                      {n === 0 ? 'Sin jugadores aún' : n === 1 ? '1 jugador' : `${n} jugadores`}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
