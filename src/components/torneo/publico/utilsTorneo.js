export const EMOJI_TIPO = { gol: '⚽', amarilla: '🟨', roja: '🟥' };

/**
 * Los goles que le cuentan a un equipo en un partido. Un autogol lo
 * comete un jugador de un equipo, pero se le suma al rival.
 */
export function golesDeEquipo(partido, equipoId, eventos) {
  const rival = equipoId === partido.equipo_a_id ? partido.equipo_b_id : partido.equipo_a_id;
  return eventos.filter(
    (e) =>
      e.partido_id === partido.id &&
      e.tipo === 'gol' &&
      ((!e.autogol && e.equipo_torneo_id === equipoId) ||
        (e.autogol && e.equipo_torneo_id === rival))
  );
}

/**
 * Junta los goles de un mismo jugador en una sola línea:
 * "Pedro 12' 30'" en vez de dos renglones.
 */
export function anotadoresAgrupados(goles) {
  const grupos = new Map();
  goles.forEach((g) => {
    const clave = `${g.jugador_id ?? g.jugador_nombre ?? 'sin-nombre'}-${g.autogol ? 'ag' : 'g'}`;
    if (!grupos.has(clave)) {
      grupos.set(clave, {
        clave,
        nombre: g.jugador_nombre ?? 'Gol',
        autogol: g.autogol,
        minutos: [],
      });
    }
    grupos.get(clave).minutos.push(g.minuto);
  });
  return [...grupos.values()];
}
