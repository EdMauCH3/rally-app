import { useCallback, useEffect, useRef, useState } from 'react';
import {
  listarPartidosFases,
  listarTablasTorneo,
  listarRosterTorneo,
  listarMacrosTorneo,
  listarEtapasTorneo,
  suscribirseRosterTorneo,
  suscribirseEtapas,
} from '../services/torneoService';
import {
  suscribirseTorneoPro,
  listarEventosTorneo,
  listarEstadoJugadores,
  listarPenalesTorneo,
} from '../services/torneoProService';
import { programarRefresco } from '../services/refrescoInteligente';
import { obtenerDesfaseConServidor } from '../services/horaServidorService';

/**
 * Estado EN VIVO del torneo por fases: partidos, tablas, equipos y macros.
 * Devuelve { partidos, borradores, tablas, equipos, macros, etapas, eventos, jugadores, penales (estos tres solo con `detalle`), cargando, error, desfaseMs, recargar }.
 *
 * `partidos` son SOLO los confirmados; la vista previa (borrador) que arma el Admin o el
 * Director Técnico llega aparte en `borradores` (la base de datos no se los muestra al público).
 *
 * Se actualiza por Realtime (goles, tarjetas, penales, partidos, equipos) y,
 * como red de seguridad, repasa cada ~3 min (solo con la pestaña visible). Cada aviso relee solo lo que cambió.
 * `desfaseMs` corrige el reloj del dispositivo con el del servidor.
 */
export function useTorneoFases({ detalle = false } = {}) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(false);
  const [desfaseMs, setDesfaseMs] = useState(0);
  const montado = useRef(true);

  // Cada grupo de datos se lee solo cuando cambió. Lo que casi no cambia (equipos,
  // macros, etapas) no se vuelve a pedir con cada gol: solo con su propio aviso o en el repaso.
  const LECTORES = {
    partidos: () => Promise.all([listarPartidosFases(), listarTablasTorneo()]).then(([todos, tablas]) => ({ todos, tablas })),
    roster: () => Promise.all([listarRosterTorneo(), listarMacrosTorneo()]).then(([equipos, macros]) => ({ equipos, macros })),
    etapas: () => listarEtapasTorneo().catch(() => []).then((etapas) => ({ etapas })),
    detalle: () =>
      Promise.all([listarEventosTorneo(), listarEstadoJugadores(), listarPenalesTorneo()]).then(
        ([eventos, jugadores, penales]) => ({ eventos, jugadores, penales })
      ),
  };

  const cargar = useCallback(
    async (grupos = ['partidos', 'roster', 'etapas', 'detalle']) => {
      try {
        const lista = grupos.filter((g) => g !== 'detalle' || detalle);
        const partes = await Promise.all(lista.map((g) => LECTORES[g]()));
        if (!montado.current) return;
        const nuevo = Object.assign({}, ...partes);
        setDatos((prev) => {
          const base = prev ?? { partidos: [], borradores: [], tablas: [], equipos: [], macros: [], etapas: [], eventos: [], jugadores: [], penales: [] };
          const sig = { ...base, ...nuevo };
          if (nuevo.todos) {
            sig.partidos = nuevo.todos.filter((p) => !p.borrador);
            sig.borradores = nuevo.todos.filter((p) => p.borrador);
            delete sig.todos;
          }
          return sig;
        });
        setError(false);
      } catch {
        if (montado.current) setError(true);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [detalle]
  );

  useEffect(() => {
    montado.current = true;
    cargar();

    // Los avisos se juntan 600 ms y solo se relee lo que cambió.
    let temporizador;
    const pendientes = new Set();
    const refrescar = (payload) => {
      const t = payload?.table;
      if (t === 'equipos_torneo' || t === 'macro_equipos') pendientes.add('roster').add('partidos');
      else if (t === 'torneo_etapas') pendientes.add('etapas').add('partidos');
      else if (t === 'partidos_torneo') pendientes.add('partidos');
      else if (t) pendientes.add('detalle').add('partidos');
      else ['partidos', 'roster', 'etapas', 'detalle'].forEach((g) => pendientes.add(g));
      clearTimeout(temporizador);
      temporizador = setTimeout(() => {
        const g = [...pendientes];
        pendientes.clear();
        cargar(g);
      }, 600);
    };
    const cancelar = [
      suscribirseTorneoPro(refrescar), // partidos, eventos, jugadores y penales
      suscribirseRosterTorneo(refrescar),
      suscribirseEtapas(refrescar),
    ];
    const detenerRepaso = programarRefresco(() => cargar());

    obtenerDesfaseConServidor()
      .then((d) => montado.current && setDesfaseMs(d))
      .catch(() => {});

    return () => {
      montado.current = false;
      clearTimeout(temporizador);
      detenerRepaso();
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
    recargar: () => cargar(),
  };
}
