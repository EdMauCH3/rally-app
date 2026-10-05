import { useCallback, useEffect, useState } from 'react';
import { Amphora, Check, Loader2, MapPin, RotateCcw } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useEstadoPersistente } from '../../hooks/useEstadoPersistente';
import {
  obtenerRutaTesoro,
  obtenerPuntuacionesTesoro,
  marcarLlegadaTesoro,
  calificarBaseTesoro,
  deshacerLlegadaTesoro,
  suscribirseTesoroGlobal,
} from '../../services/tesoroService';
import { listarPistasTesoro, suscribirsePistasTesoro } from '../../services/tesoroPistasService';
import IconoCopaVino from './IconoCopaVino';

/**
 * La búsqueda de UN equipo, una tinaja a la vez:
 *   1. Búsqueda activa  -> se lee la pista y se pulsa "Marcar Llegada"
 *   2. Calificación     -> se asigna el vino (1 a 3)
 *   3. Transición       -> "Siguiente Tinaja" revela la nueva pista
 *
 * La tinaja que le toca al equipo NO se guarda aparte: sale de su recorrido
 * y de lo ya calificado, así que si el animador recarga o cambia de
 * dispositivo vuelve exactamente al mismo punto.
 * Solo la pantallita de "Siguiente Tinaja" es memoria local de la sesión.
 */
