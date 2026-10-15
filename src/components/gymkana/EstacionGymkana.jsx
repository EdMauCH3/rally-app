import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Clock, Check, Hourglass, Loader2, PartyPopper } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useBasesGymkana } from '../../hooks/useBasesGymkana';
import { useAlertaLlegada } from '../../hooks/useAlertaLlegada';
import { useCircuitoGymkana } from '../../hooks/useCircuitoGymkana';
import { useEstadoActividad } from '../../hooks/useEstadoActividades';
import { reportarAlertaGymkana, sellarResultadoGymkana } from '../../services/gymkanaService';
import { crucesDeRonda, equipoVisual } from '../../services/gymkanaLogica';
import TarjetaLlegadaEquipo from '../estacion/TarjetaLlegadaEquipo';
import CabeceraBase from './CabeceraBase';
import RelojRonda from './RelojRonda';

/**
 * Pantalla del juez FIJO de una Base en la Gymkana sincronizada.
 * Los equipos llegan todos a la vez cuando la coordinación autoriza la rotación:
 *   1. Se ve el cruce de la ronda y se califica (una sola vez).
 *   2. Al guardar, el formulario se bloquea y queda la tarjeta de espera, con el
 *      mismo reloj general, hasta la señal de la siguiente rotación.
 *   3. Cuando todos completan el circuito, aparece el mensaje de cierre.
 */
