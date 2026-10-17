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
import IconoGota from './IconoGota';
import { etiquetaTinaja, listarPistasTesoro } from '../../services/tesoroPistasService';
import { MapPin } from 'lucide-react';
import { programarRefresco } from '../../services/refrescoInteligente';

/**
 * Pantalla del juez FIJO de una Tinaja. El juez se queda en su tinaja: la
 * pantalla avisa cuando el sistema manda un equipo hacia ella, deja marcar la
 * llegada y calificar (1 a 3 gotas). Al guardar, el equipo sigue a su
 * siguiente tinaja disponible y esta queda libre para el próximo.
 */
export default function EstacionTesoro({ tinaja }) {
  const { showToast } = useToast();
  const { pausada } = useEstadoActividad('tesoro');

  const [equipos, setEquipos] = useState([]);
  const [datos, setDatos] = useState(null); // { rutas, puntuaciones, asignaciones }
  const [ficha, setFicha] = useState({ nombre: '', pista: '' }); // nombre y pista de ESTA tinaja
  const [errorCarga, setErrorCarga] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [puntaje, setPuntaje] = useState(null);

  const cargar = useCallback(async () => {
    try {
      const [e, rutas, puntuaciones, asignaciones, tinajas] = await Promise.all([
        listarSubEquiposColorPorActividad('tesoro'),
        listarRutasTesoro(),
        listarPuntuacionesTesoro(),
        listarAsignacionesTesoro(),
        // Si aún no se corrió el SQL 42, la estación sigue funcionando sin nombre.
        listarPistasTesoro().catch(() => []),
      ]);
      const mia = tinajas.find((t) => t.numero === tinaja);
      setFicha({ nombre: mia?.nombre?.trim() ?? '', pista: mia?.pista?.trim() ?? '' });
      setEquipos(e);
      setDatos({ rutas, puntuaciones, asignaciones });
      setErrorCarga(false);
    } catch {
      setErrorCarga(true);
    }
  }, [tinaja]);

  useEffect(() => {
    cargar();
    let temporizador;
    const refrescar = () => {
      clearTimeout(temporizador);
      temporizador = setTimeout(cargar, 600);
    };
    const cancelar = suscribirseTesoroGlobal(refrescar);
    const detenerRepaso = programarRefresco(cargar);
    return () => {
      clearTimeout(temporizador);
      detenerRepaso();
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
      lugar={ficha.nombre || undefined}
      pasaron={estacion.pasaron}
      total={estacion.total}
      unidad="Equipos"
    />
  );

  // Destino de ESTA estación: nombre completo + la pista que guía a los equipos hasta aquí.
  const tarjetaDestino = (
    <div className="space-y-2 rounded-2xl border border-cyan-400/30 bg-cyan-500/[0.08] p-4">
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-cyan-200">
        <MapPin size={13} /> Destino
      </p>
      <p className="break-words text-xl font-black leading-tight text-white">
        Destino: {ficha.nombre || `Tinaja ${tinaja}`}
      </p>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Pista activa</p>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-100">
        {ficha.pista || 'Esta tinaja aún no tiene pista escrita.'}
      </p>
      <span className="sr-only">{etiquetaTinaja(tinaja, ficha.nombre)}</span>
    </div>
  );

  if (estacion.estado === 'sin_iniciar') {
    return (
      <div className="space-y-4">
        {encabezado}
        {tarjetaDestino}
        <p className="glass-card p-5 text-center text-sm leading-relaxed text-slate-300">
          Las Tinajas Perdidas todavía no han iniciado. El Admin las inicia desde Animación →
          Las Tinajas Perdidas.
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
              ? 'Ya llegó. Califica cuántas gotas se ganó.'
              : 'Va camino a tu tinaja. Marca la llegada cuando lo tengas enfrente.'
          }
        />

        {!llego ? (
          <button
            type="button"
            disabled={ocupado || pausada}
            onClick={() => ejecutar(() => marcarLlegadaTesoro(equipo.id, tinaja))}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 text-lg font-black text-sky-900 shadow-lg transition-all duration-200 hover:scale-[1.01] active:scale-95 disabled:opacity-50"
          >
            {ocupado && <Loader2 className="animate-spin" size={20} />}
            Marcar Llegada
          </button>
        ) : (
          <div className="space-y-3 rounded-3xl bg-gradient-to-br from-sky-600 to-blue-800 p-5 shadow-glow-lg">
            <div>
              <p className="text-sm font-bold text-white">¿Cuántas gotas se ganaron?</p>
              <p className="text-xs text-white/75">
                Llegar ya sumó 1 gota. La calificación suma de 1 a 3 gotas más.
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
                      ? 'border-white bg-white text-sky-900 shadow-lg'
                      : 'border-white/30 bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <span className="flex gap-0.5">
                    {Array.from({ length: n }, (_, i) => (
                      <IconoGota
                        key={i}
                        size={18}
                        className={puntaje === n ? 'text-blue-600' : 'text-cyan-200'}
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
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 text-lg font-black text-sky-900 shadow-lg transition-all duration-200 hover:scale-[1.01] active:scale-95 disabled:opacity-50"
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
      {tarjetaDestino}
      {cuerpo}
    </div>
  );
}
