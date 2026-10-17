import { useEffect, useState } from 'react';
import {
  listarEstadoActividades,
  suscribirseEstadoActividades,
} from '../services/estadoActividadesService';
import { programarRefresco } from '../services/refrescoInteligente';

/**
 * Estado de las tres actividades de la tarde, siempre al día por Realtime:
 *   { gymkana: { iniciada, pausada }, tesoro: {...}, torneo: {...} }
 * Mientras no se sabe (primera carga o error de red) `cargando` es true y los
 * valores son "no iniciada / no pausada": nunca se bloquea una pantalla por
 * no haber podido leer.
 *
 * UNA sola lectura, UN solo canal Realtime y UN solo repaso para toda la app,
 * por muchos componentes que usen este hook a la vez (antes cada uno consultaba
 * por su cuenta). El repaso de seguridad es cada ~3 min, solo con la pestaña visible.
 */
const oyentes = new Set();
let estadoActual = { estados: {}, cargando: true };
let detener = null;
let temporizador = null;

function notificar() {
  oyentes.forEach((fn) => fn(estadoActual));
}

function cargar() {
  listarEstadoActividades()
    .then((lista) => {
      estadoActual = {
        cargando: false,
        estados: Object.fromEntries(
          lista.map((e) => [
            e.actividad,
            { iniciada: !!e.iniciada, pausada: !!e.pausada, pausadaEn: e.pausada_en ?? null },
          ])
        ),
      };
      notificar();
    })
    .catch(() => {
      if (estadoActual.cargando) {
        estadoActual = { ...estadoActual, cargando: false };
        notificar();
      }
    });
}

function iniciar() {
  cargar();
  const cancelarRealtime = suscribirseEstadoActividades(() => {
    clearTimeout(temporizador);
    temporizador = setTimeout(cargar, 150); // la pausa debe llegar rápido
  });
  const cancelarRepaso = programarRefresco(cargar);
  detener = () => {
    clearTimeout(temporizador);
    cancelarRealtime();
    cancelarRepaso();
  };
}

export function useEstadoActividades() {
  const [estado, setEstado] = useState(estadoActual);

  useEffect(() => {
    oyentes.add(setEstado);
    if (oyentes.size === 1) iniciar();
    else setEstado(estadoActual);
    return () => {
      oyentes.delete(setEstado);
      if (oyentes.size === 0 && detener) {
        detener();
        detener = null;
        estadoActual = { estados: {}, cargando: true };
      }
    };
  }, []);

  return { estados: estado.estados, cargando: estado.cargando };
}

/** Lo mismo, para UNA actividad: { iniciada, pausada, cargando }. */
export function useEstadoActividad(actividad) {
  const { estados, cargando } = useEstadoActividades();
  const e = estados[actividad];
  return { iniciada: e?.iniciada ?? false, pausada: e?.pausada ?? false, cargando };
}
