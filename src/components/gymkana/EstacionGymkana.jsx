import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Flag, Loader2, RotateCcw } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useBasesGymkana } from '../../hooks/useBasesGymkana';
import { useAlertaLlegada } from '../../hooks/useAlertaLlegada';
import { useEstadoActividad } from '../../hooks/useEstadoActividades';
import { listarSubEquiposColorPorActividad } from '../../services/subEquiposColorService';
import {
  obtenerEstacionesGymkana,
  marcarLlegadaGymkana,
  deshacerLlegadaGymkana,
  sellarResultadoGymkana,
  reportarAlertaGymkana,
  suscribirseGymkana,
} from '../../services/gymkanaService';
import { calcularEstacionGymkana, mapaEquipos } from '../../services/estacionesLogica';
import TarjetaLlegadaEquipo from '../estacion/TarjetaLlegadaEquipo';
import { EncabezadoEstacion, EstacionCerrada, EstacionEnEspera } from '../estacion/EstacionLayout';

/**
 * Pantalla del juez FIJO de una Base. El juez no acompaña a nadie: se queda en
 * su base y la pantalla le dice cuándo viene una pareja, le deja marcar la
 * llegada y calificar. Al calificar, el sistema manda a esa pareja a su
 * siguiente base y la tuya queda libre para la siguiente.
 */
