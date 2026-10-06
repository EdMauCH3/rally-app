import { useEffect, useRef, useState } from 'react';

/**
 * Aviso de llegada para el juez de una estación. Recibe las claves (ids) de lo
 * que "viene en camino" a su estación. Cuando aparece una clave NUEVA (el sistema
 * acaba de mandar un equipo) hace sonar el pitazo, vibra y activa `alertando`
 * durante unos segundos para que la pantalla parpadee.
 *
 * `listo`: false mientras los datos todavía no han cargado (así la primera carga no cuenta
 * como "llegó alguien nuevo").
 *
 * La primera lectura NO alerta: si el juez abre la pantalla y ya viene un equipo,
 * lo ve en la tarjeta sin sobresalto. Con `silenciada` (actividad pausada) tampoco
 * suena, pero igual recuerda lo que vio para no avisar de golpe al reanudar.
 *
 * Los navegadores solo dejan sonar audio tras un toque del usuario; el juez ya
 * tocó la pantalla para elegir su estación, así que el pitazo suena.
 */
export function useAlertaLlegada(claves, { silenciada = false, listo = true, duracionMs = 6000 } = {}) {
  const [alertando, setAlertando] = useState(false);
  const vistas = useRef(null); // null = aún no se ha leído nada
  const temporizador = useRef(null);
  const audio = useRef(null);

  const huella = claves.slice().sort().join('|');

  useEffect(() => {
    if (!listo) return;
    const actuales = new Set(claves);

    if (vistas.current === null) {
      vistas.current = actuales;
      return;
    }

    const hayNueva = [...actuales].some((c) => !vistas.current.has(c));
    vistas.current = actuales;

    if (!hayNueva || silenciada) return;

    try {
      if (!audio.current) audio.current = new Audio('/pitazo.mp3');
      audio.current.currentTime = 0;
      audio.current.play().catch(() => {});
    } catch {
      // Sin audio disponible: la alerta visual igual funciona.
    }
    try {
      navigator.vibrate?.([300, 150, 300]);
    } catch {
      // Sin vibración.
    }

    setAlertando(true);
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => setAlertando(false), duracionMs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [huella, silenciada, listo]);

  useEffect(() => () => clearTimeout(temporizador.current), []);

  return { alertando, silenciar: () => setAlertando(false) };
}
