import { useCallback, useEffect, useMemo, useState } from 'react';
import { Amphora, Loader2, RotateCcw } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAlertaLlegada } from '../../hooks/useAlertaLlegada';
import { useEstadoActividad } from '../../hooks/useEstadoActividades';
import { listarSubEquiposColorPorActividad } from '../../services/subEquiposColorService';
import {
  listarRutasTesoro,
  listarPuntuacionesTesoro,
  listarAsignacionesTesoro,
  marcarLlegadaTesoro,
  calificarBaseTesoro,
  deshacerLlegadaTesoro,
  suscribirseTesoroGlobal,
} from '../../services/tesoroService';
import { calcularEstacionTesoro, mapaEquipos } from '../../services/estacionesLogica';
import TarjetaLlegadaEquipo from '../estacion/TarjetaLlegadaEquipo';
import { EncabezadoEstacion, EstacionCerrada, EstacionEnEspera } from '../estacion/EstacionLayout';
import IconoCopaVino from './IconoCopaVino';

/**
 * Pantalla del juez FIJO de una Tinaja. El juez se queda en su tinaja: la
 * pantalla avisa cuando el sistema manda un equipo hacia ella, deja marcar la
 * llegada y calificar (1 a 3 copas de vino). Al guardar, el equipo sigue a su
 * siguiente tinaja disponible y esta queda libre para el próximo.
 */
export default function EstacionTesoro({ tinaja }) {
  const { showToast } = useToast();
  const { pausada } = useEstadoActividad('tesoro');

  const [equipos, setEquipos] = useState([]);
  const [datos, setDatos] = useState(null); // { rutas, puntuaciones, asignaciones }
  const [errorCarga, setErrorCarga] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [puntaje, setPuntaje] = useState(null);

  const cargar = useCallback(async () => {
    try {
      const [e, rutas, puntuaciones, asignaciones] = await Promise.all([
        listarSubEquiposColorPorActividad('tesoro'),
        listarRutasTesoro(),
        listarPuntuacionesTesoro(),
        listarAsignacionesTesoro(),
      ]);
      setEquipos(e);
      setDatos({ rutas, puntuaciones, asignaciones });
      setErrorCarga(false);
    } catch {
      setErrorCarga(true);
    }
  }, []);

  useEffect(() => {
    cargar();
    let temporizador;
    const refrescar = () => {
      clearTimeout(temporizador);
      temporizador = setTimeout(cargar, 250);
    };
    const cancelar = suscribirseTesoroGlobal(refrescar);
    const intervalo = setInterval(cargar, 30000);
    return () => {
      clearTimeout(temporizador);
      clearInterval(intervalo);
      cancelar();
    };
  }, [cargar]);

  const estacion = useMemo(
    () =>
      datos
        ? calcularEstacionTesoro(
            tinaja,
            datos.rutas,
            datos.puntuaciones,
            datos.asignaciones,
            mapaEquipos(equipos)
          )
        : null,
    [datos, equipos, tinaja]
  );

  const { alertando } = useAlertaLlegada(
    estacion?.estado === 'en_camino' && estacion.equipo ? [estacion.equipo.id] : [],
    { silenciada: pausada, listo: !!estacion }
  );

  // Si cambia el equipo de la estación, se olvida la nota que estaba elegida.
  const equipoId = estacion?.equipo?.id;
  useEffect(() => setPuntaje(null), [equipoId]);

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

  const encabezado = (
    <EncabezadoEstacion
      icono={Amphora}
      etiqueta="Tinaja"
      numero={tinaja}
      pasaron={estacion.pasaron}
      total={estacion.total}
      unidad="Equipos"
    />
  );

  if (estacion.estado === 'sin_iniciar') {
    return (
      <div className="space-y-4">
        {encabezado}
        <p className="glass-card p-5 text-center text-sm leading-relaxed text-slate-300">
          La Búsqueda del Tesoro todavía no ha iniciado. El Admin la inicia desde Animación →
          Búsqueda del Tesoro.
        </p>
      </div>
    );
  }

  let cuerpo;
  if (estacion.estado === 'cerrada') {
    cuerpo = <EstacionCerrada unidad="tinaja" />;
  } else if (estacion.estado === 'libre') {
    cuerpo = <EstacionEnEspera />;
  } else {
    const equipo = estacion.equipo;
    const llego = estacion.estado === 'en_tinaja';

    cuerpo = (
      <div className="space-y-4 animate-fade-up">
        <TarjetaLlegadaEquipo
          titulo={llego ? 'En tu tinaja' : 'Viene el equipo:'}
          equipos={[equipo]}
          alertando={alertando && !llego}
          detalle={
            llego
              ? 'Ya llegó. Califica cuánto vino se ganó.'
              : 'Va camino a tu tinaja. Marca la llegada cuando lo tengas enfrente.'
          }
        />

        {!llego ? (
          <button
            type="button"
            disabled={ocupado || pausada}
            onClick={() => ejecutar(() => marcarLlegadaTesoro(equipo.id, tinaja))}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 text-lg font-black text-rose-900 shadow-lg transition-all duration-200 hover:scale-[1.01] active:scale-95 disabled:opacity-50"
          >
            {ocupado && <Loader2 className="animate-spin" size={20} />}
            Marcar Llegada
          </button>
        ) : (
          <div className="space-y-3 rounded-3xl bg-gradient-to-br from-orange-600 to-rose-800 p-5 shadow-glow-lg">
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
              disabled={ocupado || pausada || puntaje == null}
              onClick={() =>
                ejecutar(
                  () => calificarBaseTesoro(equipo.id, tinaja, puntaje),
                  () => setPuntaje(null)
                )
              }
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 text-lg font-black text-rose-900 shadow-lg transition-all duration-200 hover:scale-[1.01] active:scale-95 disabled:opacity-50"
            >
              {ocupado && <Loader2 className="animate-spin" size={20} />}
              Guardar calificación
            </button>

            <button
              type="button"
              disabled={ocupado || pausada}
              onClick={() =>
                ejecutar(() => deshacerLlegadaTesoro(equipo.id, tinaja), () => setPuntaje(null))
              }
              className="mx-auto flex items-center gap-1.5 text-sm text-white/75 underline underline-offset-2 transition-colors hover:text-white disabled:opacity-50"
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
    </div>
  );
}
