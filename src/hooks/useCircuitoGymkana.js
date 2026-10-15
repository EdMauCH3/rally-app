import { useCallback, useEffect, useRef, useState } from 'react';
import { obtenerCircuito, listarCrucesGymkana, suscribirseCircuito } from '../services/gymkanaCircuitoService';
import { listarSubEquiposColorPorActividad } from '../services/subEquiposColorService';
import { obtenerDesfaseConServidor } from '../services/horaServidorService';

/**
 * Estado EN VIVO del circuito sincronizado de la Gymkana.
 * Devuelve { circuito, cruces, equipos, desfaseMs, cargando, error, recargar }.
 *
 * Cero consultas por segundo: la cuenta regresiva se calcula en el celular con
 * (inicio + duración) y la hora del servidor. Solo se vuelve a leer cuando llega
 * un aviso Realtime (el coordinador cambió de fase o alguien calificó), al volver
 * a la pestaña y, como red de seguridad ante una caída de señal, cada 90 s.
 */
export function useCircuitoGymkana() {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(false);
  const [desfaseMs, setDesfaseMs] = useState(0);
  const montado = useRef(true);

  const cargar = useCallback(async () => {
    try {
      const [circuito, cruces, equipos] = await Promise.all([
        obtenerCircuito(),
        listarCrucesGymkana(),
        listarSubEquiposColorPorActividad('gymkana'),
      ]);
      if (!montado.current) return;
      setDatos({ circuito, cruces, equipos });
      setError(false);
    } catch {
      if (montado.current) setError(true);
    }
  }, []);

  useEffect(() => {
    montado.current = true;
    cargar();

    let temporizador;
    const refrescar = () => {
      clearTimeout(temporizador);
      temporizador = setTimeout(cargar, 250);
    };
    const cancelar = suscribirseCircuito(refrescar);
    const intervalo = setInterval(cargar, 90000);
    const alVolver = () => document.visibilityState === 'visible' && cargar();
    document.addEventListener('visibilitychange', alVolver);

    obtenerDesfaseConServidor()
      .then((d) => montado.current && setDesfaseMs(d))
      .catch(() => {});

    return () => {
      montado.current = false;
      clearTimeout(temporizador);
      clearInterval(intervalo);
      document.removeEventListener('visibilitychange', alVolver);
      cancelar();
    };
  }, [cargar]);

  return {
    circuito: datos?.circuito ?? null,
    cruces: datos?.cruces ?? [],
    equipos: datos?.equipos ?? [],
    desfaseMs,
    cargando: datos === null && !error,
    error: error && datos === null,
    recargar: cargar,
  };
}
