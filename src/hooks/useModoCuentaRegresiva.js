import { useCallback, useEffect, useState } from 'react';
import {
  obtenerConfiguracionApp,
  suscribirseConfiguracionApp,
} from '../services/configuracionAppService';

/**
 * Lee configuracion_app.modo_cuenta_regresiva y se mantiene actualizado
 * por Realtime: si el Admin lo enciende o apaga, la pantalla de quien ya
 * tenga la página abierta cambia sola.
 *
 * `cargando` solo es true hasta la PRIMERA lectura; las actualizaciones
 * posteriores no lo vuelven a encender (para no parpadear).
 *
 * Si la lectura falla se asume "apagado": un error de red no debe dejar
 * toda la app bloqueada por accidente.
 */
export function useModoCuentaRegresiva() {
  const [activo, setActivo] = useState(false);
  const [cargando, setCargando] = useState(true);

  const recargar = useCallback(() => {
    obtenerConfiguracionApp()
      .then((config) => setActivo(Boolean(config.modo_cuenta_regresiva)))
      .catch(() => setActivo(false))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    recargar();
    const unsubscribe = suscribirseConfiguracionApp(recargar);
    return unsubscribe;
  }, [recargar]);

  return { activo, cargando };
}
