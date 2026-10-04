import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Eye,
  EyeOff,
  Flag,
  Loader2,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  Settings,
  X,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { listarRosterTorneo } from '../../services/torneoService';
import {
  obtenerPartidoPro,
  listarEventosDePartido,
  listarEstadoJugadoresDeEquipos,
  configurarTiempoPartido,
  iniciarRelojPartido,
  pausarRelojPartido,
  ajustarRelojPartido,
  registrarEventoPartido,
  deshacerUltimoEventoPartido,
  finalizarPartidoPro,
  suscribirseTorneoPro,
} from '../../services/torneoProService';
import { useRelojPartido, formatoMMSS } from '../../hooks/useRelojPartido';
import SelectorJugadorModal from './SelectorJugadorModal';

const ACCIONES = [
  { tipo: 'gol', emoji: '⚽', label: 'GOL', clase: 'from-emerald-500 to-emerald-700 text-white' },
  { tipo: 'amarilla', emoji: '🟨', label: 'AMARILLA', clase: 'from-yellow-300 to-amber-400 text-slate-900' },
  { tipo: 'roja', emoji: '🟥', label: 'ROJA', clase: 'from-red-500 to-rose-700 text-white' },
];

const ESTADOS = {
  en_vivo: { texto: 'EN VIVO', clase: 'bg-red-500/20 text-red-200 border-red-400/50 animate-pulse' },
  pausado: { texto: 'PAUSADO', clase: 'bg-amber-500/20 text-amber-200 border-amber-400/50' },
  finalizado: { texto: 'FINALIZADO', clase: 'bg-white/10 text-slate-200 border-white/20' },
  pendiente: { texto: 'SIN INICIAR', clase: 'bg-white/10 text-slate-300 border-white/15' },
};

const EMOJI_TIPO = { gol: '⚽', amarilla: '🟨', roja: '🟥' };

