import { useEffect, useRef, useState } from 'react';
import { obtenerDesfaseConServidor } from '../services/horaServidorService';

const RESINCRONIZAR_CADA_MS = 5 * 60 * 1000;
const ESPERA_MAXIMA_MS = 2000;

/**
 * Segundos que faltan para `objetivoMs` (un instante absoluto), medidos
 * con la hora del SERVIDOR y no con la del dispositivo.
 *
 * - `sincronizado` es false hasta tener la hora del servidor (máximo 2 s;
 *   si tarda más o falla, se usa el reloj del dispositivo). Así no se
 *   muestran números que luego pegan un salto al corregirse.
 * - Se resincroniza cada 5 minutos y al volver a la pestaña, porque el
 *   reloj del dispositivo puede cambiar o el navegador congelar la pestaña.
 * - Se calcula siempre contra el instante absoluto (no restando 1 cada
 *   segundo), así que nunca se desfasa aunque el navegador pause el
 *   temporizador de una pestaña en segundo plano.
 */
export function useCuentaRegresiva(objetivoMs) {
  const [segundos, setSegundos] = useState(0);
  const [sincronizado, setSincronizado] = useState(false);
  const desfaseRef = useRef(0);

  useEffect(() => {
    let activo = true;

    async function sincronizar() {
      try {
        const desfase = await obtenerDesfaseConServidor();
        if (activo) desfaseRef.current = desfase;
      } catch {
        // Sin hora del servidor: se sigue con el reloj del dispositivo.
      } finally {
        if (activo) setSincronizado(true);
      }
    }

    function calcular() {
      const restanteMs = objetivoMs - (Date.now() + desfaseRef.current);
      // ceil: con 0,4 s por delante todavía se muestra 1; el 0 llega al instante exacto.
      setSegundos(Math.max(0, Math.ceil(restanteMs / 1000)));
    }

    function alVolver() {
      if (document.visibilityState === 'visible') {
        sincronizar();
        calcular();
      }
    }

    sincronizar();
    calcular();
    const esperaMaxima = setTimeout(() => {
      if (activo) setSincronizado(true);
    }, ESPERA_MAXIMA_MS);
    const tick = setInterval(calcular, 250); // si el valor no cambia, React no vuelve a pintar
    const resincronizar = setInterval(sincronizar, RESINCRONIZAR_CADA_MS);
    document.addEventListener('visibilitychange', alVolver);

    return () => {
      activo = false;
      clearTimeout(esperaMaxima);
      clearInterval(tick);
      clearInterval(resincronizar);
      document.removeEventListener('visibilitychange', alVolver);
    };
  }, [objetivoMs]);

  return { segundos, sincronizado };
}
