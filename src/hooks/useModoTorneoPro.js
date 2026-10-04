import { useCallback, useEffect, useState } from 'react';
import {
  obtenerConfiguracionApp,
  suscribirseConfiguracionApp,
} from '../services/configuracionAppService';

/**
 * Lee configuracion_app.torneo_modo_pro y se mantiene actualizado por
 * Realtime. Lo usan el Admin, el panel del arbitro y la vista publica,
 * para que todos cambien de modo a la vez cuando el Admin mueve el switch.
 *
 * Si falla la lectura, se asume "apagado" (sistema basico): es el modo
 * que siempre funciona.
 */
export function useModoTorneoPro() {
  const [modoPro, setModoPro] = useState(false);
  const [cargando, setCargando] = useState(true);

  const recargar = useCallback(() => {
    obtenerConfiguracionApp()
      .then((config) => setModoPro(Boolean(config.torneo_modo_pro)))
      .catch(() => setModoPro(false))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    recargar();
    const unsubscribe = suscribirseConfiguracionApp(recargar);
    return unsubscribe;
  }, [recargar]);

  return { modoPro, setModoPro, cargando, recargar };
}
