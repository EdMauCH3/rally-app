import { useCallback, useEffect, useRef, useState } from 'react';
import {
  obtenerConfiguracion,
  listarBases,
  listarEquipos,
  suscribirseColores,
} from '../services/coloresService';
import { programarRefresco } from '../services/refrescoInteligente';
import { obtenerDesfaseConServidor } from '../services/horaServidorService';

/**
 * Estado EN VIVO de la Rotación de la Mañana (lo que Formación muestra).
 * Devuelve { config, bases, equipos, cargando, error, desfaseMs }.
 *
 * Se actualiza por Realtime y, como red de seguridad, relee cada 20 s por si
 * se perdió un aviso (señal débil en el patio). `desfaseMs` corrige el reloj
 * del dispositivo para que la cuenta regresiva coincida con la del servidor.
 */
export function useRotacionFormacion() {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(false);
  const [desfaseMs, setDesfaseMs] = useState(0);
  const montado = useRef(true);

  const cargar = useCallback(async () => {
    try {
      const [config, bases, equipos] = await Promise.all([
        obtenerConfiguracion(),
        listarBases(),
        listarEquipos(),
      ]);
      if (!montado.current) return;
      setDatos({ config, bases, equipos });
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
      temporizador = setTimeout(cargar, 600);
    };
    const cancelar = suscribirseColores(refrescar);
    const detenerRepaso = programarRefresco(cargar);

    obtenerDesfaseConServidor()
      .then((d) => montado.current && setDesfaseMs(d))
      .catch(() => {});

    return () => {
      montado.current = false;
      clearTimeout(temporizador);
      detenerRepaso();
      cancelar();
    };
  }, [cargar]);

  return {
    config: datos?.config ?? null,
    bases: datos?.bases ?? [],
    equipos: datos?.equipos ?? [],
    cargando: datos === null && !error,
    error: error && datos === null,
    desfaseMs,
  };
}

/** Milisegundos que faltan para `tiempoFin`, corregidos con la hora del servidor. */
export function useRestanteMs(tiempoFin, desfaseMs = 0) {
  const [restante, setRestante] = useState(0);

  useEffect(() => {
    function tick() {
      if (!tiempoFin) {
        setRestante(0);
        return;
      }
      setRestante(Math.max(0, new Date(tiempoFin).getTime() - (Date.now() + desfaseMs)));
    }
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [tiempoFin, desfaseMs]);

  return restante;
}

/** Milisegundos que lleva atrasado el cambio de base (0 si todavía hay tiempo). */
export function useAtrasoMs(tiempoFin, desfaseMs = 0) {
  const [atraso, setAtraso] = useState(0);

  useEffect(() => {
    function tick() {
      if (!tiempoFin) {
        setAtraso(0);
        return;
      }
      setAtraso(Math.max(0, Date.now() + desfaseMs - new Date(tiempoFin).getTime()));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [tiempoFin, desfaseMs]);

  return atraso;
}

export function formatoMMSS(ms) {
  const total = Math.ceil(ms / 1000);
  const m = String(Math.floor(total / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${m}:${s}`;
}

/**
 * Fase de la rotación en este instante, con la hora del servidor.
 *   'desplazamiento' -> los grupos caminan a su nueva base (cuenta de 2:00)
 *   'formacion'      -> trabajo temático en la base (cuenta hasta tiempo_fin)
 * Devuelve { fase, desplazamientoMs, formacionMs } (ms que faltan de cada una).
 * Pasa de una fase a la otra sola, sin que nadie pulse nada.
 */
export function useFaseRotacion(config, desfaseMs = 0) {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    setAhora(Date.now());
    const id = setInterval(() => setAhora(Date.now()), 500);
    return () => clearInterval(id);
  }, [config?.desplazamiento_fin, config?.tiempo_fin]);
  return calcularFaseRotacion(config, ahora + desfaseMs);
}

/** Versión pura (sin React) de useFaseRotacion; `ahoraMs` = hora del servidor en ms. */
export function calcularFaseRotacion(config, ahoraMs) {
  const finDesp = config?.desplazamiento_fin ? Date.parse(config.desplazamiento_fin) : 0;
  const finForm = config?.tiempo_fin ? Date.parse(config.tiempo_fin) : 0;
  const desplazamientoMs = Math.max(0, finDesp - ahoraMs);
  const formacionMs = Math.max(0, finForm - ahoraMs);
  return {
    fase: desplazamientoMs > 0 ? 'desplazamiento' : 'formacion',
    desplazamientoMs,
    formacionMs,
  };
}
