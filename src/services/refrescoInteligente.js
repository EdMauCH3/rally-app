/**
 * Repaso de seguridad que NO malgasta peticiones.
 *
 * Realtime ya avisa de cada cambio; este repaso solo cubre una conexión caída.
 * Por eso:
 *  - No consulta mientras la pestaña está oculta (celular bloqueado o en segundo plano).
 *  - Al volver a verla, repasa una vez (si pasó un rato desde la última lectura).
 *  - Cada dispositivo usa un intervalo con variación aleatoria (±20 %), para que
 *    cientos de celulares no consulten todos en el mismo segundo.
 * Devuelve la función que lo detiene.
 */
export const REPASO_MS = 3 * 60 * 1000;

export function programarRefresco(fn, ms = REPASO_MS) {
  let temporizador;
  let detenido = false;
  let ultimo = Date.now();

  const ejecutar = () => {
    ultimo = Date.now();
    try {
      fn();
    } catch {
      /* el repaso nunca debe romper la pantalla */
    }
  };

  const agendar = () => {
    if (detenido) return;
    const espera = ms * (0.8 + Math.random() * 0.4);
    temporizador = setTimeout(() => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') ejecutar();
      agendar();
    }, espera);
  };

  const alVolver = () => {
    if (document.visibilityState === 'visible' && Date.now() - ultimo > ms / 2) ejecutar();
  };

  agendar();
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', alVolver);

  return () => {
    detenido = true;
    clearTimeout(temporizador);
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', alVolver);
  };
}
