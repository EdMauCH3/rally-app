import { useCallback, useEffect, useRef, useState } from 'react';
import {
  listarPartidosFases,
  listarTablasTorneo,
  listarRosterTorneo,
  listarMacrosTorneo,
  listarEtapasTorneo,
  suscribirsePartidos,
  suscribirseRosterTorneo,
  suscribirseEtapas,
} from '../services/torneoService';
import {
  suscribirseTorneoPro,
  listarEventosTorneo,
  listarEstadoJugadores,
  listarPenalesTorneo,
} from '../services/torneoProService';
import { obtenerDesfaseConServidor } from '../services/horaServidorService';

/**
 * Estado EN VIVO del torneo por fases: partidos, tablas, equipos y macros.
 * Devuelve { partidos, borradores, tablas, equipos, macros, etapas, eventos, jugadores, penales (estos tres solo con `detalle`), cargando, error, desfaseMs, recargar }.
 *
 * `partidos` son SOLO los confirmados; la vista previa (borrador) que arma el Admin o el
 * Director Técnico llega aparte en `borradores` (la base de datos no se los muestra al público).
 *
 * Se actualiza por Realtime (goles, tarjetas, penales, partidos, equipos) y,
 * como red de seguridad, relee cada 20 s por si se perdió un aviso.
 * `desfaseMs` corrige el reloj del dispositivo con el del servidor.
 */
export function useTorneoFases({ detalle = false } = {}) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(false);
  const [desfaseMs, setDesfaseMs] = useState(0);
  const montado = useRef(true);

  const cargar = useCallback(async () => {
    try {
      const [todos, tablas, equipos, macros, etapas, eventos, jugadores, penales] = await Promise.all([
        listarPartidosFases(),
        listarTablasTorneo(),
        listarRosterTorneo(),
        listarMacrosTorneo(),
        listarEtapasTorneo().catch(() => []),
        detalle ? listarEventosTorneo() : Promise.resolve([]),
        detalle ? listarEstadoJugadores() : Promise.resolve([]),
        detalle ? listarPenalesTorneo() : Promise.resolve([]),
      ]);
      if (!montado.current) return;
      setDatos({
        partidos: todos.filter((p) => !p.borrador),
        borradores: todos.filter((p) => p.borrador),
        tablas,
        equipos,
        macros,
        etapas,
        eventos,
        jugadores,
        penales,
      });
      setError(false);
    } catch {
      if (montado.current) setError(true);
    }
  }, [detalle]);

  useEffect(() => {
    montado.current = true;
    cargar();

    let temporizador;
    const refrescar = () => {
      clearTimeout(temporizador);
      temporizador = setTimeout(cargar, 250);
    };
    const cancelar = [
      suscribirsePartidos(refrescar),
      suscribirseTorneoPro(refrescar),
      suscribirseRosterTorneo(refrescar),
      suscribirseEtapas(refrescar),
    ];
    const intervalo = setInterval(cargar, 20000);

    obtenerDesfaseConServidor()
      .then((d) => montado.current && setDesfaseMs(d))
      .catch(() => {});

    return () => {
      montado.current = false;
      clearTimeout(temporizador);
      clearInterval(intervalo);
      cancelar.forEach((fn) => fn());
    };
  }, [cargar]);

  return {
    partidos: datos?.partidos ?? [],
    borradores: datos?.borradores ?? [],
    etapas: datos?.etapas ?? [],
    tablas: datos?.tablas ?? [],
    equipos: datos?.equipos ?? [],
    macros: datos?.macros ?? [],
    eventos: datos?.eventos ?? [],
    jugadores: datos?.jugadores ?? [],
    penales: datos?.penales ?? [],
    cargando: datos === null && !error,
    error: error && datos === null,
    desfaseMs,
    recargar: cargar,
  };
}