export default function PartidoProModal({ partidoId, onCerrar }) {
  const { showToast } = useToast();
  const [partido, setPartido] = useState(null);
  const [eventos, setEventos] = useState([]);
  const [roster, setRoster] = useState([]);
  const [jugadores, setJugadores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [selector, setSelector] = useState(null); // { tipo, equipo }
  const [panelTiempo, setPanelTiempo] = useState(false);
  const [ajuste, setAjuste] = useState({ minutos: '', segundos: '', duracion: '' });
  const [flasheando, setFlasheando] = useState(false);
  const [proyeccion, setProyeccion] = useState(false);
  const [pantallaCompleta, setPantallaCompleta] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio('/pitazo.mp3');
  }, []);

  // El fondo de la app no debe hacer scroll mientras el modal está abierto.
  useEffect(() => {
    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previo;
    };
  }, []);

  // Pantalla siempre encendida mientras se arbitra / proyecta.
  useEffect(() => {
    let lock = null;
    async function pedir() {
      try {
        if ('wakeLock' in navigator) lock = await navigator.wakeLock.request('screen');
      } catch {
        // No soportado o denegado: no es crítico.
      }
    }
    function alVolver() {
      if (document.visibilityState === 'visible') pedir();
    }
    pedir();
    document.addEventListener('visibilitychange', alVolver);
    return () => {
      document.removeEventListener('visibilitychange', alVolver);
      if (lock) lock.release().catch(() => {});
    };
  }, []);

  useEffect(() => {
    function alCambiar() {
      setPantallaCompleta(Boolean(document.fullscreenElement));
    }
    document.addEventListener('fullscreenchange', alCambiar);
    return () => {
      document.removeEventListener('fullscreenchange', alCambiar);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, []);

  const cargar = useCallback(async () => {
    try {
      const p = await obtenerPartidoPro(partidoId);
      const [ev, r, j] = await Promise.all([
        listarEventosDePartido(partidoId),
        listarRosterTorneo(),
        listarEstadoJugadoresDeEquipos([p.equipo_a_id, p.equipo_b_id]),
      ]);
      setPartido(p);
      setEventos(ev);
      setRoster(r);
      setJugadores(j);
    } catch {
      showToast('No se pudo cargar el partido', 'error');
    } finally {
      setCargando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partidoId]);

  // Realtime: si cambia algo (otro dispositivo, el Admin...), se recarga. Se
  // agrupan ráfagas de cambios en una sola consulta para no saturar.
  useEffect(() => {
    cargar();
    let temporizador;
    const cancelar = suscribirseTorneoPro(() => {
      clearTimeout(temporizador);
      temporizador = setTimeout(cargar, 300);
    });
    return () => {
      clearTimeout(temporizador);
      cancelar();
    };
  }, [cargar]);

  const alTiempoCumplido = useCallback(() => {
    setFlasheando(true);
    audioRef.current?.play().catch(() => {});
    setTimeout(() => setFlasheando(false), 3000);
  }, []);

  const reloj = useRelojPartido(partido, alTiempoCumplido);

  async function ejecutar(accion, mensajeExito) {
    setOcupado(true);
    try {
      const r = await accion();
      if (r && r.ok === false) {
        showToast(r.mensaje, 'warning');
      } else if (mensajeExito ?? r?.mensaje) {
        showToast(mensajeExito ?? r.mensaje, 'success');
      }
      await cargar();
    } catch (err) {
      showToast(err.message ?? 'Ocurrió un error', 'error');
    } finally {
      setOcupado(false);
    }
  }

  function alternarPantallaCompleta() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
      return;
    }
    const pedir = document.documentElement.requestFullscreen;
    if (pedir) {
      pedir.call(document.documentElement).catch(() => {
        showToast('Tu navegador no permitió la pantalla completa', 'warning');
      });
    } else {
      showToast('Este navegador no soporta pantalla completa', 'warning');
    }
  }

  function toggleReloj() {
    ejecutar(() =>
      reloj.corriendo ? pausarRelojPartido(partidoId) : iniciarRelojPartido(partidoId)
    );
  }

  function elegirJugador(jugador, autogol) {
    const tipo = selector.tipo;
    setSelector(null);
    ejecutar(() =>
      registrarEventoPartido({ partidoId, tipo, jugadorId: jugador.jugador_id, autogol })
    );
  }

  function finalizar() {
    const texto = `${partido.goles_a} - ${partido.goles_b}`;
    if (!window.confirm(`¿Finalizar el partido con el marcador ${texto}?`)) return;
    ejecutar(() => finalizarPartidoPro(partidoId));
  }

  function abrirPanelTiempo() {
    const total = reloj.segundos;
    setAjuste({
      minutos: String(Math.floor(total / 60)),
      segundos: String(total % 60),
      duracion: String(Math.round(partido.duracion_segundos / 60)),
    });
    setPanelTiempo((abierto) => !abierto);
  }

  async function guardarTiempo(e) {
    e.preventDefault();
    const min = Number(ajuste.minutos);
    const seg = Number(ajuste.segundos);
    const dur = Number(ajuste.duracion);
    if (![min, seg, dur].every(Number.isFinite) || min < 0 || seg < 0 || seg > 59 || dur <= 0) {
      showToast('Revisa los números: minutos y duración positivos, segundos de 0 a 59', 'error');
      return;
    }
    const nuevaDuracion = Math.round(dur * 60);
    const nuevoTranscurrido = min * 60 + seg;

    setOcupado(true);
    try {
      if (nuevaDuracion !== partido.duracion_segundos) {
        await configurarTiempoPartido(partidoId, nuevaDuracion);
      }
      if (nuevoTranscurrido !== reloj.segundos) {
        await ajustarRelojPartido(partidoId, nuevoTranscurrido);
      }
      showToast('Tiempo actualizado', 'success');
      setPanelTiempo(false);
      await cargar();
    } catch (err) {
      showToast(err.message ?? 'No se pudo actualizar el tiempo', 'error');
    } finally {
      setOcupado(false);
    }
  }

  if (cargando || !partido) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-navy">
        <Loader2 className="animate-spin text-white" size={40} />
      </div>
    );
  }

  const equipoA = roster.find((e) => e.id === partido.equipo_a_id);
  const equipoB = roster.find((e) => e.id === partido.equipo_b_id);
  if (!equipoA || !equipoB) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-brand-navy p-6 text-center">
        <p className="text-white">No se encontraron los equipos de este partido.</p>
        <button type="button" onClick={onCerrar} className="btn-secondary">
          Cerrar
        </button>
      </div>
    );
  }

  const finalizado = partido.finalizado;
  const estado = ESTADOS[partido.estado] ?? ESTADOS.pendiente;
  const bloqueado = ocupado || finalizado;

  const colorReloj = reloj.agotado
    ? 'text-red-400'
    : reloj.restante <= 60
      ? 'text-amber-300'
      : 'text-white';
  const progreso = reloj.duracion > 0 ? Math.min(100, (reloj.segundos / reloj.duracion) * 100) : 0;

  function equipoRival(equipoId) {
    return equipoId === partido.equipo_a_id ? partido.equipo_b_id : partido.equipo_a_id;
  }

  function anotadores(equipoId) {
    const rival = equipoRival(equipoId);
    return eventos.filter(
      (e) =>
        e.tipo === 'gol' &&
        ((!e.autogol && e.equipo_torneo_id === equipoId) ||
          (e.autogol && e.equipo_torneo_id === rival))
    );
  }

  function tarjetas(equipoId, tipo) {
    return eventos.filter((e) => e.tipo === tipo && e.equipo_torneo_id === equipoId).length;
  }

  function sancionadosDe(equipoId) {
    return jugadores.filter(
      (j) =>
        j.equipo_torneo_id === equipoId && j.sancionado && j.partido_sancion_id === partido.id
    );
  }

  function columnaEquipo(equipo) {
    const goles = anotadores(equipo.id);
    const amarillas = tarjetas(equipo.id, 'amarilla');
    const rojas = tarjetas(equipo.id, 'roja');
    const sancionados = sancionadosDe(equipo.id);

    return (
      <div key={equipo.id} className="min-w-0 space-y-2 text-center">
        <div className="mx-auto h-1.5 w-16 rounded-full" style={{ backgroundColor: equipo.color_hex }} />
        <p className="break-words text-lg sm:text-3xl font-black uppercase leading-tight text-white">
          {equipo.nombre}
        </p>
        {(amarillas > 0 || rojas > 0) && (
          <p className="flex justify-center gap-3 text-sm sm:text-lg">
            {amarillas > 0 && <span>🟨 {amarillas}</span>}
            {rojas > 0 && <span>🟥 {rojas}</span>}
          </p>
        )}
        {goles.length > 0 && (
          <ul className="space-y-0.5 text-xs sm:text-base text-slate-200">
            {goles.map((g) => (
              <li key={g.id}>
                ⚽ {g.jugador_nombre ?? 'Gol'}
                {g.autogol ? ' (a.g.)' : ''} <span className="text-slate-400">{g.minuto}'</span>
              </li>
            ))}
          </ul>
        )}
        {sancionados.length > 0 && (
          <p className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-red-400/40 bg-red-500/15 px-3 py-1 text-[11px] sm:text-sm font-bold text-red-200">
            <AlertTriangle size={13} />
            Juega con {sancionados.length} menos
          </p>
        )}
      </div>
    );
  }

  const ultimosEventos = [...eventos]
    .sort((a, b) => new Date(b.creado_en) - new Date(a.creado_en))
    .slice(0, 5);

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-gradient-to-b from-[#032a4d] via-brand-navy to-[#021d36] text-white">
      {/* Líneas de cancha de fondo */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.07]">
        <div className="absolute left-1/2 top-0 h-full w-px bg-white" />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white sm:h-[28rem] sm:w-[28rem]" />
      </div>

      {flasheando && (
        <div className="pointer-events-none fixed inset-0 z-[101] animate-luces-rotacion" />
      )}

      <div className="relative mx-auto flex min-h-full w-full max-w-5xl flex-col gap-5 px-4 py-4 sm:py-6">
        {!proyeccion && (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-sm font-bold text-slate-300 shrink-0">
                Partido #{partido.partido_num}
              </span>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-extrabold tracking-wider ${estado.clase}`}
              >
                {estado.texto}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setProyeccion(true)}
                className="rounded-xl p-2.5 text-slate-300 hover:bg-white/10 hover:text-white transition-all duration-300"
                aria-label="Ocultar controles para proyectar"
                title="Ocultar controles (modo proyección)"
              >
                <EyeOff size={20} />
              </button>
              <button
                type="button"
                onClick={alternarPantallaCompleta}
                className="rounded-xl p-2.5 text-slate-300 hover:bg-white/10 hover:text-white transition-all duration-300"
                aria-label="Pantalla completa"
                title="Pantalla completa"
              >
                {pantallaCompleta ? <Minimize size={20} /> : <Maximize size={20} />}
              </button>
              <button
                type="button"
                onClick={onCerrar}
                className="rounded-xl p-2.5 text-slate-300 hover:bg-white/10 hover:text-white transition-all duration-300"
                aria-label="Salir del partido"
                title="Salir (el reloj sigue corriendo)"
              >
                <X size={22} />
              </button>
            </div>
          </div>
        )}

        {/* MARCADOR */}
        <div className="rounded-3xl border border-white/15 bg-black/25 p-4 sm:p-8 shadow-2xl shadow-black/50 backdrop-blur-xl">
          <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2 sm:gap-8">
            {columnaEquipo(equipoA)}
            <p className="pt-2 sm:pt-0 text-center text-6xl sm:text-9xl font-black leading-none tabular-nums text-white drop-shadow-lg">
              {partido.goles_a}
              <span className="mx-1.5 sm:mx-4 text-slate-500">-</span>
              {partido.goles_b}
            </p>
            {columnaEquipo(equipoB)}
          </div>
        </div>

        {/* TEMPORIZADOR */}
        <div className="rounded-3xl border border-white/15 bg-black/25 p-5 sm:p-8 text-center shadow-2xl shadow-black/50 backdrop-blur-xl">
          <p
            className={`font-mono text-7xl sm:text-[10rem] font-black leading-none tabular-nums transition-colors duration-300 ${colorReloj} ${
              reloj.agotado && reloj.corriendo ? 'animate-pulse' : ''
            }`}
          >
            {formatoMMSS(reloj.segundos)}
          </p>
          <p className="mt-3 text-sm sm:text-xl font-semibold tracking-wide text-slate-300">
            {finalizado
              ? 'PARTIDO FINALIZADO'
              : reloj.agotado
                ? `TIEMPO CUMPLIDO · +${formatoMMSS(reloj.segundos - reloj.duracion)} añadido`
                : `Faltan ${formatoMMSS(reloj.restante)} de ${Math.round(reloj.duracion / 60)} min`}
          </p>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                reloj.agotado ? 'bg-red-500' : 'bg-emerald-400'
              }`}
              style={{ width: `${progreso}%` }}
            />
          </div>
        </div>

        {/* CONTROLES (se ocultan en modo proyección) */}
        {!proyeccion && !finalizado && (
          <>
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <button
                type="button"
                onClick={toggleReloj}
                disabled={bloqueado}
                className={`flex items-center justify-center gap-3 rounded-2xl py-5 text-xl font-black text-white shadow-xl shadow-black/40 transition-all duration-200 hover:scale-[1.01] active:scale-95 disabled:opacity-50 ${
                  reloj.corriendo
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600'
                    : 'bg-gradient-to-r from-emerald-500 to-emerald-700'
                }`}
              >
                {ocupado ? (
                  <Loader2 className="animate-spin" size={26} />
                ) : reloj.corriendo ? (
                  <Pause size={26} />
                ) : (
                  <Play size={26} />
                )}
                {reloj.corriendo
                  ? 'Pausar'
                  : partido.segundos_acumulados > 0
                    ? 'Reanudar'
                    : 'Iniciar partido'}
              </button>
              <button
                type="button"
                onClick={abrirPanelTiempo}
                disabled={ocupado}
                className="btn-secondary !px-5"
                aria-label="Ajustar tiempo"
              >
                <Settings size={20} />
                <span className="hidden sm:inline">Tiempo</span>
              </button>
            </div>

            {panelTiempo && (
              <form
                onSubmit={guardarTiempo}
                className="rounded-2xl border border-white/15 bg-black/30 p-4 space-y-3"
              >
                <p className="text-sm font-semibold text-white">Ajustar tiempo</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="field-label">Minuto actual</label>
                    <input
                      type="number"
                      min={0}
                      value={ajuste.minutos}
                      onChange={(e) => setAjuste((a) => ({ ...a, minutos: e.target.value }))}
                      className="field text-center"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="field-label">Segundos</label>
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={ajuste.segundos}
                      onChange={(e) => setAjuste((a) => ({ ...a, segundos: e.target.value }))}
                      className="field text-center"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="field-label">Duración (min)</label>
                    <input
                      type="number"
                      min={1}
                      value={ajuste.duracion}
                      onChange={(e) => setAjuste((a) => ({ ...a, duracion: e.target.value }))}
                      className="field text-center"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={ocupado} className="btn-primary flex-1">
                    Guardar
                  </button>
                  <button type="button" onClick={() => setPanelTiempo(false)} className="btn-secondary">
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-2 gap-3">
              {[equipoA, equipoB].map((eq) => (
                <div
                  key={eq.id}
                  className="space-y-2.5 rounded-2xl border-2 bg-black/20 p-3"
                  style={{ borderColor: `${eq.color_hex}88` }}
                >
                  <p className="flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wide text-white">
                    <span
                      className="inline-block h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: eq.color_hex }}
                    />
                    <span className="truncate">{eq.nombre}</span>
                  </p>
                  {ACCIONES.map((a) => (
                    <button
                      key={a.tipo}
                      type="button"
                      disabled={bloqueado}
                      onClick={() => setSelector({ tipo: a.tipo, equipo: eq })}
                      className={`w-full rounded-xl bg-gradient-to-br py-4 text-lg font-black shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-40 ${a.clase}`}
                    >
                      <span className="mr-2">{a.emoji}</span>
                      {a.label}
                    </button>
                  ))}
                </div>
              ))}
            </div>

            {ultimosEventos.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3 space-y-1.5">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Últimos eventos
                </p>
                {ultimosEventos.map((ev) => {
                  const eq = roster.find((e) => e.id === ev.equipo_torneo_id);
                  return (
                    <p key={ev.id} className="text-sm text-slate-200">
                      <span className="tabular-nums text-slate-400">{ev.minuto}'</span>{' '}
                      {EMOJI_TIPO[ev.tipo]}{' '}
                      <span className="font-semibold">
                        {ev.jugador_dorsal != null ? `#${ev.jugador_dorsal} ` : ''}
                        {ev.jugador_nombre ?? 'Jugador'}
                      </span>
                      {ev.autogol && <span className="text-amber-300"> (autogol)</span>}
                      {ev.automatica && <span className="text-amber-300"> (doble amarilla)</span>}
                      <span className="text-slate-500"> · {eq?.nombre}</span>
                    </p>
                  );
                })}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pb-4">
              <button
                type="button"
                onClick={() => ejecutar(() => deshacerUltimoEventoPartido(partidoId))}
                disabled={bloqueado || eventos.length === 0}
                className="btn-secondary !py-3.5 disabled:opacity-40"
              >
                <RotateCcw size={18} />
                Deshacer último
              </button>
              <button
                type="button"
                onClick={finalizar}
                disabled={bloqueado}
                className="btn-danger !py-3.5"
              >
                <Flag size={18} />
                Finalizar partido
              </button>
            </div>
          </>
        )}

        {!proyeccion && finalizado && (
          <div className="rounded-2xl border border-white/15 bg-black/25 p-5 text-center space-y-3 pb-6">
            <p className="text-lg font-bold text-white">Este partido ya terminó.</p>
            <p className="text-sm text-slate-400">
              Si hay que corregir algo, el Admin puede editar el historial o reabrir el partido.
            </p>
            <button type="button" onClick={onCerrar} className="btn-secondary mx-auto">
              Cerrar
            </button>
          </div>
        )}
      </div>

      {proyeccion && (
        <button
          type="button"
          onClick={() => setProyeccion(false)}
          className="fixed bottom-4 right-4 z-[102] rounded-full bg-white/10 p-3 text-white opacity-30 transition-all duration-300 hover:opacity-100"
          aria-label="Mostrar controles"
          title="Mostrar controles"
        >
          <Eye size={22} />
        </button>
      )}

      {selector && (
        <SelectorJugadorModal
          tipo={selector.tipo}
          equipo={selector.equipo}
          jugadores={jugadores}
          eventos={eventos}
          partidoId={partido.id}
          onElegir={elegirJugador}
          onCerrar={() => setSelector(null)}
        />
      )}
    </div>
  );
}
