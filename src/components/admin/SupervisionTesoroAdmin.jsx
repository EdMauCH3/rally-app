import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { listarSubEquiposColorPorActividad } from '../../services/subEquiposColorService';
import {
  listarRutasTesoro,
  listarPuntuacionesTesoro,
  recalificarTinajaTesoro,
  suscribirseTesoroGlobal,
} from '../../services/tesoroService';
import IconoCopaVino from '../tesoro/IconoCopaVino';

/**
 * Resumen de la Búsqueda del Tesoro para el Admin: por cada equipo, las
 * tinajas que ya encontró y los puntos de cada una. Cualquier tinaja ya
 * calificada se puede corregir (reclamos, errores del animador).
 */
export default function SupervisionTesoroAdmin() {
  const { showToast } = useToast();
  const [equipos, setEquipos] = useState([]);
  const [rutas, setRutas] = useState([]);
  const [puntuaciones, setPuntuaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState(null); // "equipoId-baseId" mientras se guarda

  const cargar = useCallback(() => {
    Promise.all([
      listarSubEquiposColorPorActividad('tesoro'),
      listarRutasTesoro(),
      listarPuntuacionesTesoro(),
    ])
      .then(([e, r, p]) => {
        setEquipos(e);
        setRutas(r);
        setPuntuaciones(p);
      })
      .catch(() => showToast('No se pudo cargar la supervisión del Tesoro', 'error'))
      .finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    cargar();
    const cancelar = suscribirseTesoroGlobal(cargar);
    return cancelar;
  }, [cargar]);

  async function recalificar(equipo, registro, nuevoPuntaje) {
    if (nuevoPuntaje === registro.puntos_evaluacion) return;
    const mensaje = `¿Cambiar la calificación de la Tinaja ${registro.base_id} de ${equipo.nombre}, de ${registro.puntos_evaluacion} a ${nuevoPuntaje}?`;
    if (!window.confirm(mensaje)) return;

    const clave = `${equipo.id}-${registro.base_id}`;
    setEditando(clave);
    try {
      const r = await recalificarTinajaTesoro(equipo.id, registro.base_id, nuevoPuntaje);
      showToast(r?.mensaje ?? 'Puntaje actualizado', r?.ok ? 'success' : 'warning');
      cargar();
    } catch (err) {
      showToast(err.message ?? 'No se pudo recalificar la tinaja', 'error');
    } finally {
      setEditando(null);
    }
  }

  if (cargando) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="animate-spin text-white" size={24} />
      </div>
    );
  }

  if (rutas.length === 0) {
    return (
      <p className="glass-card mx-auto max-w-2xl p-5 text-center text-sm text-slate-400">
        La Búsqueda del Tesoro aún no ha iniciado. Cuando la inicies, aquí verás el avance de cada
        equipo y podrás corregir cualquier calificación.
      </p>
    );
  }

  return (
    <section className="mx-auto max-w-2xl space-y-4">
      <div>
        <h2 className="font-semibold text-white">Supervisión</h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-400">
          Toca otro número para corregir la calificación de una tinaja. El puntaje de llegada (1)
          no cambia.
        </p>
      </div>

      {equipos.map((equipo) => {
        const ruta = rutas.find((r) => r.equipo_id === equipo.id);
        if (!ruta) return null;
        const registros = puntuaciones.filter((p) => p.equipo_id === equipo.id);
        const completadas = registros.filter((p) => p.puntos_evaluacion != null).length;
        const total = ruta.orden_tinajas.length;
        const puntos = registros.reduce((suma, p) => suma + (p.puntos_totales ?? 0), 0);

        return (
          <div
            key={equipo.id}
            className="glass-card space-y-3 p-4"
            style={{ borderTop: `4px solid ${equipo.color_hex}` }}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 font-bold text-white">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: equipo.color_hex }}
                />
                {equipo.nombre}
              </span>
              <span className="text-sm text-slate-300">
                <span className="font-bold text-white">{completadas}</span> de {total} tinajas ·{' '}
                <span className="font-bold text-white">{puntos}</span> pts
              </span>
            </div>

            {registros.length === 0 ? (
              <p className="text-sm text-slate-500">Todavía no ha encontrado ninguna tinaja.</p>
            ) : (
              <div className="space-y-2">
                {registros.map((registro) => {
                  const calificada = registro.puntos_evaluacion != null;
                  const guardando = editando === `${equipo.id}-${registro.base_id}`;
                  return (
                    <div
                      key={registro.id}
                      className="glass-row flex flex-wrap items-center justify-between gap-3 px-3 py-2.5"
                    >
                      <div>
                        <p className="font-semibold text-white">Tinaja {registro.base_id}</p>
                        <p className="text-xs text-slate-400">
                          {calificada
                            ? `Llegada +1 · calificación +${registro.puntos_evaluacion} = ${registro.puntos_totales} pts`
                            : 'Llegó, pero aún no se califica'}
                        </p>
                      </div>

                      {calificada && (
                        <div className="flex items-center gap-1.5">
                          {guardando && <Loader2 className="animate-spin text-slate-400" size={16} />}
                          {[1, 2, 3].map((n) => {
                            const activo = registro.puntos_evaluacion === n;
                            return (
                              <button
                                key={n}
                                type="button"
                                disabled={guardando}
                                onClick={() => recalificar(equipo, registro, n)}
                                aria-label={`Calificar con ${n}`}
                                className={`flex h-10 w-10 flex-col items-center justify-center rounded-lg border-2 text-sm font-black transition-all duration-200 disabled:opacity-50 ${
                                  activo
                                    ? 'border-rose-400 bg-rose-500/20 text-white'
                                    : 'border-white/10 text-slate-400 hover:border-white/30 hover:text-white'
                                }`}
                              >
                                {n}
                                {activo && <IconoCopaVino size={10} className="text-rose-300" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