export default function FlujoTinajasEquipo({ equipo }) {
  const { showToast } = useToast();
  const [ruta, setRuta] = useState(undefined); // undefined = cargando, null = sin iniciar
  const [registros, setRegistros] = useState([]);
  const [pistas, setPistas] = useState([]);
  const [ocupado, setOcupado] = useState(false);
  const [puntaje, setPuntaje] = useState(null);
  // Tinaja recién calificada, a la espera de que el animador pulse "Siguiente Tinaja".
  const [transicion, setTransicion] = useEstadoPersistente(
    `rally_ui_tesoro_transicion_${equipo.id}`,
    null
  );

  const cargar = useCallback(async () => {
    const [r, p, pi] = await Promise.allSettled([
      obtenerRutaTesoro(equipo.id),
      obtenerPuntuacionesTesoro(equipo.id),
      listarPistasTesoro(),
    ]);
    if (r.status === 'fulfilled') setRuta(r.value);
    else {
      setRuta(null);
      showToast('No se pudo cargar el recorrido del equipo', 'error');
    }
    if (p.status === 'fulfilled') setRegistros(p.value);
    if (pi.status === 'fulfilled') setPistas(pi.value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equipo.id]);

  // Realtime agrupado: varios cambios seguidos = una sola consulta.
  useEffect(() => {
    cargar();
    let temporizador;
    const refrescar = () => {
      clearTimeout(temporizador);
      temporizador = setTimeout(cargar, 300);
    };
    const cancelarTesoro = suscribirseTesoroGlobal(refrescar);
    const cancelarPistas = suscribirsePistasTesoro(refrescar);
    return () => {
      clearTimeout(temporizador);
      cancelarTesoro();
      cancelarPistas();
    };
  }, [cargar]);

  async function ejecutar(accion, alExito) {
    setOcupado(true);
    try {
      const r = await accion();
      if (r?.ok === false) {
        showToast(r.mensaje, 'warning');
      } else {
        alExito?.(r);
        if (r?.mensaje) showToast(r.mensaje, 'success');
      }
      await cargar();
    } catch (err) {
      showToast(err.message ?? 'Ocurrió un error', 'error');
    } finally {
      setOcupado(false);
    }
  }

  if (ruta === undefined) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="animate-spin text-white" size={28} />
      </div>
    );
  }

  if (ruta === null) {
    return (
      <p className="glass-card p-5 text-center text-sm leading-relaxed text-slate-300">
        La Búsqueda del Tesoro todavía no ha iniciado, así que este equipo aún no tiene recorrido.
        El Admin la inicia desde Animación → Búsqueda del Tesoro.
      </p>
    );
  }

  // ---- Estado derivado (no se guarda: sale del recorrido y de lo calificado) ----
  const calificada = (n) => registros.find((r) => r.base_id === n && r.puntos_evaluacion != null);
  const total = ruta.length;
  const completadas = ruta.filter((n) => calificada(n)).length;
  const actual = ruta.find((n) => !calificada(n)) ?? null;
  const registroActual =
    actual != null ? (registros.find((r) => r.base_id === actual) ?? null) : null;
  const pistaActual = pistas.find((p) => p.numero === actual)?.pista?.trim() ?? '';
  const puntosGanados = registros.reduce((suma, r) => suma + (r.puntos_totales ?? 0), 0);
  const progreso = total > 0 ? (completadas / total) * 100 : 0;

  // La transición solo vale si esa tinaja de verdad quedó calificada (si se reinició la
  // búsqueda, un recuerdo viejo no debe mostrar una tarjeta fantasma).
  const transicionValida = transicion && calificada(transicion.tinaja) && actual != null;

  const historial = registros
    .filter((r) => r.puntos_evaluacion != null)
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  const banner = 'rounded-3xl bg-gradient-to-br from-orange-600 to-rose-800 p-5 shadow-glow-lg';

  return (
    <div className="space-y-6">
      {/* Progreso */}
      <div className="space-y-2">
        <div className="flex items-end justify-between">
          <p className="text-sm font-semibold text-slate-300">Tinajas encontradas</p>
          <p className="text-2xl font-black tabular-nums text-white">
            {completadas}
            <span className="text-base font-bold text-slate-400"> de {total}</span>
          </p>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-400 to-rose-500 transition-all duration-500"
            style={{ width: `${progreso}%` }}
          />
        </div>
        <div className="flex gap-1.5 pt-1" aria-hidden="true">
          {ruta.map((n) => (
            <Amphora
              key={n}
              size={18}
              className={calificada(n) ? 'text-rose-400' : 'text-white/20'}
              fill={calificada(n) ? 'currentColor' : 'none'}
              fillOpacity={calificada(n) ? 0.35 : 0}
            />
          ))}
        </div>
      </div>

      {/* ----- Tarjeta principal ----- */}
      {actual == null ? (
        <div className={`${banner} space-y-2 text-center animate-fade-up`}>
          <IconoCopaVino size={44} className="mx-auto text-white" colorVino="#fda4af" />
          <p className="text-2xl font-black text-white">¡Encontraron todas las tinajas!</p>
          <p className="text-white/85">
            {equipo.nombre} reunió <span className="font-black">{puntosGanados}</span> puntos de
            vino.
          </p>
        </div>
      ) : transicionValida ? (
        <div className={`${banner} space-y-4 animate-fade-up`}>
          <div className="flex items-center gap-3">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white">
              <Check size={30} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
                Calificación guardada
              </p>
              <p className="text-2xl font-black leading-tight text-white">
                Tinaja {transicion.tinaja} · +{transicion.puntos} pts
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setTransicion(null)}
            className="w-full rounded-2xl bg-white py-4 text-lg font-black text-rose-900 shadow-lg transition-all duration-200 hover:scale-[1.01] active:scale-95"
          >
            Siguiente Tinaja
          </button>
        </div>
      ) : (
        <div className={`${banner} space-y-4 animate-fade-up`}>
          <div className="flex items-center gap-3">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white animate-glow-pulse">
              <Amphora size={28} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
                {registroActual ? '¡El equipo llegó!' : 'Próxima Tinaja'}
              </p>
              <p className="text-3xl font-black leading-tight text-white">Tinaja {actual}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-black/25 p-4">
            <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-amber-200">
              <MapPin size={13} /> Pista
            </p>
            <p className="whitespace-pre-wrap text-base leading-relaxed text-white">
              {pistaActual || 'Esta tinaja no tiene una pista escrita. Avisa al Admin.'}
            </p>
          </div>

          {!registroActual ? (
            <button
              type="button"
              disabled={ocupado}
              onClick={() => ejecutar(() => marcarLlegadaTesoro(equipo.id, actual))}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 text-lg font-black text-rose-900 shadow-lg transition-all duration-200 hover:scale-[1.01] active:scale-95 disabled:opacity-60"
            >
              {ocupado && <Loader2 className="animate-spin" size={20} />}
              Marcar Llegada
            </button>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-bold text-white">¿Cuánto vino se ganaron?</p>
                <p className="text-xs text-white/75">
                  Llegar ya sumó 1 punto. La calificación suma de 1 a 3 más.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPuntaje(n)}
                    aria-pressed={puntaje === n}
                    className={`flex flex-col items-center gap-1 rounded-2xl border-2 py-3 transition-all duration-200 ${
                      puntaje === n
                        ? 'border-white bg-white text-rose-900 shadow-lg'
                        : 'border-white/30 bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    <span className="flex gap-0.5">
                      {Array.from({ length: n }, (_, i) => (
                        <IconoCopaVino
                          key={i}
                          size={18}
                          className={puntaje === n ? 'text-rose-700' : 'text-white'}
                          colorVino={puntaje === n ? '#9f1239' : '#fda4af'}
                        />
                      ))}
                    </span>
                    <span className="text-lg font-black">{n}</span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                disabled={ocupado || puntaje == null}
                onClick={() =>
                  ejecutar(
                    () => calificarBaseTesoro(equipo.id, actual, puntaje),
                    () => {
                      setTransicion({ tinaja: actual, puntos: 1 + puntaje });
                      setPuntaje(null);
                    }
                  )
                }
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 text-lg font-black text-rose-900 shadow-lg transition-all duration-200 hover:scale-[1.01] active:scale-95 disabled:opacity-50"
              >
                {ocupado && <Loader2 className="animate-spin" size={20} />}
                Guardar calificación
              </button>

              <button
                type="button"
                disabled={ocupado}
                onClick={() =>
                  ejecutar(() => deshacerLlegadaTesoro(equipo.id, actual), () => setPuntaje(null))
                }
                className="mx-auto flex items-center gap-1.5 text-sm text-white/75 underline underline-offset-2 transition-colors hover:text-white disabled:opacity-50"
              >
                <RotateCcw size={14} />
                Marqué la llegada por error
              </button>
            </div>
          )}
        </div>
      )}

      {/* ----- Historial ----- */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-200">Tinajas superadas</h3>
          <span className="text-sm text-slate-400">
            <span className="font-bold text-white">{puntosGanados}</span> pts en total
          </span>
        </div>

        {historial.length === 0 ? (
          <p className="text-sm text-slate-500">Todavía no han completado ninguna tinaja.</p>
        ) : (
          historial.map((r) => (
            <div key={r.id} className="glass-row flex items-center justify-between px-4 py-3">
              <span className="flex items-center gap-2.5 font-semibold text-white">
                <Amphora size={18} className="text-rose-400" />
                Tinaja {r.base_id}
              </span>
              <span className="text-sm text-slate-300">
                llegada +1 · vino +{r.puntos_evaluacion} ={' '}
                <span className="font-bold text-white">{r.puntos_totales} pts</span>
              </span>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
