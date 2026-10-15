/**
 * Lógica pura del circuito sincronizado de la Gymkana (sin red, fácil de probar).
 * Todo se DERIVA de la fila del circuito y de los cruces; no hay otro estado.
 */

export const TOTAL_BASES = 6;
export const NUMEROS_BASES = [1, 2, 3, 4, 5, 6];

const GRIS = '#94a3b8';

/** Texto ISO de Postgres (microsegundos) -> milisegundos, también en Safari. */
export function parseISO(texto) {
  if (!texto) return null;
  const ms = Date.parse(String(texto).replace(/(\.\d{3})\d+/, '$1'));
  return Number.isNaN(ms) ? null : ms;
}

/** Instante exacto (ISO) en que termina la ronda: inicio + duración. */
export function finDeRonda(circuito) {
  const inicio = parseISO(circuito?.inicio_rotacion_at);
  if (inicio === null || circuito?.estado !== 'en_curso') return null;
  return new Date(inicio + (circuito.duracion_minutos ?? 20) * 60000).toISOString();
}

/** "Base 3 - Fuente Principal" (el nombre es opcional mientras no esté configurado). */
export function tituloBase(numero, info) {
  const nombre = info?.nombre?.trim();
  return nombre ? `Base ${numero} - ${nombre}` : `Base ${numero}`;
}

export function equipoVisual(equipos, id) {
  return equipos.find((e) => e.id === id) ?? { id, nombre: 'Equipo', color_hex: GRIS };
}

export const crucesDeRonda = (cruces, ronda) => cruces.filter((c) => c.ronda === ronda);

export const crucesDeEquipo = (cruces, equipoId) =>
  cruces
    .filter((c) => c.equipo_a_id === equipoId || c.equipo_b_id === equipoId)
    .sort((x, y) => x.ronda - y.ronda);

/** Bases (números distintos) a las que ya se mandó a un equipo. */
export function basesDeEquipo(cruces, equipoId) {
  return new Set(crucesDeEquipo(cruces, equipoId).map((c) => Number(c.base_id)));
}

/** ¿Todos los sub-equipos ya tienen sus 6 bases asignadas? (no se pueden crear más rondas) */
export function todasLasBasesAsignadas(equipos, cruces) {
  return equipos.length > 0 && equipos.every((e) => basesDeEquipo(cruces, e.id).size >= TOTAL_BASES);
}

/** La ronda en curso es la final (declarada, o porque ya no queda ninguna base por asignar). */
export function esRondaFinal(circuito, equipos, cruces) {
  if (circuito.estado === 'completado') return false;
  return circuito.estado === 'en_curso' && (circuito.ultima_base || todasLasBasesAsignadas(equipos, cruces));
}

/** ¿Se puede autorizar otra rotación? */
export function puedeRotar(circuito, equipos, cruces) {
  if (circuito.estado === 'completado') return false;
  if (circuito.estado === 'en_curso' && circuito.ultima_base) return false;
  return !todasLasBasesAsignadas(equipos, cruces);
}

/** El cruce de un equipo en la ronda en curso (o null). */
export function crucePropio(circuito, cruces, equipoId) {
  return (
    crucesDeRonda(cruces, circuito.ronda_actual).find(
      (c) => c.equipo_a_id === equipoId || c.equipo_b_id === equipoId
    ) ?? null
  );
}

/** Una fila por sub-equipo: dónde está ahora y cómo va. */
export function radarCircuito(circuito, equipos, cruces) {
  return equipos.map((e) => {
    const mio = crucePropio(circuito, cruces, e.id);
    const completadas = crucesDeEquipo(cruces, e.id).filter((c) => c.finalizado).length;
    let estado = 'esperando';
    if (circuito.estado === 'completado' || completadas >= TOTAL_BASES) estado = 'termino';
    else if (mio) estado = mio.finalizado ? 'listo' : 'compitiendo';
    const rivalId = mio ? (mio.equipo_a_id === e.id ? mio.equipo_b_id : mio.equipo_a_id) : null;
    return {
      equipo: e,
      rival: rivalId ? equipoVisual(equipos, rivalId) : null,
      estado,
      destino: mio ? Number(mio.base_id) : null,
      completadas,
      total: TOTAL_BASES,
    };
  });
}

/** Estado de cada base en la ronda en curso: libre | compitiendo | calificada. */
export function ocupacionBasesCircuito(circuito, equipos, cruces) {
  const ronda = crucesDeRonda(cruces, circuito.ronda_actual);
  return NUMEROS_BASES.map((n) => {
    const cruce = ronda.find((c) => Number(c.base_id) === n) ?? null;
    let estado = 'libre';
    if (cruce) estado = cruce.finalizado ? 'calificada' : 'compitiendo';
    const visitas = cruces.filter((c) => Number(c.base_id) === n && c.finalizado).length;
    return {
      numero: n,
      estado,
      cruce,
      equipos: cruce ? [equipoVisual(equipos, cruce.equipo_a_id), equipoVisual(equipos, cruce.equipo_b_id)] : [],
      visitas,
    };
  });
}

/** Puntos de Gymkana de un equipo: 1 por jugar + 3 ganar / 1 empatar. */
export function puntosGymkana(cruces, equipoId) {
  return cruces.reduce((total, c) => {
    if (!c.finalizado) return total;
    const lado = c.equipo_a_id === equipoId ? 'a' : c.equipo_b_id === equipoId ? 'b' : null;
    if (!lado) return total;
    const r = lado === 'a' ? c.resultado_a : c.resultado_b;
    return total + 1 + (r === 'gano' ? 3 : r === 'empato' ? 1 : 0);
  }, 0);
}
