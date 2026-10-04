import { useEffect, useRef, useState } from 'react';

export function formatoMMSS(totalSegundos) {
  const total = Math.max(0, Math.floor(totalSegundos));
  const m = Math.floor(total / 60)
    .toString()
    .padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/**
 * Reloj del partido SIN consultar al servidor cada segundo.
 *
 * El servidor solo guarda dos cosas: segundos_acumulados y
 * reloj_inicio_en (null = detenido). Aquí se calcula:
 *   transcurrido = acumulados + (ahora - inicio)   si está corriendo
 * Como el celular del árbitro puede tener la hora mal puesta, se corrige
 * con servidor_ahora (la hora del servidor al momento de la consulta).
 *
 * Si el árbitro recarga o vuelve a entrar, el cálculo da el mismo minuto
 * real del partido.
 *
 * `onTiempoCumplido` se llama UNA vez, solo si se ve cruzar la duración
 * programada en vivo. Si el árbitro entra cuando el tiempo ya estaba
 * vencido, NO se dispara (no queremos un pitazo por algo que ya pasó).
 */
export function useRelojPartido(partido, onTiempoCumplido) {
  const [segundos, setSegundos] = useState(0);
  const callbackRef = useRef(onTiempoCumplido);

  useEffect(() => {
    callbackRef.current = onTiempoCumplido;
  }, [onTiempoCumplido]);

  const corriendo = Boolean(partido?.reloj_inicio_en) && !partido?.finalizado;
  const duracion = partido?.duracion_segundos ?? 0;

  useEffect(() => {
    if (!partido) return undefined;

    const desfaseMs = partido.servidor_ahora
      ? Date.parse(partido.servidor_ahora) - Date.now()
      : 0;
    const inicioMs = partido.reloj_inicio_en ? Date.parse(partido.reloj_inicio_en) : null;
    const enMarcha = inicioMs !== null && !partido.finalizado;

    let yaAvisado = null; // null = todavía no evaluado

    function evaluar() {
      let s = partido.segundos_acumulados;
      if (enMarcha) {
        s += Math.max(0, Math.floor((Date.now() + desfaseMs - inicioMs) / 1000));
      }
      setSegundos(s);

      const cumplido = s >= partido.duracion_segundos;
      if (yaAvisado === null) {
        yaAvisado = cumplido; // primera lectura: no avisar por algo ya vencido
        return;
      }
      if (cumplido && !yaAvisado && enMarcha) {
        yaAvisado = true;
        callbackRef.current?.();
      }
      if (!cumplido) yaAvisado = false; // se alargó el tiempo o se rebobinó
    }

    evaluar();
    if (!enMarcha) return undefined;
    const id = setInterval(evaluar, 250);
    return () => clearInterval(id);
  }, [partido]);

  return {
    segundos,
    corriendo,
    duracion,
    restante: duracion - segundos,
    agotado: partido ? segundos >= duracion : false,
  };
}
