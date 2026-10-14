import { useEffect, useState } from 'react';
import { listarCanchas, suscribirseCanchas } from '../services/canchasService';
import { registrarCanchas } from '../services/torneoLogica';

// Caché compartida: todos los componentes ven la misma lista y se carga una sola vez.
let lista = null;
let cargando = null;
const oyentes = new Set();
let cancelarRealtime = null;

function avisar() {
  oyentes.forEach((fn) => fn());
}

async function cargar() {
  try {
    lista = await listarCanchas();
    registrarCanchas(lista);
    avisar();
  } catch {
    // Sin conexión o SQL 46 pendiente: se usan los nombres por defecto.
  }
}

/**
 * Lugares de juego del torneo, en vivo.
 * Devuelve { canchas (todas), activas, porId (id → cancha), recargar }.
 */
export function useCanchas() {
  const [, setVersion] = useState(0);

  useEffect(() => {
    const oyente = () => setVersion((v) => v + 1);
    oyentes.add(oyente);
    if (!cargando) cargando = cargar();
    if (!cancelarRealtime) {
      let t;
      cancelarRealtime = suscribirseCanchas(() => {
        clearTimeout(t);
        t = setTimeout(cargar, 200);
      });
    }
    return () => {
      oyentes.delete(oyente);
      if (oyentes.size === 0 && cancelarRealtime) {
        cancelarRealtime();
        cancelarRealtime = null;
        cargando = null;
      }
    };
  }, []);

  const todas = lista ?? [];
  return {
    canchas: todas,
    activas: todas.filter((c) => c.activa),
    porId: new Map(todas.map((c) => [c.id, c])),
    recargar: cargar,
  };
}