export default function EstacionGymkana({ base }) {
  const { showToast } = useToast();
  const bases = useBasesGymkana();
  const { pausada } = useEstadoActividad('gymkana');
  const { circuito, cruces, equipos, desfaseMs, cargando, error, recargar } = useCircuitoGymkana();

  const [ocupado, setOcupado] = useState(false);
  const [eleccion, setEleccion] = useState(null); // 'a' | 'empate' | 'b'

  const cruce = useMemo(
    () =>
      circuito ? (crucesDeRonda(cruces, circuito.ronda_actual).find((c) => Number(c.base_id) === base) ?? null) : null,
    [circuito, cruces, base]
  );

  // Pitazo y parpadeo cuando llega un cruce NUEVO a tu base (al rotar).
  const { alertando } = useAlertaLlegada(cruce && !cruce.finalizado ? [cruce.id] : [], {
    silenciada: pausada,
    listo: !!circuito,
  });

  // Al cambiar de cruce se olvida la opción que estaba elegida.
  useEffect(() => setEleccion(null), [cruce?.id]);

  async function ejecutar(accion, alExito) {
    setOcupado(true);
    try {
      const r = await accion();
      if (r?.ok === false) showToast(r.mensaje, 'warning');
      else {
        alExito?.();
        if (r?.mensaje) showToast(r.mensaje, 'success');
      }
      await recargar();
    } catch (err) {
      showToast(err.message ?? 'Ocurrió un error', 'error');
    } finally {
      setOcupado(false);
    }
  }

  if (error) {
    return (
      <p className="glass-card p-5 text-center text-sm text-red-300">
        No se pudo cargar la estación. Revisa tu conexión y que el SQL 49 esté corrido.
      </p>
    );
  }
  if (cargando || !circuito) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="animate-spin text-white" size={28} />
      </div>
    );
  }

  const info = bases[base];
  const encabezado = <CabeceraBase numero={base} info={info} etiqueta="Tu base" />;
  const reloj = <RelojRonda circuito={circuito} equipos={equipos} cruces={cruces} desfaseMs={desfaseMs} />;

  const terminados = cruces
    .filter((c) => Number(c.base_id) === base && c.finalizado)
    .sort((a, b) => new Date(b.actualizado_en) - new Date(a.actualizado_en));

  let cuerpo;
  if (circuito.estado === 'completado') {
    cuerpo = (
      <div className="space-y-3 rounded-3xl border-2 border-emerald-400/50 bg-emerald-500/10 p-8 text-center animate-fade-up">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
          <PartyPopper size={34} />
        </span>
        <p className="text-2xl font-black leading-snug text-emerald-100">¡Gymkana completada! 🎉</p>
        <p className="text-base leading-relaxed text-emerald-50">
          Todos los equipos completaron el circuito. Ya puedes recoger la base y apoyar el resto del evento.
        </p>
      </div>
    );
  } else if (circuito.estado === 'esperando') {
    cuerpo = (
      <div className="glass-card space-y-3 p-8 text-center animate-fade-up">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sky-500/15 text-sky-300">
          <Hourglass size={32} />
        </span>
        <p className="text-lg font-bold leading-snug text-white">
          La Gymkana aún no empieza. Prepara tu base: la coordinación dará la señal de la primera rotación.
        </p>
      </div>
    );
  } else if (!cruce) {
    cuerpo = (
      <div className="glass-card space-y-3 p-8 text-center animate-fade-up">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-slate-200">
          <Clock size={32} />
        </span>
        <p className="text-lg font-bold leading-snug text-white">Tu base descansa en esta ronda.</p>
        <p className="text-sm text-slate-400">
          No viene ningún equipo ahora. Espera la señal de rotación de la coordinación.
        </p>
      </div>
    );
  } else {
    const equipoA = equipoVisual(equipos, cruce.equipo_a_id);
    const equipoB = equipoVisual(equipos, cruce.equipo_b_id);

    if (cruce.finalizado) {
      // Calificado: el formulario ya no existe (no hay doble calificación).
      const texto =
        cruce.resultado_a === 'empato'
          ? 'Empate'
          : `Ganó ${cruce.resultado_a === 'gano' ? equipoA.nombre : equipoB.nombre}`;
      cuerpo = (
        <div className="space-y-3 animate-fade-up">
          <TarjetaLlegadaEquipo
            titulo="Encuentro calificado"
            equipos={[equipoA, equipoB]}
            detalle={texto}
          />
          <div
            role="status"
            className="space-y-3 rounded-3xl border-2 border-emerald-400/40 bg-emerald-500/10 p-6 text-center"
          >
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
              <Check size={30} />
            </span>
            <p className="text-lg font-black leading-snug text-emerald-100">
              Puntaje registrado exitosamente.
            </p>
            <p className="text-base leading-relaxed text-emerald-50">
              Esperando la señal de rotación general de la coordinación...
            </p>
          </div>
        </div>
      );
    } else {
      const opciones = [
        { id: 'a', texto: `Gana ${equipoA.nombre}`, color: equipoA.color_hex, equipo: equipoA.id, valor: 'gano' },
        { id: 'empate', texto: 'Empate', color: null, equipo: equipoA.id, valor: 'empato' },
        { id: 'b', texto: `Gana ${equipoB.nombre}`, color: equipoB.color_hex, equipo: equipoB.id, valor: 'gano' },
      ];
      const elegida = opciones.find((o) => o.id === eleccion);

      cuerpo = (
        <div className="space-y-4 animate-fade-up">
          <TarjetaLlegadaEquipo
            titulo={`Ronda ${circuito.ronda_actual} · Encuentro en tu base`}
            equipos={[equipoA, equipoB]}
            alertando={alertando}
            detalle="Que compitan y califica el resultado."
          />

          <div className="glass-card space-y-3 p-4">
            <p className="font-bold text-white">¿Quién ganó?</p>
            <div className="grid gap-2">
              {opciones.map((o) => {
                const activa = o.id === eleccion;
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setEleccion(o.id)}
                    aria-pressed={activa}
                    className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left text-lg font-black text-white transition-all duration-200 ${
                      activa ? 'bg-white/15' : 'bg-white/[0.03] hover:bg-white/[0.08]'
                    }`}
                    style={{ borderColor: activa ? (o.color ?? '#ffffff') : 'rgba(255,255,255,0.12)' }}
                  >
                    <span
                      className="h-5 w-5 shrink-0 rounded-full border-2 border-white/30"
                      style={{ backgroundColor: o.color ?? 'transparent' }}
                      aria-hidden="true"
                    />
                    {o.texto}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              disabled={ocupado || pausada || !elegida}
              onClick={() =>
                ejecutar(
                  () => sellarResultadoGymkana(cruce.id, elegida.equipo, elegida.valor),
                  () => setEleccion(null)
                )
              }
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 text-lg font-black text-slate-900 shadow-lg transition-all duration-200 hover:scale-[1.01] active:scale-95 disabled:opacity-50"
            >
              {ocupado && <Loader2 className="animate-spin" size={20} />}
              Guardar resultado
            </button>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="space-y-5">
      {encabezado}
      {reloj}
      {cuerpo}

      {terminados.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-400">Ya calificadas en esta base</h3>
          {terminados.map((p) => {
            const a = equipoVisual(equipos, p.equipo_a_id);
            const b = equipoVisual(equipos, p.equipo_b_id);
            const texto =
              p.resultado_a === 'empato' ? 'Empate' : `Ganó ${p.resultado_a === 'gano' ? a.nombre : b.nombre}`;
            return (
              <div key={p.id} className="glass-row flex items-center justify-between gap-3 px-4 py-3">
                <span className="min-w-0 text-sm text-slate-200">
                  <span style={{ color: a.color_hex }}>{a.nombre}</span> vs{' '}
                  <span style={{ color: b.color_hex }}>{b.nombre}</span>
                  <span className="block text-xs text-slate-400">
                    Ronda {p.ronda} · {texto}
                  </span>
                </span>
                {p.requiere_auditoria ? (
                  <span className="flex shrink-0 items-center gap-1 text-xs text-red-300">
                    <AlertTriangle size={12} /> Enviada al Admin
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={pausada}
                    onClick={() =>
                      ejecutar(async () => {
                        await reportarAlertaGymkana(p.id);
                        return { ok: true, mensaje: 'Alerta enviada a la coordinación' };
                      })
                    }
                    className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-red-300/80 hover:text-red-300 disabled:opacity-50"
                  >
                    <AlertTriangle size={12} />
                    Reportar error
                  </button>
                )}
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