export default function EstacionGymkana({ base }) {
  const { showToast } = useToast();
  const bases = useBasesGymkana();
  const { pausada } = useEstadoActividad('gymkana');

  const [equipos, setEquipos] = useState([]);
  const [datos, setDatos] = useState(null); // { rutas, partidos }
  const [errorCarga, setErrorCarga] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [eleccion, setEleccion] = useState(null); // 'a' | 'empate' | 'b'

  const cargar = useCallback(async () => {
    try {
      const [e, d] = await Promise.all([
        listarSubEquiposColorPorActividad('gymkana'),
        obtenerEstacionesGymkana(),
      ]);
      setEquipos(e);
      setDatos(d);
      setErrorCarga(false);
    } catch {
      setErrorCarga(true);
    }
  }, []);

  // Realtime agrupado + repaso cada 30 s por si se cayó la conexión un momento.
  useEffect(() => {
    cargar();
    let temporizador;
    const refrescar = () => {
      clearTimeout(temporizador);
      temporizador = setTimeout(cargar, 250);
    };
    const cancelar = suscribirseGymkana(refrescar);
    const intervalo = setInterval(cargar, 30000);
    return () => {
      clearTimeout(temporizador);
      clearInterval(intervalo);
      cancelar();
    };
  }, [cargar]);

  const estacion = useMemo(
    () =>
      datos ? calcularEstacionGymkana(base, datos.rutas, datos.partidos, mapaEquipos(equipos)) : null,
    [datos, equipos, base]
  );

  const { alertando } = useAlertaLlegada(
    estacion ? estacion.enCamino.map((i) => i.partido.id) : [],
    { silenciada: pausada, listo: !!estacion }
  );

  const enfoque = estacion ? (estacion.enBase[0] ?? estacion.enCamino[0] ?? null) : null;
  const enfoqueId = enfoque?.partido.id;

  // Al cambiar de pareja se olvida la opción que estaba elegida.
  useEffect(() => setEleccion(null), [enfoqueId]);

  async function ejecutar(accion, alExito) {
    setOcupado(true);
    try {
      const r = await accion();
      if (r?.ok === false) showToast(r.mensaje, 'warning');
      else {
        alExito?.();
        if (r?.mensaje) showToast(r.mensaje, 'success');
      }
      await cargar();
    } catch (err) {
      showToast(err.message ?? 'Ocurrió un error', 'error');
    } finally {
      setOcupado(false);
    }
  }

  if (!datos) {
    return errorCarga ? (
      <p className="glass-card p-5 text-center text-sm text-red-300">
        No se pudo cargar la estación. Revisa tu conexión; se reintenta sola.
      </p>
    ) : (
      <div className="flex justify-center py-10">
        <Loader2 className="animate-spin text-white" size={28} />
      </div>
    );
  }

  const lugar = bases[base]?.lugar?.trim();
  const encabezado = (
    <EncabezadoEstacion
      icono={Flag}
      etiqueta="Base"
      numero={base}
      lugar={lugar}
      pasaron={estacion.finalizados}
      total={estacion.total}
      unidad="Parejas"
    />
  );

  if (!estacion.iniciada) {
    return (
      <div className="space-y-4">
        {encabezado}
        <p className="glass-card p-5 text-center text-sm leading-relaxed text-slate-300">
          La Gymkana todavía no ha iniciado. El Admin la inicia desde Animación → Gymkana.
        </p>
      </div>
    );
  }

  const terminados = datos.partidos
    .filter((p) => p.base_id === base && p.finalizado)
    .sort((a, b) => new Date(b.actualizado_en) - new Date(a.actualizado_en));

  let cuerpo;
  if (estacion.todosPasaron) {
    cuerpo = <EstacionCerrada unidad="base" />;
  } else if (!enfoque) {
    cuerpo = <EstacionEnEspera />;
  } else {
    const { partido, equipoA, equipoB } = enfoque;
    const llego = !!partido.llegada_en;
    const esperando = estacion.simultaneas - 1;

    const opciones = [
      { id: 'a', texto: `Gana ${equipoA.nombre}`, color: equipoA.color_hex, equipo: equipoA.id, valor: 'gano' },
      { id: 'empate', texto: 'Empate', color: null, equipo: equipoA.id, valor: 'empato' },
      { id: 'b', texto: `Gana ${equipoB.nombre}`, color: equipoB.color_hex, equipo: equipoB.id, valor: 'gano' },
    ];
    const elegida = opciones.find((o) => o.id === eleccion);

    cuerpo = (
      <div className="space-y-4 animate-fade-up">
        <TarjetaLlegadaEquipo
          titulo={llego ? 'En tu base' : 'Vienen los equipos'}
          equipos={[equipoA, equipoB]}
          alertando={alertando && !llego}
          detalle={
            llego
              ? 'Ya llegaron. Que compitan y califica el resultado.'
              : 'Van camino a tu base. Marca la llegada cuando los tengas enfrente.'
          }
        />

        {esperando > 0 && (
          <p className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
            Hay otra pareja esperando esta misma base. Atiende primero a la que llegó antes.
          </p>
        )}

        {!llego ? (
          <button
            type="button"
            disabled={ocupado || pausada}
            onClick={() => ejecutar(() => marcarLlegadaGymkana(partido.id))}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 text-lg font-black text-slate-900 shadow-lg transition-all duration-200 hover:scale-[1.01] active:scale-95 disabled:opacity-50"
          >
            {ocupado && <Loader2 className="animate-spin" size={20} />}
            Marcar Llegada
          </button>
        ) : (
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
                    style={{
                      borderColor: activa ? (o.color ?? '#ffffff') : 'rgba(255,255,255,0.12)',
                    }}
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
                  () => sellarResultadoGymkana(partido.id, elegida.equipo, elegida.valor),
                  () => setEleccion(null)
                )
              }
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 text-lg font-black text-slate-900 shadow-lg transition-all duration-200 hover:scale-[1.01] active:scale-95 disabled:opacity-50"
            >
              {ocupado && <Loader2 className="animate-spin" size={20} />}
              Guardar resultado
            </button>

            <button
              type="button"
              disabled={ocupado || pausada}
              onClick={() => ejecutar(() => deshacerLlegadaGymkana(partido.id))}
              className="mx-auto flex items-center gap-1.5 text-sm text-slate-400 underline underline-offset-2 transition-colors hover:text-white disabled:opacity-50"
            >
              <RotateCcw size={14} />
              Marqué la llegada por error
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {encabezado}
      {cuerpo}

      {terminados.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-400">Ya calificadas en esta base</h3>
          {terminados.map((p) => {
            const a = equipos.find((e) => e.id === p.equipo_a_id);
            const b = equipos.find((e) => e.id === p.equipo_b_id);
            const texto =
              p.resultado_a === 'empato'
                ? 'Empate'
                : `Ganó ${p.resultado_a === 'gano' ? a?.nombre : b?.nombre}`;
            return (
              <div key={p.id} className="glass-row flex items-center justify-between gap-3 px-4 py-3">
                <span className="min-w-0 text-sm text-slate-200">
                  <span style={{ color: a?.color_hex }}>{a?.nombre}</span> vs{' '}
                  <span style={{ color: b?.color_hex }}>{b?.nombre}</span>
                  <span className="block text-xs text-slate-400">{texto}</span>
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
                        return { ok: true, mensaje: 'Alerta enviada al Admin' };
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
