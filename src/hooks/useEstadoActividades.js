import { useCallback, useEffect, useState } from 'react';
import {
  listarEstadoActividades,
  suscribirseEstadoActividades,
} from '../services/estadoActividadesService';

/**
 * Estado de las tres actividades de la tarde, siempre al día por Realtime:
 *   { gymkana: { iniciada, pausada }, tesoro: {...}, torneo: {...} }
 * Mientras no se sabe (primera carga o error de red) `cargando` es true y los
 * valores son "no iniciada / no pausada": nunca se bloquea una pantalla por
 * no haber podido leer.
 *
 * Además de Realtime, repasa cada 20 s: si el celular perdió la conexión un
 * momento, la pausa (o la reanudación) igual llega sin recargar el navegador.
 */
export function useEstadoActividades() {
  const [estados, setEstados] = useState({});
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(() => {
    listarEstadoActividades()
      .then((lista) => {
        setEstados(
          Object.fromEntries(
            lista.map((e) => [
              e.actividad,
              { iniciada: !!e.iniciada, pausada: !!e.pausada, pausadaEn: e.pausada_en ?? null },
            ])
          )
        );
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    cargar();
    const unsubscribe = suscribirseEstadoActividades(cargar);
    const intervalo = setInterval(cargar, 20000);
    return () => {
      unsubscribe();
      clearInterval(intervalo);
    };
  }, [cargar]);

  return { estados, cargando };
}

/** Lo mismo, para UNA actividad: { iniciada, pausada, cargando }. */
export function useEstadoActividad(actividad) {
  const { estados, cargando } = useEstadoActividades();
  const e = estados[actividad];
  return { iniciada: e?.iniciada ?? false, pausada: e?.pausada ?? false, cargando };
}
